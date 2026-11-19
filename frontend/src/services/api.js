import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

export const dataGuardAPI = {
  // Upload and Data Management
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  loadSampleDataset: async () => {
    const response = await api.post('/load-sample');
    return response.data;
  },

  getDatasets: async () => {
    const response = await api.get('/datasets');
    return response.data;
  },

  getDatasetDetails: async (datasetId) => {
    const response = await api.get(`/datasets/${datasetId}`);
    return response.data;
  },

  // Analysis & Profiling
  analyzeDataset: async (datasetId) => {
    const response = await api.post(`/analyze/${datasetId}`);
    return response.data;
  },

  getProfile: async (datasetId) => {
    const response = await api.get(`/profile/${datasetId}`);
    return response.data;
  },

  getIssues: async (datasetId) => {
    const response = await api.get(`/issues/${datasetId}`);
    return response.data;
  },

  getScore: async (datasetId) => {
    const response = await api.get(`/score/${datasetId}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // AI & Explanations
  getAIInsights: async (datasetId, apiKey = null) => {
    const response = await api.post(`/ai/explain/${datasetId}`, { api_key: apiKey });
    return response.data;
  },

  // Cleaning Pipeline
  previewCleaning: async (datasetId, operationType) => {
    const response = await api.post(`/clean/preview/${datasetId}`, {
      operation_type: operationType,
    });
    return response.data;
  },

  applyCleaning: async (datasetId, approvedOperations) => {
    const response = await api.post(`/clean/${datasetId}`, {
      approved_operations: approvedOperations,
    });
    return response.data;
  },

  // Settings
  getSettingsStatus: async () => {
    const response = await api.get('/settings/status');
    return response.data;
  },

  updateGeminiKey: async (apiKey, model = 'gemini-2.0-flash') => {
    const response = await api.post('/settings/gemini-key', { api_key: apiKey, model });
    return response.data;
  },

  getAvailableModels: async () => {
    const response = await api.get('/settings/models');
    return response.data;
  },

  // Download URLs
  getReportPdfUrl: (datasetId) => `/api/report/${datasetId}`,
  getExportIssuesCsvUrl: (datasetId) => `/api/export/issues/${datasetId}`,
  getExportCleanedCsvUrl: (datasetId) => `/api/export/cleaned/${datasetId}`,
  getExportJsonUrl: (datasetId) => `/api/export/json/${datasetId}`,
};

export default dataGuardAPI;
