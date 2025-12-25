// ===============================
// ARQUIVO: src/index.js
// CONTROLE PRINCIPAL DO ROBÔ
// ===============================

import runDirecional from "./robots/direcional.js";
import enrichDirecional from "./enrich/index.js";
import generateXml from "./generateXml.js";

async function main() {
  console.log("🚀 Iniciando Robô Direcional Campinas");

  // 1️⃣ Executa coleta
  const baseData = await runDirecional();

  if (!baseData || baseData.length === 0) {
    console.log("⚠️ Nenhum empreendimento coletado. Abortando.");
    return;
  }

  // 2️⃣ Enriquecimento (gera direcional-enriched.json)
  const enriched = enrichDirecional();

  if (!enriched || enriched.length === 0) {
    console.log("⚠️ Nenhum dado enriquecido. Abortando XML.");
    return;
  }

  // 3️⃣ Geração do XML (a partir do arquivo enriquecido)
  generateXml(
    "src/output/direcional-enriched.json",
    "src/output/direcional-campinas.xml"
  );

  console.log("✅ Robô finalizado com sucesso");
}

main().catch(err => {
  console.error("❌ Erro fatal no robô:", err);
  process.exit(1);
});
