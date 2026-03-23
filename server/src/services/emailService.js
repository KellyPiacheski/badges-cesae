// server/src/services/emailService.js
// Serviço de envio de emails com Nodemailer

const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// Configuração do transporter com as variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// Deriva o path local do badge a partir da image_url guardada na BD.
// Funciona quer a URL seja relativa (/uploads/badges/...) ou absoluta (https://host/uploads/badges/...).
function getBadgeLocalPath(imageUrl) {
  if (!imageUrl) return null;
  const filename = path.basename(imageUrl);
  const localPath = path.join(__dirname, "../../../uploads/badges", filename);
  return fs.existsSync(localPath) ? localPath : null;
}

// Função base de envio — aceita destinatário, assunto, corpo HTML e anexos opcionais
async function sendEmail({ to, subject, html, attachments = [] }) {
  try {
    const info = await transporter.sendMail({
      from: `"CESAE Digital" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log("Email enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar email:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      message: error.message,
    });
    return {
      success: false,
      error: error.message,
      detail: {
        code: error.code || null,
        response: error.response || null,
        responseCode: error.responseCode || null,
      },
    };
  }
}

// Template HTML do certificado.
// Quando hasBadge é true, o corpo referencia a imagem via cid:badge-image
// (o anexo inline garante que é mostrada mesmo com imagens externas bloqueadas).
function buildCertificateTemplate({
  participantName,
  eventTitle,
  validationCode,
  hasBadge,
  pdfUrl,
}) {
  const SERVER_URL = process.env.SERVER_URL || "";
  const validateUrl = `${SERVER_URL}/validate/${validationCode}`;

  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Certificado CESAE Digital</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

              <!-- Barra de topo -->
              <tr>
                <td style="background: linear-gradient(to right, #1e3a8a, #9333ea, #ec4899); height: 6px;"></td>
              </tr>

              <!-- Logo CESAE -->
              <tr>
                <td style="padding: 32px 40px 0 40px;">
                  <h1 style="color: #1e3a8a; font-size: 24px; margin: 0 0 4px 0;">CESAE Digital</h1>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Sistema de Certificações</p>
                </td>
              </tr>

              <!-- Corpo -->
              <tr>
                <td style="padding: 32px 40px;">

                  <!-- Congratulações -->
                  <h2 style="color: #111827; font-size: 20px; margin: 0 0 12px 0;">
                    Parabéns, ${participantName}! 🎉
                  </h2>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                    Concluíste com sucesso <strong>${eventTitle}</strong>. O teu certificado está pronto —
                    podes validá-lo online, descarregar o PDF ou partilhar no LinkedIn.
                  </p>

                  <!-- Badge PNG (inline via CID — visível mesmo sem carregar imagens externas) -->
                  ${hasBadge ? `
                  <div style="text-align: center; margin: 0 0 28px 0;">
                    <img
                      src="cid:badge-image"
                      alt="Badge ${eventTitle}"
                      width="200"
                      height="200"
                      style="width: 200px; height: 200px; border-radius: 16px; box-shadow: 0 6px 16px rgba(0,0,0,0.15); display: block; margin: 0 auto;"
                    />
                    <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                      O badge também está em anexo para guardares.
                    </p>
                  </div>` : ""}

                  <!-- Botão — Validar certificado online -->
                  <div style="text-align: center; margin: 0 0 16px 0;">
                    <a href="${validateUrl}"
                       style="display: inline-block; background: linear-gradient(to right, #1e3a8a, #9333ea); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      ✅ Ver certificado online
                    </a>
                  </div>

                  <!-- Código de validação -->
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; margin: 0 0 20px 0; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 1px;">Código de Validação</p>
                    <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0; letter-spacing: 2px;">${validationCode}</p>
                  </div>

                  <!-- Botão PDF -->
                  ${pdfUrl ? `
                  <div style="text-align: center; margin: 0 0 16px 0;">
                    <a href="${pdfUrl}"
                       style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                      📄 Descarregar Certificado PDF
                    </a>
                  </div>` : ""}

                  <!-- Botão LinkedIn -->
                  <div style="text-align: center; margin: 0 0 8px 0;">
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(validateUrl)}"
                       style="display: inline-block; background: #0077b5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                      🔗 Partilhar no LinkedIn
                    </a>
                  </div>
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 10px 0 0 0;">
                    Partilha a tua conquista no LinkedIn — usa o botão acima ou cola o link do certificado no teu perfil.
                  </p>

                </td>
              </tr>

              <!-- Rodapé -->
              <tr>
                <td style="background: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
                    © 2026 CESAE Digital. Todos os direitos reservados.<br/>
                    Este email foi enviado automaticamente — por favor não respondas.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Função para enviar certificado a um participante.
// badgeUrl é a image_url guardada na BD (relativa ou absoluta).
// Se o ficheiro PNG existir localmente, é incluído inline (cid) e como anexo.
async function sendCertificateEmail({
  to,
  participantName,
  eventTitle,
  validationCode,
  badgeUrl,
  pdfUrl,
}) {
  const badgeLocalPath = getBadgeLocalPath(badgeUrl);
  const hasBadge = !!badgeLocalPath;

  const subject = `O teu certificado — ${eventTitle} | CESAE Digital`;
  const html = buildCertificateTemplate({
    participantName,
    eventTitle,
    validationCode,
    hasBadge,
    pdfUrl,
  });

  const attachments = [];
  if (hasBadge) {
    const safeName = eventTitle.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const badgeFilename = `badge-${safeName}.png`;
    // Inline: referenciado no HTML como cid:badge-image
    attachments.push({
      filename: badgeFilename,
      path: badgeLocalPath,
      cid: "badge-image",
    });
    // Anexo separado para o participante guardar
    attachments.push({
      filename: badgeFilename,
      path: badgeLocalPath,
    });
  }

  return sendEmail({ to, subject, html, attachments });
}

module.exports = { sendEmail, sendCertificateEmail, buildCertificateTemplate };
