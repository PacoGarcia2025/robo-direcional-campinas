/**
 * ==================================================
 * ROBÔ MRV – VERSÃO CORRETA (API)
 * ==================================================
 */

import fetch from "node-fetch";

const API_URL =
  "https://www.mrv.com.br/api/portal-imoveis/v1/imoveis?pagina=1&tamanhoPagina=500";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV (API)");

  const res = await fetch(API_URL);
  const json = await res.json();

  const empreendimentos = [];

  for (const item of json?.conteudo || []) {
    empreendimentos.push({
      id: item.slug || item.id,
      url: `https://www.mrv.com.br/imoveis/${item.slug}`,
      titulo: item.nome || null,
      cidade: item.cidade || null,
      estado: item.uf || null,
      status: item.status || null,

      tipologias: (item.tipologias || []).map(t => ({
        dormitorios: t.dormitorios,
        area: t.areaPrivativa
      })),

      imagens: (item.imagens || [])
        .map(img => img.url)
        .filter(Boolean)
    });
  }

  console.log(
    "✅ Empreendimentos MRV coletados:",
    empreendimentos.length
  );

  return empreendimentos;
}
