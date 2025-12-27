import fs from "fs";
import path from "path";

const FOTO_FALLBACK =
  "https://www.direcional.com.br/wp-content/themes/direcional-theme/dist/images/logo-direcional.svg";

// Cidades do Interior de SP (Direcional)
const INTERIOR_SP = [
  "Campinas",
  "Ribeirão Preto",
  "Sorocaba",
  "Limeira",
  "Araraquara",
  "São Carlos",
  "Piracicaba",
  "Americana",
  "Indaiatuba",
  "Hortolândia",
  "Sumaré",
  "Jundiaí"
];

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;
  let total = 0;

  empreendimentos.forEach((emp) => {
    // 🔹 SHAPE REAL CONFIRMADO PELO LOG
    if (!emp.cidade || !emp.estado) return;

const cidade = emp.cidade.split("/")[0].trim();
const estado = emp.estado.trim().toUpperCase();

    // 🔹 FILTRO INTERIOR SP (AGORA FUNCIONA)
    if (estado !== "SP") return;
    if (!INTERIOR_SP.includes(cidade)) return;

    const id = (emp.id || emp.titulo)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo>${emp.titulo}</titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${cidade}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;

    // 🔹 FOTOS (CAMPO REAL = emp.fotos)
    xml += `    <fotos>\n`;
    if (emp.fotos && emp.fotos.length > 0) {
      emp.fotos.forEach((foto) => {
        xml += `      <foto>${foto}</foto>\n`;
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

  console.log(`📦 XML X09 INTERIOR SP gerado: ${total} empreendimentos`);
}
