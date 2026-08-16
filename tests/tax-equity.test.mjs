/**
 * Capital Propio Tributario.
 *
 * Lo que se protege aquí: que la fórmula simplificada no se aplique a quien no
 * califica, que el resultado nunca sea sólo un número, y que un CPT calculado
 * con datos incompletos lo diga en vez de parecer definitivo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTaxEquity, allowsSimplifiedTaxEquity } from '../packages/accounting-engine/tax-equity.mjs';
import { CompanyWorkspace, seedSandboxWorkspace } from '../packages/company-operations/workspace.mjs';
import { createMemoryStore } from '../packages/company-operations/store.mjs';

const ws = (mode = 'real') => new CompanyWorkspace({ store: createMemoryStore(), mode });

const PRO_PYME = 'Pro Pyme General (14 D N.º 3)';

/* ---------------------------------------------------------- elegibilidad - */

test('sólo el Pro Pyme General determina el CPT simplificado', () => {
  assert.equal(allowsSimplifiedTaxEquity(PRO_PYME), true);
  assert.equal(allowsSimplifiedTaxEquity('Pro Pyme Transparente (14 D N.º 8)'), false);
  assert.equal(allowsSimplifiedTaxEquity('Régimen General semi integrado (14 A)'), false);
  assert.equal(allowsSimplifiedTaxEquity(''), false);
});

test('un régimen que no califica cae al método general del art. 41', () => {
  const r = calculateTaxEquity({ fiscalYear: 2026, taxRegime: 'Régimen General semi integrado (14 A)', assets: 5000000, liabilities: 1000000 });
  assert.equal(r.calculationMethod, 'article41');
  assert.match(r.legalBasis, /art\. 41/);
});

test('forzar el método simplificado en quien no califica advierte en vez de callar', () => {
  const r = calculateTaxEquity({
    fiscalYear: 2026,
    taxRegime: 'Pro Pyme Transparente (14 D N.º 8)',
    method: 'simplified14D3j',
    equityMovements: { capitalEnteradoPorMovimientos: 1000000 },
    operations: { taxableBase: 500000 }
  });
  assert.match(r.warnings.join(' '), /no corresponde al que permite el capital propio tributario simplificado/);
});

/* -------------------------------------------------------------- art. 41 -- */

test('CPT del art. 41: activo menos pasivo exigible', () => {
  const r = calculateTaxEquity({ fiscalYear: 2026, taxRegime: 'Régimen General semi integrado (14 A)', assets: 8000000, liabilities: 3000000 });
  assert.equal(r.calculatedCPT, 5000000);
  assert.equal(r.taxAssets, 8000000);
  assert.equal(r.eligibleLiabilities, 3000000);
});

test('los valores sin inversión efectiva se rebajan antes', () => {
  const r = calculateTaxEquity({
    fiscalYear: 2026,
    taxRegime: 'Régimen General semi integrado (14 A)',
    assets: 8000000,
    liabilities: 3000000,
    nonEffectiveValues: 1200000
  });
  assert.equal(r.calculatedCPT, 3800000);
});

test('faltar activos o pasivos produce advertencia explícita', () => {
  const r = calculateTaxEquity({ fiscalYear: 2026, taxRegime: 'Régimen General semi integrado (14 A)', assets: 8000000 });
  assert.equal(r.complete, false);
  assert.match(r.warnings.join(' '), /información incompleta/);
});

/* ------------------------------------------- art. 14 D) N.º 3 letra (j) -- */

test('CPT simplificado suma capital y bases imponibles, resta retiros y pérdidas', () => {
  const r = calculateTaxEquity({
    fiscalYear: 2026,
    taxRegime: PRO_PYME,
    equityMovements: { capitalEnteradoPorMovimientos: 2000000, disminucionesDeCapital: 100000, retiros: 300000 },
    operations: { taxableBase: 1500000, losses: 0, participationIncome: 200000, article21Paid: 50000 }
  });
  assert.equal(r.calculationMethod, 'simplified14D3j');
  // 2.000.000 + 1.500.000 + 200.000 − 100.000 − 50.000 − 300.000
  assert.equal(r.calculatedCPT, 3250000);
});

