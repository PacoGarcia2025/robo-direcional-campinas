import extractDirecional from "./direcional.extractor.js";
import fs from "fs";

const OUTPUT = "src/output/direcional-campinas.json";

export default async function runDirecional() {
  const data = await extractDirecional();
  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));
}
