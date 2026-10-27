/** Contrato estable y neutral de un perfil jurisdiccional. */
import { validateRegulatoryRule } from './regulatory-rules.mjs';

export const PACK_VERIFICATION_STATES = Object.freeze([
  'VERIFIED',
  'PARTIAL_VERIFIED',
  'DOCUMENTARY_ONLY',
  'DRAFT',
  'STALE',
  'REQUIRES_HUMAN_REVIEW'
]);

export const AGENCY_VERIFICATION_STATES = Object.freeze(['VERIFIED', 'REQUIRES_HUMAN_REVIEW', 'STALE']);
export const REQUIRED_AGENCIES = Object.freeze(['businessRegistry', 'tax', 'trademark', 'insolvency']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_COUNTRY = /^[A-Z]{2}$/;
const ISO_CURRENCY = /^[A-Z]{3}$/;
const BCP47 = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

function object(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} debe ser un objeto`);
}

function list(value, field) {
  if (!Array.isArray(value)) throw new Error(`${field} debe ser una lista`);
}

function text(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${field} es obligatorio`);
}

function records(rows, field, requiredFields) {
  for (const [index, row] of rows.entries()) {
    object(row, `${field}[${index}]`);
    for (const name of requiredFields) text(row[name], `${field}[${index}].${name}`);
  }
}

function validateAgency(agency, key) {
  object(agency, `agencies.${key}`);
  if (!AGENCY_VERIFICATION_STATES.includes(agency.status)) throw new Error(`Estado invalido en agencies.${key}`);
  text(agency.scope, `agencies.${key}.scope`);
  if (agency.status === 'VERIFIED') {
    text(agency.name, `agencies.${key}.name`);
    text(agency.url, `agencies.${key}.url`);
    if (!String(agency.url).startsWith('https://')) throw new Error(`agencies.${key}.url debe usar HTTPS`);
    if (!ISO_DATE.test(String(agency.checkedAt))) throw new Error(`agencies.${key}.checkedAt debe ser fecha ISO`);
  } else if (agency.name !== null && typeof agency.name !== 'string') {
    throw new Error(`agencies.${key}.name debe ser string o null`);
  }
}

export function validateCountryPack(pack) {
  object(pack, 'CountryPack');
  if (!ISO_COUNTRY.test(String(pack.country))) throw new Error('country debe ser ISO 3166-1 alfa-2');
  if (!ISO_CURRENCY.test(String(pack.currency))) throw new Error('currency debe ser ISO 4217');
  text(pack.timeZone, 'timeZone');
  try {
    new Intl.DateTimeFormat('en', { timeZone: pack.timeZone }).format(new Date());
  } catch {
    throw new Error('timeZone debe ser una zona IANA soportada');
  }

  for (const field of ['subdivisions', 'supportedLocales', 'legalEntities', 'identifiers', 'forms', 'procedures', 'rules', 'supportedScenarios']) {
    list(pack[field], field);
  }
  if (pack.supportedLocales.length === 0 || pack.supportedLocales.some(locale => !BCP47.test(locale))) {
    throw new Error('supportedLocales debe contener etiquetas BCP 47');
  }
  records(pack.legalEntities, 'legalEntities', ['id', 'label', 'status']);
  records(pack.identifiers, 'identifiers', ['id', 'label', 'authority', 'status']);
  records(pack.forms, 'forms', ['id', 'label', 'status']);
  if (pack.supportedScenarios.some(value => typeof value !== 'string' || value.trim() === '')) {
    throw new Error('supportedScenarios no puede contener valores vacios');
  }
  for (const rule of pack.rules) validateRegulatoryRule(rule);

  object(pack.agencies, 'agencies');
  for (const agency of REQUIRED_AGENCIES) {
    if (!(agency in pack.agencies)) throw new Error(`Falta agencies.${agency}`);
    validateAgency(pack.agencies[agency], agency);
  }

  object(pack.capabilities, 'capabilities');
  if (typeof pack.capabilities.documentaryGuidance !== 'boolean') {
    throw new Error('capabilities.documentaryGuidance debe ser boolean');
  }
  object(pack.capabilities.taxCalculations, 'capabilities.taxCalculations');
  if (typeof pack.capabilities.taxCalculations.enabled !== 'boolean') {
    throw new Error('capabilities.taxCalculations.enabled debe ser boolean');
  }
  text(pack.capabilities.taxCalculations.mode, 'capabilities.taxCalculations.mode');
  text(pack.capabilities.taxCalculations.reason, 'capabilities.taxCalculations.reason');
  if (pack.capabilities.taxCalculations.enabled) {
    list(pack.capabilities.taxCalculations.verifiedYears, 'capabilities.taxCalculations.verifiedYears');
    if (pack.capabilities.taxCalculations.verifiedYears.length === 0 || pack.capabilities.taxCalculations.verifiedYears.some(year => !Number.isInteger(year))) {
      throw new Error('Los calculos habilitados requieren verifiedYears enteros');
    }
  }

  object(pack.verification, 'verification');
  if (!PACK_VERIFICATION_STATES.includes(pack.verification.state)) throw new Error('verification.state no soportado');
  if (pack.verification.checkedAt !== null && !ISO_DATE.test(String(pack.verification.checkedAt))) {
    throw new Error('verification.checkedAt debe ser fecha ISO o null');
  }
  if (pack.verification.reviewedBy !== null && typeof pack.verification.reviewedBy !== 'string') {
    throw new Error('verification.reviewedBy debe ser string o null');
  }
  if (pack.capabilities.taxCalculations.enabled && !['VERIFIED', 'PARTIAL_VERIFIED'].includes(pack.verification.state)) {
    throw new Error('Un pack documental o no revisado no puede habilitar calculos tributarios');
  }
  return true;
}

export function defineCountryPack(pack) {
  validateCountryPack(pack);
  return Object.freeze(pack);
}
