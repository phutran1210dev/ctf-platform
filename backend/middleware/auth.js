const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        isActive: true 
      },
      attributes: ['id', 'username', 'email', 'role', 'teamId', 'isActive']
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid token or user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to check if user has admin or moderator role
 */
const requireModerator = (req, res, next) => {
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Moderator access required',
      code: 'MODERATOR_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware to check if user is team captain or admin
 */
const requireTeamCaptain = async (req, res, next) => {
  try {
    const { Team } = require('../models');
    
    if (req.user.role === 'admin') {
      return next();
    }

    const team = await Team.findOne({
      where: { id: req.user.teamId }
    });

    if (!team || team.captainId !== req.user.id) {
      return res.status(403).json({
        error: 'Team captain access required',
        code: 'CAPTAIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    logger.error('Team captain check failed:', error);
    return res.status(500).json({
      error: 'Internal server error during authorization',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if competition is active
 */
const requireActiveCompetition = (req, res, next) => {
  const now = new Date();
  const startTime = new Date(process.env.COMPETITION_START_TIME);
  const endTime = new Date(process.env.COMPETITION_END_TIME);

  if (now < startTime) {
    return res.status(403).json({
      error: 'Competition has not started yet',
      code: 'COMPETITION_NOT_STARTED',
      startTime: startTime.toISOString()
    });
  }

  if (now > endTime) {
    return res.status(403).json({
      error: 'Competition has ended',
      code: 'COMPETITION_ENDED',
      endTime: endTime.toISOString()
    });
  }

  next();
};

/**
 * Middleware to validate team membership
 */
const requireTeamMembership = (req, res, next) => {
  if (!req.user.teamId) {
    return res.status(403).json({
      error: 'Team membership required',
      code: 'TEAM_REQUIRED'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireModerator,
  requireTeamCaptain,
  requireActiveCompetition,
  requireTeamMembership
};