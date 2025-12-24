import fs from "fs";
import path from "path";

const INPUT_JSON = path.resolve("src/output/direcional-campinas.json");
const OUTPUT_XML = path.resolve("src/output/direcional-campinas.xml");

function toStringSafe(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeXml(value) {
  const str = toStringSafe(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function bool(value) {
  return value ? "true" : "false";
}

const data = JSON.parse(fs.readFileSync(INPUT_JSON, "utf-8"));

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<imoveis>\n`;

for (const imovel of data) {
  const unidade = imovel.unit_features || [];
  const lazer = imovel.condo_features || [];
  const fotos = imovel.images || [];

  xml += `  <imovel>\n`;

  // 🔹 Identificação
  xml += `    <id>${escapeXml(imovel.id || imovel.title)}</id>\n`;
  xml += `    <titulo>${escapeXml(imovel.title)}</titulo>\n`;
  xml += `    <tipo>Apartamento</tipo>\n`;

  // 🔹 Localização
  xml += `    <cidade>${escapeXml(imovel.location?.city)}</cidade>\n`;
  xml += `    <estado>${escapeXml(imovel.location?.state)}</estado>\n`;
  xml += `    <bairro>${escapeXml(imovel.location?.neighborhood)}</bairro>\n`;
  xml += `    <rua></rua>\n`;

  // 🔹 Status
  xml += `    <status>${escapeXml(imovel.status)}</status>\n`;

  // 🔹 Ficha técnica (não inventar dados)
  xml += `    <data_entrega></data_entrega>\n`;
  xml += `    <estoque_unidades></estoque_unidades>\n`;
  xml += `    <total_unidades></total_unidades>\n`;
  xml += `    <num_andares></num_andares>\n`;
  xml += `    <unidades_por_andar></unidades_por_andar>\n`;
  xml += `    <tabela_precos>Valores sob consulta</tabela_precos>\n`;
  xml += `    <video_url></video_url>\n`;

  // 🔹 Tipologias
  if (imovel.typologies?.length) {
    xml += `    <tipologias>${escapeXml(imovel.typologies)}</tipologias>\n`;
  }

  // 🔹 Descrição
  xml += `    <descricao>${escapeXml(imovel.description || imovel.title)}</descricao>\n`;

  // 🔹 Fotos
  if (fotos.length) {
    xml += `    <fotos>\n`;
    for (const foto of fotos) {
      const url = typeof foto === "string" ? foto : foto.url;
      if (url) {
        xml += `      <foto>${escapeXml(url)}</foto>\n`;
      }
    }
    xml += `    </fotos>\n`;
  }

  // 🔹 DIFERENCIAIS DA UNIDADE
  xml += `    <tem_varanda_gourmet>${bool(unidade.some(v => /varanda/i.test(v)))}</tem_varanda_gourmet>\n`;
  xml += `    <tem_suite>${bool(unidade.some(v => /su[ií]te/i.test(v)))}</tem_suite>\n`;
  xml += `    <tem_ar_condicionado>${bool(unidade.some(v => /ar|infra/i.test(v)))}</tem_ar_condicionado>\n`;
  xml += `    <diferenciais_unidade>${escapeXml(unidade)}</diferenciais_unidade>\n`;

  // 🔹 LAZER / CONDOMÍNIO
  xml += `    <tem_piscina>${bool(lazer.some(v => /piscina/i.test(v)))}</tem_piscina>\n`;
  xml += `    <tem_academia>${bool(lazer.some(v => /academia|fitness/i.test(v)))}</tem_academia>\n`;
  xml += `    <tem_salao_festas>${bool(lazer.some(v => /sal[aã]o/i.test(v)))}</tem_salao_festas>\n`;
  xml += `    <tem_espaco_gourmet>${bool(lazer.some(v => /gourmet/i.test(v)))}</tem_espaco_gourmet>\n`;
  xml += `    <tem_elevador>${bool(lazer.some(v => /elevador/i.test(v)))}</tem_elevador>\n`;
  xml += `    <tem_solarium>${bool(lazer.some(v => /solarium/i.test(v)))}</tem_solarium>\n`;
  xml += `    <tem_pet_place>${bool(lazer.some(v => /pet/i.test(v)))}</tem_pet_place>\n`;
  xml += `    <tem_portaria_24h>${bool(lazer.some(v => /portaria/i.test(v)))}</tem_portaria_24h>\n`;
  xml += `    <outros_itens_lazer>${escapeXml(lazer)}</outros_itens_lazer>\n`;

  // 🔹 Arquivos
  xml += `    <arquivo_book></arquivo_book>\n`;
  xml += `    <arquivo_tabela_precos></arquivo_tabela_precos>\n`;
  xml += `    <arquivo_memorial></arquivo_memorial>\n`;

  xml += `  </imovel>\n`;
}

xml += `</imoveis>`;

fs.writeFileSync(OUTPUT_XML, xml, "utf-8");

console.log("✅ XML X09 gerado com sucesso!");
console.log("📄 Arquivo:", OUTPUT_XML);
