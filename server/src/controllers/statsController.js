// server/src/controllers/statsController.js
// Agrega estatísticas globais da plataforma para o dashboard

const {
  Event,
  Enrollment,
  Participant,
  Badge,
  Certificate,
  EmailLog,
} = require("../models");
const { Op } = require("sequelize");

// GET /api/stats/dashboard
async function getDashboardStats(req, res) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // ── TOTAIS (em paralelo) ──
    const [
      totalEventos,
      totalCursos,
      totalParticipantes,
      totalBadges,
      totalCertificados,
      totalPresentes,
      totalComPresenca,
      totalAprovados,
      totalComAvaliacao,
      emailsEnviados,
      emailsFalhados,
      eventosRecentes,
      badgesRecentes,
    ] = await Promise.all([
      Event.count({ where: { type: "evento" } }),
      Event.count({ where: { type: "curso" } }),
      Participant.count(),
      Badge.count(),
      Certificate.count(),
      Enrollment.count({ where: { status: "presente" } }),
      Enrollment.count({
        where: { status: { [Op.in]: ["presente", "ausente"] } },
      }),
      Enrollment.count({ where: { evaluation_result: "aprovado" } }),
      Enrollment.count({
        where: { evaluation_result: { [Op.not]: null } },
      }),
      EmailLog.count({ where: { status: "sent" } }),
      EmailLog.count({ where: { status: "failed" } }),
      // Dados mensais: eventos e badges dos últimos 6 meses
      Event.findAll({
        attributes: ["id", "start_date", "type"],
        where: { start_date: { [Op.gte]: sixMonthsAgo } },
        raw: true,
      }),
      Badge.findAll({
        attributes: ["id", "issued_at"],
        where: { issued_at: { [Op.gte]: sixMonthsAgo } },
        raw: true,
      }),
    ]);

    // ── TAXAS ──
    const taxaPresenca =
      totalComPresenca > 0
        ? parseFloat(((totalPresentes / totalComPresenca) * 100).toFixed(1))
        : 0;

    const taxaAprovacao =
      totalComAvaliacao > 0
        ? parseFloat(((totalAprovados / totalComAvaliacao) * 100).toFixed(1))
        : 0;

    // ── DADOS MENSAIS (últimos 6 meses) ──
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d
        .toLocaleDateString("pt-PT", { month: "short" })
        .replace(".", "");
      meses.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }

    const eventosPorMes = {};
    const badgesPorMes = {};

    for (const e of eventosRecentes) {
      const k = new Date(e.start_date)
        .toISOString()
        .slice(0, 7);
      eventosPorMes[k] = (eventosPorMes[k] || 0) + 1;
    }
    for (const b of badgesRecentes) {
      const k = new Date(b.issued_at)
        .toISOString()
        .slice(0, 7);
      badgesPorMes[k] = (badgesPorMes[k] || 0) + 1;
    }

    const porMes = meses.map(({ key, label }) => ({
      mes: label,
      eventos: eventosPorMes[key] || 0,
      badges: badgesPorMes[key] || 0,
    }));

    return res.status(200).json({
      totais: {
        eventos: totalEventos,
        cursos: totalCursos,
        participantes: totalParticipantes,
        badges: totalBadges,
        certificados: totalCertificados,
        emailsEnviados,
        emailsFalhados,
      },
      taxas: {
        presenca: taxaPresenca,
        aprovacao: taxaAprovacao,
      },
      porMes,
    });
  } catch (error) {
    console.error("Erro ao obter stats do dashboard:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

module.exports = { getDashboardStats };
