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

// GET /api/certificates/og/:code
async function generateOgImage(req, res) {
  try {
    const { code } = req.params;
    console.log("[OG] inicio para:", code);

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
    console.log("[OG] dados: nome=", name, "evento=", eventTitle);

    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // 1. FUNDO ESCURO
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    console.log("[OG] fundo ok");

    // 2. BARRA TOPO
    ctx.fillStyle = "#7c3aed";
    ctx.fillRect(0, 0, W, 10);

    // 3. BADGE (esquerda, sem clip - só drawImage)
    const BADGE_SIZE = 420;
    const BADGE_X = 60;
    const BADGE_Y = (H - BADGE_SIZE) / 2;

    const badgeBuffer = badge ? await getBadgeBuffer(badge.image_url) : null;
    if (badgeBuffer) {
      try {
        const badgeImg = await loadImage(badgeBuffer);
        ctx.drawImage(badgeImg, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
        console.log("[OG] badge desenhado ok");
      } catch (e) {
        console.error("[OG] erro drawImage:", e.message);
      }
    }

    // 4. RECT DE DIAGNÓSTICO — deve aparecer em laranja no lado direito
    ctx.fillStyle = "#f97316";
    ctx.fillRect(540, 50, 600, 8);
    console.log("[OG] rect diagnostico ok");

    // 5. TEXTO SIMPLES
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "left";
    ctx.fillText("CESAE Digital", 560, 130);
    console.log("[OG] texto CESAE ok");

    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 38px Arial";
    ctx.fillText(eventTitle, 560, 200);
    console.log("[OG] texto evento ok");

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "28px Arial";
    ctx.fillText(name, 560, 270);
    console.log("[OG] texto nome ok");

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 22px Arial";
    ctx.fillText("Certificado verificado", 560, H - 60);

    console.log("[OG] a enviar PNG");

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache");
    canvas.createPNGStream().pipe(res);

  } catch (err) {
    console.error("[OG] ERRO GERAL:", err.message, err.stack);
    res.status(500).send("Erro: " + err.message);
  }
}

module.exports = { generateOgImage };
