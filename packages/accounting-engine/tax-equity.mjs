/**
 * Motor de Capital Propio Tributario (CPT).
 *
 * Dos reglas de diseño que valen más que la aritmética:
 *
 *  1. Nunca devuelve sólo un número. Devuelve las partidas, el método, la base
 *     legal, los supuestos y las advertencias. Un CPT sin explicación no sirve
 *     ni para declarar ni para discutirlo con un contador.
 *  2. Nunca aplica la fórmula simplificada a quien no califica. El CPT
 *     simplificado es una regla del régimen Pro Pyme General; usarla en un
 *     contribuyente de otro régimen daría una cifra plausible y equivocada, que
 *     es el peor resultado posible.
 *
 * Base legal:
 *  - LIR art. 41 N.º 1 — CPT = activo − pasivo exigible, rebajados los valores
 *    intangibles, nominales, transitorios y de orden que no representen
 *    inversiones efectivas.
 *  - LIR art. 14 letra D) N.º 3 letra (j) — CPT simplificado de la Pyme.
 *
 * Módulo puro: sin `node:*`.
 */
import { loadRules } from '../chile-tax-rules/index.mjs';

const clp = n => Math.round(Number(n || 0));

export const TAX_EQUITY_METHODS = Object.freeze(['article41', 'simplified14D3j']);

/** Régimenes que determinan el CPT simplificado de la letra (j). */
const SIMPLIFIED_REGIMES = [/pro\s*pyme\s*general/i, /14\s*D\s*N?\.?º?\s*3/i];

/** ¿El régimen declarado permite el CPT simplificado? */
export function allowsSimplifiedTaxEquity(taxRegime) {
  const value = String(taxRegime ?? '');
  if (/transparente/i.test(value)) return false;
  return SIMPLIFIED_REGIMES.some(re => re.test(value));
}

/**
 * Determina el capital propio tributario de un ejercicio.
 *
 * @param {object} input
 * @param {number} input.fiscalYear         Año comercial que se cierra.
 * @param {string} input.taxRegime          Régimen tributario declarado por la empresa.
 * @param {number} [input.assets]           Activos a valor tributario.
 * @param {number} [input.liabilities]      Pasivos exigibles a valor tributario.
 * @param {number} [input.nonEffectiveValues] Intangibles/nominales/transitorios sin inversión efectiva.
 * @param {object} [input.equityMovements]  Resumen de movimientos patrimoniales del ejercicio.
 * @param {object} [input.taxAdjustments]   `{ positive, negative, detail[] }`.
 * @param {number|null} [input.openingTaxEquity] CPT de apertura (cierre del ejercicio anterior).
 * @param {object} [input.operations]       `{ taxableBase, losses, exemptIncome, article21Paid, participationIncome }`.
 * @param {string} [input.method]           Fuerza un método; por omisión se elige según el régimen.
 * @param {number} [input.rulesYear]        Año de reglas a usar (por omisión, `fiscalYear`).
 */
export function calculateTaxEquity({
  fiscalYear,
  taxRegime = '',
  assets,
  liabilities,
  nonEffectiveValues = 0,
  equityMovements = {},
  taxAdjustments = {},
  openingTaxEquity = null,
  operations = {},
  method,
  rulesYear
} = {}) {
  if (!Number.isInteger(Number(fiscalYear))) throw new Error('calculateTaxEquity requiere fiscalYear (año comercial)');
  const rules = loadRules(rulesYear ?? fiscalYear);
  const spec = rules.taxEquity;
  if (!spec) throw new Error(`Las reglas del año ${fiscalYear} no describen la determinación del capital propio tributario.`);

  const simplifiedAllowed = allowsSimplifiedTaxEquity(taxRegime);
  const chosen = method ?? (simplifiedAllowed ? 'simplified14D3j' : 'article41');
  if (!TAX_EQUITY_METHODS.includes(chosen)) throw new Error(`Método de CPT desconocido: ${chosen}`);

  const warnings = [];
  const evidence = [];
  const assumptions = [];

  if (chosen === 'simplified14D3j' && !simplifiedAllowed) {
    warnings.push(
      `El régimen declarado (“${taxRegime || 'sin declarar'}”) no corresponde al que permite el capital propio tributario simplificado ` +
        'de la letra (j). El resultado no es aplicable a este contribuyente sin revisión profesional.'
    );
  }
  if (!taxRegime) {
    warnings.push('No hay régimen tributario declarado en la ficha de empresa: se aplicó el método general del art. 41.');
  }

  const result =
    chosen === 'simplified14D3j'
      ? simplified({ equityMovements, operations, taxAdjustments, openingTaxEquity, spec, warnings, assumptions })
      : general({ assets, liabilities, nonEffectiveValues, taxAdjustments, spec, warnings, assumptions });

  if (openingTaxEquity === null || openingTaxEquity === undefined) {
    assumptions.push('No hay CPT de apertura registrado: se asume que éste es el primer ejercicio de la empresa.');
  }

  evidence.push(
    { kind: 'legal', ref: spec.methods[chosen].legalReference, source: spec.methods[chosen].source ?? null, lastVerified: spec.methods[chosen].lastVerified ?? null },
    { kind: 'rules', ref: `packages/chile-tax-rules/rules/${rules.commercialYear}.json`, lastVerified: rules.lastVerified }
  );

  warnings.push(...(spec.warnings ?? []));

  return {
    fiscalYear: Number(fiscalYear),
    taxRegime: taxRegime || null,
    openingCPT: openingTaxEquity === null || openingTaxEquity === undefined ? null : clp(openingTaxEquity),
    ...result,
    calculationMethod: chosen,
    calculationMethodLabel: spec.methods[chosen].label,
    formula: spec.methods[chosen].formula,
    legalBasis: spec.methods[chosen].legalReference,
    rulesYear: rules.commercialYear,
    rulesLastVerified: rules.lastVerified,
    status: 'ESTIMADO',
    assumptions,
    warnings,
    evidence
  };
}

