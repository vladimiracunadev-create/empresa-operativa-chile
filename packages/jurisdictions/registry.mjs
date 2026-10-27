import { validateCountryPack } from '../core/country-pack.mjs';
import { pack as cl, loadVerifiedChileRules } from './cl/index.mjs';
import { pack as pe } from './pe/index.mjs';
import { pack as mx } from './mx/index.mjs';
import { pack as co } from './co/index.mjs';
import { pack as ar } from './ar/index.mjs';
import { pack as br } from './br/index.mjs';
import { pack as es } from './es/index.mjs';

const PACKS = new Map([cl, pe, mx, co, ar, br, es].map(pack => {
  validateCountryPack(pack);
  return [pack.country, pack];
}));

export function listCountryPacks() {
  return [...PACKS.values()];
}

export function getCountryPack(country) {
  const key = String(country || '').toUpperCase();
  const pack = PACKS.get(key);
  if (!pack) throw new Error(`NOT_IMPLEMENTED: no existe CountryPack para ${key || '(vacio)'}`);
  return pack;
}

/** Pais fiscal e idioma se resuelven por separado deliberadamente. */
export function resolveJurisdiction({ country, locale }) {
  const pack = getCountryPack(country);
  let resolvedLocale;
  try {
    resolvedLocale = Intl.getCanonicalLocales(locale)[0];
  } catch {
    throw new Error(`Locale BCP 47 invalido: ${locale}`);
  }
  if (!resolvedLocale) throw new Error(`Locale BCP 47 invalido: ${locale}`);
  return { countryPack: pack, locale: resolvedLocale };
}

/** Unico puente de calculo habilitado en esta fase: Chile y ano explicitamente verificado. */
export function loadTaxRules({ country, commercialYear }) {
  const pack = getCountryPack(country);
  if (!pack.capabilities.taxCalculations.enabled) {
    throw new Error(`REQUIRES_HUMAN_REVIEW: calculos tributarios deshabilitados para ${pack.country}`);
  }
  if (pack.country !== 'CL' || pack.capabilities.taxCalculations.mode !== 'LEGACY_ADAPTER') {
    throw new Error(`NOT_IMPLEMENTED: no existe adaptador tributario aprobado para ${pack.country}`);
  }
  return loadVerifiedChileRules(commercialYear);
}
