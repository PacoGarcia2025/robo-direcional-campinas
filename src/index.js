// ===============================
// ARQUIVO: src/index.js
// PIPELINE FINAL – SEM node-fetch
// ===============================

import runDirecional from "./robots/direcional.js";
import enrich from "./enrich/index.js";
import { refineImages } from "./images/index.js";
import generateXml from "./generateXml.js";
import { execSync } from "child_process";

const RAW = "src/output/direcional-campinas.json";
const ENRICHED = "src/output/direcional-enriched.json";
const IMAGES = "src/output/direcional-images.json";
const XML = "src/output/direcional-campinas.xml";

async function run() {
  await runDirecional();
  await enrich(RAW, ENRICHED);
  await refineImages(ENRICHED, IMAGES);
  generateXml(IMAGES, XML);

  execSync("git add .", { stdio: "inherit" });
  execSync('git commit -m "Direcional Campinas - atualização automática"', {
    stdio: "inherit"
  });
  execSync("git push", { stdio: "inherit" });

  console.log("PIPELINE EXECUTADO COM SUCESSO");
}

run();
