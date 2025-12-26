// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// SCRAPER DIRECIONAL – VERSÃO ESTÁVEL
// ===============================

import { chromium } from "playwright";

const START_URL =
  "https://www.direcional.com.br/empreendimentos/?cidade=campinas";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Iniciando Robô Direcional Campinas");
  await page.goto(START_URL, { waitUntil: "networkidle" });

  // 1️⃣ Coleta links dos empreendimentos
  const links = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('a[href*="/empreendimentos/"]')
    )
      .map((a) => a.href)
      .filter((href) => href.split("/empreendimentos/")[1]?.length > 3);
  });

  const uniqueLinks = [...new Set(links)];

  const empreendimentos = [];

  // 2️⃣ Visita cada empreendimento
  for (const url of uniqueLinks) {
    try {
      await page.goto(url, { waitUntil: "networkidle" });

      const data = await page.evaluate(() => {
        // ===============================
        // TÍTULO
        // ===============================
        const title =
          document.querySelector("h1")?.innerText?.trim() || null;

        // ===============================
        // STATUS
        // ===============================
        const status =
          document.querySelector(".list-inline-item")?.innerText?.trim() ||
          null;

        // ===============================
        // LOCALIZAÇÃO
        // ===============================
        const locationRaw =
          document.querySelector(".adress a")?.innerText || "";

        // ===============================
        // TIPOLOGIAS / UNIDADES
        // ===============================
        const unidades = [];
        document
          .querySelectorAll("ul.pl-3 li span")
          .forEach((el) => {
            const text = el.innerText;

            if (text.includes("m²") && text.match(/\d/)) {
              const areas = text
                .replace(/\s/g, "")
                .split("|")
                .map((a) => a.replace("m²", "").replace(",", "."));

              areas.forEach((area) => {
                unidades.push({
                  area: Number(area),
                });
              });
            }

            if (text.toLowerCase().includes("quarto")) {
              const dorms = text.match(/\d+/);
              if (dorms) {
                unidades.forEach((u) => (u.dormitorios = Number(dorms[0])));
              }
            }
          });

        // ===============================
        // DIFERENCIAIS DO EMPREENDIMENTO
        // ===============================
        const diferenciais = Array.from(
          document.querySelectorAll(
            ".card-single h3"
          )
        ).map((el) => el.innerText.trim());

        // ===============================
        // IMAGENS (LIMPEZA AQUI)
        // ===============================
        const imagens = Array.from(
          document.querySelectorAll("img")
        )
          .map((img) => img.src)
          .filter((src) =>
            src &&
            (
              src.includes("Perspectiva") ||
              src.includes("fachada") ||
              src.includes("Piscina") ||
              src.includes("Living") ||
              src.includes("Quartos") ||
              src.includes("Planta")
            )
          );

        return {
          title,
          status,
          locationRaw,
          unidades,
          diferenciais,
          imagens,
        };
      });

      if (!data.title) continue;

      // ===============================
      // NORMALIZAÇÃO FINAL
      // ===============================
      const id = url
        .replace(/\/$/, "")
        .split("/")
        .pop();

      const empreendimento = {
        id,
        url,
        title: data.title,
        city: data.locationRaw.includes("Campinas")
          ? "Campinas"
          : data.locationRaw.includes("Limeira")
          ? "Limeira"
          : null,
        state: "SP",
        status: data.status,
        unidades: data.unidades.filter(
          (u) => u.area && u.dormitorios
        ),
        diferenciais_empreendimento: data.diferenciais,
        imagens: [...new Set(data.imagens)],
      };

      empreendimentos.push(empreendimento);
    } catch (err) {
      console.error("❌ Erro ao processar:", url, err.message);
    }
  }

  await browser.close();

  console.log(
    `✅ Robô finalizado. ${empreendimentos.length} empreendimentos capturados`
  );

  return empreendimentos;
}
