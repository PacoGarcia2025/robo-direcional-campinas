import extractDirecional from "./robots/direcional.extractor.FINAL.js";
import extractMRV from "./robots/mrv.extractor.js";

import generateBaseJson from "./generateBaseJson.js";
import generateXml from "./generateXml.js";
import generateXmlX09 from "./generateXml.x09.js";

(async () => {
  // ============================
  // DIRECIONAL
  // ============================
  console.log("===== INICIANDO DIRECIONAL =====");
  const direcionalData = await extractDirecional();

  generateBaseJson(direcionalData, "direcional");
  generateXml(direcionalData, "direcional");
  generateXmlX09(direcionalData, "direcional");

  // ============================
  // MRV
  // ============================
  console.log("===== INICIANDO MRV =====");
  const mrvData = await extractMRV();

  generateBaseJson(mrvData, "mrv");
  generateXml(mrvData, "mrv");
  generateXmlX09(mrvData, "mrv");
})();
