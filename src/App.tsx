import { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import UploadBox from './components/UploadBox';
import DashboardStats from './components/DashboardStats';
import DashboardCharts from './components/DashboardCharts';
import TransitionsTable from './components/TransitionsTable';
import CombinedPreviewTable from './components/CombinedPreviewTable';

import { 
  readExcelFile, 
  processCLLData, 
  calculateStatistics, 
  exportToExcel 
} from './utils/excelProcessor';
import { MergedRecord, SummaryStats } from './types';
import { FileSpreadsheet, Download, Info, Check, Sparkles, HelpCircle, FileType } from 'lucide-react';

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Data State
  const [mergedRecords, setMergedRecords] = useState<MergedRecord[]>([]);
  const [selectedStaffL1, setSelectedStaffL1] = useState<string[]>([]);
  const [selectedStaffL2, setSelectedStaffL2] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [chartFilter, setChartFilter] = useState<{ type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff' | 'staffL1' | 'staffL2'; value: string } | null>(null);

  const handleFilesSelected = async (files: { cllFile: File; dhTFile: File; dhPrevFile: File }) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setChartFilter(null);
    setSelectedStaffL1([]);
    setSelectedStaffL2([]);

    try {
      // 1. Read files concurrently
      const [cllRaw, dhTRaw, dhPrevRaw] = await Promise.all([
        readExcelFile(files.cllFile),
        readExcelFile(files.dhTFile),
        readExcelFile(files.dhPrevFile)
      ]);

      if (!cllRaw || cllRaw.length === 0) {
        throw new Error('File CLL không chứa dòng dữ liệu nào.');
      }

      // Combine BOTH ĐÚNG HẸN T and T-1 rows
      const combinedDungHen = [...dhTRaw, ...dhPrevRaw];

      // 2. Process merging
      const merged = processCLLData(cllRaw, combinedDungHen);

      setMergedRecords(merged);
      setSuccessMsg(`Đã phân tích thành công ${merged.length} hồ sơ từ tệp và ghép nối thành công ${merged.filter(r => r.status === 'SUCCESS').length} hồ sơ!`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Có lỗi xảy ra trong quá trình đọc và kết nối dữ liệu. Vui lòng xác nhận cấu trúc file hợp lệ.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1. Filter records reactively by selected staff L1 and/or L2
  const staffFilteredRecords = useMemo(() => {
    return mergedRecords.filter(rec => {
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
  }, [mergedRecords, selectedStaffL1, selectedStaffL2]);

  // 2. Compute the current summary statistics for the filtered records
  const summaryStats = useMemo(() => {
    if (mergedRecords.length === 0) return null;
    const totalCLL = staffFilteredRecords.length;
    const totalMerged = staffFilteredRecords.filter(r => r.status === 'SUCCESS').length;
    const totalNotFound = totalCLL - totalMerged;
    return {
      totalCLL,
      totalMerged,
      totalNotFound
    };
  }, [staffFilteredRecords, mergedRecords.length]);

  // 3. Compute the chart statistics for the filtered records
  const chartData = useMemo(() => {
    if (staffFilteredRecords.length === 0) return null;
    return calculateStatistics(staffFilteredRecords);
  }, [staffFilteredRecords]);

  // 4. Extract unique employees list and counts separately for L1 and L2
  const masterStaffNamesL1 = useMemo(() => {
    const names = new Set<string>();
    mergedRecords.forEach(rec => {
      if (rec.staffL1 && rec.staffL1.trim()) names.add(rec.staffL1.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [mergedRecords]);

  const masterStaffNamesL2 = useMemo(() => {
    const names = new Set<string>();
    mergedRecords.forEach(rec => {
      if (rec.status === 'SUCCESS' && rec.staffL2 && rec.staffL2.trim()) {
        names.add(rec.staffL2.trim());
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [mergedRecords]);

  const masterStaffCountsL1 = useMemo(() => {
    const counts: Record<string, number> = {};
    mergedRecords.forEach(rec => {
      const s1 = (rec.staffL1 || '').trim();
      if (s1) {
        counts[s1] = (counts[s1] || 0) + 1;
      }
    });
    return counts;
  }, [mergedRecords]);

  const masterStaffCountsL2 = useMemo(() => {
    const counts: Record<string, number> = {};
    mergedRecords.forEach(rec => {
      const s2 = (rec.staffL2 || '').trim();
      if (rec.status === 'SUCCESS' && s2) {
        counts[s2] = (counts[s2] || 0) + 1;
      }
    });
    return counts;
  }, [mergedRecords]);

  const handleExport = async () => {
    if (staffFilteredRecords.length === 0 || !chartData) return;
    setIsProcessing(true);
    try {
      const blob = await exportToExcel(staffFilteredRecords, chartData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const totalSelected = selectedStaffL1.length + selectedStaffL2.length;
      a.download = totalSelected > 0 
        ? `PhanTichCLL_NhanVien_${totalSelected}_nhansu.xlsx`
        : 'PhanTichCLL.xlsx';
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
      a.download = `PhanTichCLL_${chartFilter.type}_${safeVal}_${filteredChartCount}_dong.xlsx`;
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Platform premium header */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Banner with visual identity */}
        <section className="bg-white border border-slate-900 rounded-none p-6 md:p-8 text-slate-900 shadow-[4px_4px_0px_rgba(15,23,42,0.1)] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-slate-900 text-white text-[10px] font-bold font-mono px-3 py-1 rounded-none uppercase tracking-widest inline-flex items-center gap-1.5 mb-3 border border-slate-950">
              <Sparkles className="h-3 w-3" />
              Công cụ tự động hóa QA
            </span>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
              Phân Tích CLL
            </h2>
            <p className="text-slate-600 text-xs mt-2 font-medium leading-relaxed">
              Tải lên báo cáo CLL và các báo cáo ĐÚNG HẸN tháng mới nhất cùng tháng liền kề trước đó. Hệ thống sẽ kết xuất tự động dịch chuyển chất lượng báo hỏng, tổng hợp phiếu lần 1 - lần 2 và đối chiếu chênh lệch chính xác theo thời điểm phát sinh checklist (CLPS).
            </p>
          </div>
          
          <div className="shrink-0 relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="text-center md:text-right text-[10px] text-slate-705 bg-slate-100 border border-slate-900 rounded-none p-3.5 font-mono font-bold uppercase tracking-wider">
              <p className="font-bold text-slate-900">ĐÚNG HẸN tháng T &amp; T-1</p>
              <p className="mt-1 text-slate-500 text-[9px]">Ưu tiên Số HĐ + Thời gian</p>
            </div>
          </div>
        </section>

        {/* Upload dropbox section */}
        <section id="upload-zone">
          <UploadBox onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
        </section>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-900 text-rose-950 px-5 py-4 rounded-none flex items-start gap-3">
            <span className="p-1.5 bg-rose-100 text-rose-900 border border-rose-400 rounded-none shrink-0 font-bold text-xs">⚠️</span>
            <div>
              <p className="font-black text-xs font-mono uppercase tracking-wider">Xử lý tài liệu thất bại</p>
              <p className="text-xs text-rose-700 mt-1 font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-900 text-emerald-950 px-5 py-4 rounded-none flex items-start gap-3">
            <span className="p-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-none shrink-0"><Check className="h-4 w-4" /></span>
            <div>
              <p className="font-black text-xs font-mono uppercase tracking-wider">Xử lý thông tin hoàn tất!</p>
              <p className="text-xs text-emerald-700 mt-1 font-semibold">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Analysis outcome content */}
        {summaryStats && chartData && mergedRecords.length > 0 && (
          <>
            {/* 1. Results Summary cards */}
            <section className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Chỉ số tổng hợp kết quả
                </h3>
                
                {/* Export excel control */}
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 border border-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] transition-all uppercase tracking-widest flex items-center gap-2 active:translate-y-0.5 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-300 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4" />
                  Xuất Excel (PhanTichCLL.xlsx)
                </button>
              </div>
              <DashboardStats stats={summaryStats} />
            </section>

            {/* 2. Charts (Full Width) */}
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

            {/* 3. Transitions table (Full Width) */}
            <div>
              <TransitionsTable transitions={chartData.transitions} />
            </div>

            {/* 3. Detailed Data preview sheet */}
            <section>
              <CombinedPreviewTable 
                records={staffFilteredRecords} 
                chartFilter={chartFilter}
                onClearChartFilter={() => setChartFilter(null)}
              />
            </section>
          </>
        )}

        {/* Empty placeholder guide */}
        {!summaryStats && (
          <section className="bg-white rounded-none border border-slate-900 p-8 shadow-[4px_4px_0px_rgba(15,23,42,0.1)] text-center flex flex-col items-center justify-center py-16">
            <FileType className="h-12 w-12 text-slate-300 mb-4 stroke-1" />
            <h3 className="text-md font-black text-slate-900 uppercase tracking-tight">Sẵn sàng phân tích chất lượng xử lý</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
              Vui lòng tải lên đầy đủ 3 file Excel được đề xuất phía đầu trang, sau đó bấm nút <b className="text-slate-900">"Phân tích dữ liệu"</b> để khởi chạy biểu đồ hiển thị.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-xl text-left">
              <div className="p-4 bg-slate-50 rounded-none border border-slate-200 flex gap-3 items-start shadow-[1px_1px_0px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-white rounded-none w-5 h-5 flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 font-mono tracking-wider">CLL THÁNG T.xlsx</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Thời điểm hoàn tất thực tế &amp; thông tin ban đầu mốc xử lý Lần 1.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-none border border-slate-200 flex gap-3 items-start shadow-[1px_1px_0px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-white rounded-none w-5 h-5 flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 font-mono tracking-wider">ĐÚNG HẸN THÁNG T</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Bản ghi đối ứng phát sinh checklist để ghép lần 2.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-none border border-slate-200 flex gap-3 items-start shadow-[1px_1px_0px_rgba(0,0,0,0.03)]">
                <span className="text-[10px] font-mono font-bold bg-slate-900 text-white rounded-none w-5 h-5 flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 font-mono tracking-wider">ĐÚNG HẸN THÁNG T-1</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Dữ liệu bù đắp các ca hoàn tất từ mép cuối tháng liền kề.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Solid footer with human label */}
      <footer className="bg-white border-t-2 border-slate-900 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
          <p>© 2026 - Phân Tích CLL. Tác vụ được thực thi trực tiếp trên trình duyệt.</p>
        </div>
      </footer>
    </div>
  );
}
