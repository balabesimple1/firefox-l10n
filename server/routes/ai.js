const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Assistant chat endpoint
router.post('/chat', authenticateToken, [
  body('message').trim().isLength({ min: 1, max: 1000 }),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, context = {} } = req.body;
    const userRole = req.user.role;

    // Build system prompt based on user role
    const systemPrompts = {
      product: `You are an AI assistant for a localization management system, helping a Product Team member. You can help with:
        - Creating and managing translation projects
        - Tracking translation progress and costs
        - Understanding localization workflows
        - Analyzing translation statistics
        - Managing locale assignments and translator assignments
        
        Current user: ${req.user.fullName} (Product Team)`,
      
      finance: `You are an AI assistant for a localization management system, helping a Finance Team member. You can help with:
        - Reviewing and approving invoices
        - Tracking translation spending and budgets
        - Analyzing cost reports by product, translator, and time period
        - Understanding payment workflows
        - Generating financial reports
        
        Current user: ${req.user.fullName} (Finance Team)`,
      
      translator: `You are an AI assistant for a localization management system, helping a Translator. You can help with:
        - Managing assigned translation tasks
        - Understanding task requirements and deadlines
        - Submitting invoices and tracking payments
        - Using translation memory and glossary
        - Updating task progress and quality metrics
        
        Current user: ${req.user.fullName} (Translator)`,
      
      admin: `You are an AI assistant for a localization management system, helping an Administrator. You can help with:
        - Managing users, products, and system settings
        - Overseeing all translation projects and workflows
        - Analyzing system-wide performance and metrics
        - Configuring AI integrations and automation
        - Troubleshooting and system maintenance
        
        Current user: ${req.user.fullName} (Administrator)`
    };

    const systemPrompt = systemPrompts[userRole] || systemPrompts.admin;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.json({
      response,
      role: userRole,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'AI service quota exceeded. Please contact administrator.' 
      });
    }
    
    res.status(500).json({ 
      error: 'AI service temporarily unavailable. Please try again later.' 
    });
  }
});

// Get conversation starters based on user role
router.get('/conversation-starters', authenticateToken, (req, res) => {
  const starters = {
    product: [
      "How do I create a new localization project?",
      "What's the current status of my translation tasks?",
      "How much will it cost to translate my product to 5 new languages?",
      "Which translators are available for German localization?",
      "How can I track translation progress across all my products?"
    ],
    finance: [
      "Show me this month's translation spending breakdown",
      "Which invoices are pending approval?",
      "What's our average cost per word across all projects?",
      "How much did we spend on translations last quarter?",
      "Which translators have the highest monthly billings?"
    ],
    translator: [
      "What are my current translation assignments?",
      "How do I submit an invoice for completed work?",
      "What's my average quality score this month?",
      "Are there any urgent translation tasks assigned to me?",
      "How much have I earned from translations this year?"
    ],
    admin: [
      "What's the overall system performance this month?",
      "How many active translators do we have?",
      "Which products have the highest translation volumes?",
      "Show me user activity statistics",
      "How can I optimize our translation workflow?"
    ]
  };

  res.json({
    starters: starters[req.user.role] || starters.admin,
    role: req.user.role
  });
});

// Quick translation endpoint (for admin/testing)
router.post('/translate', authenticateToken, [
  body('text').trim().isLength({ min: 1, max: 500 }),
  body('sourceLanguage').isLength({ min: 2, max: 10 }),
  body('targetLanguage').isLength({ min: 2, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only allow admin and translators to use this feature
    if (!['admin', 'translator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { text, sourceLanguage, targetLanguage } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the given text from ${sourceLanguage} to ${targetLanguage}. Provide only the translation, no explanations.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const translation = completion.choices[0].message.content;

    res.json({
      originalText: text,
      translatedText: translation,
      sourceLanguage,
      targetLanguage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI translation error:', error);
    res.status(500).json({ 
      error: 'Translation service temporarily unavailable' 
    });
  }
});

module.exports = router;