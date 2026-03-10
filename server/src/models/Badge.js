const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  enrollment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'enrollments',
      key: 'id'
    }
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'badge_templates',
      key: 'id'
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'badges',
  timestamps: false,
  underscored: true
});

module.exports = Badge;