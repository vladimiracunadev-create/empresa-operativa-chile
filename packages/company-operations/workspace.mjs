/**
 * Operación de la empresa a lo largo del tiempo: ficha, constitución,
 * operaciones, obligaciones, cierres, auditoría y respaldos.
 *
 * Invariante central del producto: EMPRESA REAL y SANDBOX son dos espacios
 * distintos. Nunca hay una ruta de código que copie una operación de uno al
 * otro; la separación se consigue dando a cada modo su propio almacén.
 *
 * Este archivo es puro ESM sin `node:*`: es el mismo motor que corre en el
 * servidor, en la web, en Android y en Windows.
 */

import {
  normalizeCapitalProfile,
  validateCapitalProfile,
  capitalPendingToPay,
  normalizeEquityMovement,
  summarizeEquityMovements,
  equityMovementKind
} from './capital.mjs';
import { calculateTaxEquity, allowsSimplifiedTaxEquity } from '../accounting-engine/tax-equity.mjs';
import { calculateMunicipalPatent } from '../accounting-engine/municipal-patent.mjs';
import { normalizeMunicipality } from '../chile-tax-rules/municipalities.mjs';
import { loadRules, availableYears } from '../chile-tax-rules/index.mjs';

const isoNow = () => new Date().toISOString();
const money = n => Math.round(Number(n || 0));

/**
 * Huella de las reglas con que se calculó un cierre.
 *
 * Se guarda dentro del snapshot anual, no como referencia al archivo: dentro de
 * tres años `rules/2026.json` puede haberse corregido, y el cierre tiene que
 * seguir explicando con qué normas se calculó ese día.
 */
const loadRulesVersion = year => {
  const r = loadRules(year);
  return {
    commercialYear: r.commercialYear,
    lastVerified: r.lastVerified,
    schemaVersion: r.schemaVersion ?? null,
    municipalPatent: {
      minRate: r.municipalPatent.minRate,
      maxRate: r.municipalPatent.maxRate,
      minUtm: r.municipalPatent.minUtm,
      maxUtm: r.municipalPatent.maxUtm,
      legalReference: r.municipalPatent.legalReference ?? null,
      source: r.municipalPatent.source ?? null,
      lastVerified: r.municipalPatent.lastVerified ?? null
    },
    taxEquity: r.taxEquity
      ? Object.fromEntries(
          Object.entries(r.taxEquity.methods).map(([id, m]) => [id, { legalReference: m.legalReference, lastVerified: m.lastVerified ?? null }])
        )
      : null,
    idpcRate: r.idpcProPyme?.rate ?? null,
    ivaRate: r.iva?.generalRate ?? null
  };
};

const uuid = () => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Contextos sin WebCrypto (WebView antigua). No es criptográfico; sólo
  // necesitamos un identificador local único.
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
};

export const TRANSACTION_KINDS = Object.freeze([
  { id: 'sale', label: 'Venta', flow: 'in', affectsVat: 'debit' },
  { id: 'purchase', label: 'Compra del giro', flow: 'out', affectsVat: 'credit' },
  { id: 'expense', label: 'Gasto', flow: 'out', affectsVat: 'credit' },
  { id: 'honorarium', label: 'Honorario pagado', flow: 'out', affectsVat: 'none' },
  { id: 'capital', label: 'Aporte de capital', flow: 'in', affectsVat: 'none' },
  // Un depósito del dueño puede ser aporte o préstamo, y el efecto sobre el
  // patrimonio, sobre el CPT y sobre la patente municipal es opuesto. Que sean
  // dos tipos distintos obliga a decidirlo al registrar, no meses después.
  { id: 'shareholder_loan', label: 'Préstamo del accionista', flow: 'in', affectsVat: 'none' },
  { id: 'shareholder_loan_repayment', label: 'Devolución de préstamo al accionista', flow: 'out', affectsVat: 'none' },
  { id: 'owner_withdrawal', label: 'Retiro del accionista', flow: 'out', affectsVat: 'none' },
  { id: 'tax_payment', label: 'Pago de impuesto', flow: 'out', affectsVat: 'none' }
]);

const KIND_IDS = TRANSACTION_KINDS.map(k => k.id);

export const FORMATION_STEPS = Object.freeze([
  { id: 'design', title: 'Definir la SpA (nombre, objeto, capital, accionista)', authority: 'Interno', evidenceHint: 'Acuerdo o minuta interna' },
  { id: 'res', title: 'Constituir la sociedad y obtener los certificados', authority: 'Registro de Empresas y Sociedades', evidenceHint: 'Estatuto + certificado de estatuto actualizado', url: 'https://www.registrodeempresasysociedades.cl/' },
  { id: 'rut', title: 'Obtener RUT / e-RUT de la empresa', authority: 'SII / RES', evidenceHint: 'Cédula e-RUT descargada', url: 'https://www.sii.cl/' },
  { id: 'start', title: 'Inicio de Actividades', authority: 'SII', evidenceHint: 'Comprobante de inicio de actividades', url: 'https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_8697.htm' },
  { id: 'activities', title: 'Registrar actividades económicas y régimen tributario', authority: 'SII', evidenceHint: 'Pantalla/certificado con códigos de actividad y régimen', url: 'https://www.sii.cl/destacados/modernizacion/regimenes_mt.html' },
  { id: 'address', title: 'Acreditar domicilio u oficina virtual', authority: 'SII / Municipalidad', evidenceHint: 'Contrato de oficina virtual o autorización del propietario' },
  { id: 'dte', title: 'Habilitar facturación electrónica', authority: 'SII', evidenceHint: 'Certificado digital vigente + primer DTE emitido', url: 'https://www1.sii.cl/factura_sii/factura_sii.htm' },
  { id: 'patent', title: 'Obtener patente municipal', authority: 'Municipalidad', evidenceHint: 'Rol de patente y comprobante de pago' },
  { id: 'bank', title: 'Abrir cuenta corriente empresarial', authority: 'Banco', evidenceHint: 'Contrato de cuenta / primera cartola' }
]);

/** Estados válidos de un paso de constitución o de una obligación. */
export const STEP_STATUSES = Object.freeze(['pending', 'in_progress', 'done', 'blocked']);

const KEY = {
  company: 'company',
  formation: 'formation',
  transactions: 'transactions',
  obligations: 'obligations',
  closedPeriods: 'closed-periods',
  periodCloses: 'period-closes',
  equityMovements: 'equity-movements',
  annualCloses: 'annual-closes',
  municipalProfile: 'municipal-profile',
  audit: 'audit'
};

export class CompanyWorkspace {
  /**
   * @param {{ store: object, mode?: 'real'|'sandbox' }} options
   */
  constructor({ store, mode = 'real' }) {
    if (!['real', 'sandbox'].includes(mode)) throw new Error('mode debe ser real o sandbox');
    if (!store) throw new Error('CompanyWorkspace requiere un store');
    this.mode = mode;
    this.store = store;
  }

