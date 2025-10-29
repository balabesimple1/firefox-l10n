import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Initialize auth state
      initialize: async () => {
        const token = localStorage.getItem('token')
        if (token) {
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            const response = await api.get('/auth/me')
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false
            })
          } catch (error) {
            console.error('Auth initialization failed:', error)
            get().logout()
          }
        } else {
          set({ isLoading: false })
        }
      },

      // Login
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Store in localStorage
          localStorage.setItem('token', token)

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })

          return { success: true }
        } catch (error) {
          console.error('Login failed:', error)
          return {
            success: false,
            error: error.response?.data?.error || 'Login failed'
          }
        }
      },

      // Register
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData)
          const { user, token } = response.data

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Store in localStorage
          localStorage.setItem('token', token)

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })

          return { success: true }
        } catch (error) {
          console.error('Registration failed:', error)
          return {
            success: false,
            error: error.response?.data?.error || 'Registration failed'
          }
        }
      },

      // Logout
      logout: () => {
        // Remove token from API headers
        delete api.defaults.headers.common['Authorization']
        
        // Remove from localStorage
        localStorage.removeItem('token')

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      // Update user profile
      updateProfile: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }))
      },

      // Refresh token
      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh')
          const { token } = response.data

          // Update token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          // Store in localStorage
          localStorage.setItem('token', token)

          set({ token })
          return true
        } catch (error) {
          console.error('Token refresh failed:', error)
          get().logout()
          return false
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Initialize auth on store creation
useAuthStore.getState().initialize()

export { useAuthStore }