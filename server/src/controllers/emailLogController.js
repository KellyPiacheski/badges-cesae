// server/src/controllers/emailLogController.js
// Controller de logs de email

const {
  EmailLog,
  Certificate,
  Enrollment,
  Participant,
  Event,
  Badge,
} = require("../models");
const { sendCertificateEmail } = require("../services/emailService");

// GET /api/events/:id/email-logs — Listar logs de envio de um evento
async function getEmailLogs(req, res) {
  try {
    const { id } = req.params;

    // Verificar se o evento existe
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Buscar todos os logs do evento
    const enrollments = await Enrollment.findAll({ where: { event_id: id } });
    const enrollmentIds = enrollments.map((e) => e.id);

    const certificates = await Certificate.findAll({
      where: { enrollment_id: enrollmentIds },
    });
    const certificateIds = certificates.map((c) => c.id);

    const logs = await EmailLog.findAll({
      where: { certificate_id: certificateIds },
      order: [["sent_at", "DESC"]],
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error("Erro ao buscar logs:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// PATCH /api/email-logs/:id/resend — Reenviar email falhado
async function resendEmail(req, res) {
  try {
    const { id } = req.params;

    // Buscar o log
    const log = await EmailLog.findByPk(id);
    if (!log) {
      return res.status(404).json({ error: "Log não encontrado" });
    }

    if (log.status === "sent") {
      return res
        .status(400)
        .json({ error: "Este email já foi enviado com sucesso" });
    }

    // Buscar certificado e dados relacionados
    const certificate = await Certificate.findByPk(log.certificate_id);
    const enrollment = await Enrollment.findByPk(certificate.enrollment_id);
    const participant = await Participant.findByPk(enrollment.participant_id);
    const event = await Event.findByPk(enrollment.event_id);
    const badge = await Badge.findOne({
      where: { enrollment_id: enrollment.id },
    });

    // Atualizar log para pending
    await log.update({ status: "pending", error_message: null });

    // Tentar reenviar
    const result = await sendCertificateEmail({
      to: participant.email,
      participantName: participant.name,
      eventTitle: event.title,
      validationCode: certificate.validation_code,
      badgeUrl: badge ? badge.image_url : null,
      pdfUrl: certificate.pdf_url,
    });

    if (result.success) {
      await log.update({
        status: "sent",
        sent_at: new Date(),
        error_message: null,
      });
      await certificate.update({ email_sent: true, sent_at: new Date() });
      return res.status(200).json({ message: "Email reenviado com sucesso" });
    } else {
      await log.update({ status: "failed", error_message: result.error });
      return res.status(500).json({ error: "Falha no reenvio do email" });
    }
  } catch (error) {
    console.error("Erro ao reenviar email:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { getEmailLogs, resendEmail };
