// ===============================
// ARQUIVO: src/enrich/statusRules.js
// REGRAS DE STATUS DO IMÓVEL
// ===============================

export function resolveStatus({ fixedCardText = "", title = "" }) {
  const text = `${fixedCardText} ${title}`.toLowerCase();

  if (text.includes("lançamento")) return "Lançamento";
  if (text.includes("breve")) return "Breve Lançamento";
  if (text.includes("avanç")) return "Obras Avançadas";
  if (text.includes("obra")) return "Em Obras";
  if (text.includes("pronto")) return "Pronto para morar";

  return "Em Obras";
}
