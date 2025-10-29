const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by user role
    if (req.user.role === 'TRANSLATOR') {
      where.locales = {
        some: {
          translatorId: req.user.translatorProfile?.id
        }
      };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          locales: {
            include: {
              locale: true,
              translator: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              translationTasks: true
            }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        locales: {
          include: {
            locale: true,
            translator: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        },
        translationTasks: {
          include: {
            locale: true,
            assignee: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        costEstimations: {
          include: {
            translator: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access for translators
    if (req.user.role === 'TRANSLATOR') {
      const hasAccess = project.locales.some(
        locale => locale.translatorId === req.user.translatorProfile?.id
      );
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post('/', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM'), 
  validate(schemas.project),
  async (req, res) => {
    try {
      const { name, description, repository, autoApprove, costThreshold, locales } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description,
          repository,
          autoApprove: autoApprove || false,
          costThreshold,
          createdById: req.user.id,
          ...(locales && locales.length > 0 && {
            locales: {
              create: locales.map(localeId => ({
                localeId
              }))
            }
          })
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          locales: {
            include: {
              locale: true
            }
          }
        }
      });

      res.status(201).json({
        message: 'Project created successfully',
        project
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Update project
router.put('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM'),
  async (req, res) => {
    try {
      const { name, description, repository, status, autoApprove, costThreshold } = req.body;

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(repository !== undefined && { repository }),
          ...(status && { status }),
          ...(autoApprove !== undefined && { autoApprove }),
          ...(costThreshold !== undefined && { costThreshold })
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          locales: {
            include: {
              locale: true,
              translator: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        }
      });

      res.json({
        message: 'Project updated successfully',
        project
      });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Add/Remove locales from project
router.post('/:id/locales', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM'),
  async (req, res) => {
    try {
      const { localeIds, action = 'add' } = req.body; // action: 'add' or 'remove'

      if (action === 'add') {
        await prisma.projectLocale.createMany({
          data: localeIds.map(localeId => ({
            projectId: req.params.id,
            localeId
          })),
          skipDuplicates: true
        });
      } else if (action === 'remove') {
        await prisma.projectLocale.deleteMany({
          where: {
            projectId: req.params.id,
            localeId: { in: localeIds }
          }
        });
      }

      const project = await prisma.project.findUnique({
        where: { id: req.params.id },
        include: {
          locales: {
            include: {
              locale: true,
              translator: {
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        }
      });

      res.json({
        message: `Locales ${action}ed successfully`,
        project
      });
    } catch (error) {
      console.error('Update project locales error:', error);
      res.status(500).json({ error: 'Failed to update project locales' });
    }
  }
);

// Assign translator to project locale
router.post('/:id/locales/:localeId/assign', 
  authenticateToken, 
  authorizeRoles('ADMIN', 'PRODUCT_TEAM'),
  async (req, res) => {
    try {
      const { translatorId } = req.body;

      const projectLocale = await prisma.projectLocale.update({
        where: {
          projectId_localeId: {
            projectId: req.params.id,
            localeId: req.params.localeId
          }
        },
        data: {
          translatorId
        },
        include: {
          locale: true,
          translator: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      res.json({
        message: 'Translator assigned successfully',
        projectLocale
      });
    } catch (error) {
      console.error('Assign translator error:', error);
      res.status(500).json({ error: 'Failed to assign translator' });
    }
  }
);

// Delete project
router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      await prisma.project.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  }
);

module.exports = router;