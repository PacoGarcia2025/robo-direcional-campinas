// src/enrich/index.js
import fs from "fs";
import { resolveStatus } from "./statusRules.js";

const INPUT = "src/output/direcional-campinas.json";
const OUTPUT = "src/output/direcional-enriched.json";

export default function enrichDirecional() {
  const base = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

  if (!base || base.length === 0) {
    console.log("⚠️ Arquivo base vazio. Enriquecimento abortado.");
    return [];
  }

  const enriched = base.map(item => ({
    ...item,
    status: resolveStatus({
      fixedCardText: item.fixedCardText || "",
      title: item.title || "",
    }),
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));
  console.log("📄 Arquivo enriquecido salvo:", OUTPUT);

  return enriched;
}
