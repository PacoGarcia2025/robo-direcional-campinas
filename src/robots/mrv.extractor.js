/**
 * ==================================================
 * ROBÔ MRV – BASE DERIVADA DA DIRECIONAL
 *
 * Estrutura clonada do robô Direcional FINAL
 * Ajustado exclusivamente para domínio MRV
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis";

export default async function extractMRV() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo listagem MRV");
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // 🔹 Scroll para carregar imóveis (MRV usa lazy load)
  let lastHeight = 0;
  while (true) {
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2500);
  }

  // 🔹 Capturar links dos empreendimentos
  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/imovel/"]'))
      .map(a => a.href.split("?")[0])
      .filter(Boolean)
  );

  const uniqueUrls = [...new Set(cards)];
  console.log("📦 Empreendimentos únicos:", uniqueUrls.length);

  const empreendimentos = [];

  for (const url of uniqueUrls) {
    console.log("➡️ Coletando:", url);

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      // ===============================
      // TÍTULO
      // ===============================
      const titulo =
        document.querySelector("h1")?.innerText.trim() || null;

      // ===============================
      // LOCALIZAÇÃO
      // ===============================
      let cidade = null;
      let estado = null;

      document.querySelectorAll("span, p").forEach(el => {
        const t = el.innerText?.trim();
        if (t && t.match(/ - [A-Z]{2}$/)) {
          const parts = t.split(" - ");
          cidade = parts[0];
          estado = parts[1];
        }
      });

      // ===============================
      // STATUS
      // ===============================
      let status = null;
      document.querySelectorAll("span, li, p").forEach(el => {
        const t = el.innerText?.trim();
        if (/lançamento|em obras|pronto/i.test(t)) {
          status = t;
        }
      });

      // ===============================
      // TIPOLOGIAS
      // ===============================
      const tipologias = [];
      let areas = [];
      let dorms = [];

      document.querySelectorAll("span, li").forEach(el => {
        const text = el.innerText || "";

        if (text.includes("m²")) {
          areas = text
            .replace(/\s/g, "")
            .split("|")
            .map(a =>
              Number(a.replace("m²", "").replace(",", "."))
            )
            .filter(Boolean);
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

          // ✅ uploads reais
          if (
            !src.includes("/uploads/") &&
            !src.includes("/imagens/") &&
            !src.includes("/images/")
          ) {
            return false;
          }

          return true;
        })
        .map(img => img.src);

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
      cidade: data.cidade,
      estado: data.estado,
      titulo: data.titulo,
      status: data.status,
      tipologias: data.tipologias,
      imagens: data.imagens
    });
  }

  await browser.close();

  console.log("✅ Empreendimentos MRV coletados:", empreendimentos.length);
  return empreendimentos;
}

