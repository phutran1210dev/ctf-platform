const express = require('express');
const { User, Team, Solve, Challenge } = require('../models');
const { body, validationResult, param } = require('express-validator');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'name', 'score']
        },
        {
          model: Solve,
          as: 'solves',
          include: [{
            model: Challenge,
            as: 'challenge',
            attributes: ['id', 'title', 'category', 'points']
          }],
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });

    res.json({ user: user.toSafeObject() });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName').optional().isLength({ max: 50 }),
  body('lastName').optional().isLength({ max: 50 }),
  body('bio').optional().isLength({ max: 1000 }),
  body('website').optional().isURL(),
  body('country').optional().isLength({ min: 2, max: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const allowedFields = ['firstName', 'lastName', 'bio', 'website', 'country', 'school'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await User.update(updateData, {
      where: { id: req.user.id }
    });

    const updatedUser = await User.findByPk(req.user.id);

    logger.info(`User profile updated: ${req.user.username}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toSafeObject()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

module.exports = router;