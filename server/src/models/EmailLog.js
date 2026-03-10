const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailLog = sequelize.define('EmailLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  certificate_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'certificates',
      key: 'id'
    }
  },
  recipient_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'email_logs',
  timestamps: false,
  underscored: true
});

module.exports = EmailLog;