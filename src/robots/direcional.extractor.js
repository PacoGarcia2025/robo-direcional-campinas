// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// TESTE DE LISTAGEM – CARREGAR MAIS
// OBJETIVO: carregar TODOS os cards
// ===============================

import { chromium } from "playwright";

const START_URL =
  "https://www.direcional.com.br/encontre-seu-apartamento/";

export default async function extractDirecional() {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  console.log("🚀 Abrindo página de listagem Direcional");

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // ===============================
  // LOOP: CLICAR EM "CARREGAR MAIS"
  // ===============================
  let clicks = 0;

  while (true) {
    try {
      const button = await page.$(
        'button:has-text("Carregar mais")'
      );

      if (!button) {
        console.log("✅ Botão 'Carregar mais' não encontrado. Fim.");
        break;
      }

      console.log(`👉 Clicando em 'Carregar mais' (${clicks + 1})`);
      await button.click();

      clicks++;

      // espera novos cards carregarem
      await page.waitForTimeout(3000);
    } catch (err) {
      console.log("⚠️ Erro ou fim do botão:", err.message);
      break;
    }
  }

  // ===============================
  // CONTAR CARDS
  // ===============================
  const totalCards = await page.evaluate(() => {
    return document.querySelectorAll(
      'a[href*="/empreendimentos/"]'
    ).length;
  });

  console.log("📦 Total de cards encontrados:", totalCards);

  // ===============================
  // EXTRAIR LINKS
  // ===============================
  const links = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('a[href*="/empreendimentos/"]')
    )
      .map((a) => a.href.split("#")[0])
      .filter(
        (href) =>
          href.includes("/empreendimentos/") &&
          href.split("/empreendimentos/")[1]?.length > 3
      );
  });

  const uniqueLinks = [...new Set(links)];

  console.log("🔗 Total de links únicos:", uniqueLinks.length);

  // 🔴 IMPORTANTE: por enquanto, NÃO entra nos links
  await browser.close();

  return [];
}
