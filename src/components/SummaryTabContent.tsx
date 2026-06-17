import { useState, useMemo } from 'react';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';
import TransitionsTable from './TransitionsTable';
import CombinedPreviewTable from './CombinedPreviewTable';
import { calculateStatistics, exportToExcel } from '../utils/excelProcessor';
import { MergedRecord } from '../types';
import { Download, Sparkles, Database } from 'lucide-react';

export default function SummaryTabContent({ allRecords }: { allRecords: MergedRecord[] }) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter States
  const [selectedStaffL1, setSelectedStaffL1] = useState<string[]>([]);
  const [selectedStaffL2, setSelectedStaffL2] = useState<string[]>([]);
  const [chartFilter, setChartFilter] = useState<{ type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff' | 'staffL1' | 'staffL2'; value: string } | null>(null);

  // 1. Filter records reactively by selected staff L1 and/or L2
  const staffFilteredRecords = useMemo(() => {
    return allRecords.filter(rec => {
      if (selectedStaffL1.length > 0) {
        const s1 = (rec.staffL1 || '').trim();
        if (!selectedStaffL1.includes(s1)) return false;
      }
      if (selectedStaffL2.length > 0) {
        const s2 = (rec.staffL2 || '').trim();
        if (!selectedStaffL2.includes(s2)) return false;
      }
      return true;
    });
  }, [allRecords, selectedStaffL1, selectedStaffL2]);

  // 2. Compute the current summary statistics for the filtered records
  const summaryStats = useMemo(() => {
    if (allRecords.length === 0) return null;
    const totalCLL = staffFilteredRecords.length;
    const totalMerged = staffFilteredRecords.filter(r => r.status === 'SUCCESS').length;
    const totalNotFound = totalCLL - totalMerged;
    return {
      totalCLL,
      totalMerged,
      totalNotFound
    };
  }, [staffFilteredRecords, allRecords.length]);

  // 3. Compute the chart statistics for the filtered records
  const chartData = useMemo(() => {
    if (staffFilteredRecords.length === 0) return null;
    return calculateStatistics(staffFilteredRecords);
  }, [staffFilteredRecords]);

  // 4. Extract unique employees list and counts separately for L1 and L2
  const masterStaffNamesL1 = useMemo(() => {
    const names = new Set<string>();
    allRecords.forEach(rec => {
      if (rec.staffL1 && rec.staffL1.trim()) names.add(rec.staffL1.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allRecords]);

  const masterStaffNamesL2 = useMemo(() => {
    const names = new Set<string>();
    allRecords.forEach(rec => {
      if (rec.status === 'SUCCESS' && rec.staffL2 && rec.staffL2.trim()) {
        names.add(rec.staffL2.trim());
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allRecords]);

  const masterStaffCountsL1 = useMemo(() => {
    const counts: Record<string, number> = {};
    allRecords.forEach(rec => {
      const s1 = (rec.staffL1 || '').trim();
      if (s1) {
        counts[s1] = (counts[s1] || 0) + 1;
      }
    });
    return counts;
  }, [allRecords]);

  const masterStaffCountsL2 = useMemo(() => {
    const counts: Record<string, number> = {};
    allRecords.forEach(rec => {
      const s2 = (rec.staffL2 || '').trim();
      if (rec.status === 'SUCCESS' && s2) {
        counts[s2] = (counts[s2] || 0) + 1;
      }
    });
    return counts;
  }, [allRecords]);

  const getFilteredChartRecords = () => {
    if (!chartFilter) return [];
    const { type, value } = chartFilter;
    return staffFilteredRecords.filter(rec => {
      if (type === 'inputStatus') {
        return (rec.inputStatusL1 || '').trim() === value || (rec.inputStatusL2 || '').trim() === value;
      } else if (type === 'errorElement') {
        return (rec.errorElementL1 || '').trim() === value || (rec.errorElementL2 || '').trim() === value;
      } else if (type === 'errorCause') {
        return (rec.errorCauseL1 || '').trim() === value || (rec.errorCauseL2 || '').trim() === value;
      } else if (type === 'handling') {
        return (rec.handlingL1 || '').trim() === value || (rec.handlingL2 || '').trim() === value;
      } else if (type === 'staffL1') {
        return (rec.staffL1 || '').trim() === value;
      } else if (type === 'staffL2') {
        return (rec.staffL2 || '').trim() === value;
      } else if (type === 'staff') {
        return (rec.staffL1 || '').trim() === value || (rec.staffL2 || '').trim() === value;
      }
      return true;
    });
  };

  const filteredChartRecords = getFilteredChartRecords();
  const filteredChartCount = filteredChartRecords.length;

  const handleExport = async () => {
    if (staffFilteredRecords.length === 0 || !chartData) return;
    setIsProcessing(true);
    try {
      const blob = await exportToExcel(staffFilteredRecords, chartData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PhanTichCLL_TONG_HOP.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Không thể xuất file excel: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportFilteredChart = async () => {
    if (filteredChartCount === 0 || !chartFilter) return;
    setIsProcessing(true);
    try {
      const statsObj = calculateStatistics(filteredChartRecords);
      const blob = await exportToExcel(filteredChartRecords, statsObj);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeVal = chartFilter.value.replace(/[^a-zA-Z0-9À-ỹ\s-_]/g, '');
      a.download = `PhanTichCLL_TONG_HOP_${chartFilter.type}_${safeVal}_${filteredChartCount}_dong.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Không thể xuất file excel bộ lọc: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (allRecords.length === 0) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center">
        <Database className="h-12 w-12 text-slate-300 mb-4 stroke-1" />
        <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Chưa có dữ liệu tổng hợp</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed text-center font-medium">
          Vui lòng tải lên dữ liệu ở các tab tháng để hệ thống tự động tổng hợp kết quả tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Banner */}
      <section className="bg-slate-900 text-white rounded-none p-6 md:p-8 shadow-[4px_4px_0px_rgba(20,83,45,0.2)] md:items-center justify-between gap-6 relative overflow-hidden flex flex-col md:flex-row items-start">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono px-3 py-1 rounded-none uppercase tracking-widest inline-flex items-center gap-1.5 mb-3">
            <Database className="h-3 w-3" />
            TỔNG HỢP TOÀN BỘ DỮ LIỆU
          </span>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight block">
            BÁO CÁO CHUYÊN SÂU TỔNG VÀNG
          </h2>
          <p className="text-slate-300 text-xs mt-2 font-medium leading-relaxed">
            Dữ liệu tổng hợp từ các tháng bạn đã tải lên. Bảng hiển thị chỉ số, cấu trúc lỗi và danh sách cán bộ xử lý được đo lường toàn diện.
          </p>
        </div>
      </section>

      {summaryStats && chartData && (
        <>
          {/* Results Summary cards */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Chỉ số tổng hợp toàn hệ thống
              </h3>
              
              <button
                type="button"
                onClick={handleExport}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 border border-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] transition-all uppercase tracking-widest flex items-center gap-2 active:translate-y-0.5 cursor-pointer disabled:bg-slate-500"
              >
                <Download className="h-4 w-4" />
                Xuất Excel Tổng Hợp
              </button>
            </div>
            <DashboardStats stats={summaryStats} />
          </section>

          {/* Charts */}
          <div>
            <DashboardCharts
              inputStatusData={chartData.chartInputStatus}
              errorElementData={chartData.chartErrorElement}
              errorCauseData={chartData.chartErrorCause}
              handlingData={chartData.chartHandling}
              staffL1Data={chartData.chartStaffL1}
              staffL2Data={chartData.chartStaffL2}
              staffData={chartData.chartStaff}
              chartFilter={chartFilter}
              onChartClick={(type, value) => {
                setChartFilter({ type, value });
              }}
              onClearFilter={() => setChartFilter(null)}
              filteredCount={filteredChartCount}
              onExportFiltered={handleExportFilteredChart}
              allStaffListL1={masterStaffNamesL1}
              selectedStaffL1={selectedStaffL1}
              onStaffL1SelectionChange={(staff) => {
                setSelectedStaffL1(staff);
                setChartFilter(null);
              }}
              staffCountsL1={masterStaffCountsL1}
              allStaffListL2={masterStaffNamesL2}
              selectedStaffL2={selectedStaffL2}
              onStaffL2SelectionChange={(staff) => {
                setSelectedStaffL2(staff);
                setChartFilter(null);
              }}
              staffCountsL2={masterStaffCountsL2}
            />
          </div>

          {/* Transitions table */}
          <div>
            <TransitionsTable transitions={chartData.transitions} />
          </div>

          {/* Detailed Data preview sheet */}
          <section>
            <CombinedPreviewTable 
              records={staffFilteredRecords} 
              chartFilter={chartFilter}
              onClearChartFilter={() => setChartFilter(null)}
            />
          </section>
        </>
      )}
    </div>
  );
}
