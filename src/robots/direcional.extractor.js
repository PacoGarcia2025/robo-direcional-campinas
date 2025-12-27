// ===============================
// ARQUIVO: src/robots/direcional.extractor.js
// LISTAGEM DIRECIONAL + FILTRO RMC
// ARQUITETURA PREPARADA PARA ESCALA
// ===============================

import { chromium } from "playwright";

// ===============================
// CONFIGURAÇÃO DE FILTRO (ESCALÁVEL)
// ===============================
const FILTRO = {
  tipo: "RMC", // depois pode virar "ESTADO"
  estado: "SP",
  cidades: [
    "Campinas",
    "Sumaré",
    "Hortolândia",
    "Valinhos",
    "Vinhedo",
    "Paulínia",
    "Indaiatuba",
    "Itatiba",
    "Nova Odessa",
    "Americana",
    "Monte Mor",
    "Artur Nogueira",
    "Engenheiro Coelho",
    "Holambra",
    "Jaguariúna",
    "Pedreira",
    "Santo Antônio de Posse",
  ],
};

const START_URL =
  "https://www.direcional.com.br/encontre-seu-apartamento/";

export default async function extractDirecional() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo página de listagem Direcional");

  await page.goto(START_URL, { waitUntil: "domcontentloaded" });

  // ===============================
  // 1️⃣ CLICAR EM "CARREGAR MAIS"
  // ===============================
  let clicks = 0;

  while (true) {
    try {
      const button = await page.$(
        'button:has-text("Carregar mais")'
      );

      if (!button) {
        console.log("✅ Botão 'Carregar mais' não encontrado. Fim.");
        break;
      }

      clicks++;
      console.log(`👉 Clicando em 'Carregar mais' (${clicks})`);

      await button.click();
      await page.waitForTimeout(3000);
    } catch {
      break;
    }
  }

  // ===============================
  // 2️⃣ EXTRAIR CARDS + LOCALIZAÇÃO
  // ===============================
  const cards = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll('a[href*="/empreendimentos/"]')
    ).map((a) => {
      const card = a.closest("div");

      let locationText = null;

      if (card) {
        const loc = card.querySelector(".location p");
        if (loc) locationText = loc.innerText.trim();
      }

      return {
        url: a.href.split("#")[0],
        location: locationText, // ex: "Campinas / SP"
      };
    });
  });

  const uniqueCards = [
    ...new Map(cards.map((c) => [c.url, c])).values(),
  ];

  console.log("📦 Total de cards únicos:", uniqueCards.length);

  // ===============================
  // 3️⃣ FILTRO POR RMC (ESCALÁVEL)
  // ===============================
  const filtrados = uniqueCards.filter((card) => {
    if (!card.location) return false;

    const [cidade, estado] = card.location
      .split("/")
      .map((t) => t.trim());

    if (FILTRO.tipo === "RMC") {
      return (
        estado === FILTRO.estado &&
        FILTRO.cidades.includes(cidade)
      );
    }

    if (FILTRO.tipo === "ESTADO") {
      return estado === FILTRO.estado;
    }

    return false;
  });

  console.log(
    `🏙️ Empreendimentos filtrados (${FILTRO.tipo}):`,
    filtrados.length
  );

  // ===============================
  // 4️⃣ NORMALIZA RESULTADO
  // ===============================
  const empreendimentos = filtrados.map((card) => {
    const [cidade, estado] = card.location
      .split("/")
      .map((t) => t.trim());

    return {
      url: card.url,
      cidade,
      estado,
    };
  });

  await browser.close();

  return empreendimentos;
}
