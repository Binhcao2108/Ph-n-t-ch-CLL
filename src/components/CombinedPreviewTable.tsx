import React, { useState, useEffect, useRef } from 'react';
import { MergedRecord } from '../types';
import { Search, ChevronLeft, ChevronRight, FileX, ArrowRight, Eye, RefreshCw, Download } from 'lucide-react';
import { exportToExcel, calculateStatistics } from '../utils/excelProcessor';

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  valueCounts: Record<string, number>;
  allLabel: string;
  colorTheme?: 'slate' | 'emerald';
}

const Top10StaffTable = ({ data, theme }: { data: [string, number][], theme: 'slate' | 'emerald' }) => {
  if (data.length === 0) return <div className="text-[10px] italic text-slate-500 font-mono">Không có dữ liệu</div>;
  
  const half = Math.ceil(data.length / 2);
  const col1 = data.slice(0, 5);
  const col2 = data.slice(5, 10);
  
  const renderRow = ([name, count]: [string, number], index: number) => (
    <tr key={name} className={`border-b ${theme === 'slate' ? 'border-slate-200 hover:bg-slate-50' : 'border-emerald-100 hover:bg-emerald-50'} last:border-0`}>
       <td className={`p-1.5 text-center font-black ${theme === 'slate' ? 'text-slate-500 border-r border-slate-200' : 'text-emerald-600 border-r border-emerald-100'}`}>{index + 1}</td>
       <td className={`p-1.5 font-bold truncate max-w-[150px] sm:max-w-[180px] ${theme === 'slate' ? 'text-slate-800 border-r border-slate-200' : 'text-emerald-900 border-r border-emerald-100'}`} title={name}>{name || '(Trống)'}</td>
       <td className={`p-1.5 text-right font-black ${theme === 'slate' ? 'text-slate-900' : 'text-emerald-700'}`}>{count}</td>
    </tr>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div className={`overflow-hidden border ${theme === 'slate' ? 'border-slate-900' : 'border-emerald-800'}`}>
         <table className="w-full text-left border-collapse bg-white">
           <thead>
             <tr className={`text-[9px] uppercase tracking-widest font-black font-mono ${theme === 'slate' ? 'bg-slate-900 text-white' : 'bg-emerald-800 text-white'}`}>
                <th className="p-1.5 w-10 text-center border-r border-white/20">STT</th>
                <th className="p-1.5 border-r border-white/20">Tên Nhân Sự</th>
                <th className="p-1.5 w-16 text-right">SL</th>
             </tr>
           </thead>
           <tbody className="text-[10px] font-mono">
             {col1.map((item, idx) => renderRow(item, idx))}
           </tbody>
         </table>
       </div>
       {col2.length > 0 && (
         <div className={`overflow-hidden border ${theme === 'slate' ? 'border-slate-900' : 'border-emerald-800'}`}>
           <table className="w-full text-left border-collapse bg-white">
             <thead>
               <tr className={`text-[9px] uppercase tracking-widest font-black font-mono ${theme === 'slate' ? 'bg-slate-900 text-white' : 'bg-emerald-800 text-white'}`}>
                  <th className="p-1.5 w-10 text-center border-r border-white/20">STT</th>
                  <th className="p-1.5 border-r border-white/20">Tên Nhân Sự</th>
                  <th className="p-1.5 w-16 text-right">SL</th>
               </tr>
             </thead>
             <tbody className="text-[10px] font-mono">
               {col2.map((item, idx) => renderRow(item, idx + 5))}
             </tbody>
           </table>
         </div>
       )}
    </div>
  );
};

