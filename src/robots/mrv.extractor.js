/**
 * ==================================================
 * GERADOR XML X09 – MRV | INTERIOR DE SÃO PAULO
 * ==================================================
 */

import fs from "fs";
import path from "path";

const OUTPUT_DIR = "output/xml-x09";
const OUTPUT_FILE = "mrv-interior-sp.xml";

// ===============================
// HELPERS
// ===============================
function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function validarEmpreendimento(e) {
  if (!e.id) return "id ausente";
  if (!e.titulo) return "titulo ausente";
  if (!e.cidade) return "cidade ausente";
  if (!e.estado) return "estado ausente";
  if (!e.tipologias || !e.tipologias.length)
    return "tipologias ausentes";
  if (!e.imagens || !e.imagens.length)
    return "imagens ausentes";

  return null;
}

// ===============================
// GERADOR PRINCIPAL
// ===============================
export function gerarXmlX09MRVInterior(empreendimentos = []) {
  if (!Array.isArray(empreendimentos)) {
    throw new Error("Entrada inválida: esperado array");
  }

  const validos = [];
  const ignorados = [];

  for (const e of empreendimentos) {
    const erro = validarEmpreendimento(e);

    if (erro) {
      ignorados.push({
        id: e.id || "desconhecido",
        motivo: erro,
      });
      continue;
    }

    validos.push(e);
  }

  if (!validos.length) {
    throw new Error("Nenhum empreendimento válido para gerar XML X09");
  }

  console.log("✅ Empreendimentos válidos:", validos.length);
  console.log("⚠️ Ignorados:", ignorados.length);

  if (ignorados.length) {
    console.table(ignorados);
  }

  // ===============================
  // MONTAGEM XML
  // ===============================
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<X09>\n`;
  xml += `  <origem>MRV</origem>\n`;
  xml += `  <estado>SP</estado>\n`;
  xml += `  <regiao>interior</regiao>\n`;
  xml += `  <empreendimentos>\n`;

  for (const e of validos) {
    xml += `    <empreendimento id="${escapeXml(e.id)}">\n`;
    xml += `      <titulo>${escapeXml(e.titulo)}</titulo>\n`;
    xml += `      <cidade>${escapeXml(e.cidade)}</cidade>\n`;
    xml += `      <estado>SP</estado>\n`;

    // STATUS
    if (e.status) {
      xml += `      <status>${escapeXml(e.status)}</status>\n`;
    }

    // TIPOLOGIAS
    xml += `      <tipologias>\n`;
    for (const t of e.tipologias) {
      xml += `        <tipologia>\n`;
      xml += `          <dormitorios>${t.dormitorios}</dormitorios>\n`;
      xml += `          <area>${t.area}</area>\n`;
      xml += `        </tipologia>\n`;
    }
    xml += `      </tipologias>\n`;

    // DIFERENCIAIS
    if (e.diferenciais?.length) {
      xml += `      <diferenciais>\n`;
      for (const d of e.diferenciais) {
        xml += `        <item>${escapeXml(d)}</item>\n`;
      }
      xml += `      </diferenciais>\n`;
    }

    // IMAGENS
    xml += `      <imagens>\n`;
    for (const img of e.imagens) {
      xml += `        <imagem>${escapeXml(img)}</imagem>\n`;
    }
    xml += `      </imagens>\n`;

    // METADADOS
    xml += `      <fonte>MRV</fonte>\n`;
    xml += `      <coletado_em>${escapeXml(e.coletado_em)}</coletado_em>\n`;

    xml += `    </empreendimento>\n`;
  }

  xml += `  </empreendimentos>\n`;
  xml += `</X09>\n`;

  // ===============================
  // SALVAR ARQUIVO
  // ===============================
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filePath = path.join(OUTPUT_DIR, OUTPUT_FILE);
  fs.writeFileSync(filePath, xml, "utf8");

  console.log("📄 XML X09 gerado com sucesso:");
  console.log(filePath);

  return filePath;
}
