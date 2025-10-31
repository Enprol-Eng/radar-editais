// ===== VARIÁVEIS =====
const listaIncluir = document.getElementById("listaIncluir");
const listaExcluir = document.getElementById("listaExcluir");
const listaEstados = document.getElementById("listaEstados");
const inputIncluir = document.getElementById("inputIncluir");
const inputExcluir = document.getElementById("inputExcluir");
const inputEstado = document.getElementById("inputEstado");
const inputStatus = document.getElementById("inputStatus");
const statusAtual = document.getElementById("statusAtual");
const msg = document.getElementById("msgRetorno");

let q_incluir = [];
let q_excluir = [];
let uf = [];
let status = "Receber/Recebendo Proposta"; // padrão

// ===== CARREGAR CONFIGURAÇÃO EXISTENTE =====
async function carregarConfiguracao() {
  try {
    const res = await fetch("http://localhost:3000/configuracao");
    const data = await res.json();

    q_incluir = data.q_incluir || [];
    q_excluir = data.q_excluir || [];
    uf = data.uf || [];
    status = data.status || "Receber/Recebendo Proposta";

    inputStatus.value = status;
    atualizarStatusIndicador();
    renderListas();
  } catch (error) {
    console.error("Erro ao carregar configuração:", error);
  }
}

// ===== RENDERIZA LISTAS =====
function renderListas() {
  listaIncluir.innerHTML = q_incluir
    .map((p, i) => `<li>${p}<button onclick="remover('incluir', ${i})">×</button></li>`)
    .join("");

  listaExcluir.innerHTML = q_excluir
    .map((p, i) => `<li>${p}<button onclick="remover('excluir', ${i})">×</button></li>`)
    .join("");

  listaEstados.innerHTML = uf
    .map((e, i) => `<li>${e}<button onclick="remover('uf', ${i})">×</button></li>`)
    .join("");
}

// ===== REMOVER ITENS =====
function remover(tipo, i) {
  if (tipo === "incluir") q_incluir.splice(i, 1);
  if (tipo === "excluir") q_excluir.splice(i, 1);
  if (tipo === "uf") uf.splice(i, 1);
  renderListas();
}

// ===== ADICIONAR PALAVRAS =====
document.getElementById("addIncluir").addEventListener("click", () => {
  const val = inputIncluir.value.trim();
  if (val && !q_incluir.includes(val)) {
    q_incluir.push(val);
    inputIncluir.value = "";
    renderListas();
  }
});

document.getElementById("addExcluir").addEventListener("click", () => {
  const val = inputExcluir.value.trim();
  if (val && !q_excluir.includes(val)) {
    q_excluir.push(val);
    inputExcluir.value = "";
    renderListas();
  }
});

// ===== ADICIONAR ESTADOS =====
document.getElementById("addEstado").addEventListener("click", () => {
  const val = inputEstado.value;

  if (val === "Todos") {
    uf = ["Todos"];
  } else if (val && !uf.includes(val)) {
    // Remove "Todos" se já estava selecionado
    uf = uf.filter(u => u !== "Todos");
    uf.push(val);
  }

  inputEstado.value = "";
  renderListas();
});

// ===== STATUS =====
inputStatus.addEventListener("change", () => {
  status = inputStatus.value;
  atualizarStatusIndicador();
});

function atualizarStatusIndicador() {
  const cores = {
    "Receber/Recebendo Proposta": "🟢",
    "Em Julgamento/Propostas Encerradas": "🔵",
    "Encerradas": "🔴",
    "Todos": "⚪"
  };
  statusAtual.innerHTML = `${cores[status] || "⚪"} ${status}`;
}

// ===== SALVAR CONFIGURAÇÃO =====
document.getElementById("btnSalvar").addEventListener("click", async () => {
  // Se não houver estados, assume "Todos"
  const estadosFinal = uf.length ? uf : ["Todos"];
  const body = { q_incluir, q_excluir, uf: estadosFinal, status };

  try {
    const res = await fetch("http://localhost:3000/configurar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    mostrarMensagem("✅ " + data.message);
  } catch (error) {
    mostrarMensagem("❌ Erro ao salvar configurações.");
  }
});

// ===== ENVIAR E-MAIL DE TESTE =====
document.getElementById("btnTestar").addEventListener("click", async () => {
  mostrarMensagem("⏳ Enviando e-mail de teste...");

  try {
    const res = await fetch("http://localhost:3000/enviar-agora");
    const data = await res.json();

    if (data.status === "ok") mostrarMensagem("📩 E-mail de teste enviado com sucesso!");
    else mostrarMensagem("❌ Falha ao enviar e-mail de teste.");
  } catch (error) {
    mostrarMensagem("❌ Erro ao conectar com o servidor.");
  }
});

// ===== EXIBIR MENSAGEM =====
function mostrarMensagem(txt) {
  msg.textContent = txt;
  setTimeout(() => (msg.textContent = ""), 4000);
}

// ===== INICIALIZA =====
carregarConfiguracao();
