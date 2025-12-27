import extractDirecional from "./robots/direcional.extractor.js";
import generateBaseJson from "./generateBaseJson.js";
import generateXml from "./generateXml.js";
import generateXmlX09 from "./generateXml.x09.js";

(async () => {
  const data = await extractDirecional();

  generateBaseJson(data);
  generateXml(data);
  generateXmlX09(data);
})();
