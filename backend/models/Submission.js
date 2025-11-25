module.exports = (sequelize, DataTypes) => {
  const Submission = sequelize.define('Submission', {
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
    submittedFlag: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    submissionTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'submissions',
    underscored: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['teamId'] },
      { fields: ['challengeId'] },
      { fields: ['isCorrect'] },
      { fields: ['submissionTime'] },
      { fields: ['userId', 'challengeId'] },
      { fields: ['teamId', 'challengeId'] }
    ]
  });

  Submission.associate = function(models) {
    // Submission belongs to User
    Submission.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Submission belongs to Team
    Submission.belongsTo(models.Team, {
      foreignKey: 'teamId',
      as: 'team'
    });

    // Submission belongs to Challenge
    Submission.belongsTo(models.Challenge, {
      foreignKey: 'challengeId',
      as: 'challenge'
    });
  };

  return Submission;
};