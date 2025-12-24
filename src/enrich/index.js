// ===============================
// ARQUIVO: src/enrich/index.js
// ENRIQUECIMENTO PADRÃO
// ===============================

import fs from "fs";

export default async function enrich(inputPath, outputPath) {
  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  for (const item of data) {
    item.status = "Lançamento";
    item.updatedAt = new Date().toISOString();
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}
