// ===============================
// ARQUIVO: src/generateXml.js
// GERADOR DE XML – PADRÃO X09
// (GRAVA EM src/output)
// ===============================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function generateXml(empreendimentos) {
  // 👉 caminho correto: src/output
  const outputDir = path.resolve(__dirname, "output");
  const outputFile = path.join(outputDir, "direcional.xml");

  // ===============================
  // GARANTE QUE A PASTA EXISTE
  // ===============================
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<empreendimentos>\n`;

  for (const emp of empreendimentos) {
    xml += `  <empreendimento>\n`;
    xml += `    <id>${emp.id}</id>\n`;
    xml += `    <titulo><![CDATA[${emp.title}]]></titulo>\n`;
    xml += `    <cidade>${emp.city || ""}</cidade>\n`;
    xml += `    <estado>${emp.state || ""}</estado>\n`;
    xml += `    <status>${emp.status || ""}</status>\n`;

    // ===============================
    // UNIDADES
    // ===============================
    if (emp.unidades?.length) {
      xml += `    <unidades>\n`;
      emp.unidades.forEach((u) => {
        xml += `      <unidade>\n`;
        xml += `        <area>${u.area}</area>\n`;
        xml += `        <dormitorios>${u.dormitorios}</dormitorios>\n`;
        xml += `      </unidade>\n`;
      });
      xml += `    </unidades>\n`;
    }

    // ===============================
    // DIFERENCIAIS
    // ===============================
    if (emp.diferenciais_empreendimento?.length) {
      xml += `    <diferenciais_empreendimento>\n`;
      emp.diferenciais_empreendimento.forEach((d) => {
        xml += `      <item><![CDATA[${d}]]></item>\n`;
      });
      xml += `    </diferenciais_empreendimento>\n`;
    }

    // ===============================
    // FICHA TÉCNICA
    // ===============================
    xml += `    <ficha_tecnica>\n`;
    if (emp.ficha_tecnica) {
      for (const [key, value] of Object.entries(emp.ficha_tecnica)) {
        xml += `      <${key}><![CDATA[${value}]]></${key}>\n`;
      }
    }
    xml += `    </ficha_tecnica>\n`;

    // ===============================
    // FOTOS
    // ===============================
    if (emp.imagens?.length) {
      xml += `    <fotos>\n`;
      emp.imagens.forEach((img) => {
        xml += `      <foto>${img}</foto>\n`;
      });
      xml += `    </fotos>\n`;
    }

    xml += `  </empreendimento>\n`;
  }

  xml += `</empreendimentos>`;

  fs.writeFileSync(outputFile, xml, "utf8");

  console.log("📦 XML gerado com sucesso em:", outputFile);
}
