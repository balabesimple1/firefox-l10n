const express = require('express');
const { query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const TranslationTask = require('../models/TranslationTask');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview based on user role
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    let data = {};

    switch (req.user.role) {
      case 'product':
        data = await getProductDashboard(req.user._id);
        break;
      case 'finance':
        data = await getFinanceDashboard();
        break;
      case 'translator':
        data = await getTranslatorDashboard(req.user._id);
        break;
      case 'admin':
        data = await getAdminDashboard();
        break;
      default:
        return res.status(403).json({ error: 'Invalid role' });
    }

    res.json(data);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Product team dashboard
async function getProductDashboard(userId) {
  const products = await Product.find({ owner: userId });
  const productIds = products.map(p => p._id);
  
  const tasks = await TranslationTask.find({ product: { $in: productIds } });
  const recentTasks = await TranslationTask.find({ product: { $in: productIds } })
    .populate('translator', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    summary: {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalCost: tasks.reduce((sum, t) => sum + t.cost.actual, 0),
      estimatedCost: tasks.reduce((sum, t) => sum + t.cost.estimated, 0),
      costSavedTM: tasks.reduce((sum, t) => sum + t.cost.savedTM, 0),
      costSavedAI: tasks.reduce((sum, t) => sum + t.cost.savedAI, 0)
    },
    recentTasks,
    products: products.slice(0, 5),
    chartData: {
      tasksByStatus: [
        { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
        { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length },
        { name: 'Approved', value: tasks.filter(t => t.status === 'approved').length }
      ],
      costOverTime: await getCostOverTime(productIds)
    }
  };
}

// Finance team dashboard
async function getFinanceDashboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const invoices = await Invoice.find();
  const currentMonthInvoices = await Invoice.find({ month: currentMonth, year: currentYear });
  
  const tasks = await TranslationTask.find();

  return {
    summary: {
      totalInvoices: invoices.length,
      pendingInvoices: invoices.filter(i => i.status === 'submitted').length,
      approvedInvoices: invoices.filter(i => i.status === 'approved').length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length,
      currentMonthTotal: currentMonthInvoices.reduce((sum, i) => sum + i.summary.finalAmount, 0),
      totalSpending: invoices.reduce((sum, i) => sum + i.summary.finalAmount, 0),
      avgInvoiceAmount: invoices.length > 0 ? invoices.reduce((sum, i) => sum + i.summary.finalAmount, 0) / invoices.length : 0
    },
    recentInvoices: await Invoice.find()
      .populate('translator', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10),
    chartData: {
      invoicesByStatus: [
        { name: 'Draft', value: invoices.filter(i => i.status === 'draft').length },
        { name: 'Submitted', value: invoices.filter(i => i.status === 'submitted').length },
        { name: 'Approved', value: invoices.filter(i => i.status === 'approved').length },
        { name: 'Paid', value: invoices.filter(i => i.status === 'paid').length }
      ],
      monthlySpending: await getMonthlySpending()
    }
  };
}

// Translator dashboard
async function getTranslatorDashboard(userId) {
  const tasks = await TranslationTask.find({ translator: userId });
  const recentTasks = await TranslationTask.find({ translator: userId })
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  const invoices = await Invoice.find({ translator: userId });

  return {
    summary: {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      totalWordsTranslated: tasks.reduce((sum, t) => sum + t.wordCount.translated, 0),
      totalEarnings: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.summary.finalAmount, 0),
      pendingEarnings: invoices.filter(i => i.status === 'approved').reduce((sum, i) => sum + i.summary.finalAmount, 0),
      avgQualityScore: tasks.filter(t => t.qualityScore).reduce((sum, t, _, arr) => sum + t.qualityScore / arr.length, 0)
    },
    recentTasks,
    chartData: {
      tasksByStatus: [
        { name: 'Pending', value: tasks.filter(t => t.status === 'pending').length },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length },
        { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length }
      ],
      earningsOverTime: await getEarningsOverTime(userId)
    }
  };
}

// Admin dashboard
async function getAdminDashboard() {
  const products = await Product.find();
  const tasks = await TranslationTask.find();
  const invoices = await Invoice.find();
  const users = await User.find();

  return {
    summary: {
      totalProducts: products.length,
      totalTasks: tasks.length,
      totalInvoices: invoices.length,
      totalUsers: users.length,
      activeTranslators: users.filter(u => u.role === 'translator' && u.isActive).length,
      totalSpending: invoices.reduce((sum, i) => sum + i.summary.finalAmount, 0),
      avgTaskCompletion: tasks.length > 0 ? tasks.filter(t => t.status === 'completed').length / tasks.length * 100 : 0
    },
    chartData: {
      usersByRole: [
        { name: 'Product', value: users.filter(u => u.role === 'product').length },
        { name: 'Finance', value: users.filter(u => u.role === 'finance').length },
        { name: 'Translator', value: users.filter(u => u.role === 'translator').length },
        { name: 'Admin', value: users.filter(u => u.role === 'admin').length }
      ],
      tasksByProduct: products.slice(0, 10).map(product => ({
        name: product.name,
        value: tasks.filter(t => t.product.toString() === product._id.toString()).length
      }))
    }
  };
}

// Helper functions for chart data
async function getCostOverTime(productIds) {
  const tasks = await TranslationTask.find({ product: { $in: productIds } });
  const monthlyData = {};

  tasks.forEach(task => {
    const month = task.createdAt.toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    monthlyData[month] += task.cost.actual || task.cost.estimated;
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // Last 12 months
    .map(([month, cost]) => ({ month, cost }));
}

async function getMonthlySpending() {
  const invoices = await Invoice.find({ status: { $in: ['approved', 'paid'] } });
  const monthlyData = {};

  invoices.forEach(invoice => {
    const key = `${invoice.year}-${String(invoice.month).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = 0;
    }
    monthlyData[key] += invoice.summary.finalAmount;
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month, amount }));
}

async function getEarningsOverTime(translatorId) {
  const invoices = await Invoice.find({ 
    translator: translatorId, 
    status: { $in: ['approved', 'paid'] } 
  });
  
  const monthlyData = {};

  invoices.forEach(invoice => {
    const key = `${invoice.year}-${String(invoice.month).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = 0;
    }
    monthlyData[key] += invoice.summary.finalAmount;
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, earnings]) => ({ month, earnings }));
}

module.exports = router;