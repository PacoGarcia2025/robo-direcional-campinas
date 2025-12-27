import fs from "fs";
import path from "path";

export default function generateXmlX09(empreendimentos) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  empreendimentos.forEach((emp) => {
    if (!emp.titulo || !emp.cidade || !emp.estado) return;
    if (!emp.imagens || emp.imagens.length === 0) return;

    const id = (emp.id || emp.titulo)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const cidade = emp.cidade.split("/")[0].trim();
    const estado = emp.estado.trim();

    xml += `  <empreendimento>\n`;
    xml += `    <id>${id}</id>\n`;
    xml += `    <titulo>${emp.titulo}</titulo>\n`;
    xml += `    <cidade>${cidade}</cidade>\n`;
    xml += `    <estado>${estado}</estado>\n`;
    xml += `    <status>${emp.status || "Lançamento"}</status>\n`;

    xml += `    <fotos>\n`;
    emp.imagens.forEach((img) => {
      xml += `      <foto>${img}</foto>\n`;
    });
    xml += `    </fotos>\n`;

    xml += `  </empreendimento>\n`;
  });

  xml += `</empreendimentos>`;

  const filePath = path.resolve(
    "src/output",
    "direcional-interior-sp-x09.xml"
  );

  fs.writeFileSync(filePath, xml, "utf8");
  console.log(`📦 XML X09 gerado com sucesso: ${filePath}`);
}
