/**
 * Ley 21.850 (D.O. 17-10-2026): cálculos que el producto SÍ puede respaldar.
 *
 * Reglas de la casa:
 *  - ninguna tasa ni tope vive aquí: todo sale de `chile-tax-rules` del año;
 *  - cuando falta una instrucción oficial, un dato o una condición legal, el
 *    resultado es un ESTADO explícito (`pendiente-validacion`,
 *    `informacion-insuficiente`, `no-aplica`), nunca una cifra aproximada
 *    presentada como definitiva;
 *  - módulo puro: sin `node:*`, corre igual en web, Android y Windows.
 */
import { loadRules } from '../chile-tax-rules/index.mjs';

export const STATUS = Object.freeze({
  CALCULATED: 'calculado',
  PENDING: 'pendiente-validacion',
  INSUFFICIENT: 'informacion-insuficiente',
  NOT_APPLICABLE: 'no-aplica',
  NOT_IN_FORCE: 'no-vigente',
  NOT_COMPUTABLE: 'no-calculable'
});

const clp = n => Math.round(Number(n || 0));
const num = v => (v === null || v === undefined || v === '' ? NaN : Number(v));
const isNonNegative = v => Number.isFinite(v) && v >= 0;

/** IDPC del régimen general 14 A según la escalera de la ley para el año comercial. */
export function idpcRegimen14A({ taxableBase }, year = 2027) {
  const rules = loadRules(year);
  const b = num(taxableBase);
  const rule = rules.idpcGeneral14A;
  if (!rule) throw new Error(`Las reglas ${year} no declaran idpcGeneral14A`);
  if (!isNonNegative(b)) {
    return { status: STATUS.INSUFFICIENT, regime: '14 A', commercialYear: year, reason: 'taxableBase debe ser un número >= 0' };
  }
  const base = clp(b);
  return {
    status: STATUS.CALCULATED,
    regime: '14 A',
    commercialYear: year,
    taxYear: rule.taxYear,
    base,
    rate: rule.rate,
    estimatedIdpc: clp(base * rule.rate),
    creditRestitution: rule.creditRestitution,
    legalReference: rule.legalReference,
    source: rule.source,
    lastVerified: rule.lastVerified,
    limitations: [
      'Estimación sobre la base imponible declarada por el usuario; no determina la renta líquida imponible.',
      rule.note
    ]
  };
}

/** IDPC Pro Pyme General o estado pendiente si el SII aún no instruye la tasa. */
export function idpcProPymeGeneral({ taxableBase }, year = 2027) {
  const rule = loadRules(year).idpcProPyme;
  const b = num(taxableBase);
  if (!isNonNegative(b)) {
    return { status: STATUS.INSUFFICIENT, regime: 'Pro Pyme General', commercialYear: year, reason: 'taxableBase debe ser un número >= 0' };
  }
  if (rule.rate === null || rule.rate === undefined) {
    return { status: STATUS.PENDING, regime: 'Pro Pyme General', commercialYear: year, reason: rule.reason ?? rule.note, source: rule.source, lastVerified: rule.lastVerified };
  }
  const base = clp(b);
  return {
    status: rule.conditional ? STATUS.PENDING : STATUS.CALCULATED,
    regime: 'Pro Pyme General',
    commercialYear: year,
    base,
    rate: rule.rate,
    estimatedIdpc: rule.conditional ? null : clp(base * rule.rate),
    hypotheticalIdpc: rule.conditional ? clp(base * rule.rate) : undefined,
    reason: rule.conditional ? 'La tasa depende de una condición previsional que la aplicación no verifica.' : undefined,
    legalReference: rule.legalReference,
    source: rule.source,
    lastVerified: rule.lastVerified,
    limitations: [rule.note]
  };
}

/**
 * Comparación didáctica 14 A vs Pro Pyme General vs Pro Pyme Transparente.
 * No recomienda: la base de cada régimen se determina distinto (devengado vs
 * flujo) y la carga final depende de los propietarios.
 */
