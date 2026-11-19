import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Table2, 
  AlertTriangle, 
  Sparkles, 
  Award, 
  FileText, 
  History, 
  Settings as SettingsIcon,
  Home,
  ShieldCheck,
  Wrench
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, activeDataset, isAnalyzed }) {
  // Streamlined, functional navigation items
  const mainNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Dataset', icon: UploadCloud },
    { id: 'issues', label: 'Issues & Anomalies', icon: AlertTriangle, disabled: !isAnalyzed },
    { id: 'cleaning', label: 'Clean Dataset', icon: Wrench, disabled: !isAnalyzed },
    { id: 'profiling', label: 'Data Profiling', icon: Table2, disabled: !activeDataset },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles, disabled: !isAnalyzed },
    { id: 'reports', label: 'Reports & Export', icon: FileText, disabled: !isAnalyzed },
  ];

  const bottomNavItems = [
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-md shadow-brand-500/20">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            DataGuard <span className="text-brand-600 dark:text-brand-400">AI</span>
          </span>
          <p className="text-[10px] font-medium text-slate-400">Clean Data. Confident Decisions.</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="pb-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Main Menu
          </span>
        </div>

        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'issues' && currentTab === 'anomalies');
          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => setCurrentTab(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : item.disabled
                  ? 'cursor-not-allowed opacity-40 text-slate-400 dark:text-slate-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'cleaning' && isAnalyzed && (
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-brand-400'}`} />
              )}
            </button>
          );
        })}

        <div className="pt-4 pb-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            System & History
          </span>
        </div>

        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setCurrentTab('landing')}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all mt-2"
        >
          <Home className="h-4 w-4 text-slate-400" />
          <span>Landing Page</span>
        </button>
      </nav>

      {/* Active Dataset Status Footer */}
      {activeDataset && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="truncate max-w-[130px]">{activeDataset.filename}</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {activeDataset.total_rows} rows • {activeDataset.total_columns} cols
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
