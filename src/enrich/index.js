// ===============================
// ARQUIVO: src/enrich/index.js
// ENRIQUECIMENTO (PRESERVANDO DADOS)
// ===============================

import fs from "fs";
import { resolveStatus } from "./statusRules.js";

const INPUT = "src/output/direcional-campinas.json";
const OUTPUT = "src/output/direcional-enriched.json";

export default function enrichDirecional() {
  const base = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

  const enriched = base.map(item => ({
    ...item, // 🔑 ISSO É O MAIS IMPORTANTE
    status: resolveStatus({
      fixedCardText: item.fixedCardText,
      statusTimeline: item.statusTimeline,
      title: item.title,
    }),
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));
  console.log("✔ Arquivo enriquecido salvo:", OUTPUT);

  return enriched;
}
