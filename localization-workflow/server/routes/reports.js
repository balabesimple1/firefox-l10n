const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const baseStats = await Promise.all([
      // Total projects
      prisma.project.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Total translation tasks
      prisma.translationTask.count(),
      
      // Tasks by status
      prisma.translationTask.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Total translators
      prisma.translator.count(),
      
      // Recent invoices
      prisma.invoice.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Total spending this period
      prisma.invoice.aggregate({
        where: {
          status: { in: ['APPROVED', 'PAID'] },
          createdAt: { gte: startDate }
        },
        _sum: { totalAmount: true }
      })
    ]);

    // Role-specific statistics
    let roleSpecificStats = {};
    
    if (req.user.role === 'TRANSLATOR') {
      const translatorStats = await Promise.all([
        prisma.translationTask.count({
          where: { assigneeId: req.user.id }
        }),
        prisma.translationTask.count({
          where: { 
            assigneeId: req.user.id,
            status: 'COMPLETED'
          }
        }),
        prisma.invoice.aggregate({
          where: { 
            userId: req.user.id,
            status: 'PAID'
          },
          _sum: { totalAmount: true }
        })
      ]);
      
      roleSpecificStats = {
        myTasks: translatorStats[0],
        completedTasks: translatorStats[1],
        totalEarnings: translatorStats[2]._sum.totalAmount || 0
      };
    }

    res.json({
      period,
      stats: {
        activeProjects: baseStats[0],
        totalTasks: baseStats[1],
        tasksByStatus: baseStats[2].reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
        totalTranslators: baseStats[3],
        recentInvoices: baseStats[4],
        totalSpending: baseStats[5]._sum.totalAmount || 0,
        ...roleSpecificStats
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get locale status report
router.get('/locale-status', authenticateToken, async (req, res) => {
  try {
    const { projectId, period = 'overall' } = req.query;
    
    let dateFilter = {};
    if (period !== 'overall') {
      const now = new Date();
      if (period === 'this_month') {
        dateFilter = {
          updatedAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
      } else if (period === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          updatedAt: {
            gte: lastMonth,
            lt: thisMonth
          }
        };
      }
    }

    const where = {};
    if (projectId) where.projectId = projectId;

    const localeStats = await prisma.projectLocale.findMany({
      where,
      include: {
        locale: true,
        project: {
          select: { id: true, name: true }
        },
        translator: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    // Get translation tasks for each locale
    const localeStatsWithTasks = await Promise.all(
      localeStats.map(async (localeData) => {
        const tasks = await prisma.translationTask.findMany({
          where: {
            projectId: localeData.projectId,
            localeId: localeData.localeId,
            ...dateFilter
          }
        });

        const taskStats = tasks.reduce((acc, task) => {
          acc.total++;
          acc.totalWords += task.wordCount;
          if (task.status === 'COMPLETED') acc.completed++;
          if (task.status === 'IN_PROGRESS') acc.inProgress++;
          if (task.status === 'PENDING') acc.pending++;
          return acc;
        }, {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          totalWords: 0
        });

        return {
          ...localeData,
          taskStats
        };
      })
    );

    res.json({
      period,
      localeStats: localeStatsWithTasks
    });
  } catch (error) {
    console.error('Get locale status error:', error);
    res.status(500).json({ error: 'Failed to fetch locale status report' });
  }
});

// Get cost savings report
router.get('/cost-savings', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM'),
  async (req, res) => {
    try {
      const { startDate, endDate, projectId } = req.query;

      const where = {};
      if (projectId) where.projectId = projectId;
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const tasks = await prisma.translationTask.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          locale: true
        }
      });

      const savings = tasks.reduce((acc, task) => {
        const aiSavings = task.aiCostSavings || 0;
        const tmSavings = task.tmCostSavings || 0;
        
        acc.totalAiSavings += aiSavings;
        acc.totalTmSavings += tmSavings;
        acc.totalSavings += aiSavings + tmSavings;
        
        if (task.aiTranslated) acc.aiTranslatedTasks++;
        if (tmSavings > 0) acc.tmUtilizedTasks++;
        
        return acc;
      }, {
        totalAiSavings: 0,
        totalTmSavings: 0,
        totalSavings: 0,
        aiTranslatedTasks: 0,
        tmUtilizedTasks: 0,
        totalTasks: tasks.length
      });

      // Group savings by project
      const savingsByProject = tasks.reduce((acc, task) => {
        const projectName = task.project.name;
        if (!acc[projectName]) {
          acc[projectName] = {
            aiSavings: 0,
            tmSavings: 0,
            totalSavings: 0,
            tasks: 0
          };
        }
        
        acc[projectName].aiSavings += task.aiCostSavings || 0;
        acc[projectName].tmSavings += task.tmCostSavings || 0;
        acc[projectName].totalSavings += (task.aiCostSavings || 0) + (task.tmCostSavings || 0);
        acc[projectName].tasks++;
        
        return acc;
      }, {});

      res.json({
        summary: savings,
        byProject: savingsByProject
      });
    } catch (error) {
      console.error('Get cost savings error:', error);
      res.status(500).json({ error: 'Failed to fetch cost savings report' });
    }
  }
);

// Get translation progress report
router.get('/translation-progress', authenticateToken, async (req, res) => {
  try {
    const { projectId, localeId, translatorId, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (localeId) where.localeId = localeId;
    if (translatorId) where.assigneeId = translatorId;
    if (startDate && endDate) {
      where.updatedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Filter by user role
    if (req.user.role === 'TRANSLATOR') {
      where.assigneeId = req.user.id;
    }

    const tasks = await prisma.translationTask.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        },
        locale: true,
        assignee: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Group by status and calculate progress
    const progressStats = tasks.reduce((acc, task) => {
      acc.total++;
      acc.totalWords += task.wordCount;
      
      switch (task.status) {
        case 'PENDING':
          acc.pending++;
          break;
        case 'IN_PROGRESS':
          acc.inProgress++;
          break;
        case 'COMPLETED':
          acc.completed++;
          acc.completedWords += task.wordCount;
          break;
        case 'REVIEW_REQUIRED':
          acc.reviewRequired++;
          break;
        case 'APPROVED':
          acc.approved++;
          acc.approvedWords += task.wordCount;
          break;
        case 'REJECTED':
          acc.rejected++;
          break;
      }
      
      return acc;
    }, {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      reviewRequired: 0,
      approved: 0,
      rejected: 0,
      totalWords: 0,
      completedWords: 0,
      approvedWords: 0
    });

    // Calculate completion percentage
    progressStats.completionPercentage = progressStats.total > 0 
      ? Math.round((progressStats.completed / progressStats.total) * 100) 
      : 0;
    
    progressStats.wordCompletionPercentage = progressStats.totalWords > 0 
      ? Math.round((progressStats.completedWords / progressStats.totalWords) * 100) 
      : 0;

    res.json({
      progressStats,
      tasks: tasks.slice(0, 50) // Limit to recent 50 tasks
    });
  } catch (error) {
    console.error('Get translation progress error:', error);
    res.status(500).json({ error: 'Failed to fetch translation progress report' });
  }
});

// Get word count verification report
router.get('/word-count-verification', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM'),
  async (req, res) => {
    try {
      const { month, year } = req.query;
      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();

      // Get all completed tasks for the specified month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);

      const completedTasks = await prisma.translationTask.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          project: {
            select: { id: true, name: true }
          },
          locale: true,
          assignee: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Get corresponding invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          month: targetMonth,
          year: targetYear
        },
        include: {
          lineItems: true,
          project: {
            select: { id: true, name: true }
          },
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      // Calculate totals
      const taskWordCount = completedTasks.reduce((sum, task) => sum + task.wordCount, 0);
      const invoiceWordCount = invoices.reduce((sum, invoice) => {
        return sum + invoice.lineItems.reduce((itemSum, item) => itemSum + item.wordCount, 0);
      }, 0);

      // Group by project and translator
      const verification = {
        month: targetMonth,
        year: targetYear,
        summary: {
          totalTaskWords: taskWordCount,
          totalInvoiceWords: invoiceWordCount,
          difference: taskWordCount - invoiceWordCount,
          matchPercentage: taskWordCount > 0 ? Math.round((invoiceWordCount / taskWordCount) * 100) : 0
        },
        byProject: {},
        discrepancies: []
      };

      // Analyze by project
      completedTasks.forEach(task => {
        const projectName = task.project.name;
        if (!verification.byProject[projectName]) {
          verification.byProject[projectName] = {
            taskWords: 0,
            invoiceWords: 0,
            tasks: [],
            invoices: []
          };
        }
        verification.byProject[projectName].taskWords += task.wordCount;
        verification.byProject[projectName].tasks.push(task);
      });

      invoices.forEach(invoice => {
        const projectName = invoice.project.name;
        const invoiceWords = invoice.lineItems.reduce((sum, item) => sum + item.wordCount, 0);
        
        if (verification.byProject[projectName]) {
          verification.byProject[projectName].invoiceWords += invoiceWords;
          verification.byProject[projectName].invoices.push(invoice);
        }
      });

      // Find discrepancies
      Object.entries(verification.byProject).forEach(([projectName, data]) => {
        const difference = data.taskWords - data.invoiceWords;
        if (Math.abs(difference) > 0) {
          verification.discrepancies.push({
            project: projectName,
            taskWords: data.taskWords,
            invoiceWords: data.invoiceWords,
            difference
          });
        }
      });

      res.json(verification);
    } catch (error) {
      console.error('Get word count verification error:', error);
      res.status(500).json({ error: 'Failed to fetch word count verification report' });
    }
  }
);

module.exports = router;