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

// GET /api/og/certificate/:code
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

    // Canvas 1200x630
    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Fundo gradiente escuro
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e3a8a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Badge centrado à esquerda
    const BADGE_SIZE = 420;
    const BADGE_X = 80;
    const BADGE_Y = (H - BADGE_SIZE) / 2;

    const badgeBuffer = badge ? await getBadgeBuffer(badge.image_url) : null;
    if (badgeBuffer) {
      try {
        const badgeImg = await loadImage(badgeBuffer);
        // Sombra
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        // Badge com cantos arredondados
        const RADIUS = 30;
        ctx.beginPath();
        ctx.moveTo(BADGE_X + RADIUS, BADGE_Y);
        ctx.lineTo(BADGE_X + BADGE_SIZE - RADIUS, BADGE_Y);
        ctx.quadraticCurveTo(BADGE_X + BADGE_SIZE, BADGE_Y, BADGE_X + BADGE_SIZE, BADGE_Y + RADIUS);
        ctx.lineTo(BADGE_X + BADGE_SIZE, BADGE_Y + BADGE_SIZE - RADIUS);
        ctx.quadraticCurveTo(BADGE_X + BADGE_SIZE, BADGE_Y + BADGE_SIZE, BADGE_X + BADGE_SIZE - RADIUS, BADGE_Y + BADGE_SIZE);
        ctx.lineTo(BADGE_X + RADIUS, BADGE_Y + BADGE_SIZE);
        ctx.quadraticCurveTo(BADGE_X, BADGE_Y + BADGE_SIZE, BADGE_X, BADGE_Y + BADGE_SIZE - RADIUS);
        ctx.lineTo(BADGE_X, BADGE_Y + RADIUS);
        ctx.quadraticCurveTo(BADGE_X, BADGE_Y, BADGE_X + RADIUS, BADGE_Y);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(badgeImg, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
        ctx.restore();
      } catch (e) {
        console.error("Erro ao desenhar badge no OG:", e.message);
      }
    }

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Lado direito — texto
    const TEXT_X = BADGE_X + BADGE_SIZE + 60;
    const TEXT_W = W - TEXT_X - 60;
    const TEXT_Y_START = 140;

    // "CESAE Digital" — label pequeno
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 28px Arial";
    ctx.fillText("CESAE Digital", TEXT_X, TEXT_Y_START);

    // Linha separadora
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(TEXT_X, TEXT_Y_START + 14, 60, 3);

    // Nome do participante
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px Arial";
    const name = participant?.name || "";
    // Quebrar nome se for muito longo
    const words = name.split(" ");
    let line = "";
    let nameY = TEXT_Y_START + 70;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > TEXT_W && line) {
        ctx.fillText(line, TEXT_X, nameY);
        nameY += 60;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      ctx.fillText(line, TEXT_X, nameY);
      nameY += 60;
    }

    // "concluiu com sucesso"
    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px Arial";
    ctx.fillText("concluiu com sucesso", TEXT_X, nameY + 10);

    // Nome do evento
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 34px Arial";
    const eventTitle = event?.title || "";
    const eventWords = eventTitle.split(" ");
    let eLine = "";
    let eY = nameY + 58;
    for (const word of eventWords) {
      const test = eLine ? `${eLine} ${word}` : word;
      if (ctx.measureText(test).width > TEXT_W && eLine) {
        ctx.fillText(eLine, TEXT_X, eY);
        eY += 42;
        eLine = word;
      } else {
        eLine = test;
      }
    }
    if (eLine) {
      ctx.fillText(eLine, TEXT_X, eY);
      eY += 42;
    }

    // "Certificado verificado"
    const PILL_Y = H - 100;
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.beginPath();
    ctx.roundRect(TEXT_X, PILL_Y, 260, 44, 22);
    ctx.fill();
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 22px Arial";
    ctx.fillText("Certificado verificado", TEXT_X + 16, PILL_Y + 29);

    // Retornar imagem PNG
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error("Erro ao gerar OG image:", err);
    res.status(500).send("Erro ao gerar imagem");
  }
}

module.exports = { generateOgImage };
