const express = require('express');
const { Challenge, User, Team, Submission, Solve } = require('../models');
const { requireAdmin, requireModerator } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Admin
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = {
      users: await User.count({ where: { isActive: true } }),
      teams: await Team.count({ where: { isActive: true } }),
      challenges: await Challenge.count({ where: { isActive: true } }),
      submissions: await Submission.count(),
      solves: await Solve.count()
    };

    res.json({ stats });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Admin
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [{
        model: Team,
        as: 'team',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// @route   GET /api/admin/challenges
// @desc    Get all challenges for admin management
// @access  Admin/Moderator
router.get('/challenges', requireModerator, async (req, res) => {
  try {
    const challenges = await Challenge.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ challenges });
  } catch (error) {
    logger.error('Get challenges error:', error);
    res.status(500).json({
      error: 'Failed to fetch challenges',
      message: error.message
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (toggle active, make admin, etc.)
// @access  Admin
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, isActive, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (action) {
      case 'toggle':
        await user.update({ isActive: !user.isActive });
        break;
      case 'makeAdmin':
        await user.update({ role: 'admin' });
        break;
      default:
        // Allow direct field updates
        const updateData = {};
        if (typeof isActive !== 'undefined') updateData.isActive = isActive;
        if (role) updateData.role = role;
        await user.update(updateData);
    }

    logger.info(`User ${user.username} updated by ${req.user.username}`);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by setting isActive to false
    await user.update({ isActive: false });

    logger.info(`User ${user.username} deleted by ${req.user.username}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// @route   POST /api/admin/challenges
// @desc    Create new challenge
// @access  Admin/Moderator
router.post('/challenges', requireModerator, [
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('description').isLength({ min: 1, max: 5000 }).withMessage('Description is required'),
  body('category').isIn(['web', 'crypto', 'reverse', 'pwn', 'forensics', 'misc', 'osint', 'stego', 'hardware', 'mobile']),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'expert']),
  body('points').isInt({ min: 1, max: 1000 }).withMessage('Points must be between 1 and 1000'),
  body('flag').isLength({ min: 1, max: 500 }).withMessage('Flag is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const challengeData = {
      ...req.body,
      authorId: req.user.id
    };

    const challenge = await Challenge.create(challengeData);

    logger.info(`Challenge created: ${challenge.title} by ${req.user.username}`);

    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: challenge.toSafeObject(true)
    });
  } catch (error) {
    logger.error('Create challenge error:', error);
    res.status(500).json({
      error: 'Failed to create challenge',
      message: error.message
    });
  }
});

module.exports = router;