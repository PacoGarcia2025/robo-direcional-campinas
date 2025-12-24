// =======================================
// SCRAPER DIRECIONAL – AJAX "CARREGAR MAIS"
// WORDPRESS / ADMIN-AJAX
// NODE 18+ / 20 / 22
// =======================================

import * as cheerio from "cheerio";

const BASE_URL = "https://www.direcional.com.br";
const AJAX_URL = `${BASE_URL}/wp-admin/admin-ajax.php`;

// headers obrigatórios (senão a Direcional retorna HTML)
const HEADERS = {
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
  "x-requested-with": "XMLHttpRequest"
};

async function fetchPage(page) {
  const body = new URLSearchParams({
    action: "load_more_empreendimentos",
    page: String(page)
  });

  const res = await fetch(AJAX_URL, {
    method: "POST",
    headers: HEADERS,
    body
  });

  const text = await res.text();

  // a resposta vem como HTML (cards)
  return text;
}

export default async function extractDirecional() {
  let page = 1;
  let hasMore = true;

  const results = [];

  while (hasMore) {
    const html = await fetchPage(page);

    if (!html || html.trim().length < 50) {
      hasMore = false;
      break;
    }

    const $ = cheerio.load(html);
    const cards = $(".card-empreendimento");

    if (!cards.length) {
      hasMore = false;
      break;
    }

    cards.each((_, el) => {
      const title = $(el).find(".card-title").text().trim();
      if (!title) return;

      const city =
        $(el).find(".cidade").text().trim() || "Campinas";

      const images = [];
      $(el)
        .find("img")
        .each((_, img) => {
          const src =
            $(img).attr("data-src") || $(img).attr("src");
          if (src && src.startsWith("http")) {
            images.push(src);
          }
        });

      results.push({
        id: title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
        title,
        location: {
          raw: city,
          city,
          state: "SP"
        },
        images
      });
    });

    page++;
  }

  return results;
}
