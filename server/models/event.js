'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      Event.hasMany(models.Enrollment, { foreignKey: 'event_id' });
    }
  }

  Event.init({
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    type: { type: DataTypes.ENUM('evento', 'curso'), allowNull: false },
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    location: DataTypes.STRING,
    duration_hours: DataTypes.INTEGER,
    category: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Event',
    underscored: true,
  });

  return Event;
};