  /* ---------------- auditoría ---------------- */

  /**
   * Toda mutación deja rastro. La bitácora es append-only y no se expone
   * ninguna operación de borrado: si un registro pudiera borrarse sin dejar
   * huella, la bitácora no serviría como evidencia de nada.
   */
  audit(action, detail = {}) {
    const row = { id: uuid(), at: isoNow(), mode: this.mode, action, detail };
    this.store.append(KEY.audit, row);
    return row;
  }

  listAudit() {
    return this.store.readAll(KEY.audit);
  }

  /* ---------------- ficha de empresa ---------------- */

  getCompany() {
    return this.store.read(KEY.company, null);
  }

  saveCompany(company) {
    const previous = this.getCompany();
    const next = { ...previous, ...company, updatedAt: isoNow(), mode: this.mode };
    if (!next.createdAt) next.createdAt = next.updatedAt;
    this.store.write(KEY.company, next);
    this.audit('company.saved', { rut: next.rut ?? null, legalName: next.legalName ?? null });
    return next;
  }

  /* ---------------- capital y patrimonio ---------------- */

  /**
   * Ficha de capital, migrando en lectura el modelo antiguo de un solo campo
   * `capital`. La migración no toca el almacén: si nadie vuelve a guardar, el
   * dato original sigue intacto en disco. Eso hace que instalar esta versión no
   * pueda corromper datos existentes.
   */
  getCapitalProfile() {
    return normalizeCapitalProfile(this.getCompany() ?? {});
  }

  saveCapitalProfile(profile) {
    const next = normalizeCapitalProfile({ capitalProfile: { ...this.getCapitalProfile(), ...profile } });
    // Confirmar un campo lo saca de la lista de pendientes: si el usuario ya
    // escribió el capital social, dejar de decirle que falta.
    next.pendingConfirmation = next.pendingConfirmation.filter(field => next[field] === null || next[field] === undefined);
    const check = validateCapitalProfile(next);
    if (!check.valid) throw new Error(check.errors.join(' '));
    next.updatedAt = isoNow();

    const company = this.getCompany() ?? {};
    // `capital` se mantiene sincronizado con el enterado para no romper vistas,
    // exportaciones ni respaldos anteriores que lo leen.
    this.saveCompany({ ...company, capital: next.capitalEnterado, capitalProfile: next });
    this.audit('capital.profile.saved', {
      capitalSocial: next.capitalSocial,
      capitalSuscrito: next.capitalSuscrito,
      capitalEnterado: next.capitalEnterado
    });
    return next;
  }

  listEquityMovements() {
    return this.store.read(KEY.equityMovements, []);
  }

  /**
   * Registra un movimiento patrimonial.
   *
   * `registerCashMovement` crea además la operación de caja correspondiente y
   * la deja enlazada, para que el dinero aparezca en el flujo del mes sin que
   * el mismo peso se cuente dos veces al derivar el capital.
   */
  addEquityMovement(movement, { registerCashMovement = false } = {}) {
    const normalized = normalizeEquityMovement(movement);
    const row = { id: movement.id || uuid(), ...normalized, createdAt: isoNow() };

    const rows = this.listEquityMovements();
    rows.push(row);
    rows.sort((a, b) => a.date.localeCompare(b.date));
    this.store.write(KEY.equityMovements, rows);

    if (registerCashMovement) {
      const kindMap = {
        initial_contribution: 'capital',
        additional_contribution: 'capital',
        pending_capital_paid: 'capital',
        shareholder_loan: 'shareholder_loan',
        shareholder_loan_repayment: 'shareholder_loan_repayment',
        withdrawal: 'owner_withdrawal',
        capital_decrease: 'owner_withdrawal'
      };
      const kind = kindMap[row.kind];
      if (kind) {
        this.addTransaction({
          date: row.date,
          kind,
          description: row.description || equityMovementKind(row.kind).label,
          net: row.amount,
          vat: 0,
          total: row.amount,
          paid: true,
          documentNumber: row.evidenceRef || null,
          equityMovementId: row.id
        });
      }
    }

    this.audit('equity.movement.added', { id: row.id, kind: row.kind, amount: row.amount, date: row.date });
    return row;
  }

  deleteEquityMovement(id) {
    const rows = this.listEquityMovements();
    const found = rows.find(x => x.id === id);
    if (!found) return false;
    this.store.write(KEY.equityMovements, rows.filter(x => x.id !== id));
    this.audit('equity.movement.deleted', { id, kind: found.kind, amount: found.amount });
    return true;
  }

