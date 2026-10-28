export const CHILE_DISTRESS_CONCEPTS = Object.freeze([
  { id: 'debt', label: 'Deuda u obligación vencida', distinctFrom: ['insolvency', 'liquidation', 'dissolution'] },
  { id: 'insolvency', label: 'Incapacidad de pago / insolvencia', distinctFrom: ['reorganization', 'liquidation', 'dissolution', 'tax_termination'] },
  { id: 'reorganization', label: 'Reorganización concursal', distinctFrom: ['liquidation', 'dissolution', 'tax_termination'] },
  { id: 'liquidation', label: 'Liquidación concursal', distinctFrom: ['dissolution', 'tax_termination'] },
  { id: 'dissolution', label: 'Disolución societaria', distinctFrom: ['liquidation', 'tax_termination'] },
  { id: 'tax_termination', label: 'Término de giro SII', distinctFrom: ['liquidation', 'dissolution'] }
]);

export const SUPERIR_SOURCES = Object.freeze([
  'https://www.superir.gob.cl/ley-n-20-720/',
  'https://www.superir.gob.cl/liquidacion-simplificada/'
]);

export const CHILE_INSOLVENCY_PROCEDURES = Object.freeze([
  { id: 'economic-insolvency-advice', label: 'Asesoría económica de insolvencia', forum: 'professional', eligibility: 'REQUIRES_VERIFICATION', automatic: false },
  { id: 'reorganization', label: 'Reorganización concursal', forum: 'court', eligibility: 'REQUIRES_VERIFICATION', automatic: false },
  { id: 'simplified-reorganization', label: 'Reorganización simplificada', forum: 'court', eligibility: 'REQUIRES_VERIFICATION', automatic: false },
  { id: 'voluntary-liquidation', label: 'Liquidación voluntaria', forum: 'court', eligibility: 'REQUIRES_VERIFICATION', automatic: false },
  { id: 'forced-liquidation', label: 'Liquidación forzosa', forum: 'court', eligibility: 'REQUIRES_VERIFICATION', automatic: false },
  { id: 'simplified-liquidation', label: 'Liquidación simplificada', forum: 'court', eligibility: 'REQUIRES_VERIFICATION', automatic: false }
]);

export function reviewInsolvencyProcedure({ procedureId, hasWorkers = null, evidence = [] } = {}) {
  const procedure = CHILE_INSOLVENCY_PROCEDURES.find(row => row.id === procedureId);
  if (!procedure) throw new Error('Procedimiento concursal no soportado');
  if (!Array.isArray(evidence)) throw new Error('evidence debe ser una lista');
  return {
    ...procedure,
    hasWorkers,
    evidence: [...evidence],
    eligibility: 'REQUIRES_VERIFICATION',
    automatic: false,
    warning: hasWorkers === false && procedureId.includes('simplified')
      ? 'No tener trabajadores no prueba elegibilidad para un procedimiento simplificado. Verificar todos los criterios con SUPERIR y profesional habilitado.'
      : 'La elegibilidad depende de antecedentes completos y revisión profesional; la aplicación no la determina.',
    sources: SUPERIR_SOURCES
  };
}

export function assessLiquidityRisk({ availableCash = 0, overduePayables = 0, taxDebt = 0, socialSecurityDebt = 0, minimumCashPolicy = 0 } = {}) {
  const totalDue = [overduePayables, taxDebt, socialSecurityDebt].reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
  const gap = Number(availableCash || 0) - totalDue - Math.max(0, Number(minimumCashPolicy || 0));
  return {
    level: totalDue === 0 ? 'EDUCATIONAL' : gap >= 0 ? 'PENDING' : 'PROFESSIONAL_REVIEW',
    totalDue: Math.round(totalDue), cashGap: Math.round(gap), eligibility: 'REQUIRES_VERIFICATION',
    automaticFiling: false, automaticBankruptcyConclusion: false,
    warning: 'Este resultado es una alerta financiera. No determina insolvencia ni elegibilidad para un procedimiento concursal.',
    sources: SUPERIR_SOURCES
  };
}

export function createInsolvencyDossier({ assets = [], liens = [], creditors = [], overdueItems = [], lawsuits = [], workers = [], bankStatements = [], taxFolderEvidence = [] } = {}) {
  const groups = { assets, liens, creditors, overdueItems, lawsuits, workers, bankStatements, taxFolderEvidence };
  for (const [name, rows] of Object.entries(groups)) if (!Array.isArray(rows)) throw new Error(`${name} debe ser una lista de referencias o resúmenes locales`);
  return {
    ...Object.fromEntries(Object.entries(groups).map(([name, rows]) => [name, [...rows]])),
    eligibility: 'REQUIRES_VERIFICATION', submitted: false, signed: false,
    warning: 'Expediente local de orientación: no presenta solicitudes, no firma, no adjudica derechos y requiere revisión profesional.',
    sources: SUPERIR_SOURCES
  };
}

