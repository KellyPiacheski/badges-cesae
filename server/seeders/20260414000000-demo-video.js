'use strict';

// Seeder para demo em video — dados realistas da CESAE Digital
// Execucao: npx sequelize-cli db:seed --seed 20260414000000-demo-video.js

module.exports = {
  async up(queryInterface) {
    // ── EVENTOS ────────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('Events', [
      {
        title: 'Bootcamp Python para Data Science',
        description: 'Formação intensiva em Python aplicado a análise de dados, visualização e machine learning com bibliotecas como Pandas, NumPy e Scikit-learn.',
        type: 'curso',
        start_date: new Date('2025-11-04'),
        end_date: new Date('2025-11-29'),
        location: 'CESAE Digital — Sala 3',
        duration_hours: 80,
        category: 'Data Science',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Seminário de Inteligência Artificial',
        description: 'Palestra sobre o estado atual da IA, casos de uso em empresas portuguesas e o impacto no mercado de trabalho.',
        type: 'evento',
        start_date: new Date('2025-12-10'),
        end_date: new Date('2025-12-10'),
        location: 'CESAE Digital — Auditório',
        duration_hours: 4,
        category: 'Inteligência Artificial',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Formação em Cibersegurança Avançada',
        description: 'Programa avançado de cibersegurança: ethical hacking, análise de vulnerabilidades, SIEM e resposta a incidentes.',
        type: 'curso',
        start_date: new Date('2026-01-13'),
        end_date: new Date('2026-02-07'),
        location: 'CESAE Digital — Sala 1',
        duration_hours: 40,
        category: 'Cibersegurança',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Workshop de UX/UI Design',
        description: 'Sessão prática de design de interfaces centradas no utilizador, com ferramentas como Figma e metodologias de design thinking.',
        type: 'evento',
        start_date: new Date('2026-02-20'),
        end_date: new Date('2026-02-20'),
        location: 'CESAE Digital — Sala 2',
        duration_hours: 8,
        category: 'Design',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Desenvolvimento Web Full Stack',
        description: 'Curso completo de desenvolvimento web com React, Node.js, PostgreSQL e deploy em cloud. Do zero ao primeiro projeto profissional.',
        type: 'curso',
        start_date: new Date('2026-03-03'),
        end_date: new Date('2026-04-11'),
        location: 'CESAE Digital — Sala 3',
        duration_hours: 120,
        category: 'Desenvolvimento Web',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: 'Palestra: Tendências Tech 2026',
        description: 'Debate sobre as principais tendências tecnológicas de 2026: IA generativa, computação quântica, edge computing e o futuro das profissões digitais.',
        type: 'evento',
        start_date: new Date('2026-04-08'),
        end_date: new Date('2026-04-08'),
        location: 'CESAE Digital — Auditório',
        duration_hours: 2,
        category: 'Tecnologia',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});

    // ── PARTICIPANTES ──────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('Participants', [
      { name: 'Ana Silva Moreira',      email: 'ana.moreira@gmail.com',       phone: '912 345 678', organization: 'NOS Comunicações',    created_at: new Date() },
      { name: 'João Pedro Costa',       email: 'joao.costa@outlook.pt',       phone: '923 456 789', organization: 'Altice Portugal',      created_at: new Date() },
      { name: 'Maria Beatriz Santos',   email: 'mbsantos@sapo.pt',            phone: '934 567 890', organization: 'Freelancer',           created_at: new Date() },
      { name: 'Pedro Rodrigues Lima',   email: 'pedro.lima@empresa.pt',       phone: '945 678 901', organization: 'Sonae IM',             created_at: new Date() },
      { name: 'Sofia Ferreira Pinto',   email: 'sofia.pinto@gmail.com',       phone: '956 789 012', organization: 'Farfetch',             created_at: new Date() },
      { name: 'Rui Alexandre Mendes',   email: 'rui.mendes@hotmail.com',      phone: '967 890 123', organization: 'INESCTEC',             created_at: new Date() },
      { name: 'Catarina Oliveira',      email: 'catarina.oliveira@gmail.com', phone: '978 901 234', organization: 'Caixa Geral de Depósitos', created_at: new Date() },
      { name: 'Tiago Sousa Fonseca',    email: 'tiago.fonseca@sapo.pt',       phone: '989 012 345', organization: 'Altice Portugal',      created_at: new Date() },
      { name: 'Inês Margarida Lopes',   email: 'ines.lopes@outlook.pt',       phone: '910 123 456', organization: 'Uniplaces',            created_at: new Date() },
      { name: 'Bruno Filipe Carvalho',  email: 'bruno.carvalho@gmail.com',    phone: '921 234 567', organization: 'Farfetch',             created_at: new Date() },
      { name: 'Mariana Dias Correia',   email: 'mariana.correia@gmail.com',   phone: '932 345 678', organization: 'NOS Comunicações',     created_at: new Date() },
      { name: 'Francisco Neto Vieira',  email: 'francisco.vieira@empresa.pt', phone: '943 456 789', organization: 'Freelancer',           created_at: new Date() },
      { name: 'Leonor Azevedo Cruz',    email: 'leonor.cruz@sapo.pt',         phone: '954 567 890', organization: 'Prozis',               created_at: new Date() },
      { name: 'André Monteiro Silva',   email: 'andre.silva@hotmail.com',     phone: '965 678 901', organization: 'Sonae IM',             created_at: new Date() },
      { name: 'Beatriz Tavares Nunes',  email: 'beatriz.nunes@gmail.com',     phone: '976 789 012', organization: 'INESCTEC',             created_at: new Date() },
    ], {});

    // ── INSCRICOES ─────────────────────────────────────────────────────────────
    // IDs dos eventos dependem dos dados ja existentes — ajustar se necessario
    // Este seeder assume que estes sao os primeiros eventos na base de dados.
    // Se ja existirem eventos, substituir event_id pelos IDs corretos.

    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        ev1 INT; ev2 INT; ev3 INT; ev4 INT; ev5 INT; ev6 INT;
        p1 INT; p2 INT; p3 INT; p4 INT; p5 INT;
        p6 INT; p7 INT; p8 INT; p9 INT; p10 INT;
        p11 INT; p12 INT; p13 INT; p14 INT; p15 INT;
      BEGIN
        -- Buscar IDs dos eventos pelo titulo
        SELECT id INTO ev1 FROM "Events" WHERE title = 'Bootcamp Python para Data Science' LIMIT 1;
        SELECT id INTO ev2 FROM "Events" WHERE title = 'Seminário de Inteligência Artificial' LIMIT 1;
        SELECT id INTO ev3 FROM "Events" WHERE title = 'Formação em Cibersegurança Avançada' LIMIT 1;
        SELECT id INTO ev4 FROM "Events" WHERE title = 'Workshop de UX/UI Design' LIMIT 1;
        SELECT id INTO ev5 FROM "Events" WHERE title = 'Desenvolvimento Web Full Stack' LIMIT 1;
        SELECT id INTO ev6 FROM "Events" WHERE title = 'Palestra: Tendências Tech 2026' LIMIT 1;

        -- Buscar IDs dos participantes pelo email
        SELECT id INTO p1  FROM "Participants" WHERE email = 'ana.moreira@gmail.com' LIMIT 1;
        SELECT id INTO p2  FROM "Participants" WHERE email = 'joao.costa@outlook.pt' LIMIT 1;
        SELECT id INTO p3  FROM "Participants" WHERE email = 'mbsantos@sapo.pt' LIMIT 1;
        SELECT id INTO p4  FROM "Participants" WHERE email = 'pedro.lima@empresa.pt' LIMIT 1;
        SELECT id INTO p5  FROM "Participants" WHERE email = 'sofia.pinto@gmail.com' LIMIT 1;
        SELECT id INTO p6  FROM "Participants" WHERE email = 'rui.mendes@hotmail.com' LIMIT 1;
        SELECT id INTO p7  FROM "Participants" WHERE email = 'catarina.oliveira@gmail.com' LIMIT 1;
        SELECT id INTO p8  FROM "Participants" WHERE email = 'tiago.fonseca@sapo.pt' LIMIT 1;
        SELECT id INTO p9  FROM "Participants" WHERE email = 'ines.lopes@outlook.pt' LIMIT 1;
        SELECT id INTO p10 FROM "Participants" WHERE email = 'bruno.carvalho@gmail.com' LIMIT 1;
        SELECT id INTO p11 FROM "Participants" WHERE email = 'mariana.correia@gmail.com' LIMIT 1;
        SELECT id INTO p12 FROM "Participants" WHERE email = 'francisco.vieira@empresa.pt' LIMIT 1;
        SELECT id INTO p13 FROM "Participants" WHERE email = 'leonor.cruz@sapo.pt' LIMIT 1;
        SELECT id INTO p14 FROM "Participants" WHERE email = 'andre.silva@hotmail.com' LIMIT 1;
        SELECT id INTO p15 FROM "Participants" WHERE email = 'beatriz.nunes@gmail.com' LIMIT 1;

        -- Bootcamp Python (curso) — 8 inscritos, maioria aprovada
        INSERT INTO "Enrollments" (event_id, participant_id, status, evaluation_score, evaluation_result, enrolled_at)
        VALUES
          (ev1, p1,  'presente', 17.5, 'aprovado',   NOW()),
          (ev1, p2,  'presente', 14.0, 'aprovado',   NOW()),
          (ev1, p3,  'presente',  9.5, 'reprovado',  NOW()),
          (ev1, p4,  'presente', 18.0, 'aprovado',   NOW()),
          (ev1, p5,  'presente', 15.5, 'aprovado',   NOW()),
          (ev1, p6,  'ausente',  NULL, NULL,          NOW()),
          (ev1, p7,  'presente', 11.0, 'aprovado',   NOW()),
          (ev1, p8,  'presente',  8.0, 'reprovado',  NOW());

        -- Seminario IA (evento) — 10 inscritos, maioria presente
        INSERT INTO "Enrollments" (event_id, participant_id, status, evaluation_score, evaluation_result, enrolled_at)
        VALUES
          (ev2, p1,  'presente', NULL, NULL, NOW()),
          (ev2, p3,  'presente', NULL, NULL, NOW()),
          (ev2, p5,  'presente', NULL, NULL, NOW()),
          (ev2, p7,  'presente', NULL, NULL, NOW()),
          (ev2, p9,  'presente', NULL, NULL, NOW()),
          (ev2, p10, 'presente', NULL, NULL, NOW()),
          (ev2, p11, 'ausente',  NULL, NULL, NOW()),
          (ev2, p12, 'presente', NULL, NULL, NOW()),
          (ev2, p13, 'presente', NULL, NULL, NOW()),
          (ev2, p14, 'ausente',  NULL, NULL, NOW());

        -- Ciberseguranca (curso) — 7 inscritos
        INSERT INTO "Enrollments" (event_id, participant_id, status, evaluation_score, evaluation_result, enrolled_at)
        VALUES
          (ev3, p2,  'presente', 16.0, 'aprovado',  NOW()),
          (ev3, p4,  'presente', 13.5, 'aprovado',  NOW()),
          (ev3, p6,  'presente', 19.0, 'aprovado',  NOW()),
          (ev3, p8,  'presente',  7.5, 'reprovado', NOW()),
          (ev3, p10, 'presente', 12.0, 'aprovado',  NOW()),
          (ev3, p12, 'ausente',  NULL, NULL,         NOW()),
          (ev3, p15, 'presente', 15.0, 'aprovado',  NOW());

        -- Workshop UX/UI (evento) — 6 inscritos
        INSERT INTO "Enrollments" (event_id, participant_id, status, evaluation_score, evaluation_result, enrolled_at)
        VALUES
          (ev4, p1,  'presente', NULL, NULL, NOW()),
          (ev4, p5,  'presente', NULL, NULL, NOW()),
          (ev4, p9,  'presente', NULL, NULL, NOW()),
          (ev4, p11, 'presente', NULL, NULL, NOW()),
          (ev4, p13, 'ausente',  NULL, NULL, NOW()),
          (ev4, p15, 'presente', NULL, NULL, NOW());

        -- Full Stack (curso) — 9 inscritos, mix de estados
        INSERT INTO "Enrollments" (event_id, participant_id, status, evaluation_score, evaluation_result, enrolled_at)
        VALUES
          (ev5, p1,  'presente', 18.5, 'aprovado',  NOW()),
          (ev5, p3,  'presente', 16.0, 'aprovado',  NOW()),
          (ev5, p5,  'presente', 14.0, 'aprovado',  NOW()),
          (ev5, p7,  'presente', 11.5, 'aprovado',  NOW()),
          (ev5, p9,  'presente',  9.0, 'reprovado', NOW()),
          (ev5, p11, 'ausente',  NULL, NULL,         NOW()),
          (ev5, p13, 'presente', 17.0, 'aprovado',  NOW()),
          (ev5, p14, 'presente', 13.0, 'aprovado',  NOW()),
          (ev5, p15, 'presente', 12.5, 'aprovado',  NOW());

        -- Palestra Tendencias (evento) — 7 inscritos, alguns ainda so inscritos
        INSERT INTO "Enrollments" (event_id, participant_id, status, evaluation_score, evaluation_result, enrolled_at)
        VALUES
          (ev6, p2,  'presente', NULL, NULL, NOW()),
          (ev6, p4,  'presente', NULL, NULL, NOW()),
          (ev6, p6,  'presente', NULL, NULL, NOW()),
          (ev6, p8,  'inscrito', NULL, NULL, NOW()),
          (ev6, p10, 'presente', NULL, NULL, NOW()),
          (ev6, p12, 'inscrito', NULL, NULL, NOW()),
          (ev6, p14, 'presente', NULL, NULL, NOW());

      END $$;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DELETE FROM "Enrollments" WHERE event_id IN (
        SELECT id FROM "Events" WHERE title IN (
          'Bootcamp Python para Data Science',
          'Seminário de Inteligência Artificial',
          'Formação em Cibersegurança Avançada',
          'Workshop de UX/UI Design',
          'Desenvolvimento Web Full Stack',
          'Palestra: Tendências Tech 2026'
        )
      );
    `);
    await queryInterface.bulkDelete('Participants', {
      email: [
        'ana.moreira@gmail.com', 'joao.costa@outlook.pt', 'mbsantos@sapo.pt',
        'pedro.lima@empresa.pt', 'sofia.pinto@gmail.com', 'rui.mendes@hotmail.com',
        'catarina.oliveira@gmail.com', 'tiago.fonseca@sapo.pt', 'ines.lopes@outlook.pt',
        'bruno.carvalho@gmail.com', 'mariana.correia@gmail.com', 'francisco.vieira@empresa.pt',
        'leonor.cruz@sapo.pt', 'andre.silva@hotmail.com', 'beatriz.nunes@gmail.com',
      ]
    }, {});
    await queryInterface.bulkDelete('Events', {
      title: [
        'Bootcamp Python para Data Science',
        'Seminário de Inteligência Artificial',
        'Formação em Cibersegurança Avançada',
        'Workshop de UX/UI Design',
        'Desenvolvimento Web Full Stack',
        'Palestra: Tendências Tech 2026',
      ]
    }, {});
  },
};
