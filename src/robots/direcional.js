// ============================================
// ARQUIVO: src/robots/direcional.js
// ROBÔ PRINCIPAL – DIRECIONAL CAMPINAS
// ============================================

import fs from "fs";
import { chromium } from "playwright";
import { extractDirecional } from "./direcional.extractor.js";

const OUTPUT = "src/output/direcional-campinas.json";

export default async function runDirecional() {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  console.log("🤖 Iniciando Robô Direcional Campinas");

  await page.goto(
    "https://www.direcional.com.br/empreendimentos",
    { waitUntil: "networkidle", timeout: 60000 }
  );

  // ===============================
  // CARREGAR TODOS OS CARDS
  // ===============================
  while (true) {
    const btn = await page.$("#load-more-empreendimentos");
    if (!btn) break;

    const visible = await btn.isVisible();
    if (!visible) break;

    console.log("➡️ Clicando em 'Carregar mais'");
    await btn.click();
    await page.waitForTimeout(1500);
  }

  console.log("✅ Todos os cards carregados");

  // ===============================
  // COLETAR LINKS ÚNICOS
  // ===============================
  const links = await page.$$eval(
    "a[href*='/empreendimentos/']",
    els => [...new Set(els.map(e => e.href))]
  );

  console.log(`🔗 ${links.length} links encontrados`);

  const results = [];

  for (const link of links) {
    try {
      const data = await extractDirecional(page, link);

      if (data?.location?.state !== "SP") continue;

      const cidadesValidas = [
        "Campinas",
        "Sumaré",
        "Hortolândia",
        "Monte Mor",
        "Valinhos",
        "Paulínia",
        "Americana",
        "Vinhedo",
        "Indaiatuba",
        "Nova Odessa",
        "Santa Bárbara",
        "Piracicaba",
        "Limeira",
      ];

      if (!cidadesValidas.includes(data.location.city)) continue;

      results.push(data);
      console.log("✔️ Adicionado:", data.title);
    } catch (err) {
      console.warn("⚠️ Erro ao extrair:", link);
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2));
  console.log("💾 JSON salvo em:", OUTPUT);

  await browser.close();
  return results;
}
