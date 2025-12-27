// ==================================================
// ROBÔ DIRECIONAL – COLETA COMPLETA (FINAL)
// Coleta BRUTA, SEM conversão de XML
// ==================================================

import { chromium } from "playwright";

const START_URL = "https://www.direcional.com.br/encontre-seu-apartamento/";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo listagem Direcional");
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // 🔹 Carregar TODOS os cards
  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;
    await btn.click();
    await page.waitForTimeout(2500);
  }

  // 🔹 Capturar links + cidade/estado do CARD
  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/empreendimentos/"]'))
      .map(a => {
        const card = a.closest("div");
        const loc = card?.querySelector(".location p")?.innerText || null;
        return { url: a.href.split("#")[0], location: loc };
      })
      .filter(c => c.url && c.location)
  );

  const uniqueCards = [...new Map(cards.map(c => [c.url, c])).values()];
  console.log("📦 Cards únicos encontrados:", uniqueCards.length);

  const empreendimentos = [];

  for (const card of uniqueCards) {
    const [cidade, estado] = card.location.split("/").map(t => t.trim());

    await page.goto(card.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      // ===============================
      // TÍTULO
      // ===============================
      const titulo = document.querySelector("h1")?.innerText.trim() || null;

      // ===============================
      // STATUS
      // ===============================
      let status = null;
      document.querySelectorAll("li").forEach(li => {
        const t = li.innerText.trim();
        if (/lançamento|breve|obras|pronto/i.test(t)) status = t;
      });

      // ===============================
      // DESCRIÇÃO
      // ===============================
      const descricao =
        document.querySelector(".description p")?.innerText.trim() ||
        document.querySelector("section p")?.innerText.trim() ||
        null;

      // ===============================
      // VALOR / VALOR A PARTIR DE
      // ===============================
      let valor = null;
      document.querySelectorAll("strong, span").forEach(el => {
        const t = el.innerText;
        if (/R\$\s?\d+/i.test(t)) valor = t.trim();
      });

      // ===============================
      // PREVISÃO DE ENTREGA
      // ===============================
      let previsao_entrega = null;
      document.querySelectorAll("li, p").forEach(el => {
        const t = el.innerText;
        if (/entrega|previsão/i.test(t)) previsao_entrega = t.trim();
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
            .map(a => Number(a.replace("m²", "").replace(",", ".")));
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

      // ===============================
      // DIFERENCIAIS
      // ===============================
      const diferenciais = Array.from(
        document.querySelectorAll("ul li")
      )
        .map(li => li.innerText.trim())
        .filter(t => t.length > 0 && t.length < 80);

      // ===============================
      // FICHA TÉCNICA
      // ===============================
      const ficha_tecnica = {};
      document.querySelectorAll("li p").forEach(p => {
        const strong = p.querySelector("strong");
        if (!strong) return;
        const chave = strong.innerText.replace(":", "").trim();
        const valor = p.innerText.replace(strong.innerText, "").trim();
        if (chave && valor) ficha_tecnica[chave] = valor;
      });

      // ===============================
      // IMAGENS (FAXINA PESADA)
      // ===============================
      const BLOCKLIST = [
        "icon","icone","logo","fgts","mcmv","minha-casa",
        "selo","button","sprite","sheet","vector",
        "whats","simular","percent","renda","financi"
      ];

      const imagens = Array.from(document.querySelectorAll("img"))
        .filter(img => {
          const src = (img.src || "").toLowerCase();
          const w = img.naturalWidth || 0;
          const h = img.naturalHeight || 0;
          if (!src.includes("/wp-content/uploads/")) return false;
          if (w < 800 || h < 500) return false;
          if (BLOCKLIST.some(b => src.includes(b))) return false;
          return true;
        })
        .map(img => img.src);

      return {
        titulo,
        status,
        descricao,
        valor,
        previsao_entrega,
        tipologias,
        diferenciais,
        ficha_tecnica,
        imagens: [...new Set(imagens)]
      };
    });

    empreendimentos.push({
      id: card.url.split("/").filter(Boolean).pop(),
      url: card.url,
      cidade,
      estado,
      ...data
    });
  }

  await browser.close();
  console.log("✅ Empreendimentos coletados:", empreendimentos.length);
  return empreendimentos;
}
