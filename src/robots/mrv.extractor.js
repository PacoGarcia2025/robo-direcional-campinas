/**
 * ==================================================
 * ROBÔ MRV – VERSÃO FINAL (API VIA PLAYWRIGHT)
 * ==================================================
 */

import { chromium } from "playwright";

const API_URL =
  "https://www.mrv.com.br/api/portal-imoveis/v1/imoveis?pagina=1&tamanhoPagina=500";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV (API via browser)");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.mrv.com.br", {
    waitUntil: "domcontentloaded",
  });

  // Chamada da API DENTRO do contexto do navegador
  const data = await page.evaluate(async (url) => {
    const res = await fetch(url, {
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
      },
    });
    return res.json();
  }, API_URL);

  const empreendimentos = [];

  for (const item of data?.conteudo || []) {
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

  await browser.close();

  console.log(
    "✅ Empreendimentos MRV coletados:",
    empreendimentos.length
  );

  return empreendimentos;
}
