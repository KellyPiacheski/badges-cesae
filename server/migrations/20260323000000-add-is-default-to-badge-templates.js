'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('badge_templates');

    // Só adiciona a coluna se ainda não existir (tabela pode ter sido criada por syncDB)
    if (!tableDescription.is_default) {
      await queryInterface.addColumn('badge_templates', 'is_default', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('badge_templates');
    if (tableDescription.is_default) {
      await queryInterface.removeColumn('badge_templates', 'is_default');
    }
  },
};
