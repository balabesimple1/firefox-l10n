import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import ProductDetail from './pages/Products/ProductDetail';
import Translations from './pages/Translations/Translations';
import TranslationDetail from './pages/Translations/TranslationDetail';
import Invoices from './pages/Invoices/Invoices';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import Users from './pages/Admin/Users';
import Profile from './pages/Profile/Profile';
import AIAssistant from './pages/AI/AIAssistant';
import LoadingSpinner from './components/Common/LoadingSpinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        
        {/* Product Team & Admin Routes */}
        {(['product', 'admin'].includes(user.role)) && (
          <>
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
          </>
        )}
        
        {/* Translation Routes (All roles can view) */}
        <Route path="/translations" element={<Translations />} />
        <Route path="/translations/:id" element={<TranslationDetail />} />
        
        {/* Invoice Routes (Finance, Translator, Admin) */}
        {(['finance', 'translator', 'admin'].includes(user.role)) && (
          <>
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
          </>
        )}
        
        {/* Admin Only Routes */}
        {user.role === 'admin' && (
          <Route path="/admin/users" element={<Users />} />
        )}
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;