export function compareRegimes({ taxableBase }, year = 2027) {
  const general = idpcRegimen14A({ taxableBase }, year);
  const pyme = idpcProPymeGeneral({ taxableBase }, year);
  const transparent = {
    status: STATUS.NOT_COMPUTABLE,
    regime: 'Pro Pyme Transparente',
    commercialYear: year,
    reason: 'No paga IDPC: la renta se atribuye a los propietarios y tributa en sus impuestos finales; requiere sus datos personales.'
  };
  const comparable = general.status === STATUS.CALCULATED && pyme.status === STATUS.CALCULATED;
  return {
    commercialYear: year,
    regimes: [general, pyme, transparent],
    idpcDifference: comparable ? general.estimatedIdpc - pyme.estimatedIdpc : null,
    comparable,
    limitations: [
      'Comparación del IDPC sobre una misma base hipotética; en la práctica la base difiere entre regímenes.',
      'No incluye impuestos finales de los propietarios, créditos, restitución ni elegibilidad de ingresos.',
      'Cambiar de régimen exige cumplir requisitos y plazos legales: validar con un contador.'
    ]
  };
}

const exportRegionBonus = { RM: 0, 'RM-rural': 1, regiones: 1 };

/**
 * Crédito por remuneraciones de exportación de servicios basados en el
 * conocimiento (LIR art. 33 ter). Sólo calcula con condiciones confirmadas.
 */
export function exportServicesCredit(input, year = 2027) {
  const rules = loadRules(year);
  const law = rules.ley21850?.exportServicesCredit;
  if (year === 2026) {
    return { status: STATUS.PENDING, commercialYear: year, reason: 'El crédito rige desde el 2026-11-01: el tratamiento del ejercicio parcial 2026 requiere instrucción del SII.', legalReference: 'LIR art. 33 ter (Ley 21.850 art. 7)' };
  }
  if (!law) return { status: STATUS.NOT_IN_FORCE, commercialYear: year, reason: `Las reglas ${year} no incluyen la Ley 21.850.` };
  const { workers, exportIncome, totalIncome, utm, qualified = {} } = input ?? {};
  const eI = num(exportIncome);
  const tI = num(totalIncome);
  const u = num(utm);
  if (!Array.isArray(workers) || workers.length === 0 || !isNonNegative(eI) || !(tI > 0) || !(u > 0)) {
    return { status: STATUS.INSUFFICIENT, commercialYear: year, reason: 'Se requiere nómina de trabajadores, ingresos de exportación, ingresos totales (> 0) y UTM de diciembre.', legalReference: law.legalReference };
  }
  if (eI > tI) return { status: STATUS.INSUFFICIENT, commercialYear: year, reason: 'Los ingresos de exportación no pueden superar los ingresos totales.' };
  if (qualified.accountingIncome !== true) {
    return { status: STATUS.NOT_APPLICABLE, commercialYear: year, reason: 'Exige renta efectiva según contabilidad completa.', legalReference: law.legalReference };
  }
  const missing = ['customsQualified', 'foreignClient', 'usedAbroad', 'knowledgeBased'].filter(k => qualified[k] !== true);
  if (missing.length) {
    return { status: STATUS.NOT_APPLICABLE, commercialYear: year, reason: `No se acreditan los requisitos: ${missing.join(', ')}.`, requirements: law.requirements, legalReference: law.legalReference };
  }
  const share = eI / tI;
  const cap = clp(law.capUtmPerWorker * u);
  const perWorker = [];
  for (const w of workers) {
    const pay = num(w.annualTaxableRemuneration);
    const region = w.workplace;
    if (!isNonNegative(pay) || !(region in exportRegionBonus) || w.residentInChile !== true) {
      return { status: STATUS.INSUFFICIENT, commercialYear: year, reason: 'Cada trabajador requiere remuneración imponible anual >= 0, lugar principal (RM, RM-rural, regiones) y residencia en Chile.' };
    }
    const rate = law.rate + (exportRegionBonus[region] ? law.nonMetropolitanBonusPoints : 0);
    const raw = clp(pay * share * rate);
    perWorker.push({ id: w.id ?? null, rate, raw, credit: Math.min(raw, cap), capped: raw > cap });
  }
  const total = perWorker.reduce((s, w) => s + w.credit, 0);
  const catalogOk = qualified.catalogConfirmed === true;
  return {
    status: catalogOk ? STATUS.CALCULATED : STATUS.PENDING,
    commercialYear: year,
    exportShare: share,
    capPerWorker: cap,
    perWorker,
    credit: catalogOk ? total : null,
    hypotheticalCredit: catalogOk ? undefined : total,
    reason: catalogOk ? undefined : 'El servicio no está confirmado en el catálogo del decreto de Hacienda (pendiente de publicación).',
    legalReference: law.legalReference,
    pending: law.pending,
    restrictions: law.restrictions,
    limitations: ['Se imputa contra el Impuesto de Primera Categoría; el remanente no se devuelve y se arrastra reajustado.', 'Los trabajadores de regiones exigen registro y acreditación del lugar de labores (resolución SII pendiente).']
  };
}

