const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [1, 50]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'moderator', 'user'),
      defaultValue: 'user',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      }
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: {
        len: [2, 2]
      }
    },
    school: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [1, 100]
      }
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Teams',
        key: 'id'
      }
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
    }
  }, {
    tableName: 'users',
    underscored: true,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['teamId'] },
      { fields: ['score'] },
      { fields: ['role'] },
      { fields: ['isActive'] }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      }
    }
  });

  User.associate = function(models) {
    // User belongs to Team
    User.belongsTo(models.Team, {
      foreignKey: 'teamId',
      as: 'team'
    });

    // User has many Submissions
    User.hasMany(models.Submission, {
      foreignKey: 'userId',
      as: 'submissions'
    });

    // User has many Solves
    User.hasMany(models.Solve, {
      foreignKey: 'userId',
      as: 'solves'
    });
  };

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  User.prototype.toSafeObject = function() {
    const user = this.toJSON();
    delete user.password;
    return user;
  };

  User.prototype.updateScore = async function() {
    const { Solve } = sequelize.models;
    const solves = await Solve.findAll({
      where: { userId: this.id },
      include: [{
        model: sequelize.models.Challenge,
        as: 'challenge',
        attributes: ['points']
      }]
    });

    this.score = solves.reduce((total, solve) => total + solve.challenge.points, 0);
    this.solveCount = solves.length;
    await this.save();
  };

  return User;
};