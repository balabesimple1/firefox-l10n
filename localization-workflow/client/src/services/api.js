import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
          toast.error('Session expired. Please login again.')
          break
        
        case 403:
          toast.error('Access denied. Insufficient permissions.')
          break
        
        case 404:
          toast.error('Resource not found.')
          break
        
        case 422:
          // Validation errors
          if (data.details) {
            data.details.forEach(detail => {
              toast.error(`${detail.field}: ${detail.message}`)
            })
          } else {
            toast.error(data.error || 'Validation failed')
          }
          break
        
        case 500:
          toast.error('Server error. Please try again later.')
          break
        
        default:
          toast.error(data.error || 'An error occurred')
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('An unexpected error occurred')
    }

    return Promise.reject(error)
  }
)

export default api