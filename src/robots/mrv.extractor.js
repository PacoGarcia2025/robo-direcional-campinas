/**
 * ==================================================
 * GERADOR XML X09 – MRV (INTERIOR SP)
 * CORRIGE:
 * - <titulo> vazio
 * - <status> inválido ("Estado")
 * - tags XML quebradas
 * - empreendimentos sem fotos
 * - tipos incorretos (Apartamento / Casa / Lote)
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
    .replace(/>/g, "&gt;");
}

function inferirTipo(id) {
  if (id.startsWith("casas-")) return "Casa";
  if (id.startsWith("lotes-")) return "Lote";
  return "Apartamento";
}

function validar(e) {
  if (!e.id) return false;
  if (!e.titulo) return false;
  if (!e.cidade) return false;
  if (!e.imagens || !e.imagens.length) return false;
  return true;
}

// ===============================
// GERADOR
// ===============================
export function gerarXmlX09MRVInterior(empreendimentos = []) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<empreendimentos>\n`;

  let total = 0;

  for (const e of empreendimentos) {
    if (!validar(e)) continue;

    const tipo = inferirTipo(e.id);
    const status = e.status && e.status !== "Estado" ? e.status : "Disponível";

    xml += `  <empreendimento>\n`;
    xml += `    <id>${escapeXml(e.id)}</id>\n`;
    xml += `    <titulo><![CDATA[${e.titulo}]]></titulo>\n`;
    xml += `    <tipo>${tipo}</tipo>\n`;
    xml += `    <cidade>${escapeXml(e.cidade)}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status><![CDATA[${status}]]></status>\n`;

    const descricao = [];
    if (e.tipologias?.length) {
      const dorms = [...new Set(e.tipologias.map(t => t.dormitorios))].sort();
      descricao.push(`${dorms.join(" e ")} dormitórios`);
    }
    if (e.diferenciais?.length) {
      descricao.push(e.diferenciais.slice(0, 5).join(", "));
    }

    xml += `    <descricao><![CDATA[${descricao.join(" | ")}]]></descricao>\n`;
    xml += `    <fotos>\n`;

    for (const img of e.imagens) {
      xml += `      <foto><![CDATA[${img}]]></foto>\n`;
    }

    xml += `    </fotos>\n`;
    xml += `  </empreendimento>\n`;

    total++;
  }

  xml += `</empreendimentos>\n`;

  const filePath = path.join(OUTPUT_DIR, OUTPUT_FILE);
  fs.writeFileSync(filePath, xml, "utf8");

  console.log(`📦 XML X09 MRV INTERIOR gerado: ${total} empreendimentos`);
  return filePath;
}
