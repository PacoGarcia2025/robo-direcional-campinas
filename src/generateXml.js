// ===============================
// ARQUIVO: src/generateXml.js
// XML FINAL COMPLETO PARA X09
// ===============================

import fs from "fs";

export default function generateXml(inputPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  data.forEach(item => {
    xml += `  <empreendimento>
    <id>${item.id}</id>
    <titulo><![CDATA[${item.title}]]></titulo>
    <cidade>${item.location.city}</cidade>
    <estado>${item.location.state}</estado>
    <status>${item.status}</status>\n`;

    // UNIDADES
    if (item.unidades?.length) {
      xml += `    <unidades>\n`;
      item.unidades.forEach(u => {
        xml += `      <unidade>\n`;
        if (u.dormitorios) xml += `        <dormitorios>${u.dormitorios}</dormitorios>\n`;
        if (u.area) xml += `        <area>${u.area}</area>\n`;
        if (u.suite) xml += `        <suite>true</suite>\n`;
        if (u.varanda) xml += `        <varanda>true</varanda>\n`;
        xml += `      </unidade>\n`;
      });
      xml += `    </unidades>\n`;
    }

    // DIFERENCIAIS
    if (item.diferenciais?.length) {
      xml += `    <diferenciais_empreendimento>\n`;
      item.diferenciais.forEach(d => {
        xml += `      <item>${d}</item>\n`;
      });
      xml += `    </diferenciais_empreendimento>\n`;
    }

    // FOTOS
    xml += `    <fotos>\n`;
    item.images.slice(0, 20).forEach(img => {
      xml += `      <foto>${img}</foto>\n`;
    });
    xml += `    </fotos>\n`;

    xml += `  </empreendimento>\n`;
  });

  xml += `</empreendimentos>`;

  fs.writeFileSync(outputPath, xml);
  console.log("✔ XML completo gerado:", outputPath);
}
