import fs from "fs";
import path from "path";

export default function generateXml(data) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  data.forEach(emp => {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${emp.id}</id>\n`;
    xml += `    <titulo>${emp.titulo}</titulo>\n`;
    xml += `    <cidade>${emp.cidade}</cidade>\n`;
    xml += `    <estado>${emp.estado}</estado>\n`;
    xml += `    <status>${emp.status || ""}</status>\n`;
    xml += `    <fotos>\n`;
    emp.imagens.forEach(img => xml += `      <foto>${img}</foto>\n`);
    xml += `    </fotos>\n`;
    xml += `  </empreendimento>\n`;
  });

  xml += `</empreendimentos>`;

  fs.writeFileSync(
    path.resolve("src/output/direcional.xml"),
    xml,
    "utf8"
  );

  console.log("✅ XML padrão gerado");
}
