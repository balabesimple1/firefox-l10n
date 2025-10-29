const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const TranslationTask = require('../models/TranslationTask');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'paused', 'completed', 'archived']),
  query('search').optional().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'product') {
      filter.owner = req.user._id;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('owner', 'firstName lastName email')
      .populate('locales.translator', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('locales.translator', 'firstName lastName email');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check access permissions
    if (req.user.role === 'product' && product.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get translation tasks for this product
    const tasks = await TranslationTask.find({ product: product._id })
      .populate('translator', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      product,
      tasks
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', authenticateToken, requireRole('product', 'admin'), [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('repository').trim().isLength({ min: 1, max: 200 }),
  body('locales').isArray({ min: 1 }),
  body('locales.*.code').isLength({ min: 2, max: 10 }),
  body('locales.*.name').isLength({ min: 1, max: 50 }),
  body('locales.*.ratePerWord').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, repository, locales, settings } = req.body;

    // Check if product name already exists for this user
    const existingProduct = await Product.findOne({ 
      name, 
      owner: req.user._id 
    });
    
    if (existingProduct) {
      return res.status(400).json({ error: 'Product name already exists' });
    }

    const product = new Product({
      name,
      description,
      repository,
      owner: req.user._id,
      locales: locales.map(locale => ({
        code: locale.code,
        name: locale.name,
        ratePerWord: locale.ratePerWord || 0.10,
        isActive: locale.isActive !== false
      })),
      settings: {
        autoApprovalThreshold: settings?.autoApprovalThreshold || 500,
        requiresReview: settings?.requiresReview !== false,
        translationMemoryEnabled: settings?.translationMemoryEnabled !== false,
        aiTranslationEnabled: settings?.aiTranslationEnabled || false
      }
    });

    await product.save();
    await product.populate('owner', 'firstName lastName email');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('repository').optional().trim().isLength({ min: 1, max: 200 }),
  body('locales').optional().isArray(),
  body('status').optional().isIn(['active', 'paused', 'completed', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check permissions
    if (req.user.role === 'product' && product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'repository', 'locales', 'settings', 'status'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('owner', 'firstName lastName email')
     .populate('locales.translator', 'firstName lastName email');

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if there are active translation tasks
    const activeTasks = await TranslationTask.countDocuments({
      product: req.params.id,
      status: { $in: ['pending', 'in_progress'] }
    });

    if (activeTasks > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product with active translation tasks' 
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Assign translator to locale
router.put('/:id/locales/:localeCode/translator', authenticateToken, requireRole('product', 'admin'), [
  body('translatorId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { translatorId } = req.body;
    const { id, localeCode } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check permissions
    if (req.user.role === 'product' && product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find and update the locale
    const locale = product.locales.find(l => l.code === localeCode);
    if (!locale) {
      return res.status(404).json({ error: 'Locale not found' });
    }

    locale.translator = translatorId;
    await product.save();

    await product.populate('locales.translator', 'firstName lastName email');

    res.json({
      message: 'Translator assigned successfully',
      product
    });
  } catch (error) {
    console.error('Assign translator error:', error);
    res.status(500).json({ error: 'Failed to assign translator' });
  }
});

// Get product statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check permissions
    if (req.user.role === 'product' && product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get translation statistics
    const tasks = await TranslationTask.find({ product: req.params.id });
    
    const stats = {
      totalTasks: tasks.length,
      tasksByStatus: {
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        reviewed: tasks.filter(t => t.status === 'reviewed').length,
        approved: tasks.filter(t => t.status === 'approved').length
      },
      totalWordCount: tasks.reduce((sum, t) => sum + t.wordCount.total, 0),
      translatedWordCount: tasks.reduce((sum, t) => sum + t.wordCount.translated, 0),
      totalCost: tasks.reduce((sum, t) => sum + t.cost.actual, 0),
      estimatedCost: tasks.reduce((sum, t) => sum + t.cost.estimated, 0),
      costSavedTM: tasks.reduce((sum, t) => sum + t.cost.savedTM, 0),
      costSavedAI: tasks.reduce((sum, t) => sum + t.cost.savedAI, 0),
      localeStats: product.locales.map(locale => {
        const localeTasks = tasks.filter(t => t.locale.code === locale.code);
        return {
          code: locale.code,
          name: locale.name,
          taskCount: localeTasks.length,
          wordCount: localeTasks.reduce((sum, t) => sum + t.wordCount.total, 0),
          translatedWords: localeTasks.reduce((sum, t) => sum + t.wordCount.translated, 0),
          cost: localeTasks.reduce((sum, t) => sum + t.cost.actual, 0)
        };
      })
    };

    res.json(stats);
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

module.exports = router;