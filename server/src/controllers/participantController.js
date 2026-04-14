// server/src/controllers/participantController.js
// CRUD global de participantes (formandos) — independente de eventos

const { Participant } = require("../models");
const { Op } = require("sequelize");

// GET /api/participants/search?q=... — busca por nome ou email (máx. 10 resultados)
async function searchParticipants(req, res) {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.status(200).json([]);

    const participants = await Participant.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { email: { [Op.iLike]: `%${q}%` } },
        ],
      },
      order: [["name", "ASC"]],
      limit: 10,
    });

    return res.status(200).json(participants);
  } catch (error) {
    console.error("Erro ao pesquisar participantes:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// GET /api/participants
async function listParticipants(req, res) {
  try {
    const participants = await Participant.findAll({
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json(participants);
  } catch (error) {
    console.error("Erro ao listar participantes:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// POST /api/participants
async function createParticipant(req, res) {
  try {
    const { name, email, phone, organization } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    }

    const existing = await Participant.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email já em uso" });
    }

    const participant = await Participant.create({
      name,
      email,
      phone: phone || null,
      organization: organization || null,
    });

    return res.status(201).json(participant);
  } catch (error) {
    console.error("Erro ao criar participante:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// PUT /api/participants/:id
async function updateParticipant(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, organization } = req.body;

    const participant = await Participant.findByPk(id);
    if (!participant) {
      return res.status(404).json({ error: "Participante não encontrado" });
    }

    if (email && email !== participant.email) {
      const existing = await Participant.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: "Email já em uso" });
    }

    await participant.update({
      name: name || participant.name,
      email: email || participant.email,
      phone: phone !== undefined ? phone || null : participant.phone,
      organization: organization !== undefined ? organization || null : participant.organization,
    });

    return res.status(200).json(participant);
  } catch (error) {
    console.error("Erro ao atualizar participante:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// DELETE /api/participants/:id
async function deleteParticipant(req, res) {
  try {
    const { id } = req.params;

    const participant = await Participant.findByPk(id);
    if (!participant) {
      return res.status(404).json({ error: "Participante não encontrado" });
    }

    await participant.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover participante:", error);
    // FK constraint — participante tem inscrições associadas
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        error: "Não é possível remover este formando — tem inscrições em eventos. Remove primeiro as inscrições.",
      });
    }
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// POST /api/participants/import — importação em massa a partir de JSON parsed no frontend
async function importParticipants(req, res) {
  try {
    const { participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: "Lista de participantes inválida ou vazia" });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const p of participants) {
      if (!p.name || !p.email) {
        skipped++;
        continue;
      }
      try {
        const existing = await Participant.findOne({ where: { email: p.email } });
        if (existing) {
          skipped++;
          continue;
        }
        await Participant.create({
          name: p.name,
          email: p.email,
          phone: p.phone || null,
          organization: p.organization || null,
        });
        created++;
      } catch (err) {
        errors.push(p.email);
        skipped++;
      }
    }

    return res.status(200).json({
      created,
      skipped,
      total: participants.length,
      message: `${created} formando(s) importado(s), ${skipped} ignorado(s).`,
    });
  } catch (error) {
    console.error("Erro na importação de participantes:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = {
  searchParticipants,
  listParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  importParticipants,
};
