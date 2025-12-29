/**
 * ==================================================
 * ROBÔ MRV – VERSÃO FINAL ACERTIVA
 * BASEADO EM HTML REAL INSPECIONADO
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  // ==================================================
  // 🔹 CARREGAR TODOS OS IMÓVEIS (SEM LOOP INFINITO)
  // ==================================================
  let lastCount = 0;
  let sameCountTimes = 0;

  while (true) {
    const { count, hasButton } = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/imoveis/"]');
      const btn = Array.from(document.querySelectorAll("button"))
        .find(b => b.innerText?.toLowerCase().includes("carregar"));
      return { count: cards.length, hasButton: !!btn };
    });

    if (!hasButton || count === lastCount) {
      sameCountTimes++;
    } else {
      sameCountTimes = 0;
    }

    if (sameCountTimes >= 2) break;

    lastCount = count;

    console.log("🔄 Carregando mais imóveis MRV...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find(b => b.innerText?.toLowerCase().includes("carregar"));
      if (btn) btn.click();
    });

    await page.waitForTimeout(3000);
  }

  // ==================================================
  // 🔹 CAPTURAR LINKS DOS EMPREENDIMENTOS
  // ==================================================
  const urls = await page.evaluate(() => {
    return Array.from(
      new Set(
        Array.from(document.querySelectorAll("a"))
          .map(a => a.href)
          .filter(h =>
            h &&
            h.includes("/imoveis/") &&
            !h.endsWith("/sao-paulo")
          )
      )
    );
  });

  console.log("📦 Empreendimentos MRV encontrados:", urls.length);

  const empreendimentos = [];

  // ==================================================
  // 🔹 LOOP DOS EMPREENDIMENTOS
  // ==================================================
  for (const url of urls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // força render do React
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // abre ficha técnica
    await page.evaluate(() => {
      const btn = document.querySelector('#fichatecnica [role="button"]');
      if (btn && btn.getAttribute("aria-expanded") !== "true") btn.click();
    });

    // abre diferenciais
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find(b => b.innerText?.toLowerCase().includes("ver todos"));
      if (btn) btn.click();
    });

    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
      // ===============================
      // TÍTULO / STATUS
      // ===============================
      const titulo =
        document.querySelector("#header-imovel .highlight-title")
          ?.innerText.trim() || null;

      const status =
        document.querySelector("#header-imovel .highlight-label")
          ?.innerText.trim() || null;

      // ===============================
      // CIDADE / ESTADO
      // ===============================
      let cidade = null;
      let estado = "SP";

      const loc = Array.from(
        document.querySelectorAll(".property-details-text")
      ).find(el => el.innerText.includes("-"));

      if (loc) {
        cidade = loc.innerText.split("-")[0].trim();
      }

      // ===============================
      // DIFERENCIAIS
      // ===============================
      const diferenciais = Array.from(
        document.querySelectorAll("#diferenciais ul li span")
      )
        .map(el => el.innerText.trim())
        .filter(Boolean);

      // ===============================
      // FICHA TÉCNICA
      // ===============================
      const ficha_tecnica = {};

      document
        .querySelectorAll("#fichatecnica .accordion-subtitle")
        .forEach(sub => {
          const key = sub.innerText.replace(":", "").trim();
          const valueEl = sub.nextElementSibling;
          if (valueEl && valueEl.tagName === "P") {
            ficha_tecnica[key] = valueEl.innerText.trim();
          }
        });

      // ===============================
      // TIPOLOGIAS
      // ===============================
      const tipologias = [];

      const tipologiaList =
        document.querySelector("#fichatecnica ul");

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
          !src.toLowerCase().includes("logo") &&
          !src.toLowerCase().includes("icon")
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
