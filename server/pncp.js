// server/pncp.js
import axios from "axios";

export async function buscarEditaisPNCP({ q_incluir = [], q_excluir = [], uf = [] }) {
  const params = new URLSearchParams();
  q_incluir.forEach(p => params.append("q", p));
  uf.forEach(e => params.append("uf", e));
  params.append("tipos_documento", "edital");
  params.append("ordenacao", "-data");
  params.append("tam_pagina", "10");

  const url = `https://pncp.gov.br/api/search/?${params.toString()}`;
  const { data } = await axios.get(url);

  let resultados = data.items?.map(item => ({
    titulo: item.title,
    municipio: `${item.municipio_nome} - ${item.uf}`,
    abertura: item.data_atualizacao_pncp,
    encerramento: item.data_fim_vigencia,
    descricao: item.description,
    link: `https://pncp.gov.br${item.item_url.replace('/app/compras/', '/app/editais/').replace('/compras/', '/app/editais/')}`
  })) || [];

  // Filtro de exclusão aplicado localmente
  if (q_excluir.length > 0) {
    resultados = resultados.filter(item =>
      !q_excluir.some(palavraNeg => {
        const texto = `${item.titulo} ${item.descricao}`.toLowerCase();
        return texto.includes(palavraNeg.toLowerCase());
      })
    );
  }

  return resultados;
}

