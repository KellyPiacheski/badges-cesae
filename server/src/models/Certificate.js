const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Certificate = sequelize.define('Certificate', {
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
  validation_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  email_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  issued_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'certificates',
  timestamps: false,
  underscored: true
});

module.exports = Certificate;