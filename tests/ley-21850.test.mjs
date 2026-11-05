import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, availableYears } from '../packages/chile-tax-rules/index.mjs';
import {
  idpcRegimen14A, idpcProPymeGeneral, compareRegimes, exportServicesCredit,
  catastrophicDiseasesCredit, idpcProPyme, ppmFromSalesNet, municipalPatent, honorariumFromGross, TAX_STATUS
} from '../packages/accounting-engine/index.mjs';

test('hay reglas para 2026 a 2030 y un año posterior sigue fallando', () => {
  assert.deepEqual(availableYears(), [2026, 2027, 2028, 2029, 2030]);
  assert.throws(() => loadRules(2031), /No hay reglas verificadas/);
});

test('escalera 14 A por AÑO COMERCIAL (art. 6° transitorio), no por año de declaración', () => {
  const rates = [2026, 2027, 2028, 2029, 2030].map(y => idpcRegimen14A({ taxableBase: 1_000_000 }, y));
  assert.deepEqual(rates.map(r => r.rate), [0.27, 0.255, 0.24, 0.23, 0.23]);
  assert.deepEqual(rates.map(r => r.taxYear), [2027, 2028, 2029, 2030, 2031]);
  assert.equal(idpcRegimen14A({ taxableBase: 200_000_000 }, 2029).estimatedIdpc, 46_000_000);
});

test('restitución del crédito: 30% AT2028, 20% AT2029, 0% desde AT2030', () => {
  const r = y => loadRules(y).idpcGeneral14A.creditRestitution.rate;
  assert.deepEqual([r(2027), r(2028), r(2029), r(2030)], [0.3, 0.2, 0, 0]);
  assert.equal(loadRules(2026).idpcGeneral14A.creditRestitution.rate, null);
});

test('la historia no se reescribe: 2026 conserva sus valores previos', () => {
  const r = loadRules(2026);
  assert.equal(r.idpcProPyme.rate, 0.125);
  assert.equal(r.honorarios.retentionRate, 0.1525);
  assert.equal(r.iva.generalRate, 0.19);
  assert.equal(r.utm['2026-08'], 71649);
  assert.equal(idpcProPyme({ incomeReceived: 2_000_000, expensesPaid: 1_000_000 }).estimatedIdpc, 125_000);
});

test('honorarios: 16% en 2027 y 17% desde 2028 (Ley 21.133)', () => {
  assert.equal(honorariumFromGross(1_000_000, 2027).retention, 160_000);
  assert.equal(honorariumFromGross(1_000_000, 2028).retention, 170_000);
  assert.equal(honorariumFromGross(1_000_000, 2030).rate, 0.17);
});

test('Pro Pyme: 12,5% en 2027, 15% condicionado en 2028 y pendiente desde 2029', () => {
  assert.equal(idpcProPymeGeneral({ taxableBase: 1_000_000 }, 2027).estimatedIdpc, 125_000);
  const c = idpcProPymeGeneral({ taxableBase: 1_000_000 }, 2028);
  assert.equal(c.status, TAX_STATUS.PENDING);
  assert.equal(c.estimatedIdpc, null);
  assert.equal(c.hypotheticalIdpc, 150_000);
  const p = idpcProPymeGeneral({ taxableBase: 1_000_000 }, 2029);
  assert.equal(p.status, TAX_STATUS.PENDING);
  assert.equal(p.rate, undefined);
  assert.equal(idpcProPyme({ incomeReceived: 5, expensesPaid: 1 }, 2030).estimatedIdpc, null);
});

test('comparación de regímenes: sólo cuantifica la diferencia si ambos son calculables', () => {
  const c27 = compareRegimes({ taxableBase: 100_000_000 }, 2027);
  assert.equal(c27.comparable, true);
  assert.equal(c27.idpcDifference, 25_500_000 - 12_500_000);
  assert.equal(c27.regimes[2].status, TAX_STATUS.NOT_COMPUTABLE);
  const c29 = compareRegimes({ taxableBase: 100_000_000 }, 2029);
  assert.equal(c29.comparable, false);
  assert.equal(c29.idpcDifference, null);
  assert.equal(compareRegimes({ taxableBase: -1 }, 2027).regimes[0].status, TAX_STATUS.INSUFFICIENT);
});

test('datos faltantes dan estado explícito, no cifra', () => {
  assert.equal(idpcRegimen14A({}, 2027).status, TAX_STATUS.INSUFFICIENT);
  assert.equal(idpcRegimen14A({ taxableBase: 'abc' }, 2027).status, TAX_STATUS.INSUFFICIENT);
});

test('PPM y UTM no se reutilizan entre años', () => {
  assert.throws(() => ppmFromSalesNet(1_000_000, 2027), /pendiente de validación/);
  assert.equal(ppmFromSalesNet(1_000_000, 2027, 0.001).ppm, 1000);
  assert.throws(() => municipalPatent({ capital: 10_000_000 }, 2027), /No hay UTM registrada para 2027/);
  assert.equal(municipalPatent({ capital: 10_000_000 }, 2026).utm, 71649);
});

const okQualified = { accountingIncome: true, customsQualified: true, foreignClient: true, usedAbroad: true, knowledgeBased: true, catalogConfirmed: true };

