/**
 * Gobierno, control interno y segregación de funciones.
 *
 * Es lógica de dominio sin dependencias de plataforma: las mismas reglas se
 * aplican en Web, Android, Windows, CLI y pruebas. No reemplaza el juicio de
 * auditoría ni el criterio contable; hace visibles las incompatibilidades y
 * conserva la evidencia que permite revisarlas.
 */

export const GOVERNANCE_ROLES = Object.freeze([
  'Board',
  'Management',
  'Finance',
  'Accounting',
  'Treasury',
  'Technology',
  'Security',
  'Compliance',
  'Internal Audit',
  'External Audit'
]);

export const PROCESS_STEPS = Object.freeze([
  { id: 'requested', label: 'Solicitud', action: 'request', roles: ['Management', 'Finance', 'Treasury', 'Technology'] },
  { id: 'validated', label: 'Validación', action: 'validate', roles: ['Finance', 'Security', 'Compliance'] },
  { id: 'approved', label: 'Aprobación', action: 'approve', roles: ['Board', 'Management'] },
  { id: 'executed', label: 'Ejecución', action: 'execute', roles: ['Treasury', 'Technology'] },
  { id: 'recorded', label: 'Registro', action: 'record', roles: ['Accounting'] },
  { id: 'reconciled', label: 'Conciliación', action: 'reconcile', roles: ['Finance'] },
  { id: 'audited', label: 'Auditoría', action: 'audit', roles: ['Internal Audit', 'External Audit'] }
]);

/** RACI mínimo para una operación crítica. */
export const DEFAULT_RACI = Object.freeze([
  { activity: 'Definir apetito de riesgo y supervisar', responsible: ['Management'], accountable: ['Board'], consulted: ['Compliance', 'Internal Audit'], informed: ['External Audit'] },
  { activity: 'Solicitar y validar la operación', responsible: ['Finance'], accountable: ['Management'], consulted: ['Treasury', 'Compliance', 'Security'], informed: ['Accounting'] },
  { activity: 'Aprobar la operación', responsible: ['Management'], accountable: ['Board'], consulted: ['Finance', 'Compliance'], informed: ['Treasury', 'Accounting'] },
  { activity: 'Ejecutar la operación', responsible: ['Treasury', 'Technology'], accountable: ['Management'], consulted: ['Security'], informed: ['Finance', 'Accounting'] },
  { activity: 'Registrar en libro auxiliar', responsible: ['Accounting'], accountable: ['Finance'], consulted: ['Treasury'], informed: ['Management'] },
  { activity: 'Conciliar y resolver diferencias', responsible: ['Finance'], accountable: ['Management'], consulted: ['Accounting', 'Technology'], informed: ['Internal Audit'] },
  { activity: 'Auditar el diseño y la evidencia', responsible: ['Internal Audit'], accountable: ['Board'], consulted: ['Compliance', 'External Audit'], informed: ['Management'] },
  { activity: 'Emitir opinión independiente', responsible: ['External Audit'], accountable: ['Board'], consulted: ['Internal Audit'], informed: ['Management'] }
]);

export const CONTROL_NATURES = Object.freeze(['Preventive', 'Detective', 'Corrective']);
export const CONTROL_EXECUTIONS = Object.freeze(['Manual', 'Automated', 'Hybrid']);

export const DEFAULT_AUDIT_SCHEDULE = Object.freeze({
  dailyReconciliation: 1,
  weeklyReview: 7,
  monthlyClose: 30,
  quarterlyControlReview: 90,
  annualExternalReview: 365
});

export const RISK_STATUSES = Object.freeze(['open', 'monitoring', 'treated', 'accepted', 'closed']);
export const CONTROL_STATUSES = Object.freeze(['effective', 'failed', 'remediation']);
export const WHISTLE_STATUSES = Object.freeze(['reported', 'triage', 'investigation', 'escalated', 'resolved']);

