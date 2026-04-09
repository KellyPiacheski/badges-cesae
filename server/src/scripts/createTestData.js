require("dotenv").config();
const {
  sequelize,
  Event,
  Participant,
  Enrollment,
  BadgeTemplate,
  Badge,
  Certificate,
} = require("../models");

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log("DB OK");

    // Participant
    const [participant] = await Participant.findOrCreate({
      where: { email: "test@cesae.pt" },
      defaults: { name: "João Teste", email: "test@cesae.pt" },
    });

    // Event
    const [event] = await Event.findOrCreate({
      where: { title: "Curso Test PDF Generator" },
      defaults: {
        title: "Curso Test PDF Generator",
        type: "curso",
        start_date: "2024-12-01",
        duration_hours: 12,
      },
    });

    // Enrollment
    const [enrollment] = await Enrollment.findOrCreate({
      where: { event_id: event.id, participant_id: participant.id },
      defaults: {
        event_id: event.id,
        participant_id: participant.id,
        status: "presente",
        evaluation_result: "aprovado",
      },
    });

    console.log(" Enrollment ID:", enrollment.id);

    // Badge template
    const [template] = await BadgeTemplate.findOrCreate({
      where: { name: "test-pdf" },
      defaults: { name: "test-pdf", is_default: true },
    });

    // Badge fake
    await Badge.upsert({
      enrollment_id: enrollment.id,
      template_id: template.id,
      image_url: "/uploads/badges/test.png",
    });

    console.log(" Badge criado");

    // Test certificate
    const { generateCertificate } = require("../services/certificateGenerator");
    const result = await generateCertificate(enrollment.id);

    console.log(result.success ? " PDF OK!" : " PDF erro:", result.error);
  } catch (error) {
    console.error("ERRO:", error.message);
  } finally {
    await sequelize.close();
  }
}

createTestData();
