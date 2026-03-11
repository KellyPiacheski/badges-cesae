// server/src/services/emailService.js
// Serviço de envio de emails com Nodemailer

const nodemailer = require("nodemailer");

// Configuração do transporter com as variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true para porta 465, false para outras
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Função base de envio — aceita destinatário, assunto e corpo HTML
async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"CESAE Digital" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
}

// Função para enviar certificado a um participante
async function sendCertificateEmail({
  to,
  participantName,
  eventTitle,
  validationCode,
  badgeUrl,
  pdfUrl,
}) {
  const subject = `O teu certificado — ${eventTitle}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #1e3a8a, #9333ea); height: 4px;"></div>
      
      <div style="padding: 32px;">
        <h1 style="color: #1e3a8a;">Parabéns, ${participantName}!</h1>
        <p style="color: #4b5563;">O teu certificado de participação em <strong>${eventTitle}</strong> está disponível.</p>

        ${badgeUrl ? `<img src="${badgeUrl}" alt="Badge" style="width: 120px; height: 120px; margin: 16px 0;" />` : ""}

        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Código de validação</p>
          <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #1e3a8a; margin: 4px 0;">${validationCode}</p>
        </div>

        ${pdfUrl ? `<a href="${pdfUrl}" style="display: inline-block; background: #9333ea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Descarregar Certificado PDF</a>` : ""}

        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          © 2026 CESAE Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

module.exports = { sendEmail, sendCertificateEmail };
