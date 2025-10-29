const express = require('express');
const { body, validationResult } = require('express-validator');
const Glossary = require('../models/Glossary');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get glossary terms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { product, category, search } = req.query;
    const filter = { isActive: true };

    if (product) filter.products = product;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const terms = await Glossary.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ term: 1 });

    res.json({ terms });
  } catch (error) {
    console.error('Get glossary error:', error);
    res.status(500).json({ error: 'Failed to fetch glossary terms' });
  }
});

// Create glossary term
router.post('/', authenticateToken, requireRole('translator', 'admin'), [
  body('term').trim().isLength({ min: 1, max: 100 }),
  body('definition').trim().isLength({ min: 1, max: 500 }),
  body('category').optional().isLength({ min: 1, max: 50 }),
  body('translations').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const glossaryTerm = new Glossary({
      ...req.body,
      createdBy: req.user._id
    });

    await glossaryTerm.save();
    await glossaryTerm.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Glossary term created successfully',
      term: glossaryTerm
    });
  } catch (error) {
    console.error('Create glossary term error:', error);
    res.status(500).json({ error: 'Failed to create glossary term' });
  }
});

module.exports = router;