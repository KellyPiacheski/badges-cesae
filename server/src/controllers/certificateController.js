// server/src/controllers/certificateController.js
// Controller de certificados — validação pública por código

const Certificate = require("../models/Certificate");
const Enrollment = require("../models/Enrollment");
const Event = require("../models/Event");
const Participant = require("../models/Participant");
const Badge = require("../models/Badge");
const {
  generateCertificate,
} = require("../services/certificateGenerator");

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
      pdfUrl: certificate.pdf_url || null,
    });
  } catch (error) {
    console.error("Erro na validação do certificado:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}

async function createCertificate(req, res) {
  try {
    const { enrollment_id } = req.body;

    if (!enrollment_id) {
      return res.status(400).json({ error: "enrollment_id é obrigatório" });
    }

    // 1. Check enrollment exists & eligible
    const enrollment = await Enrollment.findByPk(enrollment_id, {
      include: [{ model: Event, as: "event" }],
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    const event = enrollment.event;
    const isEligible =
      event.type === "evento"
        ? enrollment.status === "presente"
        : enrollment.evaluation_result === "aprovado";

    if (!isEligible) {
      return res.status(400).json({
        error: `Inscrição não elegível. Status: ${enrollment.status || "pendente"}, Resultado: ${enrollment.evaluation_result || "não avaliado"}`,
      });
    }

    // 2. Check if certificate already exists
    const existingCert = await Certificate.findOne({
      where: { enrollment_id },
    });
    if (existingCert) {
      return res
        .status(400)
        .json({
          error: "Certificado já emitido",
          code: existingCert.validation_code,
        });
    }

    // 3. Gerar certificado (cria registo + gera PDF)
    const result = await generateCertificate(enrollment_id);

    if (!result.success) {
      return res.status(500).json({ error: result.error || "Erro ao gerar certificado" });
    }

    const certificate = await Certificate.findOne({ where: { enrollment_id } });

    return res.status(201).json({
      message: "Certificado emitido com sucesso",
      certificate,
      validationCode: result.validationCode,
    });
  } catch (error) {
    console.error("Erro ao criar certificado:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = {
  validateCertificate,
  createCertificate,
};
