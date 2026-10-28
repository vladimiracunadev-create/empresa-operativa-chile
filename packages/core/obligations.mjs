/** Obligaciones y costos neutrales: ninguna frecuencia implica por sí sola obligación legal. */

export const OBLIGATION_FREQUENCIES = Object.freeze([
  'ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'DECENNIAL', 'CONDITIONAL'
]);

export const VALUE_STATES = Object.freeze([
  'NO_DETERMINADO', 'NO_APLICA', 'SIN_MOVIMIENTO', 'SIMULACION', 'EVIDENCIA'
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_COUNTRY = /^[A-Z]{2}$/;
const ISO_CURRENCY = /^[A-Z]{3}$/;

const required = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} es obligatorio`);
};

export function validateObligationDefinition(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('La obligación debe ser un objeto');
  for (const field of ['id', 'label', 'sourceUrl', 'sourceTitle', 'portalUrl', 'evidenceRequired', 'failureRecovery']) required(row[field], field);
  if (!ISO_COUNTRY.test(String(row.country))) throw new Error('country debe ser ISO 3166-1 alfa-2');
  if (!OBLIGATION_FREQUENCIES.includes(row.frequency)) throw new Error(`Frecuencia no soportada: ${row.frequency}`);
  if (row.frequency === 'CONDITIONAL') required(row.trigger, 'trigger');
  if (row.subdivision !== null && typeof row.subdivision !== 'string') throw new Error('subdivision debe ser string o null');
  if (row.nextDueDate !== null && !ISO_DATE.test(String(row.nextDueDate))) throw new Error('nextDueDate debe ser fecha ISO o null');
  if (!ISO_DATE.test(String(row.checkedAt))) throw new Error('checkedAt debe ser fecha ISO');
  for (const field of ['sourceUrl', 'portalUrl']) {
    let url;
    try { url = new URL(row[field]); } catch { throw new Error(`${field} debe ser URL`); }
    if (url.protocol !== 'https:') throw new Error(`${field} debe usar HTTPS`);
  }
  return true;
}

/**
 * Proyecta un costo sin convertir null en cero. Una reserva es una política del
 * usuario y jamás se etiqueta como mínimo legal.
 */
export function projectObligationCost(definition, {
  amount = null,
  currency = null,
  includesTax = null,
  variableRate = null,
  nextDueDate = definition?.nextDueDate ?? null,
  reserveRecommendation = null,
  evidenceRef = null
} = {}) {
  validateObligationDefinition(definition);
  if (amount !== null && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) throw new Error('amount debe ser no negativo o null');
  if (currency !== null && !ISO_CURRENCY.test(String(currency))) throw new Error('currency debe ser ISO 4217 o null');
  if (includesTax !== null && typeof includesTax !== 'boolean') throw new Error('includesTax debe ser boolean o null');
  if (variableRate !== null && (!Number.isFinite(Number(variableRate)) || Number(variableRate) < 0)) throw new Error('variableRate debe ser no negativa o null');
  if (reserveRecommendation !== null && (!Number.isFinite(Number(reserveRecommendation)) || Number(reserveRecommendation) < 0)) throw new Error('reserveRecommendation debe ser no negativa o null');
  if (nextDueDate !== null && !ISO_DATE.test(String(nextDueDate))) throw new Error('nextDueDate debe ser fecha ISO o null');
  return {
    ...definition,
    amount: amount === null ? null : Math.round(Number(amount)),
    currency,
    includesTax,
    variableRate,
    nextDueDate,
    reserveRecommendation: reserveRecommendation === null ? null : Math.round(Number(reserveRecommendation)),
    reserveIsLegalMinimum: false,
    evidenceRef,
    valueState: evidenceRef ? 'EVIDENCIA' : amount === null ? 'NO_DETERMINADO' : 'SIMULACION',
    automaticFiling: false,
    automaticPayment: false,
    guidance: {
      what: definition.label,
      where: definition.portalUrl,
      costAndFrequency: { amount: amount === null ? null : Math.round(Number(amount)), currency, frequency: definition.frequency },
      evidence: definition.evidenceRequired,
      recovery: definition.failureRecovery
    }
  };
}
