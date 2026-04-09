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
  const TIMEOUT_MS = 120000; // 2 minutos

  const work = async () => {
    const { id } = req.params;

    // 1. Verificar se o evento existe
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // 2. Buscar inscrições do evento
    const enrollments = await Enrollment.findAll({
      where: { event_id: id },
      include: [
        { model: Participant, as: "participant" },
        { model: Badge, as: "badge" },
      ],
    });

    if (enrollments.length === 0) {
      return res.status(200).json({ enviados: 0, falhados: 0, total: 0, message: "Sem certificados para enviar" });
    }

    const enrollmentIds = enrollments.map((e) => e.id);

    // 3. Buscar certificados ainda não enviados
    const certificates = await Certificate.findAll({
      where: {
        enrollment_id: enrollmentIds,
        email_sent: false,
      },
    });

    if (certificates.length === 0) {
      return res.status(200).json({ enviados: 0, falhados: 0, total: 0, message: "Sem certificados para enviar" });
    }

    // Mapas para acesso O(1) por enrollment_id
    const enrollmentMap = new Map(enrollments.map((e) => [e.id, e]));

    // 4. Enviar email para cada certificado
    let enviados = 0;
    let falhados = 0;
    let lastError = null;

    for (const certificate of certificates) {
      try {
        const enrollment = enrollmentMap.get(certificate.enrollment_id);
        const participant = enrollment?.participant;
        const badge = enrollment?.badge;

        if (!participant) {
          falhados++;
          continue;
        }

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
          lastError = result.detail || { message: result.error };
          await log.update({ status: "failed", error_message: result.error });
          falhados++;
        }
      } catch (err) {
        console.error(
          `Erro ao enviar email para certificado ${certificate.id}:`,
          err,
        );
        lastError = { message: err.message };
        falhados++;
      }
    }

    // 5. Devolver relatório
    const responseBody = {
      message: enviados > 0 ? "Envio concluído" : "Todos os envios falharam",
      enviados,
      falhados,
      total: certificates.length,
    };

    // Incluir detalhe do erro quando todos falharam — útil para diagnóstico
    if (enviados === 0 && lastError) {
      responseBody.erro = lastError;
    }

    return res.status(200).json(responseBody);
  };

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS),
  );

  try {
    await Promise.race([work(), timeout]);
  } catch (error) {
    if (error.message === "TIMEOUT") {
      console.error("Timeout no envio de emails (120s)");
      if (!res.headersSent) {
        return res.status(504).json({ error: "O envio de emails demorou demasiado. Tenta novamente." });
      }
    } else {
      console.error("Erro no envio em massa:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }
}

module.exports = { sendBulkEmails };
