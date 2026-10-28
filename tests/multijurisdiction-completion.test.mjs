import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompanyWorkspace } from '../packages/company-operations/workspace.mjs';
import { createMemoryStore } from '../packages/company-operations/store.mjs';
import { normalizeJurisdictionContext } from '../packages/core/jurisdiction-context.mjs';
import { createLifecycleRecord, transitionLifecycle } from '../packages/core/lifecycle.mjs';
import { resolveLegalDueDate } from '../packages/core/legal-calendar.mjs';
import { jurisdictionReadiness } from '../packages/jurisdictions/registry.mjs';
import { loadRules } from '../packages/chile-tax-rules/index.mjs';
import { loadChileRuleWithMetadata } from '../packages/jurisdictions/cl/rule-envelope.mjs';
import { classifyChileMonth, projectCashFlow, assessChileInactivity } from '../packages/jurisdictions/cl/operations.mjs';
import { assessLiquidityRisk, createInsolvencyDossier } from '../packages/jurisdictions/cl/insolvency.mjs';
import { trademarkChecklist } from '../packages/jurisdictions/cl/trademarks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = (mode = 'real') => new CompanyWorkspace({ store: createMemoryStore(), mode });

test('los sobres regulatorios CL conservan exactamente los valores legacy', () => {
  for (const name of ['iva', 'honorarios', 'ppmProPyme', 'idpcProPyme', 'utm', 'municipalPatent', 'taxEquity', 'f29']) {
    const wrapped = loadChileRuleWithMetadata(name, 2026);
    assert.deepEqual(wrapped.value, loadRules(2026)[name]);
    assert.equal(wrapped.metadata.country, 'CL');
    assert.equal(wrapped.metadata.reviewStatus, 'VERIFIED');
    assert.match(wrapped.metadata.sourceUrl, /^https:/);
  }
});

test('país fiscal, constitución, operación, idioma, moneda y zona son dimensiones independientes', () => {
  const context = normalizeJurisdictionContext({ fiscalCountry: 'MX', incorporationCountry: 'CL', residenceCountry: 'ES', operationCountries: ['MX', 'BR'], locale: 'pt-BR', currency: 'USD', timeZone: 'America/Mexico_City', verificationState: 'DOCUMENTARY_ONLY' });
  assert.equal(context.fiscalCountry, 'MX');
  assert.equal(context.locale, 'pt-BR');
  assert.equal(context.currency, 'USD');
  assert.deepEqual(context.operationCountries, ['MX', 'BR']);
});

test('respaldo v4 conserva jurisdicción, ciclo de vida y separación REAL/SANDBOX', () => {
  const real = workspace('real');
  real.saveJurisdictionContext({ fiscalCountry: 'PE', incorporationCountry: 'CL', operationCountries: ['PE'], locale: 'es-ES', currency: 'PEN', timeZone: 'America/Lima', verificationState: 'DOCUMENTARY_ONLY' });
  real.startLifecycle({ state: 'planning', startedAt: '2026-10-27T12:00:00Z', responsible: 'Equipo', evidence: ['nota inicial'] });
  const payload = real.exportAll();
  assert.equal(payload.formatVersion, 4);
  const target = workspace('real');
  target.importAll(payload);
  assert.equal(target.getJurisdictionContext().fiscalCountry, 'PE');
  assert.equal(target.getLifecycle().state, 'planning');
  const sandbox = workspace('sandbox');
  assert.equal(sandbox.getJurisdictionContext().fiscalCountry, 'CL');
  assert.equal(sandbox.getLifecycle(), null);
});

test('respaldos v1, v2 y v3 migran con default Chile sin perder operaciones', () => {
  const base = workspace();
  base.addTransaction({ date: '2026-01-01', kind: 'sale', description: 'Fixture', net: 100, vat: 19, total: 119 });
  const current = base.exportAll();
  for (const version of [1, 2, 3]) {
    const legacy = { ...current, formatVersion: version };
    delete legacy.jurisdictionContext; delete legacy.lifecycle; delete legacy.insolvencyDossier;
    const target = workspace();
    target.importAll(legacy);
    assert.equal(target.listTransactions().length, 1);
    assert.equal(target.getJurisdictionContext().fiscalCountry, 'CL');
  }
});

test('el grafo exige transición autorizada, responsable y evidencia', () => {
  const record = createLifecycleRecord({ state: 'planning', country: 'CL', startedAt: '2026-10-27T12:00:00Z', responsible: 'Equipo', evidence: ['minuta'] });
  assert.throws(() => transitionLifecycle(record, { to: 'operating', at: '2026-10-28T12:00:00Z', responsible: 'Equipo', evidence: ['RUT'] }), /no permitida/);
  assert.throws(() => transitionLifecycle(record, { to: 'incorporated_inactive', at: '2026-10-28T12:00:00Z', responsible: 'Equipo' }), /exige evidencia/);
  const next = transitionLifecycle(record, { to: 'incorporated_inactive', at: '2026-10-28T12:00:00Z', responsible: 'Equipo', evidence: ['certificado RES'] });
  assert.equal(next.history.length, 2);
});

