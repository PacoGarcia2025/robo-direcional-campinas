// ===============================
// ARQUIVO: src/images/index.js
// PROCESSADOR DE IMAGENS PADRÃO X09
// ===============================

import { isValidImage } from "./imageRules.js";

export function processImages(rawImages, options = {}) {
  const {
    max = 10,
    min = 3,
  } = options;

  if (!Array.isArray(rawImages)) return [];

  // ===============================
  // NORMALIZA
  // ===============================
  const normalized = rawImages
    .filter(Boolean)
    .map((img) =>
      typeof img === "string"
        ? { src: img }
        : img
    );

  // ===============================
  // FILTRA
  // ===============================
  const filtered = normalized.filter(isValidImage);

  // ===============================
  // REMOVE DUPLICADAS
  // ===============================
  const unique = [
    ...new Map(
      filtered.map((img) => [img.src, img])
    ).values(),
  ];

  // ===============================
  // LIMITA QUANTIDADE
  // ===============================
  if (unique.length >= min) {
    return unique.slice(0, max).map((i) => i.src);
  }

  // ===============================
  // FALLBACK (SE POUCAS IMAGENS)
  // ===============================
  return unique.slice(0, max).map((i) => i.src);
}
