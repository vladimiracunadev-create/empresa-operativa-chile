import { html, raw, esc, fmtNumber, fmtDateTime, openModal, attempt } from '../lib/dom.js';
import { ws } from '../lib/state.js';
import { GOVERNANCE_ROLES, PROCESS_STEPS, CONTROL_NATURES, CONTROL_EXECUTIONS } from '../core/company-operations/governance.mjs';

const options = (items, selected = '') => raw(items.map(item => {
  const value = Array.isArray(item) ? item[0] : item;
  const label = Array.isArray(item) ? item[1] : item;
  return `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
}).join(''));

const nextStep = process => PROCESS_STEPS[PROCESS_STEPS.findIndex(step => step.id === process.status) + 1] ?? null;

const processForm = () => html`
  <div class="form__row"><label class="field"><span class="field__label">Tipo de operación</span><input name="type" required placeholder="Transferencia, pago, ajuste, acceso privilegiado"></label>
  <label class="field"><span class="field__label">Categoría</span><select name="category">${options([['general', 'Operación general'], ['banking', 'Banco / tesorería'], ['payment', 'Medio de pago'], ['inventory', 'Inventario'], ['marketplace', 'Marketplace / e-commerce'], ['digital_custody', 'Custodia de activos digitales'], ['privileged_action', 'Acción tecnológica privilegiada']])}</select></label></div>
  <div class="form__row"><label class="field"><span class="field__label">Solicitante</span><input name="requester" required placeholder="Identidad o cargo nominativo"></label>
  <label class="field"><span class="field__label">Función</span><select name="requesterRole">${options(PROCESS_STEPS[0].roles)}</select></label></div>
  <div class="form__row"><label class="field"><span class="field__label">Valor</span><input type="number" min="0" step="any" name="value" required></label>
  <label class="field"><span class="field__label">Moneda / unidad</span><input name="currency" value="CLP" required></label></div>
  <div class="form__row"><label class="field"><span class="field__label">Contraparte</span><input name="counterparty" placeholder="Banco, proveedor, exchange o cliente"></label>
  <label class="field"><span class="field__label">Libro auxiliar</span><input name="subsidiaryLedger" placeholder="Banco, clientes, inventario, wallets"></label></div>
  <label class="field"><span class="field__label">Activo (si aplica)</span><input name="asset" placeholder="CLP, USD, BTC, unidades de inventario"></label>
  <label class="field"><span class="field__label">Evidencia de solicitud</span><input name="evidence" required placeholder="Ticket, orden, hash, documento o ubicación preservada"><span class="field__hint">Cada etapa posterior exigirá otra evidencia independiente.</span></label>`;

const transitionForm = step => html`
  <div class="note note--info"><span class="note__icon">${PROCESS_STEPS.findIndex(s => s.id === step.id) + 1}</span><p>Siguiente etapa obligatoria: <strong>${step.label}</strong>.</p></div>
  <div class="form__row"><label class="field"><span class="field__label">Actor</span><input name="actor" required placeholder="Persona identificable"></label>
  <label class="field"><span class="field__label">Función</span><select name="role">${options(step.roles)}</select></label></div>
  <label class="field"><span class="field__label">Evidencia</span><input name="evidence" required placeholder="Referencia inmutable o ubicación del soporte"></label>`;

const controlForm = () => html`
  <label class="field"><span class="field__label">Control</span><input name="name" required placeholder="Doble aprobación sobre umbral"></label>
  <label class="field"><span class="field__label">Objetivo</span><input name="objective" required placeholder="Qué riesgo reduce o detecta"></label>
  <div class="form__row"><label class="field"><span class="field__label">Clasificación</span><select name="nature">${options(CONTROL_NATURES)}</select></label><label class="field"><span class="field__label">Ejecución</span><select name="execution">${options(CONTROL_EXECUTIONS)}</select></label></div>
  <div class="form__row"><label class="field"><span class="field__label">Dueño</span><select name="owner">${options(GOVERNANCE_ROLES)}</select></label><label class="field"><span class="field__label">Cada cuántos días</span><input type="number" min="1" name="frequencyDays" value="30" required></label></div>
  <label class="field"><span class="field__label">Estado</span><select name="status">${options([['effective', 'Efectivo'], ['failed', 'Fallido'], ['remediation', 'En remediación']])}</select></label>
  <label class="field"><span class="field__label">Evidencia esperada</span><input name="evidence" required placeholder="Reporte firmado, log, conciliación o ticket"></label>`;

const riskForm = () => html`
  <label class="field"><span class="field__label">Riesgo</span><input name="risk" required placeholder="Una pérdida o anomalía podría permanecer invisible"></label>
  <div class="form__row"><label class="field"><span class="field__label">Probabilidad (1–5)</span><input type="number" min="1" max="5" name="probability" value="3" required></label><label class="field"><span class="field__label">Impacto (1–5)</span><input type="number" min="1" max="5" name="impact" value="3" required></label></div>
  <div class="form__row"><label class="field"><span class="field__label">Dueño</span><select name="owner">${options(GOVERNANCE_ROLES)}</select></label><label class="field"><span class="field__label">Estado</span><select name="status">${options(['open', 'monitoring', 'treated', 'accepted', 'closed'])}</select></label></div>
  <label class="field"><span class="field__label">Control asociado</span><input name="control" required></label><label class="field"><span class="field__label">Riesgo residual</span><input name="residualRisk" required placeholder="Qué puede fallar aun con el control"></label><label class="field"><span class="field__label">KRI</span><input name="kri" required placeholder="Indicador, umbral y fuente"></label>`;

const concernForm = () => html`<label class="field"><span class="field__label">Reportante</span><input name="reporter" placeholder="Vacío = anonymous"></label><label class="field"><span class="field__label">Hecho reportado</span><textarea name="description" required></textarea></label><label class="field"><span class="field__label">Preservación de evidencia</span><input name="evidence" required placeholder="Ubicación, hash, custodio y fecha"></label>`;
const investigationForm = () => html`<label class="field"><span class="field__label">Estado</span><select name="status">${options([['triage', 'Triage'], ['investigation', 'Investigación'], ['escalated', 'Escalado'], ['resolved', 'Resuelto']], 'investigation')}</select></label><label class="field"><span class="field__label">Investigador independiente</span><input name="investigator" required></label><label class="field"><span class="field__label">Conflicto de interés</span><select name="conflictOfInterest">${options([['false', 'No identificado'], ['true', 'Sí, declarado y gestionado']])}</select></label><label class="field"><span class="field__label">Escalamiento / decisión</span><input name="escalation" placeholder="Comité, Board, Compliance, autoridad"></label>`;
const scheduleLabels = { dailyReconciliation: 'Conciliación diaria', weeklyReview: 'Revisión semanal', monthlyClose: 'Cierre mensual', quarterlyControlReview: 'Revisión trimestral de controles', annualExternalReview: 'Revisión externa anual' };

export default {
  id: 'control-interno', label: 'Control interno', title: 'Gobernanza y control interno',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 4v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4z"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
  badge: () => Object.values(ws().getKris()).reduce((sum, value) => sum + value, 0),

  render() {
    const w = ws();
    const governance = w.getGovernanceModel();
    const processes = w.listCriticalProcesses().slice().reverse();
    const controls = w.listControls();
    const risks = w.listRisks();
    const concerns = w.listWhistleblowingReports().slice().reverse();
    const kris = w.getKris();
    const kriLabels = { unreconciledTransactions: 'Sin conciliar', unapprovedTransfers: 'Sin aprobación', privilegedActions: 'Acciones privilegiadas', staleReconciliations: 'Conciliaciones antiguas', unknownCounterparties: 'Contrapartes desconocidas', failedControls: 'Controles fallidos' };

    return html`
      <div class="page__head"><div class="page__title"><h1>Gobernanza y control interno</h1><span class="tag tag--ok">SoD activo</span></div><p>Diseña una operación donde ninguna falla técnica, financiera o humana dependa de una sola persona para ser descubierta.</p></div>
      <div class="grid governance-kpis">${raw(Object.entries(kris).map(([key, value]) => `<div class="kpi ${value ? 'kpi--err' : 'kpi--ok'}"><div class="kpi__label">${esc(kriLabels[key])}</div><div class="kpi__value">${value}</div><div class="kpi__foot">KRI observable</div></div>`).join(''))}</div>
      <div class="card"><div class="card__head"><div><h2>Motor de procesos críticos</h2><p class="card__hint">Solicitud → Validación → Aprobación → Ejecución → Registro → Conciliación → Auditoría</p></div><button class="btn btn--primary" data-add-process>+ Solicitar operación</button></div>
        <div class="tablewrap tablewrap--wide"><table><thead><tr><th>Proceso</th><th>Valor</th><th>Estado</th><th>Responsables</th><th>Evidencia</th><th></th></tr></thead><tbody>
        ${processes.length ? raw(processes.map(p => { const next = nextStep(p); return html`<tr><td><strong>${p.type}</strong><br><code>${p.process_id}</code><br><span class="card__hint">${p.category} · ${p.counterparty || 'contraparte pendiente'} · ${p.subsidiaryLedger || 'sin libro auxiliar'}</span></td><td>${fmtNumber(p.value)} <span class="card__hint">${p.currency}</span></td><td><span class="tag ${p.status === 'audited' ? 'tag--ok' : 'tag--warn'}">${PROCESS_STEPS.find(s => s.id === p.status)?.label || p.status}</span></td><td><span class="card__hint">Solicita:</span> ${p.requester}<br><span class="card__hint">Aprueba:</span> ${p.approver || '—'}<br><span class="card__hint">Ejecuta:</span> ${p.executor || '—'}</td><td>${p.evidence.length} hito(s)<br><span class="card__hint">${p.evidence.at(-1).reference} · ${fmtDateTime(p.updatedAt)}</span></td><td>${next ? raw(`<button class="btn btn--sm" data-advance="${esc(p.process_id)}">${esc(next.label)} →</button>`) : raw('<span class="tag tag--ok">completo</span>')}</td></tr>`; }).join('')) : raw('<tr><td colspan="6" class="table__empty">Aún no hay procesos críticos. Registra una operación para activar el circuito de evidencia y segregación.</td></tr>')}
        </tbody></table></div><div class="note note--info" style="margin-top:14px"><span class="note__icon">i</span><p>Para custodia digital usa la categoría correspondiente y registra cliente, depósito, custodio, wallet/exchange y libro auxiliar en las referencias. El flujo y los controles son los mismos para bancos, fintech, e-commerce, marketplaces, pagos e inventario.</p></div></div>
      <div class="grid grid--2"><div class="card"><div class="card__head"><h2>Catálogo de controles</h2><button class="btn btn--sm" data-add-control>+ Control</button></div>${controls.length ? raw(controls.map(c => `<div class="control-row"><div><strong>${esc(c.name)}</strong><br><span class="card__hint">${esc(c.objective)}</span></div><div><span class="tag">${esc(c.nature)}</span> <span class="tag">${esc(c.execution)}</span> <span class="tag ${c.status === 'failed' ? 'tag--err' : 'tag--ok'}">${esc(c.status)}</span><br><span class="card__hint">${esc(c.owner)} · cada ${c.frequencyDays} día(s) · ${esc(c.evidence)}</span></div></div>`).join('')) : raw('<p class="card__hint">Clasifica cada control como preventivo, detectivo o correctivo; y como manual, automatizado o híbrido.</p>')}</div>
        <div class="card"><div class="card__head"><h2>Risk register</h2><button class="btn btn--sm" data-add-risk>+ Riesgo</button></div>${risks.length ? raw(risks.map(r => `<div class="control-row"><div><strong>${esc(r.risk)}</strong><br><span class="card__hint">${esc(r.owner)} · ${esc(r.status)}</span></div><div><span class="tag ${r.probability * r.impact >= 15 ? 'tag--err' : 'tag--warn'}">P×I ${r.probability * r.impact}</span><br><span class="card__hint">Control: ${esc(r.control)} · Residual: ${esc(r.residualRisk)} · KRI: ${esc(r.kri)}</span></div></div>`).join('')) : raw('<p class="card__hint">Registra probabilidad, impacto, dueño, control, riesgo residual, KRI y estado.</p>')}</div></div>
      <div class="card"><div class="card__head"><div><h2>RACI de gobernanza</h2><p class="card__hint">R = Responsible · A = Accountable · C = Consulted · I = Informed</p></div></div><div class="tablewrap tablewrap--wide"><table><thead><tr><th>Actividad</th><th>R</th><th>A</th><th>C</th><th>I</th></tr></thead><tbody>${raw(governance.raci.map(row => `<tr><td><strong>${esc(row.activity)}</strong></td><td>${esc(row.responsible.join(', '))}</td><td>${esc(row.accountable.join(', '))}</td><td>${esc(row.consulted.join(', '))}</td><td>${esc(row.informed.join(', '))}</td></tr>`).join(''))}</tbody></table></div></div>
      <div class="grid grid--2"><div class="card"><div class="card__head"><h2>Auditoría continua</h2></div><form data-schedule>${raw(Object.entries(governance.auditSchedule).map(([key, days]) => `<label class="field"><span class="field__label">${esc(scheduleLabels[key])}</span><input type="number" min="1" name="${esc(key)}" value="${days}" required><span class="field__hint">Frecuencia configurable en días.</span></label>`).join(''))}<button class="btn btn--primary" type="submit">Guardar frecuencias</button></form></div>
        <div class="card"><div class="card__head"><h2>Whistleblowing y escalamiento</h2><button class="btn btn--sm" data-add-concern>+ Reportar</button></div>${concerns.length ? raw(concerns.map(c => `<div class="control-row"><div><strong>${esc(c.description)}</strong><br><span class="card__hint">Evidencia: ${esc(c.evidence)} · Reportante: ${esc(c.reporter)}</span></div><div><span class="tag ${c.status === 'resolved' ? 'tag--ok' : 'tag--warn'}">${esc(c.status)}</span><br>${c.status !== 'resolved' ? `<button class="btn btn--ghost btn--sm" data-investigate="${esc(c.id)}">Triage / investigar</button>` : ''}</div></div>`).join('')) : raw('<p class="card__hint">El canal preserva evidencia, exige independencia, declara conflictos y documenta el escalamiento.</p>')}</div></div>
      <div class="note note--warn"><span class="note__icon">!</span><p><strong>Libro auxiliar y conciliación no reemplazan criterio profesional.</strong> Esta capa ordena evidencia y detecta diferencias; el reconocimiento, medición, presentación y revelación contable deben ser revisados por una persona competente.</p></div>`;
  },

  mount(root, rerender) {
    const w = ws();
    const save = async (fn, message) => { const result = await attempt(fn, message); if (!result) return false; rerender(); return true; };
    root.querySelector('[data-add-process]')?.addEventListener('click', () => openModal({ title: 'Solicitar operación crítica', body: processForm(), wide: true, submitLabel: 'Crear proceso', onSubmit: data => save(() => w.addCriticalProcess(data), 'Proceso crítico creado con evidencia') }));
    root.querySelectorAll('[data-advance]').forEach(button => button.addEventListener('click', () => { const process = w.listCriticalProcesses().find(row => row.process_id === button.dataset.advance); const step = process && nextStep(process); if (!step) return; openModal({ title: `${step.label}: ${process.type}`, body: transitionForm(step), submitLabel: 'Registrar etapa', onSubmit: data => save(() => w.advanceCriticalProcess(process.process_id, { ...data, step: step.id }), `${step.label} registrada`) }); }));
    root.querySelector('[data-add-control]')?.addEventListener('click', () => openModal({ title: 'Nuevo control', body: controlForm(), submitLabel: 'Registrar control', onSubmit: data => save(() => w.addControl(data), 'Control registrado') }));
    root.querySelector('[data-add-risk]')?.addEventListener('click', () => openModal({ title: 'Nuevo riesgo', body: riskForm(), submitLabel: 'Registrar riesgo', onSubmit: data => save(() => w.addRisk(data), 'Riesgo registrado') }));
    root.querySelector('[data-add-concern]')?.addEventListener('click', () => openModal({ title: 'Reportar preocupación', body: concernForm(), submitLabel: 'Preservar reporte', onSubmit: data => save(() => w.reportConcern(data), 'Reporte preservado') }));
    root.querySelectorAll('[data-investigate]').forEach(button => button.addEventListener('click', () => openModal({ title: 'Triage, investigación y escalamiento', body: investigationForm(), submitLabel: 'Actualizar caso', onSubmit: data => save(() => w.updateConcern(button.dataset.investigate, { ...data, conflictOfInterest: data.conflictOfInterest === 'true' }), 'Caso actualizado') })));
    root.querySelector('[data-schedule]')?.addEventListener('submit', async event => { event.preventDefault(); await save(() => w.saveAuditSchedule(Object.fromEntries(new FormData(event.target))), 'Frecuencias de auditoría guardadas'); });
  }
};
