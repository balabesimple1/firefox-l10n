import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Components
import Layout from './components/Layout/Layout'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Projects from './pages/Projects/Projects'
import ProjectDetail from './pages/Projects/ProjectDetail'
import Tasks from './pages/Tasks/Tasks'
import TaskDetail from './pages/Tasks/TaskDetail'
import Invoices from './pages/Invoices/Invoices'
import InvoiceDetail from './pages/Invoices/InvoiceDetail'
import Reports from './pages/Reports/Reports'
import Users from './pages/Users/Users'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import AIAssistant from './pages/AIAssistant/AIAssistant'

// Protected Route component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Projects */}
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                
                {/* Tasks */}
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                
                {/* Invoices */}
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                
                {/* Reports */}
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute roles={['ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Users Management */}
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute roles={['ADMIN']}>
                      <Users />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Settings */}
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute roles={['ADMIN']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Profile */}
                <Route path="/profile" element={<Profile />} />
                
                {/* AI Assistant */}
                <Route path="/ai-assistant" element={<AIAssistant />} />
                
                {/* 404 */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App