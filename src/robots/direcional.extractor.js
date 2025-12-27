// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// LISTAGEM DIRECIONAL + FILTRO RMC (ROBUSTO)
// ===============================

import { chromium } from "playwright";

// ===============================
// CONFIGURAÇÃO DE FILTRO (ESCALÁVEL)
// ===============================
const FILTRO = {
  tipo: "RMC",
  estado: "SP",
  cidades: [
    "campinas",
    "sumare",
    "hortolandia",
    "valinhos",
    "vinhedo",
    "paulinia",
    "indaiatuba",
    "itatiba",
    "nova odessa",
    "americana",
    "monte mor",
    "artur nogueira",
    "engenheiro coelho",
    "holambra",
    "jaguariuna",
    "pedreira",
    "santo antonio de posse",
  ],
};

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
  // 1️⃣ CLICAR EM "CARREGAR MAIS" (ROBUSTO)
  // ===============================
  while (true) {
    const button = await page.$('button:has-text("Carregar mais")');

    if (!button) {
      console.log("✅ Botão não existe mais");
      break;
    }

    const isVisible = await button.isVisible();
    const isDisabled = await button.isDisabled().catch(() => false);

    if (!isVisible || isDisabled) {
      console.log("✅ Botão não está mais visível/clicável");
      break;
    }

    console.log("👉 Clicando em 'Carregar mais'");
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
  // 3️⃣ FILTRO RMC ROBUSTO
  // ===============================
  const filtrados = uniqueCards.filter((card) => {
    if (!card.location) return false;

    const normalized = normalize(card.location);

    const estadoOk = normalized.includes(
      normalize(FILTRO.estado)
    );

    const cidadeOk = FILTRO.cidades.some((cidade) =>
      normalized.includes(cidade)
    );

    return estadoOk && cidadeOk;
  });

  console.log(
    `🏙️ Empreendimentos filtrados (RMC):`,
    filtrados.length
  );

  // ===============================
  // 4️⃣ NORMALIZA RESULTADO
  // ===============================
  const empreendimentos = filtrados.map((card) => ({
    url: card.url,
    location: card.location,
  }));

  await browser.close();

  return empreendimentos;
}
