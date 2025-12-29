/**
 * ==================================================
 * ROBÔ MRV – VERSÃO FINAL CONGELADA (CORRIGIDA)
 * NÃO ALTERAR
 *
 * Correções:
 * - Removido networkidle (travava na MRV)
 * - Logs de progresso
 * - Timeout de segurança
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // ⛔ NÃO usar networkidle aqui
  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });
  await page.waitForTimeout(3000);

  // ==================================================
  // 🔹 CARREGAR TODOS OS IMÓVEIS (SEGURO)
  // ==================================================
  let lastCount = 0;
  let stableTries = 0;

  while (true) {
    const count = await page.evaluate(() =>
      document.querySelectorAll('a[href*="/imoveis/"]').length
    );

    if (count === lastCount) {
      stableTries++;
    } else {
      stableTries = 0;
      lastCount = count;
    }

    if (stableTries >= 3) {
      console.log("🛑 Nenhum novo imóvel carregado. Parando.");
      break;
    }

    console.log("🔄 Carregando mais imóveis MRV...");

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a"))
        .find(el => el.innerText?.toLowerCase().includes("carregar"));
      if (btn) btn.click();
    });

    await page.waitForTimeout(3000);
  }

  // ==================================================
  // 🔹 CAPTURAR LINKS DOS EMPREENDIMENTOS
  // ==================================================
  const urls = await page.evaluate(() => {
    const links = new Set();

    document.querySelectorAll("a").forEach(a => {
      if (
        a.href &&
        a.href.includes("/imoveis/") &&
        !a.href.endsWith("/sao-paulo")
      ) {
        links.add(a.href.split("?")[0]);
      }
    });

    return Array.from(links);
  });

  console.log("📦 Empreendimentos MRV encontrados:", urls.length);

  const empreendimentos = [];

  // ==================================================
  // 🔹 LOOP NOS EMPREENDIMENTOS
  // ==================================================
  let index = 0;

  for (const url of urls) {
    index++;
    console.log(`➡️ (${index}/${urls.length}) Abrindo imóvel:` , url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      // ===============================
      // TÍTULO
      // ===============================
      const titulo =
        document.querySelector("#header-imovel .highlight-title")
          ?.innerText.trim() || null;

      // ===============================
      // STATUS
      // ===============================
      const status =
        document.querySelector("#header-imovel .highlight-label")
          ?.innerText.trim() || null;

      // ===============================
      // CIDADE / ESTADO
      // ===============================
      let cidade = null;
      let estado = "SP";

      const localEl = Array.from(
        document.querySelectorAll(".property-details-text")
      ).find(el => el.innerText.includes(" - "));

      if (localEl) {
        const text = localEl.innerText.trim(); // Araçatuba - São Paulo
        cidade = text.split("-")[0].trim();
      }

      // ===============================
      // DIFERENCIAIS
      // ===============================
      const diferenciais = Array.from(
        document.querySelectorAll(".sc-jQybuE ul li span")
      )
        .map(el => el.innerText.trim())
        .filter(Boolean);

      // ===============================
      // FICHA TÉCNICA
      // ===============================
      const ficha_tecnica = {};

      const subtitles = Array.from(
        document.querySelectorAll("#fichatecnica .accordion-subtitle")
      );

      subtitles.forEach(sub => {
        const key = sub.innerText.replace(":", "").trim();
        const valueEl = sub.nextElementSibling;

        if (valueEl && valueEl.tagName === "P") {
          ficha_tecnica[key] = valueEl.innerText.trim();
        }
      });

      // ===============================
      // TIPOLOGIAS (COM ÁREA REAL)
      // ===============================
      const tipologias = [];

      const tipologiaList = document.querySelector("#fichatecnica ul");

      if (tipologiaList) {
        tipologiaList.querySelectorAll("li").forEach(li => {
          const text = li.innerText;

          const dorm = text.match(/(\d+)\s*Quartos?/i)?.[1];
          const area = text.match(/([\d.,]+)\s*m²/i)?.[1];

          if (dorm && area) {
            tipologias.push({
              dormitorios: Number(dorm),
              area: Number(area.replace(",", "."))
            });
          }
        });
      }

      // ===============================
      // IMAGENS (LIMPO)
      // ===============================
      const imagens = Array.from(document.images)
        .map(img => img.src)
        .filter(src =>
          src &&
          src.includes("/imoveis/upload/") &&
          !src.endsWith(".svg") &&
          !src.toLowerCase().includes("logo")
        );

      return {
        titulo,
        cidade,
        estado,
        status,
        tipologias,
        diferenciais,
        ficha_tecnica,
        imagens: [...new Set(imagens)]
      };
    });

    empreendimentos.push({
      id: url.split("/").filter(Boolean).pop(),
      url,
      ...data
    });
  }

  await browser.close();

  console.log("✅ Empreendimentos MRV coletados:", empreendimentos.length);
  return empreendimentos;
}
