/**
 * ==================================================
 * ROBÔ DIRECIONAL – VERSÃO FINAL CONGELADA
 * NÃO ALTERAR
 *
 * Última versão funcional validada no X09
 * Data: 2025-01-xx
 * ==================================================
 */

// ==================================================
// ROBÔ DIRECIONAL – COLETA ESTRUTURAL
// FILTRO DE IMAGENS LIMPO (SEM LIXO)
// ==================================================

import { chromium } from "playwright";

const START_URL = "https://www.direcional.com.br/encontre-seu-apartamento/";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo listagem Direcional");
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // 🔹 Carregar todos os cards
  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;
    await btn.click();
    await page.waitForTimeout(2500);
  }

  // 🔹 Capturar links + localização
  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/empreendimentos/"]'))
      .map(a => {
        const card = a.closest("div");
        const location = card?.querySelector(".location p")?.innerText || null;
        return {
          url: a.href.split("#")[0],
          location
        };
      })
      .filter(c => c.url && c.location)
  );

  const uniqueCards = [...new Map(cards.map(c => [c.url, c])).values()];
  console.log("📦 Cards únicos:", uniqueCards.length);

  const empreendimentos = [];

  for (const card of uniqueCards) {
    const [cidade, estado] = card.location.split("/").map(t => t.trim());

    await page.goto(card.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      // ===============================
      // TÍTULO
      // ===============================
      const titulo =
        document.querySelector("h1")?.innerText.trim() || null;

      // ===============================
      // STATUS
      // ===============================
      let status = null;
      document.querySelectorAll("li").forEach(li => {
        const t = li.innerText.trim();
        if (/lançamento|breve|obras|pronto/i.test(t)) {
          status = t;
        }
      });

      // ===============================
      // TIPOLOGIAS
      // ===============================
      const tipologias = [];
      let areas = [];
      let dorms = [];

      document.querySelectorAll("ul.pl-3 li span").forEach(el => {
        const text = el.innerText;

        if (text.includes("m²")) {
          areas = text
            .replace(/\s/g, "")
            .split("|")
            .map(a =>
              Number(a.replace("m²", "").replace(",", "."))
            );
        }

        if (text.toLowerCase().includes("quarto")) {
          dorms = text.match(/\d+/g)?.map(Number) || [];
        }
      });

      areas.forEach(area => {
        dorms.forEach(d => {
          tipologias.push({
            dormitorios: d,
            area
          });
        });
      });

      // ===============================
      // IMAGENS – FILTRO PROFISSIONAL
      // ===============================
      const imagens = Array.from(document.images)
        .map(img => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight
        }))
        .filter(img => {
          if (!img.src) return false;

          const src = img.src.toLowerCase();

          // ❌ formatos inválidos
          if (src.endsWith(".svg")) return false;

          // ❌ lixo comum
          if (
            src.includes("logo") ||
            src.includes("icon") ||
            src.includes("icone") ||
            src.includes("sprite") ||
            src.includes("sheet") ||
            src.includes("button") ||
            src.includes("mcmv") ||
            src.includes("minha-casa") ||
            src.includes("selo") ||
            src.includes("badge")
          ) {
            return false;
          }

          // ❌ imagens pequenas (UI / thumb)
          if (img.width < 600 || img.height < 400) return false;

          // ✅ apenas uploads reais
          if (!src.includes("/wp-content/uploads/")) return false;

          return true;
        })
        .map(img => img.src);

      return {
        titulo,
        status,
        tipologias,
        imagens: [...new Set(imagens)]
      };
    });

    empreendimentos.push({
      id: card.url.split("/").filter(Boolean).pop(),
      url: card.url,
      cidade,
      estado,
      titulo: data.titulo,
      status: data.status,
      tipologias: data.tipologias,
      imagens: data.imagens
    });
  }

  await browser.close();

  console.log("✅ Empreendimentos coletados:", empreendimentos.length);
  return empreendimentos;
}
