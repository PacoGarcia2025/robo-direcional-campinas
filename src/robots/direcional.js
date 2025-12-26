import { chromium } from "playwright";

const BASE_URL = "https://www.direcional.com.br/empreendimentos/";

export default async function runDirecional() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // 🔗 links únicos de empreendimentos
  const links = await page.$$eval(
    'a[href^="https://www.direcional.com.br/empreendimentos/"]',
    els =>
      [...new Set(
        els
          .map(a => a.href)
          .filter(h => h.split("/").length > 5)
      )]
  );

  const resultados = [];

  for (const link of links) {
    const p = await browser.newPage();
    await p.goto(link, { waitUntil: "networkidle" });

    const data = await p.evaluate(() => {
      const text = sel =>
        document.querySelector(sel)?.innerText.trim() || "";

      const slug = location.pathname.split("/").filter(Boolean).pop();

      // 🏷️ título
      const titulo = text("h1");

      // 🟡 status
      const status =
        document.querySelector(".main-details__info-list li")?.innerText.trim() || "";

      // 📍 cidade / estado
      const crumbs = [...document.querySelectorAll(".breadcrumb a")].map(a =>
        a.innerText.trim()
      );
      const estado = crumbs.find(c => c.length === 2) || "";
      const cidade = crumbs.filter(c => c !== estado).pop() || "";

      // ⭐ diferenciais do condomínio
      const diferenciais = [...document.querySelectorAll(".card-single h3")]
        .map(el => el.innerText.trim());

      // 🛏️ dormitórios
      let dormitorios = null;
      const dormText = [...document.querySelectorAll("ul li span")]
        .map(s => s.innerText)
        .find(t => t.includes("Quarto"));

      if (dormText?.includes("2")) dormitorios = 2;
      else if (dormText?.includes("1")) dormitorios = 1;

      // 📐 áreas
      let areaMin = null;
      let areaMax = null;

      const areaText = [...document.querySelectorAll("ul li span")]
        .map(s => s.innerText)
        .find(t => t.includes("m²"));

      if (areaText) {
        const nums = areaText
          .replace(",", ".")
          .match(/\d+(\.\d+)?/g)
          ?.map(Number);

        if (nums?.length) {
          areaMin = Math.min(...nums);
          areaMax = Math.max(...nums);
        }
      }

      // 🖼️ imagens limpas
      const fotos = [...document.querySelectorAll(
        ".section-dinamic-modal-photos img[data-src]"
      )]
        .map(img => img.getAttribute("data-src"))
        .filter(src =>
          src &&
          src.startsWith("https://www.direcional.com.br/wp-content/uploads/") &&
          !src.toLowerCase().includes("icon") &&
          !src.toLowerCase().includes("button") &&
          !src.toLowerCase().includes("play")
        );

      return {
        id: slug,
        titulo,
        status,
        cidade,
        estado,
        unidades: dormitorios
          ? [{ dormitorios, area_min: areaMin, area_max: areaMax }]
          : [],
        diferenciais,
        fotos
      };
    });

    if (data.titulo) resultados.push(data);
    await p.close();
  }

  await browser.close();
  return resultados;
}
