const express = require('express');
const { Team, User, Solve, Challenge } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/scores/teams
// @desc    Get team leaderboard
// @access  Public
router.get('/teams', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const teams = await Team.findAndCountAll({
      where: { 
        isActive: true
      },
      attributes: ['id', 'name', 'score', 'solveCount', 'lastSolveTime'],
      order: [['score', 'DESC'], ['lastSolveTime', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add rank to each team
    const rankedTeams = teams.rows.map((team, index) => ({
      ...team.toJSON(),
      rank: parseInt(offset) + index + 1
    }));

    res.json(rankedTeams);
  } catch (error) {
    logger.error('Get team leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch team leaderboard',
      message: error.message
    });
  }
});

// @route   GET /api/scores/users
// @desc    Get user leaderboard
// @access  Public
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const users = await User.findAndCountAll({
      where: { 
        isActive: true
      },
      attributes: ['id', 'username', 'score', 'solveCount'],
      include: [{
        model: Team,
        as: 'team',
        attributes: ['id', 'name'],
        required: false
      }],
      order: [['score', 'DESC'], ['solveCount', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const rankedUsers = users.rows.map((user, index) => ({
      ...user.toJSON(),
      rank: parseInt(offset) + index + 1
    }));

    res.json(rankedUsers);
  } catch (error) {
    logger.error('Get user leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch user leaderboard',
      message: error.message
    });
  }
});

module.exports = router;