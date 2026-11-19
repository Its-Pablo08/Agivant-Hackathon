import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Table2, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  Award, 
  FileText, 
  History, 
  Settings as SettingsIcon,
  Home,
  ShieldCheck,
  CheckCircle,
  Wrench
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, activeDataset, isAnalyzed }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Dataset', icon: UploadCloud },
    { id: 'profiling', label: 'Data Profiling', icon: Table2, disabled: !activeDataset },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle, disabled: !isAnalyzed },
    { id: 'issues', label: 'Issues Explorer', icon: Search, disabled: !isAnalyzed },
    { id: 'ai-insights', label: 'AI Recommendations', icon: Sparkles, disabled: !isAnalyzed },
    { id: 'scoring', label: 'Quality Score', icon: Award, disabled: !isAnalyzed },
    { id: 'cleaning', label: 'Cleaning Pipeline', icon: Wrench, disabled: !isAnalyzed },
    { id: 'reports', label: 'Reports & Export', icon: FileText, disabled: !isAnalyzed },
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

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <button
          onClick={() => setCurrentTab('landing')}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
            currentTab === 'landing'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 font-semibold'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Landing Page</span>
        </button>

        <div className="pt-2 pb-1">
          <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Analytics & Engine
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => setCurrentTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                  : item.disabled
                  ? 'cursor-not-allowed opacity-40 text-slate-400 dark:text-slate-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.id === 'scoring' && isAnalyzed && (
                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Dataset Status Footer Card */}
      {activeDataset && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current File</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${
                isAnalyzed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {isAnalyzed ? 'Scanned' : 'Pending'}
              </span>
            </div>
            <div className="truncate text-xs font-medium text-slate-800 dark:text-slate-200" title={activeDataset.filename}>
              {activeDataset.filename}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {activeDataset.total_rows} rows • {activeDataset.total_columns} columns
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
