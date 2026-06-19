import React, { useState, useMemo } from 'react';
import { TabDataPayload } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { Filter, Users, ShieldAlert, Server, Info, Download, XCircle } from 'lucide-react';

interface Top10TabContentProps {
  tabsDataPayload: TabDataPayload[];
}

export default function Top10TabContent({ tabsDataPayload }: Top10TabContentProps) {
  const [selectedMonthId, setSelectedMonthId] = useState<string>('all');
  const [dataLevel, setDataLevel] = useState<'l1' | 'l2'>('l2');
  
  const [selectedCategory, setSelectedCategory] = useState<{
    type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff';
    name: string;
  } | null>(null);

  const filteredRecords = useMemo(() => {
    let records = [];
    if (selectedMonthId === 'all') {
      records = tabsDataPayload.flatMap(t => t.records);
    } else {
      const tab = tabsDataPayload.find(t => t.id === selectedMonthId);
      records = tab ? tab.records : [];
    }
    // Only count SUCCESS records or all? Let's count all that we have data for
    return records;
  }, [tabsDataPayload, selectedMonthId]);

  const displayedDrilldownRecords = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredRecords.filter(r => {
      if (selectedCategory.type === 'inputStatus') {
        const val = dataLevel === 'l1' ? r.inputStatusL2 : r.inputStatusL1;
        return val === selectedCategory.name;
      }
      if (selectedCategory.type === 'errorElement') {
        const val = dataLevel === 'l1' ? r.errorElementL2 : r.errorElementL1;
        return val === selectedCategory.name;
      }
      if (selectedCategory.type === 'errorCause') {
        const val = dataLevel === 'l1' ? r.errorCauseL2 : r.errorCauseL1;
        return val === selectedCategory.name;
      }
      if (selectedCategory.type === 'handling') {
        const val = dataLevel === 'l1' ? r.handlingL2 : r.handlingL1;
        return val === selectedCategory.name;
      }
      if (selectedCategory.type === 'staff') {
        const val = dataLevel === 'l1' ? r.staffL2 : r.staffL1;
        return val === selectedCategory.name;
      }
      return false;
    });
  }, [filteredRecords, selectedCategory, dataLevel]);

  const crossFilteredRecords = selectedCategory ? displayedDrilldownRecords : filteredRecords;
  const totalFiltered = crossFilteredRecords.length;

  const buildTop10 = (keyGetter: (r: any) => string) => {
    const counts: Record<string, number> = {};
    let totalValid = 0;

    crossFilteredRecords.forEach(r => {
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

  const topInputStatus = useMemo(() => {
    return buildTop10(r => dataLevel === 'l1' ? r.inputStatusL2 : r.inputStatusL1);
  }, [crossFilteredRecords, dataLevel]);

  const topErrorElement = useMemo(() => {
    return buildTop10(r => dataLevel === 'l1' ? r.errorElementL2 : r.errorElementL1);
  }, [crossFilteredRecords, dataLevel]);

  const topErrorCause = useMemo(() => {
    return buildTop10(r => dataLevel === 'l1' ? r.errorCauseL2 : r.errorCauseL1);
  }, [crossFilteredRecords, dataLevel]);

  const topHandling = useMemo(() => {
    return buildTop10(r => dataLevel === 'l1' ? r.handlingL2 : r.handlingL1);
  }, [crossFilteredRecords, dataLevel]);

  const topStaff = useMemo(() => {
    return buildTop10(r => dataLevel === 'l1' ? r.staffL2 : r.staffL1);
  }, [crossFilteredRecords, dataLevel]);

  const exportToCSV = () => {
    const headers = [
      "STT", 
      "Số HĐ", 
      "Mã NV L1 (CLPS)", "Mã NV L2 (CLL)", 
      "Tình trạng đầu vào L1 (CLPS)", "Tình trạng đầu vào L2 (CLL)",
      "Phần tử lỗi L1 (CLPS)", "Phần tử lỗi L2 (CLL)",
      "Nguyên nhân lỗi L1 (CLPS)", "Nguyên nhân lỗi L2 (CLL)",
      "Hướng xử lý L1 (CLPS)", "Hướng xử lý L2 (CLL)"
    ];
    let csvContent = headers.join(",") + "\n";

    displayedDrilldownRecords.forEach((record, index) => {
      const row = [
        index + 1,
        `"${record.contractNumber || '-'}"`,
        `"${record.staffL2 || '-'}"`,
        `"${record.staffL1 || '-'}"`,
        `"${record.inputStatusL2 || '-'}"`,
        `"${record.inputStatusL1 || '-'}"`,
        `"${record.errorElementL2 || '-'}"`,
        `"${record.errorElementL1 || '-'}"`,
        `"${record.errorCauseL2 || '-'}"`,
        `"${record.errorCauseL1 || '-'}"`,
        `"${record.handlingL2 || '-'}"`,
        `"${record.handlingL1 || '-'}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `chi_tiet_top10_${selectedCategory?.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const renderChart = (data: any[], title: string, color: string, icon: React.ReactNode, type: 'inputStatus' | 'errorElement' | 'errorCause' | 'staff') => {
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
                  fill={color} 
                  radius={[0, 4, 4, 0]} 
                  maxBarSize={32}
                  onClick={(data) => setSelectedCategory({ type, name: data.name })}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
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
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Top 10 Chỉ Số</h1>
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

            <div className="flex items-center rounded-none overflow-hidden border-2 border-slate-300 w-full sm:w-auto">
              <button
                onClick={() => { setDataLevel('l1'); setSelectedCategory(null); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  dataLevel === 'l1' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Lần 1 (CLPS)
              </button>
              <button
                onClick={() => { setDataLevel('l2'); setSelectedCategory(null); }}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border-l-2 border-slate-300 ${
                  dataLevel === 'l2' 
                    ? 'bg-slate-900 text-white border-l-slate-900' 
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Lần 2 (CLL)
              </button>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {renderChart(topInputStatus, 'Top 10 Tình trạng đầu vào', '#3b82f6', <ShieldAlert className="h-5 w-5" />, 'inputStatus')}
        {renderChart(topErrorElement, 'Top 10 Phần tử lỗi', '#eab308', <Server className="h-5 w-5" />, 'errorElement')}
        {renderChart(topErrorCause, 'Top 10 Nguyên nhân lỗi', '#ef4444', <Info className="h-5 w-5" />, 'errorCause')}
        {renderChart(topHandling, 'Top 10 Hướng xử lý', '#a855f7', <Filter className="h-5 w-5" />, 'handling')}
        {renderChart(topStaff, 'Top 10 Nhân viên', '#10b981', <Users className="h-5 w-5" />, 'staff')}
      </div>

      {selectedCategory && (
        <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_rgba(15,23,42,1)] animate-fade-in mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-200 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Chi tiết dữ liệu: <span className="text-amber-600">{selectedCategory.name}</span>
              </h2>
              <div className="text-xs font-bold text-slate-500 font-mono mt-1">
                Lọc theo {selectedCategory.type === 'inputStatus' ? 'Tình trạng đầu vào' : 
                         selectedCategory.type === 'errorElement' ? 'Phần tử lỗi' : 
                         selectedCategory.type === 'errorCause' ? 'Nguyên nhân' : 'Nhân viên'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-bold text-slate-600 font-mono bg-slate-100 px-3 py-1.5 border border-slate-200">
                SL: {displayedDrilldownRecords.length}
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-colors border border-emerald-800 shadow-[2px_2px_0px_rgba(6,78,59,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                <Download className="w-4 h-4" /> Tải Excel
              </button>
              <button
                onClick={() => setSelectedCategory(null)}
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
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center bg-slate-800/50">Tình trạng đầu vào</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center">Phần tử lỗi</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-r border-slate-700 text-center bg-slate-800/50">Nguyên nhân lỗi</th>
                    <th colSpan={2} className="px-4 py-2 font-bold uppercase tracking-wider border-b border-slate-700 text-center">Hướng xử lý</th>
                  </tr>
                  <tr className="bg-slate-800">
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 w-[100px]">Lần 1 (CLPS)</th>
                    <th className="px-4 py-2 font-bold uppercase border-b border-r border-slate-700 text-center text-[10px] text-slate-300 w-[100px]">Lần 2 (CLL)</th>
                    
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
