// server/src/routes/certificates.js
// Rotas de certificados

const express = require("express");
const router = express.Router();
const {
  validateCertificate,
  createCertificate,
} = require("../controllers/certificateController");
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");

// GET /api/certificates/validate/:code — endpoint público, sem autenticação
router.get("/validate/:code", validateCertificate);

// POST /api/certificates — emitir certificado (admin only)
router.post(
  "/",
  authMiddleware,
  roleGuard("admin"),
  createCertificate,
);

module.exports = router;
