'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate(models) {
      Enrollment.belongsTo(models.Event, { foreignKey: 'event_id' });
      Enrollment.belongsTo(models.Participant, { foreignKey: 'participant_id' });
    }
  }

  Enrollment.init({
    event_id: { type: DataTypes.INTEGER, allowNull: false },
    participant_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM('inscrito', 'presente', 'ausente'),
      allowNull: false,
      defaultValue: 'inscrito',
    },
    evaluation_score: { type: DataTypes.FLOAT, allowNull: true },
    evaluation_result: { type: DataTypes.ENUM('aprovado', 'reprovado'), allowNull: true },
  }, {
    sequelize,
    modelName: 'Enrollment',
    underscored: true,
    createdAt: 'enrolled_at',
    updatedAt: false,
  });

  return Enrollment;
};