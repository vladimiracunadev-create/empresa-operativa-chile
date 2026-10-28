/** Contexto legal y de interfaz. País fiscal e idioma nunca son sinónimos. */

const COUNTRY = /^[A-Z]{2}$/;
const CURRENCY = /^[A-Z]{3}$/;
const BCP47 = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export const JURISDICTION_CONTEXT_STATES = Object.freeze([
  'REQUIRES_VERIFICATION',
  'DOCUMENTARY_ONLY',
  'VERIFIED'
]);

export const DEFAULT_JURISDICTION_CONTEXT = Object.freeze({
  fiscalCountry: 'CL',
  incorporationCountry: 'CL',
  residenceCountry: null,
  operationCountries: ['CL'],
  subdivisions: {},
  locale: 'es-CL',
  currency: 'CLP',
  timeZone: 'America/Santiago',
  entityType: 'SPA',
  taxRegime: 'PRO_PYME_GENERAL',
  commercialYear: 2026,
  fiscalYearKind: 'CALENDAR_YEAR',
  lifecycleStage: 'planning',
  verificationState: 'REQUIRES_VERIFICATION',
  updatedAt: null
});

const validCountry = (value, nullable = false) =>
  (nullable && value === null) || COUNTRY.test(String(value));

/** Valida sólo estructura. La habilitación legal corresponde al CountryPack. */
export function validateJurisdictionContext(context) {
  if (!context || typeof context !== 'object' || Array.isArray(context)) throw new Error('El contexto jurisdiccional debe ser un objeto');
  if (!validCountry(context.fiscalCountry)) throw new Error('fiscalCountry debe ser ISO 3166-1 alfa-2');
  if (!validCountry(context.incorporationCountry)) throw new Error('incorporationCountry debe ser ISO 3166-1 alfa-2');
  if (!validCountry(context.residenceCountry, true)) throw new Error('residenceCountry debe ser ISO 3166-1 alfa-2 o null');
  if (!Array.isArray(context.operationCountries) || context.operationCountries.length === 0 || context.operationCountries.some(value => !validCountry(value))) {
    throw new Error('operationCountries debe contener al menos un país ISO 3166-1 alfa-2');
  }
  if (!context.subdivisions || typeof context.subdivisions !== 'object' || Array.isArray(context.subdivisions)) {
    throw new Error('subdivisions debe ser un objeto por ámbito');
  }
  if (!BCP47.test(String(context.locale))) throw new Error('locale debe ser BCP 47');
  if (!CURRENCY.test(String(context.currency))) throw new Error('currency debe ser ISO 4217');
  try {
    new Intl.DateTimeFormat('en', { timeZone: context.timeZone }).format(new Date());
  } catch {
    throw new Error('timeZone debe ser una zona IANA soportada');
  }
  for (const field of ['entityType', 'taxRegime', 'fiscalYearKind', 'lifecycleStage']) {
    if (typeof context[field] !== 'string' || !context[field].trim()) throw new Error(`${field} es obligatorio`);
  }
  if (!Number.isInteger(context.commercialYear) || context.commercialYear < 1900) throw new Error('commercialYear no es válido');
  if (!JURISDICTION_CONTEXT_STATES.includes(context.verificationState)) throw new Error('verificationState no soportado');
  if (context.updatedAt !== null && Number.isNaN(Date.parse(context.updatedAt))) throw new Error('updatedAt debe ser ISO o null');
  return true;
}

export function normalizeJurisdictionContext(value = {}) {
  const next = {
    ...DEFAULT_JURISDICTION_CONTEXT,
    ...value,
    operationCountries: [...new Set(value.operationCountries ?? DEFAULT_JURISDICTION_CONTEXT.operationCountries)],
    subdivisions: { ...DEFAULT_JURISDICTION_CONTEXT.subdivisions, ...(value.subdivisions ?? {}) }
  };
  validateJurisdictionContext(next);
  return next;
}

