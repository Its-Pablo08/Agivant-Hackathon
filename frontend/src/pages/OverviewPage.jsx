import React from 'react';
import { 
  FileSpreadsheet, 
  Database, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Download,
  Zap,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

const CATEGORY_COLORS = {
  'Missing Values': '#f59e0b',
  'Duplicate Records': '#ef4444',
  'Numerical Outliers & Impossible Values': '#8b5cf6',
  'Inconsistent Values': '#3b82f6',
};

const SEVERITY_COLORS = {
  'Critical': '#ef4444',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#10b981',
};

export default function OverviewPage({ 
  dashboardStats, 
  activeDataset, 
  analysisResult, 
  onNavigate, 
  onLoadSample,
  onRunAnalysis,
  analyzing
}) {
  const stats = dashboardStats || {
    total_datasets: 1,
    total_records_processed: 500,
    total_issues_detected: 147,
    average_quality_score: 72.4,
    category_distribution: {},
    severity_distribution: {},
    recent_scans: []
  };

  // Prepare chart data
  const categoryData = Object.entries(stats.category_distribution || {}).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#6366f1'
  }));

  const severityData = Object.entries(stats.severity_distribution || {}).map(([name, value]) => ({
    name,
    count: value,
    fill: SEVERITY_COLORS[name] || '#6366f1'
  }));

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 75) return 'text-brand-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>AI Autonomous Quality Engine</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">DataGuard AI Executive Dashboard</h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-xl">
            Real-time automated dataset profiling, anomaly detection, scoring, and cleaning recommendations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur hover:bg-white/20 transition-all border border-white/10 shadow-sm"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>Load 500 Orders Sample</span>
          </button>
          <button
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/30 hover:bg-brand-400 transition-all"
          >
            <span>Upload New CSV</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Datasets Scanned</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {stats.total_datasets}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>Stored in SQLite catalog</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Records Processed</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {stats.total_records_processed.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Validated across columns</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Issues Detected</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.total_issues_detected.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>Across 4 detection categories</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Quality Score</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            <span className={getScoreColor(stats.average_quality_score)}>{stats.average_quality_score}</span>
            <span className="text-xs font-medium text-slate-400"> / 100</span>
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>Weighted 4-dimension index</span>
          </div>
        </div>
      </div>

      {/* Active Dataset Alert / Callout */}
      {activeDataset && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900/60 dark:bg-brand-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{activeDataset.filename}</span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800 dark:bg-brand-900 dark:text-brand-300">
                  {activeDataset.total_rows} rows • {activeDataset.total_columns} columns
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {analysisResult 
                  ? `Scan complete. Quality Score: ${analysisResult.scores?.overall_score}/100 (${analysisResult.scores?.quality_grade}). ${analysisResult.total_anomalies} anomalies found.` 
                  : 'Dataset loaded and ready for full anomaly analysis.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!analysisResult ? (
              <button
                onClick={() => onRunAnalysis(activeDataset.id)}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500 transition-all disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{analyzing ? 'Scanning...' : 'Run Analysis Now'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('scoring')}
                  className="rounded-xl border border-brand-300 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:bg-slate-800 dark:text-brand-300 transition-all shadow-sm"
                >
                  View Score Card
                </button>
                <button
                  onClick={() => onNavigate('cleaning')}
                  className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition-all shadow-sm"
                >
                  Clean Dataset
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Visual Analytics Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issue Distribution by Category */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Issue Distribution by Category</h3>
              <p className="text-xs text-slate-500">Breakdown of detected problems across the 4 core detection engines</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No issues recorded yet. Scan a dataset to populate.
              </div>
            )}
          </div>
        </div>

        {/* Severity Breakdown Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Anomalies by Severity</h3>
              <p className="text-xs text-slate-500">Critical vs High vs Medium vs Informational Low issues</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No severity records. Scan a dataset to populate.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Scans Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Dataset Scans</h3>
            <p className="text-xs text-slate-500">History of analyzed files with overall quality metrics</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            View All History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Filename</th>
                <th className="py-2.5 px-4 font-semibold">Rows</th>
                <th className="py-2.5 px-4 font-semibold">Columns</th>
                <th className="py-2.5 px-4 font-semibold">Score</th>
                <th className="py-2.5 px-4 font-semibold">Grade</th>
                <th className="py-2.5 px-4 font-semibold">Scan Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats.recent_scans && stats.recent_scans.length > 0 ? (
                stats.recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-brand-600 shrink-0" />
                      <span className="truncate max-w-[200px]">{scan.filename}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{scan.total_rows}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{scan.total_columns}</td>
                    <td className="py-3 px-4 font-bold">
                      {scan.overall_score !== null ? (
                        <span className={getScoreColor(scan.overall_score)}>{scan.overall_score}/100</span>
                      ) : (
                        <span className="text-slate-400">Unscored</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {scan.quality_grade ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {scan.quality_grade}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {scan.uploaded_at ? scan.uploaded_at.split('T')[0] : 'Today'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('profiling')}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No scans in history yet. Upload or load sample dataset above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
