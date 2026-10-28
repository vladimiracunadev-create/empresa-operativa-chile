import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CompanyWorkspace } from '../packages/company-operations/workspace.mjs';
import { createMemoryStore } from '../packages/company-operations/store.mjs';
import { assessCrossBorderReadiness, normalizeJurisdictionContext } from '../packages/core/jurisdiction-context.mjs';
import { createLifecycleRecord, transitionLifecycle } from '../packages/core/lifecycle.mjs';
import { resolveLegalDueDate } from '../packages/core/legal-calendar.mjs';
import { projectObligationCost, VALUE_STATES } from '../packages/core/obligations.mjs';
import { explainLegalCalculation, proposeRuleRevision, resolveRegulatoryRuleSet } from '../packages/core/regulatory-rules.mjs';
import { formatPlural, getContextualGlossary, getStructuredMessages } from '../packages/i18n/locales/index.mjs';
import { jurisdictionReadiness } from '../packages/jurisdictions/registry.mjs';
import { loadRules } from '../packages/chile-tax-rules/index.mjs';
import { loadChileRuleWithMetadata } from '../packages/jurisdictions/cl/rule-envelope.mjs';
import { classifyChileMonth, projectCashFlow, assessChileInactivity } from '../packages/jurisdictions/cl/operations.mjs';
import { assessLiquidityRisk, createInsolvencyDossier, reviewInsolvencyProcedure } from '../packages/jurisdictions/cl/insolvency.mjs';
import { trademarkChecklist } from '../packages/jurisdictions/cl/trademarks.mjs';
import { CHILE_OBLIGATION_CATALOG, projectChileObligations } from '../packages/jurisdictions/cl/obligations.mjs';
import { administratorContinuityChecklist, assessCollaboratorRelationship, assessExpenseBoundary, assessPersonalGuarantee } from '../packages/jurisdictions/cl/people-and-contracts.mjs';

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

