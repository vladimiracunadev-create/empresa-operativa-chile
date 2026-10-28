/**
 * Contrato neutral para reglas normativas versionadas.
 *
 * Este modulo no contiene tasas ni conceptos chilenos. Su trabajo es impedir
 * que una regla incompleta o sin revision humana llegue a una calculadora.
 */

export const RULE_REVIEW_STATES = Object.freeze([
  'NOT_IMPLEMENTED',
  'DRAFT',
  'VERIFIED',
  'STALE',
  'REQUIRES_HUMAN_REVIEW',
  'DISPUTED'
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_COUNTRY = /^[A-Z]{2}$/;

function requiredText(rule, field) {
  if (typeof rule[field] !== 'string' || rule[field].trim() === '') {
    throw new Error(`La regla requiere ${field}`);
  }
}

function isRealIsoDate(value) {
  if (!ISO_DATE.test(String(value))) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function requiredDate(rule, field) {
  if (!isRealIsoDate(rule[field])) throw new Error(`${field} debe ser una fecha ISO valida`);
}

function nullableDate(rule, field) {
  if (rule[field] !== null && !isRealIsoDate(rule[field])) {
    throw new Error(`${field} debe ser una fecha ISO o null`);
  }
}

/** Valida el sobre de trazabilidad de una regla; no valida su formula interna. */
export function validateRegulatoryRule(rule) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) throw new Error('La regla debe ser un objeto');
  if (!ISO_COUNTRY.test(String(rule.country))) throw new Error('country debe ser ISO 3166-1 alfa-2');

  for (const field of ['entityType', 'taxRegime', 'sourceUrl', 'sourceTitle', 'scope', 'confidence', 'ruleVersion']) {
    requiredText(rule, field);
  }
  for (const field of ['validFrom', 'publicationDate', 'checkedAt']) requiredDate(rule, field);
  nullableDate(rule, 'validTo');

  if (!Number.isInteger(rule.effectiveTaxYear) || rule.effectiveTaxYear < 1900) {
    throw new Error('effectiveTaxYear debe ser un ano comercial valido');
  }
  if (!RULE_REVIEW_STATES.includes(rule.reviewStatus)) throw new Error(`reviewStatus no soportado: ${rule.reviewStatus}`);
  if (!Array.isArray(rule.assumptions) || !Array.isArray(rule.exceptions)) {
    throw new Error('assumptions y exceptions deben ser listas explicitas');
  }
  if (rule.subdivision !== null && typeof rule.subdivision !== 'string') {
    throw new Error('subdivision debe ser string o null');
  }
  if (rule.approver !== null && typeof rule.approver !== 'string') throw new Error('approver debe ser string o null');
  if (rule.supersedes !== null && typeof rule.supersedes !== 'string') throw new Error('supersedes debe ser string o null');

  let parsed;
  try {
    parsed = new URL(rule.sourceUrl);
  } catch {
    throw new Error('sourceUrl debe ser una URL valida');
  }
  if (parsed.protocol !== 'https:') throw new Error('sourceUrl debe usar HTTPS');
  if (rule.reviewStatus === 'VERIFIED' && !rule.approver) {
    throw new Error('Una regla VERIFIED requiere approver');
  }
  return true;
}

/**
 * Barrera fail-closed antes de ejecutar una formula legal.
 * Devuelve la regla para permitir una composicion sencilla en adaptadores.
 */
export function requireComputableRule(rule, context = {}) {
  validateRegulatoryRule(rule);
  if (rule.reviewStatus !== 'VERIFIED') {
    throw new Error(`REQUIRES_HUMAN_REVIEW: regla ${rule.ruleVersion} esta ${rule.reviewStatus}`);
  }
  if (context.country && context.country !== rule.country) throw new Error('La regla no corresponde al pais solicitado');
  if (context.subdivision && context.subdivision !== rule.subdivision) {
    throw new Error('La regla no corresponde a la subdivision solicitada');
  }
  if (context.entityType && context.entityType !== rule.entityType) throw new Error('La regla no corresponde al tipo de entidad');
  if (context.taxRegime && context.taxRegime !== rule.taxRegime) throw new Error('La regla no corresponde al regimen tributario');
  if (context.effectiveTaxYear && context.effectiveTaxYear !== rule.effectiveTaxYear) {
    throw new Error('La regla no corresponde al ano comercial solicitado');
  }
  if (context.onDate !== undefined) {
    if (!isRealIsoDate(context.onDate)) throw new Error('onDate debe ser una fecha ISO valida');
    if (context.onDate < rule.validFrom || (rule.validTo !== null && context.onDate > rule.validTo)) {
      throw new Error(`REQUIRES_HUMAN_REVIEW: regla ${rule.ruleVersion} fuera de vigencia`);
    }
  }
  return rule;
}

/** Rechaza conjuntos ambiguos: dos normas verificadas aplicables no se eligen por azar. */
export function resolveRegulatoryRuleSet(rules, context = {}) {
  if (!Array.isArray(rules) || rules.length === 0) throw new Error('NOT_IMPLEMENTED: no hay reglas candidatas');
  const candidates = [];
  for (const rule of rules) {
    try { candidates.push(requireComputableRule(rule, context)); } catch (error) {
      if (!String(error.message).includes('fuera de vigencia') && !String(error.message).includes('no corresponde')) throw error;
    }
  }
  if (candidates.length === 0) throw new Error('REQUIRES_HUMAN_REVIEW: no hay regla verificada y vigente para el contexto');
  if (candidates.length > 1) throw new Error(`DISPUTED: existen ${candidates.length} reglas verificadas aplicables`);
  return candidates[0];
}

/** Crea una propuesta sin mutar la regla histórica ni activar la revisión. */
export function proposeRuleRevision(previous, changes, { proposedVersion, proposedAt } = {}) {
  validateRegulatoryRule(previous);
  requiredText({ proposedVersion }, 'proposedVersion');
  if (!isRealIsoDate(proposedAt)) throw new Error('proposedAt debe ser fecha ISO valida');
  const proposal = {
    ...previous,
    ...changes,
    ruleVersion: proposedVersion,
    supersedes: previous.ruleVersion,
    reviewStatus: 'DRAFT',
    approver: null,
    checkedAt: proposedAt
  };
  validateRegulatoryRule(proposal);
  return { proposal, previous: structuredClone(previous), changedFields: Object.keys(changes).filter(key => JSON.stringify(previous[key]) !== JSON.stringify(changes[key])) };
}

export function explainLegalCalculation({ rule, formula, inputs, result, warnings = [] }, context = {}) {
  requireComputableRule(rule, context);
  requiredText({ formula }, 'formula');
  if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) throw new Error('inputs debe ser un objeto');
  if (!Array.isArray(warnings)) throw new Error('warnings debe ser una lista');
  return {
    result,
    formula,
    inputs: structuredClone(inputs),
    assumptions: [...rule.assumptions],
    exceptions: [...rule.exceptions],
    source: { url: rule.sourceUrl, title: rule.sourceTitle },
    ruleVersion: rule.ruleVersion,
    jurisdiction: { country: rule.country, subdivision: rule.subdivision },
    validity: { from: rule.validFrom, to: rule.validTo, effectiveTaxYear: rule.effectiveTaxYear },
    warnings: [...warnings, 'Confirmar el resultado y la vigencia en el portal oficial antes de declarar o pagar.']
  };
}
