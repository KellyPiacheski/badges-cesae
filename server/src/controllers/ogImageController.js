// server/src/controllers/ogImageController.js
// Gera imagem Open Graph 1200x630 com o badge centrado para partilha no LinkedIn

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

// Helper: desenha um retângulo com cantos arredondados
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

// Helper: quebra texto em linhas que cabem dentro de maxWidth
function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// GET /api/certificates/og/:code
async function generateOgImage(req, res) {
  try {
    const { code } = req.params;

    // Buscar certificado e dados associados
    const certificate = await Certificate.findOne({ where: { validation_code: code } });
    if (!certificate) return res.status(404).send("Not found");

    const enrollment = await Enrollment.findByPk(certificate.enrollment_id);
    if (!enrollment) return res.status(404).send("Not found");

    const [participant, event, badge] = await Promise.all([
      Participant.findByPk(enrollment.participant_id),
      Event.findByPk(enrollment.event_id),
      Badge.findOne({ where: { enrollment_id: enrollment.id } }),
    ]);

    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // ── Fundo ────────────────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#0c1a3a");
    bgGrad.addColorStop(0.5, "#12275c");
    bgGrad.addColorStop(1, "#1e1144");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Barra de topo colorida
    const barGrad = ctx.createLinearGradient(0, 0, W, 0);
    barGrad.addColorStop(0, "#1e3a8a");
    barGrad.addColorStop(0.5, "#7c3aed");
    barGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, W, 8);

    // Barra de fundo (rodapé)
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, H - 60, W, 60);

    // ── Badge (lado esquerdo) ─────────────────────────────────────────────────
    const BADGE_SIZE = 440;
    const BADGE_X = 70;
    const BADGE_Y = (H - BADGE_SIZE) / 2 + 4; // ligeiramente abaixo da barra topo
    const RADIUS = 36;

    const badgeBuffer = badge ? await getBadgeBuffer(badge.image_url) : null;
    if (badgeBuffer) {
      try {
        const badgeImg = await loadImage(badgeBuffer);

        // Sombra: desenhar o mesmo rect com fill visível + shadow, ANTES do clip
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 50;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 16;
        ctx.fillStyle = "#0c1a3a"; // mesma cor do fundo — invisível mas gera sombra
        roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
        ctx.fill();
        ctx.restore();

        // Badge recortado com cantos arredondados
        ctx.save();
        roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
        ctx.clip();
        ctx.drawImage(badgeImg, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
        ctx.restore();

        // Borda sutil à volta do badge
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 2;
        roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
        ctx.stroke();
        ctx.restore();
      } catch (e) {
        console.error("Erro ao desenhar badge no OG:", e.message);
      }
    } else {
      // Placeholder quando não há badge
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      roundedRect(ctx, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE, RADIUS);
      ctx.fill();
      ctx.restore();
    }

    // ── Divisória vertical ───────────────────────────────────────────────────
    const DIV_X = BADGE_X + BADGE_SIZE + 50;
    const divGrad = ctx.createLinearGradient(0, 80, 0, H - 80);
    divGrad.addColorStop(0, "rgba(255,255,255,0)");
    divGrad.addColorStop(0.3, "rgba(255,255,255,0.15)");
    divGrad.addColorStop(0.7, "rgba(255,255,255,0.15)");
    divGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = divGrad;
    ctx.fillRect(DIV_X, 80, 1, H - 160);

    // ── Texto (lado direito) ─────────────────────────────────────────────────
    const TEXT_X = DIV_X + 50;
    const TEXT_W = W - TEXT_X - 60;
    let curY = 110;

    // "CESAE Digital" — label topo
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("CESAE Digital", TEXT_X, curY);
    curY += 8;

    // Acento colorido
    const accentGrad = ctx.createLinearGradient(TEXT_X, 0, TEXT_X + 80, 0);
    accentGrad.addColorStop(0, "#7c3aed");
    accentGrad.addColorStop(1, "#ec4899");
    ctx.fillStyle = accentGrad;
    ctx.fillRect(TEXT_X, curY, 80, 3);
    curY += 30;

    // "concluiu com sucesso" — subtítulo pequeno acima do nome
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.font = "22px sans-serif";
    ctx.fillText("Certificado de conclusão de", TEXT_X, curY);
    curY += 38;

    // Nome do evento (destaque)
    const eventTitle = event?.title || "";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    const eventLines = wrapText(ctx, eventTitle, TEXT_W);
    for (const l of eventLines) {
      ctx.fillText(l, TEXT_X, curY);
      curY += 50;
    }
    curY += 10;

    // Separador fino
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(TEXT_X, curY, TEXT_W, 1);
    curY += 28;

    // "atribuído a"
    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = "20px sans-serif";
    ctx.fillText("atribuído a", TEXT_X, curY);
    curY += 34;

    // Nome do participante
    const name = participant?.name || "";
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 46px sans-serif";
    const nameLines = wrapText(ctx, name, TEXT_W);
    for (const l of nameLines) {
      ctx.fillText(l, TEXT_X, curY);
      curY += 56;
    }

    // ── Pill "Certificado verificado" (rodapé direito) ───────────────────────
    const PILL_H = 40;
    const PILL_Y = H - 50 - PILL_H / 2;
    const PILL_TEXT = "✓  Certificado verificado";

    ctx.font = "bold 20px sans-serif";
    const pillW = ctx.measureText(PILL_TEXT).width + 36;

    ctx.save();
    ctx.fillStyle = "rgba(124,58,237,0.35)";
    roundedRect(ctx, TEXT_X, PILL_Y, pillW, PILL_H, PILL_H / 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(167,139,250,0.5)";
    ctx.lineWidth = 1.5;
    roundedRect(ctx, TEXT_X, PILL_Y, pillW, PILL_H, PILL_H / 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(PILL_TEXT, TEXT_X + 18, PILL_Y + PILL_H / 2 + 7);

    // Retornar imagem PNG
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1h
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error("Erro ao gerar OG image:", err);
    res.status(500).send("Erro ao gerar imagem");
  }
}

module.exports = { generateOgImage };
