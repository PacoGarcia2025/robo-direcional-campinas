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
  "São Bernardo do Campo",
  "São Caetano do Sul",
  "Diadema",
  "Mauá",
  "Ribeirão Pires",
  "Rio Grande da Serra",
  "Barueri",
  "Carapicuíba",
  "Cotia",
  "Itapevi",
  "Jandira",
  "Santana de Parnaíba",
  "Taboão da Serra",
  "Embu das Artes",
  "Itapecerica da Serra",
  "Poá",
  "Suzano",
  "Ferraz de Vasconcelos",
  "Itaquaquecetuba",
  "Arujá",
  "Mogi das Cruzes",
  "Caieiras",
  "Francisco Morato",
  "Franco da Rocha"
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

  const empreendimentos = [];

  // ===============================
  // 🔹 LOOP DOS EMPREENDIMENTOS
  // ===============================
  for (const url of urls) {
    console.log("➡️ Coletando:", url);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await page.waitForTimeout(2500);

      const data = await page.evaluate(() => {
        const textoPagina = document.body.innerText;

        // TÍTULO
        const titulo =
          document.querySelector("h1, h2")?.innerText.trim() || null;

        // STATUS
        const status =
          document.querySelector("[class*=label], [class*=status]")
            ?.innerText.trim() || null;

        // CIDADE / ESTADO
        let cidade = null;
        const estado = "SP";

        const matchCidade = textoPagina.match(
          /Apartamentos em\s+([A-Za-zÀ-ú\s]+)\s*\/\s*SP/i
        );

        if (matchCidade && matchCidade[1]) {
          cidade = matchCidade[1]
            .replace(/\s+/g, " ")
            .trim();
        }

        // DIFERENCIAIS
        const diferenciais = Array.from(
          document.querySelectorAll(".sc-jQybuE li span")
        )
          .map(el => el.innerText.trim())
          .filter(Boolean);

        // TIPOLOGIAS
        const tipologias = [];
        const tipologiaList = document.querySelector("#fichatecnica ul");

        if (tipologiaList) {
          tipologiaList.querySelectorAll("li").forEach(li => {
            const text = li.innerText;
            const dorm = text.match(/(\d+)\s*Quartos?/i)?.[1];
            const area = text.match(/([\d.,]+)\s*m²/i)?.[1];

            if (dorm && area) {
              tipologias.push({
                dormitorios: Number(dorm),
                area: Number(area.replace(",", ".")),
              });
            }
          });
        }

        // IMAGENS (REFINO PROFISSIONAL)
        const imagens = Array.from(document.images)
          .map(img => img.src)
          .filter(src => {
            if (!src) return false;
            const s = src.toLowerCase();

            if (!s.includes("/imoveis/upload/imagens/")) return false;
            if (s.includes("logo")) return false;
            if (s.includes("icone")) return false;
            if (s.includes("icon")) return false;
            if (s.includes("svg")) return false;
            if (s.includes("placeholder")) return false;
            if (!s.match(/\.(jpg|jpeg|png|webp)$/)) return false;

            return true;
          });

        return {
          titulo,
          cidade,
          estado,
          status,
          tipologias,
          diferenciais,
          imagens: [...new Set(imagens)],
        };
      });

      // ===============================
      // 🔥 FILTRO INTERIOR DE SP
      // ===============================
      if (!ehInteriorSP(data.cidade)) {
        console.log(
          `⛔ Ignorado (não é interior): ${data.titulo} - ${data.cidade}`
        );
        continue;
      }

      const id = url.split("/").filter(Boolean).pop();

      empreendimentos.push({
        id,
        url,
        titulo: data.titulo,
        cidade: data.cidade,
        estado: data.estado,
        status: data.status,
        tipologias: data.tipologias,
        diferenciais: data.diferenciais,
        imagens: data.imagens,
        fonte: "MRV",
        coletado_em: new Date().toISOString(),
      });

    } catch (err) {
      console.error("❌ Erro ao processar:", url);
      console.error(err.message);
    }
  }

  await browser.close();

  console.log("✅ Empreendimentos MRV (INTERIOR SP):", empreendimentos.length);
  return empreendimentos;
}
