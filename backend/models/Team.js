module.exports = (sequelize, DataTypes) => {
  const Team = sequelize.define('Team', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    captainId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
      validate: {
        min: 1,
        max: 10
      }
    },
    inviteCode: {
      type: DataTypes.STRING(8),
      allowNull: true,
      unique: true
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    solveCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastSolveTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: [2, 2]
      }
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'teams',
    underscored: true,
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['captainId'] },
      { fields: ['inviteCode'], unique: true },
      { fields: ['score'] },
      { fields: ['isPublic'] },
      { fields: ['isActive'] }
    ],
    hooks: {
      beforeCreate: (team) => {
        // Generate invite code if not provided
        if (!team.inviteCode) {
          team.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        }
      }
    }
  });

  Team.associate = function(models) {
    // Team has many Users
    Team.hasMany(models.User, {
      foreignKey: 'teamId',
      as: 'members'
    });

    // Team belongs to User (captain)
    Team.belongsTo(models.User, {
      foreignKey: 'captainId',
      as: 'captain'
    });

    // Team has many Submissions through Users
    Team.hasMany(models.Submission, {
      foreignKey: 'teamId',
      as: 'submissions'
    });

    // Team has many Solves through Users
    Team.hasMany(models.Solve, {
      foreignKey: 'teamId',
      as: 'solves'
    });
  };

  // Instance methods
  Team.prototype.updateScore = async function() {
    const { Solve } = sequelize.models;
    const solves = await Solve.findAll({
      where: { teamId: this.id },
      include: [{
        model: sequelize.models.Challenge,
        as: 'challenge',
        attributes: ['points']
      }],
      order: [['createdAt', 'ASC']]
    });

    this.score = solves.reduce((total, solve) => total + solve.challenge.points, 0);
    this.solveCount = solves.length;
    
    // Set last solve time to the most recent solve
    if (solves.length > 0) {
      this.lastSolveTime = solves[solves.length - 1].createdAt;
    }
    
    await this.save();
  };

  Team.prototype.getMemberCount = async function() {
    const { User } = sequelize.models;
    const count = await User.count({
      where: { teamId: this.id }
    });
    return count;
  };

  Team.prototype.canAddMember = async function() {
    const memberCount = await this.getMemberCount();
    return memberCount < this.maxMembers;
  };

  Team.prototype.toSafeObject = function() {
    const team = this.toJSON();
    // Only show invite code to team members or admins
    if (!this.showInviteCode) {
      delete team.inviteCode;
    }
    return team;
  };

  return Team;
};