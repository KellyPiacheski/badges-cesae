// server/src/routes/enrollments.js
// Rotas de inscrições — participantes, presenças, avaliações

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const {
  listParticipants,
  addParticipant,
  importParticipants,
  markAttendance,
  setEvaluation,
  removeParticipant
} = require('../controllers/enrollmentController');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/events/:id/participants — Listar participantes do evento
router.get('/events/:id/participants', listParticipants);

// POST /api/events/:id/participants — Adicionar participante
router.post('/events/:id/participants', addParticipant);

// POST /api/events/:id/participants/import — Importar participantes (admin)
router.post('/events/:id/participants/import', roleGuard('admin'), importParticipants);

// PATCH /api/enrollments/:id/attendance — Marcar presença
router.patch('/enrollments/:id/attendance', markAttendance);

// PATCH /api/enrollments/:id/evaluation — Registar avaliação
router.patch('/enrollments/:id/evaluation', setEvaluation);

// DELETE /api/enrollments/:id — Remover participante do evento
router.delete('/enrollments/:id', removeParticipant);

module.exports = router;