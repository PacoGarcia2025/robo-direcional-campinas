// src/index.js
import runDirecional from "./robots/direcional.js";
import { enrichDirecional } from "./enrich/index.js";
import { generateXml } from "./generateXml.js";

async function main() {
  try {
    console.log("🚀 Iniciando Robô Direcional Campinas");

    // 1️⃣ Extração (Playwright)
    const baseData = await runDirecional();

    if (!baseData || baseData.length === 0) {
      console.log("⚠️ Nenhum empreendimento encontrado.");
      return;
    }

    // 2️⃣ Enriquecimento
    const enriched = enrichDirecional();

    if (!enriched || enriched.length === 0) {
      console.log("⚠️ Nenhum dado enriquecido.");
      return;
    }

    // 3️⃣ Geração do XML
    generateXml(enriched);

    console.log("✅ Robô finalizado com sucesso");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro fatal no robô:", err);
    process.exit(1);
  }
}

await main();
