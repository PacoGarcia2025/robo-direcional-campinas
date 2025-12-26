// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// SCRAPER DIRECIONAL – PADRÃO X09 (COM FICHA TÉCNICA)
// ===============================

import { chromium } from "playwright";
import { processImages } from "../images/index.js";

const START_URL =
  "https://www.direcional.com.br/empreendimentos/?cidade=campinas";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Iniciando Robô Direcional");

  await page.goto(START_URL, { waitUntil: "networkidle" });

  // ===============================
  // 1️⃣ LINKS DOS EMPREENDIMENTOS
  // ===============================
  const links = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('a[href*="/empreendimentos/"]')
    )
      .map((a) => a.href.split("#")[0])
      .filter(
        (href) =>
          href.includes("/empreendimentos/") &&
          href.split("/empreendimentos/")[1]?.length > 3
      );
  });

  const uniqueLinks = [...new Set(links)];
  const empreendimentos = [];

  // ===============================
  // 2️⃣ VISITA CADA EMPREENDIMENTO
  // ===============================
  for (const url of uniqueLinks) {
    try {
      await page.goto(url, { waitUntil: "networkidle" });

      const data = await page.evaluate(() => {
        // ===============================
        // TÍTULO
        // ===============================
        const title =
          document.querySelector("h1")?.innerText.trim() || null;

        // ===============================
        // CIDADE / ESTADO (BREADCRUMB)
        // ===============================
        let city = null;
        let state = null;

        document
          .querySelectorAll(".breadcrumbs-empreendimento a")
          .forEach((a) => {
            const href = a.getAttribute("href") || "";
            const text = a.innerText.trim();

            if (href.includes("estado=") && text.length === 2) {
              state = text;
            }
            if (href.includes("cidade=")) {
              city = text;
            }
          });

        // ===============================
        // STATUS
        // ===============================
        let status = null;
        document
          .querySelectorAll("ul.pt-3 li.list-inline-item")
          .forEach((li) => {
            const t = li.innerText.trim();
            if (
              t.includes("Lançamento") ||
              t.includes("Obras") ||
              t.includes("Pronto")
            ) {
              status = t;
            }
          });

        // ===============================
        // TIPOLOGIAS
        // ===============================
        const areas = [];
        const dormitorios = [];

        document
          .querySelectorAll("ul.pl-3 li span")
          .forEach((el) => {
            const text = el.innerText;

            if (text.includes("m²")) {
              text
                .replace(/\s/g, "")
                .split("|")
                .forEach((a) => {
                  const val = a
                    .replace("m²", "")
                    .replace(",", ".");
                  if (!isNaN(val)) areas.push(Number(val));
                });
            }

            if (text.toLowerCase().includes("quarto")) {
              const nums = text.match(/\d+/g);
              if (nums) nums.forEach((n) => dormitorios.push(Number(n)));
            }
          });

        const unidades = [];
        areas.forEach((a) => {
          dormitorios.forEach((d) => {
            unidades.push({ area: a, dormitorios: d });
          });
        });

        // ===============================
        // DIFERENCIAIS
        // ===============================
        const diferenciais = Array.from(
          document.querySelectorAll("ul.pt-3 li.list-inline-item")
        )
          .map((li) => li.innerText.trim())
          .filter(
            (t) =>
              t &&
              !t.toLowerCase().includes("lançamento") &&
              !t.toLowerCase().includes("obras")
          );

        // ===============================
        // FICHA TÉCNICA
        // ===============================
        const ficha_tecnica = {};

        document
          .querySelectorAll("h2")
          .forEach((h2) => {
            if (h2.innerText.trim() === "Ficha Técnica") {
              const container = h2.closest(".container");
              if (!container) return;

              container
                .querySelectorAll("li p")
                .forEach((p) => {
                  const strong = p.querySelector("strong");
                  if (!strong) return;

                  const label = strong.innerText
                    .replace(":", "")
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^\w]/g, "");

                  const value = p.innerText
                    .replace(strong.innerText, "")
                    .trim();

                  if (label && value) {
                    ficha_tecnica[label] = value;
                  }
                });
            }
          });

        // ===============================
        // IMAGENS (BRUTAS)
        // ===============================
        const imagens = Array.from(document.querySelectorAll("img")).map(
          (img) => ({
            src: img.src,
            w: Number(img.getAttribute("data-eio-rwidth") || 0),
            h: Number(img.getAttribute("data-eio-rheight") || 0),
          })
        );

        return {
          title,
          city,
          state,
          status,
          unidades,
          diferenciais,
          ficha_tecnica,
          imagens,
        };
      });

      if (!data.title) continue;

      const id = url.replace(/\/$/, "").split("/").pop();

      const imagensProcessadas = processImages(data.imagens, {
        min: 3,
        max: 10,
      });

      empreendimentos.push({
        id,
        url,
        title: data.title,
        city: data.city,
        state: data.state,
        status: data.status,
        unidades: data.unidades,
        diferenciais_empreendimento: data.diferenciais,
        ficha_tecnica: data.ficha_tecnica,
        imagens: imagensProcessadas,
      });
    } catch (err) {
      console.error("❌ Erro:", url, err.message);
    }
  }

  await browser.close();

  console.log(
    `✅ Robô finalizado. ${empreendimentos.length} empreendimentos capturados`
  );

  return empreendimentos;
}
