const express = require('express');
const { body, validationResult, query } = require('express-validator');
const TranslationTask = require('../models/TranslationTask');
const Product = require('../models/Product');
const User = require('../models/User');
const { authenticateToken, requireRole, requireTranslationAccess } = require('../middleware/auth');

const router = express.Router();

// Get translation tasks with filtering
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'reviewed', 'approved', 'rejected', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('product').optional().isMongoId(),
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
    } else if (req.user.role === 'product') {
      // Get products owned by this user
      const userProducts = await Product.find({ owner: req.user._id }).select('_id');
      filter.product = { $in: userProducts.map(p => p._id) };
    }

    // Apply query filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.product) filter.product = req.query.product;
    if (req.query.translator) filter.translator = req.query.translator;

    const tasks = await TranslationTask.find(filter)
      .populate('product', 'name repository owner')
      .populate('translator', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TranslationTask.countDocuments(filter);

    res.json({
      tasks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get translation tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch translation tasks' });
  }
});

// Get single translation task
router.get('/:id', authenticateToken, requireTranslationAccess, async (req, res) => {
  try {
    const task = await TranslationTask.findById(req.params.id)
      .populate('product', 'name repository owner settings')
      .populate('translator', 'firstName lastName email')
      .populate('assignedBy', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({ error: 'Translation task not found' });
    }

    // Check access permissions
    if (req.user.role === 'translator' && task.translator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'product' && task.product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get translation task error:', error);
    res.status(500).json({ error: 'Failed to fetch translation task' });
  }
});

// Create new translation task
router.post('/', authenticateToken, requireRole('product', 'admin'), [
  body('productId').isMongoId(),
  body('locale.code').isLength({ min: 2, max: 10 }),
  body('locale.name').isLength({ min: 1, max: 50 }),
  body('translatorId').isMongoId(),
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('wordCount.total').isInt({ min: 1 }),
  body('deadline').isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      productId,
      locale,
      translatorId,
      title,
      description,
      wordCount,
      deadline,
      priority = 'medium'
    } = req.body;

    // Verify product exists and user has access
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'product' && product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied to this product' });
    }

    // Verify translator exists and has translator role
    const translator = await User.findById(translatorId);
    if (!translator || translator.role !== 'translator') {
      return res.status(400).json({ error: 'Invalid translator' });
    }

    // Get rate for this locale from product settings
    const productLocale = product.locales.find(l => l.code === locale.code);
    const ratePerWord = productLocale?.ratePerWord || 0.10;

    // Calculate estimated cost and delivery
    const estimatedCost = wordCount.total * ratePerWord;
    const estimatedDelivery = new Date(deadline);

    // Check if auto-approval applies
    const isAutoApproved = estimatedCost <= product.settings.autoApprovalThreshold;

    const task = new TranslationTask({
      product: productId,
      locale,
      translator: translatorId,
      assignedBy: req.user._id,
      title,
      description,
      wordCount: {
        total: wordCount.total,
        translated: 0,
        reviewed: 0,
        approved: 0
      },
      cost: {
        estimated: estimatedCost,
        actual: 0,
        savedTM: 0,
        savedAI: 0
      },
      deadline: new Date(deadline),
      estimatedDelivery,
      priority,
      status: isAutoApproved ? 'approved' : 'pending',
      isAutoApproved
    });

    await task.save();
    await task.populate([
      { path: 'product', select: 'name repository' },
      { path: 'translator', select: 'firstName lastName email' },
      { path: 'assignedBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      message: 'Translation task created successfully',
      task
    });
  } catch (error) {
    console.error('Create translation task error:', error);
    res.status(500).json({ error: 'Failed to create translation task' });
  }
});

