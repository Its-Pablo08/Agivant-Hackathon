import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import OverviewPage from './pages/OverviewPage';
import UploadPage from './pages/UploadPage';
import ProfilingPage from './pages/ProfilingPage';
import AnomalyDetectionPage from './pages/AnomalyDetectionPage';
import IssuesExplorerPage from './pages/IssuesExplorerPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';
import QualityScorePage from './pages/QualityScorePage';
import CleaningPage from './pages/CleaningPage';
import ReportsPage from './pages/ReportsPage';
import ScanHistoryPage from './pages/ScanHistoryPage';
import SettingsPage from './pages/SettingsPage';
import dataGuardAPI from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('landing');
  const [darkMode, setDarkMode] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);
  
  // Drilldown filters for Issues Explorer
  const [issuesCategoryFilter, setIssuesCategoryFilter] = useState('all');
  const [issuesSeverityFilter, setIssuesSeverityFilter] = useState('all');
  
  // Scanned state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [geminiStatus, setGeminiStatus] = useState(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const stats = await dataGuardAPI.getDashboardStats();
      setDashboardStats(stats);
      
      const dsets = await dataGuardAPI.getDatasets();
      setDatasets(dsets);
      
      const gStatus = await dataGuardAPI.getSettingsStatus();
      setGeminiStatus(gStatus);

      // If datasets exist, select the first analyzed one
      if (dsets.length > 0) {
        const primary = dsets[0];
        setActiveDataset(primary);
        if (primary.analysis_status === 'analyzed') {
          loadDatasetAnalysis(primary.id);
        }
      }
    } catch (err) {
      console.error('Initialization error:', err);
    }
  };

  const loadDatasetAnalysis = async (datasetId) => {
    try {
      const [prof, iss, score] = await Promise.all([
        dataGuardAPI.getProfile(datasetId),
        dataGuardAPI.getIssues(datasetId),
        dataGuardAPI.getScore(datasetId)
      ]);
      setProfileData(prof);
      setIssues(iss);
      setScoreData(score);
      setAnalysisResult({
        scores: score,
        profile: prof,
        issues_count: iss.length,
        total_anomalies: iss.reduce((a, b) => a + (b.issue_count || 0), 0)
      });
      // Fetch AI insights
      try {
        const insights = await dataGuardAPI.getAIInsights(datasetId);
        setAiInsights(insights);
      } catch (e) {
        console.error('AI insights load failed:', e);
      }
    } catch (err) {
      console.error('Failed to load dataset details:', err);
    }
  };

  const handleSelectDataset = (datasetId) => {
    const found = datasets.find((d) => d.id === datasetId);
    if (found) {
      setActiveDataset(found);
      loadDatasetAnalysis(found.id);
    }
  };

  const handleDrilldown = (filterType, filterValue) => {
    if (filterType === 'category') {
      setIssuesCategoryFilter(filterValue);
      setIssuesSeverityFilter('all');
    } else if (filterType === 'severity') {
      setIssuesSeverityFilter(filterValue);
      setIssuesCategoryFilter('all');
    }
    setCurrentTab('issues');
  };

  const handleUploadSuccess = (uploadData) => {
    const newDataset = {
      id: uploadData.dataset_id,
      filename: uploadData.filename,
      total_rows: uploadData.total_rows,
      total_columns: uploadData.total_columns,
      analysis_status: 'uploaded'
    };
    setDatasets([newDataset, ...datasets]);
    setActiveDataset(newDataset);
    setAnalysisResult(null);
    setProfileData(null);
    setIssues([]);
    setScoreData(null);
  };

  const handleLoadSample = async () => {
    try {
      setAnalyzing(true);
      const data = await dataGuardAPI.loadSampleDataset();
      handleUploadSuccess(data);
      await runAnalysis(data.dataset_id);
      setCurrentTab('overview');
    } catch (err) {
      console.error('Error loading sample dataset:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnalysis = async (datasetId) => {
    if (!datasetId) return;
    setAnalyzing(true);
    try {
      const res = await dataGuardAPI.analyzeDataset(datasetId);
      setAnalysisResult(res);
      setScoreData(res.scores);
      setProfileData(res.profile);
      setAiInsights(res.ai_insights);
      
      const iss = await dataGuardAPI.getIssues(datasetId);
      setIssues(iss);

      // Refresh dashboard and dataset list
      const stats = await dataGuardAPI.getDashboardStats();
      setDashboardStats(stats);
      const dsets = await dataGuardAPI.getDatasets();
      setDatasets(dsets);
      
      setCurrentTab('overview');
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRefreshAI = async () => {
    if (!activeDataset) return;
    setLoadingAI(true);
    try {
      const res = await dataGuardAPI.getAIInsights(activeDataset.id);
      setAiInsights(res);
    } catch (err) {
      console.error('Failed to refresh AI:', err);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* If currentTab is landing page, display full landing */}
      {currentTab === 'landing' ? (
        <div className="w-full h-full overflow-y-auto">
          <LandingPage
            onStartAnalysis={() => setCurrentTab('upload')}
          />
        </div>
      ) : (
        <>
          {/* Main SaaS Dashboard Layout */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            activeDataset={activeDataset}
            isAnalyzed={Boolean(analysisResult || scoreData)}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <Navbar
              currentDataset={activeDataset}
              datasets={datasets}
              onSelectDataset={handleSelectDataset}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              geminiStatus={geminiStatus}
              onOpenSettings={() => setCurrentTab('settings')}
            />

            <main className="flex-1 overflow-y-auto p-6 md:p-8">
              {currentTab === 'overview' && (
                <OverviewPage
                  dashboardStats={dashboardStats}
                  activeDataset={activeDataset}
                  analysisResult={analysisResult}
                  issues={issues}
                  scoreData={scoreData}
                  onSelectDataset={handleSelectDataset}
                  onNavigate={setCurrentTab}
                  onRunAnalysis={runAnalysis}
                  analyzing={analyzing}
                  onDrilldown={handleDrilldown}
                />
              )}

              {currentTab === 'upload' && (
                <UploadPage
                  onUploadSuccess={handleUploadSuccess}
                  onRunAnalysis={runAnalysis}
                  analyzing={analyzing}
                  activeDataset={activeDataset}
                />
              )}

              {currentTab === 'profiling' && (
                <ProfilingPage
                  profileData={profileData}
                  activeDataset={activeDataset}
                />
              )}

              {currentTab === 'anomalies' && (
                <AnomalyDetectionPage
                  issues={issues}
                  activeDataset={activeDataset}
                />
              )}

              {currentTab === 'issues' && (
                <IssuesExplorerPage
                  issues={issues}
                  activeDataset={activeDataset}
                  initialCategory={issuesCategoryFilter}
                  initialSeverity={issuesSeverityFilter}
                />
              )}

              {currentTab === 'ai-insights' && (
                <AIRecommendationsPage
                  aiInsights={aiInsights}
                  activeDataset={activeDataset}
                  onRefreshAI={handleRefreshAI}
                  loadingAI={loadingAI}
                />
              )}

              {currentTab === 'scoring' && (
                <QualityScorePage
                  scoreData={scoreData}
                  activeDataset={activeDataset}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'cleaning' && (
                <CleaningPage
                  activeDataset={activeDataset}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsPage
                  activeDataset={activeDataset}
                  analysisResult={analysisResult}
                  scoreData={scoreData}
                />
              )}

              {currentTab === 'history' && (
                <ScanHistoryPage
                  datasets={datasets}
                  onSelectDataset={handleSelectDataset}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  geminiStatus={geminiStatus}
                  onStatusChange={loadInitialData}
                />
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
