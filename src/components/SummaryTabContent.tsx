import { useMemo } from 'react';
import DashboardStats from './DashboardStats';
import { MergedRecord } from '../types';
import { calculateStatistics } from '../utils/excelProcessor';
import { Database, TrendingUp, BarChart3, Activity, AlertTriangle, Wrench } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

type TabDataPayload = {
  id: string;
  name: string;
  records: MergedRecord[];
};

export default function SummaryTabContent({ tabsDataPayload }: { tabsDataPayload: TabDataPayload[] }) {
  // Aggregate data for stats
  const allRecords = useMemo(() => tabsDataPayload.flatMap(t => t.records), [tabsDataPayload]);

  const summaryStats = useMemo(() => {
    if (allRecords.length === 0) return null;
    const totalCLL = allRecords.length;
    const totalMerged = allRecords.filter(r => r.status === 'SUCCESS').length;
    const totalNotFound = totalCLL - totalMerged;
    return {
      totalCLL,
      totalMerged,
      totalNotFound
    };
  }, [allRecords]);

  // Aggregate monthly data for charts
  const monthlyData = useMemo(() => {
    return tabsDataPayload
      .filter(tab => tab.records.length > 0)
      .map(tab => {
        const total = tab.records.length;
        const success = tab.records.filter(r => r.status === 'SUCCESS').length;
        const missing = total - success;
        const successRate = total > 0 ? parseFloat(((success / total) * 100).toFixed(1)) : 0;
        
        return {
          name: tab.name,
          Tổng: total,
          Ghép_Thành_Công: success,
          Không_Ghép_Được: missing,
          Tỷ_Lệ_Thành_Công: successRate
        };
    });
  }, [tabsDataPayload]);

  const monthlyDetailedStats = useMemo(() => {
    const inputStatusData: any[] = [];
    const errorCauseData: any[] = [];
    const handlingData: any[] = [];

    const inputStatusKeys = new Set<string>();
    const errorCauseKeys = new Set<string>();
    const handlingKeys = new Set<string>();

    tabsDataPayload.filter(tab => tab.records.length > 0).forEach(tab => {
      const stats = calculateStatistics(tab.records);
      
      const isEntry: any = { name: tab.name };
      stats.chartInputStatus.forEach((item: any) => {
        isEntry[item.name] = (item['Lần 1'] || 0) + (item['Lần 2'] || 0);
        inputStatusKeys.add(item.name);
      });
      inputStatusData.push(isEntry);

      const causeEntry: any = { name: tab.name };
      stats.chartErrorCause.forEach((item: any) => {
        causeEntry[item.name] = (item['Lần 1'] || 0) + (item['Lần 2'] || 0);
        errorCauseKeys.add(item.name);
      });
      errorCauseData.push(causeEntry);

      const handlingEntry: any = { name: tab.name };
      stats.chartHandling.forEach((item: any) => {
        handlingEntry[item.name] = (item['Lần 1'] || 0) + (item['Lần 2'] || 0);
        handlingKeys.add(item.name);
      });
      handlingData.push(handlingEntry);
    });

    return {
      inputStatusData,
      inputStatusKeys: Array.from(inputStatusKeys),
      errorCauseData,
      errorCauseKeys: Array.from(errorCauseKeys),
      handlingData,
      handlingKeys: Array.from(handlingKeys),
    };
  }, [tabsDataPayload]);

  const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#10b981', '#64748b', '#0ea5e9'];

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
          <span className="bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono px-3 py-1 rounded-none uppercase tracking-widest inline-flex items-center gap-1.5 mb-3 border border-slate-950">
            <Database className="h-3 w-3" />
            TỔNG HỢP DIỄN BIẾN QUA CÁC THÁNG
          </span>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight block">
            BÁO CÁO XU HƯỚNG
          </h2>
          <p className="text-slate-300 text-xs mt-2 font-medium leading-relaxed">
            Dữ liệu được kết xuất từ các tháng đã tải lên. Báo cáo tập trung vào biến động tổng số lượng hồ sơ và tỷ lệ đối chiếu thành công qua thời gian.
          </p>
        </div>
      </section>

      {summaryStats && (
        <>
          {/* Executive Insights Section */}
          <section className="bg-emerald-50 border-l-4 border-emerald-600 p-5 shadow-[2px_2px_0px_rgba(15,23,42,0.05)] rounded-none">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono mb-3">Tóm tắt phân tích</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Tổng hồ sơ quét</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-slate-900">{summaryStats.totalCLL.toLocaleString()}</p>
                  <p className="text-xs font-bold text-slate-500">hồ sơ</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Trung bình thành công</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-emerald-600">
                    {summaryStats.totalCLL > 0 ? ((summaryStats.totalMerged / summaryStats.totalCLL) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs font-bold text-slate-500">sau đối chiếu</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Biến động thời gian</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-black text-slate-900">{monthlyData.length}</p>
                  <p className="text-xs font-bold text-slate-500">chu kỳ báo cáo</p>
                </div>
              </div>
            </div>
          </section>

          {/* Detailed summary table */}
          {monthlyData.length > 0 && (
            <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] overflow-x-auto">
              <table className="min-w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                    <th className="px-4 py-3 border-b border-slate-900 w-1/5">Kỳ Báo Cáo</th>
                    <th className="px-4 py-3 border-b border-slate-900 w-1/5 text-right relative group">
                      KHỐI LƯỢNG ĐẦU VÀO
                    </th>
                    <th className="px-4 py-3 border-b border-slate-900 w-1/5 text-right relative group">
                      <span className="text-emerald-400">GHÉP THÀNH CÔNG</span>
                    </th>
                    <th className="px-4 py-3 border-b border-slate-900 w-1/5 text-right relative group">
                      <span className="text-rose-400">KHÔNG BẮT ĐƯỢC</span>
                    </th>
                    <th className="px-4 py-3 border-b border-slate-900 w-1/5 text-right relative group cursor-help">
                      HIỆU SUẤT ĐỐI CHIẾU
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((mon, index) => (
                    <tr key={mon.name} className={`hover:bg-slate-50 transition-colors ${index !== monthlyData.length - 1 ? 'border-b border-slate-200' : ''}`}>
                      <td className="px-4 py-3 text-xs font-bold text-slate-900">{mon.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 text-right font-medium">{mon.Tổng.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-emerald-600 font-bold text-right">{mon.Ghép_Thành_Công.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-rose-500 font-bold text-right">{mon.Không_Ghép_Được.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-none overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${mon.Tỷ_Lệ_Thành_Công}%` }} />
                          </div>
                          <span className="text-xs font-black text-slate-900">{mon.Tỷ_Lệ_Thành_Công}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Monthly Trends Charts */}
          {monthlyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Bar Chart: Total vs Success */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Lượng hồ sơ qua các tháng</h3>
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 0, border: '1px solid #0f172a', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', fontSize: '12px', fontFamily: 'monospace' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      <Bar dataKey="Tổng" fill="#94a3b8" radius={[2, 2, 0, 0]} maxBarSize={60} />
                      <Bar dataKey="Ghép_Thành_Công" fill="#059669" radius={[2, 2, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Line Chart: Success Rate */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Tỷ lệ thành công (%)</h3>
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} dx={-10} domain={[0, 100]} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: 0, border: '1px solid #0f172a', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', fontSize: '12px', fontFamily: 'monospace' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="Tỷ_Lệ_Thành_Công" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

            </div>
          )}

          {/* Detailed Monthly Trends */}
          {monthlyDetailedStats.inputStatusData.length > 0 && (
            <div className="grid grid-cols-1 gap-6 mt-2">
              
              {/* Input Status Chart */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Cơ cấu Tình trạng đầu vào theo tháng (%)</h3>
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyDetailedStats.inputStatusData} stackOffset="expand" margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip 
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, undefined]}
                        contentStyle={{ borderRadius: 0, border: '1px solid #0f172a', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', fontSize: '12px', fontFamily: 'monospace' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      {monthlyDetailedStats.inputStatusKeys.map((key, idx) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[idx % COLORS.length]} maxBarSize={60} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Error Cause Chart */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Cơ cấu Nguyên nhân lỗi theo tháng (%)</h3>
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyDetailedStats.errorCauseData} stackOffset="expand" margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip 
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, undefined]}
                        contentStyle={{ borderRadius: 0, border: '1px solid #0f172a', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', fontSize: '12px', fontFamily: 'monospace' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      {monthlyDetailedStats.errorCauseKeys.map((key, idx) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[idx % COLORS.length]} maxBarSize={60} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Handling Chart */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-rose-500" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Cơ cấu Hướng xử lý theo tháng (%)</h3>
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyDetailedStats.handlingData} stackOffset="expand" margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip 
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, undefined]}
                        contentStyle={{ borderRadius: 0, border: '1px solid #0f172a', boxShadow: '2px 2px 0px rgba(0,0,0,0.1)', fontSize: '12px', fontFamily: 'monospace' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      {monthlyDetailedStats.handlingKeys.map((key, idx) => (
                        <Bar key={key} dataKey={key} stackId="a" fill={COLORS[idx % COLORS.length]} maxBarSize={60} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

            </div>
          )}
        </>
      )}
    </div>
  );
}
