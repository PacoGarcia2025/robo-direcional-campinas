/**
 * ==================================================
 * ROBÔ MRV – EXTRAÇÃO INTERIOR DE SÃO PAULO
 * ==================================================
 */

import { chromium } from "playwright";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";

// ===============================
// REGIÕES DO ESTADO DE SÃO PAULO
// ===============================

const GRANDE_SP = new Set([
  "São Paulo",
  "Guarulhos",
  "Osasco",
  "Santo André",
  "São Bernardo Do Campo",
  "São Caetano Do Sul",
  "Diadema",
  "Mauá",
  "Ribeirão Pires",
  "Rio Grande Da Serra",
  "Barueri",
  "Carapicuíba",
  "Cotia",
  "Itapevi",
  "Jandira",
  "Santana De Parnaíba",
  "Taboão Da Serra",
  "Embu Das Artes",
  "Itapecerica Da Serra",
  "Poá",
  "Suzano",
  "Ferraz De Vasconcelos",
  "Itaquaquecetuba",
  "Arujá",
  "Mogi Das Cruzes",
  "Caieiras",
  "Francisco Morato",
  "Franco Da Rocha"
]);

const LITORAL_SP = new Set([
  "Santos",
  "São Vicente",
  "Guarujá",
  "Praia Grande",
  "Cubatão",
  "Bertioga",
  "Mongaguá",
  "Itanhaém",
  "Peruíbe",
  "Caraguatatuba",
  "São Sebastião",
  "Ubatuba",
  "Ilhabela"
]);

function normalizarCidade(cidade) {
  return cidade
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ehInteriorSP(cidade) {
  const c = normalizarCidade(cidade);
  if (!c) return false;

  if ([...GRANDE_SP].some(x => normalizarCidade(x) === c)) return false;
  if ([...LITORAL_SP].some(x => normalizarCidade(x) === c)) return false;

  return true;
}

// ===============================
// ROBÔ PRINCIPAL
// ===============================

export default async function extractMRV() {
  console.log("🚀 Abrindo listagem MRV SP (INTERIOR)");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto(START_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(3000);

  // ===============================
  // 🔹 CARREGAR TODOS OS IMÓVEIS
  // ===============================
  let lastCount = 0;

  while (true) {
    const { count, hasButton } = await page.evaluate(() => {
      const cards = document.querySelectorAll('a[href*="/imoveis/"]');
      const btn = Array.from(document.querySelectorAll("button, a")).find(
        el => el.innerText?.toLowerCase().includes("carregar")
      );

      return {
        count: cards.length,
        hasButton: !!btn,
      };
    });

    if (!hasButton || count === lastCount) break;
    lastCount = count;

    console.log("🔄 Carregando mais imóveis MRV...");
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button, a")).find(
        el => el.innerText?.toLowerCase().includes("carregar")
      );
      if (btn) btn.click();
    });

    await page.waitForTimeout(3000);
  }

  // ===============================
  // 🔹 CAPTURAR LINKS
  // ===============================
  const urls = await page.evaluate(() => {
    const links = new Set();

    document.querySelectorAll("a").forEach(a => {
      if (
        a.href &&
        a.href.includes("/imoveis/") &&
        !a.href.endsWith("/sao-paulo")
      ) {
        links.add(a.href.split("?")[0]);
      }
    });

    return Array.from(links);
  });

  console.log("📦 Empreendimentos encontrados:", urls.length);

  const empreendime
