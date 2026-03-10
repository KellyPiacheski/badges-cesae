const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BadgeTemplate = sequelize.define('BadgeTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  design_config: {
    type: DataTypes.JSON,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('evento', 'curso'),
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'badge_templates',
  timestamps: true,
  underscored: true,
  updatedAt: false
});

module.exports = BadgeTemplate;