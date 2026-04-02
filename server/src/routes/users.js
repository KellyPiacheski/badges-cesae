// server/src/routes/users.js
// Rotas de utilizadores — protegidas por JWT + roleGuard admin

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { listUsers, createUser, updateUser, deleteUser } = require("../controllers/userController");

router.use(authMiddleware, roleGuard("admin"));

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
