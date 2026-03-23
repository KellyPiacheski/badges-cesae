'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Verifica se já existe um template default para não duplicar
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM badge_templates WHERE is_default = true LIMIT 1',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existing.length > 0) return;

    await queryInterface.bulkInsert('badge_templates', [
      {
        name: 'Template CESAE Padrão',
        design_config: JSON.stringify({
          backgroundColor: '#FFFFFF',
          primaryColor: '#1B4F72',
          secondaryColor: '#2E86C1',
          accentColor: '#8E44AD',
          textColor: '#1C2833',
          lightTextColor: '#566573',
          borderColor: '#D4E6F1',
        }),
        type: null,
        is_default: true,
        created_by: null,
        created_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('badge_templates', { is_default: true }, {});
  },
};
