/**
 * ==================================================
 * ROBÔ MRV – VERSÃO FINAL CONGELADA
 * FOCO: EXTRAÇÃO + REFINO DE IMAGENS
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(3000);

  // ==================================================
  // 🔹 CARREGAR TODOS OS IMÓVEIS
  // ==================================================
  let lastCount = 0;

  while (true) {
    const { count, hasButton } = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/imoveis/"]');
      const btn = Array.from(document.querySelectorAll("button, a")).find(
        el => el.innerText?.toLowerCase().includes("carregar")
      );

      return {
        count: cards.length,
        hasButton: !!btn,
      };
    });

    if (!hasButton || count === lastCount) break;
    lastCount = count;

    console.log("🔄 Carregando mais imóveis MRV...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(
        el => el.innerText?.toLowerCase().includes("carregar")
      );
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
  // 🔹 LOOP DOS EMPREENDIMENTOS
  // ==================================================
  for (const url of urls) {
    console.log("➡️ Coletando:", url);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await page.waitForTimeout(2500);

      const data = await page.evaluate(() => {
        // ===============================
        // TÍTULO
        // ===============================
        const titulo =
          document.querySelector("h1, h2")?.innerText.trim() || null;

        // ===============================
        // STATUS
        // ===============================
        const status =
          document.querySelector("[class*=label], [class*=status]")
            ?.innerText.trim() || null;

        // ===============================
        // CIDADE / ESTADO (fallback seguro)
        // ===============================
        let cidade = null;
        let estado = "SP";

        const textoPagina = document.body.innerText;

        const matchCidade = textoPagina.match(
          /Apartamentos em ([A-Za-zÀ-ú\s]+)\/SP/i
        );

        if (matchCidade) {
          cidade = matchCidade[1].trim();
        }

        // ===============================
        // DIFERENCIAIS (texto)
        // ===============================
        const diferenciais = Array.from(
          document.querySelectorAll(".sc-jQybuE li span")
        )
          .map(el => el.innerText.trim())
          .filter(Boolean);

        // ===============================
        // TIPOLOGIAS
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
                area: Number(area.replace(",", ".")),
              });
            }
          });
        }

        // ===============================
        // 🔥 IMAGENS – FILTRO PROFISSIONAL
        // ===============================
        const imagens = Array.from(document.images)
          .map(img => img.src)
          .filter(src => {
            if (!src) return false;

            const s = src.toLowerCase();

            // ✅ somente imagens reais
            if (!s.includes("/imoveis/upload/imagens/")) return false;

            // ❌ lixo conhecido
            if (s.includes("/linhaproduto/")) return false;
            if (s.includes("/infraestrutura")) return false;
            if (s.includes("icone")) return false;
            if (s.includes("icon")) return false;
            if (s.includes("logo")) return false;
            if (s.includes("svg")) return false;
            if (s.includes("placeholder")) return false;

            // ❌ extensão inválida
            if (!s.match(/\.(jpg|jpeg|png|webp)$/)) return false;

            return true;
          });

        return {
          titulo,
          cidade,
          estado,
          status,
          tipologias,
          diferenciais,
          imagens: [...new Set(imagens)],
        };
      });

      empreendimentos.push({
        id: url.split("/").filter(Boolean).pop(),
        url,
        ...data,
      });
    } catch (err) {
      console.error("❌ Erro ao processar:", url);
      console.error(err.message);
    }
  }

  await browser.close();

  console.log("✅ Empreendimentos MRV coletados:", empreendimentos.length);
  return empreendimentos;
}
