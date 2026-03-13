// server/src/controllers/emailController.js
// Controller de emails — envio em massa de certificados

const {
  Certificate,
  Enrollment,
  Participant,
  Event,
  Badge,
  EmailLog,
} = require("../models");
const { sendCertificateEmail } = require("../services/emailService");

// POST /api/events/:id/send-emails — Enviar emails em massa
async function sendBulkEmails(req, res) {
  try {
    const { id } = req.params;

    // 1. Verificar se o evento existe
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // 2. Buscar todos os certificados do evento que ainda não foram enviados
    const enrollments = await Enrollment.findAll({
      where: { event_id: id },
    });

    if (enrollments.length === 0) {
      return res
        .status(400)
        .json({ error: "Não existem participantes neste evento" });
    }

    const enrollmentIds = enrollments.map((e) => e.id);

    const certificates = await Certificate.findAll({
      where: {
        enrollment_id: enrollmentIds,
        email_sent: false,
      },
    });

    if (certificates.length === 0) {
      return res
        .status(400)
        .json({ error: "Não existem certificados por enviar neste evento" });
    }

    // 3. Enviar email para cada certificado
    let enviados = 0;
    let falhados = 0;

    for (const certificate of certificates) {
      try {
        const enrollment = enrollments.find(
          (e) => e.id === certificate.enrollment_id,
        );
        const participant = await Participant.findByPk(
          enrollment.participant_id,
        );
        const badge = await Badge.findOne({
          where: { enrollment_id: enrollment.id },
        });

        // Criar log com status pending
        const log = await EmailLog.create({
          certificate_id: certificate.id,
          recipient_email: participant.email,
          status: "pending",
        });

        const result = await sendCertificateEmail({
          to: participant.email,
          participantName: participant.name,
          eventTitle: event.title,
          validationCode: certificate.validation_code,
          badgeUrl: badge ? badge.image_url : null,
          pdfUrl: certificate.pdf_url,
        });

        if (result.success) {
          await log.update({ status: "sent", sent_at: new Date() });
          await certificate.update({ email_sent: true, sent_at: new Date() });
          enviados++;
        } else {
          await log.update({ status: "failed", error_message: result.error });
          falhados++;
        }
      } catch (err) {
        console.error(
          `Erro ao enviar email para certificado ${certificate.id}:`,
          err,
        );
        falhados++;
      }
    }

    // 4. Devolver relatório
    return res.status(200).json({
      message: `Envio concluído`,
      enviados,
      falhados,
      total: certificates.length,
    });
  } catch (error) {
    console.error("Erro no envio em massa:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { sendBulkEmails };
