'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Participant extends Model {
    static associate(models) {
      Participant.hasMany(models.Enrollment, { foreignKey: 'participant_id' });
    }
  }

  Participant.init({
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: DataTypes.STRING,
    organization: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Participant',
    underscored: true,
    updatedAt: false,
  });

  return Participant;
};