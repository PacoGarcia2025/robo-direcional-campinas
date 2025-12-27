import runDirecional from "./robots/direcional.js";
import generateXml from "./generateXml.js";
import generateXmlX09 from "./generateXml.x09.js";

(async () => {
  const empreendimentos = await runDirecional();

  // XML rico (futuro / interno)
  generateXml(empreendimentos);

  // XML compatível com x09 (Base44)
  generateXmlX09(empreendimentos);
})();
