// server/src/routes/templates.js
// Rotas de templates de badges — protegidas por JWT

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { listTemplates } = require("../controllers/templateController");

router.get("/", authMiddleware, listTemplates);

module.exports = router;