test('múltiples países no permiten adivinar moneda ni zonas horarias', () => {
  const context = normalizeJurisdictionContext({ operationCountries: ['CL', 'PE'], currency: 'USD' });
  const unresolved = assessCrossBorderReadiness(context);
  assert.equal(unresolved.state, 'REQUIRES_VERIFICATION');
  assert.deepEqual(unresolved.missingTimeZones, ['CL', 'PE']);
  const ready = assessCrossBorderReadiness(context, { currencyEvidence: 'contrato local', operationTimeZones: { CL: 'America/Santiago', PE: 'America/Lima' } });
  assert.equal(ready.state, 'READY_FOR_DOCUMENTARY_GUIDANCE');
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

test('SpA sin inicio y 12 meses sin clientes conserva F29, F22 y DJ sin determinar', () => {
  const month = classifyChileMonth({ hasTaxStart: false });
  const inactivity = assessChileInactivity({ undeclaredPeriods: 0, monthsWithoutOperations: 12, evidence: ['cartola local'] });
  assert.equal(month.f29, 'REQUIRES_VERIFICATION');
  assert.equal(inactivity.automaticClosure, false);
  assert.deepEqual(projectChileObligations().filter(row => ['cl.f22', 'cl.dj'].includes(row.id)).map(row => row.valueState), ['NO_DETERMINADO', 'NO_DETERMINADO']);
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

test('patente anual y cuenta bancaria mensual se mantienen como frecuencias y costos distintos', () => {
  const rows = projectChileObligations({
    'cl.patent': { amount: 120000, currency: 'CLP', evidenceRef: 'PAT-LOCAL' },
    'cl.bank.account': { amount: 15000, currency: 'CLP' }
  });
  const patent = rows.find(row => row.id === 'cl.patent');
  const bank = rows.find(row => row.id === 'cl.bank.account');
  assert.equal(patent.frequency, 'SEMIANNUAL');
  assert.equal(patent.valueState, 'EVIDENCIA');
  assert.equal(bank.frequency, 'MONTHLY');
  assert.equal(bank.reserveIsLegalMinimum, false);
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

test('sin trabajadores nunca prueba elegibilidad para reorganización simplificada', () => {
  const review = reviewInsolvencyProcedure({ procedureId: 'simplified-reorganization', hasWorkers: false });
  assert.equal(review.eligibility, 'REQUIRES_VERIFICATION');
  assert.equal(review.automatic, false);
  assert.match(review.warning, /no prueba elegibilidad/i);
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

test('vigencia vencida y conflicto normativo fallan cerrado', () => {
  const base = loadChileRuleWithMetadata('iva', 2026).metadata;
  assert.throws(() => resolveRegulatoryRuleSet([base], { country: 'CL', effectiveTaxYear: 2026, onDate: '2027-01-01' }), /REQUIRES_HUMAN_REVIEW/);
  assert.throws(() => resolveRegulatoryRuleSet([base, { ...base, ruleVersion: `${base.ruleVersion}.conflict` }], { country: 'CL', effectiveTaxYear: 2026, onDate: '2026-06-01' }), /DISPUTED/);
});

test('revisión normativa crea propuesta DRAFT, diff auditable e historia inmutable', () => {
  const previous = loadChileRuleWithMetadata('iva', 2026).metadata;
  const result = proposeRuleRevision(previous, { scope: 'Propuesta acotada' }, { proposedVersion: `${previous.ruleVersion}.proposal`, proposedAt: '2026-10-28' });
  assert.equal(result.proposal.reviewStatus, 'DRAFT');
  assert.equal(result.proposal.supersedes, previous.ruleVersion);
  assert.deepEqual(result.changedFields, ['scope']);
  assert.notEqual(result.previous, previous);
  assert.equal(previous.scope === 'Propuesta acotada', false);
});

test('cada cálculo explicable expone fórmula, inputs, fuente, vigencia y advertencia', () => {
  const rule = loadChileRuleWithMetadata('iva', 2026).metadata;
  const explanation = explainLegalCalculation({ rule, formula: 'neto × tasa', inputs: { net: 100 }, result: 19 }, { country: 'CL', effectiveTaxYear: 2026, onDate: '2026-06-01' });
  assert.equal(explanation.ruleVersion, rule.ruleVersion);
  assert.deepEqual(explanation.inputs, { net: 100 });
  assert.match(explanation.source.url, /^https:/);
  assert.match(explanation.warnings.at(-1), /portal oficial/);
});

test('estados semánticos, costos y reservas no confunden desconocido con cero', () => {
  assert.deepEqual(VALUE_STATES, ['NO_DETERMINADO', 'NO_APLICA', 'SIN_MOVIMIENTO', 'SIMULACION', 'EVIDENCIA']);
  const row = projectObligationCost(CHILE_OBLIGATION_CATALOG[0]);
  assert.equal(row.amount, null);
  assert.equal(row.valueState, 'NO_DETERMINADO');
  assert.equal(row.reserveIsLegalMinimum, false);
  assert.equal(row.automaticPayment, false);
});

test('i18n aporta pluralización y glosario jurídico contextual sin cambiar jurisdicción', () => {
  assert.equal(formatPlural(2, { locale: 'pt-BR', one: '{count} obrigação', other: '{count} obrigações' }), '2 obrigações');
  assert.match(getContextualGlossary('es-MX').taxAuthority, /SAT/);
  assert.match(getContextualGlossary('pt-BR').businessIdentifier, /CNPJ/);
  assert.match(getStructuredMessages('en').errors.missingEvidence, /Requires verification/);
});

test('administrador, colaboradores, gastos y garantías permanecen orientativos', () => {
  assert.equal(administratorContinuityChecklist({ event: 'death' }).rightsAdjudicated, false);
  assert.equal(assessCollaboratorRelationship({ fixedSchedule: true }).classification, 'NO_DETERMINADO');
  assert.equal(assessExpenseBoundary({ businessPurpose: true, personalBenefit: false }).taxDeductibility, 'REQUIRES_VERIFICATION');
  assert.equal(assessPersonalGuarantee({ hasPersonalGuarantee: true }).limitedLiabilityIsAbsolute, false);
});

test('respaldo chileno v1.5 preserva operaciones, cierres, comprobantes, auditoría y aislamiento', () => {
  const source = workspace('real');
  source.saveCompany({ legalName: 'Fixture sin datos reales' });
  source.addTransaction({ date: '2026-01-01', kind: 'sale', description: 'Fixture', net: 100, vat: 19, total: 119 });
  source.upsertObligation({ id: 'F29-2026-01', type: 'F29', period: '2026-01', dueDate: '2026-02-20', status: 'done', evidenceRef: 'FOLIO-FICTICIO' });
  source.closePeriod('2026-01');
  const legacy = { ...source.exportAll(), formatVersion: 2 };
  delete legacy.jurisdictionContext; delete legacy.lifecycle; delete legacy.insolvencyDossier;
  const target = workspace('real');
  target.importAll(legacy);
  assert.equal(target.listTransactions().length, 1);
  assert.equal(target.listObligations()[0].evidenceRef, 'FOLIO-FICTICIO');
  assert.equal(target.isPeriodClosed('2026-01'), true);
  assert.ok(target.listAudit().length > 0);
  const sandbox = workspace('sandbox');
  assert.equal(sandbox.listTransactions().length, 0);
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
  for (const label of ['Qué necesito', 'Dónde ingreso', 'Costo y periodicidad', 'Qué comprobante guardo', 'Qué hago si falla']) assert.match(continuity, new RegExp(label));
  assert.match(continuity, /NO DETERMINADO ≠ 0/);
});