// Update translation task
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['pending', 'in_progress', 'completed', 'reviewed', 'approved', 'rejected', 'cancelled']),
  body('wordCount.translated').optional().isInt({ min: 0 }),
  body('wordCount.reviewed').optional().isInt({ min: 0 }),
  body('cost.actual').optional().isNumeric(),
  body('qualityScore').optional().isInt({ min: 0, max: 100 }),
  body('feedback.translator').optional().isLength({ max: 1000 }),
  body('feedback.reviewer').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await TranslationTask.findById(req.params.id)
      .populate('product', 'owner');

    if (!task) {
      return res.status(404).json({ error: 'Translation task not found' });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' ||
      (req.user.role === 'translator' && task.translator.toString() === req.user._id.toString()) ||
      (req.user.role === 'product' && task.product.owner.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update allowed fields based on role
    const updates = {};
    
    if (req.user.role === 'translator') {
      // Translators can update progress and feedback
      if (req.body.status) updates.status = req.body.status;
      if (req.body.wordCount) {
        updates['wordCount.translated'] = req.body.wordCount.translated;
      }
      if (req.body.feedback?.translator) {
        updates['feedback.translator'] = req.body.feedback.translator;
      }
      if (req.body.status === 'completed') {
        updates.actualDelivery = new Date();
      }
    }

    if (req.user.role === 'product' || req.user.role === 'admin') {
      // Product team can approve/reject and add feedback
      Object.keys(req.body).forEach(key => {
        if (['status', 'wordCount', 'cost', 'qualityScore', 'feedback'].includes(key)) {
          if (key === 'wordCount' || key === 'cost' || key === 'feedback') {
            Object.keys(req.body[key]).forEach(subKey => {
              updates[`${key}.${subKey}`] = req.body[key][subKey];
            });
          } else {
            updates[key] = req.body[key];
          }
        }
      });
    }

    const updatedTask = await TranslationTask.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'product', select: 'name repository owner' },
      { path: 'translator', select: 'firstName lastName email' },
      { path: 'assignedBy', select: 'firstName lastName email' }
    ]);

    res.json({
      message: 'Translation task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Update translation task error:', error);
    res.status(500).json({ error: 'Failed to update translation task' });
  }
});

// Bulk update translation tasks
router.put('/bulk/update', authenticateToken, requireRole('product', 'admin'), [
  body('taskIds').isArray({ min: 1 }),
  body('taskIds.*').isMongoId(),
  body('updates').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskIds, updates } = req.body;

    // Verify all tasks exist and user has access
    const tasks = await TranslationTask.find({ 
      _id: { $in: taskIds } 
    }).populate('product', 'owner');

    if (tasks.length !== taskIds.length) {
      return res.status(404).json({ error: 'Some tasks not found' });
    }

    // Check permissions for all tasks
    if (req.user.role === 'product') {
      const unauthorized = tasks.some(task => 
        task.product.owner.toString() !== req.user._id.toString()
      );
      if (unauthorized) {
        return res.status(403).json({ error: 'Access denied to some tasks' });
      }
    }

    // Perform bulk update
    const result = await TranslationTask.updateMany(
      { _id: { $in: taskIds } },
      updates
    );

    res.json({
      message: 'Tasks updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

// Get translation statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    let filter = {};

    // Apply role-based filtering
    if (req.user.role === 'translator') {
      filter.translator = req.user._id;
    } else if (req.user.role === 'product') {
      const userProducts = await Product.find({ owner: req.user._id }).select('_id');
      filter.product = { $in: userProducts.map(p => p._id) };
    }

    const tasks = await TranslationTask.find(filter);

    const stats = {
      totalTasks: tasks.length,
      tasksByStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        reviewed: tasks.filter(t => t.status === 'reviewed').length,
        approved: tasks.filter(t => t.status === 'approved').length,
        rejected: tasks.filter(t => t.status === 'rejected').length
      },
      totalWordCount: tasks.reduce((sum, t) => sum + t.wordCount.total, 0),
      translatedWordCount: tasks.reduce((sum, t) => sum + t.wordCount.translated, 0),
      totalCost: tasks.reduce((sum, t) => sum + t.cost.actual, 0),
      estimatedCost: tasks.reduce((sum, t) => sum + t.cost.estimated, 0),
      costSavedTM: tasks.reduce((sum, t) => sum + t.cost.savedTM, 0),
      costSavedAI: tasks.reduce((sum, t) => sum + t.cost.savedAI, 0),
      overdueTasks: tasks.filter(t => t.isOverdue).length,
      avgQualityScore: tasks.filter(t => t.qualityScore).reduce((sum, t, _, arr) => 
        sum + t.qualityScore / arr.length, 0
      )
    };

    res.json(stats);
  } catch (error) {
    console.error('Get translation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch translation statistics' });
  }
});

module.exports = router;