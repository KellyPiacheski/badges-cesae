// server/src/routes/certificates.js
// Rotas de certificados

const express = require("express");
const router = express.Router();
const { validateCertificate } = require("../controllers/certificateController");

// GET /api/certificates/validate/:code — endpoint público, sem autenticação
router.get("/validate/:code", validateCertificate);

module.exports = router;
