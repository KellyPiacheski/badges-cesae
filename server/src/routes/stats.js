// server/src/routes/stats.js
// Rotas de estatísticas — protegidas por JWT

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { getDashboardStats } = require("../controllers/statsController");

// GET /api/stats/dashboard — estatísticas globais (qualquer utilizador autenticado)
router.get("/dashboard", authMiddleware, getDashboardStats);

module.exports = router;
