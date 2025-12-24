// ===============================
// ARQUIVO: src/generateXml.js
// XML FINAL PARA X09
// ===============================

import fs from "fs";

export default function generateXml(inputPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  for (const item of data) {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${item.id}</id>\n`;
    xml += `    <titulo>${item.title}</titulo>\n`;
    xml += `    <cidade>${item.location.city}</cidade>\n`;
    xml += `    <estado>${item.location.state}</estado>\n`;
    xml += `    <imagens>\n`;

    for (const img of item.images) {
      xml += `      <imagem>${img}</imagem>\n`;
    }

    xml += `    </imagens>\n`;
    xml += `  </empreendimento>\n`;
  }

  xml += `</empreendimentos>`;
  fs.writeFileSync(outputPath, xml);
}
