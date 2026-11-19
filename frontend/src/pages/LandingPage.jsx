import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  FileSpreadsheet, 
  Search, 
  BarChart3, 
  FileText, 
  Copy, 
  Layers, 
  Cpu,
  Lock,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

export default function LandingPage({ onStartAnalysis, onLoadSample }) {
  const features = [
    {
      icon: BarChart3,
      title: "Automated Data Profiling",
      desc: "Instant statistical breakdown across every column: semantic data types, missing percentage, unique counts, distributions, and frequency histograms."
    },
    {
      icon: Search,
      title: "Deep Anomaly Detection",
      desc: "Pinpoint statistical outliers using IQR & Z-score techniques, impossible calendar dates, arithmetic total mismatches, and domain boundary breaches."
    },
    {
      icon: Layers,
      title: "Multi-Tier Duplicate Detection",
      desc: "Isolate 100% exact duplicate rows, primary key collisions, and repeated transaction checkout signatures to preserve analytics accuracy."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Explanations",
      desc: "Google Gemini API interprets column business semantics, clarifies the business impact of each problem, and writes ready-to-run pandas cleaning code."
    },
    {
      icon: Award,
      title: "Transparent Quality Scoring",
      desc: "Formula-based scoring out of 100 evaluating Completeness (30%), Uniqueness (25%), Validity (25%), and Consistency (20%) at dataset and column levels."
    },
    {
      icon: FileText,
      title: "Executive Reports & Safe Exports",
      desc: "Generate enterprise PDF quality reports, export issues in CSV, download full JSON audit schemas, and preview clean datasets non-destructively."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Upload Dataset",
      desc: "Drop any CSV up to 10,000+ rows. Automatic encoding detection and validation."
    },
    {
      num: "02",
      title: "Scan & Profile",
      desc: "Python analytics engine scans for missing cells, duplicates, math errors, and inconsistent formats."
    },
    {
      num: "03",
      title: "AI Business Intelligence",
      desc: "Gemini AI translates raw findings into executive summaries and prioritized action items."
    },
    {
      num: "04",
      title: "Clean & Export",
      desc: "Preview transformations before applying. Download cleaned CSVs and PDF audit reports."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-accent-600 text-white shadow-md shadow-brand-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">DataGuard <span className="text-brand-600 dark:text-brand-400">AI</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onLoadSample}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              Demo Hackathon Dataset
            </button>
            <button
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:bg-brand-500 transition-all active:scale-95"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(0,0,0,0))]" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-300 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Autonomous Data Quality Agent</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Turn Messy Data Into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-accent-500 to-indigo-600 bg-clip-text text-transparent">
              Business-Ready Intelligence.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            DataGuard AI automatically scans CSV datasets, detects anomalies and impossible figures, scores dataset integrity, and provides LLM-driven cleaning recommendations with ready-to-run pandas snippets.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-500 hover:shadow-brand-500/40 transition-all active:scale-95"
            >
              <span>Analyze Your Dataset</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Load Hackathon Orders (500 Rows)</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            <div className="p-3">
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400">24+</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Planted Anomaly Groups Detected</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">4 Dims</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Weighted Quality Formula</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Non-Destructive Cleaning</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-black text-accent-600 dark:text-accent-400">Gemini</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Modular AI Explanation Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Comprehensive Capabilities</h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Everything Needed to Audit & Sanitize Enterprise Data
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-sm hover:shadow-md hover:border-brand-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 mb-5">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Streamlined Workflow</h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              From Raw CSV to Decision-Ready Clean Dataset
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, i) => (
              <div key={i} className="relative rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <span className="text-3xl font-black text-brand-600/30 dark:text-brand-400/20">{st.num}</span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2 mb-1">{st.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Business Value</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-6">
              Why Bad Data Costs Businesses Millions
            </h2>
            <div className="space-y-4">
              {[
                { title: "Prevent Broken Dashboards", desc: "Catch dirty column names, non-numeric prices, and corrupted dates before BI charts fail in board meetings." },
                { title: "Eliminate Wasted Engineering Hours", desc: "Data scientists spend 60-80% of their time manually cleaning data. Automate it in seconds." },
                { title: "Trustworthy Financial Reporting", desc: "Resolve calculation bugs where quantity * unit_price != total_amount before audits." },
                { title: "Seamless Delivery & Customer Comms", desc: "Sanitize phone numbers, email syntax, and city designations to keep courier dispatches moving." }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.title}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Hackathon Benchmark</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">500 Orders Verified</span>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Missing Values Found:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">101 cells (City, Email, Total, Rating)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Duplicate Rows & Key Collisions:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">30 duplicate records identified</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Math Mismatches & Impossible Values:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Negative totals, Feb 30 date, rating 0/10</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Inconsistent Categorical & City Taxonomies:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Bombay, Bangalore, Madras, COD, +91 phones</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 dark:border-slate-800 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">DataGuard AI</span>
            <span>— Clean Data. Confident Decisions.</span>
          </div>
          <div>Built for Agivant Hackathon • Powered by Python FastAPI, React & Google Gemini</div>
        </div>
      </footer>
    </div>
  );
}
