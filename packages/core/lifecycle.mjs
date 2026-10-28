/** Grafo auditable del ciclo de vida. No diagnostica consecuencias legales. */

export const LIFECYCLE_STATES = Object.freeze({
  planning: { label: 'Empresa en planificación', risk: 'educational' },
  incorporated_inactive: { label: 'Constituida sin actividad', risk: 'pending' },
  active_no_clients: { label: 'Activa sin clientes ni ingresos', risk: 'accountant' },
  operating: { label: 'Operando', risk: 'educational' },
  liquidity_alert: { label: 'Alerta de liquidez', risk: 'accountant' },
  voluntary_negotiation: { label: 'Negociación voluntaria', risk: 'lawyer' },
  recovery: { label: 'Recuperación', risk: 'accountant' },
  extrajudicial_restructuring: { label: 'Reestructuración extrajudicial', risk: 'lawyer' },
  judicial_restructuring: { label: 'Reestructuración judicial', risk: 'lawyer' },
  insolvency_reorganization: { label: 'Reorganización concursal', risk: 'stopped' },
  insolvency_liquidation: { label: 'Liquidación concursal', risk: 'stopped' },
  dissolution: { label: 'Disolución societaria', risk: 'lawyer' },
  tax_termination: { label: 'Término tributario', risk: 'accountant' },
  temporarily_suspended: { label: 'Suspensión temporal', risk: 'lawyer' },
  administrator_contingency: { label: 'Cambio, incapacidad o fallecimiento de administrador', risk: 'lawyer' }
});

const GRAPH = Object.freeze({
  planning: ['incorporated_inactive'],
  incorporated_inactive: ['active_no_clients', 'operating', 'dissolution', 'administrator_contingency'],
  active_no_clients: ['operating', 'liquidity_alert', 'temporarily_suspended', 'dissolution', 'administrator_contingency'],
  operating: ['active_no_clients', 'liquidity_alert', 'temporarily_suspended', 'dissolution', 'administrator_contingency'],
  liquidity_alert: ['voluntary_negotiation', 'recovery', 'extrajudicial_restructuring', 'judicial_restructuring', 'insolvency_reorganization', 'insolvency_liquidation'],
  voluntary_negotiation: ['recovery', 'extrajudicial_restructuring', 'judicial_restructuring', 'insolvency_reorganization', 'insolvency_liquidation'],
  recovery: ['operating', 'active_no_clients', 'liquidity_alert'],
  extrajudicial_restructuring: ['recovery', 'judicial_restructuring', 'insolvency_reorganization', 'insolvency_liquidation'],
  judicial_restructuring: ['recovery', 'insolvency_reorganization', 'insolvency_liquidation'],
  insolvency_reorganization: ['recovery', 'insolvency_liquidation', 'dissolution'],
  insolvency_liquidation: ['dissolution'],
  dissolution: ['tax_termination'],
  tax_termination: [],
  temporarily_suspended: ['active_no_clients', 'operating', 'dissolution'],
  administrator_contingency: ['incorporated_inactive', 'active_no_clients', 'operating', 'liquidity_alert']
});

export function allowedLifecycleTransitions(state) {
  if (!(state in LIFECYCLE_STATES)) throw new Error(`Estado de ciclo de vida no soportado: ${state}`);
  return [...GRAPH[state]];
}

const text = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} es obligatorio`);
};

export function createLifecycleRecord({ state = 'planning', country = 'CL', subdivision = null, startedAt, responsible, evidence = [], sources = [], obligations = [], warnings = [], entryConditions = [], exitConditions = [] }) {
  if (!(state in LIFECYCLE_STATES)) throw new Error(`Estado de ciclo de vida no soportado: ${state}`);
  if (!/^[A-Z]{2}$/.test(country)) throw new Error('country debe ser ISO 3166-1 alfa-2');
  text(startedAt, 'startedAt');
  text(responsible, 'responsible');
  for (const [value, field] of [[evidence, 'evidence'], [sources, 'sources'], [obligations, 'obligations'], [warnings, 'warnings'], [entryConditions, 'entryConditions'], [exitConditions, 'exitConditions']]) {
    if (!Array.isArray(value)) throw new Error(`${field} debe ser una lista`);
  }
  return {
    state, country, subdivision, startedAt, responsible,
    obligations: [...obligations], evidence: [...evidence], sources: [...sources],
    entryConditions: [...entryConditions], exitConditions: [...exitConditions], warnings: [...warnings],
    verificationState: LIFECYCLE_STATES[state].risk === 'educational' ? 'DOCUMENTARY_ONLY' : 'REQUIRES_VERIFICATION',
    history: [{ state, at: startedAt, responsible, evidence: [...evidence] }],
    recoverableFailure: null
  };
}

export function transitionLifecycle(record, { to, at, responsible, evidence = [], sources = [], obligations = [], warnings = [], entryConditions = [], exitConditions = [], recoverableFailure = null }) {
  if (!record || typeof record !== 'object') throw new Error('Se requiere el estado actual');
  if (!allowedLifecycleTransitions(record.state).includes(to)) throw new Error(`Transición no permitida: ${record.state} → ${to}`);
  text(at, 'at');
  text(responsible, 'responsible');
  if (!Array.isArray(evidence) || evidence.length === 0) throw new Error('La transición exige evidencia o una referencia a evidencia faltante');
  const next = createLifecycleRecord({ state: to, country: record.country, subdivision: record.subdivision, startedAt: at, responsible, evidence, sources, obligations, warnings, entryConditions, exitConditions });
  return { ...next, history: [...(record.history ?? []), { state: to, at, responsible, evidence: [...evidence] }], recoverableFailure };
}

