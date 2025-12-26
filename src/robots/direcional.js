import puppeteer from "puppeteer";

const BASE_URL = "https://www.direcional.com.br/empreendimentos/";

export default async function runDirecional() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle2" });

  // pega links dos empreendimentos
  const links = await page.$$eval(
    'a[href*="/empreendimentos/"]',
    els =>
      [...new Set(
        els
          .map(a => a.href)
          .filter(h => h.includes("/empreendimentos/") && !h.endsWith("/empreendimentos/"))
      )]
  );

  const resultados = [];

  for (const link of links) {
    const p = await browser.newPage();
    await p.goto(link, { waitUntil: "networkidle2" });

    const data = await p.evaluate(() => {
      const getText = sel =>
        document.querySelector(sel)?.innerText.trim() || "";

      const slug = location.pathname.split("/").filter(Boolean).pop();

      // 📌 TÍTULO
      const titulo = getText("h1");

      // 📌 STATUS
      const status =
        document.querySelector(".main-details__info-list li")?.innerText.trim() || "";

      // 📌 CIDADE / ESTADO (breadcrumbs)
      const breadcrumbs = [...document.querySelectorAll(".breadcrumb a")].map(a =>
        a.innerText.trim()
      );

      const estado = breadcrumbs.find(b => b.length === 2) || "";
      const cidade = breadcrumbs.filter(b => b !== estado).pop() || "";

      // 📌 DIFERENCIAIS DO CONDOMÍNIO
      const diferenciais = [
        ...document.querySelectorAll(
          '.card-single h3'
        )
      ].map(el => el.innerText.trim());

      // 📌 DORMITÓRIOS
      let dormitorios = null;
      const dormText = [...document.querySelectorAll("ul li span")]
        .map(el => el.innerText)
        .find(t => t.includes("Quarto"));

      if (dormText) {
        if (dormText.includes("2")) dormitorios = 2;
        else if (dormText.includes("1")) dormitorios = 1;
      }

      // 📌 ÁREAS
      let areaMin = null;
      let areaMax = null;

      const areaText = [...document.querySelectorAll("ul li span")]
        .map(el => el.innerText)
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

      // 📌 IMAGENS (SOMENTE FOTOS REAIS)
      const fotos = [
        ...document.querySelectorAll(
          '.section-dinamic-modal-photos img[data-src]'
        )
      ]
        .map(img => img.getAttribute("data-src"))
        .filter(src =>
          src &&
          src.startsWith("https://www.direcional.com.br/wp-content/uploads/") &&
          !src.includes("Icon") &&
          !src.includes("play") &&
          !src.includes("button")
        );

      return {
        id: slug,
        titulo,
        cidade,
        estado,
        status,
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