/* --------------------------------------------------- art. 41 N.º 1 ------ */

function general({ assets, liabilities, nonEffectiveValues, taxAdjustments, spec, warnings, assumptions }) {
  const incomplete = assets === undefined || assets === null || liabilities === undefined || liabilities === null;
  if (incomplete) {
    warnings.push(
      'CPT calculado con información incompleta: faltan los activos o los pasivos exigibles a valor tributario. La cifra es referencial.'
    );
  }

  const taxAssets = clp(assets);
  const eligibleLiabilities = clp(liabilities);
  const nonEffective = clp(nonEffectiveValues);
  const positive = clp(taxAdjustments.positive);
  const negative = clp(taxAdjustments.negative);

  if (nonEffective === 0) {
    assumptions.push(
      'No se registraron valores intangibles, nominales, transitorios o de orden sin inversión efectiva; se asumió que no existen.'
    );
  }

  const calculated = taxAssets - nonEffective - eligibleLiabilities + positive - negative;

  return {
    taxAssets,
    eligibleLiabilities,
    nonEffectiveValues: nonEffective,
    positiveAdjustments: positive,
    negativeAdjustments: negative,
    capitalIncreases: 0,
    capitalDecreases: 0,
    calculatedCPT: calculated,
    breakdown: [
      { label: 'Activos a valor tributario', amount: taxAssets, sign: 1, legalBasis: spec.methods.article41.legalReference },
      { label: 'Valores sin inversión efectiva (intangibles, nominales, transitorios, de orden)', amount: nonEffective, sign: -1 },
      { label: 'Pasivos exigibles', amount: eligibleLiabilities, sign: -1 },
      { label: 'Ajustes tributarios que suman', amount: positive, sign: 1 },
      { label: 'Ajustes tributarios que restan', amount: negative, sign: -1 }
    ],
    detail: taxAdjustments.detail ?? [],
    complete: !incomplete
  };
}

/* ------------------------------------- art. 14 D) N.º 3 letra (j) ------- */

function simplified({ equityMovements, operations, taxAdjustments, openingTaxEquity, spec, warnings, assumptions }) {
  const m = equityMovements ?? {};
  const o = operations ?? {};

  const capitalAportado = clp(m.capitalEnteradoPorMovimientos ?? m.capitalEnterado ?? 0);
  const disminuciones = clp(m.disminucionesDeCapital);
  const retiros = clp(m.retiros);

  const bases = clp(o.taxableBase);
  const participaciones = clp(o.participationIncome);
  const perdidas = clp(o.losses);
  const art21 = clp(o.article21Paid);

  const positive = clp(taxAdjustments.positive);
  const negative = clp(taxAdjustments.negative);

  if (o.taxableBase === undefined || o.taxableBase === null) {
    warnings.push(
      'No hay base imponible de primera categoría registrada para el ejercicio: el CPT simplificado se calculó sin ese sumando y quedará subestimado.'
    );
  }
  if (capitalAportado === 0) {
    warnings.push('No hay movimientos que enteren capital registrados: revisa la sección Capital y Patrimonio antes de usar esta cifra.');
  }
  if (openingTaxEquity !== null && openingTaxEquity !== undefined) {
    assumptions.push(
      'Desde el segundo ejercicio la letra (j) permite partir del CPT simplificado del 31 de diciembre anterior; ' +
        'aquí se recompone desde el capital aportado y las bases imponibles acumuladas, y el CPT de apertura se muestra para contrastar.'
    );
  }

  const bruto = capitalAportado + bases + participaciones + positive - disminuciones - perdidas - art21 - retiros - negative;
  const calculated = Math.max(0, bruto);

  if (bruto < 0) {
    warnings.push(`El cálculo dio ${bruto.toLocaleString('es-CL')}; la letra (j) manda considerar $0 cuando el resultado es negativo.`);
  }

  return {
    taxAssets: null,
    eligibleLiabilities: null,
    nonEffectiveValues: 0,
    positiveAdjustments: positive,
    negativeAdjustments: negative,
    capitalIncreases: capitalAportado,
    capitalDecreases: disminuciones,
    rawCPT: bruto,
    calculatedCPT: calculated,
    flooredAtZero: bruto < 0,
    breakdown: [
      { label: 'Capital aportado efectivamente enterado (y sus aumentos)', amount: capitalAportado, sign: 1 },
      { label: 'Bases imponibles de primera categoría del ejercicio', amount: bases, sign: 1 },
      { label: 'Rentas percibidas por participaciones en otras empresas', amount: participaciones, sign: 1 },
      { label: 'Ajustes tributarios que suman', amount: positive, sign: 1 },
      { label: 'Disminuciones de capital', amount: disminuciones, sign: -1 },
      { label: 'Pérdidas', amount: perdidas, sign: -1 },
      { label: 'Partidas del inciso segundo del art. 21 pagadas', amount: art21, sign: -1 },
      { label: 'Retiros y distribuciones a los propietarios', amount: retiros, sign: -1 },
      { label: 'Ajustes tributarios que restan', amount: negative, sign: -1 }
    ],
    detail: taxAdjustments.detail ?? [],
    complete: o.taxableBase !== undefined && o.taxableBase !== null && capitalAportado > 0,
    floorNote: spec.methods.simplified14D3j.note ?? null
  };
}
