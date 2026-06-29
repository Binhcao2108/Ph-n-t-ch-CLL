import React, { useState, useMemo } from 'react';
import { MergedRecord } from '../types';

type TabDataPayload = {
  id: string;
  name: string;
  records: MergedRecord[];
};
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell
} from 'recharts';
import { Filter, Users, ShieldAlert, Server, Info, Download, XCircle, Image as ImageIcon, MapPin } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Top10TabContentProps {
  tabsDataPayload: TabDataPayload[];
}

export default function Top10TabContent({ tabsDataPayload }: Top10TabContentProps) {
  const [selectedMonthId, setSelectedMonthId] = useState<string>('all');
  
  type FilterCategory = 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff' | 'block';
  interface FilterCondition {
    type: FilterCategory;
    name: string;
    level: 'l1' | 'l2';
  }
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const filteredRecords = useMemo(() => {
    if (selectedMonthId === 'all') {
      return tabsDataPayload.flatMap(t => t.records.map(r => ({ ...r, tabName: t.name })));
    } else {
      const tab = tabsDataPayload.find(t => t.id === selectedMonthId);
      return tab ? tab.records.map(r => ({ ...r, tabName: tab.name })) : [];
    }
  }, [tabsDataPayload, selectedMonthId]);

  const crossFilteredRecords = useMemo(() => {
    if (filters.length === 0) return filteredRecords;
    
    // Group filters by Category+Level
    const groupedFilters = filters.reduce((acc, f) => {
      const key = `${f.type}_${f.level}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {} as Record<string, FilterCondition[]>);

    return filteredRecords.filter(r => {
      // AND across all groups
      return Object.values(groupedFilters).every(filterGroup => {
        // OR within the group
        return filterGroup.some(filter => {
          let val;
          if (filter.type === 'inputStatus') val = filter.level === 'l1' ? r.inputStatusL1 : r.inputStatusL2;
          else if (filter.type === 'errorElement') val = filter.level === 'l1' ? r.errorElementL1 : r.errorElementL2;
          else if (filter.type === 'errorCause') val = filter.level === 'l1' ? r.errorCauseL1 : r.errorCauseL2;
          else if (filter.type === 'handling') val = filter.level === 'l1' ? r.handlingL1 : r.handlingL2;
          else if (filter.type === 'staff') val = filter.level === 'l1' ? r.staffL1 : r.staffL2;
          return val === filter.name;
        });
      });
    });
  }, [filteredRecords, filters]);

  const displayedDrilldownRecords = crossFilteredRecords;
  const totalFiltered = crossFilteredRecords.length;

  const handleChartClick = (type: FilterCategory, name: string, level: 'l1' | 'l2') => {
    setFilters(prev => {
      const existingIndex = prev.findIndex(f => f.type === type && f.level === level && f.name === name);
      if (existingIndex >= 0) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      return [...prev, { type, name, level }];
    });
  };

  const getRecordsForChart = (currentType: string, currentLevel: string) => {
    if (filters.length === 0) return filteredRecords;
    
    // Group filters by Category+Level
    const groupedFilters = filters.reduce((acc, f) => {
      const key = `${f.type}_${f.level}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {} as Record<string, FilterCondition[]>);

    const keyToExclude = `${currentType}_${currentLevel}`;

    return filteredRecords.filter(r => {
      return Object.entries(groupedFilters).every(([key, filterGroup]) => {
        if (key === keyToExclude) return true; // Ignore filters from the same chart
        
        return filterGroup.some(filter => {
          let val;
          if (filter.type === 'inputStatus') val = filter.level === 'l1' ? r.inputStatusL1 : r.inputStatusL2;
          else if (filter.type === 'errorElement') val = filter.level === 'l1' ? r.errorElementL1 : r.errorElementL2;
          else if (filter.type === 'errorCause') val = filter.level === 'l1' ? r.errorCauseL1 : r.errorCauseL2;
          else if (filter.type === 'handling') val = filter.level === 'l1' ? r.handlingL1 : r.handlingL2;
          else if (filter.type === 'staff') val = filter.level === 'l1' ? r.staffL1 : r.staffL2;
          return val === filter.name;
        });
      });
    });
  };

  const buildTop10 = (records: any[], keyGetter: (r: any) => string) => {
    const counts: Record<string, number> = {};
    let totalValid = 0;

    records.forEach(r => {
      const val = keyGetter(r);
      if (val && val !== '-' && val.trim() !== '') {
        counts[val] = (counts[val] || 0) + 1;
        totalValid++;
      }
    });

    const arr = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: totalValid > 0 ? ((count / totalValid) * 100).toFixed(1) + '%' : '0%'
    }));

    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 10);
  };

  const topInputStatusL1 = useMemo(() => buildTop10(getRecordsForChart('inputStatus', 'l1'), r => r.inputStatusL1), [filteredRecords, filters]);
  const topInputStatusL2 = useMemo(() => buildTop10(getRecordsForChart('inputStatus', 'l2'), r => r.inputStatusL2), [filteredRecords, filters]);

  const topErrorElementL1 = useMemo(() => buildTop10(getRecordsForChart('errorElement', 'l1'), r => r.errorElementL1), [filteredRecords, filters]);
  const topErrorElementL2 = useMemo(() => buildTop10(getRecordsForChart('errorElement', 'l2'), r => r.errorElementL2), [filteredRecords, filters]);

  const topErrorCauseL1 = useMemo(() => buildTop10(getRecordsForChart('errorCause', 'l1'), r => r.errorCauseL1), [filteredRecords, filters]);
  const topErrorCauseL2 = useMemo(() => buildTop10(getRecordsForChart('errorCause', 'l2'), r => r.errorCauseL2), [filteredRecords, filters]);

  const topHandlingL1 = useMemo(() => buildTop10(getRecordsForChart('handling', 'l1'), r => r.handlingL1), [filteredRecords, filters]);
  const topHandlingL2 = useMemo(() => buildTop10(getRecordsForChart('handling', 'l2'), r => r.handlingL2), [filteredRecords, filters]);

  const topStaffL1 = useMemo(() => buildTop10(getRecordsForChart('staff', 'l1'), r => r.staffL1), [filteredRecords, filters]);
  const topStaffL2 = useMemo(() => buildTop10(getRecordsForChart('staff', 'l2'), r => r.staffL2), [filteredRecords, filters]);

  const topBlockL1 = useMemo(() => buildTop10(getRecordsForChart('block', 'l1'), r => r.blockL1), [filteredRecords, filters]);
  const topBlockL2 = useMemo(() => buildTop10(getRecordsForChart('block', 'l2'), r => r.blockL2), [filteredRecords, filters]);

  const exportToExcel = () => {
    const dataDetail = displayedDrilldownRecords.map((record, index) => {
      const row: any = { "STT": index + 1 };
      if (selectedMonthId === 'all') {
        row["Tháng"] = record.tabName || '-';
      }
      row["Số HĐ"] = record.contractNumber || '-';
      
      // L1 (CLL)
      row["Tg hoàn tất (CLL)"] = record.completedTimeL1 || '-';
      row["Ghi chú (CLL)"] = record.notesL1 || '-';
      row["Tình trạng vào (CLL)"] = record.inputStatusL1 || '-';
      row["Phần tử lỗi (CLL)"] = record.errorElementL1 || '-';
      row["Nguyên nhân (CLL)"] = record.errorCauseL1 || '-';
      row["Hướng xử lý (CLL)"] = record.handlingL1 || '-';
      row["Nhân viên (CLL)"] = record.staffL1 || '-';
      row["Khu vực (CLL)"] = record.blockL1 || '-';

      // L2 (CLPS)
      row["Tg hoàn tất (CLPS)"] = record.completedTimeL2 || '-';
      row["Ghi chú (CLPS)"] = record.notesL2 || '-';
      row["Tình trạng vào (CLPS)"] = record.inputStatusL2 || '-';
      row["Phần tử lỗi (CLPS)"] = record.errorElementL2 || '-';
      row["Nguyên nhân (CLPS)"] = record.errorCauseL2 || '-';
      row["Hướng xử lý (CLPS)"] = record.handlingL2 || '-';
      row["Nhân viên (CLPS)"] = record.staffL2 || '-';
      row["Khu vực (CLPS)"] = record.blockL2 || '-';
      
      return row;
    });

    const wsData = XLSX.utils.json_to_sheet(dataDetail);

    // Helper to calculate Top 10 from records
    const getTop10FromRecords = (records: any[], keyGetter: (r: any) => string) => {
      const counts: Record<string, number> = {};
      records.forEach(r => {
        const val = keyGetter(r);
        if (val && val !== '-' && val.trim() !== '') {
          counts[val] = (counts[val] || 0) + 1;
        }
      });
      return Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    };

    const buildSheetData = (keyGetter: (r: any) => string) => {
      let resultData: any[] = [];
      
      // Calculate valid total items
      const getTotalValid = (records: any[]) => records.filter(r => {
        const val = keyGetter(r);
        return val && val !== '-' && val.trim() !== '';
      }).length;

      if (selectedMonthId === 'all') {
        const allTop10 = getTop10FromRecords(displayedDrilldownRecords, keyGetter);
        
        const recordsByMonth: Record<string, any[]> = {};
        displayedDrilldownRecords.forEach(r => {
          const m = r.tabName || 'Không xác định';
          if (!recordsByMonth[m]) recordsByMonth[m] = [];
          recordsByMonth[m].push(r);
        });

        const months = Object.keys(recordsByMonth);
        const totalAll = getTotalValid(displayedDrilldownRecords);

        resultData = allTop10.map((item, i) => {
          const rowData: any = {
            "STT": i + 1,
            "Tên": item.name,
            "TỔNG CỘNG": item.count,
            "Tỷ lệ % (TỔNG)": totalAll > 0 ? ((item.count / totalAll) * 100).toFixed(2) + '%' : '0%'
          };

          months.forEach(month => {
            const countInMonth = recordsByMonth[month].filter(r => keyGetter(r) === item.name).length;
            const totalInMonth = getTotalValid(recordsByMonth[month]);
            
            rowData[month] = countInMonth || 0;
            rowData[`Tỷ lệ % (${month})`] = totalInMonth > 0 ? ((countInMonth / totalInMonth) * 100).toFixed(2) + '%' : '0%';
          });

          return rowData;
        });
      } else {
         const top10 = getTop10FromRecords(displayedDrilldownRecords, keyGetter);
         const total = getTotalValid(displayedDrilldownRecords);
         
         top10.forEach((item, i) => {
             resultData.push({ 
                 "STT": i + 1, 
                 "Tên": item.name, 
                 "Số lượng": item.count,
                 "Tỷ lệ (%)": total > 0 ? ((item.count / total) * 100).toFixed(2) + '%' : '0%'
             });
         });
      }
      return XLSX.utils.json_to_sheet(resultData);
    };

    const wsInputStatusL1 = buildSheetData(r => r.inputStatusL1);
    const wsInputStatusL2 = buildSheetData(r => r.inputStatusL2);
    
    const wsErrorElementL1 = buildSheetData(r => r.errorElementL1);
    const wsErrorElementL2 = buildSheetData(r => r.errorElementL2);
    
    const wsErrorCauseL1 = buildSheetData(r => r.errorCauseL1);
    const wsErrorCauseL2 = buildSheetData(r => r.errorCauseL2);
    
    const wsHandlingL1 = buildSheetData(r => r.handlingL1);
    const wsHandlingL2 = buildSheetData(r => r.handlingL2);
    
    const wsStaffL1 = buildSheetData(r => r.staffL1);
    const wsStaffL2 = buildSheetData(r => r.staffL2);
    
    const wsBlockL1 = buildSheetData(r => r.blockL1);
    const wsBlockL2 = buildSheetData(r => r.blockL2);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, "Dữ liệu chi tiết");
    
    XLSX.utils.book_append_sheet(wb, wsInputStatusL1, "Top 10 TinhTrang L1");
    XLSX.utils.book_append_sheet(wb, wsInputStatusL2, "Top 10 TinhTrang L2");
    
    XLSX.utils.book_append_sheet(wb, wsErrorElementL1, "Top 10 PhanTu L1");
    XLSX.utils.book_append_sheet(wb, wsErrorElementL2, "Top 10 PhanTu L2");
    
    XLSX.utils.book_append_sheet(wb, wsErrorCauseL1, "Top 10 NguyenNhan L1");
    XLSX.utils.book_append_sheet(wb, wsErrorCauseL2, "Top 10 NguyenNhan L2");
    
    XLSX.utils.book_append_sheet(wb, wsHandlingL1, "Top 10 HuongXuLy L1");
    XLSX.utils.book_append_sheet(wb, wsHandlingL2, "Top 10 HuongXuLy L2");
    
    XLSX.utils.book_append_sheet(wb, wsStaffL1, "Top 10 NhanVien L1");
    XLSX.utils.book_append_sheet(wb, wsStaffL2, "Top 10 NhanVien L2");

    XLSX.utils.book_append_sheet(wb, wsBlockL1, "Top 10 KhuVuc L1");
    XLSX.utils.book_append_sheet(wb, wsBlockL2, "Top 10 KhuVuc L2");

    const activeFilters = filters.length > 0 ? filters.map(f => f.name).join('_').replace(/[<>:"\/\\|?*]+/g, '-') : 'all';
    const filterSuffix = activeFilters.length > 50 ? activeFilters.substring(0, 50) + '...' : activeFilters;
    const fileName = `chi_tiet_top10_${selectedMonthId === 'all' ? 'tong_hop' : selectedMonthId}_${filterSuffix}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportChartsToImage = async () => {
    const chartsContainer = document.getElementById('top10-charts-container');
    if (!chartsContainer) return;

    try {
      const { toBlob } = await import('html-to-image');
      const blob = await toBlob(chartsContainer, {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
      });

      if (!blob) throw new Error('Không thể tạo file ảnh');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `bieu_do_top10_${selectedMonthId}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi khi xuất ảnh biểu đồ:', error);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 shadow-xl">
          <p className="font-bold text-white mb-2 pb-2 border-b border-slate-700/50">{label}</p>
          <div className="flex justify-between gap-6 text-sm font-mono">
            <span className="text-slate-400">Số lượng:</span>
            <span className="text-white font-bold">{payload[0].value}</span>
          </div>
          <div className="flex justify-between gap-6 text-sm font-mono mt-1">
            <span className="text-slate-400">Tỷ lệ:</span>
            <span className="text-emerald-400 font-bold">{payload[0].payload.percent}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono italic">Click để xem danh sách chi tiết</div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (data: any[], title: string, color: string, icon: React.ReactNode, type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff' | 'block', level: 'l1' | 'l2') => {
    return (
      <div className="bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-slate-50 text-slate-700 border border-slate-200 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
            {icon}
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        </div>
        <div className="h-[400px] w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={250}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar 
                  dataKey="count" 
                  radius={[0, 4, 4, 0]} 
                  maxBarSize={32}
                  onClick={(data) => handleChartClick(type, data.name, level)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {data.map((entry, index) => {
                    const isSelected = filters.some(f => f.type === type && f.name === entry.name && f.level === level);
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isSelected ? '#f59e0b' : color} // Amber color for highlighted bar
                        opacity={filters.some(f => f.type === type && f.level === level) && !isSelected ? 0.3 : 1}
                      />
                    );
                  })}
                  <LabelList 
                    dataKey="count" 
                    position="right" 
                    formatter={(val: number) => val.toString()} 
                    style={{ fontSize: '11px', fontWeight: 'bold', fill: '#0f172a' }} 
                  />
                  <LabelList 
                    dataKey="percent" 
                    position="insideRight" 
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: '#ffffff' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-mono border-2 border-dashed border-slate-100">
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_rgba(15,23,42,1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Top 10 Chỉ Số</h1>
              <button
                onClick={exportChartsToImage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-colors border border-blue-800 shadow-[2px_2px_0px_rgba(30,58,138,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
                title="Tải ảnh các biểu đồ"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Tải ảnh biểu đồ
              </button>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">Biểu đồ thống kê top 10 nguyên nhân và nhân viên dựa trên bộ lọc</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 p-3 border border-slate-200 rounded-none">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-600" />
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="text-sm border-2 border-slate-300 bg-white px-3 py-1.5 focus:border-slate-900 focus:outline-none font-bold uppercase transition-colors"
                style={{ width: '160px' }}
              >
                <option value="all">Tất cả các tháng</option>
                {tabsDataPayload.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-slate-50 border border-slate-200 p-4">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tổng hồ sơ đang xét</div>
            <div className="text-3xl font-black text-slate-900 font-mono">{totalFiltered.toLocaleString('vi-VN')}</div>
          </div>
        </div>
      </div>

      <div id="top10-charts-container" className="flex flex-col gap-12 p-6 bg-slate-50 border border-slate-200">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderChart(topInputStatusL1, 'Top 10 Tình trạng (L1 - CLPS)', '#3b82f6', <ShieldAlert className="h-5 w-5" />, 'inputStatus', 'l1')}
          {renderChart(topInputStatusL2, 'Top 10 Tình trạng (L2 - CLL)', '#1d4ed8', <ShieldAlert className="h-5 w-5" />, 'inputStatus', 'l2')}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderChart(topErrorElementL1, 'Top 10 Phần tử lỗi (L1 - CLPS)', '#eab308', <Server className="h-5 w-5" />, 'errorElement', 'l1')}
          {renderChart(topErrorElementL2, 'Top 10 Phần tử lỗi (L2 - CLL)', '#a16207', <Server className="h-5 w-5" />, 'errorElement', 'l2')}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderChart(topErrorCauseL1, 'Top 10 Nguyên nhân lỗi (L1 - CLPS)', '#ef4444', <Info className="h-5 w-5" />, 'errorCause', 'l1')}
          {renderChart(topErrorCauseL2, 'Top 10 Nguyên nhân lỗi (L2 - CLL)', '#b91c1c', <Info className="h-5 w-5" />, 'errorCause', 'l2')}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderChart(topHandlingL1, 'Top 10 Hướng xử lý (L1 - CLPS)', '#a855f7', <Filter className="h-5 w-5" />, 'handling', 'l1')}
          {renderChart(topHandlingL2, 'Top 10 Hướng xử lý (L2 - CLL)', '#7e22ce', <Filter className="h-5 w-5" />, 'handling', 'l2')}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderChart(topStaffL1, 'Top 10 Nhân viên (L1 - CLPS)', '#10b981', <Users className="h-5 w-5" />, 'staff', 'l1')}
          {renderChart(topStaffL2, 'Top 10 Nhân viên (L2 - CLL)', '#047857', <Users className="h-5 w-5" />, 'staff', 'l2')}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {renderChart(topBlockL1, 'Top 10 Khu vực (L1 - CLPS)', '#f97316', <MapPin className="h-5 w-5" />, 'block', 'l1')}
          {renderChart(topBlockL2, 'Top 10 Khu vực (L2 - CLL)', '#c2410c', <MapPin className="h-5 w-5" />, 'block', 'l2')}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_rgba(15,23,42,1)] animate-fade-in mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-200 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 flex-wrap">
                Chi tiết dữ liệu: <span className="text-amber-600">{filters.map(f => f.name).join(' + ')}</span>
              </h2>
              <div className="text-xs font-bold text-slate-500 font-mono mt-1">
                Lọc qua {filters.length} điều kiện
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-slate-600 font-mono bg-slate-100 px-3 py-1.5 border border-slate-200">
                SL: {displayedDrilldownRecords.length}
              </div>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors border border-emerald-800 shadow-[2px_2px_0px_rgba(6,78,59,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                <Download className="w-4 h-4" /> Tải Excel
              </button>
              <button
                onClick={() => setFilters([])}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-rose-100 hover:text-rose-700 transition-colors border border-slate-300 shadow-[2px_2px_0px_rgba(148,163,184,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                <XCircle className="w-4 h-4" /> Bỏ lọc
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto border-2 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white sticky top-0 z-10">
                  <tr>
                    <th rowSpan={2} className="px-4 py-2 text-center font-bold uppercase tracking-wider border-b border-r border-slate-700 w-12 align-middle">STT</th>
                    <th rowSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 align-middle text-center w-[120px]">Số HĐ</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center">Mã NV</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center bg-slate-800/50">Khu vực</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center">Tình trạng đầu vào</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center">Phần tử lỗi</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center bg-slate-800/50">Nguyên nhân lỗi</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-slate-700 text-center">Hướng xử lý</th>
                  </tr>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 w-[100px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 w-[100px]">Lần 2 (CLL)</th>
                    
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[120px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[120px]">Lần 2 (CLL)</th>
                    
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 2 (CLL)</th>
                    
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 2 (CLL)</th>
                    
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 2 (CLL)</th>
                    
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-slate-700 text-center text-[10px] text-slate-300 min-w-[160px]">Lần 2 (CLL)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {displayedDrilldownRecords.length > 0 ? (
                    displayedDrilldownRecords.map((record, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 border-r border-slate-200 text-center font-mono text-slate-500">{index + 1}</td>
                        <td className="px-4 py-2 border-r border-slate-200 font-mono text-blue-600 text-center">{record.contractNumber || '-'}</td>
                        
                        <td className="px-4 py-2 border-r border-slate-200 font-bold font-mono text-center text-slate-700 bg-slate-50/50">{record.staffL2 || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 font-bold font-mono text-center text-emerald-700 bg-emerald-50/30">{record.staffL1 || '-'}</td>
                        
                        <td className="px-4 py-2 border-r border-slate-200 font-mono text-center text-slate-700 bg-slate-50/50">{record.blockL2 || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 font-mono text-center text-emerald-700 bg-emerald-50/30">{record.blockL1 || '-'}</td>
                        
                        <td className="px-4 py-2 border-r border-slate-200 bg-slate-50/50">{record.inputStatusL2 || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 bg-emerald-50/30">{record.inputStatusL1 || '-'}</td>
                        
                        <td className="px-4 py-2 border-r border-slate-200 bg-slate-50/50">{record.errorElementL2 || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 bg-emerald-50/30">{record.errorElementL1 || '-'}</td>
                        
                        <td className="px-4 py-2 border-r border-slate-200 bg-slate-50/50">{record.errorCauseL2 || '-'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 bg-emerald-50/30">{record.errorCauseL1 || '-'}</td>
                        
                        <td className="px-4 py-2 border-r border-slate-200 bg-slate-50/50">{record.handlingL2 || '-'}</td>
                        <td className="px-4 py-2 bg-emerald-50/30">{record.handlingL1 || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-mono">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
