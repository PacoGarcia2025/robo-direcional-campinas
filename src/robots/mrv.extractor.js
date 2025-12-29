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
  // 🔹 Clicar em "Carregar mais imóveis" até NÃO surgirem novos cards
let lastCount = 0;

while (true) {
  const result = await page.evaluate(() => {
    const cards = document.querySelectorAll('a[href*="/imoveis/"]');
    const btn = Array.from(document.querySelectorAll("button, a"))
      .find(el =>
        el.innerText &&
        el.innerText.toLowerCase().includes("carregar")
      );

    return {
      count: cards.length,
      hasButton: !!btn
    };
  });

  if (!result.hasButton || result.count === lastCount) {
    break;
  }

  lastCount = result.count;

  console.log("🔄 Carregando mais imóveis MRV...");
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button, a"))
      .find(el =>
        el.innerText &&
        el.innerText.toLowerCase().includes("carregar")
      );
    if (btn) btn.click();
  });

  await page.waitForTimeout(3000);
}


  // 🔹 Capturar cards reais
  const urls = await page.evaluate(() => {
  const links = new Set();

  // cards reais da MRV
  document.querySelectorAll("article, div").forEach(card => {
    // caso 1: link interno
    const a = card.querySelector("a");
    if (a && a.href && a.href.includes("/imoveis/") && !a.href.endsWith("/sao-paulo")) {
      links.add(a.href.split("?")[0]);
    }

    // caso 2: data-href
    const dataHref = card.getAttribute("data-href");
    if (dataHref && dataHref.includes("/imoveis/")) {
      links.add(
        dataHref.startsWith("http")
          ? dataHref
          : `https://www.mrv.com.br${dataHref}`
      );
    }

    // caso 3: onclick
    const onclick = card.getAttribute("onclick");
    if (onclick && onclick.includes("/imoveis/")) {
      const match = onclick.match(/\/imoveis\/[a-z0-9\-]+/i);
      if (match) {
        links.add(`https://www.mrv.com.br${match[0]}`);
      }
    }
  });

  return Array.from(links);
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
