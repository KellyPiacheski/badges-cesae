// server/src/routes/emails.js
// Rotas de emails

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { sendBulkEmails } = require("../controllers/emailController");

// POST /api/events/:id/send-emails — Enviar emails em massa (só admin)
router.post(
  "/events/:id/send-emails",
  authMiddleware,
  roleGuard("admin"),
  sendBulkEmails,
);

module.exports = router;
