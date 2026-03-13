// server/src/routes/emailLogs.js
// Rotas de logs de email

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const {
  getEmailLogs,
  resendEmail,
} = require("../controllers/emailLogController");

// GET /api/events/:id/email-logs — Listar logs de envio (admin)
router.get(
  "/events/:id/email-logs",
  authMiddleware,
  roleGuard("admin"),
  getEmailLogs,
);

// PATCH /api/email-logs/:id/resend — Reenviar email falhado (admin)
router.patch(
  "/email-logs/:id/resend",
  authMiddleware,
  roleGuard("admin"),
  resendEmail,
);

module.exports = router;
