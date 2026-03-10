// server/src/controllers/enrollmentController.js
// Controller de inscrições — participantes, presenças, avaliações, importação

const { Enrollment, Participant, Event } = require('../models');
const { Op } = require('sequelize');

// GET /api/events/:id/participants — Listar participantes de um evento
async function listParticipants(req, res) {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const enrollments = await Enrollment.findAll({
      where: { event_id: id },
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'name', 'email', 'phone', 'organization']
        }
      ],
      order: [['enrolled_at', 'ASC']]
    });

    return res.status(200).json(enrollments);
  } catch (error) {
    console.error('Erro ao listar participantes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST /api/events/:id/participants — Adicionar participante manualmente
async function addParticipant(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, organization } = req.body;

    // Validação
    if (!name || !email) {
      return res.status(400).json({
        error: 'Campos obrigatórios: name, email'
      });
    }

    // Verificar se o evento existe
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    // Encontrar ou criar o participante pelo email
    const [participant] = await Participant.findOrCreate({
      where: { email },
      defaults: { name, phone, organization }
    });

    // Verificar se já está inscrito neste evento
    const existingEnrollment = await Enrollment.findOne({
      where: { event_id: id, participant_id: participant.id }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        error: 'Participante já está inscrito neste evento'
      });
    }

    // Criar inscrição
    const enrollment = await Enrollment.create({
      event_id: id,
      participant_id: participant.id,
      status: 'inscrito'
    });

    return res.status(201).json({
      enrollment,
      participant
    });
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// POST /api/events/:id/participants/import — Importar participantes via CSV
async function importParticipants(req, res) {
  try {
    const { id } = req.params;
    const { participants } = req.body;

    // Espera um array de objetos: [{ name, email, phone?, organization? }]
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        error: 'Envie um array de participantes com name e email'
      });
    }

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    let added = 0;
    let skipped = 0;
    const errors = [];

    for (const p of participants) {
      try {
        if (!p.name || !p.email) {
          errors.push(`Linha ignorada: name e email obrigatórios (${p.email || 'sem email'})`);
          skipped++;
          continue;
        }

        // Encontrar ou criar participante
        const [participant] = await Participant.findOrCreate({
          where: { email: p.email },
          defaults: { name: p.name, phone: p.phone, organization: p.organization }
        });

        // Verificar se já está inscrito
        const exists = await Enrollment.findOne({
          where: { event_id: id, participant_id: participant.id }
        });

        if (exists) {
          skipped++;
          continue;
        }

        // Criar inscrição
        await Enrollment.create({
          event_id: id,
          participant_id: participant.id,
          status: 'inscrito'
        });

        added++;
      } catch (err) {
        errors.push(`Erro ao processar ${p.email}: ${err.message}`);
        skipped++;
      }
    }

    return res.status(200).json({
      message: `Importação concluída: ${added} adicionado(s), ${skipped} ignorado(s)`,
      added,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erro ao importar participantes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// PATCH /api/enrollments/:id/attendance — Marcar presença
async function markAttendance(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['presente', 'ausente'].includes(status)) {
      return res.status(400).json({
        error: 'Status deve ser "presente" ou "ausente"'
      });
    }

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    await enrollment.update({ status });

    return res.status(200).json(enrollment);
  } catch (error) {
    console.error('Erro ao marcar presença:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// PATCH /api/enrollments/:id/evaluation — Registar avaliação (apenas cursos)
async function setEvaluation(req, res) {
  try {
    const { id } = req.params;
    const { evaluation_score, evaluation_result } = req.body;

    if (evaluation_result && !['aprovado', 'reprovado'].includes(evaluation_result)) {
      return res.status(400).json({
        error: 'Resultado deve ser "aprovado" ou "reprovado"'
      });
    }

    const enrollment = await Enrollment.findByPk(id, {
      include: [{ model: Event, as: 'event' }]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    // Verificar se é um curso
    if (enrollment.event.type !== 'curso') {
      return res.status(400).json({
        error: 'Avaliações só são permitidas para cursos'
      });
    }

    await enrollment.update({
      evaluation_score: evaluation_score !== undefined ? evaluation_score : enrollment.evaluation_score,
      evaluation_result: evaluation_result || enrollment.evaluation_result,
      status: 'presente' // Ao avaliar, marca como presente automaticamente
    });

    return res.status(200).json(enrollment);
  } catch (error) {
    console.error('Erro ao registar avaliação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// DELETE /api/enrollments/:id — Remover participante de um evento
async function removeParticipant(req, res) {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    await enrollment.destroy();

    return res.status(200).json({ message: 'Participante removido do evento' });
  } catch (error) {
    console.error('Erro ao remover participante:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = {
  listParticipants,
  addParticipant,
  importParticipants,
  markAttendance,
  setEvaluation,
  removeParticipant
};