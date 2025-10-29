const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles, authorizeResourceAccess } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get translation tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const { status, projectId, localeId, assigneeId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (localeId) where.localeId = localeId;
    if (assigneeId) where.assigneeId = assigneeId;

    // Filter by user role
    if (req.user.role === 'TRANSLATOR') {
      where.assigneeId = req.user.id;
    }

    const [tasks, total] = await Promise.all([
      prisma.translationTask.findMany({
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
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.translationTask.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get translation tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch translation tasks' });
  }
});

// Get translation task by ID
router.get('/tasks/:id', 
  authenticateToken, 
  authorizeResourceAccess('translation_task'),
  async (req, res) => {
    try {
      const task = await prisma.translationTask.findUnique({
        where: { id: req.params.id },
        include: {
          project: {
            select: { id: true, name: true, description: true }
          },
          locale: true,
          assignee: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Translation task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Get translation task error:', error);
      res.status(500).json({ error: 'Failed to fetch translation task' });
    }
  }
);

// Create translation task
router.post('/tasks', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM'), 
  validate(schemas.translationTask),
  async (req, res) => {
    try {
      const { projectId, localeId, title, description, wordCount, priority, dueDate, assigneeId } = req.body;

      const task = await prisma.translationTask.create({
        data: {
          projectId,
          localeId,
          title,
          description,
          wordCount: wordCount || 0,
          priority: priority || 1,
          dueDate: dueDate ? new Date(dueDate) : null,
          assigneeId
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

      res.status(201).json({
        message: 'Translation task created successfully',
        task
      });
    } catch (error) {
      console.error('Create translation task error:', error);
      res.status(500).json({ error: 'Failed to create translation task' });
    }
  }
);

// Update translation task
router.put('/tasks/:id', 
  authenticateToken,
  async (req, res) => {
    try {
      const { status, wordCount, estimatedCost, actualCost, aiTranslated, aiCostSavings, tmCostSavings } = req.body;

      // Check permissions
      const task = await prisma.translationTask.findUnique({
        where: { id: req.params.id }
      });

      if (!task) {
        return res.status(404).json({ error: 'Translation task not found' });
      }

      // Translators can only update their own tasks
      if (req.user.role === 'TRANSLATOR' && task.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updateData = {};
      if (status) {
        updateData.status = status;
        if (status === 'COMPLETED') {
          updateData.completedAt = new Date();
        }
      }
      if (wordCount !== undefined) updateData.wordCount = wordCount;
      if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
      if (actualCost !== undefined) updateData.actualCost = actualCost;
      if (aiTranslated !== undefined) updateData.aiTranslated = aiTranslated;
      if (aiCostSavings !== undefined) updateData.aiCostSavings = aiCostSavings;
      if (tmCostSavings !== undefined) updateData.tmCostSavings = tmCostSavings;

      const updatedTask = await prisma.translationTask.update({
        where: { id: req.params.id },
        data: updateData,
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

      res.json({
        message: 'Translation task updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update translation task error:', error);
      res.status(500).json({ error: 'Failed to update translation task' });
    }
  }
);

// Get locales
router.get('/locales', authenticateToken, async (req, res) => {
  try {
    const locales = await prisma.locale.findMany({
      orderBy: { name: 'asc' }
    });

    res.json(locales);
  } catch (error) {
    console.error('Get locales error:', error);
    res.status(500).json({ error: 'Failed to fetch locales' });
  }
});

// Create locale
router.post('/locales', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const { code, name } = req.body;

      const locale = await prisma.locale.create({
        data: { code, name }
      });

      res.status(201).json({
        message: 'Locale created successfully',
        locale
      });
    } catch (error) {
      console.error('Create locale error:', error);
      res.status(500).json({ error: 'Failed to create locale' });
    }
  }
);

// Get translation memory
router.get('/memory', authenticateToken, async (req, res) => {
  try {
    const { sourceLocale, targetLocale, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (sourceLocale) where.sourceLocale = sourceLocale;
    if (targetLocale) where.targetLocale = targetLocale;
    if (search) {
      where.OR = [
        { sourceText: { contains: search, mode: 'insensitive' } },
        { targetText: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [memories, total] = await Promise.all([
      prisma.translationMemory.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { usage: 'desc' }
      }),
      prisma.translationMemory.count({ where })
    ]);

    res.json({
      memories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get translation memory error:', error);
    res.status(500).json({ error: 'Failed to fetch translation memory' });
  }
});

// Add to translation memory
router.post('/memory', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'TRANSLATOR'),
  async (req, res) => {
    try {
      const { sourceText, targetText, sourceLocale, targetLocale, quality } = req.body;

      const memory = await prisma.translationMemory.upsert({
        where: {
          sourceText_targetText_sourceLocale_targetLocale: {
            sourceText,
            targetText,
            sourceLocale,
            targetLocale
          }
        },
        update: {
          quality: quality || 1.0,
          usage: { increment: 1 }
        },
        create: {
          sourceText,
          targetText,
          sourceLocale,
          targetLocale,
          quality: quality || 1.0,
          usage: 1
        }
      });

      res.status(201).json({
        message: 'Translation memory updated successfully',
        memory
      });
    } catch (error) {
      console.error('Add translation memory error:', error);
      res.status(500).json({ error: 'Failed to update translation memory' });
    }
  }
);

// Get glossary
router.get('/glossary', authenticateToken, async (req, res) => {
  try {
    const { locale, category, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (locale) where.locale = locale;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [terms, total] = await Promise.all([
      prisma.glossary.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { term: 'asc' }
      }),
      prisma.glossary.count({ where })
    ]);

    res.json({
      terms,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get glossary error:', error);
    res.status(500).json({ error: 'Failed to fetch glossary' });
  }
});

// Add glossary term
router.post('/glossary', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'TRANSLATOR'),
  async (req, res) => {
    try {
      const { term, definition, context, locale, category } = req.body;

      const glossaryTerm = await prisma.glossary.upsert({
        where: {
          term_locale: {
            term,
            locale
          }
        },
        update: {
          definition,
          context,
          category
        },
        create: {
          term,
          definition,
          context,
          locale,
          category
        }
      });

      res.status(201).json({
        message: 'Glossary term updated successfully',
        term: glossaryTerm
      });
    } catch (error) {
      console.error('Add glossary term error:', error);
      res.status(500).json({ error: 'Failed to update glossary term' });
    }
  }
);

module.exports = router;