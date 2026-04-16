// server/src/controllers/ogImageController.js
// Gera imagem Open Graph 1200x630 para partilha no LinkedIn

const { createCanvas, loadImage } = require("canvas");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Certificate, Enrollment, Participant, Event, Badge } = require("../models");

// Cache em memória: evita regenerar a imagem em cada pedido
// Chave: validation_code  |  Valor: Buffer PNG
const ogCache = new Map();

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

    // ── SERVIR DO CACHE SE DISPONÍVEL ─────────────────────────────────────────
    if (ogCache.has(code)) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Cache", "HIT");
      return res.end(ogCache.get(code));
    }

    const certificate = await Certificate.findOne({ where: { validation_code: code } });
    if (!certificate) return res.status(404).send("Not found");

    const enrollment = await Enrollment.findByPk(certificate.enrollment_id);
    if (!enrollment) return res.status(404).send("Not found");

    const [participant, event, badge] = await Promise.all([
      Participant.findByPk(enrollment.participant_id),
      Event.findByPk(enrollment.event_id),
      Badge.findOne({ where: { enrollment_id: enrollment.id } }),
    ]);

    const name       = participant?.name  || "Participante";
    const eventTitle = event?.title       || "Evento";

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

    // ── LAYOUT: badge centrado, texto à direita ───────────────────────────────
    // Zona esquerda: metade esquerda (600px) para badge centrado
    // Zona direita:  metade direita (600px) para texto

    // BADGE — centrado na metade esquerda
    const BADGE_SIZE = 380;
    const BADGE_X = (600 - BADGE_SIZE) / 2;       // 110
    const BADGE_Y = (H - BADGE_SIZE) / 2;           // 125

    const badgeBuffer = badge ? await getBadgeBuffer(badge.image_url) : null;
    if (badgeBuffer) {
      try {
        const badgeImg = await loadImage(badgeBuffer);
        ctx.drawImage(badgeImg, BADGE_X, BADGE_Y, BADGE_SIZE, BADGE_SIZE);
      } catch (e) {
        console.error("[OG] erro ao desenhar badge:", e.message);
      }
    }

    // Separador vertical no centro (x=600)
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(600, 50, 1, H - 100);

    // ── TEXTO (metade direita) ────────────────────────────────────────────────
    const TX = 640;
    const TW = 510; // espaço disponível até ao fim (640 + 510 = 1150, deixa 50px margem)
    let TY = 100;

    // "CESAE Digital"
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "left";
    ctx.fillText("CESAE Digital", TX, TY);
    TY += 8;

    // Barra acento azul→rosa
    const accent = ctx.createLinearGradient(TX, 0, TX + 100, 0);
    accent.addColorStop(0, "#7c3aed");
    accent.addColorStop(1, "#ec4899");
    ctx.fillStyle = accent;
    ctx.fillRect(TX, TY, 100, 3);
    TY += 34;

    // "Certificado de conclusão de"
    ctx.fillStyle = "#94a3b8";
    ctx.font = "21px Arial";
    ctx.fillText("Certificado de conclus\u00e3o de", TX, TY);
    TY += 48;

    // Nome do evento (com quebra de linha)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Arial";
    const eventWords = eventTitle.split(" ");
    let eLine = "";
    for (const word of eventWords) {
      const test = eLine ? `${eLine} ${word}` : word;
      if (ctx.measureText(test).width > TW && eLine) {
        ctx.fillText(eLine, TX, TY);
        TY += 50;
        eLine = word;
      } else { eLine = test; }
    }
    if (eLine) { ctx.fillText(eLine, TX, TY); TY += 50; }
    TY += 10;

    // Linha divisória
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(TX, TY, TW * 0.8, 1);
    TY += 26;

    // "atribuído a"
    ctx.fillStyle = "#64748b";
    ctx.font = "19px Arial";
    ctx.fillText("atribu\u00eddo a", TX, TY);
    TY += 34;

    // Nome do participante
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 34px Arial";
    const nameWords = name.split(" ");
    let nLine = "";
    for (const word of nameWords) {
      const test = nLine ? `${nLine} ${word}` : word;
      if (ctx.measureText(test).width > TW && nLine) {
        ctx.fillText(nLine, TX, TY);
        TY += 42;
        nLine = word;
      } else { nLine = test; }
    }
    if (nLine) { ctx.fillText(nLine, TX, TY); TY += 42; }

    // ── PILL "Certificado verificado" ─────────────────────────────────────────
    const PILL_Y = H - 64;

    ctx.fillStyle = "rgba(124,58,237,0.25)";
    ctx.beginPath();
    ctx.roundRect(TX, PILL_Y, 268, 36, 18);
    ctx.fill();

    ctx.strokeStyle = "rgba(167,139,250,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(TX, PILL_Y, 268, 36, 18);
    ctx.stroke();

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 19px Arial";
    ctx.fillText("Certificado verificado", TX + 18, PILL_Y + 25);

    // ── GUARDAR NO CACHE E ENVIAR PNG ─────────────────────────────────────────
    const pngBuffer = canvas.toBuffer("image/png");
    ogCache.set(code, pngBuffer);            // guarda para pedidos futuros
    // Limitar cache a 500 entradas para evitar uso excessivo de memória
    if (ogCache.size > 500) {
      const firstKey = ogCache.keys().next().value;
      ogCache.delete(firstKey);
    }
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24h
    res.setHeader("X-Cache", "MISS");
    res.end(pngBuffer);

  } catch (err) {
    console.error("[OG] ERRO:", err.message);
    res.status(500).send("Erro: " + err.message);
  }
}

module.exports = { generateOgImage };
