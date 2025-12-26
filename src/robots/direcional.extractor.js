import { chromium } from "playwright";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://www.direcional.com.br/empreendimentos/?cidade=campinas",
    { waitUntil: "networkidle" }
  );

  const empreendimentos = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("a.card-empreendimento"));

    return cards.map(card => {
      const url = card.href;
      const id = url.split("/").filter(Boolean).pop();

      const title =
        card.querySelector("h2, h3, .card-title")?.innerText?.trim() || "";

      const locationRaw =
        card.querySelector(".card-location")?.innerText?.trim() || "";

      let city = "";
      let state = "";

      if (locationRaw.includes("-")) {
        const parts = locationRaw.split("-");
        city = parts[0].trim();
        state = parts[1].trim();
      }

      return { id, url, title, city, state };
    });
  });

  for (const emp of empreendimentos) {
    await page.goto(emp.url, { waitUntil: "networkidle" });

    const data = await page.evaluate(() => {
      /* ========= STATUS ========= */
      const status =
        document.querySelector(".fixed-card-text")?.innerText?.trim() ||
        document.querySelector(".status")?.innerText?.trim() ||
        "";

      /* ========= DIFERENCIAIS ========= */
      const diferenciais = Array.from(
        document.querySelectorAll(".benefits li, .diferenciais li")
      ).map(li => li.innerText.trim());

      /* ========= UNIDADES ========= */
      const dormitorios = Array.from(
        document.querySelectorAll("span")
      )
        .map(el => el.innerText)
        .filter(t => /quarto/i.test(t))
        .map(t => parseInt(t))
        .filter(n => !isNaN(n));

      const areas = Array.from(
        document.querySelectorAll("span")
      )
        .map(el => el.innerText.replace(",", "."))
        .filter(t => t.includes("m²"))
        .map(t => parseFloat(t))
        .filter(n => !isNaN(n));

      const unidades = [];
      const max = Math.min(dormitorios.length, areas.length);

      for (let i = 0; i < max; i++) {
        unidades.push({
          dormitorios: dormitorios[i],
          area: areas[i]
        });
      }

      /* ========= IMAGENS (FILTRADAS) ========= */
      const images = Array.from(document.querySelectorAll("img"))
        .filter(img => {
          const src = img.getAttribute("src") || img.getAttribute("data-src");
          if (!src) return false;
          if (!src.includes("/wp-content/uploads/")) return false;

          const w = img.naturalWidth || 0;
          const h = img.naturalHeight || 0;

          // remove ícones, selos e imagens pequenas
          if (w < 300 || h < 300) return false;

          const lower = src.toLowerCase();
          if (
            lower.includes("icon") ||
            lower.includes("icone") ||
            lower.includes("logo") ||
            lower.includes("vector") ||
            lower.includes("selo")
          ) {
            return false;
          }

          return true;
        })
        .map(img => img.getAttribute("src") || img.getAttribute("data-src"));

      return {
        status,
        diferenciais,
        unidades,
        images
      };
    });

    emp.status = data.status;
    emp.diferenciais = data.diferenciais;
    emp.unidades = data.unidades;
    emp.images = [...new Set(data.images)]; // 👈 ÚNICA declaração
  }

  await browser.close();
  return empreendimentos;
}
