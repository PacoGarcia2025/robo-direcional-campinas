/**
 * ==================================================
 * ROBÔ MRV – LISTAGEM POR ESTADO (SP)
 * PADRÃO IGUAL À DIRECIONAL
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // 🔹 Clicar em "Carregar mais imóveis" até sumir
  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;

    console.log("🔄 Carregando mais imóveis MRV...");
    await btn.click();
    await page.waitForTimeout(3000);
  }

  // 🔹 Coletar cards da listagem
  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/imoveis/"]'))
      .map(a => a.href.split("?")[0])
      .filter(href =>
        href.includes("/imoveis/") &&
        !href.endsWith("/sao-paulo")
      )
  );

  const uniqueUrls = [...new Set(cards)];
  console.log("📦 Empreendimentos MRV encontrados:", uniqueUrls.length);

  const empreendimentos = [];

  for (const url of uniqueUrls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const data = await page.evaluate(() => {
      const titulo = document.querySelector("h1")?.innerText.trim() || null;

      let cidade = null;
      let estado = "SP";

      document.querySelectorAll("p, span").forEach(el => {
        const t = el.innerText?.trim();
        if (t && t.includes(" - SP")) {
          cidade = t.replace(" - SP", "").trim();
        }
      });

      let status = null;
      document.querySelectorAll("span, li").forEach(el => {
        const t = el.innerText?.toLowerCase();
        if (
          t?.includes("lançamento") ||
          t?.includes("em obras") ||
          t?.includes("pronto")
        ) {
          status = el.innerText.trim();
        }
      });

      // Tipologias
      const tipologias = [];
      let areas = [];
      let dorms = [];

      document.querySelectorAll("li, span").forEach(el => {
        const text = el.innerText || "";

        if (text.includes("m²")) {
          areas =
            text.match(/\d+[,\.]?\d*/g)?.map(n =>
              Number(n.replace(",", "."))
            ) || [];
        }

        if (text.toLowerCase().includes("quarto")) {
          dorms = text.match(/\d+/g)?.map(Number) || [];
        }
      });

      areas.forEach(area => {
        dorms.forEach(d => {
          tipologias.push({ dormitorios: d, area });
        });
      });

      // Imagens
      const imagens = Array.from(document.images)
        .map(img => img.src)
        .filter(src =>
          src &&
          !src.includes("logo") &&
          !src.includes("icon") &&
          !src.endsWith(".svg")
        );

      return {
        titulo,
        cidade,
        estado,
        status,
        tipologias,
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
