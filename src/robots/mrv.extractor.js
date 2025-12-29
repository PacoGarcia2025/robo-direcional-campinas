/**
 * ==================================================
 * ROBÔ MRV – VERSÃO FINAL CONGELADA
 * NÃO ALTERAR
 *
 * Extração baseada em inspeção REAL do HTML da MRV
 * Tipologia, diferenciais e fotos separados corretamente
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

  // ==================================================
  // 🔹 CARREGAR TODOS OS IMÓVEIS (SEM LOOP INFINITO)
  // ==================================================
  let lastCount = 0;
  let stableRounds = 0;

  while (stableRounds < 3) {
    const { count, hasButton } = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/imoveis/"]');
      const btn = Array.from(document.querySelectorAll("button"))
        .find(b => b.innerText?.toLowerCase().includes("carregar"));

      return { count: cards.length, hasButton: !!btn };
    });

    if (!hasButton || count === lastCount) {
      stableRounds++;
    } else {
      stableRounds = 0;
      lastCount = count;

      console.log("🔄 Carregando mais imóveis MRV...");
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button"))
          .find(b => b.innerText?.toLowerCase().includes("carregar"));
        if (btn) btn.click();
      });

      await page.waitForTimeout(3000);
    }
  }

  // ==================================================
  // 🔹 CAPTURAR LINKS ÚNICOS DOS EMPREENDIMENTOS
  // ==================================================
  const urls = await page.evaluate(() => {
    const links = new Set();

    document.querySelectorAll("a[href*='/imoveis/']").forEach(a => {
      if (!a.href.endsWith("/sao-paulo")) {
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
  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);

    const data = await page.evaluate(() => {
      // ===============================
      // TÍTULO
      // ===============================
      const titulo = document.querySelector("h1")?.innerText.trim() || null;

      // ===============================
      // STATUS
      // ===============================
      let status = null;
      document.querySelectorAll("span").forEach(el => {
        const t = el.innerText?.toLowerCase();
        if (
          t &&
          (t.includes("lançamento") ||
            t.includes("em construção") ||
            t.includes("pronto") ||
            t.includes("pré-lançamento") ||
            t.includes("breve"))
        ) {
          status = el.innerText.trim();
        }
      });

      // ===============================
      // CIDADE / ESTADO (FICHA TÉCNICA)
      // ===============================
      let cidade = null;
      let estado = "SP";

      document.querySelectorAll("#fichatecnica p").forEach(p => {
        const txt = p.innerText;
        if (txt.includes("/SP")) {
          cidade = txt.split("/SP")[0].replace("Apartamentos em", "").trim();
        }
      });

      // ===============================
      // DIFERENCIAIS (LinhaProduto)
      // ===============================
      const diferenciais = Array.from(
        document.querySelectorAll("img[src*='/LinhaProduto/']")
      )
        .map(img => img.alt?.trim())
        .filter(Boolean);

      // ===============================
      // TIPOLOGIAS (FICHA TÉCNICA)
      // ===============================
      const tipologias = [];

      document
        .querySelectorAll("#fichatecnica ul li")
        .forEach(li => {
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

      // ===============================
      // FOTOS REAIS (IMAGENS)
      // ===============================
      const fotos = Array.from(
        document.querySelectorAll("img[src*='/imoveis/upload/imagens/']")
      )
        .map(img => img.src)
        .filter(Boolean);

      return {
        titulo,
        cidade,
        estado,
        status,
        tipologias,
        diferenciais,
        fotos: [...new Set(fotos)]
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