const requiredText = (value, label) => {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label} es obligatorio`);
  return text;
};

export function normalizeControl(control) {
  const nature = requiredText(control.nature, 'La naturaleza del control');
  const execution = requiredText(control.execution, 'La ejecución del control');
  if (!CONTROL_NATURES.includes(nature)) throw new Error(`Naturaleza de control no soportada: ${nature}`);
  if (!CONTROL_EXECUTIONS.includes(execution)) throw new Error(`Ejecución de control no soportada: ${execution}`);
  return {
    name: requiredText(control.name, 'El nombre del control'),
    objective: requiredText(control.objective, 'El objetivo del control'),
    owner: requiredText(control.owner, 'El dueño del control'),
    nature,
    execution,
    frequencyDays: Math.max(1, Number(control.frequencyDays || 1)),
    evidence: requiredText(control.evidence, 'La evidencia esperada'),
    status: CONTROL_STATUSES.includes(control.status) ? control.status : 'effective'
  };
}

export function normalizeRisk(risk) {
  const probability = Number(risk.probability);
  const impact = Number(risk.impact);
  if (!Number.isFinite(probability) || probability < 1 || probability > 5) throw new Error('La probabilidad debe estar entre 1 y 5');
  if (!Number.isFinite(impact) || impact < 1 || impact > 5) throw new Error('El impacto debe estar entre 1 y 5');
  return {
    risk: requiredText(risk.risk, 'El riesgo'),
    probability,
    impact,
    owner: requiredText(risk.owner, 'El dueño del riesgo'),
    control: requiredText(risk.control, 'El control asociado'),
    residualRisk: requiredText(risk.residualRisk, 'El riesgo residual'),
    kri: requiredText(risk.kri, 'El KRI'),
    status: RISK_STATUSES.includes(risk.status) ? risk.status : 'open'
  };
}

export function createCriticalProcess(input, { id, now }) {
  const requester = requiredText(input.requester, 'El solicitante');
  const requesterRole = requiredText(input.requesterRole, 'La función del solicitante');
  const first = PROCESS_STEPS[0];
  if (!first.roles.includes(requesterRole)) throw new Error(`${requesterRole} no puede solicitar esta operación`);
  const evidence = requiredText(input.evidence, 'La evidencia de la solicitud');
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) throw new Error('El valor debe ser un número mayor o igual a cero');
  const timestamp = now;
  return {
    process_id: id,
    type: requiredText(input.type, 'El tipo de operación'),
    requester,
    requesterRole,
    approver: null,
    executor: null,
    recorder: null,
    reconciler: null,
    auditor: null,
    value,
    currency: String(input.currency || 'CLP').trim().toUpperCase(),
    timestamp,
    evidence: [{ step: first.id, actor: requester, role: requesterRole, reference: evidence, at: timestamp }],
    status: first.id,
    counterparty: String(input.counterparty || '').trim(),
    subsidiaryLedger: String(input.subsidiaryLedger || '').trim(),
    asset: String(input.asset || '').trim(),
    category: String(input.category || 'general').trim(),
    updatedAt: timestamp
  };
}

const actorFor = (process, step) => process.evidence.find(row => row.step === step)?.actor;

export function advanceCriticalProcess(process, transition, now) {
  const current = PROCESS_STEPS.findIndex(step => step.id === process.status);
  const next = PROCESS_STEPS[current + 1];
  if (!next) throw new Error('El proceso ya está auditado');
  if (transition.step && transition.step !== next.id) throw new Error(`La próxima etapa obligatoria es ${next.label}`);

  const actor = requiredText(transition.actor, 'El actor');
  const role = requiredText(transition.role, 'La función');
  const evidence = requiredText(transition.evidence, 'La evidencia');
  if (!next.roles.includes(role)) throw new Error(`${role} no puede realizar ${next.label.toLowerCase()}`);

  const incompatible = {
    validated: ['requested'],
    approved: ['requested', 'validated'],
    executed: ['requested', 'approved'],
    recorded: ['approved', 'executed'],
    reconciled: ['executed', 'recorded'],
    audited: ['requested', 'validated', 'approved', 'executed', 'recorded', 'reconciled']
  }[next.id] ?? [];
  const conflict = incompatible.find(step => actorFor(process, step) === actor);
  if (conflict) throw new Error(`Conflicto SoD: ${actor} ya intervino en ${PROCESS_STEPS.find(s => s.id === conflict).label}`);

  const field = { approved: 'approver', executed: 'executor', recorded: 'recorder', reconciled: 'reconciler', audited: 'auditor' }[next.id];
  return {
    ...process,
    ...(field ? { [field]: actor } : {}),
    status: next.id,
    evidence: [...process.evidence, { step: next.id, actor, role, reference: evidence, at: now }],
    updatedAt: now
  };
}

export function processKris(processes, controls, { now = new Date(), staleDays = 7 } = {}) {
  const staleLimit = now.getTime() - staleDays * 86400000;
  const afterExecution = p => ['executed', 'recorded', 'reconciled', 'audited'].includes(p.status);
  return {
    unreconciledTransactions: processes.filter(p => afterExecution(p) && !['reconciled', 'audited'].includes(p.status)).length,
    unapprovedTransfers: processes.filter(p => afterExecution(p) && !p.approver).length,
    privilegedActions: processes.filter(p => p.category === 'privileged_action' && p.status !== 'audited').length,
    staleReconciliations: processes.filter(p => p.status === 'reconciled' && new Date(p.updatedAt).getTime() < staleLimit).length,
    unknownCounterparties: processes.filter(p => afterExecution(p) && !p.counterparty).length,
    failedControls: controls.filter(c => c.status === 'failed').length
  };
}

export function validateAuditSchedule(schedule) {
  return Object.fromEntries(Object.entries(DEFAULT_AUDIT_SCHEDULE).map(([key, fallback]) => {
    const value = Number(schedule?.[key] ?? fallback);
    if (!Number.isInteger(value) || value < 1) throw new Error('Las frecuencias deben expresarse en días enteros positivos');
    return [key, value];
  }));
}
