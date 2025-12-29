/**
 * ==================================================
 * ROBÔ MRV – SP (CARREGAR MAIS FUNCIONAL)
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // 🔹 Clicar em "Carregar mais" enquanto existir QUALQUER botão clicável
  while (true) {
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a, div"))
        .find(el =>
          el.innerText &&
          el.innerText.toLowerCase().includes("carregar")
        );

      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clicked) break;

    console.log("🔄 Carregando mais imóveis MRV...");
    await page.waitForTimeout(3000);
  }

  // 🔹 Capturar cards reais
  const urls = await page.evaluate(() => {
    const links = [];

    document.querySelectorAll("[data-testid], article, section").forEach(el => {
      const a = el.querySelector('a[href*="/imoveis/"]');
      if (a && a.href && !a.href.endsWith("/sao-paulo")) {
        links.push(a.href.split("?")[0]);
      }
    });

    return [...new Set(links)];
  });

  console.log("📦 Empreendimentos MRV encontrados:", urls.length);

  const empreendimentos = [];

  for (const url of urls) {
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
        if (t?.includes("lançamento") || t?.includes("obras") || t?.includes("pronto")) {
          status = el.innerText.trim();
        }
      });

      const tipologias = [];
      let areas = [];
      let dorms = [];

      document.querySelectorAll("li, span").forEach(el => {
        const text = el.innerText || "";
        if (text.includes("m²")) {
          areas = text.match(/\d+[,\.]?\d*/g)?.map(n =>
            Number(n.replace(",", "."))
          ) || [];
        }
        if (text.toLowerCase().includes("quarto")) {
          dorms = text.match(/\d+/g)?.map(Number) || [];
        }
      });

      areas.forEach(area => {
        dorms.forEach(d => tipologias.push({ dormitorios: d, area }));
      });

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
