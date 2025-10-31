// server/email.js
import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

// Inicializa o cliente Resend com a chave de API
const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarEmail(editais, filtros) {
  if (!editais.length) return console.log("Nenhum edital encontrado hoje.");

  const dataHoje = new Date().toLocaleDateString("pt-BR");

  // Trata filtros de forma segura
  const filtrosTexto = `
    <b>Palavras incluídas:</b> ${(filtros.q_incluir && filtros.q_incluir.length ? filtros.q_incluir.join(", ") : "Nenhuma")}<br>
    <b>Palavras excluídas:</b> ${(filtros.q_excluir && filtros.q_excluir.length ? filtros.q_excluir.join(", ") : "Nenhuma")}<br>
    <b>UF:</b> ${(filtros.uf && filtros.uf.length ? filtros.uf.join(", ") : "Todas")}
  `;

  const html = `
    <h2>Radar de Editais - Enprol Engenharia</h2>
    <p>${filtrosTexto}</p>
    <hr>
    ${editais.map(e => `
      <div style="margin-bottom:15px;">
        <h3>${e.titulo}</h3>
        <p><b>Município:</b> ${e.municipio}</p>
        <p><b>Última atualização:</b> ${dataHoje}</p>
        <p><b>Abertura:</b> ${new Date(e.abertura).toLocaleString("pt-BR")}</p>
        <p><b>Encerramento:</b> ${new Date(e.encerramento).toLocaleString("pt-BR")}</p>
        <p>${e.descricao}</p>
        <a href="${e.link}" target="_blank">🔗 Acessar Edital</a>
      </div>
      <hr>
    `).join("")}
  `;

  await resend.emails.send({
    from: "Radar Enprol <onboarding@resend.dev>",
    to: ["misaelrodriguesoficial@gmail.com"],
    subject: "📰 Relatório diário de editais",
    html
  });

  console.log("📩 E-mail enviado com sucesso!");
}
