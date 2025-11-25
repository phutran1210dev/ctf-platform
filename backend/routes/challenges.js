const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { Op } = require('sequelize');
const { Challenge, User, Submission, Solve, Team } = require('../models');
const { requireModerator, requireActiveCompetition, requireTeamMembership } = require('../middleware/auth');
const logger = require('../config/logger');
const SocketService = require('../services/socketService');

const router = express.Router();

// @route   GET /api/challenges
// @desc    Get all visible challenges for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, solved, search } = req.query;
    
    const whereClause = {
      isActive: true,
      isVisible: true
    };

    // Add filters
    if (category) {
      whereClause.category = category;
    }
    
    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const challenges = await Challenge.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }
      ],
      order: [['sortOrder', 'ASC'], ['points', 'ASC']],
      attributes: { exclude: ['flag', 'flagRegex'] }
    });

    // Get user's solves
    const userSolves = await Solve.findAll({
      where: { userId: req.user.id },
      attributes: ['challengeId']
    });
    const solvedChallengeIds = new Set(userSolves.map(solve => solve.challengeId));

    // Filter challenges based on solved status if requested
    let filteredChallenges = challenges;
    if (solved === 'true') {
      filteredChallenges = challenges.filter(c => solvedChallengeIds.has(c.id));
    } else if (solved === 'false') {
      filteredChallenges = challenges.filter(c => !solvedChallengeIds.has(c.id));
    }

    // Add solved status and check if unlocked
    const challengesWithStatus = await Promise.all(
      filteredChallenges.map(async (challenge) => {
        const challengeObj = challenge.toSafeObject();
        challengeObj.isSolved = solvedChallengeIds.has(challenge.id);
        challengeObj.isUnlocked = await challenge.isUnlocked(req.user);
        challengeObj.userAttempts = await challenge.getUserAttempts(req.user.id);
        return challengeObj;
      })
    );

    res.json({
      challenges: challengesWithStatus,
      total: challengesWithStatus.length
    });
  } catch (error) {
    logger.error('Get challenges error:', error);
    res.status(500).json({
      error: 'Failed to fetch challenges',
      message: error.message
    });
  }
});

// @route   GET /api/challenges/categories
// @desc    Get all challenge categories
// @access  Private
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'web', name: 'Web', description: 'Web application security challenges' },
    { id: 'crypto', name: 'Cryptography', description: 'Cryptographic puzzles and cipher challenges' },
    { id: 'reverse', name: 'Reverse Engineering', description: 'Binary analysis and reverse engineering' },
    { id: 'pwn', name: 'Pwn', description: 'Binary exploitation and memory corruption' },
    { id: 'forensics', name: 'Forensics', description: 'Digital forensics and incident response' },
    { id: 'misc', name: 'Miscellaneous', description: 'Various other types of challenges' },
    { id: 'osint', name: 'OSINT', description: 'Open source intelligence gathering' },
    { id: 'stego', name: 'Steganography', description: 'Hidden data and steganography' },
    { id: 'hardware', name: 'Hardware', description: 'Hardware security and embedded systems' },
    { id: 'mobile', name: 'Mobile', description: 'Mobile application security' }
  ];

  res.json({ categories });
});

// @route   GET /api/challenges/:id
// @desc    Get specific challenge details
// @access  Private
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid challenge ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const challenge = await Challenge.findOne({
      where: {
        id: req.params.id,
        isActive: true,
        isVisible: true
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!challenge) {
      return res.status(404).json({
        error: 'Challenge not found'
      });
    }

    // Check if challenge is available and unlocked
    if (!challenge.isAvailable()) {
      return res.status(403).json({
        error: 'Challenge is not available'
      });
    }

    const isUnlocked = await challenge.isUnlocked(req.user);
    if (!isUnlocked) {
      return res.status(403).json({
        error: 'Challenge is locked',
        message: 'You need to solve the prerequisite challenge first'
      });
    }

    // Get user's solve status
    const userSolve = await Solve.findOne({
      where: {
        userId: req.user.id,
        challengeId: challenge.id
      }
    });

    const challengeData = challenge.toSafeObject();
    challengeData.isSolved = !!userSolve;
    challengeData.userAttempts = await challenge.getUserAttempts(req.user.id);
    challengeData.canSubmit = await challenge.canUserSubmit(req.user.id);

    if (userSolve) {
      challengeData.solveTime = userSolve.solveTime;
    }

    res.json({ challenge: challengeData });
  } catch (error) {
    logger.error('Get challenge error:', error);
    res.status(500).json({
      error: 'Failed to fetch challenge',
      message: error.message
    });
  }
});

