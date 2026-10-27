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
  return rule;
}
