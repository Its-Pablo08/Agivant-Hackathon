import React, { useState, useMemo } from 'react';
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
  CheckCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Columns,
  Hash,
  Eye,
  Sliders
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
  analyzing,
  onDrilldown
}) {
  const [viewScope, setViewScope] = useState('active'); // 'active' or 'global'
  
  // Drill-down inspector state
  const [drilldownTarget, setDrilldownTarget] = useState(null); // { type: 'category' | 'severity', value: string }
  const [selectedDrillColumn, setSelectedDrillColumn] = useState('all');
  const [copiedAllRows, setCopiedAllRows] = useState(false);
  const [copiedIssueRowsId, setCopiedIssueRowsId] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [expandedRowSets, setExpandedRowSets] = useState({});

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

  // Click handlers for interactive graphs
  const handleCategoryClick = (entry) => {
    const catName = entry?.name || (typeof entry === 'string' ? entry : null);
    if (!catName) return;
    setDrilldownTarget({ type: 'category', value: catName });
    setSelectedDrillColumn('all');
  };

  const handleSeverityClick = (entry) => {
    const sevName = entry?.name || (typeof entry === 'string' ? entry : null);
    if (!sevName) return;
    setDrilldownTarget({ type: 'severity', value: sevName });
    setSelectedDrillColumn('all');
  };

  // Filter issues matching drill-down selection
  const matchingIssues = useMemo(() => {
    if (!drilldownTarget) return [];
    return activeIssues.filter(iss => {
      if (drilldownTarget.type === 'category') {
        return (iss.category || 'Other') === drilldownTarget.value;
      }
      if (drilldownTarget.type === 'severity') {
        return (iss.severity || 'Medium') === drilldownTarget.value;
      }
      return true;
    });
  }, [activeIssues, drilldownTarget]);

  // Unique affected columns in this drill-down
  const affectedColumns = useMemo(() => {
    return [...new Set(matchingIssues.map(i => i.column_name).filter(Boolean))];
  }, [matchingIssues]);

  // Filtered by selected column
  const displayedIssues = useMemo(() => {
    if (selectedDrillColumn === 'all') return matchingIssues;
    return matchingIssues.filter(i => i.column_name === selectedDrillColumn);
  }, [matchingIssues, selectedDrillColumn]);

  // Unique affected Excel row numbers
  const uniqueAffectedRows = useMemo(() => {
    const set = new Set();
    displayedIssues.forEach(i => {
      (i.affected_rows || []).forEach(r => set.add(r));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [displayedIssues]);

  const copyAllRows = () => {
    if (uniqueAffectedRows.length === 0) return;
    navigator.clipboard.writeText(uniqueAffectedRows.join(', '));
    setCopiedAllRows(true);
    setTimeout(() => setCopiedAllRows(false), 2000);
  };

  const copyIssueRows = (id, rows) => {
    if (!rows || rows.length === 0) return;
    navigator.clipboard.writeText(rows.join(', '));
    setCopiedIssueRowsId(id);
    setTimeout(() => setCopiedIssueRowsId(null), 2000);
  };

  const copyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const toggleRowExpansion = (id) => {
    setExpandedRowSets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

        <div 
          onClick={() => {
            if (activeIssues.length > 0) {
              setDrilldownTarget({ type: 'category', value: activeIssues[0]?.category || 'Missing Values' });
            }
          }}
          className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all ${
            activeIssues.length > 0 ? 'cursor-pointer hover:border-brand-400 hover:shadow-md' : ''
          }`}
          title={activeIssues.length > 0 ? 'Click to inspect anomalies by category' : ''}
        >
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
            <span>{currentIssues === 0 ? 'Zero defects found' : 'Across 4 detection categories (Click to inspect)'}</span>
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

      {/* Interactive Graph Hint Banner */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="font-bold">Interactive Graphs:</span>
          <span>Click on any slice in the donut chart or bar in the severity chart below to inspect affected rows and columns.</span>
        </div>
        {activeIssues.length > 0 && (
          <button 
            onClick={() => onNavigate('issues')}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0 flex items-center gap-1"
          >
            <span>Full Explorer</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issue Distribution by Category */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Issue Distribution by Category {isScopeActive ? `(${activeDataset.filename})` : '(All Datasets)'}
                </h3>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800">
                  Clickable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isScopeActive 
                  ? `Breakdown of anomalies specifically detected in ${activeDataset.filename} (click a slice to inspect)` 
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
                    cursor="pointer"
                    onClick={(entry) => handleCategoryClick(entry)}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        className="cursor-pointer transition-transform hover:opacity-85"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} anomalies • Click to inspect`, name]} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
                    onClick={(e) => handleCategoryClick(e.value)}
                  />
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Anomalies by Severity {isScopeActive ? `(${activeDataset.filename})` : '(All Datasets)'}
                </h3>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800">
                  Clickable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Critical vs High vs Medium vs Informational Low issues (click a bar to inspect)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {currentIssues > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value} issues • Click to inspect`, 'Count']} 
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[6, 6, 0, 0]} 
                    cursor="pointer"
                    onClick={(entry) => handleSeverityClick(entry)}
                  >
                    {severityData.map((entry, index) => (
                      <Cell 
                        key={`bar-${index}`} 
                        fill={entry.fill} 
                        className="cursor-pointer transition-opacity hover:opacity-85"
                      />
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

      {/* Interactive Issue & Row Drill-Down Modal */}
      {drilldownTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setDrilldownTarget(null)}
        >
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-start gap-3">
                <div 
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ 
                    backgroundColor: drilldownTarget.type === 'category' 
                      ? (CATEGORY_COLORS[drilldownTarget.value] || '#6366f1') 
                      : (SEVERITY_COLORS[drilldownTarget.value] || '#6366f1') 
                  }}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Interactive Graph Inspector • {drilldownTarget.type === 'category' ? 'Category' : 'Severity'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                    <span>{drilldownTarget.value}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {matchingIssues.reduce((acc, i) => acc + (i.issue_count || 1), 0)} occurrences
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Affecting {affectedColumns.length} columns and {uniqueAffectedRows.length} unique Excel rows in <span className="font-semibold text-slate-700 dark:text-slate-300">{activeDataset?.filename || 'dataset'}</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onDrilldown && (
                  <button
                    onClick={() => {
                      onDrilldown(drilldownTarget.type, drilldownTarget.value);
                      setDrilldownTarget(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-brand-300 bg-white px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-50 dark:border-brand-700 dark:bg-slate-800 dark:text-brand-300 transition-all shadow-sm"
                  >
                    <span>Full Explorer</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setDrilldownTarget(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics & Row Copy Bar */}
            <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Columns className="h-3.5 w-3.5 text-brand-500" />
                  <strong>{affectedColumns.length}</strong> Columns
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5 text-amber-500" />
                  <strong>{uniqueAffectedRows.length}</strong> Unique Row Indices
                </span>
              </div>
              {uniqueAffectedRows.length > 0 && (
                <button
                  onClick={copyAllRows}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-xs"
                >
                  {copiedAllRows ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied {uniqueAffectedRows.length} Row Numbers!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy All Affected Row Numbers</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Column Selector Filter Pills */}
            {affectedColumns.length > 1 && (
              <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900">
                <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  <span>Column:</span>
                </span>
                <button
                  onClick={() => setSelectedDrillColumn('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                    selectedDrillColumn === 'all'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  All Columns ({matchingIssues.length})
                </button>
                {affectedColumns.map(col => {
                  const count = matchingIssues.filter(i => i.column_name === col).length;
                  return (
                    <button
                      key={col}
                      onClick={() => setSelectedDrillColumn(col)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                        selectedDrillColumn === col
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {col} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Scrollable Issue & Row Inspection Body */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {displayedIssues.length > 0 ? (
                displayedIssues.map(issue => {
                  const isExpanded = expandedRowSets[issue.id];
                  const rows = issue.affected_rows || [];
                  const visibleRows = isExpanded ? rows : rows.slice(0, 32);

                  return (
                    <div 
                      key={issue.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4"
                    >
                      {/* Issue Card Top */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                            {issue.column_name}
                          </span>
                          <span 
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs"
                            style={{ backgroundColor: SEVERITY_COLORS[issue.severity] || '#6366f1' }}
                          >
                            {issue.severity}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {issue.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {issue.issue_count} affected records
                          </span>
                          {rows.length > 0 && (
                            <button
                              onClick={() => copyIssueRows(issue.id, rows)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              title="Copy row numbers for this column"
                            >
                              {copiedIssueRowsId === issue.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Explanation & Impact */}
                      <div className="grid md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Problem Explanation</span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{issue.explanation}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Recommended Resolution</span>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{issue.recommendation}</p>
                        </div>
                      </div>

                      {/* Sample Original Values */}
                      {issue.original_values && issue.original_values.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Sample Problematic Values Found:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {issue.original_values.map((v, i) => (
                              <span 
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/70 text-amber-800 font-mono text-[11px] dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                              >
                                {v === '' ? '"" (empty string)' : String(v)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exact Excel Row Numbers */}
                      {rows.length > 0 && (
                        <div className="pt-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                              <Hash className="h-3 w-3 text-brand-500" />
                              <span>Exact Affected Row Numbers in Excel / CSV ({rows.length} total):</span>
                            </span>
                            {rows.length > 32 && (
                              <button
                                onClick={() => toggleRowExpansion(issue.id)}
                                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                              >
                                <span>{isExpanded ? 'Show Fewer' : `Show All ${rows.length} Rows`}</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                            {visibleRows.map((rowNum) => (
                              <span
                                key={rowNum}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-semibold border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                              >
                                Row #{rowNum}
                              </span>
                            ))}
                            {!isExpanded && rows.length > 32 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-[11px] font-bold">
                                + {rows.length - 32} more rows
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Python Cleaning Code */}
                      {issue.cleaning_code && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Automated Pandas Cleaning Code:
                            </span>
                            <button
                              onClick={() => copyCode(issue.id, issue.cleaning_code)}
                              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
                            >
                              {copiedCodeId === issue.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span>Copied Code</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                            <code>{issue.cleaning_code}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No issues found matching this filter.
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Inspect and execute fixes in the cleaning pipeline.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrilldownTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setDrilldownTarget(null);
                    onNavigate('cleaning');
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition-all shadow-md shadow-brand-500/25 flex items-center gap-1.5"
                >
                  <span>Proceed to Cleaning Pipeline</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
