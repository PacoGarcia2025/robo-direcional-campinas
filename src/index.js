import runDirecional from "./robots/direcional.js";
import generateXml from "./generateXml.js";
import generateXmlX09 from "./generateXml.x09.js";

(async () => {
  const empreendimentos = await runDirecional();

  console.log(
    "🔎 SAMPLE EMPREENDIMENTO:",
    JSON.stringify(empreendimentos[0], null, 2)
  );

  generateXml(empreendimentos);
  generateXmlX09(empreendimentos);
})();
