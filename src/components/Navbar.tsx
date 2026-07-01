import { Activity, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b-2 border-slate-900 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-none">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  KTCN
                </h1>
                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-none font-bold uppercase tracking-widest border border-amber-300">
                  Phiên bản B 1.1
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Phân tích chất lượng xử lý tự động
              </p>
            </div>
          </div>

          {/* Time and Status Box */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-none px-3 py-1.5 text-xs text-slate-700 font-mono">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>{timeStr || '00:00:00'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Sẵn sàng
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
