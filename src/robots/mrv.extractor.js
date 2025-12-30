/**
 * ROBÔ DEFINITIVO MRV – INTERIOR DE SÃO PAULO → XML X09
 *
 * REGRAS FIXAS (CONFORME DEFINIDO):
 * - URL BASE: https://www.mrv.com.br/imoveis/sao-paulo
 * - Clica em "Carregar mais imóveis" até o botão SUMIR
 * - Entra em TODOS os cards
 * - FILTRA: apenas empreendimentos do INTERIOR DE SP
 *   (exclui São Paulo capital, Guarulhos, Osasco, ABC, litoral etc.)
 * - Nunca inventa dados
 * - Campos condicionais: só entra no XML se EXISTIREM
 * - Região/Bairro IGNORADO
 * - Gera XML X09 válido
 */

import { chromium } from "playwright";
import fs from "fs";

const START_URL = "https://www.mrv.com.br/imoveis/sao-paulo";
const OUTPUT = "mrv-x09-interior.xml";

/* =========================
   CONFIG INTERIOR SP
========================= */
const CIDADES_EXCLUIDAS = [
  "sao paulo",
  "guarulhos",
  "osasco",
  "barueri",
  "santo andre",
  "sao bernardo",
  "sao caetano",
  "diadema",
  "maua",
  "praia",
  "santos",
  "guaruja",
  "ubatuba",
  "caraguatatuba",
  "sao sebastiao",
  "bertioaga",
];

/* =========================
   HELPERS
========================= */
const clean = (v) =>
  v ? v.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim() : "";

function isInteriorSP(cidade) {
  if (!cidade) return false;
  const c = cidade.toLowerCase();
  return !CIDADES_EXCLUIDAS.some((ex) => c.includes(ex));
}

function optional(tag, value) {
  return value ? `<${tag}>${value}</${tag}>` : "";
}

/* =========================
   ROBÔ
========================= */
async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🚀 Abrindo listagem MRV SP");
  await page.goto(START_URL, { waitUntil: "networkidle" });

  /* === CARREGAR TODOS OS CARDS === */
  while (true) {
    const botao = await page.$("button:has-text('Carregar mais')");
    if (!botao) break;

    console.log("🔄 Carregando mais imóveis...");
    await botao.click();
    await page.waitForTimeout(2500);
  }

  /* === COLETAR LINKS DOS CARDS === */
  const links = await page.$$eval(
    "a[href*='/imoveis/sao-paulo/']",
    (els) =>
      [...new Set(els.map((e) => e.href))].filter((h) =>
        h.includes("/imoveis/sao-paulo/")
      )
  );

  console.log(`📦 Cards encontrados: ${links.length}`);

  let empreendimentosXML = [];

  /* =========================
     LOOP NOS EMPREENDIMENTOS
  ========================= */
  for (const url of links) {
    console.log(`➡️ Entrando: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });

    /* === TÍTULO === */
    const titulo = clean(
      await page.textContent(".highlight-title").catch(() => "")
    );

    /* === STATUS === */
    const status = clean(
      await page.textContent(".highlight-label").catch(() => "")
    );

    /* === CIDADE / ESTADO === */
    const localizacao = clean(
      await page
        .$eval(".property-details-text", (el) => el.textContent)
        .catch(() => "")
    );

    const [cidade, estado] = localizacao
      ? localizacao.split("-").map((v) => v.trim())
      : ["", ""];

    if (!isInteriorSP(cidade)) {
      console.log(`⛔ Ignorado (não é interior): ${cidade}`);
      continue;
    }

    /* === DORMITÓRIOS === */
    const dormitorios = await page
      .$$eval(".property-details-text", (els) =>
        els.map((e) => e.textContent).find((t) => t.includes("dormit"))
      )
      .catch(() => "");

    /* === DIFERENCIAIS === */
    const diferenciais = await page
      .$$eval("#diferenciais li span", (els) =>
        els.map((e) => e.textContent.trim())
      )
      .catch(() => []);

    /* === FICHA TÉCNICA (CONDICIONAL) === */
    async function ficha(label) {
      return await page
        .$$eval(".accordion-subtitle", (els, lbl) => {
          for (let i = 0; i < els.length; i++) {
            if (
              els[i].textContent.toLowerCase().includes(lbl.toLowerCase())
            ) {
              const next = els[i].nextElementSibling;
              return next ? next.textContent.trim() : "";
            }
          }
          return "";
        }, label)
        .catch(() => "");
    }

    const endereco = await ficha("endereço");
    const areaTerreno = await ficha("área total");
    const areaLazer = await ficha("área de lazer");
    const proximidade = await ficha("proximidade");
    const realizacao = await ficha("realização");
    const registro = await ficha("registro");

    // CAMPOS OPCIONAIS
    const entrega = await ficha("entrega");
    const torres = await ficha("torres");
    const unidades = await ficha("unidades");
    const vagas = await ficha("vagas");

    /* === IMAGENS (LIMPAS) === */
    const fotos = await page.$$eval(
      "img[src*='cdn.mrv.com.br']",
      (imgs) =>
        [...new Set(imgs.map((i) => i.src))].filter(
          (s) =>
            !s.toLowerCase().includes("logo") &&
            !s.toLowerCase().includes("icone")
        )
    );

    /* === XML EMPREENDIMENTO === */
    const xml = `
  <empreendimento>
    <id>${url.split("/").pop()}</id>
    <titulo><![CDATA[${titulo}]]></titulo>
    <tipo>Apartamento</tipo>
    <cidade>${cidade}</cidade>
    <estado>${estado}</estado>
    <status><![CDATA[${status}]]></status>
    <descricao><![CDATA[]]></descricao>

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
      ${diferenciais.map((d) => `<item>${d}</item>`).join("\n")}
    </diferenciais>

    <fotos>
      ${fotos.map((f) => `<foto><![CDATA[${f}]]></foto>`).join("\n")}
    </fotos>
  </empreendimento>`;

    empreendimentosXML.push(xml);
    console.log(`✅ Adicionado: ${titulo}`);
  }

  /* =========================
     XML FINAL
  ========================= */
  const xmlFinal = `<?xml version="1.0" encoding="UTF-8"?>
<empreendimentos>
${empreendimentosXML.join("\n")}
</empreendimentos>`;

  fs.writeFileSync(OUTPUT, xmlFinal, "utf-8");

  console.log(`📦 XML X09 INTERIOR SP GERADO: ${empreendimentosXML.length}`);
  await browser.close();
}

run().catch(console.error);
