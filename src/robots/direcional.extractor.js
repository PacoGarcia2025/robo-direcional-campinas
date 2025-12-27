// ===============================
// ROBÔ DIRECIONAL – MULTI-REGIÃO
// ===============================

import { chromium } from "playwright";

const REGIOES = {
  INTERIOR_SP: {
    nome: "interior-sp",
    excluirCidades: [
      // Grande SP
      "sao paulo","guarulhos","osasco","barueri","santo andre","sao bernardo do campo",
      "sao caetano do sul","diadema","maua","ribeirao pires","rio grande da serra",
      "carapicuiba","itapevi","jandira","cotia","embu das artes","embu guacu",
      "itapecerica da serra","taboao da serra","taboao","santana de parnaiba",
      // Litoral
      "santos","sao vicente","praia grande","guaruja","cubatão","bertioga",
      "itanhaem","mongagua","peruibe","caraguatatuba","ubatuba","ilhabela","sao sebastiao",
    ],
  },
};

const START_URL = "https://www.direcional.com.br/encontre-seu-apartamento/";

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo listagem Direcional");
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;
    await btn.click();
    await page.waitForTimeout(2500);
  }

  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/empreendimentos/"]')).map(a => {
      const card = a.closest("div");
      const loc = card?.querySelector(".location p")?.innerText || null;
      return { url: a.href.split("#")[0], location: loc };
    })
  );

  const unique = [...new Map(cards.map(c => [c.url, c])).values()];
  console.log("📦 Cards únicos:", unique.length);

  const empreendimentos = [];

  for (const card of unique) {
    if (!card.location) continue;
    const n = normalize(card.location);
    if (!n.includes("sp")) continue;

    let regiao = null;
    if (!REGIOES.INTERIOR_SP.excluirCidades.some(c => n.includes(c))) {
      regiao = "interior-sp";
    }

    if (!regiao) continue;

    await page.goto(card.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const data = await page.evaluate(() => {
      const nome = document.querySelector("h1")?.innerText.trim() || null;

      let status = null;
      document.querySelectorAll("li").forEach(li => {
        const t = li.innerText.trim();
        if (/lançamento|breve|obras|pronto/i.test(t)) status = t;
      });

      return { nome, status };
    });

    empreendimentos.push({
      regiao,
      url: card.url,
      location: card.location,
      nome: data.nome,
      status: data.status,
    });
  }

  await browser.close();
  return empreendimentos;
}
