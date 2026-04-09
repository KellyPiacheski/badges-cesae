// server/src/scripts/testBadge.js
// Script para testar a geração de badges
// Corre com: node src/scripts/testBadge.js

const { generateBadge } = require("../services/badgeGenerator");

async function test() {
  console.log("A gerar badge de teste...\n");

  try {
    // Teste 1: Badge de evento
    const badge1 = await generateBadge({
      participantName: "Ana Silva",
      eventTitle: "Workshop de Design Thinking",
      eventType: "evento",
      date: "10/04/2026",
      durationHours: 4,
      validationCode: "CESAE-AB12-CD34-EF56",
    });
    console.log(" Badge de evento gerado:", badge1.filepath);

    // Teste 2: Badge de curso
    const badge2 = await generateBadge({
      participantName: "Carlos Mendes da Silva Ferreira",
      eventTitle: "React e Desenvolvimento Frontend",
      eventType: "curso",
      date: "14/04/2026 — 09/05/2026",
      durationHours: 40,
      validationCode: "CESAE-GH78-IJ90-KL12",
    });
    console.log(" Badge de curso gerado:", badge2.filepath);

    // Teste 3: Badge com template customizado
    const badge3 = await generateBadge({
      participantName: "Maria Costa",
      eventTitle: "Palestra: Futuro da IA",
      eventType: "evento",
      date: "20/04/2026",
      durationHours: 2,
      validationCode: "CESAE-MN34-OP56-QR78",
      template: {
        primaryColor: "#2C3E50",
        secondaryColor: "#3498DB",
        accentColor: "#E74C3C",
        backgroundColor: "#FAFAFA",
      },
    });
    console.log(" Badge customizado gerado:", badge3.filepath);

    console.log(
      "\n Todos os testes passaram! Verifica os badges em uploads/badges/",
    );
  } catch (error) {
    console.error(" Erro:", error.message);
  }
}

test();
