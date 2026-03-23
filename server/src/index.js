// server/src/index.js
// Entry point do servidor Express — Badges @ CESAE Digital

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const enrollmentRoutes = require("./routes/enrollments");
const certificateRoutes = require("./routes/certificates");
const emailRoutes = require("./routes/emails");
const emailLogRoutes = require("./routes/emailLogs");
const statsRoutes = require("./routes/stats");
const userRoutes = require("./routes/users");
const participantRoutes = require("./routes/participants");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Static files para badges/certificados
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api", enrollmentRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api", emailRoutes);
app.use("/api", emailLogRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/participants", participantRoutes);

// Health check
app.get("/api", (req, res) => {
  res.json({ message: "Badges @ CESAE Digital API a funcionar!" });
});

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});
