import { chromium } from "playwright";

const START_URL = "https://www.direcional.com.br/encontre-seu-apartamento/";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // Carregar todos os cards
  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;
    await btn.click();
    await page.waitForTimeout(2000);
  }

  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/empreendimentos/"]'))
      .map(a => {
        const loc = a.closest("div")?.querySelector(".location p")?.innerText || null;
        return { url: a.href.split("#")[0], location: loc };
      })
  );

  const unique = [...new Map(cards.map(c => [c.url, c])).values()];
  const empreendimentos = [];

  for (const card of unique) {
    if (!card.location) continue;

    const [cidade, estado] = card.location.split("/").map(t => t.trim());

    await page.goto(card.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
      const titulo = document.querySelector("h1")?.innerText.trim() || null;

      let status = null;
      document.querySelectorAll("li").forEach(li => {
        const t = li.innerText.trim();
        if (/lançamento|breve|obras|pronto/i.test(t)) status = t;
      });

      const tipologias = [];
      let areas = [];
      let dorms = [];

      document.querySelectorAll("ul.pl-3 li span").forEach(el => {
        const text = el.innerText;
        if (text.includes("m²")) {
          areas = text.replace(/\s/g, "").split("|").map(a => a.replace("m²", "").replace(",", "."));
        }
        if (text.toLowerCase().includes("quarto")) {
          dorms = text.match(/\d+/g) || [];
        }
      });

      areas.forEach(a => dorms.forEach(d => {
        tipologias.push({ dormitorios: Number(d), area: Number(a) });
      }));

      const imagens = Array.from(document.querySelectorAll("img"))
        .map(img => img.src)
        .filter(src => src && src.includes("/wp-content/uploads/"));

      return { titulo, status, tipologias, imagens };
    });

    empreendimentos.push({
      id: card.url.split("/").filter(Boolean).pop(),
      url: card.url,
      cidade,
      estado,
      titulo: data.titulo,
      status: data.status,
      tipologias: data.tipologias,
      imagens: [...new Set(data.imagens)]
    });
  }

  await browser.close();
  return empreendimentos;
}