test('crédito por exportación de servicios: 15%, +5 pts fuera de la RM y tope de 75 UTM', () => {
  const r = exportServicesCredit({
    workers: [
      { id: 'a', annualTaxableRemuneration: 20_000_000, workplace: 'RM', residentInChile: true },
      { id: 'b', annualTaxableRemuneration: 20_000_000, workplace: 'regiones', residentInChile: true }
    ],
    exportIncome: 50_000_000, totalIncome: 100_000_000, utm: 70_000, qualified: okQualified
  }, 2027);
  assert.equal(r.status, TAX_STATUS.CALCULATED);
  assert.equal(r.exportShare, 0.5);
  assert.deepEqual(r.perWorker.map(w => w.credit), [1_500_000, 2_000_000]);
  assert.equal(r.credit, 3_500_000);
  const capped = exportServicesCredit({
    workers: [{ annualTaxableRemuneration: 400_000_000, workplace: 'regiones', residentInChile: true }],
    exportIncome: 100, totalIncome: 100, utm: 70_000, qualified: okQualified
  }, 2028);
  assert.equal(capped.perWorker[0].credit, 75 * 70_000);
  assert.equal(capped.perWorker[0].capped, true);
});

test('crédito de exportación: catálogo sin confirmar => pendiente, requisitos incumplidos => no aplica', () => {
  const base = { workers: [{ annualTaxableRemuneration: 10_000_000, workplace: 'RM', residentInChile: true }], exportIncome: 10, totalIncome: 10, utm: 70_000 };
  const pend = exportServicesCredit({ ...base, qualified: { ...okQualified, catalogConfirmed: false } }, 2027);
  assert.equal(pend.status, TAX_STATUS.PENDING);
  assert.equal(pend.credit, null);
  assert.equal(pend.hypotheticalCredit, 1_500_000);
  assert.equal(exportServicesCredit({ ...base, qualified: { ...okQualified, customsQualified: false } }, 2027).status, TAX_STATUS.NOT_APPLICABLE);
  assert.equal(exportServicesCredit({ ...base, qualified: { ...okQualified, accountingIncome: false } }, 2027).status, TAX_STATUS.NOT_APPLICABLE);
  assert.equal(exportServicesCredit({ ...base, totalIncome: 0, qualified: okQualified }, 2027).status, TAX_STATUS.INSUFFICIENT);
  assert.equal(exportServicesCredit({ ...base, qualified: okQualified }, 2026).status, TAX_STATUS.PENDING);
});

test('enfermedades catastróficas: tope total de 150 UTM, requisitos del trabajador y vigencia 2027', () => {
  const w = (extra = {}) => ({ id: 'w', paidByEmployer: 20_000_000, tenureYears: 3, contributionsUpToDate: true, accreditedProvider: true, ...extra });
  const r = catastrophicDiseasesCredit({ regime: '14 A', utm: 70_000, workers: [w({ coveredByThirdParties: 5_000_000 })], diseasesDecreeConfirmed: true }, 2027);
  assert.equal(r.status, TAX_STATUS.CALCULATED);
  assert.equal(r.perWorker[0].eligible, 15_000_000);
  assert.equal(r.perWorker[0].credit, 10_500_000);
  assert.equal(r.perWorker[0].excessDeductibleAsExpense, 4_500_000);
  const used = catastrophicDiseasesCredit({ regime: '14 D N° 3', utm: 70_000, workers: [w({ creditAlreadyUsed: 10_000_000 })], diseasesDecreeConfirmed: true }, 2028);
  assert.equal(used.perWorker[0].credit, 500_000);
  const blocked = catastrophicDiseasesCredit({ regime: '14 A', utm: 70_000, workers: [w({ tenureYears: 1, ownerOrRelative: true })], diseasesDecreeConfirmed: true }, 2027);
  assert.equal(blocked.credit, 0);
  assert.equal(blocked.perWorker[0].blockers.length, 2);
  assert.equal(catastrophicDiseasesCredit({ regime: '14 A', utm: 70_000, workers: [w()] }, 2027).status, TAX_STATUS.PENDING);
  assert.equal(catastrophicDiseasesCredit({ regime: '14 D N° 8', utm: 70_000, workers: [w()], diseasesDecreeConfirmed: true }, 2027).status, TAX_STATUS.NOT_APPLICABLE);
  assert.equal(catastrophicDiseasesCredit({ regime: '14 A', utm: 70_000, workers: [w()], diseasesDecreeConfirmed: true }, 2026).status, TAX_STATUS.NOT_IN_FORCE);
});

test('cada año proyectado declara trazabilidad, vigencia y pendientes de la ley', () => {
  for (const y of [2027, 2028, 2029, 2030]) {
    const r = loadRules(y);
    assert.equal(r.status, 'projected');
    assert.equal(r.ley21850.publicationDate, '2026-10-17');
    assert.equal(r.ley21850.sence.franchiseLimit, 0.007);
    assert.equal(r.ley21850.integrationRestitution.byTaxYear[2030], 0);
    assert.ok(r.ley21850.exportServicesCredit.pending.length > 0);
    assert.ok(r.idpcGeneral14A.source.startsWith('https://www.diariooficial'));
    assert.deepEqual(r.ley21850, loadRules(2027).ley21850, 'el bloque de la ley debe ser idéntico entre años');
  }
});
