// server/src/scripts/seedTestData.js
// Script para criar dados de teste na BD
// Corre com: node src/scripts/seedTestData.js

require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Event, Participant, Enrollment } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conexão à BD estabelecida.\n');

    // 1. Criar utilizadores
    const adminHash = await bcrypt.hash('admin123', 10);
    const formadorHash = await bcrypt.hash('formador123', 10);

    const [admin] = await User.findOrCreate({
      where: { email: 'admin@cesae.pt' },
      defaults: { name: 'Administrador', password_hash: adminHash, role: 'admin' }
    });

    const [formador] = await User.findOrCreate({
      where: { email: 'formador@cesae.pt' },
      defaults: { name: 'João Formador', password_hash: formadorHash, role: 'formador' }
    });

    console.log('Utilizadores criados/verificados.');

    // 2. Criar eventos
    const [evento1] = await Event.findOrCreate({
      where: { title: 'Workshop de Design Thinking' },
      defaults: {
        description: 'Workshop prático de Design Thinking aplicado a projetos digitais.',
        type: 'evento',
        start_date: '2026-04-10',
        end_date: '2026-04-10',
        location: 'CESAE Digital - Sala 1',
        duration_hours: 4,
        category: 'Design',
        created_by: admin.id
      }
    });

    const [curso1] = await Event.findOrCreate({
      where: { title: 'Curso Intensivo de React' },
      defaults: {
        description: 'Curso de 40 horas sobre React, Next.js e desenvolvimento frontend moderno.',
        type: 'curso',
        start_date: '2026-04-14',
        end_date: '2026-05-09',
        location: 'CESAE Digital - Sala 3',
        duration_hours: 40,
        category: 'Tecnologia',
        created_by: admin.id
      }
    });

    const [evento2] = await Event.findOrCreate({
      where: { title: 'Palestra: Futuro da IA' },
      defaults: {
        description: 'Palestra sobre as tendências de Inteligência Artificial em 2026.',
        type: 'evento',
        start_date: '2026-04-20',
        location: 'CESAE Digital - Auditório',
        duration_hours: 2,
        category: 'Tecnologia',
        created_by: admin.id
      }
    });

    console.log('Eventos criados/verificados.');

    // 3. Criar participantes
    const participantesData = [
      { name: 'Ana Silva', email: 'ana.silva@email.com', organization: 'TechCorp' },
      { name: 'Carlos Mendes', email: 'carlos.mendes@email.com', organization: 'DesignStudio' },
      { name: 'Maria Costa', email: 'maria.costa@email.com', phone: '912345678', organization: 'CESAE Digital' },
      { name: 'Pedro Almeida', email: 'pedro.almeida@email.com', organization: 'StartupXYZ' },
      { name: 'Sofia Rodrigues', email: 'sofia.rodrigues@email.com', phone: '923456789', organization: 'WebAgency' },
      { name: 'Rui Ferreira', email: 'rui.ferreira@email.com', organization: 'DataCo' }
    ];

    const participants = [];
    for (const p of participantesData) {
      const [participant] = await Participant.findOrCreate({
        where: { email: p.email },
        defaults: p
      });
      participants.push(participant);
    }

    console.log('Participantes criados/verificados.');

    // 4. Criar inscrições
    const enrollmentsData = [
      // Workshop Design Thinking - todos presentes
      { event_id: evento1.id, participant_id: participants[0].id, status: 'presente' },
      { event_id: evento1.id, participant_id: participants[1].id, status: 'presente' },
      { event_id: evento1.id, participant_id: participants[2].id, status: 'ausente' },
      // Curso React - com avaliações
      { event_id: curso1.id, participant_id: participants[0].id, status: 'presente', evaluation_score: 18, evaluation_result: 'aprovado' },
      { event_id: curso1.id, participant_id: participants[3].id, status: 'presente', evaluation_score: 15, evaluation_result: 'aprovado' },
      { event_id: curso1.id, participant_id: participants[4].id, status: 'presente', evaluation_score: 8, evaluation_result: 'reprovado' },
      { event_id: curso1.id, participant_id: participants[5].id, status: 'inscrito' },
      // Palestra IA - inscritos
      { event_id: evento2.id, participant_id: participants[1].id, status: 'inscrito' },
      { event_id: evento2.id, participant_id: participants[2].id, status: 'inscrito' },
      { event_id: evento2.id, participant_id: participants[4].id, status: 'inscrito' },
    ];

    for (const e of enrollmentsData) {
      await Enrollment.findOrCreate({
        where: { event_id: e.event_id, participant_id: e.participant_id },
        defaults: e
      });
    }

    console.log('Inscrições criadas/verificadas.');

    console.log('\n--- Dados de teste ---');
    console.log('Admin:    admin@cesae.pt / admin123');
    console.log('Formador: formador@cesae.pt / formador123');
    console.log(`Eventos:  ${evento1.title}, ${curso1.title}, ${evento2.title}`);
    console.log(`Participantes: ${participants.length}`);
    console.log('\nSeed concluído!');

    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error.message);
    process.exit(1);
  }
}

seed();