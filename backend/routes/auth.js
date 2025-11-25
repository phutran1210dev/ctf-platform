const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .isAlphanumeric()
    .withMessage('Username must contain only letters and numbers'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
];

const loginValidation = [
  body('login')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        error: `User with this ${field} already exists`,
        field
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName
    });

    // Generate token
    const token = generateToken(user);

    logger.info(`User registered: ${user.username} (${user.email})`);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { login, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: login },
          { email: login }
        ],
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user);

    logger.info(`User logged in: ${user.username}`);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: require('../models').Team,
          as: 'team',
          attributes: ['id', 'name', 'score']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user information',
      message: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  logger.info(`User logged out: ${req.user.username}`);
  
  res.json({
    message: 'Logout successful'
  });
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token validity
// @access  Private
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

module.exports = router;