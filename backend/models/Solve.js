module.exports = (sequelize, DataTypes) => {
  const Solve = sequelize.define('Solve', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
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
    challengeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Challenges',
        key: 'id'
      }
    },
    submissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Submissions',
        key: 'id'
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    solveTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isFirstBlood: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'solves',
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['teamId'] },
      { fields: ['challengeId'] },
      { fields: ['solveTime'] },
      { fields: ['isFirstBlood'] },
      { fields: ['userId', 'challengeId'], unique: true },
      { fields: ['teamId', 'challengeId'] }
    ]
  });

  Solve.associate = function(models) {
    // Solve belongs to User
    Solve.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Solve belongs to Team
    Solve.belongsTo(models.Team, {
      foreignKey: 'teamId',
      as: 'team'
    });

    // Solve belongs to Challenge
    Solve.belongsTo(models.Challenge, {
      foreignKey: 'challengeId',
      as: 'challenge'
    });

    // Solve belongs to Submission
    Solve.belongsTo(models.Submission, {
      foreignKey: 'submissionId',
      as: 'submission'
    });
  };

  return Solve;
};