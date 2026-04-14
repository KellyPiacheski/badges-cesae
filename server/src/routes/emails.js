// server/src/routes/emails.js
// Rotas de emails

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { sendBulkEmails, resendEmail } = require("../controllers/emailController");

// POST /api/events/:id/send-emails — Enviar emails em massa (só admin)
router.post(
  "/events/:id/send-emails",
  authMiddleware,
  roleGuard("admin"),
  sendBulkEmails,
);

// POST /api/enrollments/:enrollmentId/resend-email — Reenviar email individual (admin e formador)
router.post(
  "/enrollments/:enrollmentId/resend-email",
  authMiddleware,
  resendEmail,
);

module.exports = router;
