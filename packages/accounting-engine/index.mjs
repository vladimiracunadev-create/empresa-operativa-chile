/**
 * Motor contable/tributario explicable.
 *
 * Reglas de la casa:
 *  - ninguna tasa se escribe aquí: todas vienen de `chile-tax-rules` por año;
 *  - todo resultado que sea una estimación lo declara en `limitations`;
 *  - los montos se redondean a peso chileno entero (CLP no usa decimales).
 *
 * Módulo puro: sin `node:fs`, sin red, sin reloj salvo donde se pide de forma
 * explícita. Corre igual en Node, en el navegador, en el APK y en Windows.
 */
import { loadRules } from '../chile-tax-rules/index.mjs';

export const clp = n => Math.round(Number(n || 0));

const assertNonNegative = (name, value) => {
  if (!Number.isFinite(Number(value)) || Number(value) < 0) throw new Error(`${name} debe ser un número >= 0`);
};

/* ------------------------------------------------------------------ */
/* Operaciones elementales                                             */
/* ------------------------------------------------------------------ */

export function saleFromNet(net, year = 2026) {
  assertNonNegative('net', net);
  const r = loadRules(year);
  const n = clp(net);
  const iva = clp(n * r.iva.generalRate);
  return { net: n, iva, total: n + iva, rate: r.iva.generalRate };
}

export function purchaseFromNet(net, year = 2026) {
  return {
    ...saleFromNet(net, year),
    kind: 'purchase',
    note: 'El IVA sólo es crédito fiscal si cumple los requisitos legales y está correctamente respaldado/caracterizado.'
  };
}

export function honorariumFromGross(gross, year = 2026) {
  assertNonNegative('gross', gross);
  const r = loadRules(year);
  const g = clp(gross);
  const retention = clp(g * r.honorarios.retentionRate);
  return { gross: g, retention, liquid: g - retention, rate: r.honorarios.retentionRate };
}

export function ppmFromSalesNet(salesNet, year = 2026, rate) {
  assertNonNegative('salesNet', salesNet);
  const r = loadRules(year);
  const usedRate = rate ?? r.ppmProPyme.initialYearRate;
  return { base: clp(salesNet), rate: usedRate, ppm: clp(Number(salesNet) * usedRate) };
}

/* ------------------------------------------------------------------ */
/* F29                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Borrador de control del F29.
 *
 * Acepta dos formas de alimentar el IVA:
 *
 *  1. sólo netos (`salesNet`, `purchasesNet`) → el IVA se DERIVA aplicando la
 *     tasa general. Sirve para simulaciones y para el sandbox.
 *  2. IVA declarado (`debitVat`, `creditVat`) → se usan los montos REALES de
 *     los documentos. Es lo correcto cuando los datos vienen de operaciones
 *     registradas: una factura exenta, una nota de crédito o un redondeo del
 *     emisor hacen que el IVA real no coincida con neto × 19%.
 *
 * `previousVatCredit` es el remanente de crédito fiscal del período anterior;
 * `nextVatCredit` es el remanente que queda para el período siguiente.
 */
export function f29Basic(
  {
    salesNet = 0,
    purchasesNet = 0,
    previousVatCredit = 0,
    honorariaGross = 0,
    debitVat,
    creditVat,
    ppmRate
  },
  year = 2026
) {
  assertNonNegative('salesNet', salesNet);
  assertNonNegative('purchasesNet', purchasesNet);
  assertNonNegative('previousVatCredit', previousVatCredit);
  assertNonNegative('honorariaGross', honorariaGross);

  const derivedDebit = saleFromNet(salesNet, year).iva;
  const derivedCredit = purchaseFromNet(purchasesNet, year).iva;

  const usesDeclaredVat = debitVat !== undefined || creditVat !== undefined;
  if (debitVat !== undefined) assertNonNegative('debitVat', debitVat);
  if (creditVat !== undefined) assertNonNegative('creditVat', creditVat);

  const debit = debitVat === undefined ? derivedDebit : clp(debitVat);
  const credit = creditVat === undefined ? derivedCredit : clp(creditVat);

  const availableCredit = credit + clp(previousVatCredit);
  const vatPayable = Math.max(0, debit - availableCredit);
  const nextVatCredit = Math.max(0, availableCredit - debit);

  const ppm = ppmFromSalesNet(salesNet, year, ppmRate);
  const honoraria = honorariumFromGross(honorariaGross, year);

  const limitations = [
    'No modela proporcionalidad, IVA de activo fijo, importaciones, retenciones especiales, reajuste de remanentes ni todos los códigos del F29.'
  ];
  if (!usesDeclaredVat) {
    limitations.push('IVA derivado de los netos con la tasa general: no refleja operaciones exentas, notas de crédito ni redondeos del emisor.');
  }

  return {
    origin: usesDeclaredVat ? 'documentos' : 'derivado',
    debitVat: debit,
    currentCreditVat: credit,
    previousVatCredit: clp(previousVatCredit),
    availableCreditVat: availableCredit,
    vatPayable,
    nextVatCredit,
    ppm: ppm.ppm,
    honorariaWithholding: honoraria.retention,
    estimatedF29Payment: vatPayable + ppm.ppm + honoraria.retention,
    limitations
  };
}

/**
 * Fecha de vencimiento del F29 de un período `YYYY-MM`.
 *
 * Devuelve las tres fechas que el SII distingue, no una sola: el plazo depende
 * de si se presenta por internet y de si el formulario resulta con pago.
 * Si la fecha cae sábado o domingo se informa el traslado al siguiente día
 * hábil, pero se marca `checkHolidays` porque los feriados legales no están
 * modelados aquí.
 */
