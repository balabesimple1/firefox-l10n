const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const { role, search, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const where = { isActive: true };
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            translatorProfile: {
              include: {
                localeRates: {
                  include: {
                    locale: true
                  }
                }
              }
            }
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      res.json({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get translators
router.get('/translators', authenticateToken, async (req, res) => {
  try {
    const { localeId, available = false } = req.query;

    const where = {
      user: { isActive: true }
    };

    if (localeId && available) {
      // Find translators with rates for specific locale
      where.localeRates = {
        some: { localeId }
      };
    }

    const translators = await prisma.translator.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, isActive: true }
        },
        localeRates: {
          include: {
            locale: true
          }
        },
        _count: {
          select: {
            assignments: true,
            tasks: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    res.json(translators);
  } catch (error) {
    console.error('Get translators error:', error);
    res.status(500).json({ error: 'Failed to fetch translators' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, specializations, experience } = req.body;

    const updateData = {};
    if (name) updateData.name = name;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: {
        translatorProfile: true
      }
    });

    // Update translator profile if exists
    if (user.translatorProfile && (specializations || experience !== undefined)) {
      await prisma.translator.update({
        where: { id: user.translatorProfile.id },
        data: {
          ...(specializations && { specializations }),
          ...(experience !== undefined && { experience })
        }
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update translator rates
router.post('/translator-rates', 
  authenticateToken, 
  authorizeRoles('TRANSLATOR', 'ADMIN'),
  validate(schemas.translatorRate),
  async (req, res) => {
    try {
      const { localeId, ratePerWord, currency = 'USD' } = req.body;

      let translatorId;
      if (req.user.role === 'TRANSLATOR') {
        translatorId = req.user.translatorProfile?.id;
      } else {
        translatorId = req.body.translatorId;
      }

      if (!translatorId) {
        return res.status(400).json({ error: 'Translator profile not found' });
      }

      const rate = await prisma.translatorRate.upsert({
        where: {
          translatorId_localeId: {
            translatorId,
            localeId
          }
        },
        update: {
          ratePerWord,
          currency
        },
        create: {
          translatorId,
          localeId,
          ratePerWord,
          currency
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
        message: 'Translator rate updated successfully',
        rate
      });
    } catch (error) {
      console.error('Update translator rate error:', error);
      res.status(500).json({ error: 'Failed to update translator rate' });
    }
  }
);

// Get translator rates
router.get('/translator-rates/:translatorId?', authenticateToken, async (req, res) => {
  try {
    let translatorId = req.params.translatorId;
    
    // If no translatorId provided and user is translator, use their own ID
    if (!translatorId && req.user.role === 'TRANSLATOR') {
      translatorId = req.user.translatorProfile?.id;
    }

    if (!translatorId) {
      return res.status(400).json({ error: 'Translator ID required' });
    }

    const rates = await prisma.translatorRate.findMany({
      where: { translatorId },
      include: {
        locale: true
      },
      orderBy: { locale: { name: 'asc' } }
    });

    res.json(rates);
  } catch (error) {
    console.error('Get translator rates error:', error);
    res.status(500).json({ error: 'Failed to fetch translator rates' });
  }
});

// Delete translator rate
router.delete('/translator-rates/:id', 
  authenticateToken, 
  authorizeRoles('TRANSLATOR', 'ADMIN'),
  async (req, res) => {
    try {
      const rate = await prisma.translatorRate.findUnique({
        where: { id: req.params.id }
      });

      if (!rate) {
        return res.status(404).json({ error: 'Rate not found' });
      }

      // Check permissions
      if (req.user.role === 'TRANSLATOR' && 
          rate.translatorId !== req.user.translatorProfile?.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await prisma.translatorRate.delete({
        where: { id: req.params.id }
      });

      res.json({ message: 'Translator rate deleted successfully' });
    } catch (error) {
      console.error('Delete translator rate error:', error);
      res.status(500).json({ error: 'Failed to delete translator rate' });
    }
  }
);

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Deactivate user (Admin only)
router.put('/:id/deactivate', 
  authenticateToken, 
  authorizeRoles('ADMIN'),
  async (req, res) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });

      res.json({
        message: 'User deactivated successfully',
        user
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(500).json({ error: 'Failed to deactivate user' });
    }
  }
);

module.exports = router;