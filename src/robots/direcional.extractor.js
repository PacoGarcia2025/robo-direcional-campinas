// ===============================
// SCRAPER DIRECIONAL CAMPINAS
// COMPATÍVEL COM NODE 18+ / 20 / 22 (ESM)
// ===============================

import * as cheerio from "cheerio";

const BASE_URL = "https://www.direcional.com.br";
const LIST_URL = `${BASE_URL}/empreendimentos`;

export default async function extractDirecional() {
  const res = await fetch(LIST_URL);
  const html = await res.text();
  const $ = cheerio.load(html);

  const urls = [];

  $(".empreendimento-card a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.startsWith("/")) {
      urls.push(BASE_URL + href);
    }
  });

  const results = [];

  for (const url of urls) {
    const page = await fetch(url);
    const pageHtml = await page.text();
    const $$ = cheerio.load(pageHtml);

    const images = [];
    $$("img").each((_, img) => {
      const src = $$(img).attr("src");
      if (src && src.startsWith("http")) {
        images.push(src);
      }
    });

    results.push({
      id: url.split("/").filter(Boolean).pop(),
      title: $$("h1").first().text().trim(),
      location: {
        raw: $$(".localizacao").text().trim(),
        city: "Campinas",
        state: "SP"
      },
      images
    });
  }

  return results;
}
