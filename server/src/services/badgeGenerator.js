// server/src/services/badgeGenerator.js
// Motor de geração de badges com Canvas API (node-canvas)
// Responsável: Pedro Campos / Lucas Santos
// Gera imagem PNG do badge com base no template e dados do participante/evento

const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");
const { uploadToR2, isR2Configured } = require("./r2");

// Converte SVG em Buffer PNG usando @resvg/resvg-js (não requer librsvg no sistema)
async function svgToPngBuffer(svgPath, width = 200) {
  try {
    const { Resvg } = require("@resvg/resvg-js");
    const svgData = fs.readFileSync(svgPath, "utf8");
    const resvg = new Resvg(svgData, { fitTo: { mode: "width", value: width } });
    return Buffer.from(resvg.render().asPng());
  } catch (err) {
    console.warn("resvg-js não disponível, SVG não carregado:", err.message);
    return null;
  }
}

// Garantir que a pasta de output existe
const BADGES_DIR = path.join(__dirname, "../..", "uploads", "badges");
if (!fs.existsSync(BADGES_DIR)) {
  fs.mkdirSync(BADGES_DIR, { recursive: true });
}


/**
 * Desenha o badge no estilo do Lucas usando canvas — cores totalmente controladas pelo template
 */
async function drawLucasBadge(eventTitle, template = {}) {
  const SIZE = 600;
  const RADIUS = 40;
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");

  // Cores do template
  const bgColor     = template.accentColor    || "#7B2FBE";
  const lineColor   = template.secondaryColor || "#9B59B6";
  const globeColor  = template.globeColor     || "#A569BD";
  const textColor   = "#FFFFFF";

  // ── FUNDO COM CANTOS ARREDONDADOS ──
  ctx.beginPath();
  ctx.moveTo(RADIUS, 0);
  ctx.lineTo(SIZE - RADIUS, 0);
  ctx.quadraticCurveTo(SIZE, 0, SIZE, RADIUS);
  ctx.lineTo(SIZE, SIZE - RADIUS);
  ctx.quadraticCurveTo(SIZE, SIZE, SIZE - RADIUS, SIZE);
  ctx.lineTo(RADIUS, SIZE);
  ctx.quadraticCurveTo(0, SIZE, 0, SIZE - RADIUS);
  ctx.lineTo(0, RADIUS);
  ctx.quadraticCurveTo(0, 0, RADIUS, 0);
  ctx.closePath();
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Clip tudo ao rounded rect
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(RADIUS, 0);
  ctx.lineTo(SIZE - RADIUS, 0);
  ctx.quadraticCurveTo(SIZE, 0, SIZE, RADIUS);
  ctx.lineTo(SIZE, SIZE - RADIUS);
  ctx.quadraticCurveTo(SIZE, SIZE, SIZE - RADIUS, SIZE);
  ctx.lineTo(RADIUS, SIZE);
  ctx.quadraticCurveTo(0, SIZE, 0, SIZE - RADIUS);
  ctx.lineTo(0, RADIUS);
  ctx.quadraticCurveTo(0, 0, RADIUS, 0);
  ctx.closePath();
  ctx.clip();

  // ── LOGO CESAE (topo esquerda) ──
  // Converte SVG → PNG via resvg-js (funciona no Railway sem librsvg)
  const LOGO_SVG = path.join(__dirname, "../assets/cesae-logo.svg");
  const logoSvgPath = fs.existsSync(LOGO_SVG) ? LOGO_SVG : null;
  let logoLoaded = false;

  if (logoSvgPath) {
    try {
      const logoPng = await svgToPngBuffer(logoSvgPath, 180);
      if (logoPng) {
        const logo = await loadImage(logoPng);
        const logoH = 44;
        const logoW = (logo.width / logo.height) * logoH;
        ctx.drawImage(logo, 24, 26, logoW, logoH);
        logoLoaded = true;
      }
    } catch (err) {
      console.warn("Erro ao carregar logo SVG:", err.message);
    }
  }

  if (!logoLoaded) {
    ctx.fillStyle = textColor;
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("CESAE Digital", 24, 56);
  }

  // ── "VERIFICADO" (topo direita) ──
  ctx.fillStyle = textColor;
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "right";
  ctx.fillText("Verificado", SIZE - 30, 62);

  // ── LINHA SEPARADORA ──
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 96);
  ctx.lineTo(SIZE, 96);
  ctx.stroke();

  // ── GLOBO (centro) ──
  const CX = SIZE / 2;
  const CY = 310;
  const R = 140;

  ctx.strokeStyle = globeColor;
  ctx.lineWidth = 4;

  // Círculo exterior
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.stroke();

  // Elipse vertical (meridiano)
  ctx.beginPath();
  ctx.ellipse(CX, CY, R * 0.42, R, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Linha equador
  ctx.beginPath();
  ctx.moveTo(CX - R, CY);
  ctx.lineTo(CX + R, CY);
  ctx.stroke();

  // Paralelo superior
  ctx.beginPath();
  ctx.ellipse(CX, CY - R * 0.42, R * 0.91, R * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Paralelo inferior
  ctx.beginPath();
  ctx.ellipse(CX, CY + R * 0.42, R * 0.91, R * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── TÍTULO DO EVENTO (fundo) ──
  let fontSize = 28;
  ctx.font = `bold ${fontSize}px Arial`;
  while (ctx.measureText(eventTitle).width > SIZE - 60 && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";

  // Suporte multi-linha
  const words = eventTitle.split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > SIZE - 60 && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const lineH = fontSize + 8;
  const textStartY = SIZE - 30 - (lines.length - 1) * lineH;
  lines.forEach((l, i) => ctx.fillText(l, CX, textStartY + i * lineH));

  ctx.restore();
  return canvas.toBuffer("image/png");
}

/**
 * Gera um badge PNG para um participante
 *
 * @param {Object} options
 * @param {string} options.participantName - Nome do participante
 * @param {string} options.eventTitle - Título do evento/curso
 * @param {string} options.eventType - 'evento' ou 'curso'
 * @param {string} options.date - Data do evento (formatada)
 * @param {number} options.durationHours - Duração em horas
 * @param {string} options.validationCode - Código de validação do certificado
 * @param {Object} options.template - Configuração visual do template (design_config JSON)
 * @returns {Promise<Object>} - Objeto com filename, filepath, url
 */
async function generateBadge(options) {
  const {
    participantName,
    eventTitle,
    eventType,
    date,
    durationHours,
    validationCode,
    template = {},
  } = options;

  // Usar sempre o design do Lucas com cores do template
  try {
    const pngBuffer = await drawLucasBadge(eventTitle, template);

    if (pngBuffer) {
      const filename = `badge_${validationCode || Date.now()}.png`;
      let url;
      if (isR2Configured()) {
        url = await uploadToR2(pngBuffer, `badges/${filename}`, "image/png");
      } else {
        const filepath = path.join(BADGES_DIR, filename);
        fs.writeFileSync(filepath, pngBuffer);
        url = `${process.env.SERVER_URL || ""}/uploads/badges/${filename}`;
      }
      return { filename, url };
    }
  } catch (error) {
    console.warn("Erro ao gerar badge, a usar fallback canvas:", error.message);
  }

  // Fallback canvas (caso falhe)
  // Configuração do canvas (badge quadrado 800x800)
  const WIDTH = template.width || 800;
  const HEIGHT = template.height || 800;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // ── CORES DO TEMPLATE ──
  const colors = {
    background: template.backgroundColor || "#FFFFFF",
    primary: template.primaryColor || "#1B4F72",
    secondary: template.secondaryColor || "#2E86C1",
    accent:
      template.accentColor || (eventType === "curso" ? "#8E44AD" : "#27AE60"),
    text: template.textColor || "#1C2833",
    lightText: template.lightTextColor || "#566573",
    border: template.borderColor || "#D4E6F1",
  };

  // ── FUNDO ──
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── BORDA DECORATIVA ──
  ctx.save();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);
  ctx.restore();

  // Borda interior
  ctx.save();
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);
  ctx.restore();

  // ── BARRA SUPERIOR COM COR DO TIPO ──
  ctx.save();
  ctx.fillStyle = colors.accent;
  ctx.fillRect(30, 30, WIDTH - 60, 8);
  ctx.restore();

  // ── LOGO / TÍTULO DA ORGANIZAÇÃO ──
  ctx.save();
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CESAE DIGITAL", WIDTH / 2, 90);
  ctx.restore();

  // Linha separadora
  ctx.save();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 110);
  ctx.lineTo(WIDTH - 200, 110);
  ctx.stroke();
  ctx.restore();

  // ── TIPO DE BADGE ──
  const badgeLabel =
    eventType === "curso"
      ? "CERTIFICADO DE CONCLUSÃO"
      : "CERTIFICADO DE PARTICIPAÇÃO";

  ctx.save();
  ctx.fillStyle = "#0066CC"; // Azul fixo para o texto principal (não usa accent)
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText(badgeLabel, WIDTH / 2, 145);
  ctx.restore();

  // ── ÍCONE DECORATIVO (círculo com check) ──
  const iconY = 210;

  ctx.save();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, iconY, 40, 0, Math.PI * 2);
  ctx.fillStyle = colors.accent;
  ctx.fill();

  // Check mark dentro do círculo
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 15, iconY);
  ctx.lineTo(WIDTH / 2 - 3, iconY + 14);
  ctx.lineTo(WIDTH / 2 + 18, iconY - 10);
  ctx.stroke();
  ctx.restore();

  // ── "ATRIBUÍDO A" ──
  ctx.save();
  ctx.fillStyle = colors.lightText;
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Atribuído a", WIDTH / 2, 290);
  ctx.restore();

  // ── NOME DO PARTICIPANTE ──
  ctx.save();
  ctx.fillStyle = colors.text;
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";

  // Ajustar tamanho da fonte se o nome for muito longo
  let fontSize = 32;
  while (
    ctx.measureText(participantName).width > WIDTH - 120 &&
    fontSize > 18
  ) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }
  ctx.fillText(participantName, WIDTH / 2, 330);
  ctx.restore();

  // ── LINHA DECORATIVA SOB O NOME ──
  ctx.save();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 80, 348);
  ctx.lineTo(WIDTH / 2 + 80, 348);
  ctx.stroke();
  ctx.restore();

  // ── "PELA PARTICIPAÇÃO NO" ──
  ctx.save();
  ctx.fillStyle = colors.lightText;
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    eventType === "curso"
      ? "pela conclusão do curso"
      : "pela participação no evento",
    WIDTH / 2,
    390,
  );
  ctx.restore();

  // ── TÍTULO DO EVENTO ──
  ctx.save();
  ctx.fillStyle = colors.primary;
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";

  // Ajustar tamanho da fonte se o título for muito longo
  fontSize = 24;
  ctx.font = `bold ${fontSize}px Arial`;
  while (ctx.measureText(eventTitle).width > WIDTH - 120 && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }

  // Suporte a títulos multi-linha
  const words = eventTitle.split(" ");
  let line = "";
  const lines = [];
  const maxWidth = WIDTH - 120;

  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const lineHeight = fontSize + 8;
  const startY = 430 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => {
    ctx.fillText(l, WIDTH / 2, startY + i * lineHeight);
  });
  ctx.restore();

  // ── INFORMAÇÕES DO EVENTO ──
  const infoY = startY + lines.length * lineHeight + 30;

  ctx.save();
  ctx.fillStyle = colors.lightText;
  ctx.font = "14px Arial";
  ctx.textAlign = "center";

  const infoItems = [];
  if (date) infoItems.push(` ${date}`);
  if (durationHours) infoItems.push(`⏱ ${durationHours} horas`);

  if (infoItems.length > 0) {
    ctx.fillText(infoItems.join("    |    "), WIDTH / 2, infoY);
  }
  ctx.restore();

  // ── LINHA SEPARADORA INFERIOR ──
  const bottomSepY = HEIGHT - 180;

  ctx.save();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, bottomSepY);
  ctx.lineTo(WIDTH - 100, bottomSepY);
  ctx.stroke();
  ctx.restore();

  // ── CÓDIGO DE VALIDAÇÃO ──
  if (validationCode) {
    ctx.save();
    ctx.fillStyle = colors.lightText;
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Código de validação", WIDTH / 2, HEIGHT - 140);

    ctx.fillStyle = colors.primary;
    ctx.font = "bold 16px Arial";
    ctx.fillText(validationCode, WIDTH / 2, HEIGHT - 118);
    ctx.restore();
  }

  // ── FOOTER ──
  ctx.save();
  ctx.fillStyle = colors.lightText;
  ctx.font = "11px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Verificar autenticidade em badges.cesae.pt/validate",
    WIDTH / 2,
    HEIGHT - 75,
  );
  ctx.restore();

  // ── MARCA D'ÁGUA CESAE ──
  ctx.save();
  ctx.fillStyle = colors.border;
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CESAE DIGITAL © 2026", WIDTH / 2, HEIGHT - 50);
  ctx.restore();

  // ── GUARDAR FICHEIRO ──
  const filename = `badge_${validationCode || Date.now()}.png`;
  const buffer = canvas.toBuffer("image/png");

  let url;
  if (isR2Configured()) {
    url = await uploadToR2(buffer, `badges/${filename}`, "image/png");
  } else {
    const filepath = path.join(BADGES_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    url = `${process.env.SERVER_URL || ""}/uploads/badges/${filename}`;
  }

  return { filename, url };
}

/**
 * Gera badges para todos os participantes elegíveis de um evento
 *
 * @param {Object} event - Objeto do evento (com enrollments e participants)
 * @param {Object} template - Template a usar (design_config)
 * @returns {Promise<Array>} - Array de resultados { enrollmentId, badge }
 */
async function generateBadgesForEvent(event, template = {}) {
  const results = [];
  const eligibleEnrollments = event.enrollments.filter((e) => {
    if (event.type === "evento") return e.status === "presente";
    if (event.type === "curso") return e.evaluation_result === "aprovado";
    return false;
  });

  for (const enrollment of eligibleEnrollments) {
    try {
      const badge = await generateBadge({
        participantName: enrollment.participant.name,
        eventTitle: event.title,
        eventType: event.type,
        date: new Date(event.start_date).toLocaleDateString("pt-PT"),
        durationHours: event.duration_hours,
        validationCode: enrollment.certificate?.validation_code || null,
        template: template.design_config || {},
      });

      results.push({
        enrollmentId: enrollment.id,
        badge,
        success: true,
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

module.exports = {
  generateBadge,
  generateBadgesForEvent,
};
