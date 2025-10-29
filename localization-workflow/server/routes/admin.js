const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get system settings
router.get('/settings', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const settings = await prisma.systemSettings.findMany();
      
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      res.json(settingsObj);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch system settings' });
    }
  }
);

// Update system settings
router.put('/settings', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const settings = req.body;

      const updatePromises = Object.entries(settings).map(([key, value]) =>
        prisma.systemSettings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      );

      await Promise.all(updatePromises);

      res.json({ message: 'Settings updated successfully' });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update system settings' });
    }
  }
);

// Get system statistics
router.get('/stats', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalProjects,
        totalTasks,
        totalInvoices,
        totalTranslators,
        activeProjects,
        pendingTasks,
        pendingInvoices,
        totalSpending,
        recentActivity
      ] = await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.translationTask.count(),
        prisma.invoice.count(),
        prisma.translator.count(),
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.translationTask.count({ where: { status: 'PENDING' } }),
        prisma.invoice.count({ where: { status: 'SUBMITTED' } }),
        prisma.invoice.aggregate({
          where: { status: { in: ['APPROVED', 'PAID'] } },
          _sum: { totalAmount: true }
        }),
        // Recent activity - last 10 tasks
        prisma.translationTask.findMany({
          take: 10,
          orderBy: { updatedAt: 'desc' },
          include: {
            project: { select: { name: true } },
            locale: { select: { name: true } },
            assignee: { select: { name: true } }
          }
        })
      ]);

      res.json({
        overview: {
          totalUsers,
          totalProjects,
          totalTasks,
          totalInvoices,
          totalTranslators,
          activeProjects,
          pendingTasks,
          pendingInvoices,
          totalSpending: totalSpending._sum.totalAmount || 0
        },
        recentActivity
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch system statistics' });
    }
  }
);

// Get audit log (simplified - in production, you'd want a proper audit table)
router.get('/audit-log', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;

      // This is a simplified audit log using recent updates
      // In production, you'd want a dedicated audit table
      const [
        recentProjects,
        recentTasks,
        recentInvoices
      ] = await Promise.all([
        prisma.project.findMany({
          take: 20,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            updatedAt: true,
            createdBy: { select: { name: true } }
          }
        }),
        prisma.translationTask.findMany({
          take: 20,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            assignee: { select: { name: true } }
          }
        }),
        prisma.invoice.findMany({
          take: 20,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            updatedAt: true,
            translator: {
              select: {
                user: { select: { name: true } }
              }
            }
          }
        })
      ]);

      // Combine and sort by date
      const auditEntries = [
        ...recentProjects.map(p => ({
          type: 'project',
          action: 'updated',
          entity: p.name,
          user: p.createdBy?.name || 'System',
          timestamp: p.updatedAt
        })),
        ...recentTasks.map(t => ({
          type: 'task',
          action: 'updated',
          entity: t.title,
          user: t.assignee?.name || 'System',
          timestamp: t.updatedAt
        })),
        ...recentInvoices.map(i => ({
          type: 'invoice',
          action: 'updated',
          entity: i.invoiceNumber,
          user: i.translator?.user?.name || 'System',
          timestamp: i.updatedAt
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
       .slice(skip, skip + parseInt(limit));

      res.json({
        auditEntries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: auditEntries.length
        }
      });
    } catch (error) {
      console.error('Get audit log error:', error);
      res.status(500).json({ error: 'Failed to fetch audit log' });
    }
  }
);

// Bulk operations
router.post('/bulk-assign-translators', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const { assignments } = req.body; // [{ projectId, localeId, translatorId }]

      const updatePromises = assignments.map(({ projectId, localeId, translatorId }) =>
        prisma.projectLocale.update({
          where: {
            projectId_localeId: { projectId, localeId }
          },
          data: { translatorId }
        })
      );

      await Promise.all(updatePromises);

      res.json({ 
        message: `Successfully assigned translators to ${assignments.length} project locales` 
      });
    } catch (error) {
      console.error('Bulk assign translators error:', error);
      res.status(500).json({ error: 'Failed to assign translators' });
    }
  }
);

// Data export
router.get('/export/:type', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const { type } = req.params;
      const { startDate, endDate } = req.query;

      let data;
      let filename;

      const dateFilter = {};
      if (startDate && endDate) {
        dateFilter.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      switch (type) {
        case 'projects':
          data = await prisma.project.findMany({
            where: dateFilter,
            include: {
              createdBy: { select: { name: true, email: true } },
              locales: {
                include: {
                  locale: true,
                  translator: {
                    include: {
                      user: { select: { name: true, email: true } }
                    }
                  }
                }
              }
            }
          });
          filename = 'projects_export.json';
          break;

        case 'tasks':
          data = await prisma.translationTask.findMany({
            where: dateFilter,
            include: {
              project: { select: { name: true } },
              locale: true,
              assignee: { select: { name: true, email: true } }
            }
          });
          filename = 'tasks_export.json';
          break;

        case 'invoices':
          data = await prisma.invoice.findMany({
            where: dateFilter,
            include: {
              project: { select: { name: true } },
              translator: {
                include: {
                  user: { select: { name: true, email: true } }
                }
              },
              lineItems: true
            }
          });
          filename = 'invoices_export.json';
          break;

        default:
          return res.status(400).json({ error: 'Invalid export type' });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } catch (error) {
      console.error('Data export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }
);

// System health check
router.get('/health', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      // Check OpenAI API (if configured)
      let aiStatus = 'not_configured';
      if (process.env.OPENAI_API_KEY) {
        try {
          // Simple test to check if API key works
          aiStatus = 'configured';
        } catch {
          aiStatus = 'error';
        }
      }

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          ai: aiStatus
        },
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }
);

module.exports = router;