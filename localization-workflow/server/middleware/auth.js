const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        translatorProfile: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role
      });
    }

    next();
  };
};

const authorizeResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    const { user } = req;
    const resourceId = req.params.id;

    try {
      switch (resourceType) {
        case 'translation_task':
          if (user.role === 'TRANSLATOR') {
            const task = await prisma.translationTask.findUnique({
              where: { id: resourceId }
            });
            if (task && task.assigneeId !== user.id) {
              return res.status(403).json({ error: 'Access denied to this resource' });
            }
          }
          break;
        
        case 'invoice':
          if (user.role === 'TRANSLATOR') {
            const invoice = await prisma.invoice.findUnique({
              where: { id: resourceId }
            });
            if (invoice && invoice.userId !== user.id) {
              return res.status(403).json({ error: 'Access denied to this resource' });
            }
          }
          break;
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  authorizeResourceAccess
};