export function f29DueDates(period, year = 2026) {
  if (!/^\d{4}-\d{2}$/.test(String(period))) throw new Error('period debe tener formato YYYY-MM');
  const r = loadRules(year);
  const [y, m] = String(period).split('-').map(Number);
  const nextMonth = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };

  const at = day => {
    const d = new Date(Date.UTC(nextMonth.y, nextMonth.m - 1, day));
    let shifted = false;
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
      d.setUTCDate(d.getUTCDate() + 1);
      shifted = true;
    }
    return { date: d.toISOString().slice(0, 10), shiftedFromWeekend: shifted };
  };

  return {
    period,
    general: at(r.f29.generalDueDay),
    internetWithPayment: at(r.f29.internetPaidEligibleDueDay),
    internetWithoutPayment: at(r.f29.internetNoPaymentDueDay),
    checkHolidays: true,
    source: r.f29.source
  };
}

/* ------------------------------------------------------------------ */
/* Otros cálculos                                                      */
/* ------------------------------------------------------------------ */

export function municipalPatent({ capital, rate, utm }, year = 2026) {
  assertNonNegative('capital', capital);
  const r = loadRules(year);
  const u = clp(utm ?? r.utm['2026-08']);
  const usedRate = rate ?? r.municipalPatent.minRate;
  if (usedRate < r.municipalPatent.minRate || usedRate > r.municipalPatent.maxRate) {
    throw new Error('rate fuera del rango legal configurado');
  }
  const raw = clp(Number(capital) * usedRate);
  const min = clp(r.municipalPatent.minUtm * u);
  const max = clp(r.municipalPatent.maxUtm * u);
  return { capital: clp(capital), rate: usedRate, raw, min, max, annualPatent: Math.min(max, Math.max(min, raw)), utm: u };
}

export function idpcProPyme({ incomeReceived = 0, expensesPaid = 0, adjustments = 0 }, year = 2026) {
  assertNonNegative('incomeReceived', incomeReceived);
  assertNonNegative('expensesPaid', expensesPaid);
  const r = loadRules(year);
  const base = Math.max(0, clp(incomeReceived) - clp(expensesPaid) + clp(adjustments));
  return { base, rate: r.idpcProPyme.rate, estimatedIdpc: clp(base * r.idpcProPyme.rate), note: r.idpcProPyme.note };
}

/* ------------------------------------------------------------------ */
/* Asientos explicados                                                 */
/* ------------------------------------------------------------------ */

export function journal(operation, year = 2026) {
  const type = operation.type;
  const amount = clp(operation.amount);
  assertNonNegative('amount', amount);

  if (type === 'capital_contribution') {
    return [{ debit: 'Banco', credit: 'Capital', amount, explanation: 'El aporte aumenta el activo Banco y el patrimonio Capital.' }];
  }
  if (type === 'sale') {
    const s = saleFromNet(amount, year);
    return [
      { debit: 'Banco / Clientes', credit: 'Ingresos por servicios', amount: s.net, explanation: 'Reconocimiento del ingreso neto.' },
      { debit: 'Banco / Clientes', credit: 'IVA Débito Fiscal', amount: s.iva, explanation: 'IVA recargado al cliente; no es ingreso de la empresa.' }
    ];
  }
  if (type === 'purchase' || type === 'expense') {
    const p = purchaseFromNet(amount, year);
    return [
      { debit: type === 'expense' ? 'Gasto' : 'Compra / Activo', credit: 'Banco / Proveedores', amount: p.net, explanation: 'Costo/gasto neto respaldado.' },
      { debit: 'IVA Crédito Fiscal', credit: 'Banco / Proveedores', amount: p.iva, explanation: 'Crédito potencial sujeto a requisitos legales.' }
    ];
  }
  if (type === 'honorarium') {
    const h = honorariumFromGross(amount, year);
    return [
      { debit: 'Honorarios (gasto)', credit: 'Banco / Prestador', amount: h.liquid, explanation: 'Monto líquido efectivamente pagado al prestador.' },
      { debit: 'Honorarios (gasto)', credit: 'Retenciones por enterar', amount: h.retention, explanation: 'Retención que la empresa debe enterar en el F29, no la paga el prestador.' }
    ];
  }
  if (type === 'owner_withdrawal') {
    return [{ debit: 'Cuenta accionista / retiros', credit: 'Banco', amount, explanation: 'Salida al accionista. No se clasifica automáticamente como gasto deducible.' }];
  }
  if (type === 'tax_payment') {
    return [{ debit: 'Impuestos por pagar', credit: 'Banco', amount, explanation: 'Pago de obligación previamente reconocida.' }];
  }
  throw new Error(`Tipo no soportado: ${type}`);
}

export function simulateScenario(scenario, year = 2026) {
  const ops = scenario.operations ?? [];
  let salesNet = 0, purchasesNet = 0, honorariaGross = 0, capital = 0, withdrawals = 0;
  const entries = [];
  for (const op of ops) {
    if (op.type === 'sale') salesNet += clp(op.amount);
    if (op.type === 'purchase' || op.type === 'expense') purchasesNet += clp(op.amount);
    if (op.type === 'honorarium_paid' || op.type === 'honorarium') honorariaGross += clp(op.amount);
    if (op.type === 'capital_contribution') capital += clp(op.amount);
    if (op.type === 'owner_withdrawal') withdrawals += clp(op.amount);
    if (['capital_contribution', 'sale', 'purchase', 'expense', 'honorarium', 'owner_withdrawal', 'tax_payment'].includes(op.type)) {
      entries.push(...journal(op, year));
    }
  }
  return {
    profile: scenario.profile,
    totals: { capital, salesNet, purchasesNet, honorariaGross, withdrawals },
    f29: f29Basic({ salesNet, purchasesNet, previousVatCredit: scenario.previousVatCredit ?? 0, honorariaGross }, year),
    entries
  };
}
