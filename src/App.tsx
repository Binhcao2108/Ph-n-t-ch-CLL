import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MonthTabContent from './components/MonthTabContent';
import SummaryTabContent from './components/SummaryTabContent';
import Top10TabContent from './components/Top10TabContent';
import { Plus, X, Database } from 'lucide-react';
import { MergedRecord } from './types';

type TabInfo = {
  id: string;
  name: string;
};

export default function App() {
  const [tabs, setTabs] = useState<TabInfo[]>([
    { id: 'tab-1', name: 'Tháng 1' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [tabsData, setTabsData] = useState<Record<string, MergedRecord[]>>({});

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    setTabs([...tabs, { id: newId, name: `Tháng ${tabs.length + 1}` }]);
    setActiveTabId(newId);
  };

  const removeTab = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== idToRemove);
    setTabs(newTabs);
    
    // Also cleanup data for this tab
    setTabsData(prev => {
      const copy = { ...prev };
      delete copy[idToRemove];
      return copy;
    });

    if (activeTabId === idToRemove) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const updateTabName = (id: string, newName: string) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleDataUpdate = (tabId: string, records: MergedRecord[]) => {
    setTabsData(prev => ({ ...prev, [tabId]: records }));
  };

  const allCombinedRecords = React.useMemo(() => Object.values(tabsData).flat() as MergedRecord[], [tabsData]);

  const summaryDataPayload = React.useMemo(() => tabs.map(tab => ({
    id: tab.id,
    name: tab.name,
    records: tabsData[tab.id] || []
  })), [tabs, tabsData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      <Navbar />

      {/* Tabs Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer font-bold font-mono text-xs uppercase transition-colors shrink-0 ${
                activeTabId === tab.id 
                  ? 'bg-slate-900 text-white border-2 border-slate-900' 
                  : 'bg-white text-slate-500 border-2 border-slate-300 hover:border-slate-500 hover:text-slate-900'
              }`}
            >
              <input 
                type="text" 
                value={tab.name}
                onChange={(e) => updateTabName(tab.id, e.target.value)}
                className="bg-transparent border-none outline-none text-inherit w-24 uppercase font-bold"
                onClick={(e) => e.stopPropagation()}
              />
              {tabs.length > 1 && (
                <button 
                  onClick={(e) => removeTab(e, tab.id)}
                  className="hover:bg-rose-500 hover:text-white rounded-none p-0.5 transition-colors"
                  title="Đóng tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button 
            onClick={addTab}
            className="flex items-center gap-2 px-4 py-2 cursor-pointer font-bold font-mono text-xs uppercase bg-white border-2 border-dashed border-slate-300 text-slate-500 hover:border-slate-900 hover:text-slate-900 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Thêm tháng
          </button>
          
          <div className="flex-1 w-4" /> {/* Spacer */}
          
          <button 
            onClick={() => setActiveTabId('top10-tab')}
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer font-bold font-mono text-xs uppercase transition-colors shrink-0 ${
              activeTabId === 'top10-tab' 
                ? 'bg-amber-600 text-white border-2 border-amber-600' 
                : 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:border-amber-600 hover:text-amber-900'
            }`}
          >
            <Database className="w-4 h-4" />
            TOP 10 CHỈ SỐ
          </button>

          <button 
            onClick={() => setActiveTabId('summary-tab')}
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer font-bold font-mono text-xs uppercase transition-colors shrink-0 ${
              activeTabId === 'summary-tab' 
                ? 'bg-emerald-600 text-white border-2 border-emerald-600' 
                : 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-600 hover:text-emerald-900'
            }`}
          >
            <Database className="w-4 h-4" />
            TỔNG HỢP ({allCombinedRecords.length})
          </button>
        </div>
      </div>

      <main className="flex-1 w-full relative">
        {tabs.map(tab => (
          <div key={tab.id} className={activeTabId === tab.id ? 'block' : 'hidden'}>
            <MonthTabContent 
              tabName={tab.name} 
              onDataUpdate={(records) => handleDataUpdate(tab.id, records)} 
            />
          </div>
        ))}
        <div className={activeTabId === 'summary-tab' ? 'block' : 'hidden'}>
          <SummaryTabContent tabsDataPayload={summaryDataPayload} />
        </div>
        <div className={activeTabId === 'top10-tab' ? 'block' : 'hidden'}>
          <Top10TabContent tabsDataPayload={summaryDataPayload} />
        </div>
      </main>

      <footer className="bg-white border-t-2 border-slate-900 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
          <p>© 2026 - KTCN. Tác vụ được thực thi trực tiếp trên trình duyệt.</p>
        </div>
      </footer>
    </div>
  );
}
