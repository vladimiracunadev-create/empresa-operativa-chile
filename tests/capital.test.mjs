/**
 * Capital societario: las cinco magnitudes que no son sinónimos.
 *
 * El caso que estos tests protegen no es aritmético sino conceptual: que
 * `capitalEnterado` no vuelva a usarse como si fuera el patrimonio, el CPT o la
 * base de la patente, y que un préstamo del accionista no se cuele como capital.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanyWorkspace, seedSandboxWorkspace } from '../packages/company-operations/workspace.mjs';
import { createMemoryStore } from '../packages/company-operations/store.mjs';
import {
  normalizeCapitalProfile,
  validateCapitalProfile,
  capitalPendingToPay,
  summarizeEquityMovements,
  normalizeEquityMovement,
  PENDING_CONFIRMATION
} from '../packages/company-operations/capital.mjs';

const ws = (mode = 'real') => new CompanyWorkspace({ store: createMemoryStore(), mode });

/* ------------------------------------------------------------ migración -- */

test('el capital antiguo migra a capital enterado sin inventar los demás', () => {
  const profile = normalizeCapitalProfile({ capital: 1000000 });
  assert.equal(profile.capitalEnterado, 1000000);
  assert.equal(profile.capitalSocial, null, 'el capital social no se puede deducir del enterado');
  assert.equal(profile.capitalSuscrito, null);
  assert.deepEqual(profile.pendingConfirmation, ['capitalSocial', 'capitalSuscrito']);
  assert.equal(profile.migratedFromLegacyCapital, true);
});

test('una ficha ya migrada no vuelve a marcarse como pendiente', () => {
  const first = normalizeCapitalProfile({ capital: 500000 });
  const confirmed = normalizeCapitalProfile({ capitalProfile: { ...first, capitalSocial: 500000, capitalSuscrito: 500000, pendingConfirmation: [] } });
  assert.deepEqual(confirmed.pendingConfirmation, []);
  assert.equal(confirmed.capitalSocial, 500000);
});

test('leer una ficha antigua no reescribe el almacén', () => {
  const w = ws();
  w.saveCompany({ legalName: 'Antigua SpA', capital: 750000 });
  const before = JSON.stringify(w.getCompany());
  w.getCapitalProfile();
  w.capitalPosition();
  assert.equal(JSON.stringify(w.getCompany()), before, 'la migración en lectura no puede tocar los datos guardados');
});

test('PENDING_CONFIRMATION es la marca declarada, no un texto suelto', () => {
  assert.equal(PENDING_CONFIRMATION, 'PENDING_CONFIRMATION');
});

/* ---------------------------------------------------------- validación --- */

test('el capital enterado no puede superar al suscrito', () => {
  const check = validateCapitalProfile({ capitalSocial: 1000000, capitalSuscrito: 500000, capitalEnterado: 800000 });
  assert.equal(check.valid, false);
  assert.match(check.errors.join(' '), /supera al suscrito/);
});

test('el capital suscrito no puede superar al social', () => {
  const check = validateCapitalProfile({ capitalSocial: 500000, capitalSuscrito: 900000, capitalEnterado: 0 });
  assert.equal(check.valid, false);
  assert.match(check.errors.join(' '), /no puede superar al capital social/);
});

test('el capital negativo se rechaza', () => {
  assert.equal(validateCapitalProfile({ capitalEnterado: -1 }).valid, false);
});

test('el inicio de actividades no puede preceder a la constitución', () => {
  const check = validateCapitalProfile({ capitalEnterado: 0, fechaConstitucion: '2026-07-01', fechaInicioActividades: '2026-06-01' });
  assert.equal(check.valid, false);
  assert.match(check.errors.join(' '), /anterior a la fecha de constitución/);
});

test('capital por enterar devuelve null —no cero— si no se conoce lo suscrito', () => {
  assert.equal(capitalPendingToPay({ capitalSuscrito: null, capitalEnterado: 100 }), null);
  assert.equal(capitalPendingToPay({ capitalSuscrito: 1000, capitalEnterado: 400 }), 600);
});

/* ---------------------------------------------------------- movimientos -- */

test('un movimiento sin fecha se rechaza', () => {
  assert.throws(() => normalizeEquityMovement({ kind: 'initial_contribution', amount: 1000 }), /fecha/);
});

test('un aporte en bienes exige describir el bien y al aportante', () => {
  assert.throws(
    () => normalizeEquityMovement({ kind: 'asset_contribution', date: '2026-07-01', amount: 900000 }),
    /describir el bien/
  );
  assert.throws(
    () => normalizeEquityMovement({ kind: 'asset_contribution', date: '2026-07-01', amount: 900000, assetDescription: 'Notebook' }),
    /accionista aportante/
  );
});

