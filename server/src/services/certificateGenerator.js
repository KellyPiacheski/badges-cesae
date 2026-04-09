const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const {
  sequelize,
  Enrollment,
  Event,
  Participant,
  Badge,
  Certificate,
} = require("../../models");

// Diretório de certificados
const CERTIFICATES_DIR = path.join(__dirname, "../../../uploads/certificates");
if (!fs.existsSync(CERTIFICATES_DIR)) {
  fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
}

async function generateCertificate(enrollmentId) {
  let browser;
  try {
    // 1. Fetch dados individuais (fix include bug)
    const enrollment = await Enrollment.findByPk(enrollmentId);
    if (!enrollment) {
      return { success: false, error: "Enrollment não encontrado" };
    }

    const event = await Event.findByPk(enrollment.event_id);
    const participant = await Participant.findByPk(enrollment.participant_id);
    const badge = await Badge.findOne({
      where: { enrollment_id: enrollmentId },
    });

    if (!event || !participant) {
      return { success: false, error: "Event ou Participant não encontrado" };
    }

    // 2. Badge base64
    let badgeBase64 = "";
    if (badge && badge.image_url) {
      const badgePath = path.join(
        __dirname,
        "../../../uploads/badges",
        path.basename(badge.image_url),
      );
      if (fs.existsSync(badgePath)) {
        const badgeBuffer = fs.readFileSync(badgePath);
        badgeBase64 = `data:image/png;base64,${badgeBuffer.toString("base64")}`;
      }
    }

    // 3. Certificate
    let certificate = await Certificate.findOne({
      where: { enrollment_id: enrollmentId },
    });
    if (!certificate) {
      certificate = await Certificate.create({
        enrollment_id: enrollmentId,
        validation_code: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        email_sent: false,
      });
    }
    const validationCode = certificate.validation_code;

    // 4. HTML Template
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4 landscape; margin: 1.5cm; }
    body { font-family: Arial, sans-serif; color: #1c2833; padding: 30px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 42px; font-weight: bold; color: #1B4F72; }
    .title { font-size: 34px; color: #0066CC; margin: 15px 0; }
    .content { display: flex; gap: 40px; margin: 50px 0; }
    .info { flex: 1; }
    .name { font-size: 38px; font-weight: bold; color: #1B4F72; margin: 20px 0; text-align: center; }
    .event-title { font-size: 28px; color: #2E86C1; margin-bottom: 25px; text-align: center; }
    .details { background: #F8F9FA; padding: 25px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
    .details table { width: 100%; border-collapse: collapse; }
    .details td { padding: 12px; border-bottom: 1px solid #dee2e6; }
    .badge-section { flex: 0 0 300px; text-align: center; }
    .badge-img { width: 280px; height: 280px; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    .validation { background: linear-gradient(135deg, #1B4F72, #2E86C1); color: white; padding: 40px; border-radius: 25px; margin: 60px 0; text-align: center; }
    .code { font-size: 48px; font-weight: bold; font-family: monospace; letter-spacing: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 60px; color: #7F8C8D; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">CESAE DIGITAL</div>
    <div class="title">CERTIFICADO DE CONCLUSÃO</div>
  </div>
  
  <div class="content">
    <div class="info">
      <div class="name">${participant.name}</div>
      <div class="event-title">${event.title}</div>
      <div class="details">
        <table>
          <tr><td><strong>Data:</strong></td><td>${new Date(event.start_date).toLocaleDateString("pt-PT")}</td></tr>
          <tr><td><strong>Duração:</strong></td><td>${event.duration_hours} horas</td></tr>
          <tr><td><strong>Email:</strong></td><td>${participant.email}</td></tr>
        </table>
      </div>
    </div>
    <div class="badge-section">
      ${badgeBase64 ? `<img src="${badgeBase64}" alt="Badge CESAE" class="badge-img">` : '<div style="width:280px;height:280px;background:#E3F2FD;border-radius:20px;border:4px dashed #B0BEC5;display:flex;align-items:center;justify-content:center;color:#666;font-size:18px;font-weight:bold">Badge Digital CESAE</div>'}
    </div>
  </div>

  <div class="validation">
    <h3>CÓDIGO DE VALIDAÇÃO</h3>
    <div class="code">${validationCode}</div>
    <p>Verify at <strong>badges.cesae.pt/validate/${validationCode}</strong></p>
  </div>

  <div class="footer">
    CESAE Digital © 2026 | Certificado gerado automaticamente
  </div>
</body>
</html>`;

    // 5. Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const filename = `cert_${validationCode}.pdf`;
    const filepath = path.join(CERTIFICATES_DIR, filename);
    const buffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
    });
    fs.writeFileSync(filepath, buffer);

    // 6. Update DB
    await certificate.update({ pdf_url: `/uploads/certificates/${filename}` });

    await browser.close();
    return {
      success: true,
      filename,
      filepath,
      url: `/uploads/certificates/${filename}`,
      validationCode,
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error("Erro PDF:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Gera certificados PDF para todos os participantes elegíveis de um evento
 *
 * @param {Object} event - Objeto do evento (com enrollments e participants)
 * @returns {Promise<Array>} - Array de resultados { enrollmentId, certificate, success }
 */
async function generateCertificatesForEvent(event) {
  const results = [];
  const eligibleEnrollments = event.enrollments.filter((e) => {
    if (event.type === "evento") return e.status === "presente";
    if (event.type === "curso") return e.evaluation_result === "aprovado";
    return false;
  });

  for (const enrollment of eligibleEnrollments) {
    try {
      const result = await generateCertificate(enrollment.id);
      results.push({
        enrollmentId: enrollment.id,
        certificate: result,
        success: result.success !== false,
      });
    } catch (error) {
      results.push({
        enrollmentId: enrollment.id,
        error: error.message,
        success: false,
      });
    }
  }

  return results;
}

module.exports = { generateCertificate, generateCertificatesForEvent };
