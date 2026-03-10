// server/src/scripts/syncDb.js
// Script para sincronizar os modelos com a base de dados Neon
// Corre com: node src/scripts/syncDb.js

require('dotenv').config();
const { sequelize, User, Event, Participant, Enrollment, Badge, Certificate, BadgeTemplate, EmailLog } = require('../models');
const bcrypt = require('bcrypt');

async function syncDatabase() {
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('Conexão à BD estabelecida com sucesso.\n');

    // Sincronizar modelos (alter: true adapta tabelas existentes sem apagar dados)
    console.log('A sincronizar modelos com a BD...\n');
    await sequelize.sync({ alter: true });
    console.log('Todos os modelos sincronizados com sucesso.\n');

    // Verificar tabelas criadas
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    );
    console.log('Tabelas na BD:');
    tables.forEach(t => console.log(`  - ${t.tablename}`));

    // Criar admin por defeito se não existir
    const adminExists = await User.findOne({ where: { email: 'admin@cesae.pt' } });
    if (!adminExists) {
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'Administrador',
        email: 'admin@cesae.pt',
        password_hash: hash,
        role: 'admin'
      });
      console.log('\nUtilizador admin criado:');
      console.log('  Email: admin@cesae.pt');
      console.log('  Password: admin123');
    } else {
      console.log('\nUtilizador admin já existe.');
    }

    console.log('\nSincronização concluída!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na sincronização:', error.message);
    process.exit(1);
  }
}

syncDatabase();