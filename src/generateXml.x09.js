import fs from "fs";
import path from "path";

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<imoveis>\n`;

  empreendimentos.forEach((emp) => {
    if (!emp.id || !emp.titulo || !emp.cidade || !emp.estado) return;
    if (!emp.imagens || emp.imagens.length === 0) return;

    const id = emp.id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const city = emp.cidade.split("/")[0].trim();
    const state = emp.estado.trim();

    xml += `  <imovel>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <title>${emp.titulo}</title>\n`;

    xml += `    <fotos>\n`;
    emp.imagens.forEach((img) => {
      xml += `      <foto>${img}</foto>\n`;
    });
    xml += `    </fotos>\n`;

    xml += `    <city>${city}</city>\n`;
    xml += `    <state>${state}</state>\n`;
    xml += `    <tipo>Apartamento</tipo>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;
    xml += `    <descricao>${emp.titulo}</descricao>\n`;
    xml += `    <construtora>Direcional Engenharia</construtora>\n`;
    xml += `  </imovel>\n`;
  });

  xml += `</imoveis>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(`📦 XML X09 gerado com sucesso: ${filePath}`);
}
