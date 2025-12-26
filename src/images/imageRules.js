// ===============================
// ARQUIVO: src/images/imageRules.js
// REGRAS DE VALIDAÇÃO DE IMAGENS
// PADRÃO X09
// ===============================

export function isValidImage(img) {
  if (!img || !img.src) return false;

  const src = img.src.toLowerCase();

  // ===============================
  // 1️⃣ BLOQUEIO POR PALAVRAS (ICONS / LOGOS)
  // ===============================
  const blacklist = [
    "icon",
    "icons",
    "logo",
    "sheet_",
    "basil_",
    "share",
    "sprite",
    "favicon",
    "opcoes-na-planta",
    "quartos.webp",
    "banheiro.webp",
  ];

  if (blacklist.some((word) => src.includes(word))) {
    return false;
  }

  // ===============================
  // 2️⃣ BLOQUEIO POR TAMANHO
  // ===============================
  const minSize = 300;

  if (img.w && img.w < minSize) return false;
  if (img.h && img.h < minSize) return false;

  // ===============================
  // 3️⃣ PRIORIDADE POSITIVA
  // ===============================
  const whitelist = [
    "fachada",
    "lazer",
    "piscina",
    "implantacao",
    "planta",
    "apartamento",
    "decorado",
    "living",
    "suite",
  ];

  if (whitelist.some((word) => src.includes(word))) {
    return true;
  }

  // ===============================
  // 4️⃣ FALLBACK: IMAGEM GRANDE
  // ===============================
  if (img.w >= 600 && img.h >= 600) {
    return true;
  }

  return false;
}
