import { html, raw, fmtCLP, attempt } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { classifyChileMonth, projectCashFlow, assessChileInactivity } from '../core/jurisdictions/cl/operations.mjs';
import { assessLiquidityRisk, createInsolvencyDossier, CHILE_DISTRESS_CONCEPTS, CHILE_INSOLVENCY_PROCEDURES } from '../core/jurisdictions/cl/insolvency.mjs';
import { trademarkChecklist } from '../core/jurisdictions/cl/trademarks.mjs';
import { projectChileObligations, CHILE_CAPITAL_CONCEPTS } from '../core/jurisdictions/cl/obligations.mjs';
import { administratorContinuityChecklist, assessCollaboratorRelationship, assessExpenseBoundary, assessPersonalGuarantee } from '../core/jurisdictions/cl/people-and-contracts.mjs';
import { allowedLifecycleTransitions, LIFECYCLE_STATES } from '../core/core/lifecycle.mjs';

const num = value => Number(value || 0);

export default {
  id: 'continuidad', label: 'Continuidad', title: 'Continuidad y contingencias',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12a8 8 0 1 1 2.3 5.7M4 17v-5h5"/><path d="M12 7v5l3 2"/></svg>',
  render() {
    const w = ws();
    const context = w.getJurisdictionContext();
    if (context.fiscalCountry !== 'CL') return html`<div class="page__head"><h1>Continuidad y contingencias</h1></div><div class="note note--warn"><span class="note__icon">!</span><p>Este módulo operativo sólo está habilitado para Chile. Para ${context.fiscalCountry} la orientación es documental y los cálculos permanecen apagados.</p></div>`;
    const company = w.getCompany() ?? {};
    const plan = company.continuityPlan ?? {};
    const tx = w.listTransactions().filter(row => row.date?.startsWith(state.period));
    const sums = kinds => tx.filter(row => kinds.includes(row.kind)).reduce((sum, row) => sum + num(row.net), 0);
    const month = classifyChileMonth({ hasTaxStart: plan.hasTaxStart === undefined ? null : Boolean(plan.hasTaxStart), firstCategory: plan.firstCategory === undefined ? null : Boolean(plan.firstCategory), salesNet: sums(['sale']), purchasesNet: sums(['purchase']), expensesNet: sums(['expense']), honorariaGross: sums(['honorarium']), otherMovements: sums(['capital', 'shareholder_loan', 'shareholder_loan_repayment', 'owner_withdrawal', 'tax_payment']) });
    const cash = projectCashFlow({ openingCash: num(plan.openingCash), monthlyIncome: num(plan.monthlyIncome), recurringCosts: [{ amount: num(plan.recurringCosts) }], variableMonthlyCosts: num(plan.variableCosts) });
    const inactivity = assessChileInactivity({ undeclaredPeriods: plan.undeclaredPeriods ?? null, monthsWithoutOperations: plan.monthsWithoutOperations ?? null, evidence: plan.inactivityEvidence ? [plan.inactivityEvidence] : [] });
    const liquidity = assessLiquidityRisk({ availableCash: num(plan.openingCash), overduePayables: num(plan.overduePayables), taxDebt: num(plan.taxDebt), socialSecurityDebt: num(plan.socialSecurityDebt), minimumCashPolicy: num(plan.minimumCashPolicy) });
    const trademark = trademarkChecklist(company.trademarkPlan ?? {});
    const projectedObligations = projectChileObligations();
    const administrator = administratorContinuityChecklist();
    const collaborator = assessCollaboratorRelationship();
    const expenseBoundary = assessExpenseBoundary();
    const guarantee = assessPersonalGuarantee();
    const lifecycle = w.getLifecycle();
    const next = lifecycle ? allowedLifecycleTransitions(lifecycle.state) : [];
    return html`
      <div class="page__head"><h1>Continuidad y contingencias</h1><p>Separa caja, inactividad, deuda, insolvencia, reorganización, liquidación, disolución y término tributario. Ninguna alerta presenta solicitudes ni decide elegibilidad.</p></div>
      <div class="journey-bar" aria-label="Guía para cada obligación">
        <span><strong>1 · Qué necesito</strong><small>Hecho y perfil verificados</small></span>
        <span><strong>2 · Dónde ingreso</strong><small>Ruta oficial del país</small></span>
        <span><strong>3 · Costo y periodicidad</strong><small>Sin convertir lo desconocido en cero</small></span>
        <span><strong>4 · Qué comprobante guardo</strong><small>Folio, título o contrato</small></span>
        <span><strong>5 · Qué hago si falla</strong><small>Preservar error y escalar</small></span>
      </div>
      <div class="grid grid--2">
        <div class="card"><div class="card__head"><h2>Actividad de ${state.period}</h2><span class="status status--pending">${month.state}</span></div><p>${month.reason}</p><p class="card__hint">F29: ${month.f29}. F22 y DJ se determinan por perfil, no por cero ventas.</p><a href="${month.source}" target="_blank" rel="noreferrer">Fuente SII</a></div>
        <div class="card"><div class="card__head"><h2>Inactividad</h2><span class="status status--pending">${inactivity.state}</span></div><p>${inactivity.reason}</p><p><strong>Cierre automático:</strong> no.</p><a href="${inactivity.source}" target="_blank" rel="noreferrer">Fuente SII</a></div>
      </div>
      <form class="card" data-plan-form><div class="card__head"><h2>Supuestos de caja y alertas</h2></div>
        <div class="form__row"><label class="field"><span class="field__label">Inicio de actividades SII</span><select name="hasTaxStart"><option value="unknown">No determinado</option><option value="yes" ${plan.hasTaxStart === true ? 'selected' : ''}>Sí, con evidencia</option><option value="no" ${plan.hasTaxStart === false ? 'selected' : ''}>No</option></select></label><label class="field"><span class="field__label">Contribuyente de primera categoría</span><select name="firstCategory"><option value="unknown">No determinado</option><option value="yes" ${plan.firstCategory === true ? 'selected' : ''}>Sí, verificado</option><option value="no" ${plan.firstCategory === false ? 'selected' : ''}>No</option></select></label></div>
        <label class="field"><span class="field__label">Evidencia de inactividad</span><input name="inactivityEvidence" value="${plan.inactivityEvidence ?? ''}" placeholder="Referencia local, sin datos personales"></label>
        <div class="form__row"><label class="field"><span class="field__label">Caja inicial</span><input name="openingCash" type="number" value="${plan.openingCash ?? 0}"></label><label class="field"><span class="field__label">Ingresos mensuales estimados</span><input name="monthlyIncome" type="number" value="${plan.monthlyIncome ?? 0}"></label></div>
        <div class="form__row"><label class="field"><span class="field__label">Costos recurrentes mensuales</span><input name="recurringCosts" type="number" value="${plan.recurringCosts ?? 0}"></label><label class="field"><span class="field__label">Costos variables mensuales</span><input name="variableCosts" type="number" value="${plan.variableCosts ?? 0}"></label></div>
        <div class="form__row"><label class="field"><span class="field__label">Períodos sin declarar</span><input name="undeclaredPeriods" type="number" min="0" value="${plan.undeclaredPeriods ?? ''}"></label><label class="field"><span class="field__label">Meses sin operaciones</span><input name="monthsWithoutOperations" type="number" min="0" value="${plan.monthsWithoutOperations ?? ''}"></label></div>
        <div class="form__row"><label class="field"><span class="field__label">Cuentas vencidas</span><input name="overduePayables" type="number" value="${plan.overduePayables ?? 0}"></label><label class="field"><span class="field__label">Deuda tributaria</span><input name="taxDebt" type="number" value="${plan.taxDebt ?? 0}"></label></div>
        <div class="form__row"><label class="field"><span class="field__label">Deuda previsional</span><input name="socialSecurityDebt" type="number" value="${plan.socialSecurityDebt ?? 0}"></label><label class="field"><span class="field__label">Caja mínima interna</span><input name="minimumCashPolicy" type="number" value="${plan.minimumCashPolicy ?? 0}"><span class="field__hint">Política interna; no se presenta como mínimo legal.</span></label></div>
        <button class="btn btn--primary" type="submit">Guardar supuestos</button>
      </form>
      <div class="card"><div class="card__head"><h2>Proyección 6 / 12 / 24 / 36 meses</h2></div><div class="tablewrap"><table><thead><tr><th>Horizonte</th><th>Caja inicial</th><th>Ingresos</th><th>Costos</th><th>Caja final</th></tr></thead><tbody>${raw(cash.map(row => `<tr><td>${row.months} meses</td><td class="num">${fmtCLP(row.openingCash)}</td><td class="num">${fmtCLP(row.income)}</td><td class="num">${fmtCLP(row.costs)}</td><td class="num">${fmtCLP(row.closingCash)}</td></tr>`).join(''))}</tbody></table></div><p class="card__hint">SIMULACIÓN con supuestos del usuario; no es mínimo legal ni pronóstico garantizado.</p></div>
      <div class="card"><div class="card__head"><h2>Costos y periodicidades</h2><span class="status status--pending">NO DETERMINADO ≠ 0</span></div><div class="tablewrap tablewrap--wide"><table><thead><tr><th>Concepto</th><th>Frecuencia</th><th>Monto</th><th>Condición</th><th>Comprobante</th><th>Si falla</th></tr></thead><tbody>${raw(projectedObligations.map(row => `<tr><td><strong>${row.label}</strong><br><a href="${row.sourceUrl}" target="_blank" rel="noreferrer">Fuente</a></td><td>${row.frequency}</td><td>${row.valueState}</td><td>${row.trigger ?? 'Según contrato o trámite'}</td><td>${row.evidenceRequired}</td><td>${row.failureRecovery}</td></tr>`).join(''))}</tbody></table></div><p class="card__hint">Pago único, mensual, condicional, semestral, anual y cada 10 años se registran como categorías distintas. Una reserva recomendada nunca se presenta como mínimo legal.</p></div>
      <div class="card"><div class="card__head"><h2>Alerta de liquidez</h2><span class="status status--pending">${liquidity.level}</span></div><p>${liquidity.warning}</p><p>Obligaciones vencidas: <strong>${fmtCLP(liquidity.totalDue)}</strong> · Brecha: <strong>${fmtCLP(liquidity.cashGap)}</strong> · Elegibilidad: <strong>${liquidity.eligibility}</strong>.</p><button class="btn" data-dossier>Crear expediente local orientativo</button></div>
      <div class="card"><div class="card__head"><h2>Conceptos que no son equivalentes</h2></div><div class="tablewrap"><table><tbody>${raw(CHILE_DISTRESS_CONCEPTS.map(row => `<tr><td><strong>${row.label}</strong></td><td>No equivale automáticamente a ${row.distinctFrom.join(', ')}</td></tr>`).join(''))}</tbody></table></div></div>
      <div class="card"><div class="card__head"><h2>Procedimientos concursales: orientación, no elegibilidad</h2></div><div class="tablewrap"><table><tbody>${raw(CHILE_INSOLVENCY_PROCEDURES.map(row => `<tr><td><strong>${row.label}</strong></td><td>${row.eligibility}</td><td>${row.forum === 'court' ? 'Exige revisión jurídica/tribunal' : 'Exige revisión profesional'}</td></tr>`).join(''))}</tbody></table></div><p class="card__hint">Una SpA sin trabajadores no queda automáticamente habilitada para reorganización o liquidación simplificada.</p></div>
      <div class="grid grid--2">
        <form class="card" data-trademark-form><div class="card__head"><h2>Marca, nombre y dominio</h2></div><label class="field"><span class="field__label">Signo o marca</span><input name="sign" value="${trademark.sign}"></label><label class="field"><span class="field__label">Dominio</span><input name="domain" value="${trademark.domain}"></label><p>${trademark.warning}</p><p>Renovación: ${trademark.renewal.frequencyYears} años; fecha exacta ${trademark.status === 'PENDING' ? 'NO DETERMINADA' : 'REQUIERE VERIFICACIÓN'}.</p><button class="btn" type="submit">Guardar checklist</button></form>
        <div class="card"><div class="card__head"><h2>Ciclo de vida auditable</h2></div>${lifecycle ? raw(`<p>Estado: <strong>${LIFECYCLE_STATES[lifecycle.state].label}</strong></p><p>Verificación: ${lifecycle.verificationState}</p><form data-lifecycle-form><label class="field"><span class="field__label">Transición</span><select name="to">${next.map(id => `<option value="${id}">${LIFECYCLE_STATES[id].label}</option>`).join('')}</select></label><label class="field"><span class="field__label">Responsable</span><input name="responsible" required></label><label class="field"><span class="field__label">Evidencia o evidencia faltante</span><input name="evidence" required></label><button class="btn" type="submit">Registrar transición</button></form>`) : raw(`<form data-lifecycle-start><p>Aún no se inició el historial.</p><label class="field"><span class="field__label">Responsable</span><input name="responsible" required></label><label class="field"><span class="field__label">Evidencia o nota inicial</span><input name="evidence" required></label><button class="btn" type="submit">Iniciar en planificación</button></form>`)}</div>
      </div>
      <div class="grid grid--2">
        <div class="card"><div class="card__head"><h2>Administrador y sucesión</h2><span class="status status--pending">${administrator.state}</span></div><p>${administrator.warning}</p><ul>${raw(administrator.checklist.map(step => `<li>${step}</li>`).join(''))}</ul></div>
        <div class="card"><div class="card__head"><h2>Colaboradores y contratos</h2><span class="status status--pending">${collaborator.classification}</span></div><p>${collaborator.warning}</p><p>${collaborator.ipWarning}</p></div>
        <div class="card"><div class="card__head"><h2>Gasto personal o empresarial</h2><span class="status status--pending">${expenseBoundary.boundary}</span></div><p>${expenseBoundary.warning}</p><p>Deducibilidad tributaria: <strong>${expenseBoundary.taxDeductibility}</strong>.</p></div>
        <div class="card"><div class="card__head"><h2>Responsabilidad y garantías</h2><span class="status status--pending">${guarantee.state}</span></div><p>${guarantee.warning}</p><p>Responsabilidad limitada absoluta: <strong>no</strong>.</p></div>
      </div>
      <div class="card"><div class="card__head"><h2>Capital, depósito, desembolso y gasto</h2></div><div class="tablewrap"><table><tbody>${raw(CHILE_CAPITAL_CONCEPTS.map(row => `<tr><td><strong>${row.label}</strong></td><td>${row.description}</td></tr>`).join(''))}</tbody></table></div></div>`;
  },
  mount(root, rerender) {
    root.querySelector('[data-plan-form]')?.addEventListener('submit', async event => {
      event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
      const plan = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, key === 'inactivityEvidence' ? value : value === '' ? null : num(value)]));
      plan.hasTaxStart = data.hasTaxStart === 'unknown' ? undefined : data.hasTaxStart === 'yes';
      plan.firstCategory = data.firstCategory === 'unknown' ? undefined : data.firstCategory === 'yes';
      const saved = await attempt(() => ws().saveCompany({ continuityPlan: plan }), 'Supuestos guardados.'); if (saved) rerender();
    });
    root.querySelector('[data-dossier]')?.addEventListener('click', async () => { const saved = await attempt(() => ws().saveInsolvencyDossier(createInsolvencyDossier()), 'Expediente orientativo creado sin envío ni firma.'); if (saved) rerender(); });
    root.querySelector('[data-trademark-form]')?.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const saved = await attempt(() => ws().saveCompany({ trademarkPlan: data }), 'Checklist de marca guardado.'); if (saved) rerender(); });
    root.querySelector('[data-lifecycle-start]')?.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const saved = await attempt(() => ws().startLifecycle({ state: 'planning', startedAt: new Date().toISOString(), responsible: data.responsible, evidence: [data.evidence] }), 'Ciclo de vida iniciado.'); if (saved) rerender(); });
    root.querySelector('[data-lifecycle-form]')?.addEventListener('submit', async event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const saved = await attempt(() => ws().advanceLifecycle({ to: data.to, at: new Date().toISOString(), responsible: data.responsible, evidence: [data.evidence] }), 'Transición registrada.'); if (saved) rerender(); });
  }
};
