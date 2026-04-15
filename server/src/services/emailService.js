// server/src/services/emailService.js
// Serviço de envio de emails com Resend

const { Resend } = require("resend");
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");

const resend = new Resend(process.env.RESEND_API_KEY);

// Descarrega um ficheiro de uma URL remota e devolve um Buffer
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} ao descarregar ${url}`));
      }
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

// Deriva o path local do badge a partir da image_url guardada na BD.
// Retorna o path local se o ficheiro existir localmente.
// Suporta URLs relativas (/uploads/...), URLs localhost e paths absolutos.
// Retorna null apenas para URLs remotas reais (R2/CDN).
function getBadgeLocalPath(imageUrl) {
  if (!imageUrl) return null;

  // URL remota real (R2/CDN) — não é localhost
  if (imageUrl.startsWith("http") && !imageUrl.includes("localhost") && !imageUrl.includes("127.0.0.1")) {
    return null;
  }

  // Extrair apenas o nome do ficheiro (funciona para paths relativos e URLs localhost)
  const filename = path.basename(imageUrl.split("?")[0]);
  const localPath = path.join(__dirname, "../../uploads/badges", filename);
  return fs.existsSync(localPath) ? localPath : null;
}

// Função base de envio — aceita destinatário, assunto, corpo HTML e anexos opcionais
async function sendEmail({ to, subject, html, attachments = [] }) {
  try {
    const FROM = process.env.EMAIL_FROM || "CESAE Digital <noreply@badges-cesae.lol>";

    // Converter attachments: suporta path local (Buffer via readFileSync) e content (Buffer direto)
    const resendAttachments = attachments
      .filter(a => a.filename && (a.path || a.content))
      .map(a => ({
        filename: a.filename,
        content: a.content || fs.readFileSync(a.path),
      }));

    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    if (error) {
      console.error("Erro ao enviar email (Resend):", error);
      return { success: false, error: error.message };
    }

    console.log("Email enviado:", data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error("Erro ao enviar email:", error.message);
    return { success: false, error: error.message };
  }
}

// Template HTML do certificado.
// badgeBase64: string base64 da imagem do badge (data URI), ou null
function buildCertificateTemplate({
  participantName,
  eventTitle,
  validationCode,
  badgeBase64,
  pdfUrl,
}) {
  const SERVER_URL = process.env.SERVER_URL || "";
  const CLIENT_URL = process.env.CLIENT_URL || SERVER_URL;
  const validateUrl = `${CLIENT_URL}/validate/${validationCode}`;

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
                    Parabéns, ${participantName}! 
                  </h2>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 28px 0;">
                    Concluíste com sucesso <strong>${eventTitle}</strong>. O teu certificado está pronto —
                    podes validá-lo online, descarregar o PDF ou partilhar no LinkedIn.
                  </p>

                  <!-- Badge PNG — base64 embutido diretamente no HTML -->
                  ${badgeBase64 ? `
                  <div style="text-align: center; margin: 0 0 28px 0;">
                    <img
                      src="${badgeBase64}"
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
                       Ver certificado online
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
                    <a href="${pdfUrl.startsWith('http') ? pdfUrl : `${SERVER_URL}${pdfUrl}`}"
                       style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                       Descarregar Certificado PDF
                    </a>
                  </div>` : ""}

                  <!-- Botão LinkedIn -->
                  <div style="text-align: center; margin: 0 0 8px 0;">
                    <a href="https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(eventTitle)}&organizationName=CESAE%20Digital&certUrl=${encodeURIComponent(validateUrl)}&certId=${validationCode}"
                       style="display: inline-block; background: #0077b5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                       Adicionar ao Perfil LinkedIn
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
  // Garantir que o PDF URL é absoluto no email
  const SERVER_URL = process.env.SERVER_URL || "";
  const resolvedPdfUrl = pdfUrl
    ? (pdfUrl.startsWith("http") ? pdfUrl : `${SERVER_URL}${pdfUrl}`)
    : null;

  // Tentar obter o badge como Buffer (local ou remoto)
  let badgeBuffer = null;
  let badgeFilename = null;
  const safeName = eventTitle.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

  if (hasBadge) {
    // Ficheiro local
    badgeBuffer = fs.readFileSync(badgeLocalPath);
    badgeFilename = `badge-${safeName}.png`;
  } else if (badgeUrl && badgeUrl.startsWith("http")) {
    // Badge remoto (R2) — descarregar para Buffer
    try {
      badgeBuffer = await downloadBuffer(badgeUrl);
      badgeFilename = `badge-${safeName}.png`;
    } catch (err) {
      console.error("Não foi possível descarregar o badge remoto:", err.message);
    }
  }

  // Converter badge para base64 — embutido diretamente no HTML (não bloqueado por email clients)
  const badgeBase64 = badgeBuffer
    ? `data:image/png;base64,${badgeBuffer.toString("base64")}`
    : null;

  const subject = `O teu certificado — ${eventTitle} | CESAE Digital`;
  const html = buildCertificateTemplate({
    participantName,
    eventTitle,
    validationCode,
    badgeBase64,
    pdfUrl: resolvedPdfUrl,
  });

  // Enviar badge também como anexo para o participante guardar
  const attachments = [];
  if (badgeBuffer && badgeFilename) {
    attachments.push({
      filename: badgeFilename,
      content: badgeBuffer,
    });
  }

  return sendEmail({ to, subject, html, attachments });
}

module.exports = { sendEmail, sendCertificateEmail, buildCertificateTemplate };
