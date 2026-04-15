// server/src/controllers/ogImageController.js
// Gera imagem Open Graph 1200x630 para partilha no LinkedIn

const { createCanvas, loadImage } = require("canvas");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Certificate, Enrollment, Participant, Event, Badge } = require("../models");

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function getBadgeBuffer(imageUrl) {
  if (!imageUrl) return null;
  try {
    if (imageUrl.startsWith("http") && !imageUrl.includes("localhost")) {
      return await downloadBuffer(imageUrl);
    }
    const localPath = path.join(__dirname, "../../uploads/badges", path.basename(imageUrl));
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
  } catch (err) {
    console.error("Erro ao carregar badge para OG:", err.message);
  }
  return null;
}

// Desenha texto com quebra de linha automática; devolve o Y final
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

// Rounded rect path helper
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// GET /api/certificates/og/:code
async function generateOgImage(req, res) {
  try {
    const { code } = req.params;
    console.log("[OG] a gerar imagem para:", code);

    const certificate = await Certificate.findOne({ where: { validation_code: code } });
    if (!certificate) return res.status(404).send("Not found");

    const enrollment = await Enrollment.findByPk(certificate.enrollment_id);
    if (!enrollment) return res.status(404).send("Not found");

    const [participant, event, badge] = await Promise.all([
      Participant.findByPk(enrollment.participant_id),
      Event.findByPk(enrollment.event_id),
      Badge.findOne({ where: { enrollment_id: enrollment.id } }),
    ]);

    console.log("[OG] participante:", participant?.name, "| evento:", event?.title, "| badge url:", badge?.image_url);

    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // ── FUNDO ────────────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0c1833");
    bgGrad.addColorStop(1, "#1a0a3d");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Barra de topo
    const topGrad = ctx.createLinearGradient(0, 0, W, 0);
    topGrad.addColorStop(0, "#1e3a8a");
    topGrad.addColorStop(0.5, "#7c3aed");
    topGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 10);

    // ── BADGE (esquerda) ─────────────────────────────────────────────────────
    const BADGE_SIZE = 440;
    const BADGE_X = 80;
    const BADGE_Y = (H - BADGE_SIZE) / 2 + 5;
    const RADIUS = 32;

    const badgeBuffer = badge ? await getBadgeBuffer(badge.image_url) : null;
    if (badgeBuffer) {
      try {
        const badgeImg = await loadImage(badgeBuffer);
        console.log("[OG] badge carregado com sucesso");

        // Sombra: rect preenchido com shadow antes do clip
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 50;
        ctx.shadowOffsetY = 14;
        ctx.fillStyle = "#111827";
        roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
        ctx.fill();
        ctx.restore();

        // Clip + imagem
        ctx.save();
        roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
        ctx.clip();
        ctx.drawImage(badgeImg, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
        ctx.restore();

        // Borda
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2;
        roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
        ctx.stroke();
        ctx.restore();
      } catch (e) {
        console.error("[OG] Erro ao desenhar badge:", e.message);
      }
    } else {
      console.warn("[OG] sem badge buffer");
      // Placeholder
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
      ctx.fill();
      ctx.restore();
    }

    // ── SEPARADOR VERTICAL ────────────────────────────────────────────────────
    const SEP_X = BADGE_X + BADGE_SIZE + 50; // 570
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(SEP_X, 60, 1, H - 120);

    // ── TEXTO (direita) ──────────────────────────────────────────────────────
    const TX = SEP_X + 55; // 625
    const TW = W - TX - 50; // 525
    let TY = 105;

    // Label "CESAE Digital"
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "left";
    ctx.fillText("CESAE Digital", TX, TY);
    TY += 8;

    // Acento colorido
    const acGrad = ctx.createLinearGradient(TX, 0, TX + 90, 0);
    acGrad.addColorStop(0, "#7c3aed");
    acGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = acGrad;
    ctx.fillRect(TX, TY, 90, 3);
    TY += 32;

    // Sub-label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "22px Arial";
    ctx.fillText("Certificado de conclusao de", TX, TY);
    TY += 46;

    // Nome do evento
    const eventTitle = event?.title || "Evento";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Arial";
    TY = drawWrappedText(ctx, eventTitle, TX, TY, TW, 52);
    TY += 16;

    // Separador fino
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(TX, TY, TW, 1);
    TY += 26;

    // "atribuído a"
    ctx.fillStyle = "#94a3b8";
    ctx.font = "20px Arial";
    ctx.fillText("atribuido a", TX, TY);
    TY += 38;

    // Nome do participante
    const name = participant?.name || "";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 44px Arial";
    TY = drawWrappedText(ctx, name, TX, TY, TW, 54);

    // ── PILL "Certificado verificado" ─────────────────────────────────────────
    const PILL_Y = H - 68;
    const PILL_LABEL = "Certificado verificado";
    ctx.font = "bold 20px Arial";
    const pillW = ctx.measureText(PILL_LABEL).width + 40;

    ctx.save();
    ctx.fillStyle = "rgba(124,58,237,0.3)";
    roundedRect(ctx, TX, PILL_Y, pillW, 38, 19);
    ctx.fill();
    ctx.strokeStyle = "rgba(167,139,250,0.6)";
    ctx.lineWidth = 1.5;
    roundedRect(ctx, TX, PILL_Y, pillW, 38, 19);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#c4b5fd";
    ctx.font = "bold 20px Arial";
    ctx.fillText(PILL_LABEL, TX + 20, PILL_Y + 26);

    console.log("[OG] canvas gerado, a enviar PNG");

    // Retornar PNG
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error("[OG] Erro:", err);
    res.status(500).send("Erro ao gerar imagem");
  }
}

module.exports = { generateOgImage };
