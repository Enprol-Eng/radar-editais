// server/email.js
import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// Use este remetente imediato (sem verificar domínio).
// Quando verificar o domínio enprol.com.br no Resend, troque para algo como:
// const FROM = 'Radar Enprol <no-reply@enprol.com.br>';
const FROM = process.env.RESEND_FROM || "Radar Enprol <onboarding@resend.dev>";

function fmtData(val) {
  try {
    if (!val) return "(não informado)";
    const d = new Date(val);
    if (isNaN(d)) return "(não informado)";
    return d.toLocaleString("pt-BR");
  } catch {
    return "(não informado)";
  }
}

export async function enviarEmail(editais, filtros) {
  if (!Array.isArray(editais) || editais.length === 0) {
    console.log("⚠️ Nenhum edital encontrado hoje.");
    // Se preferir, pode enviar mesmo assim avisando que não houve resultados.
    return { sent: false, reason: "sem_resultados" };
  }

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const filtrosTexto = `
    <b>Palavras incluídas:</b> ${
      filtros?.q_incluir?.length ? filtros.q_incluir.join(", ") : "Nenhuma"
    }<br>
    <b>Palavras excluídas:</b> ${
      filtros?.q_excluir?.length ? filtros.q_excluir.join(", ") : "Nenhuma"
    }<br>
    <b>UF:</b> ${filtros?.uf?.length ? filtros.uf.join(", ") : "Todas"}<br>
    <b>Status:</b> ${filtros?.status || "Receber/Recebendo Proposta"}
  `;

  const html = `
    <h2 style="color:#0D3755;">Radar de Editais - Enprol Engenharia</h2>
    <p>${filtrosTexto}</p>
    <hr>
    ${editais
      .map(
        (e) => `
      <div style="margin-bottom:15px; font-family:Segoe UI, sans-serif;">
        <h3 style="color:#0D3755;margin:0 0 6px;">${e.titulo || "(sem título)"}</h3>
        <p style="margin:2px 0;"><b>Município:</b> ${e.municipio || "(não informado)"}</p>
        <p style="margin:2px 0;"><b>Última atualização:</b> ${dataHoje}</p>
        <p style="margin:2px 0;"><b>Abertura:</b> ${fmtData(e.abertura)}</p>
        <p style="margin:2px 0;"><b>Encerramento:</b> ${fmtData(e.encerramento)}</p>
        <p style="margin:6px 0 8px 0;">${e.descricao || ""}</p>
        <a href="${e.link || "#"}" target="_blank" style="color:#0D3755; text-decoration:none;">🔗 Acessar Edital</a>
      </div>
      <hr>
    `
      )
      .join("")}
    <p style="font-size:0.85rem; color:#555;">
      E-mail automático — Enprol Engenharia e Projetos Ltda.
    </p>
  `;

  try {
    const resp = await resend.emails.send({
      from: FROM, // <- importante!
      to: ["misaelrodriguesoficial@gmail.com"], // adicione mais se quiser
      subject: "📰 Relatório diário de editais",
      html,
    });

    // Resend responde com id/estado; log útil pra depurar
    console.log("📩 Resend retorno:", resp);
    return { sent: true, provider: "resend", resp };
  } catch (err) {
    // Mostra motivo detalhado no log do servidor
    console.error("❌ Erro ao enviar e-mail (Resend):", err?.message || err);
    if (err?.response?.data) {
      console.error("Detalhes:", JSON.stringify(err.response.data, null, 2));
    }
    return { sent: false, error: err?.message || "erro_desconhecido" };
  }
}
