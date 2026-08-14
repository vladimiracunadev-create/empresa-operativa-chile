import test from 'node:test';
import assert from 'node:assert/strict';
import { CompanyWorkspace, seedSandboxWorkspace } from '../packages/company-operations/workspace.mjs';
import { createMemoryStore, createWebStore } from '../packages/company-operations/store.mjs';

const ws = (mode = 'real') => new CompanyWorkspace({ store: createMemoryStore(), mode });

/** localStorage mínimo para probar el almacén del navegador sin navegador. */
const fakeLocalStorage = () => {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    get size() {
      return map.size;
    }
  };
};

test('un período cerrado es inmutable en las dos direcciones', () => {
  const w = ws();
  const tx = w.addTransaction({ date: '2026-08-02', kind: 'sale', description: 'Venta', net: 100000, vat: 19000, total: 119000 });
  w.closePeriod('2026-08', { bank: true });
  assert.throws(() => w.addTransaction({ date: '2026-08-09', kind: 'sale', description: 'Tardía', net: 1, vat: 0, total: 1 }), /cerrado/);
  assert.throws(() => w.deleteTransaction(tx.id), /cerrado/);
  assert.throws(() => w.updateTransaction(tx.id, { net: 999 }), /cerrado/);
});

test('reabrir un período exige motivo y queda en la bitácora', () => {
  const w = ws();
  w.addTransaction({ date: '2026-08-02', kind: 'sale', description: 'Venta', net: 100000, vat: 19000, total: 119000 });
  w.closePeriod('2026-08');
  assert.throws(() => w.reopenPeriod('2026-08', '   '), /motivo/);
  w.reopenPeriod('2026-08', 'Llegó una factura de proveedor atrasada');
  assert.equal(w.isPeriodClosed('2026-08'), false);
  const evento = w.listAudit().find(a => a.action === 'period.reopened');
  assert.match(evento.detail.reason, /atrasada/);
});

test('el remanente de crédito fiscal viaja entre períodos', () => {
  const w = ws();
  // Julio: compra grande, venta chica → sobra crédito.
  w.addTransaction({ date: '2026-07-10', kind: 'expense', description: 'Equipo', net: 900000, vat: 171000, total: 1071000 });
  w.addTransaction({ date: '2026-07-18', kind: 'sale', description: 'Servicio', net: 400000, vat: 76000, total: 476000 });
  // Agosto: venta grande, sin compras.
  w.addTransaction({ date: '2026-08-05', kind: 'sale', description: 'Servicio', net: 800000, vat: 152000, total: 952000 });

  assert.equal(w.vatCarryForwardInto('2026-07'), 0);
  assert.equal(w.vatCarryForwardInto('2026-08'), 95000);
});

test('un paso de constitución no puede darse por hecho sin evidencia', () => {
  const w = ws();
  assert.throws(() => w.updateFormationStep({ id: 'start', status: 'done' }), /evidencia/i);
  w.updateFormationStep({ id: 'start', status: 'done', evidenceRef: 'Comprobante 998877' });
  assert.equal(w.listFormationSteps().find(s => s.id === 'start').status, 'done');
  assert.equal(w.formationProgress().done, 1);
});

test('una obligación no puede marcarse cumplida sin comprobante', () => {
  const w = ws();
  assert.throws(() => w.upsertObligation({ type: 'F29', period: '2026-08', status: 'done' }), /comprobante/i);
  const ok = w.upsertObligation({ type: 'F29', period: '2026-08', status: 'done', evidenceRef: 'Folio 123' });
  assert.equal(ok.status, 'done');
});

test('el catálogo de pasos se amplía sin perder lo ya registrado', () => {
  const w = ws();
  w.updateFormationStep({ id: 'res', status: 'done', evidenceRef: 'CERT-1' });
  const steps = w.listFormationSteps();
  assert.equal(steps.length, 9);
  assert.equal(steps.find(s => s.id === 'res').evidenceRef, 'CERT-1');
  assert.equal(steps.find(s => s.id === 'bank').status, 'pending');
});

