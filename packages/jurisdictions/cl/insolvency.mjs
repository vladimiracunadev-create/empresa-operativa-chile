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

