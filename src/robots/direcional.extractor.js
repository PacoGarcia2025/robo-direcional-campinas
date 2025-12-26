// src/robots/direcional.extractor.js
import { chromium } from "playwright";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.direcional.com.br/empreendimentos/", {
    waitUntil: "networkidle",
  });

  const empreendimentos = await page.evaluate(() => {
    const links = Array.from(
      document.querySelectorAll("a[href*='/empreendimentos/']")
    );

    const vistos = new Set();

    return links
      .map(link => {
        const url = link.href;
        const id = url.split("/").filter(Boolean).pop();

        if (vistos.has(id)) return null;
        vistos.add(id);

        const titulo = link.textContent?.trim();
        if (!titulo || titulo.length < 4) return null;

        return {
          id,
          url,
          title: titulo,
          location: {
            city: "Campinas",
            state: "SP",
          },
          images: [],
          fixedCardText: ""
        };
      })
      .filter(Boolean);
  });

  await browser.close();
  return empreendimentos;
}
