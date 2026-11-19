import React, { useState } from 'react';
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
  Play,
  Layers,
  Filter,
  CheckCircle
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
  issues = [],
  scoreData,
  onSelectDataset,
  onNavigate, 
  onRunAnalysis,
  analyzing
}) {
  const [viewScope, setViewScope] = useState('active'); // 'active' or 'global'

  const globalStats = dashboardStats || {
    total_datasets: 1,
    total_records_processed: 500,
    total_issues_detected: 0,
    average_quality_score: 100.0,
    category_distribution: {},
    severity_distribution: {},
    recent_scans: []
  };

  // Compute active dataset-specific metrics from issues
  const activeIssues = issues || [];
  const activeTotalIssues = activeIssues.reduce((acc, i) => acc + (i.issue_count || 1), 0);
  
  const activeCategoryCounts = {};
  activeIssues.forEach(i => {
    const cat = i.category || 'Other';
    activeCategoryCounts[cat] = (activeCategoryCounts[cat] || 0) + (i.issue_count || 1);
  });

  const activeSeverityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };
  activeIssues.forEach(i => {
    const sev = i.severity || 'Medium';
    activeSeverityCounts[sev] = (activeSeverityCounts[sev] || 0) + (i.issue_count || 1);
  });

  const isScopeActive = viewScope === 'active' && activeDataset;

  // Chart data based on scope
  const categoryData = isScopeActive
    ? Object.entries(activeCategoryCounts).map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#6366f1'
      }))
    : Object.entries(globalStats.category_distribution || {}).map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#6366f1'
      }));

  const severityData = isScopeActive
    ? Object.entries(activeSeverityCounts).map(([name, count]) => ({
        name,
        count,
        fill: SEVERITY_COLORS[name] || '#6366f1'
      }))
    : Object.entries(globalStats.severity_distribution || {}).map(([name, value]) => ({
        name,
        count: value,
        fill: SEVERITY_COLORS[name] || '#6366f1'
      }));

  const currentScore = isScopeActive
    ? (scoreData?.overall_score ?? (analysisResult?.scores?.overall_score ?? 100))
    : globalStats.average_quality_score;

  const currentRecords = isScopeActive
    ? (activeDataset.total_rows || 0)
    : globalStats.total_records_processed;

  const currentIssues = isScopeActive
    ? activeTotalIssues
    : globalStats.total_issues_detected;

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
            onClick={() => onNavigate('upload')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/30 hover:bg-brand-400 transition-all"
          >
            <span>Upload Dataset</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scope Selector: Active Dataset vs Global Catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Dashboard View Scope:</span>
          {activeDataset && (
            <span className="text-slate-400">
              (Currently viewing {isScopeActive ? 'active file only' : 'all datasets aggregated'})
            </span>
          )}
        </div>
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setViewScope('active')}
            disabled={!activeDataset}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              isScopeActive 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Active: {activeDataset?.filename || 'No File Selected'}</span>
          </button>
          <button
            onClick={() => setViewScope('global')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              !isScopeActive 
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>All Datasets ({globalStats.total_datasets} Total)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isScopeActive ? 'Current Dataset' : 'Datasets Scanned'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-black text-slate-900 dark:text-white truncate">
            {isScopeActive ? activeDataset.filename : `${globalStats.total_datasets} files`}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>{isScopeActive ? `${activeDataset.total_columns} columns validated` : 'Stored in SQLite catalog'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isScopeActive ? 'Dataset Records' : 'Records Processed'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {currentRecords.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>{isScopeActive ? 'Rows in active file' : 'Validated across all files'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isScopeActive ? 'Anomalies in File' : 'Total Issues Detected'}
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              currentIssues === 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'
            }`}>
              {currentIssues === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
          </div>
          <div className={`mt-3 text-2xl font-black ${currentIssues === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {currentIssues.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500">
            <span>{currentIssues === 0 ? 'Zero defects found' : 'Across 4 detection categories'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isScopeActive ? 'Dataset Score' : 'Avg Quality Score'}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            <span className={getScoreColor(currentScore)}>{currentScore}</span>
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
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {analysisResult 
                  ? `Scan complete. Quality Score: ${analysisResult.scores?.overall_score}/100 (${analysisResult.scores?.quality_grade}). ${analysisResult.total_anomalies} anomalies found in this file.` 
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Issue Distribution by Category {isScopeActive ? `(${activeDataset.filename})` : '(All Datasets)'}
              </h3>
              <p className="text-xs text-slate-500">
                {isScopeActive 
                  ? `Breakdown of anomalies specifically detected in ${activeDataset.filename}` 
                  : 'Aggregate across all analyzed datasets'}
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            {categoryData.length > 0 && currentIssues > 0 ? (
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
              <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Zero Anomalies in {activeDataset?.filename || 'Dataset'}</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  All {currentRecords} rows and {activeDataset?.total_columns || 0} columns passed completeness, uniqueness, and consistency checks!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Severity Breakdown Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Anomalies by Severity {isScopeActive ? `(${activeDataset.filename})` : '(All Datasets)'}
              </h3>
              <p className="text-xs text-slate-500">Critical vs High vs Medium vs Informational Low issues</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {currentIssues > 0 ? (
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
              <div className="flex flex-col h-full items-center justify-center text-center p-6 space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Fully Compliant Dataset</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  0 Critical, 0 High, and 0 Medium issues recorded. This dataset is completely clean.
                </p>
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
            <p className="text-xs text-slate-500">History of analyzed files with overall quality metrics (click Inspect to view)</p>
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
              {globalStats.recent_scans && globalStats.recent_scans.length > 0 ? (
                globalStats.recent_scans.map((scan) => {
                  const isCurrent = scan.id === activeDataset?.id;
                  return (
                    <tr 
                      key={scan.id} 
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-brand-50/30 dark:bg-brand-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-brand-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{scan.filename}</span>
                        {isCurrent && (
                          <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                            Active
                          </span>
                        )}
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
                          onClick={() => {
                            if (onSelectDataset) onSelectDataset(scan.id);
                            setViewScope('active');
                            onNavigate('profiling');
                          }}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No scans in history yet. Upload a dataset to begin.
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