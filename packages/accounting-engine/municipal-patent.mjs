/**
 * Motor de patente municipal.
 *
 * Lo que este módulo corrige respecto de la versión anterior: antes la patente
 * se estimaba con `capital enterado × tasa mínima`, siempre, para cualquier año.
 * Eso sólo se parece a la ley el primer año, y ni siquiera del todo.
 *
 * El art. 24 del D.L. 3.063 dice que la base es el capital propio, y que ese
 * capital propio es:
 *
 *   actividades nuevas      → el capital propio INICIAL DECLARADO por el contribuyente
 *   ejercicios posteriores  → el registrado en el balance terminado el 31 de
 *                             diciembre inmediatamente anterior, con los ajustes
 *                             de los arts. 41 y siguientes de la LIR
 *
 * De ahí que exista `businessStage`: no es un detalle de interfaz, es la
 * bifurcación legal de la que depende qué número entra al cálculo.
 *
 * Módulo puro: sin `node:*`.
 */
import { loadRules } from '../chile-tax-rules/index.mjs';
import { RATE_STATUS, UNVERIFIED_RATE_WARNING } from '../chile-tax-rules/municipalities.mjs';

const clp = n => Math.round(Number(n || 0));

export const BUSINESS_STAGES = Object.freeze(['NEW_BUSINESS', 'ESTABLISHED_BUSINESS']);

/**
 * Calcula la patente municipal anual de un período.
 *
 * @param {object} input
 * @param {'NEW_BUSINESS'|'ESTABLISHED_BUSINESS'} input.businessStage
 * @param {object} [input.municipality]           Entrada del maestro municipal (ver `chile-tax-rules/municipalities.mjs`).
 * @param {number} input.year                     Período de la patente.
 * @param {number} [input.initialOwnCapital]      Capital propio inicial declarado (empresa nueva).
 * @param {number} [input.taxEquity]              CPT del cierre anterior (empresa en funcionamiento).
 * @param {number} [input.deductibleInvestments]  Capital invertido en otros negocios afectos a patente.
 * @param {number} [input.allocatedCapital]       Capital asignado a esta unidad si hay prorrateo entre sucursales.
 * @param {number} [input.municipalRate]          Tasa efectiva de la comuna; si falta, se usa la mínima legal y se advierte.
 * @param {number} [input.utm]                    UTM del período; si falta, la de las reglas.
 * @param {string} [input.utmPeriod]              Mes `YYYY-MM` de la UTM usada.
 * @param {number} [input.rulesYear]              Año de reglas (por omisión, `year`).
 */
export function calculateMunicipalPatent({
  businessStage,
  municipality = null,
  year,
  initialOwnCapital,
  taxEquity,
  deductibleInvestments = 0,
  allocatedCapital,
  municipalRate,
  utm,
  utmPeriod,
  rulesYear
} = {}) {
  if (!BUSINESS_STAGES.includes(businessStage)) {
    throw new Error(`businessStage debe ser ${BUSINESS_STAGES.join(' o ')}`);
  }
  if (!Number.isInteger(Number(year))) throw new Error('calculateMunicipalPatent requiere el año del período de la patente');

  const rules = loadRules(rulesYear ?? year);
  const spec = rules.municipalPatent;

  const warnings = [];
  const assumptions = [];

  /* ---------------------------------------------------- base de capital -- */

  const isNew = businessStage === 'NEW_BUSINESS';
  const rawBase = isNew ? initialOwnCapital : taxEquity;
  const basisSpec = isNew ? spec.capitalBasis.newBusiness : spec.capitalBasis.establishedBusiness;

  if (rawBase === undefined || rawBase === null) {
    warnings.push(
      isNew
        ? 'Falta el capital propio inicial declarado: sin él no hay base legal para la patente inicial.'
        : 'Falta el capital propio tributario del cierre anterior: sin él no se puede determinar la base del período. ' +
            'Cierra el ejercicio anterior antes de usar esta cifra.'
    );
  }

  const declaredBase = clp(rawBase);
  const deductions = clp(deductibleInvestments);
  if (deductions > 0) {
    assumptions.push(
      'La deducción por inversiones en otros negocios afectos a patente exige certificado de la municipalidad correspondiente ' +
        '(art. 24 inciso final). La aplicación no la acredita: sólo la aplica si tú la registras.'
    );
  }

  const afterDeductions = Math.max(0, declaredBase - deductions);
  const allocated = allocatedCapital === undefined || allocatedCapital === null ? null : clp(allocatedCapital);
  if (allocated !== null) {
    assumptions.push(
      'Se aplicó un capital asignado por prorrateo entre sucursales (art. 25): la municipalidad de la casa matriz es la que determina la distribución.'
    );
  }
  const baseCapital = allocated !== null ? allocated : afterDeductions;

  /* ------------------------------------------------------------ tasa ---- */

  const rateInfo = resolveRate({ municipality, municipalRate, spec, warnings, assumptions });

  /* ------------------------------------------------------------- UTM ---- */

  const utmInfo = resolveUtm({ utm, utmPeriod, rules, year, warnings, assumptions });

  /* ---------------------------------------------------------- cálculo --- */

  const rawPatent = clp(baseCapital * rateInfo.rate);
  const minimumPatent = clp(spec.minUtm * utmInfo.value);
  const maximumPatent = clp(spec.maxUtm * utmInfo.value);
  const annualPatent = Math.min(maximumPatent, Math.max(minimumPatent, rawPatent));

  const capped =
    annualPatent === minimumPatent && rawPatent < minimumPatent
      ? 'minimo'
      : annualPatent === maximumPatent && rawPatent > maximumPatent
        ? 'maximo'
        : null;

  return {
    period: Number(year),
    businessStage,
    baseCapital,
    baseOrigin: {
      stage: businessStage,
      rule: basisSpec.rule,
      legalReference: basisSpec.legalReference,
      declaredBase,
      deductibleInvestments: deductions,
      allocatedCapital: allocated,
      note: basisSpec.note ?? null
    },
    rate: rateInfo.rate,
    rateStatus: rateInfo.status,
    rateSource: rateInfo.source,
    rateLastVerified: rateInfo.lastVerified,
    legalRateRange: { min: spec.minRate, max: spec.maxRate },
    rawPatent,
    minimumPatent,
    maximumPatent,
    annualPatent,
    semesterAmount: Math.round(annualPatent / 2),
    cappedBy: capped,
    utm: utmInfo.value,
    utmPeriod: utmInfo.period,
    municipality: municipality
      ? { municipalityId: municipality.municipalityId ?? null, commune: municipality.commune ?? null, name: municipality.name ?? null }
      : null,
    legalBasis: spec.legalReference,
    source: spec.source,
    rulesYear: rules.commercialYear,
    rulesLastVerified: spec.lastVerified ?? rules.lastVerified,
    status: 'ESTIMADO',
    breakdown: [
      { label: 'Capital base de patente', amount: baseCapital, kind: 'base' },
      { label: `Tasa municipal (${(rateInfo.rate * 1000).toLocaleString('es-CL', { maximumFractionDigits: 3 })}‰)`, amount: null, kind: 'rate' },
      { label: 'Patente calculada', amount: rawPatent, kind: 'raw' },
      { label: `Mínimo legal (${spec.minUtm} UTM)`, amount: minimumPatent, kind: 'min' },
      { label: `Máximo legal (${spec.maxUtm.toLocaleString('es-CL')} UTM)`, amount: maximumPatent, kind: 'max' },
      { label: 'Patente anual final', amount: annualPatent, kind: 'total' }
    ],
    assumptions,
    warnings
  };
}

