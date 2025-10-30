import axios, { AxiosResponse } from 'axios';
import {
  User,
  LoginRequest,
  LoginResponse,
  Project,
  Translator,
  TranslationTask,
  Invoice,
  ProjectReport,
  TranslatorReport,
  FinancialReport,
  ChatResponse,
  AITranslationRequest,
  AITranslationResponse,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response: AxiosResponse<LoginResponse> = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (token: string): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  register: async (userData: any): Promise<User> => {
    const response: AxiosResponse<User> = await apiClient.post('/auth/register', userData);
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getAll: async (params?: any): Promise<Project[]> => {
    const response: AxiosResponse<Project[]> = await apiClient.get('/projects', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response: AxiosResponse<Project> = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  create: async (projectData: any): Promise<Project> => {
    const response: AxiosResponse<Project> = await apiClient.post('/projects', projectData);
    return response.data;
  },

  update: async (id: number, projectData: any): Promise<Project> => {
    const response: AxiosResponse<Project> = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  getCostEstimate: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/projects/${id}/cost-estimate`);
    return response.data;
  },

  updateLocales: async (id: number, locales: string[]): Promise<any> => {
    const response = await apiClient.post(`/projects/${id}/locales`, locales);
    return response.data;
  },
};

// Translators API
export const translatorsAPI = {
  getAll: async (params?: any): Promise<Translator[]> => {
    const response: AxiosResponse<Translator[]> = await apiClient.get('/translators', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Translator> => {
    const response: AxiosResponse<Translator> = await apiClient.get(`/translators/${id}`);
    return response.data;
  },

  create: async (translatorData: any): Promise<Translator> => {
    const response: AxiosResponse<Translator> = await apiClient.post('/translators', translatorData);
    return response.data;
  },

  update: async (id: number, translatorData: any): Promise<Translator> => {
    const response: AxiosResponse<Translator> = await apiClient.put(`/translators/${id}`, translatorData);
    return response.data;
  },

  updateRates: async (id: number, rates: Record<string, number>): Promise<any> => {
    const response = await apiClient.post(`/translators/${id}/rates`, rates);
    return response.data;
  },

  getRecommendations: async (locale: string): Promise<any> => {
    const response = await apiClient.get(`/translators/recommendations/${locale}`);
    return response.data;
  },

  getTasks: async (id: number, params?: any): Promise<TranslationTask[]> => {
    const response: AxiosResponse<TranslationTask[]> = await apiClient.get(`/translators/${id}/tasks`, { params });
    return response.data;
  },

  getEarnings: async (id: number, params?: any): Promise<any> => {
    const response = await apiClient.get(`/translators/${id}/earnings`, { params });
    return response.data;
  },
};

// Tasks API
export const tasksAPI = {
  getAll: async (params?: any): Promise<TranslationTask[]> => {
    const response: AxiosResponse<TranslationTask[]> = await apiClient.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: number): Promise<TranslationTask> => {
    const response: AxiosResponse<TranslationTask> = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (taskData: any): Promise<TranslationTask> => {
    const response: AxiosResponse<TranslationTask> = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  update: async (id: number, taskData: any): Promise<TranslationTask> => {
    const response: AxiosResponse<TranslationTask> = await apiClient.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  assignTranslator: async (id: number, translatorId: number): Promise<any> => {
    const response = await apiClient.post(`/tasks/${id}/assign`, { translator_id: translatorId });
    return response.data;
  },

  uploadFiles: async (id: number, files: FileList): Promise<any> => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    const response = await apiClient.post(`/tasks/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  submitEstimate: async (id: number, estimate: any): Promise<any> => {
    const response = await apiClient.post(`/tasks/${id}/estimate`, estimate);
    return response.data;
  },

  bulkDownload: async (locale: string, projectIds?: number[]): Promise<any> => {
    const response = await apiClient.get(`/tasks/bulk-download/${locale}`, {
      params: { project_ids: projectIds },
    });
    return response.data;
  },
};

// Invoices API
export const invoicesAPI = {
  getAll: async (params?: any): Promise<Invoice[]> => {
    const response: AxiosResponse<Invoice[]> = await apiClient.get('/invoices', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Invoice> => {
    const response: AxiosResponse<Invoice> = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  create: async (invoiceData: any): Promise<Invoice> => {
    const response: AxiosResponse<Invoice> = await apiClient.post('/invoices', invoiceData);
    return response.data;
  },

  update: async (id: number, invoiceData: any): Promise<Invoice> => {
    const response: AxiosResponse<Invoice> = await apiClient.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  approve: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/invoices/${id}/approve`);
    return response.data;
  },

  reject: async (id: number, reason: string): Promise<any> => {
    const response = await apiClient.post(`/invoices/${id}/reject`, { reason });
    return response.data;
  },

  markPaid: async (id: number): Promise<any> => {
    const response = await apiClient.post(`/invoices/${id}/mark-paid`);
    return response.data;
  },

  generateMonthly: async (translatorId: number, projectId: number, year: number, month: number): Promise<any> => {
    const response = await apiClient.post('/invoices/generate-monthly', {
      translator_id: translatorId,
      project_id: projectId,
      year,
      month,
    });
    return response.data;
  },

  getMonthlyPayouts: async (year: number, month: number, translatorId?: number): Promise<any> => {
    const response = await apiClient.get(`/invoices/monthly-payouts/${year}/${month}`, {
      params: { translator_id: translatorId },
    });
    return response.data;
  },

  getSpendingByProduct: async (year: number, month?: number): Promise<any> => {
    const response = await apiClient.get(`/invoices/spending-by-product/${year}`, {
      params: { month },
    });
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getLocaleStatus: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/reports/locale-status', { params });
    return response.data;
  },

  getProjectSummary: async (projectId?: number): Promise<any> => {
    const response = await apiClient.get('/reports/project-summary', {
      params: { project_id: projectId },
    });
    return response.data;
  },

  getTranslatorPerformance: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/reports/translator-performance', { params });
    return response.data;
  },

  getFinancialSummary: async (year: number, month?: number, quarter?: number): Promise<FinancialReport> => {
    const response: AxiosResponse<FinancialReport> = await apiClient.get('/reports/financial-summary', {
      params: { year, month, quarter },
    });
    return response.data;
  },

  getCostSavings: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/reports/cost-savings', { params });
    return response.data;
  },

  getWordCountVerification: async (year: number, month: number, translatorId?: number): Promise<any> => {
    const response = await apiClient.get('/reports/word-count-verification', {
      params: { year, month, translator_id: translatorId },
    });
    return response.data;
  },
};

// AI Assistant API
export const aiAPI = {
  chat: async (message: string, sessionId?: string, context?: any): Promise<ChatResponse> => {
    const response: AxiosResponse<ChatResponse> = await apiClient.post('/ai/chat', {
      message,
      session_id: sessionId,
      context,
    });
    return response.data;
  },

  getConversationStarters: async (): Promise<any> => {
    const response = await apiClient.get('/ai/conversation-starters');
    return response.data;
  },

  translate: async (request: AITranslationRequest): Promise<AITranslationResponse> => {
    const response: AxiosResponse<AITranslationResponse> = await apiClient.post('/ai/translate', request);
    return response.data;
  },

  getTranslationMemory: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/ai/translation-memory', { params });
    return response.data;
  },

  addTranslationMemory: async (entry: any): Promise<any> => {
    const response = await apiClient.post('/ai/translation-memory', entry);
    return response.data;
  },

  getGlossary: async (params?: any): Promise<any> => {
    const response = await apiClient.get('/ai/glossary', { params });
    return response.data;
  },

  addGlossaryEntry: async (entry: any): Promise<any> => {
    const response = await apiClient.post('/ai/glossary', entry);
    return response.data;
  },

  updateGlossaryEntry: async (id: number, entry: any): Promise<any> => {
    const response = await apiClient.put(`/ai/glossary/${id}`, entry);
    return response.data;
  },

  deleteGlossaryEntry: async (id: number): Promise<void> => {
    await apiClient.delete(`/ai/glossary/${id}`);
  },

  getChatHistory: async (sessionId: string): Promise<any> => {
    const response = await apiClient.get(`/ai/chat-history/${sessionId}`);
    return response.data;
  },

  clearChatHistory: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/ai/chat-history/${sessionId}`);
  },
};