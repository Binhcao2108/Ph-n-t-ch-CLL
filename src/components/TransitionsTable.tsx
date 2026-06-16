import { useState } from 'react';
import { ArrowRight, Search, ListIcon } from 'lucide-react';
import { TransitionRecord } from '../types';

interface TransitionsTableProps {
  transitions: TransitionRecord[];
}

export default function TransitionsTable({ transitions }: TransitionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransitions = transitions.filter(
    (t) =>
      t.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-none border border-slate-900 p-6 shadow-[4px_4px_0px_rgba(15,23,42,0.1)] h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-md font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <ListIcon className="text-slate-900 h-5 w-5" />
            Top dịch chuyển nguyên nhân lỗi (L1 → L2)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Đo lường sai lệch chẩn đoán lỗi giữa Phiếu khởi tạo Lần 1 (Báo hỏng) và CLPS Lần 2.
          </p>
        </div>

        {/* Search filter inside transitions */}
        <div className="relative">
          <input
            type="text"
            placeholder="TÌM NGUYÊN NHÂN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 pl-9 pr-4 py-2 border border-slate-900 rounded-none text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white shadow-[2px_2px_0px_rgba(0,0,0,0.05)] text-slate-900"
          />
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-600" />
        </div>
      </div>

      <div className="flex-1 overflow-auto max-h-[360px] pr-1">
        {filteredTransitions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-mono uppercase font-bold">
            Không tìm thấy dữ liệu phù hợp
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-50 font-mono">
                <th className="py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-12 text-center border-b border-slate-900">
                  STT
                </th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left border-b border-slate-900">
                  Nguyên nhân L1 (Báo hỏng)
                </th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-8 text-center border-b border-slate-900"></th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left border-b border-slate-900">
                  Nguyên nhân L2 (CLPS)
                </th>
                <th className="py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24 border-b border-slate-900">
                  Số lượng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransitions.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-[10px] text-slate-500 text-center font-mono font-bold">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 text-xs font-bold text-slate-700">
                    {item.from}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-900 inline-block" />
                  </td>
                  <td className="py-3 px-4 text-xs font-bold text-emerald-800">
                    {item.to}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center bg-slate-900 text-white px-2 py-0.5 rounded-none text-[10px] font-bold min-w-[36px] font-mono border border-slate-900 shadow-[1px_1px_0px_rgba(0,0,0,0.15)]">
                      {item.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
