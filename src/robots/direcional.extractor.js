// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// ROBÔ DIRECIONAL – INTERIOR DE SP
// PIPELINE COMPLETO + FICHA TÉCNICA ROBUSTA
// ===============================

import { chromium } from "playwright";

const REGIOES = {
  INTERIOR_SP: {
    excluirCidades: [
      "sao paulo","guarulhos","osasco","barueri","santo andre","sao bernardo do campo",
      "sao caetano do sul","diadema","maua","ribeirao pires","rio grande da serra",
      "carapicuiba","itapevi","jandira","cotia","embu das artes","embu guacu",
      "itapecerica da serra","taboao da serra","santana de parnaiba",
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

  console.log("🚀 Abrindo página de listagem Direcional");
  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;
    await btn.click();
    await page.waitForTimeout(2500);
  }

  const cards = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href*="/empreendimentos/"]'))
      .map(a => {
        const card = a.closest("div");
        const loc = card?.querySelector(".location p")?.innerText || null;
        return { url: a.href.split("#")[0], location: loc };
      })
  );

  const unique = [...new Map(cards.map(c => [c.url, c])).values()];
  console.log("📦 Total de cards únicos:", unique.length);

  const filtrados = unique.filter(c => {
    if (!c.location) return false;
    const n = normalize(c.location);
    if (!n.includes("sp")) return false;
    return !REGIOES.INTERIOR_SP.excluirCidades.some(x => n.includes(x));
  });

  console.log("🏙️ Empreendimentos filtrados (INTERIOR_SP):", filtrados.length);

  const empreendimentos = [];

  for (const item of filtrados) {
    await page.goto(item.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const nome = document.querySelector("h1")?.innerText.trim() || null;

      let status = null;
      document.querySelectorAll("li").forEach(li => {
        const t = li.innerText.trim();
        if (/lançamento|breve|obras|pronto/i.test(t)) status = t;
      });

      // ===============================
      // FICHA TÉCNICA – MULTI LAYOUT
      // ===============================
      const ficha = {};

      // 1️⃣ Padrão clássico
      document.querySelectorAll("li p").forEach(p => {
        const strong = p.querySelector("strong");
        if (!strong) return;
        const chave = strong.innerText.replace(":", "").trim();
        const valor = p.innerText.replace(strong.innerText, "").trim();
        if (chave && valor) ficha[chave] = valor;
      });

      return { nome, status, ficha };
    });

    console.log(
      `📑 ${data.nome || "SEM NOME"} → ficha técnica: ${
        Object.keys(data.ficha).length
      } campos`
    );

    empreendimentos.push({
      url: item.url,
      location: item.location,
      nome: data.nome,
      status: data.status,
      ficha_tecnica: data.ficha,
    });
  }

  await browser.close();
  return empreendimentos;
}
