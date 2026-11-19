import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Moon, 
  Database, 
  AlertCircle,
  CheckCircle2,
  Bell,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  currentDataset, 
  datasets = [], 
  onSelectDataset, 
  darkMode, 
  setDarkMode,
  geminiStatus,
  onOpenSettings
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="flex items-center gap-4">
        {/* Active Dataset Selector Dropdown */}
        {datasets.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Dataset:
            </span>
            <div className="relative">
              <select
                value={currentDataset?.id || ''}
                onChange={(e) => onSelectDataset(e.target.value)}
                aria-label="Select active dataset"
                className="appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.filename} ({d.total_rows} rows)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Database className="h-4 w-4 text-slate-400" />
            <span>No dataset loaded</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Gemini AI Status Badge */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            geminiStatus?.gemini_configured
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800'
          }`}
          title="Click to manage Gemini API Key"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            {geminiStatus?.gemini_configured ? 'Gemini 1.5 Active' : 'AI Engine (Rule Fallback)'}
          </span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-accent-600 text-xs font-bold text-white shadow-sm">
            DG
          </div>
          <div className="hidden text-left sm:block">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">DataGuard Pro</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">Enterprise Edition</div>
          </div>
        </div>
      </div>
    </header>
  );
}
