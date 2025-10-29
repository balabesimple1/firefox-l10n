const express = require('express');
const { body, validationResult } = require('express-validator');
const TranslationMemory = require('../models/TranslationMemory');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Search translation memory
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { sourceText, sourceLocale, targetLocale, product } = req.query;
    
    if (!sourceText || !sourceLocale || !targetLocale) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const matches = await TranslationMemory.findSimilar(
      sourceText, 
      sourceLocale, 
      targetLocale, 
      product
    ).populate('translator', 'firstName lastName');

    res.json({ matches });
  } catch (error) {
    console.error('Translation memory search error:', error);
    res.status(500).json({ error: 'Failed to search translation memory' });
  }
});

// Add translation to memory
router.post('/', authenticateToken, requireRole('translator', 'admin'), [
  body('sourceText').trim().isLength({ min: 1, max: 1000 }),
  body('targetText').trim().isLength({ min: 1, max: 1000 }),
  body('sourceLocale').isLength({ min: 2, max: 10 }),
  body('targetLocale').isLength({ min: 2, max: 10 }),
  body('product').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tmEntry = new TranslationMemory({
      ...req.body,
      translator: req.user._id,
      metadata: {
        wordCount: req.body.sourceText.split(' ').length,
        characterCount: req.body.sourceText.length
      }
    });

    await tmEntry.save();

    res.status(201).json({
      message: 'Translation added to memory',
      entry: tmEntry
    });
  } catch (error) {
    console.error('Add to translation memory error:', error);
    res.status(500).json({ error: 'Failed to add translation to memory' });
  }
});

module.exports = router;