function MultiSelectDropdown({
  label,
  placeholder,
  searchPlaceholder,
  options,
  selectedValues,
  onChange,
  searchValue,
  onSearchChange,
  valueCounts,
  allLabel,
  colorTheme = 'slate'
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    const newSelected = Array.from(new Set([...selectedValues, ...options]));
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange(selectedValues.filter(val => !options.includes(val)));
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left border border-slate-900 rounded-none p-2 bg-white text-[11px] font-bold text-slate-900 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer flex justify-between items-center min-h-[36px]"
        >
          <span className="truncate pr-2">
            {selectedValues.length === 0
              ? allLabel
              : `ĐÃ CHỌN (${selectedValues.length}) NGUYÊN NHÂN`}
          </span>
          <span className="text-[9px] text-slate-500 font-mono grow-0 shrink-0">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-900 z-50 shadow-[4px_4px_0px_rgba(0,0,0,0.15)] flex flex-col max-h-72">
            <div className="p-2 border-b border-slate-200 bg-slate-50">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full border border-slate-900 rounded-none px-2 py-1 bg-white text-[10px] font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              
              <div className="flex justify-between items-center mt-1.5 pt-1 text-[9px] font-black uppercase font-mono">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`hover:underline cursor-pointer ${colorTheme === 'slate' ? 'text-slate-900' : 'text-emerald-800'}`}
                >
                  ☑ Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  ☐ Bỏ chọn tất cả
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 py-1 max-h-48 divide-y divide-slate-100">
              {options.length === 0 ? (
                <div className="p-3 text-center text-slate-400 italic text-[10px] uppercase font-mono">
                  Không tìm thấy kết quả
                </div>
              ) : (
                options.map(val => {
                  const isChecked = selectedValues.includes(val);
                  return (
                    <label
                      key={val}
                      className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer transition-all hover:bg-slate-50 ${
                        isChecked
                          ? colorTheme === 'slate'
                            ? 'bg-slate-100 font-black text-slate-900'
                            : 'bg-emerald-50/50 font-black text-emerald-950'
                          : 'text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(val)}
                        className={`mt-0.5 rounded-none border-slate-900 focus:ring-0 ${
                          colorTheme === 'slate'
                            ? 'text-slate-900'
                            : 'text-emerald-700'
                        }`}
                      />
                      <span className="text-[10px] tracking-wide break-words uppercase flex-1">
                        {val || '(TRỐNG)'}
                      </span>
                      <span className="text-[9px] font-bold font-mono text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5">
                        {valueCounts[val] || 0}
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            <div className="p-1.5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`text-[9px] font-black border border-slate-900 px-3 py-1 rounded-none text-white hover:opacity-90 leading-none uppercase tracking-wider ${
                  colorTheme === 'slate' ? 'bg-slate-900' : 'bg-emerald-800'
                }`}
              >
                Xong
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CombinedPreviewTableProps {
  records: MergedRecord[];
  chartFilter: { type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staffL1' | 'staffL2' | 'staff'; value: string } | null;
  onClearChartFilter: () => void;
}

export default function CombinedPreviewTable({ records, chartFilter, onClearChartFilter }: CombinedPreviewTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'NOT_FOUND'>('ALL');
  const [isExporting, setIsExporting] = useState(false);

  // L1 State Variables for Filters
  const [selectedInputStatusesL1, setSelectedInputStatusesL1] = useState<string[]>([]);
  const [selectedErrorElementsL1, setSelectedErrorElementsL1] = useState<string[]>([]);
  const [selectedErrorCausesL1, setSelectedErrorCausesL1] = useState<string[]>([]);
  const [selectedHandlingsL1, setSelectedHandlingsL1] = useState<string[]>([]);
  const [selectedStaffsL1, setSelectedStaffsL1] = useState<string[]>([]);

  // L1 State Variables for Internal Dropdown Search Input
  const [inputStatusL1Search, setInputStatusL1Search] = useState('');
  const [errorElementL1Search, setErrorElementL1Search] = useState('');
  const [errorCauseL1Search, setErrorCauseL1Search] = useState('');
  const [handlingL1Search, setHandlingL1Search] = useState('');
  const [staffL1Search, setStaffL1Search] = useState('');

  // L2 State Variables for Filters
  const [selectedInputStatusesL2, setSelectedInputStatusesL2] = useState<string[]>([]);
  const [selectedErrorElementsL2, setSelectedErrorElementsL2] = useState<string[]>([]);
  const [selectedErrorCausesL2, setSelectedErrorCausesL2] = useState<string[]>([]);
  const [selectedHandlingsL2, setSelectedHandlingsL2] = useState<string[]>([]);
  const [selectedStaffsL2, setSelectedStaffsL2] = useState<string[]>([]);

  // L2 State Variables for Internal Dropdown Search Input
  const [inputStatusL2Search, setInputStatusL2Search] = useState('');
  const [errorElementL2Search, setErrorElementL2Search] = useState('');
  const [errorCauseL2Search, setErrorCauseL2Search] = useState('');
  const [handlingL2Search, setHandlingL2Search] = useState('');
  const [staffL2Search, setStaffL2Search] = useState('');

  // Separate L1 Unique Value calculations
  const uniqueInputStatusesL1 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.inputStatusL1) values.add(r.inputStatusL1);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueErrorElementsL1 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.errorElementL1) values.add(r.errorElementL1);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueErrorCausesL1 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.errorCauseL1) values.add(r.errorCauseL1);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueHandlingsL1 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.handlingL1) values.add(r.handlingL1);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueStaffsL1 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.staffL1) values.add(r.staffL1);
    });
    return Array.from(values).sort();
  }, [records]);

  // Separate L2 Unique Value calculations
  const uniqueInputStatusesL2 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.inputStatusL2) values.add(r.inputStatusL2);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueErrorElementsL2 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.errorElementL2) values.add(r.errorElementL2);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueErrorCausesL2 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.errorCauseL2) values.add(r.errorCauseL2);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueHandlingsL2 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.handlingL2) values.add(r.handlingL2);
    });
    return Array.from(values).sort();
  }, [records]);

  const uniqueStaffsL2 = React.useMemo(() => {
    const values = new Set<string>();
    records.forEach(r => {
      if (r.staffL2) values.add(r.staffL2);
    });
    return Array.from(values).sort();
  }, [records]);

  // Counts of each option value in the imported dataset for dropdown display
  const valueCounts = React.useMemo(() => {
    const counts = {
      inputStatusL1: {} as Record<string, number>,
      errorElementL1: {} as Record<string, number>,
      errorCauseL1: {} as Record<string, number>,
      handlingL1: {} as Record<string, number>,
      staffL1: {} as Record<string, number>,
      
      inputStatusL2: {} as Record<string, number>,
      errorElementL2: {} as Record<string, number>,
      errorCauseL2: {} as Record<string, number>,
      handlingL2: {} as Record<string, number>,
      staffL2: {} as Record<string, number>,
    };

    records.forEach(r => {
      if (r.inputStatusL1) counts.inputStatusL1[r.inputStatusL1] = (counts.inputStatusL1[r.inputStatusL1] || 0) + 1;
      if (r.errorElementL1) counts.errorElementL1[r.errorElementL1] = (counts.errorElementL1[r.errorElementL1] || 0) + 1;
      if (r.errorCauseL1) counts.errorCauseL1[r.errorCauseL1] = (counts.errorCauseL1[r.errorCauseL1] || 0) + 1;
      if (r.handlingL1) counts.handlingL1[r.handlingL1] = (counts.handlingL1[r.handlingL1] || 0) + 1;
      if (r.staffL1) counts.staffL1[r.staffL1] = (counts.staffL1[r.staffL1] || 0) + 1;

      if (r.inputStatusL2) counts.inputStatusL2[r.inputStatusL2] = (counts.inputStatusL2[r.inputStatusL2] || 0) + 1;
      if (r.errorElementL2) counts.errorElementL2[r.errorElementL2] = (counts.errorElementL2[r.errorElementL2] || 0) + 1;
      if (r.errorCauseL2) counts.errorCauseL2[r.errorCauseL2] = (counts.errorCauseL2[r.errorCauseL2] || 0) + 1;
      if (r.handlingL2) counts.handlingL2[r.handlingL2] = (counts.handlingL2[r.handlingL2] || 0) + 1;
      if (r.staffL2) counts.staffL2[r.staffL2] = (counts.staffL2[r.staffL2] || 0) + 1;
    });

    return counts;
  }, [records]);

  // Filtered lists for option rendering based on text search
  const filteredInputStatusesL1 = React.useMemo(() => {
    return uniqueInputStatusesL1.filter(val => val.toLowerCase().includes(inputStatusL1Search.toLowerCase()));
  }, [uniqueInputStatusesL1, inputStatusL1Search]);

  const filteredErrorElementsL1 = React.useMemo(() => {
    return uniqueErrorElementsL1.filter(val => val.toLowerCase().includes(errorElementL1Search.toLowerCase()));
  }, [uniqueErrorElementsL1, errorElementL1Search]);

  const filteredErrorCausesL1 = React.useMemo(() => {
    return uniqueErrorCausesL1.filter(val => val.toLowerCase().includes(errorCauseL1Search.toLowerCase()));
  }, [uniqueErrorCausesL1, errorCauseL1Search]);

  const filteredHandlingsL1 = React.useMemo(() => {
    return uniqueHandlingsL1.filter(val => val.toLowerCase().includes(handlingL1Search.toLowerCase()));
  }, [uniqueHandlingsL1, handlingL1Search]);

  const filteredStaffsL1 = React.useMemo(() => {
    return uniqueStaffsL1.filter(val => val.toLowerCase().includes(staffL1Search.toLowerCase()));
  }, [uniqueStaffsL1, staffL1Search]);

  const filteredInputStatusesL2 = React.useMemo(() => {
    return uniqueInputStatusesL2.filter(val => val.toLowerCase().includes(inputStatusL2Search.toLowerCase()));
  }, [uniqueInputStatusesL2, inputStatusL2Search]);

  const filteredErrorElementsL2 = React.useMemo(() => {
    return uniqueErrorElementsL2.filter(val => val.toLowerCase().includes(errorElementL2Search.toLowerCase()));
  }, [uniqueErrorElementsL2, errorElementL2Search]);

  const filteredErrorCausesL2 = React.useMemo(() => {
    return uniqueErrorCausesL2.filter(val => val.toLowerCase().includes(errorCauseL2Search.toLowerCase()));
  }, [uniqueErrorCausesL2, errorCauseL2Search]);

  const filteredHandlingsL2 = React.useMemo(() => {
    return uniqueHandlingsL2.filter(val => val.toLowerCase().includes(handlingL2Search.toLowerCase()));
  }, [uniqueHandlingsL2, handlingL2Search]);

  const filteredStaffsL2 = React.useMemo(() => {
    return uniqueStaffsL2.filter(val => val.toLowerCase().includes(staffL2Search.toLowerCase()));
  }, [uniqueStaffsL2, staffL2Search]);

  // Combined Filter logic with individual L1 and L2 matching
  const filteredRecords = records.filter((rec) => {
    // 1. Search Query
    const matchesSearch = 
      rec.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.errorCauseL1.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.errorCauseL2.toLowerCase().includes(searchQuery.toLowerCase());
      
    // 2. Integration Status Tab
    const matchesStatus = 
      statusFilter === 'ALL' || 
      rec.status === statusFilter;

    // 3. L1 Dropdowns
    const matchesInputStatusL1 =
      selectedInputStatusesL1.length === 0 ||
      (rec.inputStatusL1 !== undefined && selectedInputStatusesL1.includes(rec.inputStatusL1));

    const matchesErrorElementL1 =
      selectedErrorElementsL1.length === 0 ||
      (rec.errorElementL1 !== undefined && selectedErrorElementsL1.includes(rec.errorElementL1));

    const matchesErrorCauseL1 =
      selectedErrorCausesL1.length === 0 ||
      (rec.errorCauseL1 !== undefined && selectedErrorCausesL1.includes(rec.errorCauseL1));

    const matchesHandlingL1 =
      selectedHandlingsL1.length === 0 ||
      (rec.handlingL1 !== undefined && selectedHandlingsL1.includes(rec.handlingL1));

    const matchesStaffL1 =
      selectedStaffsL1.length === 0 ||
      (rec.staffL1 !== undefined && selectedStaffsL1.includes(rec.staffL1));

    // 4. L2 Dropdowns
    const matchesInputStatusL2 =
      selectedInputStatusesL2.length === 0 ||
      (rec.inputStatusL2 !== undefined && selectedInputStatusesL2.includes(rec.inputStatusL2));

    const matchesErrorElementL2 =
      selectedErrorElementsL2.length === 0 ||
      (rec.errorElementL2 !== undefined && selectedErrorElementsL2.includes(rec.errorElementL2));

    const matchesErrorCauseL2 =
      selectedErrorCausesL2.length === 0 ||
      (rec.errorCauseL2 !== undefined && selectedErrorCausesL2.includes(rec.errorCauseL2));

    const matchesHandlingL2 =
      selectedHandlingsL2.length === 0 ||
      (rec.handlingL2 !== undefined && selectedHandlingsL2.includes(rec.handlingL2));

    const matchesStaffL2 =
      selectedStaffsL2.length === 0 ||
      (rec.staffL2 !== undefined && selectedStaffsL2.includes(rec.staffL2));

    // 5. Interactive Chart click filter
    let matchesChartFilter = true;
    if (chartFilter) {
      const { type, value } = chartFilter;
      if (type === 'inputStatus') {
        matchesChartFilter = rec.inputStatusL1 === value || rec.inputStatusL2 === value;
      } else if (type === 'errorElement') {
        matchesChartFilter = rec.errorElementL1 === value || rec.errorElementL2 === value;
      } else if (type === 'errorCause') {
        matchesChartFilter = rec.errorCauseL1 === value || rec.errorCauseL2 === value;
      } else if (type === 'handling') {
        matchesChartFilter = rec.handlingL1 === value || rec.handlingL2 === value;
      } else if (type === 'staffL1') {
        matchesChartFilter = rec.staffL1 === value;
      } else if (type === 'staffL2') {
        matchesChartFilter = rec.staffL2 === value;
      } else if (type === 'staff') {
        matchesChartFilter = rec.staffL1 === value || rec.staffL2 === value;
      }
    }

    return (
      matchesSearch && 
      matchesStatus && 
      matchesInputStatusL1 && 
      matchesErrorElementL1 && 
      matchesErrorCauseL1 && 
      matchesHandlingL1 && 
      matchesStaffL1 && 
      matchesInputStatusL2 && 
      matchesErrorElementL2 && 
      matchesErrorCauseL2 && 
      matchesHandlingL2 && 
      matchesStaffL2 && 
      matchesChartFilter
    );
  });

  const top10StaffL1 = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.staffL1) {
        counts[r.staffL1] = (counts[r.staffL1] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filteredRecords]);

  const top10StaffL2 = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.staffL2) {
        counts[r.staffL2] = (counts[r.staffL2] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filteredRecords]);

  // Check if any active filter is applied
  const isAnyFilterActive = 
    selectedInputStatusesL1.length > 0 ||
    selectedErrorElementsL1.length > 0 ||
    selectedErrorCausesL1.length > 0 ||
    selectedHandlingsL1.length > 0 ||
    selectedStaffsL1.length > 0 ||
    selectedInputStatusesL2.length > 0 ||
    selectedErrorElementsL2.length > 0 ||
    selectedErrorCausesL2.length > 0 ||
    selectedHandlingsL2.length > 0 ||
    selectedStaffsL2.length > 0 ||
    statusFilter !== 'ALL' ||
    searchQuery !== '' ||
    !!chartFilter;

  const handleResetAllFilters = () => {
    setSelectedInputStatusesL1([]);
    setSelectedErrorElementsL1([]);
    setSelectedErrorCausesL1([]);
    setSelectedHandlingsL1([]);
    setSelectedStaffsL1([]);
    setInputStatusL1Search('');
    setErrorElementL1Search('');
    setErrorCauseL1Search('');
    setHandlingL1Search('');
    setStaffL1Search('');

    setSelectedInputStatusesL2([]);
    setSelectedErrorElementsL2([]);
    setSelectedErrorCausesL2([]);
    setSelectedHandlingsL2([]);
    setSelectedStaffsL2([]);
    setInputStatusL2Search('');
    setErrorElementL2Search('');
    setErrorCauseL2Search('');
    setHandlingL2Search('');
    setStaffL2Search('');

    setStatusFilter('ALL');
    setSearchQuery('');
    onClearChartFilter();
    setCurrentPage(1);
  };

  const handleExportFiltered = async () => {
    if (filteredRecords.length === 0) {
      alert("Không có dữ liệu phù hợp để xuất báo cáo!");
      return;
    }
    setIsExporting(true);
    try {
      const statsObj = calculateStatistics(filteredRecords);
      const blob = await exportToExcel(filteredRecords, statsObj);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PhanTichCLL_BoLoc_${filteredRecords.length}_dong.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Không thể tải file excel: " + (err.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  // Pagination logic
  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize);

  // Reset pagination on search of filter change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: 'ALL' | 'SUCCESS' | 'NOT_FOUND') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-none border border-slate-900 p-6 shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col gap-5">
      {/* Table Title and Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-md font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Eye className="text-slate-900 h-5 w-5" />
            Bảng tổng hợp dữ liệu sau ghép (Xem trước)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Danh sách chi tiết kết quả tích hợp và so khớp từ các tệp Excel đầu vào
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Switches */}
          <div className="inline-flex bg-slate-100 p-1 rounded-none border border-slate-900 text-[10px] font-bold tracking-wider uppercase shrink-0 font-mono">
            <button
              onClick={() => handleStatusChange('ALL')}
              className={`px-3.5 py-1.5 rounded-none cursor-pointer transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              TẤT CẢ ({records.length})
            </button>
            <button
              onClick={() => handleStatusChange('SUCCESS')}
              className={`px-3.5 py-1.5 rounded-none cursor-pointer transition-all ${
                statusFilter === 'SUCCESS'
                  ? 'bg-slate-900 text-white'
                  : 'text-emerald-750 hover:text-emerald-900'
              }`}
            >
              GHÉP THÀNH CÔNG ({records.filter(r => r.status === 'SUCCESS').length})
            </button>
            <button
              onClick={() => handleStatusChange('NOT_FOUND')}
              className={`px-3.5 py-1.5 rounded-none cursor-pointer transition-all ${
                statusFilter === 'NOT_FOUND'
                  ? 'bg-slate-900 text-white'
                  : 'text-rose-750 hover:text-rose-900'
              }`}
            >
              CHƯA KHỚP CLPS ({records.filter(r => r.status === 'NOT_FOUND').length})
            </button>
          </div>

          {/* Text Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="TÌM THEO SỐ HĐ, LỖI..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 border border-slate-900 rounded-none text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-[2px_2px_0px_rgba(0,0,0,0.05)] text-slate-900"
            />
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
          </div>

          {/* Download Filtered Report Button */}
          <button
            type="button"
            onClick={handleExportFiltered}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-700 border border-slate-900 text-white font-mono font-bold text-xs px-4 py-2 rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] transition-all uppercase tracking-wider flex items-center gap-2 active:translate-y-0.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
            title="Tải tệp Excel tổng hợp chỉ chứa dòng đang được hiển thị theo bộ lọc"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Đang xuất...' : `Xuất Bộ Lọc (${filteredRecords.length})`}
          </button>
        </div>
      </div>

      {/* 2. Advanced Dropdown Filters row separated into L1 and L2 */}
      <div className="flex flex-col gap-5">
        {/* LẦN 1: BÁO HỎNG (L1) */}
        <div className="border border-slate-900 p-4 shadow-[2px_2px_0px_rgba(15,23,42,0.05)] bg-slate-50">
          <div className="flex items-center gap-2 mb-3 border-b border-slate-300 pb-2.5">
            <span className="w-2 h-4 bg-slate-950"></span>
            <span className="text-[11px] font-black text-slate-900 uppercase font-mono tracking-wider">BỘ LỌC LẦN 1: BÁO HỎNG (L1)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 font-mono">
            {/* Input Status Filter L1 */}
            <MultiSelectDropdown
              label="Tình trạng vào L1"
              placeholder="Chọn tình trạng..."
              searchPlaceholder="🔍 Tìm tình trạng L1..."
              options={filteredInputStatusesL1}
              selectedValues={selectedInputStatusesL1}
              onChange={(vals) => { setSelectedInputStatusesL1(vals); setCurrentPage(1); }}
              searchValue={inputStatusL1Search}
              onSearchChange={setInputStatusL1Search}
              valueCounts={valueCounts.inputStatusL1}
              allLabel={`-- TẤT CẢ TÌNH TRẠNG L1 (${filteredInputStatusesL1.length}) --`}
              colorTheme="slate"
            />

            {/* Error Element Filter L1 */}
            <MultiSelectDropdown
              label="Phần tử lỗi L1"
              placeholder="Chọn phần tử lỗi..."
              searchPlaceholder="🔍 Tìm phần tử L1..."
              options={filteredErrorElementsL1}
              selectedValues={selectedErrorElementsL1}
              onChange={(vals) => { setSelectedErrorElementsL1(vals); setCurrentPage(1); }}
              searchValue={errorElementL1Search}
              onSearchChange={setErrorElementL1Search}
              valueCounts={valueCounts.errorElementL1}
              allLabel={`-- TẤT CẢ PHẦN TỬ L1 (${filteredErrorElementsL1.length}) --`}
              colorTheme="slate"
            />

            {/* Error Cause Filter L1 */}
            <MultiSelectDropdown
              label="Nguyên nhân lỗi L1"
              placeholder="Chọn các nguyên nhân..."
              searchPlaceholder="🔍 Tìm nguyên nhân L1..."
              options={filteredErrorCausesL1}
              selectedValues={selectedErrorCausesL1}
              onChange={(vals) => { setSelectedErrorCausesL1(vals); setCurrentPage(1); }}
              searchValue={errorCauseL1Search}
              onSearchChange={setErrorCauseL1Search}
              valueCounts={valueCounts.errorCauseL1}
              allLabel={`-- TẤT CẢ NGUYÊN NHÂN L1 (${filteredErrorCausesL1.length}) --`}
              colorTheme="slate"
            />

            {/* Handling Filter L1 */}
            <MultiSelectDropdown
              label="Hướng xử lý L1"
              placeholder="Chọn hướng xử lý..."
              searchPlaceholder="🔍 Tìm hướng xử lý L1..."
              options={filteredHandlingsL1}
              selectedValues={selectedHandlingsL1}
              onChange={(vals) => { setSelectedHandlingsL1(vals); setCurrentPage(1); }}
              searchValue={handlingL1Search}
              onSearchChange={setHandlingL1Search}
              valueCounts={valueCounts.handlingL1}
              allLabel={`-- TẤT CẢ HƯỚNG XỬ LÝ L1 (${filteredHandlingsL1.length}) --`}
              colorTheme="slate"
            />

            {/* Staff Filter L1 */}
            <MultiSelectDropdown
              label="Nhân viên L1"
              placeholder="Chọn nhân viên..."
              searchPlaceholder="🔍 Tìm nhân viên L1..."
              options={filteredStaffsL1}
              selectedValues={selectedStaffsL1}
              onChange={(vals) => { setSelectedStaffsL1(vals); setCurrentPage(1); }}
              searchValue={staffL1Search}
              onSearchChange={setStaffL1Search}
              valueCounts={valueCounts.staffL1}
              allLabel={`-- TẤT CẢ NHÂN VIÊN L1 (${filteredStaffsL1.length}) --`}
              colorTheme="slate"
            />
          </div>
          
          {/* Top 10 Nhân Sự L1 Table */}
          <div className="mt-5 pt-4 border-t border-slate-300 w-full xl:w-2/3">
             <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3 font-mono">Top 10 Nhân Sự Lần 1 (Theo hệ thống lọc)</h4>
             <Top10StaffTable data={top10StaffL1} theme="slate" />
          </div>
        </div>

        {/* LẦN 2: CLPS / NGHIỆM THU (L2) */}
        <div className="border border-slate-900 p-4 shadow-[2px_2px_0px_rgba(16,185,129,0.05)] bg-[#f0fdf4]">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-300 pb-2.5">
            <span className="w-2 h-4 bg-emerald-600"></span>
            <span className="text-[11px] font-black text-emerald-800 uppercase font-mono tracking-wider">BỘ LỌC LẦN 2: CLPS / NGHIỆM THU (L2)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 font-mono">
            {/* Input Status Filter L2 */}
            <MultiSelectDropdown
              label="Tình trạng vào L2"
              placeholder="Chọn tình trạng..."
              searchPlaceholder="🔍 Tìm tình trạng L2..."
              options={filteredInputStatusesL2}
              selectedValues={selectedInputStatusesL2}
              onChange={(vals) => { setSelectedInputStatusesL2(vals); setCurrentPage(1); }}
              searchValue={inputStatusL2Search}
              onSearchChange={setInputStatusL2Search}
              valueCounts={valueCounts.inputStatusL2}
              allLabel={`-- TẤT CẢ TÌNH TRẠNG L2 (${filteredInputStatusesL2.length}) --`}
              colorTheme="emerald"
            />

            {/* Error Element Filter L2 */}
            <MultiSelectDropdown
              label="Phần tử lỗi L2"
              placeholder="Chọn phần tử lỗi..."
              searchPlaceholder="🔍 Tìm phần tử L2..."
              options={filteredErrorElementsL2}
              selectedValues={selectedErrorElementsL2}
              onChange={(vals) => { setSelectedErrorElementsL2(vals); setCurrentPage(1); }}
              searchValue={errorElementL2Search}
              onSearchChange={setErrorElementL2Search}
              valueCounts={valueCounts.errorElementL2}
              allLabel={`-- TẤT CẢ PHẦN TỬ L2 (${filteredErrorElementsL2.length}) --`}
              colorTheme="emerald"
            />

            {/* Error Cause Filter L2 */}
            <MultiSelectDropdown
              label="Nguyên nhân lỗi L2"
              placeholder="Chọn các nguyên nhân..."
              searchPlaceholder="🔍 Tìm nguyên nhân L2..."
              options={filteredErrorCausesL2}
              selectedValues={selectedErrorCausesL2}
              onChange={(vals) => { setSelectedErrorCausesL2(vals); setCurrentPage(1); }}
              searchValue={errorCauseL2Search}
              onSearchChange={setErrorCauseL2Search}
              valueCounts={valueCounts.errorCauseL2}
              allLabel={`-- TẤT CẢ NGUYÊN NHÂN L2 (${filteredErrorCausesL2.length}) --`}
              colorTheme="emerald"
            />

            {/* Handling Filter L2 */}
            <MultiSelectDropdown
              label="Hướng xử lý L2"
              placeholder="Chọn hướng xử lý..."
              searchPlaceholder="🔍 Tìm hướng xử lý L2..."
              options={filteredHandlingsL2}
              selectedValues={selectedHandlingsL2}
              onChange={(vals) => { setSelectedHandlingsL2(vals); setCurrentPage(1); }}
              searchValue={handlingL2Search}
              onSearchChange={setHandlingL2Search}
              valueCounts={valueCounts.handlingL2}
              allLabel={`-- TẤT CẢ HƯỚNG XỬ LÝ L2 (${filteredHandlingsL2.length}) --`}
              colorTheme="emerald"
            />

            {/* Staff Filter L2 */}
            <MultiSelectDropdown
              label="Nhân viên L2"
              placeholder="Chọn nhân viên..."
              searchPlaceholder="🔍 Tìm nhân viên L2..."
              options={filteredStaffsL2}
              selectedValues={selectedStaffsL2}
              onChange={(vals) => { setSelectedStaffsL2(vals); setCurrentPage(1); }}
              searchValue={staffL2Search}
              onSearchChange={setStaffL2Search}
              valueCounts={valueCounts.staffL2}
              allLabel={`-- TẤT CẢ NHÂN VIÊN L2 (${filteredStaffsL2.length}) --`}
              colorTheme="emerald"
            />
          </div>

          {/* Top 10 Nhân Sự L2 Table */}
          <div className="mt-5 pt-4 border-t border-emerald-300 w-full xl:w-2/3">
             <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 font-mono">Top 10 Nhân Sự Lần 2 (Theo hệ thống lọc)</h4>
             <Top10StaffTable data={top10StaffL2} theme="emerald" />
          </div>
        </div>
      </div>

      {/* 3. Filter Reset Banner with stats */}
      {isAnyFilterActive && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-emerald-50 border border-slate-900 p-3.5 text-[11px] font-bold font-mono shadow-[2px_2px_0px_rgba(0,0,0,0.05)] text-slate-900">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 border border-slate-900 animate-pulse"></span>
            <span>ĐANG KHỚP CHUẨN XÁC:</span>
            <span className="bg-white border border-slate-300 px-1.5 py-0.5 text-slate-900">
              {filteredRecords.length} / {records.length} HỒ SƠ
            </span>
            {chartFilter && (
              <span className="text-slate-500 uppercase">
                (ĐANG ÁP DỤNG LỌC BIỂU ĐỒ TRỰC QUAN)
              </span>
            )}
          </div>
          <button
            onClick={handleResetAllFilters}
            className="text-slate-900 hover:bg-slate-900 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white border border-slate-900 px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] uppercase text-[10px] tracking-wider shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            RESET BỘ LỌC
          </button>
        </div>
      )}

      {/* Main Table view */}
      <div className="overflow-x-auto border border-slate-900 rounded-none max-w-full">
        <table className="w-full text-left border-collapse table-fixed min-w-[1550px]">
          {/* Combined Column headers */}
          <thead>
            <tr className="border-b border-slate-900">
              <th rowSpan={2} className="p-3 bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-widest text-center w-40 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.1)] border-r border-slate-300 font-mono">
                Số HĐ
              </th>
              <th colSpan={7} className="p-3 bg-slate-900 text-[12px] font-black text-white text-center tracking-widest border-r border-slate-800 uppercase font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                LẦN 1 (Chất lượng phát sóng - Báo hỏng)
              </th>
              <th colSpan={7} className="p-3 bg-emerald-800 text-[12px] font-black text-white text-center tracking-widest uppercase font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
                LẦN 2 (Chất lượng luồng - CLL)
              </th>
            </tr>
            <tr className="border-b border-slate-900 bg-slate-50 text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider">
              {/* L1 Headers (CLPS) */}
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-36 border-r border-slate-300 font-bold uppercase tracking-wider">Tg hoàn tất (L1)</th>
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-64 border-r border-slate-300 font-bold uppercase tracking-wider">Ghi chú (L1)</th>
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-44 border-r border-slate-300 font-bold uppercase tracking-wider">Tình trạng vào (L1)</th>
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-44 border-r border-slate-300 font-bold uppercase tracking-wider">Phần tử lỗi (L1)</th>
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-44 border-r border-slate-300 font-bold uppercase tracking-wider">Nguyên nhân (L1)</th>
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-44 border-r border-slate-300 font-bold uppercase tracking-wider">Hướng xử lý (L1)</th>
              <th className="p-3 bg-slate-100 text-slate-700 text-left w-44 border-r border-slate-800 font-bold uppercase tracking-wider">Nhân viên (L1)</th>

              {/* L2 Headers (CLL) */}
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-36 border-r border-emerald-200 font-bold uppercase tracking-wider">Tg hoàn tất (L2)</th>
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-64 border-r border-emerald-200 font-bold uppercase tracking-wider">Ghi chú (L2)</th>
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-44 border-r border-emerald-200 font-bold uppercase tracking-wider">Tình trạng vào (L2)</th>
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-44 border-r border-emerald-200 font-bold uppercase tracking-wider">Phần tử lỗi (L2)</th>
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-44 border-r border-emerald-200 font-bold uppercase tracking-wider">Nguyên nhân (L2)</th>
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-44 border-r border-emerald-200 font-bold uppercase tracking-wider">Hướng xử lý (L2)</th>
              <th className="p-3 bg-emerald-50 text-emerald-900 text-left w-44 font-bold uppercase tracking-wider">Nhân viên (L2)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 text-xs">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-16 text-center text-slate-400 font-mono">
                  <div className="flex flex-col items-center gap-2">
                     <FileX className="h-8 w-8 text-slate-300 stroke-1" />
                     <span className="text-xs uppercase font-bold tracking-wider">Không tìm thấy bản ghi nào khớp các bộ lọc này.</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((item) => {
                const isMatched = item.status === 'SUCCESS';
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {/* Contract ID (Sticky column for layout reference) */}
                    <td className="p-3 font-semibold text-slate-900 bg-white sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.06)] border-r border-slate-300 text-center">
                      <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-800">{item.contractNumber}</span>
                    </td>

                    {/* L1 Info */}
                    <td className="p-3 text-slate-600 border-r border-slate-200 truncate font-mono text-[11px]" title={item.completedTimeL1}>
                      {item.completedTimeL1 || '-'}
                    </td>
                    <td className="p-3 text-slate-600 border-r border-slate-200 truncate" title={item.notesL1}>
                      {item.notesL1 || <span className="text-slate-300 italic">Trống</span>}
                    </td>
                    <td className="p-3 text-slate-700 border-r border-slate-200 font-medium truncate" title={item.inputStatusL1}>
                      {item.inputStatusL1 || '-'}
                    </td>
                    <td className="p-3 text-slate-700 border-r border-slate-200 truncate" title={item.errorElementL1}>
                      {item.errorElementL1 || '-'}
                    </td>
                    <td className="p-3 text-slate-700 border-r border-slate-200 font-bold truncate" title={item.errorCauseL1}>
                      {item.errorCauseL1 || '-'}
                    </td>
                    <td className="p-3 text-slate-700 border-r border-slate-200 truncate" title={item.handlingL1}>
                      {item.handlingL1 || '-'}
                    </td>
                    <td className="p-3 text-slate-700 border-r border-slate-300 truncate font-medium text-slate-900" title={item.staffL1}>
                      {item.staffL1 || <span className="text-slate-300 italic">Trống</span>}
                    </td>

                    {/* L2 Info */}
                    <td className={`p-3 border-r border-slate-200 truncate font-mono text-[11px] ${isMatched ? 'text-slate-600 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`}>
                      {item.completedTimeL2 || '-'}
                    </td>
                    <td className={`p-3 border-r border-slate-200 truncate ${isMatched ? 'text-slate-600 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`} title={item.notesL2}>
                      {item.notesL2 || <span className="text-slate-300 italic">Trống</span>}
                    </td>
                    <td className={`p-3 border-r border-slate-200 truncate font-medium ${isMatched ? 'text-slate-950 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`}>
                      {item.inputStatusL2 || '-'}
                    </td>
                    <td className={`p-3 border-r border-slate-200 truncate ${isMatched ? 'text-slate-950 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`}>
                      {item.errorElementL2 || '-'}
                    </td>
                    <td className={`p-3 border-r border-slate-200 font-bold truncate ${isMatched ? 'text-emerald-800 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`} title={item.errorCauseL2}>
                      {item.errorCauseL2 || '-'}
                    </td>
                    <td className={`p-3 border-r border-slate-200 truncate font-medium ${isMatched ? 'text-slate-950 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`} title={item.handlingL2}>
                      {item.handlingL2 || '-'}
                    </td>
                    <td className={`p-3 truncate font-medium ${isMatched ? 'text-slate-900 bg-emerald-50/10' : 'text-slate-400 italic bg-rose-50/5'}`} title={item.staffL2}>
                      {item.staffL2 || <span className="text-slate-300 italic">Trống</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1 font-mono">
          {/* Page Sizer and Stats */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-bold uppercase">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-2.5 py-1.5 border border-slate-900 rounded-none outline-none focus:ring-1 focus:ring-slate-900 bg-white font-bold"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} HÀNG
                </option>
              ))}
            </select>
            <span>
              trên <b>{totalItems}</b> hồ sơ (bản ghi {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)})
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 border border-slate-900 rounded-none transition-colors cursor-pointer ${
                currentPage === 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-900 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Elegant pages print */}
            <span className="text-[11px] font-bold text-slate-900 px-3 font-mono border-y border-transparent py-1">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 border border-slate-900 rounded-none transition-colors cursor-pointer ${
                currentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-900 text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
