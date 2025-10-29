const express = require('express');
const { OpenAI } = require('openai');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI Assistant Chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    const userRole = req.user.role;

    // Build system prompt based on user role
    let systemPrompt = `You are an AI assistant for a localization workflow management system. 
    The user is a ${userRole.toLowerCase().replace('_', ' ')} team member.
    
    You have access to localization data including projects, translation tasks, invoices, and reports.
    Provide helpful, accurate responses about localization workflows, translation management, and related topics.
    
    Current user context: ${JSON.stringify(context)}
    
    Role-specific capabilities:`;

    switch (userRole) {
      case 'PRODUCT_TEAM':
        systemPrompt += `
        - Help with project management and localization requests
        - Provide cost estimates and delivery timelines
        - Assist with locale management and translator assignments
        - Generate reports on translation progress and costs`;
        break;
      case 'FINANCE_TEAM':
        systemPrompt += `
        - Help with invoice management and payment processing
        - Provide spending reports and budget analysis
        - Assist with translator payout calculations
        - Generate financial reports and cost breakdowns`;
        break;
      case 'TRANSLATOR':
        systemPrompt += `
        - Help with translation task management
        - Provide guidance on translation workflows
        - Assist with invoice creation and submission
        - Answer questions about translation memory and glossary`;
        break;
      case 'ADMIN':
        systemPrompt += `
        - Full system administration capabilities
        - Help with user management and system configuration
        - Provide comprehensive reports and analytics
        - Assist with workflow optimization`;
        break;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    res.json({
      response: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'AI assistant temporarily unavailable' });
  }
});

// Get conversation starters based on role
router.get('/conversation-starters', authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    const starters = {
      PRODUCT_TEAM: [
        "What's the current status of our localization projects?",
        "How much will it cost to translate our new feature?",
        "Which translators are available for German localization?",
        "Show me the translation progress for this month",
        "What's our average translation turnaround time?"
      ],
      FINANCE_TEAM: [
        "What are our total translation costs this month?",
        "Show me pending invoice approvals",
        "Which translators have the highest earnings?",
        "What's our budget vs actual spending?",
        "Generate a monthly payout report"
      ],
      TRANSLATOR: [
        "What translation tasks are assigned to me?",
        "How do I submit my monthly invoice?",
        "What's in the translation memory for this project?",
        "Show me my completed tasks this month",
        "How can I update my translation rates?"
      ],
      ADMIN: [
        "Show me system-wide translation statistics",
        "Which projects need translator assignments?",
        "What's our overall localization efficiency?",
        "How can we optimize our translation workflow?",
        "Generate a comprehensive project report"
      ]
    };

    res.json({
      starters: starters[userRole] || starters.ADMIN
    });
  } catch (error) {
    console.error('Get conversation starters error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation starters' });
  }
});

// Quick translation using AI
router.post('/translate', authenticateToken, async (req, res) => {
  try {
    const { text, sourceLocale, targetLocale, context = '' } = req.body;

    if (!text || !sourceLocale || !targetLocale) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check translation memory first
    const memoryResult = await prisma.translationMemory.findFirst({
      where: {
        sourceText: text,
        sourceLocale,
        targetLocale
      }
    });

    if (memoryResult) {
      // Update usage count
      await prisma.translationMemory.update({
        where: { id: memoryResult.id },
        data: { usage: { increment: 1 } }
      });

      return res.json({
        translation: memoryResult.targetText,
        source: 'translation_memory',
        quality: memoryResult.quality,
        usage: memoryResult.usage + 1
      });
    }

    // Use AI translation
    const prompt = `Translate the following text from ${sourceLocale} to ${targetLocale}.
    ${context ? `Context: ${context}` : ''}
    
    Text to translate: "${text}"
    
    Provide only the translation, no explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a professional translator. Provide accurate, contextually appropriate translations." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const translation = completion.choices[0].message.content.trim();

    // Save to translation memory
    await prisma.translationMemory.create({
      data: {
        sourceText: text,
        targetText: translation,
        sourceLocale,
        targetLocale,
        quality: 0.8, // AI translations get 0.8 quality score
        usage: 1
      }
    });

    res.json({
      translation,
      source: 'ai_translation',
      quality: 0.8,
      usage: completion.usage
    });
  } catch (error) {
    console.error('AI Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Get AI translation statistics
router.get('/translation-stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [totalMemoryEntries, aiTranslations, memoryUsage] = await Promise.all([
      prisma.translationMemory.count(where),
      prisma.translationMemory.count({
        where: {
          ...where,
          quality: 0.8 // AI translations have 0.8 quality
        }
      }),
      prisma.translationMemory.aggregate({
        where,
        _sum: { usage: true },
        _avg: { quality: true }
      })
    ]);

    // Get top language pairs
    const languagePairs = await prisma.translationMemory.groupBy({
      by: ['sourceLocale', 'targetLocale'],
      where,
      _count: true,
      orderBy: { _count: 'desc' },
      take: 10
    });

    res.json({
      totalMemoryEntries,
      aiTranslations,
      humanTranslations: totalMemoryEntries - aiTranslations,
      totalUsage: memoryUsage._sum.usage || 0,
      averageQuality: memoryUsage._avg.quality || 0,
      topLanguagePairs: languagePairs.map(pair => ({
        from: pair.sourceLocale,
        to: pair.targetLocale,
        count: pair._count
      }))
    });
  } catch (error) {
    console.error('Get AI translation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch AI translation statistics' });
  }
});

module.exports = router;