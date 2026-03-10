// server/src/routes/events.js
// Rotas de eventos — CRUD completo

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/events — Listar eventos (qualquer utilizador autenticado)
router.get('/', listEvents);

// GET /api/events/:id — Detalhe do evento (qualquer utilizador autenticado)
router.get('/:id', getEvent);

// POST /api/events — Criar evento (apenas admin)
router.post('/', roleGuard('admin'), createEvent);

// PUT /api/events/:id — Editar evento (apenas admin)
router.put('/:id', roleGuard('admin'), updateEvent);

// DELETE /api/events/:id — Eliminar evento (apenas admin)
router.delete('/:id', roleGuard('admin'), deleteEvent);

module.exports = router;