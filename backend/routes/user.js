const express = require('express');
const { Op } = require('sequelize');
const { User, Team, Challenge, Solve, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total challenges count
    const totalChallenges = await Challenge.count();

    // Get user's solved challenges count
    const solvedChallenges = await Solve.count({
      where: { userId },
    });

    // Get user's total points
    const userSolves = await Solve.findAll({
      where: { userId },
      include: [{
        model: Challenge,
        as: 'challenge',
        attributes: ['points'],
      }],
    });

    const totalPoints = userSolves.reduce((sum, solve) => sum + solve.challenge.points, 0);

    // Get user's rank (based on total points)
    const userRankQuery = await sequelize.query(`
      SELECT COUNT(*) + 1 as user_rank
      FROM (
        SELECT u.id, COALESCE(SUM(c.points), 0) as total_points
        FROM users u
        LEFT JOIN solves s ON u.id = s.user_id
        LEFT JOIN challenges c ON s.challenge_id = c.id
        GROUP BY u.id
        HAVING total_points > ?
      ) as user_rankings
    `, {
      replacements: [totalPoints],
      type: sequelize.QueryTypes.SELECT,
    });

    const rank = userRankQuery[0]?.user_rank || 1;

    // Get team rank if user is in a team
    let teamRank = null;
    if (req.user.teamId) {
      const teamRankQuery = await sequelize.query(`
        SELECT COUNT(*) + 1 as team_rank
        FROM (
          SELECT t.id, COALESCE(SUM(c.points), 0) as total_points
          FROM teams t
          LEFT JOIN users u ON t.id = u.team_id
          LEFT JOIN solves s ON u.id = s.user_id
          LEFT JOIN challenges c ON s.challenge_id = c.id
          GROUP BY t.id
          HAVING total_points > (
            SELECT COALESCE(SUM(c2.points), 0)
            FROM users u2
            LEFT JOIN solves s2 ON u2.id = s2.user_id
            LEFT JOIN challenges c2 ON s2.challenge_id = c2.id
            WHERE u2.team_id = ?
          )
        ) as team_rankings
      `, {
        replacements: [req.user.teamId],
        type: sequelize.QueryTypes.SELECT,
      });

      teamRank = teamRankQuery[0]?.team_rank || 1;
    }

    res.json({
      totalChallenges,
      solvedChallenges,
      totalPoints,
      rank,
      teamRank,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user's recent solves
router.get('/recent-solves', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const recentSolves = await Solve.findAll({
      where: { userId },
      include: [{
        model: Challenge,
        as: 'challenge',
        attributes: ['id', 'title', 'category', 'points'],
      }],
      order: [['createdAt', 'DESC']],
      limit,
    });

    const formattedSolves = recentSolves.map(solve => ({
      id: solve.challenge.id,
      name: solve.challenge.title,
      category: solve.challenge.category,
      points: solve.challenge.points,
      solved: true,
      solvedAt: solve.createdAt,
    }));

    res.json(formattedSolves);
  } catch (error) {
    console.error('Error fetching recent solves:', error);
    res.status(500).json({ error: 'Failed to fetch recent solves' });
  }
});

// Get user's profile information
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role'],
      include: [{
        model: Team,
        as: 'team',
        attributes: ['id', 'name']
      }],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's solve count and points
    const solveStats = await Solve.findAll({
      where: { userId: user.id },
      include: [{
        model: Challenge,
        as: 'challenge',
        attributes: ['points', 'category'],
      }],
    });

    const totalPoints = solveStats.reduce((sum, solve) => sum + solve.challenge.points, 0);
    const solveCount = solveStats.length;

    // Get category breakdown
    const categoryStats = {};
    solveStats.forEach(solve => {
      const category = solve.challenge.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, points: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].points += solve.challenge.points;
    });

    res.json({
      ...user.toJSON(),
      stats: {
        totalPoints,
        solveCount,
        categoryStats,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user.id;

    // Validate input
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [Op.ne]: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    await User.update(
      {
        firstName,
        lastName,
        email,
      },
      {
        where: { id: userId },
      }
    );

    // Fetch updated user data
    const updatedUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role'],
      include: [{
        model: Team,
        as: 'team',
        attributes: ['id', 'name'],
      }],
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;