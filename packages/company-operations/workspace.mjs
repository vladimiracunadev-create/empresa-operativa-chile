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

const isoNow = () => new Date().toISOString();
const money = n => Math.round(Number(n || 0));

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
    const cashIn = rows.filter(x => ['sale', 'capital'].includes(x.kind)).reduce((a, x) => a + money(x.total), 0);
    const cashOut = rows
      .filter(x => ['purchase', 'expense', 'honorarium', 'owner_withdrawal', 'tax_payment'].includes(x.kind))
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
      formatVersion: 1,
      mode: this.mode,
      exportedAt: isoNow(),
      company: this.getCompany(),
      formation: this.store.read(KEY.formation, []),
      transactions: this.listTransactions(),
      obligations: this.listObligations(),
      closedPeriods: this.listClosedPeriods(),
      periodCloses: this.listPeriodCloses(),
      audit: this.listAudit()
    };
  }

  /**
   * Importa un respaldo. `replace` decide si se sustituye el contenido o se
   * fusionan las operaciones por id.
   */
  importAll(payload, { replace = true } = {}) {
    if (payload?.format !== 'empresa-operativa-chile/backup') throw new Error('El archivo no es un respaldo válido de esta aplicación');
    if (payload.formatVersion !== 1) throw new Error(`Versión de respaldo no soportada: ${payload.formatVersion}`);

    if (replace) {
      this.store.write(KEY.company, payload.company ?? null);
      this.store.write(KEY.formation, payload.formation ?? []);
      this.store.write(KEY.transactions, payload.transactions ?? []);
      this.store.write(KEY.obligations, payload.obligations ?? []);
      this.store.write(KEY.closedPeriods, payload.closedPeriods ?? []);
      this.store.write(KEY.periodCloses, payload.periodCloses ?? []);
    } else {
      const byId = new Map(this.listTransactions().map(t => [t.id, t]));
      for (const t of payload.transactions ?? []) byId.set(t.id, t);
      this.store.write(KEY.transactions, [...byId.values()].sort((a, b) => a.date.localeCompare(b.date)));
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

    const level = issues.some(i => i.level === 'error') ? 'error' : issues.some(i => i.level === 'warn') ? 'warn' : 'ok';
    return { period, level, issues, formation, summary };
  }
}

/** Datos sintéticos del SANDBOX. Nunca se escriben en EMPRESA REAL. */
export function seedSandboxWorkspace(ws) {
  if (ws.mode !== 'sandbox') throw new Error('El sandbox sólo puede sembrarse en modo sandbox');
  if (ws.listTransactions().length > 0) return ws;

  ws.saveCompany({
    legalName: 'Empresa Demo SpA',
    fantasyName: 'Empresa Demo',
    rut: '76.000.000-0',
    owner: 'Persona Demo',
    taxRegime: 'Pro Pyme General',
    officeType: 'virtual',
    address: 'Oficina virtual demo',
    formationStatus: 'constituida'
  });

  // Dos meses en vez de uno: el segundo mes es el que permite ver el remanente
  // de crédito fiscal viajando de un período al siguiente.
  const txs = [
    { date: '2026-07-02', kind: 'capital', description: 'Aporte inicial del accionista', net: 1000000, vat: 0, total: 1000000, paid: true, documentNumber: 'APORTE-1' },
    { date: '2026-07-10', kind: 'expense', description: 'Notebook de trabajo', net: 900000, vat: 171000, total: 1071000, paid: true, documentType: 'Factura electrónica', documentNumber: '1201' },
    { date: '2026-07-18', kind: 'sale', description: 'Desarrollo de sitio web', net: 400000, vat: 76000, total: 476000, paid: true, documentType: 'Factura electrónica', documentNumber: '1' },
    { date: '2026-08-05', kind: 'sale', description: 'Servicio de desarrollo mensual', net: 800000, vat: 152000, total: 952000, paid: true, documentType: 'Factura electrónica', documentNumber: '2' },
    { date: '2026-08-08', kind: 'expense', description: 'Servicios cloud', net: 100000, vat: 19000, total: 119000, paid: true, documentType: 'Factura electrónica', documentNumber: '45' },
    { date: '2026-08-12', kind: 'honorarium', description: 'Asesoría contable puntual', net: 250000, vat: 0, total: 250000, paid: true, documentType: 'Boleta de honorarios', documentNumber: '77' },
    { date: '2026-08-15', kind: 'expense', description: 'Almuerzo con cliente', net: 60000, vat: 11400, total: 71400, paid: true, documentType: 'Boleta', vatCreditEligible: false, deductible: false },
    { date: '2026-08-20', kind: 'owner_withdrawal', description: 'Retiro del accionista', net: 150000, vat: 0, total: 150000, paid: true, documentNumber: 'RET-1' }
  ];
  txs.forEach(t => ws.addTransaction(t));

  ws.upsertObligation({ type: 'F29', period: '2026-07', dueDate: '2026-08-20', status: 'done', evidenceRef: 'Folio demo 123456789' });
  ws.upsertObligation({ type: 'F29', period: '2026-08', dueDate: '2026-09-21', status: 'pending' });

  return ws;
}
