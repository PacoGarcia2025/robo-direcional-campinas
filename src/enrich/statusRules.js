/**
 * statusRules.js
 * Responsável por identificar o STATUS REAL do empreendimento Direcional
 * Prioridade baseada na confiabilidade da informação no site
 */

/**
 * Normaliza texto para comparação
 */
function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Detecta status a partir do card fixo lateral
 * Ex: <li>Em Obras</li>
 */
function detectFromFixedCard(pageText) {
  const text = normalize(pageText);

  if (text.includes("pronto para morar")) return "Pronto para morar";
  if (text.includes("obras avancadas")) return "Obras avançadas";
  if (text.includes("em obras")) return "Em Obras";
  if (text.includes("lancamento")) return "Lançamento";
  if (text.includes("breve lancamento")) return "Breve lançamento";

  return null;
}

/**
 * Detecta status pela seção "Status do Empreendimento"
 * A regra aqui é:
 * - O item com classe ativa / destaque é o status atual
 */
function detectFromStatusSection(statusItems = []) {
  for (const item of statusItems) {
    const label = normalize(item.label || "");
    const active = item.active === true;

    if (!active) continue;

    if (label.includes("pronto")) return "Pronto para morar";
    if (label.includes("obras avancadas")) return "Obras avançadas";
    if (label.includes("em obras")) return "Em Obras";
    if (label.includes("lancamento")) return "Lançamento";
    if (label.includes("breve")) return "Breve lançamento";
  }

  return null;
}

/**
 * Fallback por título ou conteúdo geral
 */
function detectFromTitle(title = "") {
  const t = normalize(title);

  if (t.includes("pronto")) return "Pronto para morar";
  if (t.includes("obras")) return "Em Obras";
  if (t.includes("lancamento")) return "Lançamento";

  return "Breve lançamento";
}

/**
 * FUNÇÃO PRINCIPAL
 * Recebe os dados brutos do extractor
 */
export function resolveStatus({
  fixedCardText = "",
  statusTimeline = [],
  title = "",
}) {
  // 1️⃣ Maior prioridade: card fixo lateral
  const fixed = detectFromFixedCard(fixedCardText);
  if (fixed) return fixed;

  // 2️⃣ Seção "Status do Empreendimento"
  const section = detectFromStatusSection(statusTimeline);
  if (section) return section;

  // 3️⃣ Fallback
  return detectFromTitle(title);
}
