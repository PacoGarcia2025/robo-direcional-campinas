import { chromium } from "playwright";
import { extractDirecionalPremium } from "./direcional.extractor.js";

const REGIAO_CAMPINAS = [
  "Campinas",
  "Sumaré",
  "Hortolândia",
  "Monte Mor",
  "Valinhos",
  "Paulínia",
  "Americana",
  "Vinhedo",
  "Indaiatuba",
  "Nova Odessa",
  "Santa Bárbara",
  "Piracicaba",
  "Limeira"
];

export async function runDirecional() {
  console.log("Iniciando Robô Premium - Direcional Campinas");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const page = await browser.newPage();
  await page.goto("https://www.direcional.com.br/empreendimentos", {
    waitUntil: "domcontentloaded"
  });

  console.log("Robô Direcional iniciado (FILTRO REGIONAL CAMPINAS)");

  /* ===========================
     CARREGAR MAIS — MODO SEGURO
     (SEM TIMEOUT FATAL)
  ============================ */
  while (true) {
    const botao = await page.$("button:has-text('Carregar mais')");

    if (!botao) {
      console.log("Botão 'Carregar mais' não encontrado. Finalizando carga.");
      break;
    }

    const visivel = await botao.isVisible();
    if (!visivel) {
      console.log("Botão 'Carregar mais' não está visível. Finalizando carga.");
      break;
    }

    console.log("Clicando em 'Carregar mais'...");
    await botao.click({ force: true });

    // espera novos cards carregarem (sem depender do botão)
    await page.waitForTimeout(2000);
  }

  /* ===========================
     COLETA DE LINKS
  ============================ */
  const links = await page.$$eval(
    'a[href*="/empreendimentos/"]',
    (els) =>
      [...new Set(els.map((a) => a.href))]
        .filter((l) => l.includes("/empreendimentos/"))
  );

  console.log(`Links encontrados: ${links.length}`);

  const resultados = [];

  for (const link of links) {
    console.log("Extraindo:", link);

    try {
      const data = await extractDirecionalPremium(page, link);

      // filtro por estado
      if (data.location?.state !== "SP") {
        console.log("Descartado (fora de SP)");
        continue;
      }

      // filtro por região Campinas
      if (
        !REGIAO_CAMPINAS.some((c) =>
          data.location.city?.toLowerCase().includes(c.toLowerCase())
        )
      ) {
        console.log("Descartado (fora da região de Campinas)");
        continue;
      }

      resultados.push({ url: link, ...data });
    } catch (err) {
      console.log("Erro ao extrair:", link);
    }
  }

  console.log(`✅ FINALIZADO`);
  console.log(`Empreendimentos válidos: ${resultados.length}`);

  const fs = await import("fs");
  const path = "src/output/direcional-campinas.json";

  fs.writeFileSync(path, JSON.stringify(resultados, null, 2));
  console.log(`Arquivo salvo em: ${path}`);

  await browser.close();
  console.log("Robô finalizado com sucesso");
}
