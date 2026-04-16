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
    console.error("[OG] Erro ao carregar badge:", err.message);
  }
  return null;
}

// Desenha texto com quebra de linha; devolve o Y final
function fillWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      curY += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) { ctx.fillText(line, x, curY); curY += lineHeight; }
  return curY;
}

// GET /api/certificates/og/:code
async function generateOgImage(req, res) {
  try {
    const { code } = req.params;

    const certificate = await Certificate.findOne({ where: { validation_code: code } });
    if (!certificate) return res.status(404).send("Not found");

    const enrollment = await Enrollment.findByPk(certificate.enrollment_id);
    if (!enrollment) return res.status(404).send("Not found");

    const [participant, event, badge] = await Promise.all([
      Participant.findByPk(enrollment.participant_id),
      Event.findByPk(enrollment.event_id),
      Badge.findOne({ where: { enrollment_id: enrollment.id } }),
    ]);

    const name = participant?.name || "Participante";
    const eventTitle = event?.title || "Evento";

    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // ── FUNDO ────────────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0f172a");
    bg.addColorStop(1, "#1e1044");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── BARRA TOPO ───────────────────────────────────────────────────────────
    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0,   "#1e3a8a");
    bar.addColorStop(0.5, "#7c3aed");
    bar.addColorStop(1,   "#ec4899");
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, W, 10);

    // ── BADGE (esquerda) ─────────────────────────────────────────────────────
    const BADGE_SIZE = 420;
    const BADGE_X = 60;
    const BADGE_Y = (H - BADGE_SIZE) / 2;

    const badgeBuffer = badge ? await getBadgeBuffer(badge.image_url) : null;
    if (badgeBuffer) {
      try {
        const badgeImg = await loadImage(badgeBuffer);
        ctx.drawImage(badgeImg, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
      } catch (e) {
        console.error("[OG] erro ao desenhar badge:", e.message);
      }
    }

    // ── SEPARADOR VERTICAL ───────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(BADGE_X + BADGE_SIZE + 40, 60, 1, H - 120);

    // ── TEXTO (direita) ──────────────────────────────────────────────────────
    const TX = BADGE_X + BADGE_SIZE + 70; // 590
    const TW = W - TX - 50;               // 560
    let TY = 95;

    // Label "CESAE Digital"
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "left";
    ctx.fillText("CESAE Digital", TX, TY);
    TY += 10;

    // Linha acento
    const accent = ctx.createLinearGradient(TX, 0, TX + 100, 0);
    accent.addColorStop(0, "#7c3aed");
    accent.addColorStop(1, "#ec4899");
    ctx.fillStyle = accent;
    ctx.fillRect(TX, TY, 100, 3);
    TY += 36;

    // "Certificado de conclusão de"
    ctx.fillStyle = "#94a3b8";
    ctx.font = "22px Arial";
    ctx.fillText("Certificado de conclusao de", TX, TY);
    TY += 48;

    // Nome do evento
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px Arial";
    TY = fillWrapped(ctx, eventTitle, TX, TY, TW, 54);
    TY += 14;

    // Separador fino
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(TX, TY, TW * 0.8, 1);
    TY += 28;

    // "atribuído a"
    ctx.fillStyle = "#64748b";
    ctx.font = "20px Arial";
    ctx.fillText("atribuido a", TX, TY);
    TY += 36;

    // Nome do participante
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 36px Arial";
    TY = fillWrapped(ctx, name, TX, TY, TW, 44);

    // ── PILL "Certificado verificado" ─────────────────────────────────────────
    const PILL_Y = H - 66;
    ctx.fillStyle = "rgba(124,58,237,0.25)";
    ctx.beginPath();
    ctx.roundRect(TX, PILL_Y, 270, 38, 19);
    ctx.fill();

    ctx.strokeStyle = "rgba(167,139,250,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(TX, PILL_Y, 270, 38, 19);
    ctx.stroke();

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Certificado verificado", TX + 18, PILL_Y + 26);

    // ── ENVIAR PNG ────────────────────────────────────────────────────────────
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error("[OG] ERRO:", err.message);
    res.status(500).send("Erro: " + err.message);
  }
}

module.exports = { generateOgImage };
