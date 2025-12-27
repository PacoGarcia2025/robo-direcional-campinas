import fs from "fs";
import path from "path";

const INTERIOR_SP = [
  "Campinas","Ribeirão Preto","Sorocaba","Limeira","Araraquara",
  "São Carlos","Piracicaba","Americana","Indaiatuba","Hortolândia","Sumaré","Jundiaí"
];

const FOTO_FALLBACK =
  "https://www.direcional.com.br/wp-content/themes/direcional-theme/dist/images/logo-direcional.svg";

export default function generateXmlX09(data) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;
  let total = 0;

  data.forEach(emp => {
    if (emp.estado !== "SP") return;

    const cidade = emp.cidade.split("/")[0].trim();
    if (!INTERIOR_SP.includes(cidade)) return;

    xml += `  <empreendimento>\n`;
    xml += `    <id>${emp.id}</id>\n`;
    xml += `    <titulo>${emp.titulo}</titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${cidade}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;
    xml += `    <fotos>\n`;

    if (emp.imagens.length) {
      emp.imagens.forEach(img => xml += `      <foto>${img}</foto>\n`);
    } else {
      xml += `      <foto>${FOTO_FALLBACK}</foto>\n`;
    }

    xml += `    </fotos>\n`;
    xml += `  </empreendimento>\n`;
    total++;
  });

  xml += `</empreendimentos>`;

  fs.writeFileSync(
    path.resolve("src/output/direcional-x09.xml"),
    xml,
    "utf8"
  );

  console.log("✅ XML X09 gerado:", total, "empreendimentos");
}
