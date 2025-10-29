import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from './api'
import toast from 'react-hot-toast'

// Query keys
export const queryKeys = {
  // Dashboard
  dashboard: (period) => ['dashboard', period],
  
  // Projects
  projects: (filters) => ['projects', filters],
  project: (id) => ['project', id],
  
  // Tasks
  tasks: (filters) => ['tasks', filters],
  task: (id) => ['task', id],
  
  // Invoices
  invoices: (filters) => ['invoices', filters],
  invoice: (id) => ['invoice', id],
  
  // Reports
  localeStatus: (filters) => ['reports', 'locale-status', filters],
  costSavings: (filters) => ['reports', 'cost-savings', filters],
  translationProgress: (filters) => ['reports', 'translation-progress', filters],
  wordCountVerification: (filters) => ['reports', 'word-count-verification', filters],
  monthlyPayouts: (filters) => ['reports', 'monthly-payouts', filters],
  spendingByProduct: (filters) => ['reports', 'spending-by-product', filters],
  
  // Users
  users: (filters) => ['users', filters],
  translators: (filters) => ['translators', filters],
  translatorRates: (translatorId) => ['translator-rates', translatorId],
  
  // Locales
  locales: ['locales'],
  
  // Translation Memory & Glossary
  translationMemory: (filters) => ['translation-memory', filters],
  glossary: (filters) => ['glossary', filters],
  
  // AI
  aiStats: (filters) => ['ai-stats', filters],
  conversationStarters: ['conversation-starters'],
  
  // Admin
  systemStats: ['admin', 'stats'],
  systemSettings: ['admin', 'settings'],
  auditLog: (filters) => ['admin', 'audit-log', filters]
}

// Dashboard Queries
export const useDashboardStats = (period = 'month') => {
  return useQuery(
    queryKeys.dashboard(period),
    () => api.get(`/reports/dashboard?period=${period}`).then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
}

// Project Queries
export const useProjects = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.projects(filters),
    () => api.get(`/projects?${queryString}`).then(res => res.data),
    {
      keepPreviousData: true,
    }
  )
}

export const useProject = (id) => {
  return useQuery(
    queryKeys.project(id),
    () => api.get(`/projects/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  )
}

// Task Queries
export const useTasks = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.tasks(filters),
    () => api.get(`/translations/tasks?${queryString}`).then(res => res.data),
    {
      keepPreviousData: true,
    }
  )
}

export const useTask = (id) => {
  return useQuery(
    queryKeys.task(id),
    () => api.get(`/translations/tasks/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  )
}

// Invoice Queries
export const useInvoices = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.invoices(filters),
    () => api.get(`/invoices?${queryString}`).then(res => res.data),
    {
      keepPreviousData: true,
    }
  )
}

export const useInvoice = (id) => {
  return useQuery(
    queryKeys.invoice(id),
    () => api.get(`/invoices/${id}`).then(res => res.data),
    {
      enabled: !!id,
    }
  )
}

// Report Queries
export const useLocaleStatusReport = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.localeStatus(filters),
    () => api.get(`/reports/locale-status?${queryString}`).then(res => res.data)
  )
}

export const useCostSavingsReport = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.costSavings(filters),
    () => api.get(`/reports/cost-savings?${queryString}`).then(res => res.data)
  )
}

// User Queries
export const useUsers = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.users(filters),
    () => api.get(`/users?${queryString}`).then(res => res.data),
    {
      keepPreviousData: true,
    }
  )
}

export const useTranslators = (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString()
  return useQuery(
    queryKeys.translators(filters),
    () => api.get(`/users/translators?${queryString}`).then(res => res.data)
  )
}

// Locale Queries
export const useLocales = () => {
  return useQuery(
    queryKeys.locales,
    () => api.get('/translations/locales').then(res => res.data),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  )
}

// AI Queries
export const useConversationStarters = () => {
  return useQuery(
    queryKeys.conversationStarters,
    () => api.get('/ai/conversation-starters').then(res => res.data),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
    }
  )
}

// Mutations
export const useCreateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (projectData) => api.post('/projects', projectData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects'])
        toast.success('Project created successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create project')
      }
    }
  )
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    ({ id, ...data }) => api.put(`/projects/${id}`, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['projects'])
        queryClient.invalidateQueries(['project', variables.id])
        toast.success('Project updated successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update project')
      }
    }
  )
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (taskData) => api.post('/translations/tasks', taskData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task created successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create task')
      }
    }
  )
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    ({ id, ...data }) => api.put(`/translations/tasks/${id}`, data),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['tasks'])
        queryClient.invalidateQueries(['task', variables.id])
        toast.success('Task updated successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update task')
      }
    }
  )
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (invoiceData) => api.post('/invoices', invoiceData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['invoices'])
        toast.success('Invoice created successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create invoice')
      }
    }
  )
}

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    ({ id, status }) => api.put(`/invoices/${id}/status`, { status }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['invoices'])
        queryClient.invalidateQueries(['invoice', variables.id])
        toast.success('Invoice status updated successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update invoice status')
      }
    }
  )
}

export const useAIChat = () => {
  return useMutation(
    ({ message, context }) => api.post('/ai/chat', { message, context }),
    {
      onError: (error) => {
        toast.error(error.response?.data?.error || 'AI assistant is temporarily unavailable')
      }
    }
  )
}

export const useAITranslate = () => {
  return useMutation(
    (translateData) => api.post('/ai/translate', translateData),
    {
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Translation failed')
      }
    }
  )
}