const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { Team, User } = require('../models');
const { requireTeamCaptain } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/teams
// @desc    Get all active teams
// @access  Private
router.get('/', async (req, res) => {
  try {
    const teams = await Team.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          as: 'captain',
          attributes: ['id', 'username']
        }
      ],
      attributes: ['id', 'name', 'description', 'score', 'maxMembers', 'isPublic'],
      order: [['score', 'DESC'], ['createdAt', 'ASC']]
    });

    // Add member count to each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await team.getMemberCount();
        return {
          ...team.toJSON(),
          memberCount,
          totalPoints: team.score
        };
      })
    );

    res.json(teamsWithCounts);
  } catch (error) {
    logger.error('Get teams error:', error);
    res.status(500).json({
      error: 'Failed to fetch teams',
      message: error.message
    });
  }
});

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private
router.post('/', [
  body('name')
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if user is already in a team
    if (req.user.teamId) {
      return res.status(409).json({
        error: 'You are already a member of a team'
      });
    }

    const { name, description } = req.body;

    const team = await Team.create({
      name,
      description,
      captainId: req.user.id
    });

    // Update user's team
    await User.update(
      { teamId: team.id },
      { where: { id: req.user.id } }
    );

    logger.info(`Team created: ${name} by ${req.user.username}`);

    res.status(201).json({
      id: team.id,
      message: 'Team created successfully',
      team: team.toSafeObject()
    });
  } catch (error) {
    logger.error('Create team error:', error);
    res.status(500).json({
      error: 'Failed to create team',
      message: error.message
    });
  }
});

// @route   GET /api/teams/:id
// @desc    Get team details
// @access  Private
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid team ID')
], async (req, res) => {
  try {
    const team = await Team.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'score', 'solveCount']
        },
        {
          model: User,
          as: 'captain',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    const teamData = team.toJSON();
    
    // Format members data
    const membersData = teamData.members.map(member => ({
      id: member.id,
      username: member.username,
      totalPoints: member.score,
      isCaptain: member.id === team.captainId
    }));

    const response = {
      ...teamData,
      members: membersData,
      memberCount: membersData.length,
      totalPoints: teamData.score,
      joinCode: (team.members.some(member => member.id === req.user.id) || req.user.role === 'admin') ? teamData.inviteCode : undefined
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Get team error:', error);
    res.status(500).json({
      error: 'Failed to fetch team',
      message: error.message
    });
  }
});

// @route   POST /api/teams/join
// @desc    Join a team by invite code
// @access  Private
router.post('/join', [
  body('inviteCode')
    .isLength({ min: 8, max: 8 })
    .withMessage('Invalid invite code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if user is already in a team
    if (req.user.teamId) {
      return res.status(409).json({
        error: 'You are already a member of a team'
      });
    }

    const { inviteCode } = req.body;

    const team = await Team.findOne({
      where: { inviteCode, isActive: true }
    });

    if (!team) {
      return res.status(404).json({
        error: 'Invalid invite code'
      });
    }

    // Check if team has space
    const canAdd = await team.canAddMember();
    if (!canAdd) {
      return res.status(409).json({
        error: 'Team is full'
      });
    }

    // Join team
    await User.update(
      { teamId: team.id },
      { where: { id: req.user.id } }
    );

    logger.info(`User ${req.user.username} joined team ${team.name}`);

    res.json({
      message: 'Successfully joined team',
      teamId: team.id,
      team: team.toSafeObject()
    });
  } catch (error) {
    logger.error('Join team error:', error);
    res.status(500).json({
      error: 'Failed to join team',
      message: error.message
    });
  }
});

// @route   POST /api/teams/leave
// @desc    Leave current team
// @access  Private
router.post('/leave', async (req, res) => {
  try {
    if (!req.user.teamId) {
      return res.status(400).json({
        error: 'You are not a member of any team'
      });
    }

    const team = await Team.findByPk(req.user.teamId);
    if (!team) {
      return res.status(404).json({
        error: 'Team not found'
      });
    }

    // Check if user is captain
    if (team.captainId === req.user.id) {
      // Check if there are other members
      const memberCount = await team.getMemberCount();
      if (memberCount > 1) {
        return res.status(400).json({
          error: 'You cannot leave the team as captain. Transfer captaincy first or disband the team.'
        });
      } else {
        // If captain is the only member, delete the team
        await team.destroy();
        logger.info(`Team ${team.name} disbanded by captain ${req.user.username}`);
      }
    }

    // Remove user from team
    await User.update(
      { teamId: null },
      { where: { id: req.user.id } }
    );

    logger.info(`User ${req.user.username} left team ${team.name}`);

    res.json({
      message: 'Successfully left team'
    });
  } catch (error) {
    logger.error('Leave team error:', error);
    res.status(500).json({
      error: 'Failed to leave team',
      message: error.message
    });
  }
});

module.exports = router;