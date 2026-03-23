// server/src/routes/stats.js
// Rotas de estatísticas — protegidas por JWT

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { getDashboardStats } = require("../controllers/statsController");
const { exportReport } = require("../controllers/exportController");

// GET /api/stats/dashboard — estatísticas globais (qualquer utilizador autenticado)
router.get("/dashboard", authMiddleware, getDashboardStats);

// GET /api/stats/export?format=xlsx|pdf — exportação de relatório (admin only)
router.get("/export", authMiddleware, roleGuard("admin"), exportReport);

module.exports = router;