test('SpA sin inicio no recibe declaraciones inventadas', () => {
  const result = classifyChileMonth({ hasTaxStart: false });
  assert.equal(result.state, 'NO_TAX_START');
  assert.equal(result.f29, 'REQUIRES_VERIFICATION');
});

test('cero ventas con compras, honorarios u oficina no es sin movimiento', () => {
  const result = classifyChileMonth({ hasTaxStart: true, salesNet: 0, purchasesNet: 100, honorariaGross: 50, expensesNet: 25 });
  assert.equal(result.state, 'ZERO_SALES_WITH_MOVEMENT');
});

test('mes realmente vacío sigue requiriendo confirmar F29 por perfil', () => {
  const result = classifyChileMonth({ hasTaxStart: true });
  assert.equal(result.state, 'NO_MOVEMENT');
  assert.equal(result.f29, 'REQUIRES_VERIFICATION');
});

test('inicio SII y primera categoría verificados clasifican F29 como obligatorio', () => {
  const result = classifyChileMonth({ hasTaxStart: true, firstCategory: true });
  assert.equal(result.state, 'NO_MOVEMENT');
  assert.equal(result.f29, 'REQUIRED');
});

test('caja proyecta exactamente 6, 12, 24 y 36 meses sin declarar mínimo legal', () => {
  const rows = projectCashFlow({ openingCash: 1000, monthlyIncome: 500, recurringCosts: [{ amount: 200 }], variableMonthlyCosts: 100 });
  assert.deepEqual(rows.map(row => row.months), [6, 12, 24, 36]);
  assert.ok(rows.every(row => row.legalMinimum === false));
  assert.equal(rows[0].closingCash, 2200);
});

test('umbrales de inactividad alertan sin cerrar ni disolver automáticamente', () => {
  for (const input of [{ undeclaredPeriods: 6, monthsWithoutOperations: 6 }, { undeclaredPeriods: 0, monthsWithoutOperations: 36 }]) {
    const result = assessChileInactivity(input);
    assert.equal(result.state, 'LEGAL_THRESHOLD_SIGNAL');
    assert.equal(result.automaticClosure, false);
    assert.equal(result.conclusion, 'REQUIRES_VERIFICATION');
  }
});

test('deuda sin caja produce alerta y nunca concluye quiebra o elegibilidad', () => {
  const result = assessLiquidityRisk({ availableCash: 0, overduePayables: 500, taxDebt: 100 });
  assert.equal(result.level, 'PROFESSIONAL_REVIEW');
  assert.equal(result.eligibility, 'REQUIRES_VERIFICATION');
  assert.equal(result.automaticBankruptcyConclusion, false);
});

test('expediente concursal es local, no firmado y no enviado', () => {
  const dossier = createInsolvencyDossier({ creditors: [{ evidenceRef: 'C-1', amount: 100 }] });
  assert.equal(dossier.submitted, false);
  assert.equal(dossier.signed, false);
  assert.equal(dossier.eligibility, 'REQUIRES_VERIFICATION');
});

test('dominio y constitución nunca se presentan como protección marcaria', () => {
  const result = trademarkChecklist({ sign: 'Ejemplo', domain: 'ejemplo.cl' });
  assert.equal(result.domainProtectsTrademark, false);
  assert.equal(result.renewal.nextDate, null);
});

test('feriado desconocido falla cerrado y no inventa una fecha legal', () => {
  const result = resolveLegalDueDate({ nominalDate: '2026-11-01', country: 'CL', timeZone: 'America/Santiago' });
  assert.equal(result.state, 'REQUIRES_HUMAN_REVIEW');
  assert.equal(result.dueDate, null);
});

test('Brasil exige estado y municipio; Argentina exige provincia antes de orientar registro', () => {
  assert.deepEqual(jurisdictionReadiness({ fiscalCountry: 'BR', subdivisions: {} }).missingSubdivisions, ['state', 'municipality']);
  assert.deepEqual(jurisdictionReadiness({ fiscalCountry: 'AR', subdivisions: {} }).missingSubdivisions, ['province']);
  assert.equal(jurisdictionReadiness({ fiscalCountry: 'BR', subdivisions: { state: 'SP', municipality: 'São Paulo' } }).missingSubdivisions.length, 0);
});

test('la UI expone selector global, recuperación y advertencias jurídicas', () => {
  const app = fs.readFileSync(path.join(root, 'apps/web/src/app.js'), 'utf8');
  const context = fs.readFileSync(path.join(root, 'apps/web/src/views/contexto.js'), 'utf8');
  const continuity = fs.readFileSync(path.join(root, 'apps/web/src/views/continuidad.js'), 'utf8');
  assert.match(app, /jurisdictionBar/);
  for (const field of ['fiscalCountry', 'incorporationCountry', 'residenceCountry', 'operationCountries', 'locale', 'currency', 'timeZone']) assert.match(context, new RegExp(field));
  assert.match(continuity, /REQUIERE VERIFICACIÓN|REQUIRES_VERIFICATION/);
  assert.match(continuity, /Cierre automático:<\/strong> no/);
});

