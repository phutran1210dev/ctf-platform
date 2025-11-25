module.exports = (sequelize, DataTypes) => {
  const Challenge = sequelize.define('Challenge', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000]
      }
    },
    category: {
      type: DataTypes.ENUM(
        'web',
        'crypto',
        'reverse',
        'pwn',
        'forensics',
        'misc',
        'osint',
        'stego',
        'hardware',
        'mobile'
      ),
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
      allowNull: false
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 1000
      }
    },
    flag: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        len: [1, 500]
      }
    },
    flagRegex: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      validate: {
        len: [1, 1000]
      }
    },
    isCaseSensitive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    hints: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    files: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    dockerImage: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    dockerPort: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 65535
      }
    },
    dockerEnv: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    solveCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unlockAfter: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Challenges',
        key: 'id'
      }
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time limit in seconds'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'challenges',
    underscored: true,
    indexes: [
      { fields: ['category'] },
      { fields: ['difficulty'] },
      { fields: ['points'] },
      { fields: ['isActive'] },
      { fields: ['isVisible'] },
      { fields: ['authorId'] },
      { fields: ['sortOrder'] },
      { fields: ['solveCount'] }
    ]
  });

  Challenge.associate = function(models) {
    // Challenge belongs to User (author)
    Challenge.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });

    // Challenge has many Submissions
    Challenge.hasMany(models.Submission, {
      foreignKey: 'challengeId',
      as: 'submissions'
    });

    // Challenge has many Solves
    Challenge.hasMany(models.Solve, {
      foreignKey: 'challengeId',
      as: 'solves'
    });

    // Challenge can unlock other challenges
    Challenge.belongsTo(models.Challenge, {
      foreignKey: 'unlockAfter',
      as: 'prerequisite'
    });

    Challenge.hasMany(models.Challenge, {
      foreignKey: 'unlockAfter',
      as: 'unlockedChallenges'
    });
  };

  // Instance methods
  Challenge.prototype.validateFlag = function(submittedFlag) {
    if (!submittedFlag || typeof submittedFlag !== 'string') {
      return false;
    }

    let flag = this.flag;
    let submitted = submittedFlag.trim();

    if (!this.isCaseSensitive) {
      flag = flag.toLowerCase();
      submitted = submitted.toLowerCase();
    }

    // Check exact match first
    if (flag === submitted) {
      return true;
    }

    // Check regex if provided
    if (this.flagRegex) {
      try {
        const regex = new RegExp(this.flagRegex, this.isCaseSensitive ? 'g' : 'gi');
        return regex.test(submitted);
      } catch (error) {
        // Invalid regex, fall back to exact match
        return false;
      }
    }

    return false;
  };

  Challenge.prototype.isAvailable = function(user = null) {
    const now = new Date();

    // Check if challenge is active and visible
    if (!this.isActive || !this.isVisible) {
      return false;
    }

    // Check time windows
    if (this.startTime && now < this.startTime) {
      return false;
    }

    if (this.endTime && now > this.endTime) {
      return false;
    }

    return true;
  };

  Challenge.prototype.isUnlocked = async function(user) {
    if (!this.unlockAfter) {
      return true;
    }

    const { Solve } = sequelize.models;
    const solve = await Solve.findOne({
      where: {
        userId: user.id,
        challengeId: this.unlockAfter
      }
    });

    return !!solve;
  };

  Challenge.prototype.getUserAttempts = async function(userId) {
    const { Submission } = sequelize.models;
    const attempts = await Submission.count({
      where: {
        userId,
        challengeId: this.id
      }
    });
    return attempts;
  };

  Challenge.prototype.canUserSubmit = async function(userId) {
    if (!this.maxAttempts) {
      return true;
    }

    const attempts = await this.getUserAttempts(userId);
    return attempts < this.maxAttempts;
  };

  Challenge.prototype.toSafeObject = function(includeFlag = false) {
    const challenge = this.toJSON();
    
    if (!includeFlag) {
      delete challenge.flag;
      delete challenge.flagRegex;
    }
    
    return challenge;
  };

  return Challenge;
};