test('un CPT simplificado negativo se lleva a cero, como manda la letra (j)', () => {
  const r = calculateTaxEquity({
    fiscalYear: 2026,
    taxRegime: PRO_PYME,
    equityMovements: { capitalEnteradoPorMovimientos: 500000 },
    operations: { taxableBase: 0, losses: 2000000 }
  });
  assert.equal(r.rawCPT, -1500000);
  assert.equal(r.calculatedCPT, 0);
  assert.equal(r.flooredAtZero, true);
  assert.match(r.warnings.join(' '), /\$0/);
});

test('CPT cero exacto no se marca como truncado', () => {
  const r = calculateTaxEquity({
    fiscalYear: 2026,
    taxRegime: PRO_PYME,
    equityMovements: { capitalEnteradoPorMovimientos: 1000000 },
    operations: { taxableBase: 0, losses: 1000000 }
  });
  assert.equal(r.calculatedCPT, 0);
  assert.equal(r.flooredAtZero, false);
});

/* --------------------------------------------------------- explicabilidad */

test('el resultado nunca es sólo un número', () => {
  const r = calculateTaxEquity({
    fiscalYear: 2026,
    taxRegime: PRO_PYME,
    equityMovements: { capitalEnteradoPorMovimientos: 1000000 },
    operations: { taxableBase: 500000 }
  });
  for (const field of ['calculatedCPT', 'calculationMethod', 'legalBasis', 'formula', 'breakdown', 'warnings', 'evidence', 'assumptions', 'status']) {
    assert.ok(r[field] !== undefined, `falta ${field} en el resultado del CPT`);
  }
  assert.ok(r.breakdown.length > 0);
  assert.ok(r.evidence.some(e => e.kind === 'legal' && e.ref));
  assert.equal(r.status, 'ESTIMADO', 'un CPT calculado internamente jamás puede presentarse como confirmado');
});

test('un año sin reglas verificadas falla en vez de degradar', () => {
  assert.throws(() => calculateTaxEquity({ fiscalYear: 2031, taxRegime: PRO_PYME }), /No hay reglas verificadas/);
});

test('exige el año comercial', () => {
  assert.throws(() => calculateTaxEquity({ taxRegime: PRO_PYME }), /fiscalYear/);
});

/* ------------------------------------------------------- ciclo completo -- */

test('el cierre anual congela el CPT y produce la base del período siguiente', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  const close = w.closeFiscalYear(2026);

  assert.equal(close.fiscalYear, 2026);
  assert.equal(close.CPT, close.taxEquity.calculatedCPT);
  assert.equal(close.municipalPatentBaseForNextPeriod.period, 2027);
  assert.equal(close.municipalPatentBaseForNextPeriod.baseCapital, close.CPT);
  assert.equal(close.legalRulesVersion.commercialYear, 2026, 'el cierre guarda la versión de las reglas, no sólo el resultado');
  assert.ok(close.legalRulesVersion.municipalPatent.maxUtm);
});

test('un ejercicio cerrado no se cierra dos veces', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  w.closeFiscalYear(2026);
  assert.throws(() => w.closeFiscalYear(2026), /ya está cerrado/);
});

test('reabrir un ejercicio exige motivo y deja rastro', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  w.closeFiscalYear(2026);
  assert.throws(() => w.reopenFiscalYear(2026, '   '), /motivo/);
  w.reopenFiscalYear(2026, 'Llegó una factura de diciembre');
  assert.equal(w.getAnnualClose(2026), null);
  assert.ok(w.listAudit().some(a => a.action === 'fiscal-year.reopened' && a.detail.reason));
});

test('el CPT del año 2 parte del cierre del año 1 y no del capital de constitución', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  const close = w.closeFiscalYear(2026);
  const capital = w.capitalPosition();
  assert.notEqual(close.CPT, capital.capitalEnterado, 'si coincidieran, el modelo habría vuelto a fundir las dos magnitudes');
  assert.equal(w.taxEquityFor(2026, {}).openingCPT, null);
});

test('el importe de un respaldo no puede pisar un ejercicio ya cerrado', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  const close = w.closeFiscalYear(2026);
  const backup = w.exportAll();
  backup.annualCloses = [{ ...close, CPT: 999999999 }];
  w.importAll(backup, { replace: false });
  assert.equal(w.getAnnualClose(2026).CPT, close.CPT);
});
