import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  Play, 
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  RotateCcw
} from 'lucide-react';
import dataGuardAPI from '../services/api';

const AVAILABLE_OPERATIONS = [
  {
    id: 'impute_missing_values',
    title: 'Impute Missing & Null Values',
    desc: 'Median for numerical columns, 0 for unplaced status, mode/Unknown for categoricals.',
    category: 'Missing Values'
  },
  {
    id: 'winsorize_iqr_outliers',
    title: 'Winsorize Extreme Numerical Outliers',
    desc: 'Caps statistical outliers to 1.5× IQR upper/lower statistical boundaries.',
    category: 'Outliers'
  },
  {
    id: 'deduplicate_exact',
    title: 'Remove Exact Duplicate Rows',
    desc: 'Eliminates 100% duplicate row copies while preserving the first instance.',
    category: 'Duplicates'
  },
  {
    id: 'deduplicate_business_keys',
    title: 'Resolve Identifier Duplicates',
    desc: 'Resolves duplicate order IDs, candidate serial numbers, and transaction IDs.',
    category: 'Duplicates'
  },
  {
    id: 'fix_arithmetic_totals',
    title: 'Recompute Arithmetic Mismatches',
    desc: 'Ensures total_amount = quantity * unit_price where blank or incorrect.',
    category: 'Calculations'
  },
  {
    id: 'standardize_cities',
    title: 'Standardize City Names',
    desc: 'Normalizes Bombay->Mumbai, Bangalore->Bengaluru, Madras->Chennai, etc.',
    category: 'Inconsistencies'
  },
  {
    id: 'standardize_categories',
    title: 'Harmonize Product Categories',
    desc: 'Fixes singular/plural and casing (Book->Books, SPORTS->Sports).',
    category: 'Inconsistencies'
  },
  {
    id: 'standardize_payment_methods',
    title: 'Standardize Payment Methods',
    desc: 'Normalizes COD->Cash on Delivery, CC->Credit Card, netbanking->Net Banking.',
    category: 'Inconsistencies'
  },
  {
    id: 'clean_phones',
    title: 'Sanitize Phone Numbers',
    desc: 'Strips country codes, dashes, and scientific notation to 10 digits.',
    category: 'Inconsistencies'
  },
  {
    id: 'clean_names',
    title: 'Title-Case Person Names',
    desc: 'Fixes ALL-CAPS names, lowercase names, and collapses extra whitespace.',
    category: 'Inconsistencies'
  },
  {
    id: 'clean_emails',
    title: 'Fix Email Typo Syntax',
    desc: 'Resolves double @@ and extra trailing spaces.',
    category: 'Inconsistencies'
  },
  {
    id: 'standardize_dates',
    title: 'Standardize Dates (YYYY-MM-DD)',
    desc: 'Converts mixed dates to ISO 8601 and fixes impossible calendar dates.',
    category: 'Inconsistencies'
  },
  {
    id: 'clamp_ratings',
    title: 'Enforce Rating Range [1 - 5]',
    desc: 'Clamps values outside 1-to-5 star business scale.',
    category: 'Outliers'
  },
  {
    id: 'trim_all_text',
    title: 'Trim Whitespace Across All Columns',
    desc: 'Strips leading/trailing whitespace and normalizes internal spaces.',
    category: 'Inconsistencies'
  }
];

export default function CleaningPage({ activeDataset, onNavigate }) {
  const [selectedOps, setSelectedOps] = useState(AVAILABLE_OPERATIONS.map(o => o.id));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  const toggleOp = (id) => {
    if (selectedOps.includes(id)) {
      setSelectedOps(selectedOps.filter((item) => item !== id));
    } else {
      setSelectedOps([...selectedOps, id]);
    }
  };

  const handleApplyCleaning = async () => {
    if (!activeDataset || selectedOps.length === 0) return;
    setCleaning(true);
    try {
      const res = await dataGuardAPI.applyCleaning(activeDataset.id, selectedOps);
      setCleanResult(res);
    } catch (err) {
      console.error('Cleaning failed:', err);
    } finally {
      setCleaning(false);
    }
  };

  if (!activeDataset) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        No dataset loaded. Upload a dataset to begin automated cleaning.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Clean Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Clean Dataset</h1>
        <p className="text-xs text-slate-500 mt-1">
          Automated one-click non-destructive data remediation for <span className="font-semibold text-slate-700 dark:text-slate-300">{activeDataset.filename}</span>.
        </p>
      </div>

      {/* Main 1-Click Auto-Clean Card */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/40 p-6 shadow-sm dark:border-brand-900/40 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                One-Click Complete Auto-Clean
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                Automatically resolves all detected missing values, statistical outliers, duplicate records, and inconsistent text formatting in a single pass.
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyCleaning}
            disabled={cleaning || selectedOps.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/30 hover:bg-brand-500 transition-all disabled:opacity-50 shrink-0"
          >
            {cleaning ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span>Remediating Dataset...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Auto-Clean All Defects Now</span>
              </>
            )}
          </button>
        </div>

        {/* Non-Destructive Note */}
        <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Non-destructive: Your original CSV file is never altered. A sanitized clean copy is generated.</span>
        </div>
      </div>

      {/* Clean Result Card (Shown after cleaning) */}
      {cleanResult && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Dataset Successfully Cleaned!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Original rows: {cleanResult.original_rows} → Sanitized rows: {cleanResult.cleaned_rows} (All defects corrected).
                </p>
              </div>
            </div>

            <a
              href={`/api/export/cleaned/${activeDataset.id}`}
              download={`cleaned_${activeDataset.filename}`}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 transition-all shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Download Cleaned CSV</span>
            </a>
          </div>

          {/* Sample Cleaned Rows Table */}
          {cleanResult.preview && cleanResult.preview.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-2">
                Cleaned Data Preview (Sample First 5 Rows):
              </span>
              <div className="overflow-x-auto rounded-xl border border-emerald-200/80 dark:border-emerald-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      {Object.keys(cleanResult.preview[0]).map((key) => (
                        <th key={key} className="py-2 px-3 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    {cleanResult.preview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3 whitespace-nowrap">
                            {val !== null && val !== undefined ? String(val) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Rules Customizer (Collapsible) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-slate-400" />
            <span>Customize Specific Cleaning Rules ({selectedOps.length}/{AVAILABLE_OPERATIONS.length} Selected)</span>
          </div>
          {showAdvanced ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Toggle individual operations as needed:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedOps(AVAILABLE_OPERATIONS.map(o => o.id))}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setSelectedOps([])}
                  className="text-xs font-semibold text-slate-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {AVAILABLE_OPERATIONS.map(op => {
                const isSelected = selectedOps.includes(op.id);
                return (
                  <div
                    key={op.id}
                    onClick={() => toggleOp(op.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-brand-300 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/20'
                        : 'border-slate-200 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{op.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{op.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
