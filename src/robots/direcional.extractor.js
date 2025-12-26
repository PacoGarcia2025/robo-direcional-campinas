import { chromium } from "playwright";

export async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.direcional.com.br/empreendimentos/", {
    waitUntil: "networkidle",
  });

  const empreendimentos = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("a[href*='/empreendimentos/']")
    )
      .map(link => {
        const url = link.href;
        const id = url.split("/").filter(Boolean).pop();
        const title = link.innerText?.trim();

        if (!title || title.length < 5) return null;

        return {
          id,
          url,
          title,
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
