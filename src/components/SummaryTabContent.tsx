import { useMemo } from 'react';
import DashboardStats from './DashboardStats';
import { MergedRecord } from '../types';
import { Database, TrendingUp, BarChart3 } from 'lucide-react';
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
          {/* Results Summary cards */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Tổng cộng toàn chiến dịch
              </h3>
            </div>
            <DashboardStats stats={summaryStats} />
          </section>

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
        </>
      )}
    </div>
  );
}
