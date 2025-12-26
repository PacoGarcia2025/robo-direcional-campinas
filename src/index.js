import runDirecional from "./robots/direcional.js";
import generateXml from "./generateXml.js";

(async () => {
  const empreendimentos = await runDirecional();
  generateXml(empreendimentos, "src/output/direcional.xml");
})();
