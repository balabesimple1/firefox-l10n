const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, authorizeResourceAccess } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, month, year, projectId, translatorId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (projectId) where.projectId = projectId;
    if (translatorId) where.translatorId = translatorId;

    // Filter by user role
    if (req.user.role === 'TRANSLATOR') {
      where.userId = req.user.id;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          lineItems: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    res.json({
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID
router.get('/:id', 
  authenticateToken, 
  authorizeResourceAccess('invoice'),
  async (req, res) => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
        include: {
          project: {
            select: { id: true, name: true, description: true }
          },
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          lineItems: true
        }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      console.error('Get invoice error:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  }
);

// Create invoice
router.post('/', 
  authenticateToken, 
  authorizeRoles('TRANSLATOR'), 
  validate(schemas.invoice),
  async (req, res) => {
    try {
      const { projectId, month, year, lineItems } = req.body;

      // Check if translator is assigned to this project
      const projectLocale = await prisma.projectLocale.findFirst({
        where: {
          projectId,
          translatorId: req.user.translatorProfile?.id
        }
      });

      if (!projectLocale) {
        return res.status(403).json({ error: 'Not assigned to this project' });
      }

      // Calculate total amount
      const totalAmount = lineItems.reduce((sum, item) => {
        return sum + (item.wordCount * item.ratePerWord);
      }, 0);

      // Generate invoice number
      const invoiceNumber = `INV-${year}-${month.toString().padStart(2, '0')}-${Date.now()}`;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          projectId,
          translatorId: req.user.translatorProfile.id,
          userId: req.user.id,
          month,
          year,
          totalAmount,
          lineItems: {
            create: lineItems.map(item => ({
              description: item.description,
              wordCount: item.wordCount,
              ratePerWord: item.ratePerWord,
              amount: item.wordCount * item.ratePerWord
            }))
          }
        },
        include: {
          project: {
            select: { id: true, name: true }
          },
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          lineItems: true
        }
      });

      res.status(201).json({
        message: 'Invoice created successfully',
        invoice
      });
    } catch (error) {
      console.error('Create invoice error:', error);
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  }
);

// Update invoice status
router.put('/:id/status', 
  authenticateToken,
  async (req, res) => {
    try {
      const { status } = req.body;

      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id }
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Check permissions
      if (req.user.role === 'TRANSLATOR' && invoice.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Only certain roles can approve/reject
      if (['APPROVED', 'REJECTED'].includes(status) && 
          !['ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Only finance team can mark as paid
      if (status === 'PAID' && req.user.role !== 'FINANCE_TEAM') {
        return res.status(403).json({ error: 'Only finance team can mark invoices as paid' });
      }

      const updateData = { status };
      if (status === 'SUBMITTED') updateData.submittedAt = new Date();
      if (status === 'APPROVED') updateData.approvedAt = new Date();
      if (status === 'PAID') updateData.paidAt = new Date();

      const updatedInvoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          project: {
            select: { id: true, name: true }
          },
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          lineItems: true
        }
      });

      res.json({
        message: 'Invoice status updated successfully',
        invoice: updatedInvoice
      });
    } catch (error) {
      console.error('Update invoice status error:', error);
      res.status(500).json({ error: 'Failed to update invoice status' });
    }
  }
);

// Get monthly payout report
router.get('/reports/monthly-payouts', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'FINANCE_TEAM'),
  async (req, res) => {
    try {
      const { month, year } = req.query;

      const where = {
        status: 'APPROVED'
      };
      if (month) where.month = parseInt(month);
      if (year) where.year = parseInt(year);

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          lineItems: true
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { translator: { user: { name: 'asc' } } }
        ]
      });

      // Group by translator
      const payoutsByTranslator = invoices.reduce((acc, invoice) => {
        const translatorId = invoice.translator.id;
        if (!acc[translatorId]) {
          acc[translatorId] = {
            translator: invoice.translator,
            totalAmount: 0,
            invoices: [],
            projects: new Set()
          };
        }
        acc[translatorId].totalAmount += invoice.totalAmount;
        acc[translatorId].invoices.push(invoice);
        acc[translatorId].projects.add(invoice.project.name);
        return acc;
      }, {});

      // Convert to array and add project names
      const payouts = Object.values(payoutsByTranslator).map(payout => ({
        ...payout,
        projects: Array.from(payout.projects)
      }));

      res.json({
        payouts,
        summary: {
          totalTranslators: payouts.length,
          totalAmount: payouts.reduce((sum, p) => sum + p.totalAmount, 0),
          totalInvoices: invoices.length
        }
      });
    } catch (error) {
      console.error('Get monthly payouts error:', error);
      res.status(500).json({ error: 'Failed to fetch monthly payouts' });
    }
  }
);

// Get spending by product report
router.get('/reports/spending-by-product', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'FINANCE_TEAM', 'PRODUCT_TEAM'),
  async (req, res) => {
    try {
      const { startDate, endDate, period = 'monthly' } = req.query;

      const where = {
        status: { in: ['APPROVED', 'PAID'] }
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          }
        }
      });

      // Group by project and period
      const spendingByProduct = invoices.reduce((acc, invoice) => {
        const projectName = invoice.project.name;
        const date = new Date(invoice.createdAt);
        let periodKey;

        if (period === 'yearly') {
          periodKey = date.getFullYear().toString();
        } else if (period === 'quarterly') {
          const quarter = Math.ceil((date.getMonth() + 1) / 3);
          periodKey = `${date.getFullYear()}-Q${quarter}`;
        } else {
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }

        if (!acc[projectName]) {
          acc[projectName] = {};
        }
        if (!acc[projectName][periodKey]) {
          acc[projectName][periodKey] = 0;
        }
        acc[projectName][periodKey] += invoice.totalAmount;

        return acc;
      }, {});

      res.json({ spendingByProduct });
    } catch (error) {
      console.error('Get spending by product error:', error);
      res.status(500).json({ error: 'Failed to fetch spending by product' });
    }
  }
);

module.exports = router;