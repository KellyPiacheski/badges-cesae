// server/src/routes/certificates.js
// Rotas de certificados

const express = require("express");
const router = express.Router();
const {
  validateCertificate,
  createCertificate,
} = require("../controllers/certificateController");
const { generateOgImage } = require("../controllers/ogImageController");
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");

// GET /api/certificates/validate/:code — endpoint público, sem autenticação
router.get("/validate/:code", validateCertificate);

// GET /api/certificates/og/:code — imagem OG para LinkedIn (pública)
router.get("/og/:code", generateOgImage);

// POST /api/certificates — emitir certificado (admin only)
router.post(
  "/",
  authMiddleware,
  roleGuard("admin"),
  createCertificate,
);

module.exports = router;
