// server/app.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import cron from "node-cron";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { buscarEditaisPNCP } from "./pncp.js";
import { enviarEmail } from "./email.js";

// ===== Configuração base =====
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// ===== JSONBin Config =====
const JSONBIN_URL = process.env.JSONBIN_URL;
const JSONBIN_KEY = process.env.JSONBIN_KEY;

// ===== Funções utilitárias para ler/gravar config =====
async function lerConfiguracao() {
  try {
    if (!JSONBIN_URL || !JSONBIN_KEY) {
      console.warn("⚠️ JSONBin não configurado — usando config local.");
      const localPath = path.join(__dirname, "config.json");
      if (!fs.existsSync(localPath)) return {};
      return JSON.parse(fs.readFileSync(localPath));
    }

    const res = await fetch(JSONBIN_URL, {
      headers: { "X-Master-Key": JSONBIN_KEY }
    });
    const data = await res.json();
    return data.record || {};
  } catch (err) {
    console.error("❌ Erro ao ler JSONBin:", err.message);
    return {};
  }
}

async function salvarConfiguracao(novaConfig) {
  try {
    if (!JSONBIN_URL || !JSONBIN_KEY) {
      console.warn("⚠️ JSONBin não configurado — salvando localmente.");
      const localPath = path.join(__dirname, "config.json");
      fs.writeFileSync(localPath, JSON.stringify(novaConfig, null, 2));
      return;
    }

    await fetch(JSONBIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_KEY
      },
      body: JSON.stringify(novaConfig)
    });

    console.log("✅ Configurações salvas no JSONBin.");
  } catch (err) {
    console.error("❌ Erro ao salvar JSONBin:", err.message);
  }
}

// ===== Rota: salvar filtros =====
app.post("/configurar", async (req, res) => {
  const {
    q_incluir = [],
    q_excluir = [],
    uf = ["Todos"],
    status = "Receber/Recebendo Proposta"
  } = req.body;

  const config = { q_incluir, q_excluir, uf, status };
  await salvarConfiguracao(config);

  console.log("🟢 Configurações atualizadas:");
  console.log("   ➤ Incluir:", q_incluir.join(", ") || "(nenhuma)");
  console.log("   ➤ Excluir:", q_excluir.join(", ") || "(nenhuma)");
  console.log("   ➤ Estados:", uf.join(", ") || "(nenhum)");
  console.log("   ➤ Status:", status);
  console.log("-------------------------------------------");

  res.json({ status: "ok", message: "Configurações salvas com sucesso" });
});

// ===== Rota: consultar filtros =====
app.get("/configuracao", async (req, res) => {
  const data = await lerConfiguracao();
  res.json(data);
});

// ===== Enviar e-mail manualmente =====
app.get("/enviar-agora", async (req, res) => {
  try {
    console.log("📤 Enviando e-mail manualmente...");
    const filtros = await lerConfiguracao();
    const resultados = await buscarEditaisPNCP(filtros);
    await enviarEmail(resultados, filtros);
    console.log("✅ E-mail enviado manualmente com sucesso!");
    res.json({ status: "ok" });
  } catch (err) {
    console.error("❌ Erro ao enviar e-mail:", err.message);
    res.status(500).json({ error: "Falha ao enviar e-mail." });
  }
});

// ===== CRON: Envio automático (segunda a sexta às 10h) =====
cron.schedule(
  "0 10 * * 1-5",
  async () => {
    console.log("⏰ Executando rotina diária de editais...");
    const filtros = await lerConfiguracao();
    const resultados = await buscarEditaisPNCP(filtros);
    await enviarEmail(resultados, filtros);
  },
  { timezone: "America/Sao_Paulo" }
);

// ===== Servidor HTTP =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));

// Servir arquivos estáticos da raiz (frontend)
const frontPath = path.join(__dirname, "../");
app.use(express.static(frontPath));

// Redirecionar rota raiz para index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontPath, "index.html"));
});

