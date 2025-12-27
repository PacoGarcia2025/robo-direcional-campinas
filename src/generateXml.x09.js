import fs from "fs";
import path from "path";

const FOTO_FALLBACK =
  "https://www.direcional.com.br/wp-content/themes/direcional-theme/dist/images/logo-direcional.svg";

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
    // 🔴 ESTRUTURA REAL DO ROBÔ
    if (!emp.location || !emp.location.city) return;

    const cidade = emp.location.city.trim();
    const estado = emp.location.state?.trim() || "SP";

    // filtro Interior SP
    if (estado !== "SP") return;
    if (!INTERIOR_SP.includes(cidade)) return;

    const id = (emp.id || emp.title || emp.titulo)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo>${emp.title || emp.titulo}</titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${cidade}</cidade>\n`;
    xml += `    <estado>${estado}</estado>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;

    xml += `    <fotos>\n`;
    if (emp.imagens && emp.imagens.length > 0) {
      emp.imagens.forEach((img) => {
        xml += `      <foto>${img}</foto>\n`;
      });
    } else {
      xml += `      <foto>${FOTO_FALLBACK}</foto>\n`;
    }
    xml += `    </fotos>\n`;

    if (emp.url) {
      xml += `    <url>${emp.url}</url>\n`;
    }

    xml += `  </empreendimento>\n`;
    total++;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");

  console.log(
    `📦 XML X09 INTERIOR SP gerado: ${total} empreendimentos`
  );
}
