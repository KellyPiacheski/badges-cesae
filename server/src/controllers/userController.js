// server/src/controllers/userController.js
// CRUD de utilizadores (formadores) — só admin

const bcrypt = require("bcrypt");
const { User } = require("../models");

// GET /api/users
async function listUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "created_at"],
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao listar utilizadores:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// POST /api/users
async function createUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, email e password são obrigatórios" });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email já em uso" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password_hash, role: "formador" });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Erro ao criar utilizador:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// PUT /api/users/:id
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }

    const updates = {};
    if (name) updates.name = name;
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: "Email já em uso" });
      updates.email = email;
    }
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    await user.update(updates);

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Erro ao atualizar utilizador:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: "Não podes remover a tua própria conta" });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }

    await user.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover utilizador:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };
