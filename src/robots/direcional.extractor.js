// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// SCRAPER DIRECIONAL – VERSÃO CONSOLIDADA
// ===============================

import { chromium } from "playwright";

const START_URL =
  "https://www.direcional.com.br/empreendimentos/?cidade=campinas";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Iniciando Robô Direcional");

  await page.goto(START_URL, { waitUntil: "networkidle" });

  // ===============================
  // 1️⃣ COLETA LINKS DOS EMPREENDIMENTOS
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
        // NOME DO EMPREENDIMENTO
        // ===============================
        const title =
          document.querySelector("h1")?.innerText.trim() || null;

        // ===============================
        // CIDADE E ESTADO (BREADCRUMB)
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
          .querySelectorAll(
            "ul.pt-3 li.list-inline-item"
          )
          .forEach((li) => {
            const text = li.innerText.trim();
            if (
              text.includes("Lançamento") ||
              text.includes("Obras") ||
              text.includes("Pronto")
            ) {
              status = text;
            }
          });

        // ===============================
        // TIPOLOGIAS (ÁREA + DORMITÓRIOS)
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
              if (nums) {
                nums.forEach((n) =>
                  dormitorios.push(Number(n))
                );
              }
            }
          });

        const unidades = [];
        areas.forEach((area) => {
          dormitorios.forEach((d) => {
            unidades.push({
              area,
              dormitorios: d,
            });
          });
        });

        // ===============================
        // DIFERENCIAIS
        // ===============================
        const diferenciais = Array.from(
          document.querySelectorAll(
            "ul.pt-3 li.list-inline-item"
          )
        )
          .map((li) => li.innerText.trim())
          .filter(
            (txt) =>
              txt &&
              !txt.toLowerCase().includes("lançamento") &&
              !txt.toLowerCase().includes("obras")
          );

        // ===============================
        // IMAGENS (COLETA BRUTA)
        // ===============================
        const imagens = Array.from(
          document.querySelectorAll("img")
        )
          .map((img) => ({
            src: img.src,
            w: Number(img.getAttribute("data-eio-rwidth") || 0),
            h: Number(img.getAttribute("data-eio-rheight") || 0),
          }))
          .filter(
            (img) =>
              img.src &&
              img.src.startsWith("http") &&
              img.w >= 300 &&
              img.h >= 300 &&
              !img.src.match(
                /(icon|icons|logo|sheet_|basil_|share|sprite|favicon)/i
              ) &&
              !img.src.match(
                /(Opcoes-na-Planta|Quartos\.webp)/i
              )
          )
          .map((img) => img.src);

        return {
          title,
          city,
          state,
          status,
          unidades,
          diferenciais,
          imagens,
        };
      });

      if (!data.title) continue;

      const id = url.replace(/\/$/, "").split("/").pop();

      empreendimentos.push({
        id,
        url,
        title: data.title,
        city: data.city,
        state: data.state,
        status: data.status,
        unidades: data.unidades,
        diferenciais_empreendimento: data.diferenciais,
        imagens: [...new Set(data.imagens)].slice(0, 10),
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
