import { FileText, CheckCircle, AlertTriangle, Percent } from 'lucide-react';
import { SummaryStats } from '../types';

interface DashboardStatsProps {
  stats: SummaryStats;
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const matchRate = stats.totalCLL > 0 
    ? ((stats.totalMerged / stats.totalCLL) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total CLL */}
      <div className="bg-white p-5 rounded-none border border-slate-900 shadow-[3px_3px_0px_rgba(15,23,42,0.1)] flex items-center gap-4">
        <div className="p-2.5 bg-slate-50 text-slate-900 border border-slate-200 rounded-none shrink-0">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Tổng số hồ sơ CLL
          </p>
          <p className="text-2xl font-black text-slate-900 mt-0.5 tracking-tight font-mono">
            {stats.totalCLL.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Merged Successfully */}
      <div className="bg-white p-5 rounded-none border border-slate-900 shadow-[3px_3px_0px_rgba(15,23,42,0.1)] flex items-center gap-4">
        <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-none shrink-0">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Ghép thành công
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-0.5 tracking-tight font-mono">
            {stats.totalMerged.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Not Found */}
      <div className="bg-white p-5 rounded-none border border-slate-900 shadow-[3px_3px_0px_rgba(15,23,42,0.1)] flex items-center gap-4">
        <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-none shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Không tìm thấy CLPS
          </p>
          <p className="text-2xl font-black text-rose-600 mt-0.5 tracking-tight font-mono">
            {stats.totalNotFound.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Matching Success Rate */}
      <div className="bg-white p-5 rounded-none border border-slate-900 shadow-[3px_3px_0px_rgba(15,23,42,0.1)] flex items-center gap-4">
        <div className="p-2.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-none shrink-0">
          <Percent className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Tỷ lệ ghép nối
          </p>
          <p className="text-2xl font-black text-blue-700 mt-0.5 tracking-tight font-mono">
            {matchRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
