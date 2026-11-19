import React from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  Printer, 
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import dataGuardAPI from '../services/api';

export default function ReportsPage({ activeDataset, analysisResult, scoreData }) {
  if (!activeDataset) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        No dataset loaded. Upload or select a dataset to generate reports.
      </div>
    );
  }

  const datasetId = activeDataset.id;

  const exportCards = [
    {
      title: "Executive PDF Audit Report",
      desc: "Complete enterprise PDF summary including scores, executive brief, column profiles, issue tables, and Python cleaning code.",
      badge: "C-Level Ready",
      icon: FileText,
      color: "bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400",
      buttonText: "Download PDF Report",
      downloadUrl: dataGuardAPI.getReportPdfUrl(datasetId),
      filename: `DataGuard_Report_${activeDataset.filename}.pdf`
    },
    {
      title: "Detected Issues CSV",
      desc: "Tabular export of every flagged anomaly: issue ID, category, column, severity, count, affected row numbers, and recommendations.",
      badge: "CSV Format",
      icon: FileSpreadsheet,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
      buttonText: "Download Issues CSV",
      downloadUrl: dataGuardAPI.getExportIssuesCsvUrl(datasetId),
      filename: `issues_${activeDataset.filename}.csv`
    },
    {
      title: "Complete Analysis JSON Schema",
      desc: "Full structured machine-readable payload containing metadata, column profiles, quality metrics, issue logs, and AI outputs.",
      badge: "JSON Schema",
      icon: FileCode,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
      buttonText: "Download Analysis JSON",
      downloadUrl: dataGuardAPI.getExportJsonUrl(datasetId),
      filename: `dataguard_analysis_${datasetId}.json`
    },
    {
      title: "Cleaned Production Dataset",
      desc: "Export the sanitized CSV file after running the approved automated cleaning transformations.",
      badge: "Clean CSV",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
      buttonText: "Download Cleaned CSV",
      downloadUrl: dataGuardAPI.getExportCleanedCsvUrl(datasetId),
      filename: `cleaned_${activeDataset.filename}`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reports & Data Exports</h1>
        <p className="text-xs text-slate-500 mt-1">
          Download executive audit reports and machine-readable data artifacts for {activeDataset.filename}.
        </p>
      </div>

      {/* Export Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {exportCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">{item.desc}</p>
              </div>

              <a
                href={item.downloadUrl}
                download={item.filename}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>{item.buttonText}</span>
              </a>
            </div>
          );
        })}
      </div>

      {/* Report Preview Outline Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">PDF Report Document Structure</h3>
            <p className="text-xs text-slate-500">Overview of sections compiled in the executive PDF export</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ ReportLab Engine Verified
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            "1. Project Header & Enterprise Branding",
            "2. Dataset Metadata & Scan Timestamp",
            "3. 4-Dimension Quality Scores & Formula",
            "4. Executive Summary for Non-Technical Stakeholders",
            "5. Column-Level Attribute Profiling Table",
            "6. Detailed Detected Issues & Severity Breakdown",
            "7. Sample Anomalous Records & Excel Row Numbers",
            "8. AI Remediation Strategies & Business Justification",
            "9. Executable Python Pandas Cleaning Snippets"
          ].map((sec, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span>{sec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
