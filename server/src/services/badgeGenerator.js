// server/src/services/badgeGenerator.js
// Motor de geração de badges com Canvas API (node-canvas)
// Responsável: Pedro Campos / Lucas Santos
// Gera imagem PNG do badge com base no template e dados do participante/evento

const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Garantir que a pasta de output existe
const BADGES_DIR = path.join(__dirname, '../../..', 'uploads', 'badges');
if (!fs.existsSync(BADGES_DIR)) {
  fs.mkdirSync(BADGES_DIR, { recursive: true });
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
 * @returns {Promise<string>} - Caminho do ficheiro PNG gerado
 */
async function generateBadge(options) {
  const {
    participantName,
    eventTitle,
    eventType,
    date,
    durationHours,
    validationCode,
    template = {}
  } = options;

  // Configuração do canvas (badge quadrado 800x800)
  const WIDTH = template.width || 800;
  const HEIGHT = template.height || 800;
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // ── CORES DO TEMPLATE ──
  const colors = {
    background: template.backgroundColor || '#FFFFFF',
    primary: template.primaryColor || '#1B4F72',
    secondary: template.secondaryColor || '#2E86C1',
    accent: template.accentColor || (eventType === 'curso' ? '#8E44AD' : '#27AE60'),
    text: template.textColor || '#1C2833',
    lightText: template.lightTextColor || '#566573',
    border: template.borderColor || '#D4E6F1',
  };

  // ── FUNDO ──
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── BORDA DECORATIVA ──
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);

  // Borda interior
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, WIDTH - 60, HEIGHT - 60);

  // ── BARRA SUPERIOR COM COR DO TIPO ──
  ctx.fillStyle = colors.accent;
  ctx.fillRect(30, 30, WIDTH - 60, 8);

  // ── LOGO / TÍTULO DA ORGANIZAÇÃO ──
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CESAE DIGITAL', WIDTH / 2, 90);

  // Linha separadora
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 110);
  ctx.lineTo(WIDTH - 200, 110);
  ctx.stroke();

  // ── TIPO DE BADGE ──
  const badgeLabel = eventType === 'curso' ? 'CERTIFICADO DE CONCLUSÃO' : 'CERTIFICADO DE PARTICIPAÇÃO';
  ctx.fillStyle = colors.accent;
  ctx.font = 'bold 16px Arial';
  ctx.fillText(badgeLabel, WIDTH / 2, 145);

  // ── ÍCONE DECORATIVO (círculo com check) ──
  const iconY = 210;
  ctx.beginPath();
  ctx.arc(WIDTH / 2, iconY, 40, 0, Math.PI * 2);
  ctx.fillStyle = colors.accent;
  ctx.fill();

  // Check mark dentro do círculo
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 15, iconY);
  ctx.lineTo(WIDTH / 2 - 3, iconY + 14);
  ctx.lineTo(WIDTH / 2 + 18, iconY - 10);
  ctx.stroke();

  // ── "ATRIBUÍDO A" ──
  ctx.fillStyle = colors.lightText;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Atribuído a', WIDTH / 2, 290);

  // ── NOME DO PARTICIPANTE ──
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 32px Arial';
  
  // Ajustar tamanho da fonte se o nome for muito longo
  let fontSize = 32;
  while (ctx.measureText(participantName).width > WIDTH - 120 && fontSize > 18) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }
  ctx.fillText(participantName, WIDTH / 2, 330);

  // ── LINHA DECORATIVA SOB O NOME ──
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2 - 80, 348);
  ctx.lineTo(WIDTH / 2 + 80, 348);
  ctx.stroke();

  // ── "PELA PARTICIPAÇÃO NO" ──
  ctx.fillStyle = colors.lightText;
  ctx.font = '14px Arial';
  ctx.fillText(eventType === 'curso' ? 'pela conclusão do curso' : 'pela participação no evento', WIDTH / 2, 390);

  // ── TÍTULO DO EVENTO ──
  ctx.fillStyle = colors.primary;
  ctx.font = 'bold 24px Arial';
  
  // Ajustar tamanho da fonte se o título for muito longo
  fontSize = 24;
  ctx.font = `bold ${fontSize}px Arial`;
  while (ctx.measureText(eventTitle).width > WIDTH - 120 && fontSize > 14) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Arial`;
  }

  // Suporte a títulos multi-linha
  const words = eventTitle.split(' ');
  let line = '';
  const lines = [];
  const maxWidth = WIDTH - 120;
  
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
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

  // ── INFORMAÇÕES DO EVENTO ──
  const infoY = startY + lines.length * lineHeight + 30;
  ctx.fillStyle = colors.lightText;
  ctx.font = '14px Arial';

  const infoItems = [];
  if (date) infoItems.push(`📅 ${date}`);
  if (durationHours) infoItems.push(`⏱ ${durationHours} horas`);

  if (infoItems.length > 0) {
    ctx.fillText(infoItems.join('    |    '), WIDTH / 2, infoY);
  }

  // ── LINHA SEPARADORA INFERIOR ──
  const bottomSepY = HEIGHT - 180;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, bottomSepY);
  ctx.lineTo(WIDTH - 100, bottomSepY);
  ctx.stroke();

  // ── CÓDIGO DE VALIDAÇÃO ──
  if (validationCode) {
    ctx.fillStyle = colors.lightText;
    ctx.font = '12px Arial';
    ctx.fillText('Código de validação', WIDTH / 2, HEIGHT - 140);

    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(validationCode, WIDTH / 2, HEIGHT - 118);
  }

  // ── FOOTER ──
  ctx.fillStyle = colors.lightText;
  ctx.font = '11px Arial';
  ctx.fillText('Verificar autenticidade em badges.cesae.pt/validate', WIDTH / 2, HEIGHT - 75);

  // ── MARCA D'ÁGUA CESAE ──
  ctx.fillStyle = colors.border;
  ctx.font = 'bold 12px Arial';
  ctx.fillText('CESAE DIGITAL © 2026', WIDTH / 2, HEIGHT - 50);

  // ── GUARDAR FICHEIRO ──
  const filename = `badge_${validationCode || Date.now()}.png`;
  const filepath = path.join(BADGES_DIR, filename);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);

  return {
    filename,
    filepath,
    url: `/uploads/badges/${filename}`
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
  const eligibleEnrollments = event.enrollments.filter(e => {
    if (event.type === 'evento') return e.status === 'presente';
    if (event.type === 'curso') return e.evaluation_result === 'aprovado';
    return false;
  });

  for (const enrollment of eligibleEnrollments) {
    try {
      const badge = await generateBadge({
        participantName: enrollment.participant.name,
        eventTitle: event.title,
        eventType: event.type,
        date: new Date(event.start_date).toLocaleDateString('pt-PT'),
        durationHours: event.duration_hours,
        validationCode: enrollment.certificate?.validation_code || null,
        template: template.design_config || {},
      });

      results.push({
        enrollmentId: enrollment.id,
        badge,
        success: true
      });
    } catch (error) {
      results.push({
        enrollmentId: enrollment.id,
        error: error.message,
        success: false
      });
    }
  }

  return results;
}

module.exports = {
  generateBadge,
  generateBadgesForEvent
};