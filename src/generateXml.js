// ===============================
// ARQUIVO: src/generateXml.js
// XML FINAL PARA X09
// ===============================

import fs from "fs";

export default function generateXml(inputPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<empreendimentos>\n`;

  for (const item of data) {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${item.id}</id>\n`;
    xml += `    <titulo><![CDATA[${item.title}]]></titulo>\n`;
    xml += `    <cidade>${item.location.city}</cidade>\n`;
    xml += `    <estado>${item.location.state}</estado>\n`;
    xml += `    <status>${item.status || item.fixedCardText || ""}</status>\n`;

    if (item.images && item.images.length) {
      xml += `    <fotos>\n`;
      for (const img of item.images.slice(0, 20)) {
        if (img.startsWith("http")) {
          xml += `      <foto>${img}</foto>\n`;
        }
      }
      xml += `    </fotos>\n`;
    }

    xml += `  </empreendimento>\n`;
  }

  xml += `</empreendimentos>`;

  fs.writeFileSync(outputPath, xml, "utf-8");
  console.log("📄 XML gerado em:", outputPath);
}
