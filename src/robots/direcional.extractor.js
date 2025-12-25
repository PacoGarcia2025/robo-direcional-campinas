// ARQUIVO: src/robots/direcional.extractor.js
// EXTRACTOR PLAYWRIGHT – COMPATÍVEL COM GITHUB ACTIONS

import { chromium } from "playwright";

export default async function extractDirecional() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  console.log("Abrindo página de empreendimentos...");
  await page.goto("https://www.direcional.com.br/empreendimentos", {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  // 🔁 Clicar em "Carregar mais" até acabar
  while (true) {
    const btn = await page.$("#load-more-empreendimentos");
    if (!btn) break;

    const visible = await btn.isVisible();
    if (!visible) break;

    console.log("Clicando em Carregar mais...");
    await btn.click();
    await page.waitForTimeout(1200);
  }

  console.log("Capturando links dos empreendimentos...");

  const links = await page.$$eval(
    "a[href*='/empreendimentos/']",
    els => [...new Set(els.map(e => e.href))]
  );

  const results = [];

  for (const url of links) {
    try {
      console.log("Extraindo:", url);

      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

      const data = await page.evaluate(() => {
        const text = sel =>
          document.querySelector(sel)?.innerText.trim() || "";

        const images = [...document.querySelectorAll("img")]
          .map(img => img.src)
          .filter(
            src =>
              src &&
              src.startsWith("http") &&
              !src.includes("icon") &&
              !src.includes("logo") &&
              !src.includes("button") &&
              !src.includes("whatsapp")
          );

        const locationText = text("#card-simulacao-empreendimento a[href='#maps']");

        const cityState = locationText.split(",").pop() || "";
        const [city, state] = cityState.split("-").map(s => s?.trim());

        return {
          title: document.querySelector("h1")?.innerText || "",
          location: {
            raw: locationText,
            city: city || "",
            state: state || "",
          },
          images,
          fixedCardText:
            document.querySelector("#card-simulacao-empreendimento li")
              ?.innerText || "",
        };
      });

      if (data.location.state !== "SP") continue;

      const cidadesCampinas = [
        "Campinas",
        "Sumaré",
        "Hortolândia",
        "Monte Mor",
        "Valinhos",
        "Paulínia",
        "Americana",
        "Vinhedo",
        "Indaiatuba",
        "Nova Odessa",
        "Santa Bárbara",
        "Piracicaba",
        "Limeira",
      ];

      if (!cidadesCampinas.includes(data.location.city)) continue;

      results.push({
        id: url.split("/").filter(Boolean).pop(),
        url,
        ...data,
      });
    } catch (err) {
      console.warn("Erro ao extrair:", url);
    }
  }

  await browser.close();
  return results;
}