test('préstamo del accionista NO es aporte de capital', () => {
  const resumen = summarizeEquityMovements([
    { kind: 'initial_contribution', date: '2026-07-01', amount: 1000000 },
    { kind: 'shareholder_loan', date: '2026-08-01', amount: 2000000 }
  ]);
  assert.equal(resumen.capitalEnteradoPorMovimientos, 1000000, 'el préstamo no puede sumar capital');
  assert.equal(resumen.deudaConAccionista, 2000000);
});

test('la devolución del préstamo cancela la deuda y no toca el capital', () => {
  const resumen = summarizeEquityMovements([
    { kind: 'shareholder_loan', date: '2026-08-01', amount: 2000000 },
    { kind: 'shareholder_loan_repayment', date: '2026-11-01', amount: 800000 }
  ]);
  assert.equal(resumen.deudaConAccionista, 1200000);
  assert.equal(resumen.capitalEnteradoPorMovimientos, 0);
});

test('el corte por fecha excluye los movimientos posteriores', () => {
  const movimientos = [
    { kind: 'initial_contribution', date: '2026-07-01', amount: 1000000 },
    { kind: 'additional_contribution', date: '2027-03-01', amount: 500000 }
  ];
  assert.equal(summarizeEquityMovements(movimientos, { until: '2026-12-31' }).capitalEnteradoPorMovimientos, 1000000);
  assert.equal(summarizeEquityMovements(movimientos).capitalEnteradoPorMovimientos, 1500000);
});

/* ------------------------------------------------------------ workspace -- */

test('registrar un movimiento con caja no cuenta el aporte dos veces', () => {
  const w = ws();
  w.saveCapitalProfile({ capitalSocial: 5000000, capitalSuscrito: 5000000, capitalEnterado: 0, fechaConstitucion: '2026-01-10' });
  w.addEquityMovement({ kind: 'initial_contribution', date: '2026-02-01', amount: 2000000, evidenceRef: 'Cartola' }, { registerCashMovement: true });

  const position = w.capitalPosition();
  assert.equal(position.capitalEnterado, 2000000, 'el mismo aporte no puede sumar por el ledger y por la operación');
  assert.equal(position.capitalPorEnterar, 3000000);
  assert.equal(w.listTransactions().length, 1);
  assert.equal(w.listTransactions()[0].equityMovementId, w.listEquityMovements()[0].id);
});

test('un aporte registrado sólo como operación antigua igual cuenta como capital', () => {
  const w = ws();
  w.addTransaction({ date: '2026-03-01', kind: 'capital', description: 'Aporte', net: 400000, vat: 0, total: 400000 });
  assert.equal(w.capitalPosition().capitalEnterado, 400000);
});

test('un préstamo registrado como operación no sube el capital enterado', () => {
  const w = ws();
  w.addTransaction({ date: '2026-03-01', kind: 'capital', description: 'Aporte', net: 400000, vat: 0, total: 400000 });
  w.addTransaction({ date: '2026-04-01', kind: 'shareholder_loan', description: 'Mutuo', net: 1000000, vat: 0, total: 1000000 });

  const position = w.capitalPosition();
  assert.equal(position.capitalEnterado, 400000);
  assert.equal(position.deudaConAccionista, 1000000);
});

test('el sandbox de referencia distingue las cinco magnitudes', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  const position = w.capitalPosition();
  const balance = w.estimatedBalance(2026);
  const cpt = w.taxEquityFor(2026);
  const patente = w.municipalPatentFor(2026);

  assert.equal(position.capitalSocial, 3000000);
  assert.equal(position.capitalEnterado, 2400000);
  assert.equal(position.capitalPorEnterar, 600000);
  assert.equal(position.deudaConAccionista, 500000);

  const distintos = new Set([position.capitalSocial, position.capitalEnterado, balance.accountingEquity, cpt.calculatedCPT, patente.baseCapital]);
  assert.equal(distintos.size, 5, 'las cinco magnitudes del caso de referencia tienen que ser cinco números distintos');
});

test('el préstamo del accionista aparece como pasivo y baja el patrimonio', () => {
  const w = seedSandboxWorkspace(ws('sandbox'));
  const balance = w.estimatedBalance(2026);
  assert.equal(balance.liabilities, 500000);
  assert.equal(balance.accountingEquity, balance.assets - 500000);
});
