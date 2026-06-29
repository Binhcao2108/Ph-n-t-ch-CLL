import { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import DashboardStats from './DashboardStats';
import { MergedRecord } from '../types';
import { calculateStatistics } from '../utils/excelProcessor';
import { Database, TrendingUp, BarChart3, Activity, AlertTriangle, Wrench, Filter, Plus, X, Pencil } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
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

type CustomGroup = {
  id: string;
  categoryId: 'inputStatus' | 'errorCause' | 'handling';
  name: string;
  keys: string[];
};

type GroupBuilderState = {
  id?: string;
  categoryId: 'inputStatus' | 'errorCause' | 'handling';
  name: string;
  selectedKeys: string[];
};

const CustomTooltip = ({ active, payload, label, options }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border text-left border-slate-900 rounded-none shadow-[4px_4px_0px_rgba(15,23,42,0.1)] p-3 text-xs font-mono min-w-[200px] z-50">
        <p className="font-bold border-b border-slate-200 pb-2 mb-2 text-slate-800">{label}</p>
        <div className="space-y-3">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'Trend_L1' || entry.dataKey === 'Trend_L2') {
              return (
                <div key={index} className="flex items-center gap-2 font-bold mt-2 pt-2 border-t border-slate-100" style={{ color: entry.color }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              );
            }

            const opt = options.find((o: any) => o.id === entry.dataKey);
            const isGroup = opt?.isGroup;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2 font-bold" style={{ color: entry.color }}>
                  <div className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: entry.color }} />
                  <span>{opt?.label || entry.name}: {entry.value}</span>
                </div>
                {isGroup && opt.originalKeys && (
                  <div className="pl-4 space-y-1.5 border-l-2 border-slate-100 ml-1 mt-1.5 pb-1">
                    {opt.originalKeys.map((k: string) => {
                      const val = entry.payload[k] || 0;
                      if (val > 0) {
                        return (
                          <div key={k} className="flex justify-between items-start gap-4 text-[10px] text-slate-600 font-sans">
                            <span className="truncate max-w-[200px]" title={k}>• {k}</span>
                            <span className="font-bold font-mono bg-slate-100 px-1 py-0.5 min-w-[20px] text-center text-slate-800">{val}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const INITIAL_CUSTOM_GROUPS: CustomGroup[] = [
  {
    id: 'group_fpl',
    categoryId: 'inputStatus',
    name: 'FPL',
    keys: [
      'Lỗi không sử dụng được tính năng điều khiển giọng nói', 
      'Lỗi kết nối BOX và TV (TV không nhận tín hiệu từ Box)',
      'Truyền hình không xem được tất cả kênh',
      'Portal màn hình đen không có logo FPT',
      'Truyền hình mất hình/ mất tiếng một vài kênh',
      'Truyền hình mất hình/ mất tiếng tất cả kênh',
      'Truyền hình giật xé hình/ méo tiếng',
      'Lỗi App - Xem camera báo lỗi ngoại tuyến',
      'Lỗi BOX không kết nối được Net (lỗi kết nối dịch vụ)',
      'Truyền hình không xem được một vài kênh',
      'KH cần thay/ lắp đặt, kết nối BOX',
      'Đăng nhập vượt quá thiết bị',
      'Lỗi ứng dụng trên BOX (Youtube, vnexpress, ...)',
      'Box IPTV (Linux) - Mã lỗi - 2017',
      'Lỗi hệ thống FPT Play - Lỗi update firmware',
      'Lỗi hệ thống FPT Play - Xem đứng hình giật hình',
      'Portal màn hình đen có logo FPT',
      'Portal không load được đầy đủ hình ảnh',
      'Android (Box OTT, SmartTV, Mobile) mã lỗi - 2',
      'Lỗi hệ thống FPT Play - Không xem được phim truyện/ Truyền hình',
      'VOD không xem được (phim truyện, TH xem lại, ...)',
      'Lỗi App FPT Play trên TV/Mobile'
    ]
  },
  {
    id: 'group_fli',
    categoryId: 'inputStatus',
    name: 'FLI',
    keys: [
      '[CMR] KH xem camera báo ngoại tuyến (CMR ngoại tuyến)',
      '[CMR] Không xem lại được FULL',
      '[CMR] Không xem được live',
      '[CMR] KH yêu cầu di chuyển vị trí FPT Camera',
      '[CMR] KH cần thay/cài đặt/kết nối camera',
      '[CMR] Không thể thêm được camera',
      '[CMR] KH đã thanh toán, HĐ đã nhận code, nhưng KH chưa nhận được code',
      '[CMR-VMS] sai tài khoản/ mật khẩu',
      '[CMR] Hình ảnh bị giật, xé hình, nhòe màu, chất lượng hình ảnh kém',
      'Lỗi App - Lỗi đăng nhập',
      '[CMR] KH có nhu cầu chỉnh góc Camera',
      'Hướng dẫn xem lại',
      '[CMR] Cảnh báo nhận diện người không chính xác',
      '[CMR] Có cảnh báo về máy nhưng không có clip chuyển động',
      '[CMR] Không có cảnh báo & clip chuyển động',
      'Hướng dẫn tải video',
      '[CMR] Không lên nguồn',
      'Kích hoạt tài khoản',
      '[CMR] Không load được video khoảnh khắc',
      '[CMR] KH cần hướng dẫn sử dụng Camera, App',
      'Lỗi thiết bị FPT Camera',
      '[CMR] Camera bị ám tím',
      '[CMR] Không kết nối được mạng LAN/Wifi',
      'Lỗi App',
      '[CMR] Lỗi đăng nhập - Không nhận được OTP',
      '[CMR] có vấn đề về đàm thoại (rè, hú, có tiếng nước sôi, loa bé, míc bé ...)',
      '[CMR] Kết nối được LAN (Wifi) nhưng không đẩy lên được cloud',
      '[CMR-VMS] NVR ngoại tuyến'
    ]
  },
  {
    id: 'group_mang_cham',
    categoryId: 'inputStatus',
    name: 'Mạng Chậm',
    keys: [
      'WiFi sóng yếu hoặc chập chờn',
      'Truy cập mạng chậm hoặc chập chờn',
      'Không sử dụng được internet',
      'Wifi sóng tốt - kết nối được nhưng truy cập chậm hoặc chập chờn',
      'WiFi sóng tốt nhưng không kết nối được wifi',
      'Lỗi hệ thống - Có tín hiệu quang nhưng không IP WAN',
      'Wifi không thấy sóng',
      'Wifi sóng tốt - kết nối được nhưng không truy cập được Internet',
      'Có tín hiệu quang nhưng IP WAN 169.254.x.x',
      'Có tín hiệu quang nhưng không IP WAN',
      'Không truy cập được một số dịch vụ hoặc website',
      'Lỗi hệ thống - Lỗi truy cập web',
      'Truy cập các dịch vụ quốc Tế chập chờn(Facebook, youtube, tiktok, ...)',
      'Có IP WAN, không truy cập được',
      'Có tín hiệu quang nhưng không ổn định / suy hao không đạt chuẩn',
      'Game Lag'
    ]
  },
  {
    id: 'group_vat_ly',
    categoryId: 'inputStatus',
    name: 'Vật Lý',
    keys: [
      'Không có tín hiệu quang (mkn)',
      'Tín hiệu Không ổn định, suy hao Không đạt chuẩn',
      'KH yêu cầu di chuyển dây thuê bao (lastmile)',
      'KH yêu cầu di chuyển dây/ hộp',
      'Rớt phiên kết nối liên tục/ rớt định kỳ',
      'Lỗi hệ thống - Lỗi POP'
    ]
  },
  {
    id: 'group_hiefpt',
    categoryId: 'inputStatus',
    name: 'Lỗi HIFPT',
    keys: [
      'Lỗi ứng dụng Hi FPT - Không ghi nhận thông tin modem',
      'Lỗi App - Không ghi nhận thông tin modem',
      'Lỗi ứng dụng Hi FPT - Lỗi chức năng quản lý thiết bị',
      'Không liên kết được hợp đồng'
    ]
  },
  {
    id: 'group_khac',
    categoryId: 'inputStatus',
    name: 'Khác',
    keys: [
      '(Trống)',
      'Chương trình KH thân thiết',
      'Dịch vụ của đối tác (Mua bán, bảo dưỡng, ...)'
    ]
  }
];

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
          id: tab.id,
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

    const rawData = tabsDataPayload.filter(tab => tab.records.length > 0).map(tab => {
      const stats = calculateStatistics(tab.records);
      return { tab, stats };
    });

    rawData.forEach(({ stats }) => {
      stats.chartInputStatus.forEach((item: any) => inputStatusKeys.add(item.name));
      stats.chartErrorCause.forEach((item: any) => errorCauseKeys.add(item.name));
      stats.chartHandling.forEach((item: any) => handlingKeys.add(item.name));
    });

    rawData.forEach(({ tab, stats }) => {
      const isEntry: any = { name: tab.name };
      inputStatusKeys.forEach(k => { isEntry[k] = 0; isEntry[`${k}_L1`] = 0; isEntry[`${k}_L2`] = 0; });
      stats.chartInputStatus.forEach((item: any) => {
        isEntry[item.name] = (item['Lần 1'] || 0) + (item['Lần 2'] || 0);
        isEntry[`${item.name}_L1`] = item['Lần 1'] || 0;
        isEntry[`${item.name}_L2`] = item['Lần 2'] || 0;
      });
      inputStatusData.push(isEntry);

      const causeEntry: any = { name: tab.name };
      errorCauseKeys.forEach(k => { causeEntry[k] = 0; causeEntry[`${k}_L1`] = 0; causeEntry[`${k}_L2`] = 0; });
      stats.chartErrorCause.forEach((item: any) => {
        causeEntry[item.name] = (item['Lần 1'] || 0) + (item['Lần 2'] || 0);
        causeEntry[`${item.name}_L1`] = item['Lần 1'] || 0;
        causeEntry[`${item.name}_L2`] = item['Lần 2'] || 0;
      });
      errorCauseData.push(causeEntry);

      const handlingEntry: any = { name: tab.name };
      handlingKeys.forEach(k => { handlingEntry[k] = 0; handlingEntry[`${k}_L1`] = 0; handlingEntry[`${k}_L2`] = 0; });
      stats.chartHandling.forEach((item: any) => {
        handlingEntry[item.name] = (item['Lần 1'] || 0) + (item['Lần 2'] || 0);
        handlingEntry[`${item.name}_L1`] = item['Lần 1'] || 0;
        handlingEntry[`${item.name}_L2`] = item['Lần 2'] || 0;
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

  const [selectedInputStatusKeys, setSelectedInputStatusKeys] = useState<string[]>([]);
  const [selectedErrorCauseKeys, setSelectedErrorCauseKeys] = useState<string[]>([]);
  const [selectedHandlingKeys, setSelectedHandlingKeys] = useState<string[]>([]);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>(INITIAL_CUSTOM_GROUPS);
  const [groupBuilder, setGroupBuilder] = useState<GroupBuilderState | null>(null);
  const [initialized, setInitialized] = useState(false);

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const chartRenderData = useMemo(() => {
    const process = (categoryId: 'inputStatus' | 'errorCause' | 'handling', rawData: any[], rawKeys: string[]) => {
      const groups = customGroups.filter(g => g.categoryId === categoryId);
      const data = rawData.map(monthData => {
        const newData = { ...monthData };
        groups.forEach(g => {
          newData[g.id] = g.keys.reduce((sum: number, k: string) => sum + ((newData[k] as number) || 0), 0);
          newData[`${g.id}_L1`] = g.keys.reduce((sum: number, k: string) => sum + ((newData[`${k}_L1`] as number) || 0), 0);
          newData[`${g.id}_L2`] = g.keys.reduce((sum: number, k: string) => sum + ((newData[`${k}_L2`] as number) || 0), 0);
        });
        return newData;
      });
      const options = [
        ...groups.map(g => ({ id: g.id, label: g.name, isGroup: true, originalKeys: g.keys })),
        ...rawKeys.map(k => ({ id: k, label: k, isGroup: false, originalKeys: undefined }))
      ];
      return { data, options, groups };
    };

    return {
      inputStatus: process('inputStatus', monthlyDetailedStats.inputStatusData, monthlyDetailedStats.inputStatusKeys),
      errorCause: process('errorCause', monthlyDetailedStats.errorCauseData, monthlyDetailedStats.errorCauseKeys),
      handling: process('handling', monthlyDetailedStats.handlingData, monthlyDetailedStats.handlingKeys),
    };
  }, [monthlyDetailedStats, customGroups]);

  useEffect(() => {
    if (!initialized && monthlyDetailedStats.inputStatusKeys.length > 0) {
      setSelectedInputStatusKeys(INITIAL_CUSTOM_GROUPS.filter(g => g.categoryId === 'inputStatus').map(g => g.id));
      setSelectedErrorCauseKeys(monthlyDetailedStats.errorCauseKeys.slice(0, 5));
      setSelectedHandlingKeys(monthlyDetailedStats.handlingKeys.slice(0, 5));
      setInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyDetailedStats.inputStatusKeys.length, initialized]);

  const toggleKey = (key: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(key)) {
      setList(list.filter(k => k !== key));
    } else {
      setList([...list, key]);
    }
  };

  const handleAnalyze = async () => {
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      // Build a minimal payload with only selected items for AI to analyze
      const payload = {
        months: chartRenderData.inputStatus.data.map(d => d.name),
        inputStatus: chartRenderData.inputStatus.data.map((d: any) => {
          const res: any = { month: d.name };
          selectedInputStatusKeys.forEach(k => {
            const opt = chartRenderData.inputStatus.options.find(o => o.id === k);
            res[opt?.label || k] = d[k];
          });
          return res;
        }),
        errorCause: chartRenderData.errorCause.data.map((d: any) => {
          const res: any = { month: d.name };
          selectedErrorCauseKeys.forEach(k => {
            const opt = chartRenderData.errorCause.options.find(o => o.id === k);
            res[opt?.label || k] = d[k];
          });
          return res;
        }),
        handling: chartRenderData.handling.data.map((d: any) => {
          const res: any = { month: d.name };
          selectedHandlingKeys.forEach(k => {
            const opt = chartRenderData.handling.options.find(o => o.id === k);
            res[opt?.label || k] = d[k];
          });
          return res;
        })
      };

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }
      setAiAnalysisResult(data.analysis);
    } catch (err: any) {
      setAiAnalysisResult(`**Lỗi khi phân tích:**\n\n${err.message}\n\nVui lòng thử lại sau hoặc kiểm tra cấu hình.`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSaveGroup = () => {
    if (!groupBuilder || !groupBuilder.name || groupBuilder.selectedKeys.length === 0) return;
    
    if (groupBuilder.id) {
      // Edit existing
      setCustomGroups(prev => prev.map(g => 
        g.id === groupBuilder.id 
          ? { ...g, name: groupBuilder.name, keys: groupBuilder.selectedKeys }
          : g
      ));
    } else {
      // Create new
      const newGroup: CustomGroup = {
        id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        categoryId: groupBuilder.categoryId,
        name: groupBuilder.name,
        keys: groupBuilder.selectedKeys
      };
      setCustomGroups([...customGroups, newGroup]);
      
      if (groupBuilder.categoryId === 'inputStatus') setSelectedInputStatusKeys(prev => [...prev, newGroup.id]);
      if (groupBuilder.categoryId === 'errorCause') setSelectedErrorCauseKeys(prev => [...prev, newGroup.id]);
      if (groupBuilder.categoryId === 'handling') setSelectedHandlingKeys(prev => [...prev, newGroup.id]);
    }
    
    setGroupBuilder(null);
  };

  const handleEditGroup = (e: React.MouseEvent, id: string, categoryId: 'inputStatus' | 'errorCause' | 'handling') => {
    e.stopPropagation();
    const group = customGroups.find(g => g.id === id);
    if (group) {
      setGroupBuilder({ id: group.id, categoryId, name: group.name, selectedKeys: group.keys });
    }
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCustomGroups(prev => prev.filter(g => g.id !== id));
    setSelectedInputStatusKeys(prev => prev.filter(k => k !== id));
    setSelectedErrorCauseKeys(prev => prev.filter(k => k !== id));
    setSelectedHandlingKeys(prev => prev.filter(k => k !== id));
  };

  const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#10b981', '#64748b', '#0ea5e9'];
  const getColor = (key: string, keysArray: string[]) => COLORS[keysArray.indexOf(key) % COLORS.length];

  const renderGroupBuilder = (categoryId: 'inputStatus' | 'errorCause' | 'handling', rawKeys: string[]) => {
    if (groupBuilder?.categoryId !== categoryId) return null;

    const otherGroupsUsedKeys = new Set(
      customGroups
        .filter(g => g.categoryId === categoryId && g.id !== groupBuilder.id)
        .flatMap(g => g.keys)
    );
    const availableKeys = rawKeys.filter(key => !otherGroupsUsedKeys.has(key));

    return (
      <div className="border border-emerald-200 bg-emerald-50/50 p-3 mb-3 relative rounded-none shadow-sm">
        <button onClick={() => setGroupBuilder(null)} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        <div className="text-[10px] font-bold text-emerald-800 uppercase mb-2">{groupBuilder.id ? 'Sửa nhóm hiển thị' : 'Tạo nhóm hiển thị mới'}</div>
        <input 
          type="text" 
          placeholder="Tên nhóm (VD: Lỗi phần cứng...)" 
          value={groupBuilder.name}
          onChange={e => setGroupBuilder({ ...groupBuilder, name: e.target.value })}
          className="w-full text-xs p-2 border border-emerald-200 rounded-none mb-2 outline-none focus:border-emerald-500 bg-white"
        />
        <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Chọn các trường để gộp nhóm:</div>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 border border-slate-200 bg-white">
          {availableKeys.map(key => {
            const isSelected = groupBuilder.selectedKeys.includes(key);
            return (
              <button
                key={key}
                onClick={() => {
                  const newKeys = isSelected 
                    ? groupBuilder.selectedKeys.filter(k => k !== key)
                    : [...groupBuilder.selectedKeys, key];
                  setGroupBuilder({ ...groupBuilder, selectedKeys: newKeys });
                }}
                className={`px-1.5 py-0.5 text-[9px] font-bold transition-colors ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {key}
              </button>
            );
          })}
        </div>
        <button 
          disabled={!groupBuilder.name || groupBuilder.selectedKeys.length === 0}
          onClick={handleSaveGroup}
          className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase disabled:opacity-50 hover:bg-emerald-700 transition-colors"
        >
          {groupBuilder.id ? 'Lưu Thay Đổi' : 'Lưu Nhóm Này'}
        </button>
      </div>
    );
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
                    <tr key={mon.id} className={`hover:bg-slate-50 transition-colors ${index !== monthlyData.length - 1 ? 'border-b border-slate-200' : ''}`}>
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
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Tình trạng đầu vào theo tháng</h3>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chọn nguyên nhân hiển thị:</span>
                    </div>
                    <button 
                      onClick={() => setGroupBuilder({ categoryId: 'inputStatus', name: '', selectedKeys: [] })}
                      className="text-[10px] text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" /> Tạo nhóm
                    </button>
                  </div>
                  {renderGroupBuilder('inputStatus', monthlyDetailedStats.inputStatusKeys)}
                  <div className="flex flex-wrap gap-1.5">
                    {chartRenderData.inputStatus.options.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => toggleKey(opt.id, selectedInputStatusKeys, setSelectedInputStatusKeys)}
                        className={`px-2 py-1 text-[10px] font-bold border transition-colors flex items-center gap-1 ${selectedInputStatusKeys.includes(opt.id) ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}
                        title={opt.isGroup ? `Gồm: ${opt.originalKeys?.join(', ')}` : ''}
                      >
                        {opt.isGroup && <span className="bg-emerald-600 text-white px-1 py-0.5 rounded-sm text-[8px] leading-none uppercase">Nhóm</span>}
                        {opt.label}
                        {opt.isGroup && (
                          <div className="flex items-center ml-1 space-x-0.5">
                            <span onClick={(e) => handleEditGroup(e, opt.id, 'inputStatus')} className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-200 rounded-full w-4 h-4 inline-flex items-center justify-center" title="Sửa nhóm"><Pencil className="w-2.5 h-2.5" /></span>
                            <span onClick={(e) => handleDeleteGroup(e, opt.id)} className="text-emerald-600 hover:text-rose-600 hover:bg-rose-100 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none" title="Xóa nhóm">×</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartRenderData.inputStatus.data.map(d => ({
                        ...d,
                        Trend_L1: selectedInputStatusKeys.reduce((s, k) => s + (d[`${k}_L1`] || 0), 0),
                        Trend_L2: selectedInputStatusKeys.reduce((s, k) => s + (d[`${k}_L2`] || 0), 0)
                      }))} 
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip content={<CustomTooltip options={chartRenderData.inputStatus.options} />} />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      {selectedInputStatusKeys.map((key) => {
                        const opt = chartRenderData.inputStatus.options.find(o => o.id === key);
                        return <Bar key={key} dataKey={key} name={opt?.label || key} fill={getColor(key, chartRenderData.inputStatus.options.map(o=>o.id))} maxBarSize={40} />;
                      })}
                      <Line type="monotone" dataKey="Trend_L1" name="Tổng Lần 1 (Đã chọn)" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Trend_L2" name="Tổng Lần 2 (Đã chọn)" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Error Cause Chart */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Nguyên nhân lỗi theo tháng</h3>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chọn nguyên nhân hiển thị:</span>
                    </div>
                    <button 
                      onClick={() => setGroupBuilder({ categoryId: 'errorCause', name: '', selectedKeys: [] })}
                      className="text-[10px] text-amber-600 font-bold hover:text-amber-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" /> Tạo nhóm
                    </button>
                  </div>
                  {renderGroupBuilder('errorCause', monthlyDetailedStats.errorCauseKeys)}
                  <div className="flex flex-wrap gap-1.5">
                    {chartRenderData.errorCause.options.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => toggleKey(opt.id, selectedErrorCauseKeys, setSelectedErrorCauseKeys)}
                        className={`px-2 py-1 text-[10px] font-bold border transition-colors flex items-center gap-1 ${selectedErrorCauseKeys.includes(opt.id) ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}
                        title={opt.isGroup ? `Gồm: ${opt.originalKeys?.join(', ')}` : ''}
                      >
                        {opt.isGroup && <span className="bg-amber-600 text-white px-1 py-0.5 rounded-sm text-[8px] leading-none uppercase">Nhóm</span>}
                        {opt.label}
                        {opt.isGroup && (
                          <div className="flex items-center ml-1 space-x-0.5">
                            <span onClick={(e) => handleEditGroup(e, opt.id, 'errorCause')} className="text-amber-600 hover:text-amber-800 hover:bg-amber-200 rounded-full w-4 h-4 inline-flex items-center justify-center" title="Sửa nhóm"><Pencil className="w-2.5 h-2.5" /></span>
                            <span onClick={(e) => handleDeleteGroup(e, opt.id)} className="text-amber-600 hover:text-rose-600 hover:bg-rose-100 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none" title="Xóa nhóm">×</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartRenderData.errorCause.data.map(d => ({
                        ...d,
                        Trend_L1: selectedErrorCauseKeys.reduce((s, k) => s + (d[`${k}_L1`] || 0), 0),
                        Trend_L2: selectedErrorCauseKeys.reduce((s, k) => s + (d[`${k}_L2`] || 0), 0)
                      }))} 
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip content={<CustomTooltip options={chartRenderData.errorCause.options} />} />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      {selectedErrorCauseKeys.map((key) => {
                        const opt = chartRenderData.errorCause.options.find(o => o.id === key);
                        return <Bar key={key} dataKey={key} name={opt?.label || key} fill={getColor(key, chartRenderData.errorCause.options.map(o=>o.id))} maxBarSize={40} />;
                      })}
                      <Line type="monotone" dataKey="Trend_L1" name="Tổng Lần 1 (Đã chọn)" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Trend_L2" name="Tổng Lần 2 (Đã chọn)" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Handling Chart */}
              <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col">
                <div className="border-b border-slate-900 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-rose-500" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Hướng xử lý theo tháng</h3>
                  </div>
                </div>
                <div className="px-4 py-3 bg-white border-b border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chọn hướng xử lý hiển thị:</span>
                    </div>
                    <button 
                      onClick={() => setGroupBuilder({ categoryId: 'handling', name: '', selectedKeys: [] })}
                      className="text-[10px] text-rose-600 font-bold hover:text-rose-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                      <Plus className="w-3 h-3" /> Tạo nhóm
                    </button>
                  </div>
                  {renderGroupBuilder('handling', monthlyDetailedStats.handlingKeys)}
                  <div className="flex flex-wrap gap-1.5">
                    {chartRenderData.handling.options.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => toggleKey(opt.id, selectedHandlingKeys, setSelectedHandlingKeys)}
                        className={`px-2 py-1 text-[10px] font-bold border transition-colors flex items-center gap-1 ${selectedHandlingKeys.includes(opt.id) ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'}`}
                        title={opt.isGroup ? `Gồm: ${opt.originalKeys?.join(', ')}` : ''}
                      >
                        {opt.isGroup && <span className="bg-rose-600 text-white px-1 py-0.5 rounded-sm text-[8px] leading-none uppercase">Nhóm</span>}
                        {opt.label}
                        {opt.isGroup && (
                          <div className="flex items-center ml-1 space-x-0.5">
                            <span onClick={(e) => handleEditGroup(e, opt.id, 'handling')} className="text-rose-600 hover:text-rose-800 hover:bg-rose-200 rounded-full w-4 h-4 inline-flex items-center justify-center" title="Sửa nhóm"><Pencil className="w-2.5 h-2.5" /></span>
                            <span onClick={(e) => handleDeleteGroup(e, opt.id)} className="text-rose-600 hover:text-rose-800 hover:bg-rose-200 rounded-full w-4 h-4 inline-flex items-center justify-center leading-none" title="Xóa nhóm">×</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4 h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={chartRenderData.handling.data.map(d => ({
                        ...d,
                        Trend_L1: selectedHandlingKeys.reduce((s, k) => s + (d[`${k}_L1`] || 0), 0),
                        Trend_L2: selectedHandlingKeys.reduce((s, k) => s + (d[`${k}_L2`] || 0), 0)
                      }))} 
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#64748b' }} />
                      <RechartsTooltip content={<CustomTooltip options={chartRenderData.handling.options} />} />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                      {selectedHandlingKeys.map((key) => {
                        const opt = chartRenderData.handling.options.find(o => o.id === key);
                        return <Bar key={key} dataKey={key} name={opt?.label || key} fill={getColor(key, chartRenderData.handling.options.map(o=>o.id))} maxBarSize={40} />;
                      })}
                      <Line type="monotone" dataKey="Trend_L1" name="Tổng Lần 1 (Đã chọn)" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Trend_L2" name="Tổng Lần 2 (Đã chọn)" stroke="#ea580c" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          {/* AI Analysis Section */}
          <section className="bg-white border border-slate-900 rounded-none overflow-hidden shadow-[4px_4px_0px_rgba(15,23,42,0.1)] flex flex-col mt-6 mb-12">
            <div className="border-b border-slate-900 bg-emerald-50 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 flex items-center justify-center bg-emerald-600 outline outline-1 outline-emerald-900">
                  <span className="text-white text-[10px] font-black">AI</span>
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">Nhận Định AI</h3>
              </div>
              <button 
                onClick={handleAnalyze} 
                className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-[2px_2px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                disabled={isAiAnalyzing}
              >
                {isAiAnalyzing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Đang Phân Tích...
                  </>
                ) : (
                  "Phân Tích Dữ Liệu"
                )}
              </button>
            </div>
            {aiAnalysisResult && (
              <div className="p-6 prose prose-sm prose-emerald max-w-none text-slate-800 font-medium">
                <div className="markdown-body">
                  <ReactMarkdown>{aiAnalysisResult}</ReactMarkdown>
                </div>
              </div>
            )}
            {!aiAnalysisResult && !isAiAnalyzing && (
              <div className="p-8 text-center text-slate-500 text-xs font-bold font-mono">
                Sau khi hiệu chỉnh các biểu đồ ở trên, nhấn "Phân Tích Dữ Liệu" để AI tổng hợp nhận định.
              </div>
            )}
          </section>

        </>
      )}
    </div>
  );
}
