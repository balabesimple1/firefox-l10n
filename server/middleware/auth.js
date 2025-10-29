const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Check if user has required role(s)
const requireRole = (...roles) => {
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

// Check if user can access resource (owner or admin)
const requireOwnershipOrRole = (resourceField = 'owner', ...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Admin can access everything
      if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
        return next();
      }

      // For other roles, check ownership
      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID required' });
      }

      // This is a simplified check - in practice, you'd query the specific model
      // For now, we'll allow the request to proceed and let the route handler check ownership
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

// Check if user can manage translations (translator for assigned tasks or admin)
const requireTranslationAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role === 'translator') {
      // Translator can only access their assigned tasks
      // This check would be done in the route handler with the actual task
      return next();
    }

    if (req.user.role === 'product') {
      // Product team can access tasks for their products
      return next();
    }

    return res.status(403).json({ error: 'Insufficient permissions for translation access' });
  } catch (error) {
    return res.status(500).json({ error: 'Authorization error' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrRole,
  requireTranslationAccess
};