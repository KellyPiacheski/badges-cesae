// server/src/controllers/certificateController.js
// Controller de certificados — validação pública por código

const Certificate = require("../models/Certificate");
const Enrollment = require("../models/Enrollment");
const Participant = require("../models/Participant");
const Event = require("../models/Event");
const Badge = require("../models/Badge");

async function validateCertificate(req, res) {
  try {
    const { code } = req.params;

    // 1. Procurar o certificado pelo código de validação
    const certificate = await Certificate.findOne({
      where: { validation_code: code },
    });

    // 2. Se não existir, devolver erro 404
    if (!certificate) {
      return res.status(404).json({
        error: "Código de validação inválido",
      });
    }

    // 3. Ir buscar a inscrição associada
    const enrollment = await Enrollment.findOne({
      where: { id: certificate.enrollment_id },
    });

    // 4. Ir buscar o participante
    const participant = await Participant.findOne({
      where: { id: enrollment.participant_id },
    });

    // 5. Ir buscar o evento
    const event = await Event.findOne({
      where: { id: enrollment.event_id },
    });

    // 6. Ir buscar o badge (pode não existir ainda)
    const badge = await Badge.findOne({
      where: { enrollment_id: enrollment.id },
    });

    // 7. Devolver os dados ao frontend
    return res.status(200).json({
      participantName: participant.name,
      eventTitle: event.title,
      issuedAt: certificate.issued_at,
      badgeUrl: badge ? badge.image_url : null,
    });
  } catch (error) {
    console.error("Erro na validação do certificado:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}

module.exports = { validateCertificate };
