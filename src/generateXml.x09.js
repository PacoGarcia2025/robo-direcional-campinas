import fs from "fs";
import path from "path";

const FOTO_FALLBACK =
  "https://www.direcional.com.br/wp-content/themes/direcional-theme/dist/images/logo-direcional.svg";

// Lista de cidades aceitas no Interior de SP
const INTERIOR_SP_CIDADES = [
  "Campinas",
  "Ribeirão Preto",
  "Sorocaba",
  "Limeira",
  "Araraquara",
  "São Carlos",
  "Piracicaba",
  "Americana",
  "Indaiatuba",
  "Sumaré",
  "Hortolândia",
  "Jundiaí"
];

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;
  let total = 0;

  empreendimentos.forEach((emp) => {
    // 🔒 FILTRO REGIONAL — INTERIOR DE SP
    if (!emp.cidade || !emp.estado) return;
    if (emp.estado !== "SP") return;

    const cidadeLimpa = emp.cidade.split("/")[0].trim();
    if (!INTERIOR_SP_CIDADES.includes(cidadeLimpa)) return;

    const id = (emp.id || emp.titulo || Math.random().toString(36))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo>${emp.titulo || "Empreendimento Direcional"}</titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${cidadeLimpa}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;

    // 🔹 DESCRIÇÃO (SEGURA PARA O X09)
    if (emp.descricao) {
      xml += `    <descricao>${emp.descricao}</descricao>\n`;
    }

    // 🔹 URL DO EMPREENDIMENTO
    if (emp.url) {
      xml += `    <url>${emp.url}</url>\n`;
    }

    // 🔹 FOTOS (OBRIGATÓRIO)
    xml += `    <fotos>\n`;
    if (emp.imagens && emp.imagens.length > 0) {
      emp.imagens.forEach((img) => {
        xml += `      <foto>${img}</foto>\n`;
      });
    } else {
      xml += `      <foto>${FOTO_FALLBACK}</foto>\n`;
    }
    xml += `    </fotos>\n`;

    xml += `  </empreendimento>\n`;
    total++;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(`📦 XML X09 INTERIOR SP gerado com sucesso (${total} empreendimentos)`);
}