/** Crédito por financiamiento de enfermedades catastróficas (LIR art. 33 quáter). */
export function catastrophicDiseasesCredit(input, year = 2027) {
  const rules = loadRules(year);
  const law = rules.ley21850?.catastrophicDiseasesCredit;
  if (!law) return { status: STATUS.NOT_IN_FORCE, commercialYear: year, reason: `Las reglas ${year} no incluyen la Ley 21.850.` };
  if (year < 2027) return { status: STATUS.NOT_IN_FORCE, commercialYear: year, reason: 'Rige desde el 2027-01-01.', legalReference: law.legalReference };
  const { regime, workers, utm, diseasesDecreeConfirmed = false } = input ?? {};
  const u = num(utm);
  if (!law.regimes.includes(regime)) {
    return { status: STATUS.NOT_APPLICABLE, commercialYear: year, reason: `Sólo aplica a los regímenes ${law.regimes.join(' y ')}.`, legalReference: law.legalReference };
  }
  if (!Array.isArray(workers) || workers.length === 0 || !(u > 0)) {
    return { status: STATUS.INSUFFICIENT, commercialYear: year, reason: 'Se requiere nómina de trabajadores y UTM de diciembre.' };
  }
  const cap = clp(law.totalCapUtmPerWorker * u);
  const perWorker = [];
  for (const w of workers) {
    const paid = num(w.paidByEmployer);
    const covered = num(w.coveredByThirdParties ?? 0);
    const used = num(w.creditAlreadyUsed ?? 0);
    const tenure = num(w.tenureYears);
    if (![paid, covered, used, tenure].every(isNonNegative)) {
      return { status: STATUS.INSUFFICIENT, commercialYear: year, reason: 'Cada trabajador requiere pago, cobertura de terceros, crédito usado y antigüedad numéricos >= 0.' };
    }
    const blockers = [];
    if (tenure < 2) blockers.push('antigüedad inferior a 2 años continuos');
    if (w.contributionsUpToDate !== true) blockers.push('cotizaciones no acreditadas al día');
    if (w.accreditedProvider !== true) blockers.push('prestador no acreditado en la Superintendencia de Salud');
    if (w.ownerOrRelative === true) blockers.push('beneficia a titular de 10% o más, o a su pariente');
    if (blockers.length) {
      perWorker.push({ id: w.id ?? null, credit: 0, blockers });
      continue;
    }
    const eligible = Math.max(0, clp(paid) - clp(covered));
    const room = Math.max(0, cap - clp(used));
    const credit = Math.min(eligible, room);
    perWorker.push({ id: w.id ?? null, eligible, credit, excessDeductibleAsExpense: eligible - credit, blockers: [] });
  }
  const total = perWorker.reduce((s, w) => s + w.credit, 0);
  return {
    status: diseasesDecreeConfirmed ? STATUS.CALCULATED : STATUS.PENDING,
    commercialYear: year,
    capPerWorker: cap,
    perWorker,
    credit: diseasesDecreeConfirmed ? total : null,
    hypotheticalCredit: diseasesDecreeConfirmed ? undefined : total,
    reason: diseasesDecreeConfirmed ? undefined : 'El decreto Hacienda-Salud que define enfermedades y tratamientos cubiertos aún no está confirmado.',
    legalReference: law.legalReference,
    pending: law.pending,
    limitations: ['El tope de 150 UTM es total por trabajador durante toda la relación laboral.', 'El crédito no da derecho a devolución; el remanente se imputa en años siguientes.']
  };
}
