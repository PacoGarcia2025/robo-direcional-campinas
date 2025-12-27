// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// LISTAGEM DIRECIONAL – INTERIOR SP
// ENRIQUECIMENTO: NOME + STATUS + TIPOLOGIA
// ===============================

import { chromium } from "playwright";

// ===============================
// CONFIGURAÇÃO DE REGIÕES
// ===============================
const REGIOES = {
  INTERIOR_SP: {
    estado: "SP",
    excluirCidades: [
      // Grande São Paulo
      "sao paulo",
      "guarulhos",
      "osasco",
      "barueri",
      "santo andre",
      "sao bernardo do campo",
      "sao caetano do sul",
      "diadema",
      "maua",
      "ribeirao pires",
      "rio grande da serra",
      "carapicuiba",
      "itapevi",
      "jandira",
      "cotia",
      "embu das artes",
      "embu guacu",
      "itapecerica da serra",
      "taboao da serra",
      "santana de parnaiba",

      // Litoral Paulista
      "santos",
      "sao vicente",
      "praia grande",
      "guaruja",
      "cubatão",
      "bertioga",
      "itanhaem",
      "mongagua",
      "peruibe",
      "caraguatatuba",
      "ubatuba",
      "ilhabela",
      "sao sebastiao",
    ],
  },
};

const REGIAO_ATIVA = "INTERIOR_SP";

const START_URL =
  "https://www.direcional.com.br/encontre-seu-apartamento/";

// ===============================
// NORMALIZA TEXTO
// ===============================
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/regiao de/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo página de listagem Direcional");

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // ===============================
  // 1️⃣ CLICAR EM "CARREGAR MAIS"
  // ===============================
  while (true) {
    const button = await page.$('button:has-text("Carregar mais")');
    if (!button) break;
    if (!(await button.isVisible())) break;

    await button.click();
    await page.waitForTimeout(2500);
  }

  // ===============================
  // 2️⃣ EXTRAIR CARDS
  // ===============================
  const cards = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('a[href*="/empreendimentos/"]')
    ).map((a) => {
      const card = a.closest("div");
      let locationText = null;

      if (card) {
        const loc = card.querySelector(".location p");
        if (loc) locationText = loc.innerText;
      }

      return {
        url: a.href.split("#")[0],
        location: locationText,
      };
    });
  });

  const uniqueCards = [
    ...new Map(cards.map((c) => [c.url, c])).values(),
  ];

  console.log("📦 Total de cards únicos:", uniqueCards.length);

  // ===============================
  // 3️⃣ FILTRO – INTERIOR DE SP
  // ===============================
  const cfg = REGIOES[REGIAO_ATIVA];

  const filtrados = uniqueCards.filter((card) => {
    if (!card.location) return false;

    const normalized = normalize(card.location);

    if (!normalized.includes("sp")) return false;

    for (const cidade of cfg.excluirCidades) {
      if (normalized.includes(cidade)) {
        return false;
      }
    }

    return true;
  });

  console.log(
    `🏙️ Empreendimentos filtrados (${REGIAO_ATIVA}):`,
    filtrados.length
  );

  // ===============================
  // 4️⃣ ENTRAR NO LINK E PEGAR DADOS
  // ===============================
  const empreendimentos = [];

  for (const item of filtrados) {
    try {
      await page.goto(item.url, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const data = await page.evaluate(() => {
        // -------------------------------
        // NOME
        // -------------------------------
        const nome =
          document.querySelector("h1")?.innerText.trim() || null;

        // -------------------------------
        // STATUS
        // -------------------------------
        let status = null;
        document.querySelectorAll("ul li").forEach((li) => {
          const t = li.innerText.trim();
          if (
            t.includes("Lançamento") ||
            t.includes("Breve") ||
            t.includes("Obras") ||
            t.includes("Pronto")
          ) {
            status = t;
          }
        });

        // -------------------------------
        // TIPOLOGIA
        // -------------------------------
        let areas = [];
        let dormitorios = [];

        document.querySelectorAll("ul.pl-3 li span").forEach((span) => {
          const text = span.innerText;

          // Áreas
          if (text.includes("m²")) {
            text
              .replace(/\s/g, "")
              .split("|")
              .forEach((a) => {
                const val = a
                  .replace("m²", "")
                  .replace(",", ".");
                if (!isNaN(val)) areas.push(Number(val));
              });
          }

          // Dormitórios
          if (text.toLowerCase().includes("quarto")) {
            const nums = text.match(/\d+/g);
            if (nums) {
              nums.forEach((n) => dormitorios.push(Number(n)));
            }
          }
        });

        const tipologias = [];
        areas.forEach((area) => {
          dormitorios.forEach((d) => {
            tipologias.push({
              dormitorios: d,
              area,
            });
          });
        });

        return { nome, status, tipologias };
      });

      const resumoTipologia =
        data.tipologias.length > 0
          ? data.tipologias
              .map(
                (t) => `${t.dormitorios}Q ${t.area}m²`
              )
              .join(", ")
          : "SEM TIPOLOGIA";

      console.log(
        `🧩 ${data.nome || "SEM NOME"} → ${resumoTipologia}`
      );

      empreendimentos.push({
        url: item.url,
        nome: data.nome,
        status: data.status,
        location: item.location,
        tipologias: data.tipologias,
      });
    } catch (err) {
      console.log("❌ Erro ao processar:", item.url);
    }
  }

  await browser.close();

  return empreendimentos;
}
