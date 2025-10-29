const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Invoice = require('../models/Invoice');
const TranslationTask = require('../models/TranslationTask');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get invoices with filtering
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  query('translator').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    const filter = {};

    if (req.user.role === 'translator') {
      filter.translator = req.user._id;
    }

    // Apply query filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.month) filter.month = parseInt(req.query.month);
    if (req.query.year) filter.year = parseInt(req.query.year);
    if (req.query.translator) filter.translator = req.query.translator;

    const invoices = await Invoice.find(filter)
      .populate('translator', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('tasks.product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(filter);

    res.json({
      invoices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get single invoice
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('translator', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('tasks.product', 'name repository')
      .populate('tasks.task');

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check access permissions
    if (req.user.role === 'translator' && invoice.translator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create new invoice
router.post('/', authenticateToken, requireRole('translator', 'admin'), [
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2020 }),
  body('taskIds').isArray({ min: 1 }),
  body('taskIds.*').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { month, year, taskIds } = req.body;
    const translatorId = req.user.role === 'translator' ? req.user._id : req.body.translatorId;

    // Check if invoice already exists for this period
    const existingInvoice = await Invoice.findOne({
      translator: translatorId,
      month,
      year
    });

    if (existingInvoice) {
      return res.status(400).json({ 
        error: 'Invoice already exists for this period' 
      });
    }

    // Verify tasks exist and belong to translator
    const tasks = await TranslationTask.find({
      _id: { $in: taskIds },
      translator: translatorId,
      status: { $in: ['completed', 'reviewed', 'approved'] }
    }).populate('product', 'name');

    if (tasks.length !== taskIds.length) {
      return res.status(400).json({ 
        error: 'Some tasks not found or not eligible for invoicing' 
      });
    }

    // Create invoice tasks
    const invoiceTasks = tasks.map(task => ({
      task: task._id,
      product: task.product._id,
      wordCount: task.wordCount.translated,
      ratePerWord: task.cost.estimated / task.wordCount.total,
      amount: task.cost.actual || task.cost.estimated,
      description: `${task.title} - ${task.locale.name}`
    }));

    const invoice = new Invoice({
      translator: translatorId,
      month,
      year,
      tasks: invoiceTasks,
      status: 'draft'
    });

    await invoice.save();
    await invoice.populate([
      { path: 'translator', select: 'firstName lastName email' },
      { path: 'tasks.product', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']),
  body('notes.translator').optional().isLength({ max: 1000 }),
  body('notes.finance').optional().isLength({ max: 1000 }),
  body('paymentReference').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      (req.user.role === 'translator' && invoice.translator.toString() === req.user._id.toString()) ||
      req.user.role === 'finance';

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {};

    // Role-based update permissions
    if (req.user.role === 'translator') {
      // Translators can only update draft invoices and add notes
      if (invoice.status !== 'draft' && req.body.status) {
        return res.status(400).json({ error: 'Cannot modify submitted invoice' });
      }
      if (req.body.status) updates.status = req.body.status;
      if (req.body.notes?.translator) updates['notes.translator'] = req.body.notes.translator;
      
      if (req.body.status === 'submitted') {
        updates.submittedAt = new Date();
      }
    }

    if (req.user.role === 'finance' || req.user.role === 'admin') {
      // Finance can approve/reject and add notes
      if (req.body.status) {
        updates.status = req.body.status;
        
        if (req.body.status === 'under_review') {
          updates.reviewedAt = new Date();
          updates.reviewedBy = req.user._id;
        } else if (req.body.status === 'approved') {
          updates.approvedAt = new Date();
          updates.approvedBy = req.user._id;
        } else if (req.body.status === 'paid') {
          updates.paidAt = new Date();
        }
      }
      
      if (req.body.notes?.finance) updates['notes.finance'] = req.body.notes.finance;
      if (req.body.paymentReference) updates.paymentReference = req.body.paymentReference;
    }

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'translator', select: 'firstName lastName email' },
      { path: 'reviewedBy', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'tasks.product', select: 'name' }
    ]);

    res.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Get monthly invoice summary
router.get('/summary/monthly', authenticateToken, requireRole('finance', 'admin'), [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const currentDate = new Date();
    const month = parseInt(req.query.month) || currentDate.getMonth() + 1;
    const year = parseInt(req.query.year) || currentDate.getFullYear();

    const invoices = await Invoice.find({ month, year })
      .populate('translator', 'firstName lastName email')
      .populate('tasks.product', 'name');

    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.summary.finalAmount, 0),
      byStatus: {
        draft: invoices.filter(inv => inv.status === 'draft').length,
        submitted: invoices.filter(inv => inv.status === 'submitted').length,
        under_review: invoices.filter(inv => inv.status === 'under_review').length,
        approved: invoices.filter(inv => inv.status === 'approved').length,
        rejected: invoices.filter(inv => inv.status === 'rejected').length,
        paid: invoices.filter(inv => inv.status === 'paid').length
      },
      byTranslator: invoices.reduce((acc, inv) => {
        const translatorName = inv.translator.fullName;
        if (!acc[translatorName]) {
          acc[translatorName] = {
            translator: inv.translator,
            invoiceCount: 0,
            totalAmount: 0,
            wordCount: 0
          };
        }
        acc[translatorName].invoiceCount += 1;
        acc[translatorName].totalAmount += inv.summary.finalAmount;
        acc[translatorName].wordCount += inv.summary.totalWordCount;
        return acc;
      }, {}),
      byProduct: invoices.reduce((acc, inv) => {
        inv.tasks.forEach(task => {
          const productName = task.product.name;
          if (!acc[productName]) {
            acc[productName] = {
              product: task.product,
              totalAmount: 0,
              wordCount: 0,
              taskCount: 0
            };
          }
          acc[productName].totalAmount += task.amount;
          acc[productName].wordCount += task.wordCount;
          acc[productName].taskCount += 1;
        });
        return acc;
      }, {})
    };

    res.json(summary);
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly summary' });
  }
});

// Bulk approve invoices
router.put('/bulk/approve', authenticateToken, requireRole('finance', 'admin'), [
  body('invoiceIds').isArray({ min: 1 }),
  body('invoiceIds.*').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { invoiceIds } = req.body;

    const result = await Invoice.updateMany(
      { 
        _id: { $in: invoiceIds },
        status: { $in: ['submitted', 'under_review'] }
      },
      {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user._id
      }
    );

    res.json({
      message: 'Invoices approved successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: 'Failed to approve invoices' });
  }
});

module.exports = router;