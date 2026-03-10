// server/migrations/20260309000000-create-user.js
// Migration para criar a tabela users
// Apenas administradores e formadores têm conta — os participantes não têm login

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        // Email único por utilizador — a BD rejeita duplicados automaticamente
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password_hash: {
        // IMPORTANTE: nunca guarda a password em texto simples
        // A encriptação com bcrypt é feita no authController antes de inserir
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        // Só aceita 'admin' ou 'formador'
        type: Sequelize.ENUM("admin", "formador"),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    // Desfaz a migration — apaga a tabela users
    await queryInterface.dropTable("Users");
  },
};
