// ===============================
// ARQUIVO: src/enrich/index.js
// ENRIQUECIMENTO DE DADOS
// ===============================

import fs from "fs";
import { resolveStatus } from "./statusRules.js";

const INPUT = "src/output/direcional-campinas.json";
const OUTPUT = "src/output/direcional-enriched.json";

function extractUnidades(images) {
  const unidades = [];

  images.forEach(img => {
    const lower = img.toLowerCase();

    const areaMatch = lower.match(/(\d{2,3})m/);
    const dormMatch = lower.match(/(\d)[-_ ]?dorm/);

    if (areaMatch || dormMatch) {
      unidades.push({
        area: areaMatch ? Number(areaMatch[1]) : null,
        dormitorios: dormMatch ? Number(dormMatch[1]) : null,
        suite: lower.includes("suite"),
        varanda: lower.includes("varanda"),
      });
    }
  });

  return unidades;
}

function extractDiferenciais(images) {
  const mapa = {
    piscina: ["piscina"],
    academia: ["fitness", "academia"],
    espaco_gourmet: ["gourmet"],
    salao_festas: ["salao", "festas"],
    playground: ["playground"],
    condominio_fechado: ["condominio-fechado", "condominio_fechado"],
  };

  const encontrados = {};

  images.forEach(img => {
    const lower = img.toLowerCase();
    Object.entries(mapa).forEach(([key, termos]) => {
      if (termos.some(t => lower.includes(t))) {
        encontrados[key] = true;
      }
    });
  });

  return Object.keys(encontrados);
}

export default function enrichDirecional() {
  const base = JSON.parse(fs.readFileSync(INPUT, "utf-8"));

  const enriched = base.map(item => ({
    ...item,
    status: resolveStatus({
      fixedCardText: item.fixedCardText,
      statusTimeline: item.statusTimeline,
      title: item.title,
    }),
    unidades: extractUnidades(item.images),
    diferenciais: extractDiferenciais(item.images),
  }));

  fs.writeFileSync(OUTPUT, JSON.stringify(enriched, null, 2));
  console.log("✔ Arquivo enriquecido salvo:", OUTPUT);

  return enriched;
}
