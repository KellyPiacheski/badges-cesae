const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  participant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'participants',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('inscrito', 'presente', 'ausente'),
    allowNull: false,
    defaultValue: 'inscrito'
  },
  evaluation_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  evaluation_result: {
    type: DataTypes.ENUM('aprovado', 'reprovado'),
    allowNull: true
  },
  enrolled_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'enrollments',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['event_id', 'participant_id']
    }
  ]
});

module.exports = Enrollment;