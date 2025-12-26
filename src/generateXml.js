// ===============================
// ARQUIVO: src/generateXml.js
// GERA XML FINAL PARA X09
// ===============================

import fs from "fs";

export default function generateXml(
  inputPath = "src/output/direcional-enriched.json",
  outputPath = "src/output/direcional-campinas.xml"
) {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<empreendimentos>\n`;

  data.forEach((item) => {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${item.id}</id>\n`;
    xml += `    <titulo><![CDATA[${item.title}]]></titulo>\n`;
    xml += `    <cidade>${item.city || ""}</cidade>\n`;
    xml += `    <estado>${item.state || ""}</estado>\n`;
    xml += `    <status>${item.status || ""}</status>\n`;

    // ===============================
    // UNIDADES / TIPOLOGIAS
    // ===============================
    if (item.unidades && item.unidades.length > 0) {
      xml += `    <unidades>\n`;
      item.unidades.forEach((u) => {
        xml += `      <unidade>\n`;
        xml += `        <dormitorios>${u.dormitorios}</dormitorios>\n`;
        xml += `        <area>${u.area}</area>\n`;
        xml += `      </unidade>\n`;
      });
      xml += `    </unidades>\n`;
    }

    // ===============================
    // DIFERENCIAIS DO EMPREENDIMENTO
    // ===============================
    if (
      item.diferenciais_empreendimento &&
      item.diferenciais_empreendimento.length > 0
    ) {
      xml += `    <diferenciais_empreendimento>\n`;
      item.diferenciais_empreendimento.forEach((d) => {
        xml += `      <item><![CDATA[${d}]]></item>\n`;
      });
      xml += `    </diferenciais_empreendimento>\n`;
    }

    // ===============================
    // IMAGENS
    // ===============================
    if (item.imagens && item.imagens.length > 0) {
      xml += `    <fotos>\n`;
      item.imagens.forEach((img) => {
        xml += `      <foto>${img}</foto>\n`;
      });
      xml += `    </fotos>\n`;
    }

    xml += `  </empreendimento>\n`;
  });

  xml += `</empreendimentos>\n`;

  fs.writeFileSync(outputPath, xml, "utf-8");

  console.log("✅ XML gerado com sucesso:", outputPath);
}
