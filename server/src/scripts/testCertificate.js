require("dotenv").config();
const path = require("path");
const { sequelize } = require("../models");
const { generateCertificate } = require("../services/certificateGenerator");

async function testCertificate() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB conectado!");

    const enrollmentId = 1;
    console.log(`🧪 Gerando certificado para enrollment #${enrollmentId}...`);

    const result = await generateCertificate(enrollmentId);

    if (result.success) {
      console.log("🎉 CERTIFICADO PDF CRIADO!");
      console.log("📄 Ficheiro:", result.filepath);
      console.log("🔗 URL:", `http://localhost:3001${result.url}`);
      console.log("📱 Abrir PDF:", result.filepath);
    } else {
      console.error("❌ Erro:", result.error);
    }
  } catch (error) {
    console.error("💥 Erro:", error.message);
  } finally {
    await sequelize.close();
  }
}

testCertificate();
