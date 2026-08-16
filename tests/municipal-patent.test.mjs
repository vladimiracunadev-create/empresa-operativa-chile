/**
 * Patente municipal.
 *
 * El error que estos tests impiden que vuelva: usar el capital enterado como
 * base de la patente de cualquier año. La base legal cambia entre el primer
 * ejercicio y los siguientes, y ese cambio es la mitad del producto.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMunicipalPatent } from '../packages/accounting-engine/municipal-patent.mjs';
import { normalizeMunicipality, findMunicipality, RATE_STATUS, MUNICIPALITIES } from '../packages/chile-tax-rules/municipalities.mjs';
import { loadRules } from '../packages/chile-tax-rules/index.mjs';
import { CompanyWorkspace, seedSandboxWorkspace } from '../packages/company-operations/workspace.mjs';
import { createMemoryStore } from '../packages/company-operations/store.mjs';

const ws = (mode = 'real') => new CompanyWorkspace({ store: createMemoryStore(), mode });
const UTM = loadRules(2026).utm['2026-08'];

/* --------------------------------------------------------- base de capital */

test('empresa nueva usa el capital propio inicial declarado', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 40000000, taxEquity: 999999999 });
  assert.equal(r.baseCapital, 40000000, 'una empresa nueva no puede usar el CPT: todavía no existe');
  assert.match(r.baseOrigin.rule, /inicial declarado/);
  assert.match(r.baseOrigin.legalReference, /art\. 24/);
});

test('empresa en funcionamiento usa el capital propio del cierre anterior', () => {
  const r = calculateMunicipalPatent({ businessStage: 'ESTABLISHED_BUSINESS', year: 2027, initialOwnCapital: 1000000, taxEquity: 60000000, rulesYear: 2026 });
  assert.equal(r.baseCapital, 60000000);
  assert.match(r.baseOrigin.rule, /31 de diciembre inmediatamente anterior/);
});

test('sin base declarada, lo dice en vez de calcular sobre cero en silencio', () => {
  const r = calculateMunicipalPatent({ businessStage: 'ESTABLISHED_BUSINESS', year: 2026, taxEquity: null });
  assert.equal(r.baseCapital, 0);
  assert.match(r.warnings.join(' '), /Falta el capital propio tributario/);
});

test('una etapa desconocida se rechaza', () => {
  assert.throws(() => calculateMunicipalPatent({ businessStage: 'CUALQUIERA', year: 2026 }), /NEW_BUSINESS/);
});

test('sin período de patente no se calcula nada', () => {
  assert.throws(() => calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', initialOwnCapital: 1000 }), /año del período/);
});

/* --------------------------------------------------------------- topes --- */

test('patente pequeña se lleva al mínimo de 1 UTM', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 1000000 });
  assert.equal(r.rawPatent, 2500);
  assert.equal(r.annualPatent, UTM);
  assert.equal(r.cappedBy, 'minimo');
});

test('patente normal no toca ningún tope', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 200000000, municipalRate: 0.005 });
  assert.equal(r.rawPatent, 1000000);
  assert.equal(r.annualPatent, 1000000);
  assert.equal(r.cappedBy, null);
});

test('patente enorme se lleva al máximo de 8.000 UTM', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 500000000000, municipalRate: 0.005 });
  assert.equal(r.maximumPatent, 8000 * UTM);
  assert.equal(r.annualPatent, 8000 * UTM);
  assert.equal(r.cappedBy, 'maximo');
});

test('la patente semestral es la mitad de la anual', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 200000000, municipalRate: 0.005 });
  assert.equal(r.semesterAmount, Math.round(r.annualPatent / 2));
});

/* ---------------------------------------------------------------- tasa --- */

test('una tasa fuera del rango legal se rechaza', () => {
  assert.throws(
    () => calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 1000000, municipalRate: 0.02 }),
    /fuera del rango legal/
  );
  assert.throws(
    () => calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 1000000, municipalRate: 0.001 }),
    /fuera del rango legal/
  );
});

test('sin tasa conocida se usa el mínimo y se advierte que es una simulación', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 100000000 });
  assert.equal(r.rate, 0.0025);
  assert.equal(r.rateStatus, RATE_STATUS.UNVERIFIED);
  assert.match(r.warnings.join(' '), /Tasa municipal no verificada/);
});

test('una tasa verificada con fuente y fecha deja de advertir', () => {
  const municipality = normalizeMunicipality({
    commune: 'Providencia',
    patentRate: 0.005,
    rateSource: 'Ordenanza municipal 2026',
    lastVerified: '2026-08-16'
  });
  assert.equal(municipality.status, RATE_STATUS.VERIFIED);

  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 100000000, municipality });
  assert.equal(r.rate, 0.005);
  assert.equal(r.rateStatus, RATE_STATUS.VERIFIED);
  assert.equal(r.warnings.some(w => /no verificada/.test(w)), false);
});