test('exportar e importar reproduce el espacio de trabajo completo', () => {
  const origen = ws();
  origen.saveCompany({ legalName: 'Ejemplo SpA', rut: '77.111.222-3' });
  origen.addTransaction({ date: '2026-08-02', kind: 'sale', description: 'Venta', net: 100000, vat: 19000, total: 119000 });
  origen.closePeriod('2026-08');

  const destino = ws();
  destino.importAll(origen.exportAll());

  assert.equal(destino.getCompany().legalName, 'Ejemplo SpA');
  assert.equal(destino.listTransactions().length, 1);
  assert.equal(destino.isPeriodClosed('2026-08'), true);
});

test('importar un archivo ajeno se rechaza', () => {
  const w = ws();
  assert.throws(() => w.importAll({ format: 'otra-app', formatVersion: 1 }), /respaldo válido/);
  assert.throws(() => w.importAll({ format: 'empresa-operativa-chile/backup', formatVersion: 99 }), /no soportada/);
});

test('el almacén web aísla real de sandbox en el mismo origen', () => {
  const storage = fakeLocalStorage();
  const real = new CompanyWorkspace({ store: createWebStore({ namespace: 'eoc:real', storage }), mode: 'real' });
  const sandbox = new CompanyWorkspace({ store: createWebStore({ namespace: 'eoc:sandbox', storage }), mode: 'sandbox' });

  real.addTransaction({ date: '2026-08-01', kind: 'sale', description: 'Real', net: 100, vat: 19, total: 119 });
  seedSandboxWorkspace(sandbox);

  assert.equal(real.listTransactions().length, 1);
  assert.ok(sandbox.listTransactions().length > 1);
  assert.equal(sandbox.listTransactions().some(t => t.description === 'Real'), false);
  assert.equal(real.getCompany(), null);
});

test('el sandbox sembrado deja un remanente visible y un IVA no recuperable', () => {
  const sandbox = seedSandboxWorkspace(ws('sandbox'));
  assert.equal(sandbox.vatCarryForwardInto('2026-08'), 95000);
  assert.ok(sandbox.periodSummary('2026-08').rejectedVat > 0);
});

test('sembrar el sandbox sobre una empresa real está prohibido', () => {
  assert.throws(() => seedSandboxWorkspace(ws('real')), /sandbox/);
});

test('el diagnóstico marca error cuando hay obligaciones vencidas', () => {
  const w = ws();
  w.saveCompany({ legalName: 'Ejemplo SpA', rut: '77.111.222-3' });
  w.upsertObligation({ type: 'F29', period: '2020-01', dueDate: '2020-02-20', status: 'pending' });
  const health = w.healthCheck('2026-08');
  assert.equal(health.level, 'error');
  assert.ok(health.issues.some(i => i.code === 'obligations.overdue'));
});

test('toda mutación queda en la bitácora append-only', () => {
  const w = ws();
  w.saveCompany({ legalName: 'Ejemplo SpA' });
  const tx = w.addTransaction({ date: '2026-08-02', kind: 'sale', description: 'Venta', net: 1000, vat: 190, total: 1190 });
  w.deleteTransaction(tx.id);
  const acciones = w.listAudit().map(a => a.action);
  assert.deepEqual(acciones, ['company.saved', 'transaction.added', 'transaction.deleted']);
  assert.ok(w.listAudit().every(a => a.mode === 'real' && a.at));
});

test('los tipos de operación no soportados se rechazan', () => {
  const w = ws();
  assert.throws(() => w.addTransaction({ date: '2026-08-01', kind: 'criptomoneda', net: 1, vat: 0, total: 1 }), /kind no soportado/);
  assert.throws(() => w.addTransaction({ date: '01-08-2026', kind: 'sale', net: 1, vat: 0, total: 1 }), /YYYY-MM-DD/);
});
