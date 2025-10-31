// server/app.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";
import { buscarEditaisPNCP } from "./pncp.js";
import { enviarEmail } from "./email.js";

// ===== Configuração base =====
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// Caminho local onde as configurações serão salvas
// (dentro da própria pasta /server, persistente enquanto o app rodar)
const configPath = path.join(__dirname, "config.json");

// Garante que o arquivo de configuração exista
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      {
        q_incluir: [],
        q_excluir: [],
        uf: ["Todos"],
        status: "Receber/Recebendo Proposta"
      },
      null,
      2
    )
  );
  console.log("🆕 Arquivo config.json criado com valores padrão.");
}

// ===== Rota para salvar filtros vindos do front-end =====
app.post("/configurar", (req, res) => {
  const {
    q_incluir = [],
    q_excluir = [],
    uf = [],
    status = "Receber/Recebendo Proposta"
  } = req.body;

  fs.writeFileSync(
    configPath,
    JSON.stringify({ q_incluir, q_excluir, uf, status }, null, 2)
  );

  console.log("🟢 Configurações atualizadas:");
  console.log("   ➤ Incluir:", q_incluir.join(", ") || "(nenhuma)");
  console.log("   ➤ Excluir:", q_excluir.join(", ") || "(nenhuma)");
  console.log("   ➤ Estados:", uf.join(", ") || "(nenhum)");
  console.log("   ➤ Status:", status || "(padrão)");
  console.log("-------------------------------------------");

  res.json({ status: "ok", message: "Configurações salvas com sucesso" });
});

// ===== Rota para consultar filtros atuais =====
app.get("/configuracao", (req, res) => {
  try {
    if (!fs.existsSync(configPath))
      return res.json({
        q_incluir: [],
        q_excluir: [],
        uf: ["Todos"],
        status: "Receber/Recebendo Proposta"
      });

    const data = JSON.parse(fs.readFileSync(configPath));
    res.json(data);
  } catch (err) {
    console.error("❌ Erro ao ler config.json:", err.message);
    res.status(500).json({ error: "Erro ao ler configurações." });
  }
});

// ===== Envio manual de e-mail =====
app.get("/enviar-agora", async (req, res) => {
  try {
    console.log("📤 Iniciando envio manual de e-mail...");

    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: "Arquivo de configuração não encontrado." });
    }

    const filtros = JSON.parse(fs.readFileSync(configPath));
    const resultados = await buscarEditaisPNCP(filtros);

    await enviarEmail(resultados, filtros);

    console.log("✅ E-mail enviado manualmente com sucesso!");
    res.json({ status: "ok", message: "E-mail enviado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err.message);
    res.status(500).json({ error: "Erro ao enviar e-mail." });
  }
});

// ===== CRON: Executa de segunda a sexta às 10h =====
cron.schedule(
  "0 10 * * 1-5",
  async () => {
    console.log("⏰ Executando rotina diária de editais...");
    if (!fs.existsSync(configPath)) return;

    const filtros = JSON.parse(fs.readFileSync(configPath));
    const resultados = await buscarEditaisPNCP(filtros);
    await enviarEmail(resultados, filtros);
  },
  { timezone: "America/Sao_Paulo" }
);

// ===== Inicialização do servidor HTTP =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