test('una tasa sin fuente ni fecha no puede quedar verificada', () => {
  assert.equal(normalizeMunicipality({ commune: 'Santiago', patentRate: 0.004 }).status, RATE_STATUS.UNVERIFIED);
  assert.equal(normalizeMunicipality({ commune: 'Santiago', patentRate: 0.004, rateSource: 'Ordenanza' }).status, RATE_STATUS.UNVERIFIED);
});

test('el maestro municipal no trae ninguna tasa inventada', () => {
  assert.ok(MUNICIPALITIES.length > 0);
  for (const m of MUNICIPALITIES) {
    assert.equal(m.patentRate, null, `${m.commune} trae una tasa que nadie verificó`);
    assert.equal(m.status, RATE_STATUS.UNVERIFIED);
  }
  assert.equal(findMunicipality('providencia')?.municipalityId, 'cl-13123');
  assert.equal(findMunicipality('comuna-que-no-existe'), null);
});

/* ----------------------------------------------------------------- UTM --- */

test('la UTM de otro período se declara en vez de arrastrarse en silencio', () => {
  const r = calculateMunicipalPatent({ businessStage: 'ESTABLISHED_BUSINESS', year: 2027, taxEquity: 50000000, rulesYear: 2026 });
  assert.match(r.warnings.join(' '), /no pertenece al período 2027/);
});

test('una UTM inexistente se rechaza', () => {
  assert.throws(() => calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 1000, utm: 0 }), /mayor que cero/);
});

test('pedir un mes de UTM que no está verificado avisa cuál se usó', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 1000000, utmPeriod: '2026-03' });
  assert.match(r.warnings.join(' '), /No hay UTM verificada para 2026-03/);
  assert.equal(r.utmPeriod, '2026-08');
});

/* -------------------------------------------------- deducciones y sucursales */

test('las inversiones deducibles rebajan la base y exigen certificado municipal', () => {
  const r = calculateMunicipalPatent({
    businessStage: 'ESTABLISHED_BUSINESS',
    year: 2026,
    taxEquity: 100000000,
    deductibleInvestments: 30000000,
    municipalRate: 0.005
  });
  assert.equal(r.baseCapital, 70000000);
  assert.match(r.assumptions.join(' '), /certificado de la municipalidad/);
});

test('el capital asignado por prorrateo reemplaza la base de la unidad', () => {
  const r = calculateMunicipalPatent({
    businessStage: 'ESTABLISHED_BUSINESS',
    year: 2026,
    taxEquity: 100000000,
    allocatedCapital: 25000000,
    municipalRate: 0.005
  });
  assert.equal(r.baseCapital, 25000000);
  assert.match(r.assumptions.join(' '), /art\. 25/);
});

/* ------------------------------------------------------- ciclo del año 2 -- */

test('un año sin reglas verificadas falla en vez de calcular con las del año pasado', () => {
  assert.throws(() => calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2031, initialOwnCapital: 1000 }), /No hay reglas verificadas/);
});

test('la base cambia entre el año 1 y el año 2 de la misma empresa', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  const patente1 = w.municipalPatentFor(2026);
  assert.equal(patente1.businessStage, 'NEW_BUSINESS');
  assert.equal(patente1.baseCapital, 1000000, 'el año 1 usa el capital propio inicial declarado');

  const close = w.closeFiscalYear(2026);
  const patente2 = w.municipalPatentFor(2027, { rulesYear: 2026 });
  assert.equal(patente2.businessStage, 'ESTABLISHED_BUSINESS');
  assert.equal(patente2.baseCapital, close.CPT, 'el año 2 usa el capital propio tributario del cierre anterior');
  assert.notEqual(patente2.baseCapital, patente1.baseCapital);
});

test('el historial muestra el año 2 rotulado como simulación, no como cálculo del período', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  w.closeFiscalYear(2026);
  const history = w.capitalHistory();

  const year1 = history.find(h => h.year === 2026);
  const year2 = history.find(h => h.year === 2027);
  assert.ok(year2, 'el año siguiente al cierre tiene que aparecer en el historial');

  assert.equal(year1.simulatedWithRulesYear, null, 'el año con reglas propias no se simula');
  assert.equal(year2.simulatedWithRulesYear, 2026, 'un año sin reglas propias sólo puede mostrarse como simulación rotulada');
  assert.match(year2.patentError, /No hay reglas verificadas para el año comercial 2027/);
  assert.notEqual(year2.patent.baseCapital, year1.patent.baseCapital, 'la base tiene que haber cambiado de un año al otro');
  assert.equal(year2.patent.baseCapital, w.getAnnualClose(2026).CPT);
});

test('el resultado de la patente es explicable, no un número suelto', () => {
  const r = calculateMunicipalPatent({ businessStage: 'NEW_BUSINESS', year: 2026, initialOwnCapital: 100000000 });
  for (const field of ['baseCapital', 'baseOrigin', 'rate', 'rawPatent', 'minimumPatent', 'maximumPatent', 'annualPatent', 'semesterAmount', 'legalBasis', 'assumptions', 'warnings', 'breakdown', 'status']) {
    assert.ok(r[field] !== undefined, `falta ${field} en el resultado de la patente`);
  }
  assert.equal(r.status, 'ESTIMADO');
  assert.equal(r.period, 2026);
});
