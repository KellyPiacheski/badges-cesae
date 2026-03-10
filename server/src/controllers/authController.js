// server/src/controllers/authController.js
// Controller de autenticação — login com JWT + bcrypt

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Validar se os campos foram enviados
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e password são obrigatórios",
      });
    }

    // 2. Procurar o utilizador na BD pelo email
    const user = await User.findOne({ where: { email } });

    // 3. Se não existir, devolver erro 401
    // Mensagem genérica por segurança — não revelamos se o email existe
    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // 4. Verificar a password com bcrypt
    const passwordValida = await bcrypt.compare(password, user.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // 5. Gerar o JWT com os dados do utilizador
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    );

    // 6. Devolver o token ao frontend
    return res.status(200).json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
}

module.exports = { login };
