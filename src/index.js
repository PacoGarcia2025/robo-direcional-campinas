// ===============================
// ARQUIVO: src/index.js
// ORQUESTRADOR PRINCIPAL
// ===============================

import runDirecional from "./robots/direcional.js";
import enrichDirecional from "./enrich/index.js";
import generateXml from "./generateXml.js";

async function main() {
  console.log("🚀 Iniciando Robô Direcional Campinas");

  // 1. Scraper → JSON base
  await runDirecional();

  // 2. Enriquecimento → JSON final
  enrichDirecional();

  // 3. Geração do XML (IMPORTANTE)
  generateXml(
    "src/output/direcional-enriched.json",
    "src/output/direcional-campinas.xml"
  );

  console.log("✅ Processo finalizado com sucesso");
}

main();
