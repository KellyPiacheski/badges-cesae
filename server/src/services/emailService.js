// server/src/services/emailService.js
// Serviço de envio de emails com Nodemailer

const nodemailer = require("nodemailer");

// Configuração do transporter com as variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
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

// Template HTML do certificado
function buildCertificateTemplate({
  participantName,
  eventTitle,
  validationCode,
  badgeUrl,
  pdfUrl,
}) {
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

              <!-- Cabeçalho -->
              <tr>
                <td style="padding: 32px 40px 0 40px;">
                  <h1 style="color: #1e3a8a; font-size: 24px; margin: 0 0 8px 0;">CESAE Digital</h1>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Sistema de Certificações</p>
                </td>
              </tr>

              <!-- Corpo -->
              <tr>
                <td style="padding: 32px 40px;">
                  <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px 0;">
                    Parabéns, ${participantName}! 🎉
                  </h2>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    O teu certificado de participação em <strong>${eventTitle}</strong> está disponível.
                    Podes descarregar o PDF ou partilhar no LinkedIn com o teu código de validação.
                  </p>

                  <!-- Badge -->
                  ${
                    badgeUrl
                      ? `
                  <div style="text-align: center; margin: 24px 0;">
                    <img src="${badgeUrl}" alt="Badge ${eventTitle}" style="width: 140px; height: 140px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                  </div>`
                      : ""
                  }

                  <!-- Código de validação -->
                  <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Código de Validação</p>
                    <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0; letter-spacing: 2px;">${validationCode}</p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">Usa este código em cesae.pt/validate para verificar a autenticidade</p>
                  </div>

                  <!-- Botão PDF -->
                  ${
                    pdfUrl
                      ? `
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${pdfUrl}" style="display: inline-block; background: linear-gradient(to right, #1e3a8a, #9333ea); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      📄 Descarregar Certificado PDF
                    </a>
                  </div>`
                      : ""
                  }

                  <!-- Botão LinkedIn -->
                  <div style="text-align: center; margin: 16px 0;">
                    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://cesae.pt/validate/${validationCode}"
                       style="display: inline-block; background: #0077b5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                      🔗 Partilhar no LinkedIn
                    </a>
                  </div>

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

// Função para enviar certificado a um participante
async function sendCertificateEmail({
  to,
  participantName,
  eventTitle,
  validationCode,
  badgeUrl,
  pdfUrl,
}) {
  const subject = `O teu certificado — ${eventTitle} | CESAE Digital`;
  const html = buildCertificateTemplate({
    participantName,
    eventTitle,
    validationCode,
    badgeUrl,
    pdfUrl,
  });
  return sendEmail({ to, subject, html });
}

module.exports = { sendEmail, sendCertificateEmail, buildCertificateTemplate };
