const SII_INACTIVITY_SOURCE = 'https://www.sii.cl/preguntas_frecuentes/catastro/001_013_8998.htm';
const SII_F29_SOURCE = 'https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1964.htm';

const amount = value => Math.round(Number(value || 0));

export function classifyChileMonth({ hasTaxStart = null, firstCategory = null, salesNet = 0, purchasesNet = 0, expensesNet = 0, honorariaGross = 0, otherMovements = 0 } = {}) {
  if (hasTaxStart === null) return { state: 'REQUIRES_VERIFICATION', reason: 'Falta confirmar si existe Inicio de Actividades.', f29: 'REQUIRES_VERIFICATION', source: SII_F29_SOURCE };
  if (!hasTaxStart) return { state: 'NO_TAX_START', reason: 'No se presume obligación mensual sin verificar el perfil y el inicio tributario.', f29: 'REQUIRES_VERIFICATION', source: SII_F29_SOURCE };
  const values = [salesNet, purchasesNet, expensesNet, honorariaGross, otherMovements].map(amount);
  const movement = values.some(value => value !== 0);
  const f29 = firstCategory === true ? 'REQUIRED' : 'REQUIRES_VERIFICATION';
  if (!movement) return { state: 'NO_MOVEMENT', reason: 'No se registran ventas, compras, gastos, honorarios ni otros movimientos; confirmar contra RCV y SII.', f29, source: SII_F29_SOURCE };
  if (amount(salesNet) === 0) return { state: 'ZERO_SALES_WITH_MOVEMENT', reason: 'Cero ventas no equivale a sin movimiento porque existen compras, gastos, honorarios u otros movimientos.', f29, source: SII_F29_SOURCE };
  return { state: 'OPERATING', reason: 'Hay ventas registradas; las obligaciones concretas dependen del perfil tributario.', f29, source: SII_F29_SOURCE };
}

export function projectCashFlow({ openingCash = 0, monthlyIncome = 0, recurringCosts = [], variableMonthlyCosts = 0, horizons = [6, 12, 24, 36] } = {}) {
  if (!Array.isArray(recurringCosts) || !Array.isArray(horizons) || horizons.some(months => !Number.isInteger(months) || months < 1)) throw new Error('Horizontes y costos recurrentes deben ser listas válidas');
  const monthlyRecurring = recurringCosts.reduce((sum, row) => sum + amount(row.amount), 0);
  return horizons.map(months => {
    const income = amount(monthlyIncome) * months;
    const costs = (monthlyRecurring + amount(variableMonthlyCosts)) * months;
    return { months, openingCash: amount(openingCash), income, costs, closingCash: amount(openingCash) + income - costs, currency: 'CLP', legalMinimum: false };
  });
}

export function assessChileInactivity({ undeclaredPeriods = null, monthsWithoutOperations = null, evidence = [] } = {}) {
  const missing = undeclaredPeriods === null || monthsWithoutOperations === null;
  const thresholdSignal = Number(undeclaredPeriods) >= 6 || Number(monthsWithoutOperations) >= 36;
  return {
    state: missing ? 'REQUIRES_VERIFICATION' : thresholdSignal ? 'LEGAL_THRESHOLD_SIGNAL' : 'MONITOR',
    automaticClosure: false,
    conclusion: 'REQUIRES_VERIFICATION',
    reason: missing
      ? 'Faltan períodos y evidencia para evaluar la regla.'
      : thresholdSignal
        ? 'Se alcanzó un umbral que exige revisar requisitos acumulativos, avisos y antecedentes ante el SII; no implica desaparición automática de la sociedad.'
        : 'No se alcanza el umbral observado, pero deben revisarse obligaciones concretas y evidencia oficial.',
    evidence: [...evidence], source: SII_INACTIVITY_SOURCE
  };
}

