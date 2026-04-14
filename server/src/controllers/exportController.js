// server/src/controllers/exportController.js
// Gera relatórios em XLSX ou PDF com dados completos da plataforma

const XLSX = require("xlsx");
const puppeteer = require("puppeteer");
const { Event, Enrollment, Participant, Badge, Certificate } = require("../models");
const { Op } = require("sequelize");

// GET /api/stats/export?format=xlsx|pdf
async function exportReport(req, res) {
  const format = req.query.format;

  if (!["xlsx", "pdf"].includes(format)) {
    return res
      .status(400)
      .json({ error: 'Parâmetro "format" deve ser "xlsx" ou "pdf"' });
  }

  try {
    // ── DADOS ──
    const [eventos, enrollments] = await Promise.all([
      Event.findAll({
        include: [{ model: Enrollment, as: "enrollments" }],
        order: [["start_date", "DESC"]],
      }),
      Enrollment.findAll({
        include: [
          { model: Participant, as: "participant" },
          { model: Event, as: "event" },
          { model: Certificate, as: "certificate" },
          { model: Badge, as: "badge" },
        ],
        order: [["enrolled_at", "DESC"]],
      }),
    ]);

    if (format === "xlsx") {
      return exportXlsx(res, eventos, enrollments);
    } else {
      return exportPdf(res, eventos, enrollments);
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return res.status(500).json({ error: "Erro interno ao gerar relatório" });
  }
}

// ── XLSX ──
function exportXlsx(res, eventos, enrollments) {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString("pt-PT");

  // Sheet 1 — Resumo
  const totalPresentes = enrollments.filter((e) => e.status === "presente").length;
  const totalAprovados = enrollments.filter((e) => e.evaluation_result === "aprovado").length;
  const totalBadges = enrollments.filter((e) => e.badge).length;
  const totalCerts = enrollments.filter((e) => e.certificate).length;

  const resumo = [
    ["Relatório CESAE Digital", today],
    [],
    ["Métrica", "Valor"],
    ["Total de eventos", eventos.filter((e) => e.type === "evento").length],
    ["Total de cursos", eventos.filter((e) => e.type === "curso").length],
    ["Total de inscrições", enrollments.length],
    ["Participantes presentes", totalPresentes],
    ["Participantes aprovados", totalAprovados],
    ["Badges emitidos", totalBadges],
    ["Certificados emitidos", totalCerts],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(resumo);
  ws1["!cols"] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Resumo");

  // Sheet 2 — Eventos
  const eventosRows = [
    ["ID", "Título", "Tipo", "Data Início", "Data Fim", "Local", "Duração (h)", "Inscritos", "Presentes", "Aprovados"],
  ];
  for (const ev of eventos) {
    const enr = ev.enrollments || [];
    eventosRows.push([
      ev.id,
      ev.title,
      ev.type === "evento" ? "Evento" : "Curso",
      ev.start_date ? new Date(ev.start_date).toLocaleDateString("pt-PT") : "",
      ev.end_date ? new Date(ev.end_date).toLocaleDateString("pt-PT") : "",
      ev.location || "",
      ev.duration_hours || "",
      enr.length,
      enr.filter((e) => e.status === "presente").length,
      enr.filter((e) => e.evaluation_result === "aprovado").length,
    ]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(eventosRows);
  ws2["!cols"] = [
    { wch: 6 }, { wch: 40 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
    { wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Eventos");

  // Sheet 3 — Participantes
  const participantesRows = [
    ["Participante", "Email", "Evento", "Tipo", "Presença", "Nota", "Resultado", "Badge", "Certificado", "Data Inscrição"],
  ];
  for (const enr of enrollments) {
    participantesRows.push([
      enr.participant?.name || "",
      enr.participant?.email || "",
      enr.event?.title || "",
      enr.event?.type === "evento" ? "Evento" : "Curso",
      enr.status || "",
      enr.evaluation_score ?? "",
      enr.evaluation_result || "",
      enr.badge ? "Sim" : "Não",
      enr.certificate ? "Sim" : "Não",
      enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString("pt-PT") : "",
    ]);
  }
  const ws3 = XLSX.utils.aoa_to_sheet(participantesRows);
  ws3["!cols"] = [
    { wch: 28 }, { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 10 },
    { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Participantes");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `relatorio-cesae-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(buffer);
}

// ── PDF ──
async function exportPdf(res, eventos, enrollments) {
  const today = new Date().toLocaleDateString("pt-PT");
  const totalPresentes = enrollments.filter((e) => e.status === "presente").length;
  const totalAprovados = enrollments.filter((e) => e.evaluation_result === "aprovado").length;
  const totalBadges = enrollments.filter((e) => e.badge).length;
  const totalCerts = enrollments.filter((e) => e.certificate).length;

  const eventosRows = eventos
    .map(
      (ev) => {
        const enr = ev.enrollments || [];
        return `
        <tr>
          <td>${ev.title}</td>
          <td>${ev.type === "evento" ? "Evento" : "Curso"}</td>
          <td>${ev.start_date ? new Date(ev.start_date).toLocaleDateString("pt-PT") : "—"}</td>
          <td>${ev.location || "—"}</td>
          <td>${ev.duration_hours ? ev.duration_hours + "h" : "—"}</td>
          <td class="num">${enr.length}</td>
          <td class="num">${enr.filter((e) => e.status === "presente").length}</td>
          <td class="num">${enr.filter((e) => e.evaluation_result === "aprovado").length}</td>
        </tr>`;
      }
    )
    .join("");

  const participantesRows = enrollments
    .slice(0, 200)
    .map(
      (enr) => `
      <tr>
        <td>${enr.participant?.name || "—"}</td>
        <td>${enr.participant?.email || "—"}</td>
        <td>${enr.event?.title || "—"}</td>
        <td>${enr.status || "—"}</td>
        <td>${enr.evaluation_result || "—"}</td>
        <td class="num">${enr.badge ? "Sim" : "Não"}</td>
        <td class="num">${enr.certificate ? "Sim" : "Não"}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 1.5cm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #1c2833; font-size: 11px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
    .header h1 { font-size: 22px; color: #1e3a8a; margin: 0; }
    .header p { color: #6b7280; margin: 4px 0 0; font-size: 11px; }
    .date { font-size: 10px; color: #9ca3af; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px; }
    .kpi { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
    .kpi .val { font-size: 22px; font-weight: bold; color: #1e3a8a; }
    .kpi .lbl { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { font-size: 13px; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 20px 0 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #1e3a8a; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
    td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #f8fafc; }
    .num { text-align: center; }
    .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #9ca3af; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    .note { font-size: 9px; color: #9ca3af; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>CESAE Digital</h1>
      <p>Relatório de Atividade</p>
    </div>
    <span class="date">Gerado em ${today}</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="val">${eventos.filter((e) => e.type === "evento").length}</div><div class="lbl">Eventos</div></div>
    <div class="kpi"><div class="val">${eventos.filter((e) => e.type === "curso").length}</div><div class="lbl">Cursos</div></div>
    <div class="kpi"><div class="val">${totalPresentes}</div><div class="lbl">Presenças</div></div>
    <div class="kpi"><div class="val">${totalAprovados}</div><div class="lbl">Aprovados</div></div>
    <div class="kpi"><div class="val">${enrollments.length}</div><div class="lbl">Inscrições</div></div>
    <div class="kpi"><div class="val">${totalBadges}</div><div class="lbl">Badges</div></div>
    <div class="kpi"><div class="val">${totalCerts}</div><div class="lbl">Certificados</div></div>
    <div class="kpi"><div class="val">${
      enrollments.filter((e) => e.status !== "inscrito").length > 0
        ? Math.round((totalPresentes / enrollments.filter((e) => e.status !== "inscrito").length) * 100)
        : 0
    }%</div><div class="lbl">Taxa Presença</div></div>
  </div>

  <h2>Eventos e Cursos</h2>
  <table>
    <thead>
      <tr>
        <th>Título</th><th>Tipo</th><th>Data</th><th>Local</th>
        <th>Duração</th><th class="num">Inscritos</th><th class="num">Presentes</th><th class="num">Aprovados</th>
      </tr>
    </thead>
    <tbody>${eventosRows || '<tr><td colspan="8" style="text-align:center;color:#9ca3af">Sem dados</td></tr>'}</tbody>
  </table>

  <h2>Participantes</h2>
  ${enrollments.length > 200 ? `<p class="note">A mostrar os primeiros 200 de ${enrollments.length} registos. Use o formato XLSX para exportação completa.</p>` : ""}
  <table>
    <thead>
      <tr>
        <th>Nome</th><th>Email</th><th>Evento</th><th>Presença</th>
        <th>Resultado</th><th class="num">Badge</th><th class="num">Cert.</th>
      </tr>
    </thead>
    <tbody>${participantesRows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af">Sem dados</td></tr>'}</tbody>
  </table>

  <div class="footer">CESAE Digital © ${new Date().getFullYear()} — Relatório gerado automaticamente</div>
</body>
</html>`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" },
    });

    const filename = `relatorio-cesae-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { exportReport };
