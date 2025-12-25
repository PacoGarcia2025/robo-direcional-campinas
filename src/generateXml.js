// ===============================
// ARQUIVO: src/generateXml.js
// GERAÇÃO DO XML PARA X09
// ===============================

import fs from "fs";

export default function generateXml(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.log("❌ Arquivo de entrada não encontrado:", inputPath);
    return;
  }

  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  if (!data || data.length === 0) {
    console.log("⚠️ Nenhum dado para gerar XML.");
    return;
  }

  let xml = "<imoveis>\n";

  for (const item of data) {
    xml += `  <imovel>
    <id>${item.id}</id>
    <titulo>${item.title}</titulo>
    <tipo>Apartamento</tipo>
    <cidade>${item.location.city}</cidade>
    <estado>${item.location.state}</estado>
    <status>${item.status}</status>
`;

    for (const img of item.images || []) {
      if (img.startsWith("http")) {
        xml += `    <foto>${img}</foto>\n`;
      }
    }

    xml += "  </imovel>\n";
  }

  xml += "</imoveis>";

  fs.writeFileSync(outputPath, xml);
  console.log("📄 XML gerado com sucesso:", outputPath);
}
