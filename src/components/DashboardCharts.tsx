import { useState, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartDataItem } from '../types';
import { BarChart3, HelpCircle, Server, Info, ShieldAlert, Users, UserCheck, Download, Search } from 'lucide-react';

interface DashboardChartsProps {
  inputStatusData: ChartDataItem[];
  errorElementData: ChartDataItem[];
  errorCauseData: ChartDataItem[];
  handlingData: ChartDataItem[];
  staffL1Data: ChartDataItem[];
  staffL2Data: ChartDataItem[];
  staffData?: ChartDataItem[];
  chartFilter: { type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff' | 'staffL1' | 'staffL2'; value: string } | null;
  onChartClick: (type: 'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff' | 'staffL1' | 'staffL2', value: string) => void;
  onClearFilter: () => void;
  filteredCount?: number;
  onExportFiltered?: () => void;
  // Group L1 Multi-select props
  allStaffListL1: string[];
  selectedStaffL1: string[];
  onStaffL1SelectionChange: (staff: string[]) => void;
  staffCountsL1: Record<string, number>;
  // Group L2 Multi-select props
  allStaffListL2: string[];
  selectedStaffL2: string[];
  onStaffL2SelectionChange: (staff: string[]) => void;
  staffCountsL2: Record<string, number>;
}

export default function DashboardCharts({
  inputStatusData,
  errorElementData,
  errorCauseData,
  handlingData,
  staffL1Data,
  staffL2Data,
  staffData = [],
  chartFilter,
  onChartClick,
  onClearFilter,
  filteredCount = 0,
  onExportFiltered,
  allStaffListL1 = [],
  selectedStaffL1 = [],
  onStaffL1SelectionChange,
  staffCountsL1 = {},
  allStaffListL2 = [],
  selectedStaffL2 = [],
  onStaffL2SelectionChange,
  staffCountsL2 = {}
}: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<'inputStatus' | 'errorElement' | 'errorCause' | 'handling' | 'staff'>('inputStatus');

  const tabs = [
    { id: 'inputStatus', label: 'Tình trạng đầu vào', icon: ShieldAlert },
    { id: 'errorElement', label: 'Phần tử lỗi', icon: Server },
    { id: 'errorCause', label: 'Nguyên nhân lỗi', icon: Info },
    { id: 'handling', label: 'Hướng xử lý', icon: BarChart3 },
    { id: 'staff', label: 'Nhân viên (L1 & L2)', icon: Users }
  ] as const;

  const getActiveData = () => {
    switch (activeTab) {
      case 'inputStatus':
        return inputStatusData.slice(0, 15);
      case 'errorElement':
        return errorElementData.slice(0, 15);
      case 'errorCause':
        return errorCauseData.slice(0, 15);
      case 'handling':
        return handlingData.slice(0, 15);
      case 'staff':
        if (chartFilter && chartFilter.type === 'staff') {
          const single = staffData.find(d => d.name === chartFilter.value);
          return single ? [single] : [];
        }
        return staffData.slice(0, 15);
      default:
        return [];
    }
  };

  const currentData = getActiveData();

  const handleBarClick = (data: any) => {
    if (data && (data.name || (data.payload && data.payload.name))) {
      const selectedValue = data.name || data.payload.name;
      onChartClick(activeTab === 'staff' ? 'staff' : activeTab, selectedValue);
    }
  };

  // Custom tooltips to make charts premium
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
         <div className="bg-white p-3 border border-slate-900 rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.1)] font-mono">
          <p className="font-bold text-slate-900 text-xs mb-1.5 truncate max-w-xs uppercase">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-[10px] font-bold py-0.5">
              <span
                className="w-2.5 h-2.5 inline-block border border-slate-900"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="text-slate-500 uppercase">{entry.name}:</span>
              <span className="text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const [isStaffL1DropdownOpen, setIsStaffL1DropdownOpen] = useState(false);
  const [staffL1SearchQuery, setStaffL1SearchQuery] = useState('');
  const staffL1DropdownRef = useRef<HTMLDivElement>(null);

  const [isStaffL2DropdownOpen, setIsStaffL2DropdownOpen] = useState(false);
  const [staffL2SearchQuery, setStaffL2SearchQuery] = useState('');
  const staffL2DropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (staffL1DropdownRef.current && !staffL1DropdownRef.current.contains(event.target as Node)) {
        setIsStaffL1DropdownOpen(false);
      }
      if (staffL2DropdownRef.current && !staffL2DropdownRef.current.contains(event.target as Node)) {
        setIsStaffL2DropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStaffListL1 = allStaffListL1.filter(name =>
    name.toLowerCase().includes(staffL1SearchQuery.toLowerCase())
  );

  const filteredStaffListL2 = allStaffListL2.filter(name =>
    name.toLowerCase().includes(staffL2SearchQuery.toLowerCase())
  );

  const handleToggleStaffL1 = (name: string) => {
    if (selectedStaffL1.includes(name)) {
      onStaffL1SelectionChange(selectedStaffL1.filter(s => s !== name));
    } else {
      onStaffL1SelectionChange([...selectedStaffL1, name]);
    }
  };

  const handleToggleStaffL2 = (name: string) => {
    if (selectedStaffL2.includes(name)) {
      onStaffL2SelectionChange(selectedStaffL2.filter(s => s !== name));
    } else {
      onStaffL2SelectionChange([...selectedStaffL2, name]);
    }
  };

  const handleSelectAllStaffL1 = () => {
    onStaffL1SelectionChange([...allStaffListL1]);
  };

  const handleClearAllStaffL1 = () => {
    onStaffL1SelectionChange([]);
  };

  const handleSelectAllStaffL2 = () => {
    onStaffL2SelectionChange([...allStaffListL2]);
  };

  const handleClearAllStaffL2 = () => {
    onStaffL2SelectionChange([]);
  };

  return (
    <div className="bg-white rounded-none border border-slate-900 p-6 shadow-[4px_4px_0px_rgba(15,23,42,0.1)]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <h3 className="text-md font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="text-slate-900 h-5 w-5" />
            Biểu đồ thống kê kết quả phân tích
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            So sánh dữ liệu tổng hợp Lần 1 (Báo hỏng ban đầu) và Lần 2 (Phiếu CLPS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Dropdown Lần 2 (CLL) internally L1 */}
          {allStaffListL1.length > 0 && (
            <div className="flex items-center gap-2 relative z-50 animate-fade-in" ref={staffL1DropdownRef}>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">CL BAN ĐẦU:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffL1DropdownOpen(!isStaffL1DropdownOpen);
                    setIsStaffL2DropdownOpen(false); // Close other dropdown
                  }}
                  className="bg-white border border-slate-900 rounded-none px-4 py-2 text-[11px] font-mono font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:bg-slate-50 active:translate-y-0.5 cursor-pointer flex items-center gap-2 min-w-[200px] justify-between"
                >
                  <span className="truncate max-w-[140px]">
                    {selectedStaffL1.length === 0
                      ? 'TẤT CẢ (LẦN 2)'
                      : `ĐÃ CHỌN (${selectedStaffL1.length}) NV`}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {isStaffL1DropdownOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isStaffL1DropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border border-slate-900 w-72 shadow-[4px_4px_0px_rgba(15,23,42,0.15)] flex flex-col max-h-80 z-50">
                    <div className="p-2 border-b border-slate-200 bg-slate-50">
                      <div className="relative flex items-center">
                        <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="TÌM TÊN NV LẦN 2..."
                          value={staffL1SearchQuery}
                          onChange={(e) => setStaffL1SearchQuery(e.target.value)}
                          className="w-full border border-slate-900 rounded-none pl-8 pr-2 py-1.5 bg-white text-[10px] font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 px-1 text-[9px] font-black uppercase font-mono border-t border-slate-200 pt-2">
                        <button
                          type="button"
                          onClick={handleSelectAllStaffL1}
                          className="text-emerald-700 hover:underline cursor-pointer"
                        >
                          ☑ Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllStaffL1}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          ☐ Bỏ chọn tất cả
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-56 divide-y divide-slate-100 p-1 bg-white">
                      {filteredStaffListL1.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 italic text-[10px] uppercase font-mono">
                          Không tìm thấy nhân viên
                        </div>
                      ) : (
                        filteredStaffListL1.map(name => {
                          const isChecked = selectedStaffL1.includes(name);
                          const totalCount = staffCountsL1[name] || 0;
                          return (
                            <label
                              key={name}
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer transition-all hover:bg-slate-50 ${
                                isChecked ? 'bg-emerald-50/50 font-black text-emerald-950' : 'text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStaffL1(name)}
                                className="rounded-none border-slate-900 text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                              />
                              <span className="text-[11px] tracking-wide uppercase font-mono flex-1 truncate">
                                {name}
                              </span>
                              <span className="text-[9px] font-bold font-mono text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                                {totalCount}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dropdown Lần 1 (CLPS) internally L2 */}
          {allStaffListL2.length > 0 && (
            <div className="flex items-center gap-2 relative z-50 animate-fade-in" ref={staffL2DropdownRef}>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">CLL:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffL2DropdownOpen(!isStaffL2DropdownOpen);
                    setIsStaffL1DropdownOpen(false); // Close other dropdown
                  }}
                  className="bg-white border border-slate-900 rounded-none px-4 py-2 text-[11px] font-mono font-bold uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:bg-slate-50 active:translate-y-0.5 cursor-pointer flex items-center gap-2 min-w-[200px] justify-between"
                >
                  <span className="truncate max-w-[140px]">
                    {selectedStaffL2.length === 0
                      ? 'TẤT CẢ (LẦN 1)'
                      : `ĐÃ CHỌN (${selectedStaffL2.length}) NV`}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {isStaffL2DropdownOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isStaffL2DropdownOpen && (
                  <div className="absolute right-0 mt-1 bg-white border border-slate-900 w-72 shadow-[4px_4px_0px_rgba(15,23,42,0.15)] flex flex-col max-h-80 z-50">
                    <div className="p-2 border-b border-slate-200 bg-slate-50">
                      <div className="relative flex items-center">
                        <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="TÌM TÊN NV LẦN 1..."
                          value={staffL2SearchQuery}
                          onChange={(e) => setStaffL2SearchQuery(e.target.value)}
                          className="w-full border border-slate-900 rounded-none pl-8 pr-2 py-1.5 bg-white text-[10px] font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 px-1 text-[9px] font-black uppercase font-mono border-t border-slate-200 pt-2">
                        <button
                          type="button"
                          onClick={handleSelectAllStaffL2}
                          className="text-emerald-700 hover:underline cursor-pointer"
                        >
                          ☑ Chọn tất cả
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllStaffL2}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          ☐ Bỏ chọn tất cả
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 max-h-56 divide-y divide-slate-100 p-1 bg-white">
                      {filteredStaffListL2.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 italic text-[10px] uppercase font-mono">
                          Không tìm thấy nhân viên
                        </div>
                      ) : (
                        filteredStaffListL2.map(name => {
                          const isChecked = selectedStaffL2.includes(name);
                          const totalCount = staffCountsL2[name] || 0;
                          return (
                            <label
                              key={name}
                              className={`flex items-center gap-2.5 px-2.5 py-1.5 cursor-pointer transition-all hover:bg-slate-50 ${
                                isChecked ? 'bg-emerald-50/50 font-black text-emerald-950' : 'text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStaffL2(name)}
                                className="rounded-none border-slate-900 text-emerald-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                              />
                              <span className="text-[11px] tracking-wide uppercase font-mono flex-1 truncate">
                                {name}
                              </span>
                              <span className="text-[9px] font-bold font-mono text-slate-400 shrink-0 bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                                {totalCount}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-none border border-slate-200 font-mono">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (chartFilter && chartFilter.type === 'staff' && tab.id !== 'staff') {
                      onClearFilter();
                    }
                  }}
                  className={`flex items-center gap-2 text-[10px] font-bold px-3.5 py-2 rounded-none transition-all duration-100 cursor-pointer uppercase tracking-wider ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {chartFilter && (
        <div className="mb-5 bg-slate-50 border border-slate-900 p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] font-bold shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-900">
              <span className="w-2.5 h-2.5 bg-emerald-500 border border-slate-900 animate-pulse"></span>
              <span>ĐANG LỌC THEO "{tabs.find(t => t.id === chartFilter.type)?.label.toUpperCase()}": {chartFilter.value.toUpperCase()}</span>
            </div>

            {onExportFiltered && (
              <button
                onClick={onExportFiltered}
                className="bg-emerald-600 hover:bg-emerald-700 border border-slate-900 text-white font-mono font-bold text-[10px] px-3 py-1 rounded-none transition-all duration-100 uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-[1px_1px_0px_rgba(0,0,0,0.1)] active:translate-y-0.5"
              >
                <Download className="h-3 w-3" />
                Số dòng lọc: {filteredCount} - TẢI FILE EXCEL LỌC
              </button>
            )}
          </div>
          <button
            onClick={onClearFilter}
            className="text-red-600 hover:text-red-800 uppercase tracking-widest underline decoration-2 cursor-pointer transition-colors"
          >
            ❌ XÓA BỘ LỌC BIỂU ĐỒ
          </button>
        </div>
      )}

      {/* Render Chart Area */}
      <div className="h-[580px] w-full">
        {currentData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 font-mono">
            <Info className="h-8 w-8 stroke-1 text-slate-300" />
            <p className="text-xs font-bold uppercase tracking-wider">Chưa có dữ liệu để thể hiện biểu đồ</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {/* For categorical lists, dynamic values might be long, so horizontal layouts are best for reading, but for Tình trạng đầu vào, standard vertical bar is perfectly compact. Let's adapt dynamically! */}
            {activeTab === 'inputStatus' ? (
              <BarChart
                data={currentData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  fontWeight={800}
                  fontFamily="monospace"
                  stroke="#1e293b"
                  tickLine={false}
                />
                <YAxis
                  fontSize={11}
                  fontWeight={800}
                  fontFamily="monospace"
                  stroke="#1e293b"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="square"
                  iconSize={12}
                  wrapperStyle={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '10px' }}
                />
                <Bar
                  dataKey="Lần 1"
                  name="Lần 1 (Báo hỏng)"
                  fill="#0f172a"
                  maxBarSize={64}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="Lần 2"
                  name="Lần 2 (CLPS)"
                  fill="#10b981"
                  maxBarSize={64}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                />
              </BarChart>
            ) : (
              // Horizontal Layout is extremely readable for long labels like "Đứt cáp quang thuê bao", "Wifi chập chờn..."
              <BarChart
                data={currentData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  fontSize={11}
                  fontWeight={800}
                  fontFamily="monospace"
                  stroke="#1e293b"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  fontWeight={800}
                  fontFamily="monospace"
                  stroke="#1e293b"
                  tickLine={false}
                  width={200}
                  tickFormatter={(tick) => (tick.length > 28 ? `${tick.slice(0, 26)}...` : tick)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="square"
                  iconSize={12}
                  wrapperStyle={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '10px' }}
                />
                <Bar
                  dataKey="Lần 1"
                  name="Lần 1 (Báo hỏng)"
                  fill="#0f172a"
                  maxBarSize={24}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                />
                <Bar
                  dataKey="Lần 2"
                  name="Lần 2 (CLPS)"
                  fill="#10b981"
                  maxBarSize={24}
                  onClick={handleBarClick}
                  className="cursor-pointer"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Explanatory footer */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-[10px] text-slate-500 font-mono font-bold uppercase">
        <Info className="h-4 w-4 text-slate-700 shrink-0" />
        <span>Gợi ý: Biểu đồ thể hiện phân bố dựa trên các bản ghi được ghép nối. Di chuột lên cột để xem chi tiết số lượng.</span>
      </div>
    </div>
  );
}
