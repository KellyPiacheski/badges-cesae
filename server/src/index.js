// server/src/index.js
// Entry point do servidor Express — Badges @ CESAE Digital

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const enrollmentRoutes = require("./routes/enrollments");
const certificateRoutes = require("./routes/certificates");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api/certificates", certificateRoutes);

// Rota de teste
app.get("/api", (req, res) => {
  res.json({ message: "Badges @ CESAE Digital API a funcionar!" });
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
