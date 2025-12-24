// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// SCRAPER DIRECIONAL – HTML REAL (SEM API, SEM IA)
// FUNCIONA EM NODE 18+ / 20 / 22
// ===============================

import * as cheerio from "cheerio";

const BASE_URL = "https://www.direcional.com.br";
const LIST_URL = "https://www.direcional.com.br/empreendimentos";

export default async function extractDirecional() {
  const res = await fetch(LIST_URL, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120"
    }
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const links = new Set();

  $("a[href*='/empreendimentos/']").each((_, el) => {
    const href = $(el).attr("href");
    if (
      href &&
      href.startsWith("/empreendimentos/") &&
      !href.includes("#")
    ) {
      links.add(BASE_URL + href);
    }
  });

  const results = [];

  for (const url of links) {
    const page = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120"
      }
    });

    const pageHtml = await page.text();
    const $$ = cheerio.load(pageHtml);

    const title = $$("h1").first().text().trim();
    if (!title) continue;

    const images = [];
    $$("img").each((_, img) => {
      const src =
        $$(img).attr("data-src") ||
        $$(img).attr("src");

      if (src && src.startsWith("http")) {
        images.push(src);
      }
    });

    results.push({
      id: url.split("/").filter(Boolean).pop(),
      title,
      location: {
        raw: $$("address, .localizacao, .location")
          .first()
          .text()
          .trim(),
        city: "Campinas",
        state: "SP"
      },
      images
    });
  }

  return results;
}
