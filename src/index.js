// src/index.js
import runDirecional from "./robots/direcional.js";
import enrichDirecional from "./enrich/index.js";
import generateXml from "./generateXml.js";

async function main() {
  console.log("🚀 Iniciando Robô Direcional Campinas");

  await runDirecional();
  enrichDirecional();
  generateXml(
    "src/output/direcional-enriched.json",
    "src/output/direcional-campinas.xml"
  );
}

main();
