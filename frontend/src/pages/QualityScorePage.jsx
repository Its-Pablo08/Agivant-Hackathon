import React from 'react';
import { 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  Percent, 
  Layers, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

export default function QualityScorePage({ scoreData, activeDataset, onNavigate }) {
  const scores = scoreData || {
    overall_score: 72.4,
    completeness_score: 95.2,
    uniqueness_score: 88.0,
    validity_score: 82.5,
    consistency_score: 58.0,
    quality_grade: 'Needs Improvement',
    grade_summary: 'Significant formatting variations and duplicate entries identified.',
    column_scores: {},
    formula: 'Overall = (Completeness × 0.30) + (Uniqueness × 0.25) + (Validity × 0.25) + (Consistency × 0.20)'
  };

  const getGradeBadge = (grade) => {
    switch (grade) {
      case 'Excellent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
      case 'Needs Improvement':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#6366f1';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Convert column scores to chart list
  const columnData = Object.entries(scores.column_scores || {}).map(([col, data]) => ({
    name: col,
    score: data.score,
    grade: data.grade,
    fill: getScoreColor(data.score)
  })).sort((a, b) => a.score - b.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Dataset Quality Scoring System</h1>
        <p className="text-xs text-slate-500 mt-1">
          Formula-based 4-dimension audit scoring for {activeDataset?.filename || 'dataset'}.
        </p>
      </div>

      {/* Main Score Hero Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 grid md:grid-cols-3 gap-6 items-center">
        {/* Overall Score Dial */}
        <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-slate-100 dark:border-slate-800">
            <div 
              className="absolute inset-0 rounded-full border-8 border-brand-600 transition-all duration-1000"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${scores.overall_score > 25 ? '100% 0%,' : ''} ${scores.overall_score > 50 ? '100% 100%,' : ''} ${scores.overall_score > 75 ? '0% 100%,' : ''} 0% 0%)`
              }}
            />
            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {scores.overall_score}
              </span>
              <span className="text-xs font-semibold text-slate-400 block">/ 100</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getGradeBadge(scores.quality_grade)}`}>
              {scores.quality_grade}
            </span>
          </div>
        </div>

        {/* Dimension Breakdown */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Completeness */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Completeness (30%)</span>
                <span className="font-black text-brand-600 dark:text-brand-400">{scores.completeness_score}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${scores.completeness_score}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">Absence of null, NaN, and placeholder values</p>
            </div>

            {/* Uniqueness */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Uniqueness (25%)</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400">{scores.uniqueness_score}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scores.uniqueness_score}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">Freedom from duplicate rows and reused primary keys</p>
            </div>

            {/* Validity */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Validity (25%)</span>
                <span className="font-black text-violet-600 dark:text-violet-400">{scores.validity_score}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${scores.validity_score}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">Compliance with arithmetic, bounds & calendar dates</p>
            </div>

            {/* Consistency */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Consistency (20%)</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">{scores.consistency_score}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scores.consistency_score}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">Standardized text casing, naming & uniform date syntax</p>
            </div>
          </div>

          {/* Formula Callout */}
          <div className="rounded-xl bg-brand-50/60 p-3 text-xs text-brand-900 dark:bg-brand-950/40 dark:text-brand-200 font-mono flex items-center justify-between">
            <span>Overall = (Completeness × 0.30) + (Uniqueness × 0.25) + (Validity × 0.25) + (Consistency × 0.20)</span>
            <button
              onClick={() => onNavigate('cleaning')}
              className="text-[11px] font-bold text-brand-600 underline dark:text-brand-400 shrink-0 ml-2"
            >
              Fix Issues →
            </button>
          </div>
        </div>
      </div>

      {/* Column Quality Leaderboard */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Column-Level Quality Score Rankings</h3>
          <p className="text-xs text-slate-500">Individual health metrics for each column</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={columnData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {columnData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
