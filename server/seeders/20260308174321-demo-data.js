'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Events', [
      {
        title: 'Workshop de React',
        description: 'Introdução ao React e Next.js',
        type: 'curso',
        start_date: new Date('2026-03-15'),
        end_date: new Date('2026-03-20'),
        location: 'CESAE Digital - Sala 1',
        duration_hours: 30,
        category: 'Desenvolvimento Web',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Palestra de Cibersegurança',
        description: 'Boas práticas de segurança digital',
        type: 'evento',
        start_date: new Date('2026-03-25'),
        end_date: new Date('2026-03-25'),
        location: 'CESAE Digital - Auditório',
        duration_hours: 3,
        category: 'Segurança',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('Participants', [
      { name: 'Ana Silva', email: 'ana.silva@email.com', phone: '912345678', organization: 'Empresa A', created_at: new Date() },
      { name: 'João Costa', email: 'joao.costa@email.com', phone: '923456789', organization: 'Empresa B', created_at: new Date() },
      { name: 'Maria Santos', email: 'maria.santos@email.com', phone: '934567890', organization: 'Freelancer', created_at: new Date() },
      { name: 'Pedro Oliveira', email: 'pedro.oliveira@email.com', phone: '945678901', organization: 'Empresa A', created_at: new Date() },
      { name: 'Sofia Pereira', email: 'sofia.pereira@email.com', phone: '956789012', organization: 'Empresa C', created_at: new Date() },
    ]);

    await queryInterface.bulkInsert('Enrollments', [
      { event_id: 1, participant_id: 1, status: 'presente', evaluation_score: 16.5, evaluation_result: 'aprovado', enrolled_at: new Date() },
      { event_id: 1, participant_id: 2, status: 'presente', evaluation_score: 12.0, evaluation_result: 'aprovado', enrolled_at: new Date() },
      { event_id: 1, participant_id: 3, status: 'ausente', evaluation_score: null, evaluation_result: null, enrolled_at: new Date() },
      { event_id: 2, participant_id: 1, status: 'presente', evaluation_score: null, evaluation_result: null, enrolled_at: new Date() },
      { event_id: 2, participant_id: 4, status: 'presente', evaluation_score: null, evaluation_result: null, enrolled_at: new Date() },
      { event_id: 2, participant_id: 5, status: 'inscrito', evaluation_score: null, evaluation_result: null, enrolled_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Enrollments', null, {});
    await queryInterface.bulkDelete('Participants', null, {});
    await queryInterface.bulkDelete('Events', null, {});
  },
};