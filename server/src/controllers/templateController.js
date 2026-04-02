// server/src/controllers/templateController.js
// CRUD de templates de badges

const { BadgeTemplate, User } = require("../models");

// GET /api/templates
async function listTemplates(req, res) {
  try {
    const templates = await BadgeTemplate.findAll({
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json(templates);
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { listTemplates };
