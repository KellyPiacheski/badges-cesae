// server/src/routes/participants.js
// Rotas globais de participantes (formandos) — protegidas por JWT

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const {
  listParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  importParticipants,
} = require("../controllers/participantController");

router.use(authMiddleware);

router.get("/", listParticipants);
router.post("/", roleGuard("admin"), createParticipant);
router.post("/import", roleGuard("admin"), importParticipants);
router.put("/:id", roleGuard("admin"), updateParticipant);
router.delete("/:id", roleGuard("admin"), deleteParticipant);

module.exports = router;