  /**
   * Movimientos patrimoniales efectivos, uniendo dos orígenes sin duplicar.
   *
   * El ledger explícito manda. Las operaciones de caja antiguas —los aportes
   * que se registraron como transacción cuando el modelo societario no existía—
   * se incorporan como movimientos derivados, salvo las que ya están enlazadas
   * a un movimiento del ledger.
   */
  effectiveEquityMovements() {
    const explicit = this.listEquityMovements();
    const legacyKinds = {
      capital: 'additional_contribution',
      shareholder_loan: 'shareholder_loan',
      shareholder_loan_repayment: 'shareholder_loan_repayment',
      owner_withdrawal: 'withdrawal'
    };
    const derived = this.listTransactions()
      .filter(t => legacyKinds[t.kind] && !t.equityMovementId)
      .map(t => ({
        id: `tx:${t.id}`,
        kind: legacyKinds[t.kind],
        date: t.date,
        amount: money(t.total),
        description: t.description || '',
        evidenceRef: t.documentNumber || '',
        status: 'DECLARADO',
        origin: 'usuario',
        derivedFromTransaction: t.id
      }));
    return [...explicit, ...derived].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  /**
   * Posición de capital a una fecha: qué dice el estatuto, qué se comprometió,
   * qué llegó y qué falta. Las cuatro cifras por separado, nunca fundidas.
   */
  capitalPosition({ until } = {}) {
    const profile = this.getCapitalProfile();
    const movements = this.effectiveEquityMovements();
    const summary = summarizeEquityMovements(movements, { until });

    // El capital enterado real es el mayor entre lo declarado en la ficha y lo
    // que suman los movimientos: si el usuario registró aportes posteriores, la
    // ficha se queda corta, y quedarse corto aquí subestima la patente.
    const enteradoDeclarado = money(profile.capitalEnterado);
    const enteradoMovimientos = summary.capitalEnteradoPorMovimientos - summary.disminucionesDeCapital;
    const capitalEnterado = Math.max(enteradoDeclarado, Math.max(0, enteradoMovimientos));

    return {
      capitalSocial: profile.capitalSocial,
      capitalSuscrito: profile.capitalSuscrito,
      capitalEnterado,
      capitalEnteradoDeclarado: enteradoDeclarado,
      capitalEnteradoPorMovimientos: Math.max(0, enteradoMovimientos),
      capitalPorEnterar: capitalPendingToPay({ ...profile, capitalEnterado }),
      deudaConAccionista: summary.deudaConAccionista,
      retiros: summary.retiros,
      movements: summary,
      pendingConfirmation: profile.pendingConfirmation,
      validation: validateCapitalProfile({ ...profile, capitalEnterado })
    };
  }

  /* ---------------- municipalidad ---------------- */

  getMunicipalProfile() {
    const stored = this.store.read(KEY.municipalProfile, null) ?? {};
    const company = this.getCompany() ?? {};
    return {
      ...normalizeMunicipality({ commune: company.commune, ...stored }),
      initialOwnCapital:
        stored.initialOwnCapital === undefined || stored.initialOwnCapital === null ? null : money(stored.initialOwnCapital),
      deductibleInvestments: money(stored.deductibleInvestments),
      allocatedCapital: stored.allocatedCapital === undefined || stored.allocatedCapital === null ? null : money(stored.allocatedCapital),
      utmPeriod: stored.utmPeriod || null,
      notes: stored.notes || ''
    };
  }

  saveMunicipalProfile(profile) {
    const next = { ...this.getMunicipalProfile(), ...profile };
    const normalized = {
      ...normalizeMunicipality(next),
      initialOwnCapital:
        next.initialOwnCapital === '' || next.initialOwnCapital === null || next.initialOwnCapital === undefined
          ? null
          : money(next.initialOwnCapital),
      deductibleInvestments: money(next.deductibleInvestments),
      allocatedCapital:
        next.allocatedCapital === '' || next.allocatedCapital === null || next.allocatedCapital === undefined
          ? null
          : money(next.allocatedCapital),
      utmPeriod: next.utmPeriod || null,
      notes: next.notes || '',
      updatedAt: isoNow()
    };
    this.store.write(KEY.municipalProfile, normalized);
    this.audit('municipal.profile.saved', { commune: normalized.commune, rateStatus: normalized.status });
    return normalized;
  }

  /* ---------------- ejercicio anual ---------------- */

  /** Períodos `YYYY-MM` de un año comercial que tienen movimiento. */
  periodsOfYear(year) {
    return this.listPeriods().filter(p => p.startsWith(`${year}-`));
  }

  /** Agregado del año comercial completo, sumando sus cierres mensuales. */
  yearSummary(year) {
    const periods = this.periodsOfYear(year);
    const base = {
      year: Number(year),
      periods: periods.length,
      count: 0,
      salesNet: 0,
      debitVat: 0,
      purchasesNet: 0,
      creditVat: 0,
      deductibleExpenses: 0,
      honorariaGross: 0,
      capital: 0,
      withdrawals: 0,
      cashIn: 0,
      cashOut: 0
    };
    for (const p of periods) {
      const s = this.periodSummary(p);
      for (const key of Object.keys(base)) {
        if (key === 'year' || key === 'periods') continue;
        base[key] += s[key] ?? 0;
      }
    }
    base.netCash = base.cashIn - base.cashOut;
    // Resultado aproximado del régimen Pro Pyme: percibido menos pagado. No es
    // la RLI, y por eso se llama `resultadoAproximado` y no `rli`.
    base.resultadoAproximado = base.salesNet - base.deductibleExpenses - base.honorariaGross;
    return base;
  }

  /**
   * Balance estimado al cierre de un año comercial.
   *
   * Es una ESTIMACIÓN derivada de las operaciones registradas, no un balance
   * contable: la aplicación no lleva plan de cuentas ni depreciación. Sirve
   * para proponer valores en el cierre anual, que el usuario puede corregir.
   */
  estimatedBalance(year) {
    const movements = this.effectiveEquityMovements().filter(m => String(m.date) <= `${year}-12-31`);
    const summary = summarizeEquityMovements(movements);

    let cash = 0;
    for (const t of this.listTransactions().filter(t => t.date <= `${year}-12-31`)) {
      const kind = TRANSACTION_KINDS.find(k => k.id === t.kind);
      if (!kind) continue;
      cash += (kind.flow === 'in' ? 1 : -1) * money(t.total);
    }

    const nextYearJanuary = `${Number(year) + 1}-01`;
    const vatCredit = this.vatCarryForwardInto(nextYearJanuary);
    const contributedAssets = movements
      .filter(m => m.kind === 'asset_contribution')
      .reduce((a, m) => a + money(m.bookValue ?? m.amount), 0);

    const assets = Math.max(0, cash) + vatCredit + contributedAssets;
    const liabilities = summary.deudaConAccionista;

    return {
      year: Number(year),
      cash,
      vatCredit,
      contributedAssets,
      assets,
      liabilities,
      accountingEquity: assets - liabilities,
      estimated: true,
      limitations: [
        'Balance derivado de las operaciones registradas: no hay plan de cuentas, cuentas por cobrar/pagar, depreciación ni corrección monetaria.',
        'Los impuestos por pagar del período no se reconocen como pasivo hasta que se registran como operación.'
      ]
    };
  }

  /**
   * CPT estimado de un año comercial.
   *
   * `overrides` permite reemplazar los activos, pasivos y ajustes propuestos por
   * los que el usuario declare, que es lo que ocurre en el cierre anual.
   */
  taxEquityFor(year, overrides = {}) {
    const company = this.getCompany() ?? {};
    const balance = this.estimatedBalance(year);
    const yearData = this.yearSummary(year);
    const movements = summarizeEquityMovements(this.effectiveEquityMovements(), { until: `${year}-12-31` });
    const previous = this.getAnnualClose(Number(year) - 1);

    const resultado = overrides.taxableBase ?? yearData.resultadoAproximado;

    return calculateTaxEquity({
      fiscalYear: Number(year),
      taxRegime: overrides.taxRegime ?? company.taxRegime ?? '',
      assets: overrides.assets ?? balance.assets,
      liabilities: overrides.liabilities ?? balance.liabilities,
      nonEffectiveValues: overrides.nonEffectiveValues ?? 0,
      equityMovements: movements,
      taxAdjustments: overrides.taxAdjustments ?? {},
      openingTaxEquity: overrides.openingTaxEquity ?? previous?.taxEquity?.calculatedCPT ?? null,
      operations: {
        taxableBase: Math.max(0, resultado),
        losses: resultado < 0 ? Math.abs(resultado) : 0,
        participationIncome: overrides.participationIncome ?? 0,
        article21Paid: overrides.article21Paid ?? 0
      },
      method: overrides.method,
      rulesYear: overrides.rulesYear
    });
  }

  /**
   * Etapa de la empresa para efectos de patente en un período dado.
   *
   * Es empresa NUEVA en el año en que inicia actividades; desde el siguiente,
   * en funcionamiento. La distinción decide qué capital entra al cálculo.
   */
  businessStageFor(year) {
    const profile = this.getCapitalProfile();
    const start = profile.fechaInicioActividades || profile.fechaConstitucion;
    if (!start) return 'NEW_BUSINESS';
    return Number(String(start).slice(0, 4)) >= Number(year) ? 'NEW_BUSINESS' : 'ESTABLISHED_BUSINESS';
  }

  /** Patente municipal estimada de un período, con toda su trazabilidad. */
  municipalPatentFor(year, overrides = {}) {
    const municipal = this.getMunicipalProfile();
    const stage = overrides.businessStage ?? this.businessStageFor(year);
    const capital = this.capitalPosition({ until: `${year}-12-31` });
    const previousClose = this.getAnnualClose(Number(year) - 1);

    return calculateMunicipalPatent({
      businessStage: stage,
      municipality: municipal,
      year: Number(year),
      initialOwnCapital: overrides.initialOwnCapital ?? municipal.initialOwnCapital ?? capital.capitalEnterado,
      taxEquity: overrides.taxEquity ?? previousClose?.taxEquity?.calculatedCPT ?? null,
      deductibleInvestments: overrides.deductibleInvestments ?? municipal.deductibleInvestments,
      allocatedCapital: overrides.allocatedCapital ?? municipal.allocatedCapital,
      municipalRate: overrides.municipalRate ?? municipal.patentRate,
      utm: overrides.utm,
      utmPeriod: overrides.utmPeriod ?? municipal.utmPeriod,
      rulesYear: overrides.rulesYear
    });
  }

  listAnnualCloses() {
    return this.store.read(KEY.annualCloses, []);
  }

  getAnnualClose(year) {
    return this.listAnnualCloses().find(c => c.fiscalYear === Number(year)) ?? null;
  }

  /**
   * Cierra un ejercicio y deja una fotografía inmutable.
   *
   * El snapshot guarda la VERSIÓN de las reglas usadas, no sólo el resultado:
   * revisado dentro de tres años, tiene que poder explicar con qué normas se
   * calculó, aunque el archivo de reglas de ese año ya haya cambiado.
   *
   * No se sobrescribe nunca: reabrir exige motivo y deja rastro.
   */
  closeFiscalYear(year, { assets, liabilities, taxAdjustments, taxableBase, notes = '', evidence = [] } = {}) {
    const fiscalYear = Number(year);
    if (!Number.isInteger(fiscalYear)) throw new Error('El cierre anual requiere un año comercial válido');
    if (this.getAnnualClose(fiscalYear)) {
      throw new Error(`El ejercicio ${fiscalYear} ya está cerrado. Reábrelo indicando el motivo si necesitas rehacerlo.`);
    }

    const company = this.getCompany() ?? {};
    const balance = this.estimatedBalance(fiscalYear);
    const taxEquity = this.taxEquityFor(fiscalYear, { assets, liabilities, taxAdjustments, taxableBase });
    const capital = this.capitalPosition({ until: `${fiscalYear}-12-31` });
    const rules = loadRulesVersion(fiscalYear);

    const close = Object.freeze({
      id: uuid(),
      fiscalYear,
      closingDate: `${fiscalYear}-12-31`,
      createdAt: isoNow(),
      taxRegime: company.taxRegime ?? null,
      assets: assets ?? balance.assets,
      liabilities: liabilities ?? balance.liabilities,
      accountingEquity: (assets ?? balance.assets) - (liabilities ?? balance.liabilities),
      balanceOrigin: assets === undefined && liabilities === undefined ? 'estimado por la aplicación' : 'declarado por el usuario',
      taxEquity,
      CPT: taxEquity.calculatedCPT,
      CPTMethod: taxEquity.calculationMethod,
      taxAdjustments: taxAdjustments ?? {},
      capital,
      capitalMovements: this.effectiveEquityMovements().filter(m => String(m.date) <= `${fiscalYear}-12-31`),
      yearSummary: this.yearSummary(fiscalYear),
      // Esto es lo que conecta un ejercicio con el siguiente: la base municipal
      // del período que viene sale de aquí, no del capital de constitución.
      municipalPatentBaseForNextPeriod: {
        period: fiscalYear + 1,
        baseCapital: taxEquity.calculatedCPT,
        rule: 'Capital propio registrado en el balance terminado el 31 de diciembre inmediatamente anterior',
        legalReference: 'D.L. N.º 3.063, art. 24 inciso tercero',
        status: 'ESTIMADO'
      },
      evidence,
      notes,
      legalRulesVersion: rules
    });

    const rows = this.listAnnualCloses();
    rows.push(close);
    rows.sort((a, b) => a.fiscalYear - b.fiscalYear);
    this.store.write(KEY.annualCloses, rows);
    this.audit('fiscal-year.closed', { fiscalYear, CPT: close.CPT, method: close.CPTMethod });
    return close;
  }

  reopenFiscalYear(year, reason) {
    const close = this.getAnnualClose(year);
    if (!close) throw new Error('Ese ejercicio no está cerrado');
    if (!String(reason || '').trim()) throw new Error('Reabrir un ejercicio exige indicar el motivo');
    this.store.write(KEY.annualCloses, this.listAnnualCloses().filter(c => c.fiscalYear !== Number(year)));
    this.audit('fiscal-year.reopened', { fiscalYear: Number(year), reason, previousCPT: close.CPT });
    return { fiscalYear: Number(year), reopened: true, reason };
  }

  /**
   * Historial por año. Nunca se recalcula un ejercicio cerrado: se muestra lo
   * que quedó guardado, que es lo que permite auditar y reproducir.
   */
  capitalHistory() {
    const closes = this.listAnnualCloses();
    // El año siguiente al último cierre entra al historial aunque todavía no
    // tenga movimiento: es justo el año cuya base municipal acaba de quedar
    // determinada, y verlo al lado del anterior es la lección entera.
    const years = new Set([
      ...closes.map(c => c.fiscalYear),
      ...closes.map(c => c.fiscalYear + 1),
      ...this.listPeriods().map(p => Number(p.slice(0, 4)))
    ]);
    return [...years]
      .filter(Number.isFinite)
      .sort()
      .map(year => {
        const close = this.getAnnualClose(year);
        let patent = null;
        let patentError = null;
        let simulatedWithRulesYear = null;
        try {
          patent = this.municipalPatentFor(year);
        } catch (error) {
          patentError = error.message;
          // Sin reglas del año no se calcula la patente de ese año: eso no se
          // negocia. Pero sí se puede mostrar qué saldría con las últimas reglas
          // verificadas, rotulado como simulación. Es la diferencia entre
          // enseñar el mecanismo y fingir que la cifra es la del período.
          const fallback = availableYears().filter(y => y < year).at(-1);
          if (fallback) {
            try {
              patent = this.municipalPatentFor(year, { rulesYear: fallback });
              simulatedWithRulesYear = fallback;
            } catch {
              /* Si tampoco se puede simular, queda sólo el error, que ya es informativo. */
            }
          }
        }
        return {
          year,
          closed: Boolean(close),
          capitalEnterado: close?.capital?.capitalEnterado ?? this.capitalPosition({ until: `${year}-12-31` }).capitalEnterado,
          accountingEquity: close?.accountingEquity ?? null,
          CPT: close?.CPT ?? null,
          CPTMethod: close?.CPTMethod ?? null,
          taxRegime: close?.taxRegime ?? (this.getCompany() ?? {}).taxRegime ?? null,
          patent: patent
            ? {
                annualPatent: patent.annualPatent,
                baseCapital: patent.baseCapital,
                rate: patent.rate,
                rateStatus: patent.rateStatus,
                utm: patent.utm,
                utmPeriod: patent.utmPeriod,
                businessStage: patent.businessStage
              }
            : null,
          patentError,
          simulatedWithRulesYear
        };
      });
  }

  /* ---------------- constitución ---------------- */

  listFormationSteps() {
    const stored = this.store.read(KEY.formation, null);
    // El catálogo de pasos vive en el código, no en los datos: así, cuando se
    // agrega un trámite nuevo, las empresas ya creadas lo ven aparecer en vez
    // de quedarse con una lista congelada del día en que se instalaron.
    return FORMATION_STEPS.map(step => {
      const saved = stored?.find(x => x.id === step.id);
      return { ...step, status: 'pending', evidenceRef: '', ...saved };
    });
  }

  updateFormationStep(step) {
    if (!FORMATION_STEPS.some(x => x.id === step.id)) throw new Error('Paso de constitución desconocido');
    if (step.status && !STEP_STATUSES.includes(step.status)) throw new Error(`status inválido: ${step.status}`);
    const rows = this.listFormationSteps();
    const i = rows.findIndex(x => x.id === step.id);
    rows[i] = { ...rows[i], ...step, updatedAt: isoNow() };
    // Regla de integridad: "hecho" exige evidencia. La app no puede dar por
    // cumplido un trámite ante un organismo externo sólo porque el usuario
    // marcó una casilla.
    if (rows[i].status === 'done' && !String(rows[i].evidenceRef || '').trim()) {
      throw new Error('Un paso sólo puede marcarse como realizado si registras su evidencia (folio, certificado o comprobante).');
    }
    this.store.write(KEY.formation, rows);
    this.audit('formation.step.updated', { id: step.id, status: rows[i].status, evidenceRef: rows[i].evidenceRef || null });
    return rows[i];
  }

  /** Porcentaje de habilitación de la empresa, contado sobre evidencia real. */
  formationProgress() {
    const rows = this.listFormationSteps();
    const done = rows.filter(x => x.status === 'done').length;
    return { total: rows.length, done, percent: Math.round((done / rows.length) * 100), ready: done === rows.length };
  }

  /* ---------------- operaciones ---------------- */

  listTransactions() {
    return this.store.read(KEY.transactions, []);
  }

  addTransaction(tx) {
    if (!KIND_IDS.includes(tx.kind)) throw new Error(`kind no soportado: ${tx.kind}`);
    const date = tx.date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date debe tener formato YYYY-MM-DD');
    if (this.isPeriodClosed(date.slice(0, 7))) throw new Error(`El período ${date.slice(0, 7)} está cerrado`);

    const net = money(tx.net);
    const vat = money(tx.vat);
    const next = {
      id: tx.id || uuid(),
      date,
      kind: tx.kind,
      description: tx.description || '',
      net,
      vat,
      total: money(tx.total ?? net + vat),
      documentType: tx.documentType || null,
      documentNumber: tx.documentNumber || null,
      counterpartyRut: tx.counterpartyRut || null,
      paid: Boolean(tx.paid),
      deductible: tx.deductible !== false,
      vatCreditEligible: tx.vatCreditEligible !== false,
      source: tx.source || 'manual',
      evidence: tx.evidence || [],
      // Enlace al ledger patrimonial. Su presencia es lo que impide que un
      // aporte se cuente dos veces al derivar el capital enterado.
      equityMovementId: tx.equityMovementId || null,
      createdAt: isoNow()
    };
    const rows = this.listTransactions();
    rows.push(next);
    this.store.write(KEY.transactions, rows);
    this.audit('transaction.added', { id: next.id, kind: next.kind, total: next.total, period: date.slice(0, 7) });
    return next;
  }

  updateTransaction(id, patch) {
    const rows = this.listTransactions();
    const i = rows.findIndex(x => x.id === id);
    if (i < 0) throw new Error('Operación no encontrada');
    if (this.isPeriodClosed(rows[i].date.slice(0, 7))) throw new Error('No se puede modificar una operación de un período cerrado');
    const merged = { ...rows[i], ...patch, id: rows[i].id, updatedAt: isoNow() };
    if (!KIND_IDS.includes(merged.kind)) throw new Error(`kind no soportado: ${merged.kind}`);
    if (this.isPeriodClosed(merged.date.slice(0, 7))) throw new Error('No se puede mover una operación a un período cerrado');
    merged.net = money(merged.net);
    merged.vat = money(merged.vat);
    merged.total = money(merged.total);
    rows[i] = merged;
    this.store.write(KEY.transactions, rows);
    this.audit('transaction.updated', { id, period: merged.date.slice(0, 7) });
    return merged;
  }

  deleteTransaction(id) {
    const rows = this.listTransactions();
    const found = rows.find(x => x.id === id);
    if (!found) return false;
    // Un período cerrado es inmutable en ambas direcciones: ni se agrega ni se
    // borra. Sin esto, "cerrar el mes" no significaría nada.
    if (this.isPeriodClosed(found.date.slice(0, 7))) throw new Error('No se puede eliminar una operación de un período cerrado');
    this.store.write(KEY.transactions, rows.filter(x => x.id !== id));
    this.audit('transaction.deleted', { id, kind: found.kind, total: found.total });
    return true;
  }

  /* ---------------- obligaciones ---------------- */

  listObligations() {
    return this.store.read(KEY.obligations, []);
  }

  upsertObligation(ob) {
    if (!ob.type) throw new Error('La obligación requiere un tipo');
    const rows = this.listObligations();
    const id = ob.id || `${ob.type}-${ob.period || ob.dueDate || 'sin-periodo'}`;
    const i = rows.findIndex(x => x.id === id);
    const next = { status: 'pending', ...(i >= 0 ? rows[i] : {}), ...ob, id, updatedAt: isoNow() };
    // Mismo principio que en constitución: "cumplida" exige comprobante.
    if (next.status === 'done' && !String(next.evidenceRef || '').trim()) {
      throw new Error('Una obligación sólo se marca cumplida con su comprobante (folio, número de operación o archivo).');
    }
    if (i >= 0) rows[i] = next;
    else rows.push(next);
    this.store.write(KEY.obligations, rows);
    this.audit('obligation.upserted', { id, status: next.status });
    return next;
  }

  deleteObligation(id) {
    const rows = this.listObligations();
    if (!rows.some(x => x.id === id)) return false;
    this.store.write(KEY.obligations, rows.filter(x => x.id !== id));
    this.audit('obligation.deleted', { id });
    return true;
  }

  /* ---------------- períodos ---------------- */

  /** Períodos `YYYY-MM` con al menos una operación, del más antiguo al más nuevo. */
  listPeriods() {
    return [...new Set(this.listTransactions().map(x => x.date.slice(0, 7)))].sort();
  }

  periodSummary(period) {
    const rows = this.listTransactions().filter(x => x.date?.startsWith(period));
    const sum = (kind, field) => rows.filter(x => x.kind === kind).reduce((a, x) => a + money(x[field]), 0);

    const salesNet = sum('sale', 'net');
    const debitVat = sum('sale', 'vat');
    const purchaseRows = rows.filter(x => ['purchase', 'expense'].includes(x.kind));
    const purchasesNet = purchaseRows.reduce((a, x) => a + money(x.net), 0);
    const creditVat = purchaseRows.filter(x => x.vatCreditEligible).reduce((a, x) => a + money(x.vat), 0);
    const rejectedVat = purchaseRows.filter(x => !x.vatCreditEligible).reduce((a, x) => a + money(x.vat), 0);
    const deductibleExpenses = purchaseRows.filter(x => x.deductible).reduce((a, x) => a + money(x.net), 0);
    const honorariaGross = sum('honorarium', 'total');
    const cashIn = rows.filter(x => ['sale', 'capital', 'shareholder_loan'].includes(x.kind)).reduce((a, x) => a + money(x.total), 0);
    const cashOut = rows
      .filter(x => ['purchase', 'expense', 'honorarium', 'owner_withdrawal', 'shareholder_loan_repayment', 'tax_payment'].includes(x.kind))
      .reduce((a, x) => a + money(x.total), 0);
    const withoutEvidence = rows.filter(x => (x.evidence ?? []).length === 0 && !x.documentNumber).length;

    return {
      period,
      count: rows.length,
      salesNet,
      debitVat,
      purchasesNet,
      creditVat,
      rejectedVat,
      deductibleExpenses,
      honorariaGross,
      capital: sum('capital', 'total'),
      shareholderLoans: sum('shareholder_loan', 'total') - sum('shareholder_loan_repayment', 'total'),
      withdrawals: sum('owner_withdrawal', 'total'),
      cashIn,
      cashOut,
      netCash: cashIn - cashOut,
      withoutEvidence,
      closed: this.isPeriodClosed(period)
    };
  }

  /**
   * Remanente de crédito fiscal que llega desde los períodos anteriores.
   *
   * Se acumula recorriendo la historia desde el principio: si en marzo sobró
   * crédito, ese remanente tiene que estar disponible en abril. Sin esto, la
   * app le cobraría al usuario un IVA que legalmente no debe.
   *
   * No aplica reajuste (art. 27 del D.L. 825); se declara como limitación.
   */
  vatCarryForwardInto(period) {
    let carry = 0;
    for (const p of this.listPeriods()) {
      if (p >= period) break;
      const s = this.periodSummary(p);
      const available = s.creditVat + carry;
      carry = Math.max(0, available - s.debitVat);
    }
    return carry;
  }

  listClosedPeriods() {
    return this.store.read(KEY.closedPeriods, []);
  }

  isPeriodClosed(period) {
    return this.listClosedPeriods().includes(period);
  }

  listPeriodCloses() {
    return this.store.read(KEY.periodCloses, []);
  }

  closePeriod(period, checklist = {}) {
    if (!/^\d{4}-\d{2}$/.test(String(period))) throw new Error('period debe tener formato YYYY-MM');
    if (this.isPeriodClosed(period)) throw new Error('El período ya está cerrado');
    const summary = this.periodSummary(period);
    const close = {
      id: uuid(),
      period,
      at: isoNow(),
      summary,
      carryForwardIn: this.vatCarryForwardInto(period),
      checklist
    };
    const rows = this.listPeriodCloses();
    rows.push(close);
    this.store.write(KEY.periodCloses, rows);
    const closed = this.listClosedPeriods();
    closed.push(period);
    this.store.write(KEY.closedPeriods, closed.sort());
    this.audit('period.closed', { period, closeId: close.id, checklist });
    return close;
  }

  /**
   * Reabre un período. Existe porque cerrar por error es inevitable, pero deja
   * rastro explícito en la bitácora con el motivo: la trazabilidad importa más
   * que la inmutabilidad absoluta.
   */
  reopenPeriod(period, reason) {
    if (!this.isPeriodClosed(period)) throw new Error('El período no está cerrado');
    if (!String(reason || '').trim()) throw new Error('Reabrir un período exige indicar el motivo');
    this.store.write(KEY.closedPeriods, this.listClosedPeriods().filter(p => p !== period));
    this.audit('period.reopened', { period, reason });
    return { period, reopened: true, reason };
  }

  /* ---------------- respaldo y portabilidad ---------------- */

  /**
   * Vuelca todo el espacio de trabajo a un objeto JSON plano.
   * Es lo que hace que los datos sean del usuario y no de la app: el mismo
   * archivo se exporta desde Android y se importa en Windows.
   */
  exportAll() {
    return {
      format: 'empresa-operativa-chile/backup',
      // v2 agrega capital, movimientos patrimoniales, cierres anuales y ficha
      // municipal. Los respaldos v1 se siguen importando (ver `importAll`).
      formatVersion: 2,
      mode: this.mode,
      exportedAt: isoNow(),
      company: this.getCompany(),
      formation: this.store.read(KEY.formation, []),
      transactions: this.listTransactions(),
      obligations: this.listObligations(),
      closedPeriods: this.listClosedPeriods(),
      periodCloses: this.listPeriodCloses(),
      equityMovements: this.listEquityMovements(),
      annualCloses: this.listAnnualCloses(),
      municipalProfile: this.store.read(KEY.municipalProfile, null),
      audit: this.listAudit()
    };
  }

  /**
   * Importa un respaldo. `replace` decide si se sustituye el contenido o se
   * fusionan las operaciones por id.
   */
  importAll(payload, { replace = true } = {}) {
    if (payload?.format !== 'empresa-operativa-chile/backup') throw new Error('El archivo no es un respaldo válido de esta aplicación');
    // Un respaldo v1 se importa igual: los campos nuevos simplemente no vienen y
    // quedan vacíos. Romper los respaldos que la gente ya tiene guardados sería
    // peor que cualquier ventaja de limpiar el formato.
    if (![1, 2].includes(payload.formatVersion)) throw new Error(`Versión de respaldo no soportada: ${payload.formatVersion}`);

    if (replace) {
      this.store.write(KEY.company, payload.company ?? null);
      this.store.write(KEY.formation, payload.formation ?? []);
      this.store.write(KEY.transactions, payload.transactions ?? []);
      this.store.write(KEY.obligations, payload.obligations ?? []);
      this.store.write(KEY.closedPeriods, payload.closedPeriods ?? []);
      this.store.write(KEY.periodCloses, payload.periodCloses ?? []);
      this.store.write(KEY.equityMovements, payload.equityMovements ?? []);
      this.store.write(KEY.annualCloses, payload.annualCloses ?? []);
      this.store.write(KEY.municipalProfile, payload.municipalProfile ?? null);
    } else {
      const byId = new Map(this.listTransactions().map(t => [t.id, t]));
      for (const t of payload.transactions ?? []) byId.set(t.id, t);
      this.store.write(KEY.transactions, [...byId.values()].sort((a, b) => a.date.localeCompare(b.date)));

      const movements = new Map(this.listEquityMovements().map(m => [m.id, m]));
      for (const m of payload.equityMovements ?? []) movements.set(m.id, m);
      this.store.write(KEY.equityMovements, [...movements.values()].sort((a, b) => String(a.date).localeCompare(String(b.date))));

      // Un ejercicio ya cerrado no se pisa desde un respaldo: si se pudiera,
      // el cierre dejaría de ser inmutable por la puerta de atrás.
      const closes = new Map(this.listAnnualCloses().map(c => [c.fiscalYear, c]));
      for (const c of payload.annualCloses ?? []) if (!closes.has(c.fiscalYear)) closes.set(c.fiscalYear, c);
      this.store.write(KEY.annualCloses, [...closes.values()].sort((a, b) => a.fiscalYear - b.fiscalYear));
    }
    this.audit('backup.imported', { replace, transactions: (payload.transactions ?? []).length, sourceMode: payload.mode ?? null });
    return { imported: true, replace, transactions: this.listTransactions().length };
  }

  backup() {
    const name = new Date().toISOString().replace(/[:.]/g, '-');
    const location = this.store.saveSnapshot(name, this.exportAll());
    this.audit('backup.created', { name, location });
    return { name, location };
  }

  listBackups() {
    return this.store.listSnapshots();
  }

  /* ---------------- salud operativa ---------------- */

  /**
   * Semáforo de la empresa. Deliberadamente NO dice "todo en orden" cuando
   * faltan evidencias: el objetivo del producto es detectar el hueco, no
   * tranquilizar.
   */
  healthCheck(period = new Date().toISOString().slice(0, 7)) {
    const issues = [];
    const company = this.getCompany();
    const formation = this.formationProgress();
    const summary = this.periodSummary(period);

    if (!company?.legalName) issues.push({ level: 'warn', code: 'company.missing', message: 'La ficha de empresa está incompleta (falta razón social).' });
    if (!company?.rut) issues.push({ level: 'warn', code: 'company.rut', message: 'Falta el RUT de la empresa.' });
    if (!formation.ready) issues.push({ level: 'info', code: 'formation.pending', message: `Constitución al ${formation.percent}%: ${formation.total - formation.done} paso(s) sin evidencia.` });
    if (summary.withoutEvidence > 0) issues.push({ level: 'warn', code: 'evidence.missing', message: `${summary.withoutEvidence} operación(es) del período sin documento ni evidencia asociada.` });
    if (summary.rejectedVat > 0) issues.push({ level: 'info', code: 'vat.rejected', message: `Hay IVA marcado como no recuperable en el período (${summary.rejectedVat}).` });

    const overdue = this.listObligations().filter(o => o.status !== 'done' && o.dueDate && o.dueDate < new Date().toISOString().slice(0, 10));
    if (overdue.length) issues.push({ level: 'error', code: 'obligations.overdue', message: `${overdue.length} obligación(es) vencida(s) sin comprobante.` });

    // Capital y patrimonio. Estas observaciones existen porque los huecos aquí
    // no se notan hasta que llega la patente o la Operación Renta.
    const capital = this.capitalPosition();
    for (const warning of capital.validation.warnings) {
      issues.push({ level: 'warn', code: 'capital.incomplete', message: warning });
    }
    if (capital.capitalPorEnterar > 0) {
      issues.push({
        level: 'info',
        code: 'capital.pending',
        message: `Quedan ${capital.capitalPorEnterar.toLocaleString('es-CL')} de capital suscrito sin enterar.`
      });
    }
    const municipal = this.getMunicipalProfile();
    if (!municipal.commune) {
      issues.push({ level: 'info', code: 'municipal.missing', message: 'Falta la comuna: sin ella no se puede identificar la municipalidad competente para la patente.' });
    } else if (municipal.status !== 'VERIFIED') {
      issues.push({
        level: 'info',
        code: 'municipal.rate',
        message: `La tasa de patente de ${municipal.commune} no está verificada: la patente que muestra la aplicación es una simulación.`
      });
    }
    const currentYear = Number(period.slice(0, 4));
    if (this.businessStageFor(currentYear) === 'ESTABLISHED_BUSINESS' && !this.getAnnualClose(currentYear - 1)) {
      issues.push({
        level: 'warn',
        code: 'annual-close.missing',
        message: `Sin el cierre anual ${currentYear - 1} no hay capital propio tributario con que determinar la base de la patente ${currentYear}.`
      });
    }

    const level = issues.some(i => i.level === 'error') ? 'error' : issues.some(i => i.level === 'warn') ? 'warn' : 'ok';
    return { period, level, issues, formation, summary };
  }
}

/**
 * Datos sintéticos del SANDBOX. Nunca se escriben en EMPRESA REAL.
 *
 * El caso es deliberadamente el más común y el peor modelado por las
 * herramientas contables: SpA de desarrollo de software, un accionista con el
 * 100 %, sin trabajadores, oficina virtual, capital moderado y un notebook
 * aportado en especie. Incluye las tres entradas de dinero del dueño que se ven
 * idénticas en la cartola y son distintas en el balance —aporte, préstamo y
 * venta— porque distinguirlas es justamente lo que la aplicación enseña.
 */
export function seedSandboxWorkspace(ws) {
  if (ws.mode !== 'sandbox') throw new Error('El sandbox sólo puede sembrarse en modo sandbox');
  if (ws.listTransactions().length > 0) return ws;

  ws.saveCompany({
    legalName: 'Empresa Demo SpA',
    fantasyName: 'Empresa Demo',
    rut: '76.000.000-0',
    owner: 'Persona Demo',
    taxRegime: 'Pro Pyme General (14 D N.º 3)',
    activity: 'Servicios de desarrollo de software',
    officeType: 'virtual',
    address: 'Oficina virtual demo',
    commune: 'Providencia',
    formationStatus: 'constituida'
  });

  // Capital societario: $3.000.000 en el estatuto, íntegramente suscritos por
  // el accionista único y sólo $1.000.000 enterados al partir. Las cifras son
  // distintas a propósito — es la situación real más frecuente y la que el
  // modelo anterior, con un solo campo `capital`, no podía representar.
  ws.saveCapitalProfile({
    capitalSocial: 3000000,
    capitalSuscrito: 3000000,
    capitalEnterado: 1000000,
    numeroAcciones: 3000,
    valorNominal: 1000,
    fechaConstitucion: '2026-06-15',
    fechaInicioActividades: '2026-07-01',
    accionistas: [{ name: 'Persona Demo', rut: '11.111.111-1', sharePercent: 100, capitalSuscrito: 3000000, capitalEnterado: 1000000 }]
  });

  ws.saveMunicipalProfile({
    commune: 'Providencia',
    municipalityId: 'cl-13123',
    initialOwnCapital: 1000000,
    notes: 'Tasa no verificada: el sandbox usa el mínimo legal como supuesto, igual que haría con una comuna real sin verificar.'
  });

  // Movimientos patrimoniales del ejercicio. El aporte en bienes y el préstamo
  // del accionista existen para que el CPT y el patrimonio contable no puedan
  // confundirse con el capital enterado.
  const equity = [
    { kind: 'initial_contribution', date: '2026-07-02', amount: 1000000, description: 'Aporte inicial del accionista único', evidenceRef: 'Estatuto + cartola 02-07' },
    {
      kind: 'asset_contribution',
      date: '2026-07-10',
      amount: 900000,
      description: 'Notebook aportado al capital',
      contributedBy: 'Persona Demo',
      assetType: 'Equipo computacional',
      assetDescription: 'Notebook 16 GB / 1 TB',
      bookValue: 900000,
      taxValue: 900000,
      evidenceRef: 'Acta de aporte 1'
    },
    { kind: 'shareholder_loan', date: '2026-09-05', amount: 500000, description: 'Préstamo del accionista para capital de trabajo', evidenceRef: 'Contrato de mutuo 1' },
    { kind: 'pending_capital_paid', date: '2026-10-01', amount: 500000, description: 'Se entera el saldo del capital suscrito', evidenceRef: 'Cartola 01-10' },
    { kind: 'withdrawal', date: '2026-11-20', amount: 150000, description: 'Retiro del accionista', evidenceRef: 'RET-1' }
  ];
  equity.forEach(m => ws.addEquityMovement(m, { registerCashMovement: true }));

  // El ejercicio completo, de julio a diciembre: hace falta un año cerrado para
  // que exista un CPT y para que se pueda ver de dónde sale la base de la
  // patente del período siguiente. Los aportes y retiros NO se repiten aquí:
  // los creó `addEquityMovement` y están enlazados, para no contarlos dos veces.
  const txs = [
    { date: '2026-07-10', kind: 'expense', description: 'Servicios cloud y hosting', net: 120000, vat: 22800, total: 142800, paid: true, documentType: 'Factura electrónica', documentNumber: '1201' },
    { date: '2026-07-12', kind: 'expense', description: 'Dominio y certificado', net: 40000, vat: 7600, total: 47600, paid: true, documentType: 'Factura electrónica', documentNumber: '1202' },
    // Compra con IVA al partir, antes de facturar: es lo que genera el
    // remanente de crédito fiscal que viaja a agosto. El notebook NO está aquí
    // — se aportó al capital, y un aporte en especie no es una compra con IVA.
    { date: '2026-07-14', kind: 'purchase', description: 'Equipamiento y licencias de desarrollo', net: 500000, vat: 95000, total: 595000, paid: true, documentType: 'Factura electrónica', documentNumber: '1203' },
    { date: '2026-07-18', kind: 'sale', description: 'Desarrollo de sitio web', net: 400000, vat: 76000, total: 476000, paid: true, documentType: 'Factura electrónica', documentNumber: '1' },
    { date: '2026-08-05', kind: 'sale', description: 'Servicio de desarrollo mensual', net: 800000, vat: 152000, total: 952000, paid: true, documentType: 'Factura electrónica', documentNumber: '2' },
    { date: '2026-08-08', kind: 'expense', description: 'Servicios cloud', net: 100000, vat: 19000, total: 119000, paid: true, documentType: 'Factura electrónica', documentNumber: '45' },
    { date: '2026-08-10', kind: 'expense', description: 'Oficina virtual (mensualidad)', net: 60000, vat: 11400, total: 71400, paid: true, documentType: 'Factura electrónica', documentNumber: 'OV-8' },
    { date: '2026-08-12', kind: 'honorarium', description: 'Asesoría contable puntual', net: 250000, vat: 0, total: 250000, paid: true, documentType: 'Boleta de honorarios', documentNumber: '77' },
    { date: '2026-08-15', kind: 'expense', description: 'Almuerzo con cliente', net: 60000, vat: 11400, total: 71400, paid: true, documentType: 'Boleta', vatCreditEligible: false, deductible: false },
    { date: '2026-09-08', kind: 'sale', description: 'Servicio de desarrollo mensual', net: 900000, vat: 171000, total: 1071000, paid: true, documentType: 'Factura electrónica', documentNumber: '3' },
    { date: '2026-09-10', kind: 'expense', description: 'Servicios cloud', net: 110000, vat: 20900, total: 130900, paid: true, documentType: 'Factura electrónica', documentNumber: '58' },
    { date: '2026-10-07', kind: 'sale', description: 'Integración con pasarela de pagos', net: 1200000, vat: 228000, total: 1428000, paid: true, documentType: 'Factura electrónica', documentNumber: '4' },
    { date: '2026-10-09', kind: 'expense', description: 'Servicios cloud y licencias', net: 180000, vat: 34200, total: 214200, paid: true, documentType: 'Factura electrónica', documentNumber: '71' },
    { date: '2026-11-06', kind: 'sale', description: 'Mantención mensual', net: 700000, vat: 133000, total: 833000, paid: true, documentType: 'Factura electrónica', documentNumber: '5' },
    { date: '2026-11-11', kind: 'expense', description: 'Oficina virtual (mensualidad)', net: 60000, vat: 11400, total: 71400, paid: true, documentType: 'Factura electrónica', documentNumber: 'OV-11' },
    { date: '2026-12-05', kind: 'sale', description: 'Desarrollo de módulo a medida', net: 1500000, vat: 285000, total: 1785000, paid: true, documentType: 'Factura electrónica', documentNumber: '6' },
    { date: '2026-12-09', kind: 'expense', description: 'Servicios cloud', net: 130000, vat: 24700, total: 154700, paid: true, documentType: 'Factura electrónica', documentNumber: '92' },
    { date: '2026-12-18', kind: 'tax_payment', description: 'Pago F29 noviembre', net: 120000, vat: 0, total: 120000, paid: true, documentNumber: 'F29-11' }
  ];
  txs.forEach(t => ws.addTransaction(t));

  ws.upsertObligation({ type: 'F29', period: '2026-07', dueDate: '2026-08-20', status: 'done', evidenceRef: 'Folio demo 123456789' });
  ws.upsertObligation({ type: 'F29', period: '2026-08', dueDate: '2026-09-21', status: 'pending' });
  ws.upsertObligation({ type: 'Patente municipal (1.ª cuota)', period: '2026', dueDate: '2026-07-31', status: 'pending' });
  ws.upsertObligation({ type: 'Declaración de capital propio a la municipalidad', period: '2027', dueDate: '2027-05-31', status: 'pending' });

  return ws;
}
