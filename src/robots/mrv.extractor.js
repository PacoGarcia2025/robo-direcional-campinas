import { chromium } from "playwright";
import fs from "fs";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";
const OUTPUT = "mrv-x09-interior.xml";

/* ===============================
   CONFIGURAÇÃO – INTERIOR SP
================================ */
const CIDADES_EXCLUIDAS = [
  "são paulo",
  "sao paulo",
  "guarulhos",
  "osasco",
  "barueri",
  "santo andre",
  "são bernardo",
  "sao bernardo",
  "sao caetano",
  "diadema",
  "maua",
  "santos",
  "guarujá",
  "guaruja",
  "ubatuba",
  "caraguatatuba",
  "bertioga",
  "são sebastião",
  "sao sebastiao"
];

function isInteriorSP(cidade) {
  if (!cidade) return false;
  const c = cidade.toLowerCase();
  return !CIDADES_EXCLUIDAS.some(ex => c.includes(ex));
}

function clean(text) {
  return text
    ? text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim()
    : "";
}

function optional(tag, value) {
  return value ? `<${tag}><![CDATA[${value}]]></${tag}>` : "";
}

/* ===============================
   ROBÔ PRINCIPAL
================================ */
export default async function extractMRV() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo listagem MRV SP");
  await page.goto(START_URL, { waitUntil: "networkidle" });

  /* ===============================
     CLICAR EM "CARREGAR MAIS"
  ================================ */
  while (true) {
    const btn = await page.$("button:has-text('Carregar mais')");
    if (!btn) break;
    console.log("🔄 Carregando mais imóveis...");
    await btn.click();
    await page.waitForTimeout(2500);
  }

  /* ===============================
     COLETAR LINKS DOS CARDS
  ================================ */
  const links = await page.$$eval(
    "a[href*='/imoveis/sao-paulo/']",
    els => [...new Set(els.map(e => e.href))]
  );

  console.log(`📦 Total de cards encontrados: ${links.length}`);

  const empreendimentos = [];

  /* ===============================
     LOOP EMPREENDIMENTOS
  ================================ */
  for (const url of links) {
    console.log(`➡️ Entrando: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    const titulo = clean(await page.textContent(".highlight-title").catch(() => ""));
    const status = clean(await page.textContent(".highlight-label").catch(() => ""));

    const localizacao = clean(
      await page
        .$eval(".property-details-text", el => el.textContent)
        .catch(() => "")
    );

    let cidade = "";
    let estado = "";

    if (localizacao.includes("-")) {
      [cidade, estado] = localizacao.split("-").map(v => v.trim());
    }

    if (!isInteriorSP(cidade)) {
      console.log(`⛔ Ignorado (não é interior): ${cidade}`);
      continue;
    }

    /* === DORMITÓRIOS === */
    const dormitorios = await page
      .$$eval(".property-details-text", els =>
        els.map(e => e.textContent).find(t => t.toLowerCase().includes("dormit"))
      )
      .catch(() => "");

    /* === DIFERENCIAIS === */
    const diferenciais = await page
      .$$eval("#diferenciais li span", els =>
        els.map(e => e.textContent.trim())
      )
      .catch(() => []);

    /* === FICHA TÉCNICA (CONDICIONAL) === */
    async function ficha(label) {
      return await page
        .$$eval(".accordion-subtitle", (els, lbl) => {
          for (let i = 0; i < els.length; i++) {
            if (els[i].textContent.toLowerCase().includes(lbl)) {
              const next = els[i].nextElementSibling;
              return next ? next.textContent.trim() : "";
            }
          }
          return "";
        }, label.toLowerCase())
        .catch(() => "");
    }

    const endereco = await ficha("endereço");
    const areaTerreno = await ficha("área total");
    const areaLazer = await ficha("área de lazer");
    const proximidade = await ficha("proximidade");
    const realizacao = await ficha("realização");
    const registro = await ficha("registro");

    const entrega = await ficha("entrega");
    const torres = await ficha("torres");
    const unidades = await ficha("unidades");
    const vagas = await ficha("vagas");

    /* === IMAGENS === */
    const fotos = await page.$$eval(
      "img[src*='cdn.mrv.com.br']",
      imgs =>
        [...new Set(imgs.map(i => i.src))].filter(
          s =>
            !s.toLowerCase().includes("logo") &&
            !s.toLowerCase().includes("icone")
        )
    );

    /* === XML === */
    empreendimentos.push(`
  <empreendimento>
    <id>${url.split("/").pop()}</id>
    <titulo><![CDATA[${titulo}]]></titulo>
    <tipo>Apartamento</tipo>
    <cidade>${cidade}</cidade>
    <estado>${estado}</estado>
    <status><![CDATA[${status}]]></status>

    ${optional("endereco", endereco)}
    ${optional("dormitorios", dormitorios)}
    ${optional("area_terreno", areaTerreno)}
    ${optional("area_lazer", areaLazer)}
    ${optional("proximidades", proximidade)}
    ${optional("realizacao", realizacao)}
    ${optional("registro", registro)}

    ${optional("data_entrega", entrega)}
    ${optional("numero_torres", torres)}
    ${optional("total_unidades", unidades)}
    ${optional("vagas_por_unidade", vagas)}

    <diferenciais>
      ${diferenciais.map(d => `<item>${d}</item>`).join("\n")}
    </diferenciais>

    <fotos>
      ${fotos.map(f => `<foto><![CDATA[${f}]]></foto>`).join("\n")}
    </fotos>
  </empreendimento>
    `);

    console.log(`✅ Adicionado: ${titulo}`);
  }

  /* ===============================
     GERAR XML FINAL
  ================================ */
  const xmlFinal = `<?xml version="1.0" encoding="UTF-8"?>
<empreendimentos>
${empreendimentos.join("\n")}
</empreendimentos>`;

  fs.writeFileSync(OUTPUT, xmlFinal, "utf-8");

  console.log(`📦 XML GERADO COM ${empreendimentos.length} EMPREENDIMENTOS`);
  await browser.close();
}
