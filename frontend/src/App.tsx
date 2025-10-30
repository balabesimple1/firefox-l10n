import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Translators from './pages/Translators';
import Tasks from './pages/Tasks';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import AIAssistant from './pages/AIAssistant';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects/*" element={<Projects />} />
        <Route path="/translators/*" element={<Translators />} />
        <Route path="/tasks/*" element={<Tasks />} />
        <Route path="/invoices/*" element={<Invoices />} />
        <Route path="/reports/*" element={<Reports />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;