import fs from "fs";
import path from "path";

const FOTO_FALLBACK =
  "https://www.direcional.com.br/wp-content/themes/direcional-theme/dist/images/logo-direcional.svg";

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;
  let total = 0;

  empreendimentos.forEach((emp) => {
    // 🔹 FILTRO SIMPLES: APENAS SP
    const estado = (emp.estado || "").trim().toUpperCase();
    if (estado !== "SP") return;

    const cidade = emp.cidade
      ? emp.cidade.split("/")[0].trim()
      : "";

    const id = (emp.id || emp.titulo || Math.random().toString(36))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo>${emp.titulo || "Empreendimento Direcional"}</titulo>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <cidade>${cidade}</cidade>\n`;
    xml += `    <estado>SP</estado>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;

    // 🔹 FOTOS (OBRIGATÓRIO PARA O X09)
    xml += `    <fotos>\n`;
    if (emp.imagens && emp.imagens.length > 0) {
      emp.imagens.forEach((img) => {
        xml += `      <foto>${img}</foto>\n`;
      });
    } else {
      xml += `      <foto>${FOTO_FALLBACK}</foto>\n`;
    }
    xml += `    </fotos>\n`;

    // 🔹 URL (opcional, mas útil)
    if (emp.url) {
      xml += `    <url>${emp.url}</url>\n`;
    }

    xml += `  </empreendimento>\n`;
    total++;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(
    `📦 XML X09 SP gerado com sucesso (${total} empreendimentos)`
  );
}
