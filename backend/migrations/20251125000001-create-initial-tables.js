'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'moderator', 'user'),
        defaultValue: 'user',
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      school: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      solve_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Teams table
    await queryInterface.createTable('teams', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      captainId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      maxMembers: {
        type: Sequelize.INTEGER,
        defaultValue: 4
      },
      inviteCode: {
        type: Sequelize.STRING(8),
        allowNull: true,
        unique: true
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      solveCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lastSolveTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Challenges table
    await queryInterface.createTable('challenges', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('web', 'crypto', 'reverse', 'pwn', 'forensics', 'misc', 'osint', 'stego', 'hardware', 'mobile'),
        allowNull: false
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard', 'expert'),
        allowNull: false
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      flag: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      flagRegex: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      isCaseSensitive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      hints: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      files: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      dockerImage: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      dockerPort: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      dockerEnv: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVisible: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      solveCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      authorId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unlockAfter: {
        type: Sequelize.UUID,
        allowNull: true
      },
      timeLimit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Submissions table
    await queryInterface.createTable('submissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      challengeId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      submittedFlag: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      submissionTime: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Solves table
    await queryInterface.createTable('solves', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      challengeId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      submissionId: {
        type: Sequelize.UUID,
        allowNull: false
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      solveTime: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      isFirstBlood: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['team_id']);
    await queryInterface.addIndex('teams', ['name']);
    await queryInterface.addIndex('challenges', ['category']);
    await queryInterface.addIndex('challenges', ['difficulty']);
    await queryInterface.addIndex('submissions', ['userId', 'challengeId']);
    await queryInterface.addIndex('solves', ['userId', 'challengeId'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('solves');
    await queryInterface.dropTable('submissions');
    await queryInterface.dropTable('challenges');
    await queryInterface.dropTable('teams');
    await queryInterface.dropTable('users');
  }
};