// @route   POST /api/challenges/:id/submit
// @desc    Submit flag for challenge
// @access  Private
router.post('/:id/submit', [
  requireActiveCompetition,
  requireTeamMembership,
  param('id').isUUID().withMessage('Invalid challenge ID'),
  body('flag').notEmpty().withMessage('Flag is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { flag } = req.body;
    const challengeId = req.params.id;
    const userId = req.user.id;
    const teamId = req.user.teamId;

    const challenge = await Challenge.findOne({
      where: {
        id: challengeId,
        isActive: true,
        isVisible: true
      }
    });

    if (!challenge) {
      return res.status(404).json({
        error: 'Challenge not found'
      });
    }

    // Check if challenge is available
    if (!challenge.isAvailable()) {
      return res.status(403).json({
        error: 'Challenge is not available'
      });
    }

    // Check if challenge is unlocked
    const isUnlocked = await challenge.isUnlocked(req.user);
    if (!isUnlocked) {
      return res.status(403).json({
        error: 'Challenge is locked'
      });
    }

    // Check if user already solved this challenge
    const existingSolve = await Solve.findOne({
      where: { userId, challengeId }
    });

    if (existingSolve) {
      return res.status(409).json({
        error: 'Challenge already solved'
      });
    }

    // Check submission limits
    const canSubmit = await challenge.canUserSubmit(userId);
    if (!canSubmit) {
      return res.status(429).json({
        error: 'Maximum submission attempts reached'
      });
    }

    // Validate flag
    const isCorrect = challenge.validateFlag(flag);
    const points = isCorrect ? challenge.points : 0;

    // Create submission record
    const submission = await Submission.create({
      userId,
      teamId,
      challengeId,
      submittedFlag: flag,
      isCorrect,
      points,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    let solve = null;
    let isFirstBlood = false;

    if (isCorrect) {
      // Check if this is first blood
      const existingSolves = await Solve.count({
        where: { challengeId }
      });
      isFirstBlood = existingSolves === 0;

      // Create solve record
      solve = await Solve.create({
        userId,
        teamId,
        challengeId,
        submissionId: submission.id,
        points,
        isFirstBlood
      });

      // Update challenge solve count
      await challenge.increment('solveCount');

      // Update user and team scores
      const user = await User.findByPk(userId);
      await user.updateScore();

      if (teamId) {
        const team = await Team.findByPk(teamId);
        await team.updateScore();
      }

      // Emit real-time updates
      const socketService = SocketService.getInstance();
      if (socketService) {
        socketService.emitSolve({
          challengeId,
          challengeTitle: challenge.title,
          userId,
          username: req.user.username,
          teamId,
          points,
          isFirstBlood
        });
      }

      logger.info(`Challenge solved: ${challenge.title} by ${req.user.username} ${isFirstBlood ? '(First Blood!)' : ''}`);
    }

    res.json({
      success: isCorrect,
      message: isCorrect ? 'Correct flag!' : 'Incorrect flag',
      points: points,
      isFirstBlood,
      solve: solve ? solve.toJSON() : null,
      attemptsRemaining: challenge.maxAttempts ? 
        challenge.maxAttempts - await challenge.getUserAttempts(userId) : null
    });

  } catch (error) {
    logger.error('Submit flag error:', error);
    res.status(500).json({
      error: 'Failed to submit flag',
      message: error.message
    });
  }
});

// @route   GET /api/challenges/:id/submissions
// @desc    Get user's submissions for a challenge
// @access  Private
router.get('/:id/submissions', [
  param('id').isUUID().withMessage('Invalid challenge ID')
], async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      where: {
        userId: req.user.id,
        challengeId: req.params.id
      },
      attributes: ['id', 'submittedFlag', 'isCorrect', 'points', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ submissions });
  } catch (error) {
    logger.error('Get submissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

module.exports = router;