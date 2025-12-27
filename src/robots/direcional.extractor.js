// ==================================================
// ROBÔ DIRECIONAL – INTERIOR SP (VERSÃO FINAL)
// COLETA COMPLETA + PAYLOAD RICO
// ==================================================

import { chromium } from "playwright";

const START_URL = "https://www.direcional.com.br/encontre-seu-apartamento/";

const REGIAO = {
  nome: "interior-sp",
  excluirCidades: [
    // Grande SP
    "sao paulo","guarulhos","osasco","barueri","santo andre","sao bernardo do campo",
    "sao caetano do sul","diadema","maua","ribeirao pires","rio grande da serra",
    "carapicuiba","itapevi","jandira","cotia","embu das artes","embu guacu",
    "itapecerica da serra","taboao da serra","santana de parnaiba",
    // Litoral
    "santos","sao vicente","praia grande","guaruja","cubatão","bertioga",
    "itanhaem","mongagua","peruibe","caraguatatuba","ubatuba","ilhabela","sao sebastiao",
  ],
};

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

  // 🔹 Carregar todos os cards
  while (true) {
    const btn = await page.$('button:has-text("Carregar mais")');
    if (!btn || !(await btn.isVisible())) break;
    await btn.click();
    await page.waitForTimeout(2500);
  }

  // 🔹 Captura cards
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

const [cidade, estado] = card.location.split("/").map(t => t.trim());

    await page.goto(card.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      const titulo = document.querySelector("h1")?.innerText.trim() || null;

      // STATUS
      let status = null;
      document.querySelectorAll("li").forEach(li => {
        const t = li.innerText.trim();
        if (/lançamento|breve|obras|pronto/i.test(t)) status = t;
      });

      // 🔹 TIPOLOGIAS
      const tipologias = [];
      let areas = [];
      let dorms = [];

      document.querySelectorAll("ul.pl-3 li span").forEach(el => {
        const text = el.innerText;

        if (text.includes("m²")) {
          areas = text
            .replace(/\s/g, "")
            .split("|")
            .map(a => a.replace("m²", "").replace(",", "."));
        }

        if (text.toLowerCase().includes("quarto")) {
          dorms = text.match(/\d+/g) || [];
        }
      });

      areas.forEach(a => {
        dorms.forEach(d => {
          tipologias.push({
            dormitorios: Number(d),
            area: Number(a),
          });
        });
      });

      // 🔹 IMAGENS LIMPAS
      const imagens = Array.from(document.querySelectorAll("img"))
  .filter(img => {
    const src = img.src || "";
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;

    // origem válida
    if (!src.includes("/wp-content/uploads/")) return false;

    // remover lixo conhecido
    if (
      src.includes("icon") ||
      src.includes("logo") ||
      src.includes("sheet") ||
      src.includes("button") ||
      src.includes("sprite")
    ) {
      return false;
    }

    // somente imagens grandes
    if (w < 600 || h < 400) return false;

    return true;
  })
  .map(img => img.src);


      // 🔹 FICHA TÉCNICA
      const ficha = {};
      document.querySelectorAll("li p").forEach(p => {
        const strong = p.querySelector("strong");
        if (!strong) return;
        const chave = strong.innerText.replace(":", "").trim();
        const valor = p.innerText.replace(strong.innerText, "").trim();
        if (chave && valor) ficha[chave] = valor;
      });

      return { titulo, status, tipologias, imagens, ficha };
    });

    empreendimentos.push({
      id: card.url.split("/").filter(Boolean).pop(),
      regiao: REGIAO.nome,
      url: card.url,
      cidade,
      estado,
      titulo: data.titulo,
      status: data.status,
      tipologias: data.tipologias,
      imagens: [...new Set(data.imagens)],
      ficha_tecnica: data.ficha,
    });
  }

  await browser.close();
  return empreendimentos;
}
