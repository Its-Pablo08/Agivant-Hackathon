import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Database, 
  AlertTriangle, 
  Award, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Download,
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
  Wrench
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

  // Compute active dataset metrics
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

  // Chart data
  const categoryData = Object.entries(activeCategoryCounts).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name] || '#6366f1'
  }));

  const severityData = Object.entries(activeSeverityCounts).map(([name, count]) => ({
    name,
    count,
    fill: SEVERITY_COLORS[name] || '#6366f1'
  }));

  const currentScore = scoreData?.overall_score ?? (analysisResult?.scores?.overall_score ?? 100);
  const currentRecords = activeDataset?.total_rows || 0;
  const currentIssues = activeTotalIssues;

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

  // Filter issues matching drilldown
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

  const affectedColumns = useMemo(() => {
    return [...new Set(matchingIssues.map(i => i.column_name).filter(Boolean))];
  }, [matchingIssues]);

  const displayedIssues = useMemo(() => {
    if (selectedDrillColumn === 'all') return matchingIssues;
    return matchingIssues.filter(i => i.column_name === selectedDrillColumn);
  }, [matchingIssues, selectedDrillColumn]);

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
      {/* Clean Top Header & Dataset Action Card */}
      {activeDataset ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 dark:text-white">
                  {activeDataset.filename}
                </h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active
                </span>
                {analysisResult?.scores?.quality_grade && (
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800">
                    Grade: {analysisResult.scores.quality_grade}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {activeDataset.total_rows.toLocaleString()} rows • {activeDataset.total_columns} columns • {currentIssues === 0 ? 'Zero defects detected (100% clean)' : `${currentIssues.toLocaleString()} anomalies detected across ${Object.keys(activeCategoryCounts).length} categories`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {currentIssues > 0 ? (
              <>
                <button
                  onClick={() => onNavigate('issues')}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all shadow-xs"
                >
                  View Issues ({currentIssues})
                </button>
                <button
                  onClick={() => onNavigate('cleaning')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500 transition-all"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Clean Dataset</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('reports')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Report</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No dataset loaded yet.</p>
          <button
            onClick={() => onNavigate('upload')}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500 shadow-sm"
          >
            <span>Upload CSV Dataset</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 4 Core Functional Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Records */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Records</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {currentRecords.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {activeDataset?.total_columns || 0} validated columns
          </div>
        </div>

        {/* Quality Score */}
        <div 
          onClick={() => onNavigate('scoring')}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer hover:border-brand-400 transition-all"
          title="Click to view full quality score breakdown"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quality Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            <span className={getScoreColor(currentScore)}>{currentScore}</span>
            <span className="text-xs font-medium text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {analysisResult?.scores?.quality_grade || 'Calculated'} grade
          </div>
        </div>

        {/* Anomalies Detected (Clickable) */}
        <div 
          onClick={() => {
            if (activeIssues.length > 0) {
              setDrilldownTarget({ type: 'category', value: activeIssues[0]?.category || 'Missing Values' });
            }
          }}
          className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all ${
            activeIssues.length > 0 ? 'cursor-pointer hover:border-amber-400' : ''
          }`}
          title={activeIssues.length > 0 ? 'Click to inspect anomalies by category' : ''}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Detected Issues</span>
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              currentIssues === 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'
            }`}>
              {currentIssues === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
          </div>
          <div className={`mt-3 text-2xl font-black ${currentIssues === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {currentIssues.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {currentIssues === 0 ? 'Zero defects found' : 'Click to inspect rows & columns'}
          </div>
        </div>

        {/* Status / Quick Action */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remediation Status</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-black text-slate-900 dark:text-white">
            {currentIssues === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">100% Ready</span>
            ) : (
              <span className="text-brand-600 dark:text-brand-400">Ready to Clean</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {currentIssues === 0 ? 'Cleaned CSV available' : 'Automated 1-click pipeline'}
          </div>
        </div>
      </div>

      {/* Visual Analytics: Clickable Interactive Graphs */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issue Distribution by Category */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Issue Distribution by Category
                </h3>
                {currentIssues > 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200/50">
                    Click slice to view rows
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of anomalies detected across categories
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
                        className="cursor-pointer transition-opacity hover:opacity-85"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} anomalies (Click to inspect)`, name]} 
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Zero Anomalies in File</div>
                <p className="text-xs text-slate-500 max-w-sm">
                  All {currentRecords} rows passed completeness, uniqueness, and consistency checks!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Severity Breakdown Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Anomalies by Severity
                </h3>
                {currentIssues > 0 && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200/50">
                    Click bar to view rows
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Critical vs High vs Medium vs Informational Low issues</p>
            </div>
          </div>
          <div className="h-64 w-full">
            {currentIssues > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value} issues (Click to inspect)`, 'Count']} 
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
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
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
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            if (onSelectDataset) onSelectDataset(scan.id);
                          }}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          Select →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
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
                      Graph Inspector • {drilldownTarget.type === 'category' ? 'Category' : 'Severity'}
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