function resolveRate({ municipality, municipalRate, spec, warnings, assumptions }) {
  const fromMunicipality = municipality?.status === RATE_STATUS.VERIFIED ? municipality.patentRate : null;
  const explicit = municipalRate === undefined || municipalRate === null ? null : Number(municipalRate);
  const rate = explicit ?? fromMunicipality;

  if (rate === null) {
    warnings.push(UNVERIFIED_RATE_WARNING);
    assumptions.push(`No se conoce la tasa de la comuna: se usó el mínimo legal (${(spec.minRate * 1000).toFixed(2)}‰) como supuesto.`);
    return { rate: spec.minRate, status: RATE_STATUS.UNVERIFIED, source: null, lastVerified: null };
  }
  if (!Number.isFinite(rate)) throw new Error('La tasa municipal debe ser un número.');
  if (rate < spec.minRate || rate > spec.maxRate) {
    throw new Error(
      `La tasa ${(rate * 1000).toFixed(2)}‰ está fuera del rango legal (${(spec.minRate * 1000).toFixed(2)}‰ a ${(spec.maxRate * 1000).toFixed(2)}‰).`
    );
  }

  const verified = explicit === null && municipality?.status === RATE_STATUS.VERIFIED;
  if (!verified) warnings.push(UNVERIFIED_RATE_WARNING);

  return {
    rate,
    status: verified ? RATE_STATUS.VERIFIED : RATE_STATUS.UNVERIFIED,
    source: verified ? municipality.rateSource : null,
    lastVerified: verified ? municipality.lastVerified : null
  };
}

/**
 * Resuelve la UTM del período.
 *
 * La UTM cambia todos los meses y los topes de la patente están expresados en
 * UTM, así que arrastrar la de otro período cambia la cifra en silencio. Se
 * declara siempre cuál se usó.
 */
function resolveUtm({ utm, utmPeriod, rules, year, warnings, assumptions }) {
  if (utm !== undefined && utm !== null) {
    const value = clp(utm);
    if (value <= 0) throw new Error('La UTM debe ser mayor que cero.');
    return { value, period: utmPeriod ?? null };
  }

  const table = rules.utm ?? {};
  const months = Object.keys(table).filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
  const wanted = utmPeriod && months.includes(utmPeriod) ? utmPeriod : null;
  const forYear = months.filter(k => k.startsWith(String(year)));
  const chosen = wanted ?? forYear.at(-1) ?? months.at(-1);

  if (!chosen) throw new Error(`Las reglas del año ${rules.commercialYear} no traen ninguna UTM verificada.`);
  if (utmPeriod && chosen !== utmPeriod) {
    warnings.push(`No hay UTM verificada para ${utmPeriod}: se usó la de ${chosen}. Verifica el valor del mes antes de declarar.`);
  }
  if (!chosen.startsWith(String(year))) {
    warnings.push(`Se usó la UTM de ${chosen}, que no pertenece al período ${year}. Carga la UTM del período antes de usar esta cifra.`);
  } else if (!utmPeriod) {
    assumptions.push(`Se usó la UTM de ${chosen}, la última verificada del período.`);
  }

  return { value: clp(table[chosen]), period: chosen };
}
