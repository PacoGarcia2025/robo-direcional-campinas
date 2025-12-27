import fs from "fs";
import path from "path";

const FOTO_FALLBACK =
  "https://www.direcional.com.br/wp-content/themes/direcional-theme/dist/images/logo-direcional.svg";

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  empreendimentos.forEach((emp) => {
    const id = (emp.id || emp.titulo || Math.random().toString(36))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const cidade = emp.cidade
      ? emp.cidade.split("/")[0].trim()
      : "";

    const estado = emp.estado ? emp.estado.trim() : "SP";

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo>${emp.titulo || "Empreendimento Direcional"}</titulo>\n`;
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
      // 🔒 FOTO OBRIGATÓRIA PARA O X09
      xml += `      <foto>${FOTO_FALLBACK}</foto>\n`;
    }

    xml += `    </fotos>\n`;
    xml += `  </empreendimento>\n`;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(
    `📦 XML X09 gerado com sucesso (${empreendimentos.length} empreendimentos)`
  );
}
