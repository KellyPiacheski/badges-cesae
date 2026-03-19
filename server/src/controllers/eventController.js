// server/src/controllers/eventController.js
// Controller de eventos — CRUD completo

const {
  Event,
  Enrollment,
  Participant,
  User,
  Badge,
  Certificate,
  BadgeTemplate,
} = require("../models");
const { Op } = require("sequelize");

const { generateBadgesForEvent } = require("../services/badgeGenerator");
const {
  generateCertificatesForEvent,
} = require("../services/certificateGenerator");

// POST /api/events — Criar evento/curso
async function createEvent(req, res) {
  try {
    const {
      title,
      description,
      type,
      start_date,
      end_date,
      location,
      duration_hours,
      category,
    } = req.body;

    // Validação
    if (!title || !type || !start_date) {
      return res.status(400).json({
        error: "Campos obrigatórios: title, type, start_date",
      });
    }

    if (!["evento", "curso"].includes(type)) {
      return res.status(400).json({
        error: 'Tipo deve ser "evento" ou "curso"',
      });
    }

    const event = await Event.create({
      title,
      description,
      type,
      start_date,
      end_date,
      location,
      duration_hours,
      category,
      created_by: req.user.id,
    });

    return res.status(201).json(event);
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// GET /api/events — Listar todos os eventos (com filtros opcionais)
async function listEvents(req, res) {
  try {
    const { type, category, start_date, end_date } = req.query;

    // Construir filtros dinamicamente
    const where = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { [Op.iLike]: `%${category}%` };
    }

    if (start_date && end_date) {
      where.start_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      where.start_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.start_date = { [Op.lte]: end_date };
    }

    const events = await Event.findAll({
      where,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["start_date", "DESC"]],
    });

    // Adicionar contagem de participantes a cada evento
    const eventsWithCount = await Promise.all(
      events.map(async (event) => {
        const participantCount = await Enrollment.count({
          where: { event_id: event.id },
        });
        return {
          ...event.toJSON(),
          participant_count: participantCount,
        };
      }),
    );

    return res.status(200).json(eventsWithCount);
  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// GET /api/events/:id — Detalhe de um evento
async function getEvent(req, res) {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
        {
          model: Enrollment,
          as: "enrollments",
          include: [
            {
              model: Participant,
              as: "participant",
              attributes: ["id", "name", "email", "phone", "organization"],
            },
          ],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// PUT /api/events/:id — Editar evento
async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      start_date,
      end_date,
      location,
      duration_hours,
      category,
    } = req.body;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    if (type && !["evento", "curso"].includes(type)) {
      return res.status(400).json({
        error: 'Tipo deve ser "evento" ou "curso"',
      });
    }

    await event.update({
      title: title || event.title,
      description: description !== undefined ? description : event.description,
      type: type || event.type,
      start_date: start_date || event.start_date,
      end_date: end_date !== undefined ? end_date : event.end_date,
      location: location !== undefined ? location : event.location,
      duration_hours:
        duration_hours !== undefined ? duration_hours : event.duration_hours,
      category: category !== undefined ? category : event.category,
    });

    return res.status(200).json(event);
  } catch (error) {
    console.error("Erro ao editar evento:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// DELETE /api/events/:id — Eliminar evento
async function deleteEvent(req, res) {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Verificar se tem enrollments associados
    const enrollmentCount = await Enrollment.count({ where: { event_id: id } });

    if (enrollmentCount > 0) {
      return res.status(400).json({
        error: `Não é possível eliminar: evento tem ${enrollmentCount} participante(s) inscrito(s). Remova os participantes primeiro.`,
      });
    }

    await event.destroy();

    return res.status(200).json({ message: "Evento eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar evento:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// POST /api/events/:id/emit — Admin emite badges/certificados para elegíveis
async function emitEventBadges(req, res) {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: Enrollment,
          as: "enrollments",
          include: [Participant],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    const eligible = event.enrollments.filter(
      (e) => e.status === "presente" || e.evaluation_result === "aprovado",
    );
    if (eligible.length === 0) {
      return res.status(400).json({ error: "Sem elegíveis" });
    }

    const template = await BadgeTemplate.findOne({
      where: { is_default: true },
    });

    // Certs
    const certResults = await generateCertificatesForEvent(event);
    let certOK = 0;
    for (const r of certResults) {
      if (r.success) {
        await Certificate.upsert({
          enrollment_id: r.enrollmentId,
          pdf_url: r.certificate.pdf_url,
          validation_code: r.certificate.validation_code,
          issued_at: new Date(),
        });
        certOK++;
      }
    }

    // Badges
    const badgeResults = await generateBadgesForEvent(event, template);
    let badgeOK = 0;
    for (const r of badgeResults) {
      if (r.success) {
        await Badge.upsert({
          enrollment_id: r.enrollmentId,
          image_url: r.badge.url,
          template_id: template?.id,
          issued_at: new Date(),
        });
        badgeOK++;
      }
    }

    res.json({
      message: `Emitido: ${badgeOK} badges, ${certOK} certificados`,
      total: eligible.length,
      badges: badgeOK,
      certificates: certOK,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  emitEventBadges,
};
