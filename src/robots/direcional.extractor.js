import { chromium } from "playwright";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://www.direcional.com.br/empreendimentos/?cidade=campinas",
    { waitUntil: "networkidle" }
  );

  const empreendimentos = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("a.card-empreendimento")
    ).map(card => {
      const url = card.href;
      const id = url.split("/").filter(Boolean).pop();
      const title =
        card.querySelector("h2, h3")?.innerText?.trim() || "";

      const raw =
        card.querySelector(".card-location")?.innerText || "";

      let city = "";
      let state = "";

      if (raw.includes("-")) {
        const parts = raw.split("-");
        city = parts[0].trim();
        state = parts[1].trim();
      }

      return { id, url, title, city, state };
    });
  });

  for (const emp of empreendimentos) {
    await page.goto(emp.url, { waitUntil: "networkidle" });

    const data = await page.evaluate(() => {
      const status =
        document.querySelector(".fixed-card-text")?.innerText?.trim() || "";

      const diferenciais = Array.from(
        document.querySelectorAll(".benefits li, .diferenciais li")
      ).map(el => el.innerText.trim());

      const images = Array.from(document.querySelectorAll("img"))
        .map(img => img.getAttribute("src") || img.getAttribute("data-src"))
        .filter(src =>
          src &&
          src.includes("/wp-content/uploads/") &&
          !src.match(/icon|icone|logo|vector|selo/i)
        );

      return { status, diferenciais, images };
    });

    emp.status = data.status;
    emp.diferenciais = data.diferenciais;
    emp.images = [...new Set(data.images)];
  }

  await browser.close();
  return empreendimentos;
}
