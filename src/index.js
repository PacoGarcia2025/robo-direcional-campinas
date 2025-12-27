// ===============================
// ARQUIVO: src/index.js
// ENTRYPOINT REAL DO ROBÔ
// ===============================

import extractDirecional from "./robots/direcional.extractor.js";
import generateXml from "./generateXml.js";

(async () => {
  console.log("▶ Iniciando execução do robô Direcional");

  const empreendimentos = await extractDirecional();

  console.log(
    `📊 Total de empreendimentos retornados: ${empreendimentos.length}`
  );

  generateXml(empreendimentos);

  console.log("✅ Execução finalizada com sucesso");
})();
