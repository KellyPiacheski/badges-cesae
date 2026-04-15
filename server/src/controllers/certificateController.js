// server/src/controllers/certificateController.js
// Controller de certificados — validação pública por código

const { Certificate, Enrollment, Event, Participant, Badge, BadgeTemplate } = require("../models");
const { generateCertificate } = require("../services/certificateGenerator");
const { generateBadge } = require("../services/badgeGenerator");

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
      return res.status(400).json({
        error: "Certificado já emitido",
        code: existingCert.validation_code,
      });
    }

    // 3. Buscar participante e template do evento
    const participant = await Participant.findByPk(enrollment.participant_id);
    const templateId = event.template_id;
    const template = templateId
      ? await BadgeTemplate.findByPk(templateId)
      : await BadgeTemplate.findOne({ where: { is_default: true } });
    const templateConfig = template?.design_config || {};

    // 4. Criar registo do certificado antecipadamente para obter o validation_code
    const validationCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const certificate = await Certificate.create({
      enrollment_id,
      validation_code: validationCode,
      email_sent: false,
    });

    // 5. Gerar badge primeiro — para que o PDF já inclua a imagem
    try {
      const badgeResult = await generateBadge({
        participantName: participant.name,
        eventTitle: event.title,
        eventType: event.type,
        date: new Date(event.start_date).toLocaleDateString("pt-PT"),
        durationHours: event.duration_hours,
        validationCode,
        template: templateConfig,
      });

      const existingBadge = await Badge.findOne({ where: { enrollment_id } });
      if (existingBadge) {
        await existingBadge.update({
          image_url: badgeResult.url,
          template_id: template?.id || null,
          issued_at: new Date(),
        });
      } else {
        await Badge.create({
          enrollment_id,
          image_url: badgeResult.url,
          template_id: template?.id || null,
          issued_at: new Date(),
        });
      }
    } catch (badgeErr) {
      console.error("Erro ao gerar badge individual:", badgeErr.message);
    }

    // 6. Gerar PDF do certificado — agora o badge já existe na BD e aparece no PDF
    const result = await generateCertificate(enrollment_id);
    if (!result.success) {
      return res.status(500).json({ error: result.error || "Erro ao gerar certificado" });
    }

    return res.status(201).json({
      message: "Certificado e badge emitidos com sucesso",
      certificate,
      validationCode,
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
