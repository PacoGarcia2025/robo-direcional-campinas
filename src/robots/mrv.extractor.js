/**
 * ==================================================
 * ROBÔ MRV – VERSÃO FINAL ESTÁVEL (CI + LOCAL)
 * NÃO USAR networkidle
 *
 * ✔ Funciona no GitHub Actions
 * ✔ Coleta cidade / estado
 * ✔ Coleta tipologias (dormitórios + área)
 * ✔ Coleta diferenciais do condomínio
 * ✔ Ignora páginas inválidas (ex: /lojas)
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  // ==================================================
  // 🔹 CARREGAR TODOS OS CARDS
  // ==================================================
  let lastCount = 0;

  while (true) {
    const { count, hasButton } = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/imoveis/"]');
      const btn = Array.from(document.querySelectorAll("button, a"))
        .find(el => el.innerText?.toLowerCase().includes("carregar"));

      return {
        count: cards.length,
        hasButton: !!btn
      };
    });

    if (!hasButton || count === lastCount) break;
    lastCount = count;

    console.log("🔄 Carregando mais imóveis MRV...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a"))
        .find(el => el.innerText?.toLowerCase().includes("carregar"));
      if (btn) btn.click();
    });

    await page.waitForTimeout(3000);
  }

  // ==================================================
  // 🔹 COLETAR LINKS DOS EMPREENDIMENTOS
  // ==================================================
  const urls = await page.evaluate(() => {
    const links = new Set();

    document.querySelectorAll("a[href]").forEach(a => {
      const href = a.href.split("?")[0];
      if (
        href.includes("/imoveis/") &&
        !href.endsWith("/sao-paulo") &&
        !href.includes("/lojas")
      ) {
        links.add(href);
      }
    });

    return Array.from(links);
  });

  console.log("📦 Empreendimentos MRV encontrados:", urls.length);

  const empreendimentos = [];

  // ==================================================
  // 🔹 LOOP DOS EMPREENDIMENTOS
  // ==================================================
  for (const url of urls) {
    console.log("➡️ Visitando:", url);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });

      await page.waitForTimeout(2500);

      const data = await page.evaluate(() => {
        // -------------------------------
        // TÍTULO
        // -------------------------------
        const titulo =
          document.querySelector("#header-imovel h1")
            ?.innerText.trim() ||
          document.querySelector("h1")
            ?.innerText.trim() ||
          null;

        // -------------------------------
        // STATUS
        // -------------------------------
        const status =
          document.querySelector("#header-imovel .highlight-label")
            ?.innerText.trim() ||
          document.querySelector('[class*="label"]')
            ?.innerText.trim() ||
          null;

        // -------------------------------
        // CIDADE / ESTADO
        // -------------------------------
        let cidade = null;
        let estado = "SP";

        const breadcrumb = Array.from(
          document.querySelectorAll("nav a, .breadcrumb a")
        ).map(el => el.innerText.trim());

        if (breadcrumb.length >= 2) {
          cidade = breadcrumb[breadcrumb.length - 1];
        }

        // -------------------------------
        // DIFERENCIAIS DO CONDOMÍNIO
        // -------------------------------
        const diferenciais = Array.from(
          document.querySelectorAll(
            'section ul li, .diferenciais li, [class*="benefit"] li'
          )
        )
          .map(el => el.innerText.trim())
          .filter(t => t.length > 2);

        // -------------------------------
        // TIPOLOGIAS (DORMITÓRIOS + ÁREA)
        // -------------------------------
        const tipologias = [];

        Array.from(document.querySelectorAll("li")).forEach(li => {
          const text = li.innerText;

          const dorm = text.match(/(\d+)\s*quartos?/i)?.[1];
          const area = text.match(/([\d.,]+)\s*m²/i)?.[1];

          if (dorm && area) {
            tipologias.push({
              dormitorios: Number(dorm),
              area: Number(area.replace(",", "."))
            });
          }
        });

        // -------------------------------
        // IMAGENS (LIMPO)
        // -------------------------------
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
          diferenciais: [...new Set(diferenciais)],
          tipologias,
          imagens: [...new Set(imagens)]
        };
      });

      empreendimentos.push({
        id: url.split("/").filter(Boolean).pop(),
        url,
        ...data
      });

    } catch (err) {
      console.log("❌ Erro ao processar:", url);
      console.log(err.message);
    }
  }

  await browser.close();

  console.log("✅ Empreendimentos MRV coletados:", empreendimentos.length);
  return empreendimentos;
}
