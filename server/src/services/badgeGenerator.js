// server/src/services/badgeGenerator.js
// Motor de geração de badges com Canvas API (node-canvas)
// Responsável: Pedro Campos / Lucas Santos
// Gera imagem PNG do badge com base no template e dados do participante/evento

const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");
const fs = require("fs");

// Garantir que a pasta de output existe
const BADGES_DIR = path.join(__dirname, "../../..", "uploads", "badges");
if (!fs.existsSync(BADGES_DIR)) {
  fs.mkdirSync(BADGES_DIR, { recursive: true });
}

const SVG_TEMPLATE_PATH = path.join(
  __dirname,
  "../../files",
  "badge_default.svg",
);

/**
 * Modifica o SVG padrão adicionando o título do evento com tamanho dinâmico
 *
 * @param {string} eventTitle - Título do evento/curso
 * @returns {string} - SVG modificado como string
 */
function modifySvgWithTitle(eventTitle) {
  let svgContent = fs.readFileSync(SVG_TEMPLATE_PATH, "utf-8");

  // Calcular tamanho da fonte dinamicamente baseado no comprimento do título
  let fontSize = 14;
  if (eventTitle.length > 50) {
    fontSize = 8;
  } else if (eventTitle.length > 40) {
    fontSize = 10;
  } else if (eventTitle.length > 30) {
    fontSize = 12;
  } else if (eventTitle.length > 20) {
    fontSize = 13;
  }

  // Criar elemento de texto para o SVG - posicionado onde era DEFAULT_BADGE
  const textElement = `<text x="150" y="225" font-size="${fontSize}" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="Arial, sans-serif" dominant-baseline="middle">${eventTitle}</text>`;

  // Remover o elemento de texto anterior se existir (para evitar duplicatas)
  svgContent = svgContent.replace(/<text[^>]*>[^<]*<\/text>/g, "");

  // Adicionar o novo elemento de texto antes da tag de fechamento </svg>
  svgContent = svgContent.replace("</svg>", `${textElement}</svg>`);

  return svgContent;
}

/**
 * Renderiza um SVG como BufferPNG usando a Canvas API com dados do badge
 *
 * @param {string} svgContent - Conteúdo SVG como string
 * @param {Object} badgeData - Dados do badge (participantName, eventTitle, date, durationHours, validationCode)
 * @param {Object} template - Template com cores customizadas
 * @returns {Promise<Buffer>} - Buffer PNG
 */
async function renderSvgToPng(svgContent, badgeData = {}, template = {}) {
  try {
    const tempSvgPath = path.join(BADGES_DIR, `temp_${Date.now()}.svg`);
    fs.writeFileSync(tempSvgPath, svgContent);

    // Criar canvas maior para acomodar SVG + informações
    const WIDTH = 800;
    const HEIGHT = 800;
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // ── CORES DO TEMPLATE (com fallbacks) ──
    const colors = {
      background: template.backgroundColor || "#FFFFFF",
      primary: template.primaryColor || "#1B4F72",
      accent: template.accentColor || "#8E44AD",
      text: template.textColor || "#1C2833",
      lightText: template.lightTextColor || "#566573",
      border: template.borderColor || "#D4E6F1",
    };

    // Fundo branco
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

    // ── BARRA SUPERIOR COM COR (accent) ──
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
    ctx.moveTo(100, 110);
    ctx.lineTo(WIDTH - 100, 110);
    ctx.stroke();
    ctx.restore();

    // ── TIPO DE BADGE ── (CORRIGIDO - usa azul fixo)
    ctx.save();
    ctx.fillStyle = "#0066CC"; // Azul fixo para manter consistência
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICADO DE CONCLUSÃO", WIDTH / 2, 145);
    ctx.restore();

    // ── SVG RENDERIZADO NO CENTRO ──
    const SVG_SIZE = 250;
    const SVG_X = (WIDTH - SVG_SIZE) / 2;
    const SVG_Y = 175;

    try {
      const img = await loadImage(tempSvgPath);
      ctx.drawImage(img, SVG_X, SVG_Y, SVG_SIZE, SVG_SIZE);
    } catch (err) {
      console.warn("Não foi possível carregar o SVG como imagem:", err.message);
      // Desenhar um círculo placeholder se falhar
      ctx.save();
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(WIDTH / 2, SVG_Y + SVG_SIZE / 2, SVG_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── NOME DO PARTICIPANTE ──
    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    let fontSize = 28;
    const participantName = badgeData.participantName || "Participante";
    while (
      ctx.measureText(participantName).width > WIDTH - 120 &&
      fontSize > 18
    ) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px Arial`;
    }
    ctx.fillText(participantName, WIDTH / 2, SVG_Y + SVG_SIZE + 60);
    ctx.restore();

    // ── LINHA DECORATIVA SOB O NOME ──
    ctx.save();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2 - 80, SVG_Y + SVG_SIZE + 75);
    ctx.lineTo(WIDTH / 2 + 80, SVG_Y + SVG_SIZE + 75);
    ctx.stroke();
    ctx.restore();

    // ── INFORMAÇÕES DO EVENTO ──
    ctx.save();
    ctx.fillStyle = colors.lightText;
    ctx.font = "13px Arial";
    ctx.textAlign = "center";

    const infoItems = [];
    if (badgeData.date) infoItems.push(`📅 ${badgeData.date}`);
    if (badgeData.durationHours)
      infoItems.push(`⏱ ${badgeData.durationHours} horas`);

    let infoY = SVG_Y + SVG_SIZE + 105;
    if (infoItems.length > 0) {
      ctx.fillText(infoItems.join("    |    "), WIDTH / 2, infoY);
      infoY += 25;
    }
    ctx.restore();

    // ── LINHA SEPARADORA INFERIOR ──
    ctx.save();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, HEIGHT - 180);
    ctx.lineTo(WIDTH - 100, HEIGHT - 180);
    ctx.stroke();
    ctx.restore();

    // ── CÓDIGO DE VALIDAÇÃO ──
    if (badgeData.validationCode) {
      ctx.save();
      ctx.fillStyle = colors.lightText;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Código de validação", WIDTH / 2, HEIGHT - 140);

      ctx.fillStyle = colors.primary;
      ctx.font = "bold 16px Arial";
      ctx.fillText(badgeData.validationCode, WIDTH / 2, HEIGHT - 118);
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

    // Limpar arquivo temporário
    fs.unlinkSync(tempSvgPath);

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.warn("Erro ao renderizar SVG para PNG:", error.message);
    return null;
  }
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

  // Para cursos (badge2), usar o SVG padrão com o título do evento
  if (eventType === "curso") {
    try {
      const svgContent = modifySvgWithTitle(eventTitle);
      const pngBuffer = await renderSvgToPng(
        svgContent,
        {
          participantName,
          eventTitle,
          date,
          durationHours,
          validationCode,
        },
        template,
      ); // Passa o template para usar as cores

      if (pngBuffer) {
        const filename = `badge_${validationCode || Date.now()}.png`;
        const filepath = path.join(BADGES_DIR, filename);
        fs.writeFileSync(filepath, pngBuffer);

        return {
          filename,
          filepath,
          url: `/uploads/badges/${filename}`,
        };
      }
    } catch (error) {
      console.warn("Erro ao gerar badge SVG:", error.message);
      // Fallback para o método Canvas original
    }
  }

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
  if (date) infoItems.push(`📅 ${date}`);
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
  const filepath = path.join(BADGES_DIR, filename);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filepath, buffer);

  return {
    filename,
    filepath,
    url: `/uploads/badges/${filename}`,
  };
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
