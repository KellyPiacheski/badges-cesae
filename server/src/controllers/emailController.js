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
    const falhadosList = [];

    for (const certificate of certificates) {
      try {
        const enrollment = enrollmentMap.get(certificate.enrollment_id);
        const participant = enrollment?.participant;
        const badge = enrollment?.badge;

        if (!participant) {
          falhados++;
          falhadosList.push({ nome: "Desconhecido", email: "—", erro: "Participante não encontrado" });
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
          await log.update({ status: "failed", error_message: result.error });
          falhados++;
          falhadosList.push({ nome: participant.name, email: participant.email, erro: result.error || "Erro desconhecido" });
        }
      } catch (err) {
        console.error(`Erro ao enviar email para certificado ${certificate.id}:`, err);
        const enrollment = enrollmentMap.get(certificate.enrollment_id);
        const participant = enrollment?.participant;
        falhados++;
        falhadosList.push({ nome: participant?.name || "Desconhecido", email: participant?.email || "—", erro: err.message });
      }
    }

    // 5. Devolver relatório
    const responseBody = {
      message: enviados > 0 ? "Envio concluído" : "Todos os envios falharam",
      enviados,
      falhados,
      total: certificates.length,
      ...(falhadosList.length > 0 && { falhados_detalhe: falhadosList }),
    };

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

// POST /api/enrollments/:enrollmentId/resend-email — Reenviar email para um participante
async function resendEmail(req, res) {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findByPk(enrollmentId, {
      include: [
        { model: Participant, as: "participant" },
        { model: Badge, as: "badge" },
      ],
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Inscrição não encontrada" });
    }

    const certificate = await Certificate.findOne({
      where: { enrollment_id: enrollmentId },
    });

    if (!certificate) {
      return res.status(404).json({ error: "Certificado não emitido ainda" });
    }

    const event = await Event.findByPk(enrollment.event_id);

    // Resetar email_sent para permitir reenvio
    await certificate.update({ email_sent: false, sent_at: null });

    const log = await EmailLog.create({
      certificate_id: certificate.id,
      recipient_email: enrollment.participant.email,
      status: "pending",
    });

    const result = await sendCertificateEmail({
      to: enrollment.participant.email,
      participantName: enrollment.participant.name,
      eventTitle: event.title,
      validationCode: certificate.validation_code,
      badgeUrl: enrollment.badge ? enrollment.badge.image_url : null,
      pdfUrl: certificate.pdf_url,
    });

    if (result.success) {
      await log.update({ status: "sent", sent_at: new Date() });
      await certificate.update({ email_sent: true, sent_at: new Date() });
      return res.status(200).json({ message: "Email reenviado com sucesso" });
    } else {
      await log.update({ status: "failed", error_message: result.error });
      return res.status(500).json({ error: result.error || "Erro ao enviar email" });
    }
  } catch (error) {
    console.error("Erro ao reenviar email:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { sendBulkEmails, resendEmail };
