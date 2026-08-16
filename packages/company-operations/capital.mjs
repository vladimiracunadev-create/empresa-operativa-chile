/**
 * Modelo societario de capital: qué se acordó, qué se comprometió y qué llegó.
 *
 * La razón de existir de este archivo es una distinción que la versión anterior
 * de la aplicación no hacía. Había un solo campo `capital`, rotulado “capital
 * enterado”, y ese mismo número se usaba para estimar la patente municipal. Eso
 * trata como sinónimos cinco magnitudes que no lo son:
 *
 *   capital social      lo que dice el estatuto
 *   capital suscrito    lo que el accionista se comprometió a aportar
 *   capital enterado    lo que efectivamente entró
 *   patrimonio contable activos − pasivos según la contabilidad
 *   capital propio trib. activo − pasivo exigible a valores tributarios
 *
 * Ninguna se deriva de otra sin más información. Este módulo modela las tres
 * primeras y los movimientos que las mueven; el CPT vive en el motor contable.
 *
 * Módulo puro: sin `node:*`.
 */

const money = n => Math.round(Number(n || 0));

/** Marca de un campo que la aplicación no puede conocer y el usuario debe confirmar. */
export const PENDING_CONFIRMATION = 'PENDING_CONFIRMATION';

/**
 * Estado de respaldo de una cifra. Mostrar un número sin su estado es lo que
 * hace que una estimación interna se lea como un hecho acreditado.
 */
export const DATA_STATUS = Object.freeze([
  { id: 'ESTIMADO', label: 'Estimado', hint: 'Supuesto de trabajo; faltan datos o confirmación.' },
  { id: 'CALCULADO', label: 'Calculado', hint: 'Lo produjo el motor con los datos registrados.' },
  { id: 'DECLARADO', label: 'Declarado', hint: 'Se presentó ante un organismo (SII o municipalidad).' },
  { id: 'VERIFICADO', label: 'Verificado', hint: 'Contrastado contra la fuente oficial.' },
  { id: 'PAGADO', label: 'Pagado', hint: 'Existe comprobante de pago.' }
]);

export const DATA_STATUS_IDS = Object.freeze(DATA_STATUS.map(x => x.id));

/**
 * Origen de una cifra. Existe para dejar preparada la integración con el SII y
 * las municipalidades sin fingir que ya está conectada.
 */
export const DATA_ORIGIN = Object.freeze([
  { id: 'usuario', label: 'Ingresado por el usuario' },
  { id: 'calculado', label: 'Calculado por la aplicación' },
  { id: 'importado', label: 'Importado desde un archivo' },
  { id: 'sii', label: 'Verificado en el SII' },
  { id: 'municipalidad', label: 'Verificado en la municipalidad' }
]);

export const DATA_ORIGIN_IDS = Object.freeze(DATA_ORIGIN.map(x => x.id));

/**
 * Movimientos patrimoniales y de financiamiento del accionista.
 *
 * `equityEffect` dice qué le hace al patrimonio; `liabilityEffect`, al pasivo
 * exigible. Un aporte y un préstamo entran igual por el banco y son opuestos
 * aquí: por eso la aplicación obliga a elegir y no adivina.
 */
export const EQUITY_MOVEMENT_KINDS = Object.freeze([
  {
    id: 'initial_contribution',
    label: 'Aporte inicial',
    group: 'capital',
    equityEffect: 1,
    liabilityEffect: 0,
    entersCapital: true,
    hint: 'Primer aporte con que se entera el capital suscrito al constituir la sociedad.'
  },
  {
    id: 'additional_contribution',
    label: 'Aporte de capital posterior',
    group: 'capital',
    equityEffect: 1,
    liabilityEffect: 0,
    entersCapital: true,
    hint: 'Aporte hecho después de la constitución, a título de capital.'
  },
  {
    id: 'pending_capital_paid',
    label: 'Capital pendiente enterado',
    group: 'capital',
    equityEffect: 1,
    liabilityEffect: 0,
    entersCapital: true,
    hint: 'Pago de capital que estaba suscrito y pendiente. No aumenta el capital social: lo entera.'
  },
  {
    id: 'capital_increase',
    label: 'Aumento de capital (acuerdo societario)',
    group: 'societario',
    equityEffect: 0,
    liabilityEffect: 0,
    entersCapital: false,
    changesShareCapital: 1,
    hint: 'Modificación del estatuto que eleva el capital social. Por sí sola no mueve dinero.'
  },
  {
    id: 'capital_decrease',
    label: 'Disminución de capital',
    group: 'societario',
    equityEffect: -1,
    liabilityEffect: 0,
    entersCapital: false,
    changesShareCapital: -1,
    hint: 'Reduce el capital social y, cuando hay devolución efectiva, también el patrimonio.'
  },
  {
    id: 'asset_contribution',
    label: 'Aporte en bienes',
    group: 'capital',
    equityEffect: 1,
    liabilityEffect: 0,
    entersCapital: true,
    requiresAsset: true,
    hint: 'Notebook, servidores, mobiliario, derechos. Se entera capital sin que entre dinero.'
  },
  {
    id: 'shareholder_loan',
    label: 'Préstamo del accionista a la empresa',
    group: 'financiamiento',
    equityEffect: 0,
    liabilityEffect: 1,
    entersCapital: false,
    hint: 'La empresa queda debiendo. Es pasivo exigible: NO es capital y reduce el capital propio tributario.'
  },
  {
    id: 'shareholder_loan_repayment',
    label: 'Devolución del préstamo al accionista',
    group: 'financiamiento',
    equityEffect: 0,
    liabilityEffect: -1,
    entersCapital: false,
    hint: 'Cancela la deuda con el accionista. No es retiro ni gasto.'
  },
  {
    id: 'withdrawal',
    label: 'Retiro / distribución al accionista',
    group: 'patrimonio',
    equityEffect: -1,
    liabilityEffect: 0,
    entersCapital: false,
    hint: 'Reduce el patrimonio, no el resultado. Se resta al determinar el CPT simplificado.'
  }
]);

export const EQUITY_MOVEMENT_IDS = Object.freeze(EQUITY_MOVEMENT_KINDS.map(k => k.id));

const KIND = new Map(EQUITY_MOVEMENT_KINDS.map(k => [k.id, k]));

/** Metadatos de un tipo de movimiento patrimonial. */
export function equityMovementKind(id) {
  return KIND.get(String(id)) ?? null;
}

/**
 * Naturalezas posibles cuando el dueño entrega dinero a la empresa.
 *
 * La aplicación las ofrece como pregunta obligatoria en vez de registrar todo
 * depósito del dueño como capital: la cartola bancaria no distingue, pero el
 * balance, el CPT y la patente sí.
 */
export const OWNER_MONEY_NATURES = Object.freeze([
  { id: 'additional_contribution', label: 'Aporte de capital', effect: 'Aumenta el patrimonio y el capital enterado.' },
  { id: 'shareholder_loan', label: 'Préstamo del accionista', effect: 'Aumenta el pasivo exigible. No es capital.' },
  { id: 'sale', label: 'Ingreso operacional', effect: 'Es una venta: aumenta el resultado y puede llevar IVA.' },
  { id: 'other', label: 'Otro', effect: 'Requiere definirse antes de registrarse.' }
]);

/** Tipos de bien admitidos en un aporte no monetario. */
export const CONTRIBUTED_ASSET_TYPES = Object.freeze([
  'Equipo computacional',
  'Servidor / infraestructura',
  'Mobiliario',
  'Vehículo',
  'Software o licencias',
  'Derechos',
  'Otro'
]);

/* ------------------------------------------------------------------ */
/* Ficha de capital                                                     */
/* ------------------------------------------------------------------ */

/**
 * Normaliza la ficha de capital de una empresa, migrando el modelo antiguo.
 *
 * Compatibilidad hacia atrás, que es lo que hace que los datos existentes no se
 * rompan: si la ficha guardada sólo tenía `capital`, esa cifra pasa a
 * `capitalEnterado` —que es lo que el campo rotulaba— y `capitalSocial` y
 * `capitalSuscrito` quedan marcados `PENDING_CONFIRMATION`. No se inventan:
 * la aplicación no sabe cuánto declaró el estatuto, y suponerlo igual al
 * enterado sería exactamente el error que este trabajo viene a corregir.
 */
export function normalizeCapitalProfile(company = {}) {
  const raw = company?.capitalProfile ?? {};
  const legacy = company?.capital;
  const migratedFromLegacy = raw.capitalEnterado === undefined && legacy !== undefined && legacy !== null && legacy !== '';

  const enterado = raw.capitalEnterado !== undefined ? money(raw.capitalEnterado) : migratedFromLegacy ? money(legacy) : 0;

  const pending = new Set(raw.pendingConfirmation ?? []);
  if (migratedFromLegacy) {
    for (const field of ['capitalSocial', 'capitalSuscrito']) {
      if (raw[field] === undefined || raw[field] === null) pending.add(field);
    }
  }

  const social = raw.capitalSocial === undefined || raw.capitalSocial === null ? null : money(raw.capitalSocial);
  const suscrito = raw.capitalSuscrito === undefined || raw.capitalSuscrito === null ? null : money(raw.capitalSuscrito);

  return {
    capitalSocial: social,
    capitalSuscrito: suscrito,
    capitalEnterado: enterado,
    numeroAcciones: raw.numeroAcciones ? Number(raw.numeroAcciones) : null,
    valorNominal: raw.valorNominal === undefined || raw.valorNominal === null ? null : money(raw.valorNominal),
    accionistas: Array.isArray(raw.accionistas) ? raw.accionistas.map(normalizeShareholder) : [],
    fechaConstitucion: raw.fechaConstitucion || null,
    fechaInicioActividades: raw.fechaInicioActividades || null,
    pendingConfirmation: [...pending].sort(),
    migratedFromLegacyCapital: Boolean(raw.migratedFromLegacyCapital || migratedFromLegacy),
    updatedAt: raw.updatedAt ?? null
  };
}

function normalizeShareholder(s = {}) {
  return {
    name: String(s.name || '').trim(),
    rut: s.rut || null,
    sharePercent: s.sharePercent === undefined || s.sharePercent === null ? null : Number(s.sharePercent),
    acciones: s.acciones ? Number(s.acciones) : null,
    capitalSuscrito: s.capitalSuscrito === undefined || s.capitalSuscrito === null ? null : money(s.capitalSuscrito),
    capitalEnterado: s.capitalEnterado === undefined || s.capitalEnterado === null ? null : money(s.capitalEnterado)
  };
}

/**
 * Capital por enterar. Deliberadamente devuelve `null` —y no cero— cuando el
 * capital suscrito no se conoce: cero significaría “no falta nada”, y eso es
 * una afirmación que aquí nadie puede hacer.
 */
export function capitalPendingToPay(profile) {
  const p = profile ?? {};
  if (p.capitalSuscrito === null || p.capitalSuscrito === undefined) return null;
  return Math.max(0, money(p.capitalSuscrito) - money(p.capitalEnterado));
}

/**
 * Validaciones societarias.
 *
 * Devuelve `errors` (impiden guardar) y `warnings` (se muestran pero no
 * bloquean, porque hay situaciones reales que se ven mal y son correctas).
 */
export function validateCapitalProfile(profile) {
  const p = profile ?? {};
  const errors = [];
  const warnings = [];

  for (const [field, label] of [
    ['capitalSocial', 'capital social'],
    ['capitalSuscrito', 'capital suscrito'],
    ['capitalEnterado', 'capital enterado']
  ]) {
    const value = p[field];
    if (value === null || value === undefined) continue;
    if (!Number.isFinite(Number(value))) errors.push(`El ${label} debe ser un número.`);
    else if (Number(value) < 0) errors.push(`El ${label} no puede ser negativo.`);
  }

  const social = p.capitalSocial;
  const suscrito = p.capitalSuscrito;
  const enterado = money(p.capitalEnterado);

  if (social !== null && social !== undefined && suscrito !== null && suscrito !== undefined && money(suscrito) > money(social)) {
    errors.push('El capital suscrito no puede superar al capital social sin una modificación societaria que lo respalde.');
  }
  if (suscrito !== null && suscrito !== undefined && enterado > money(suscrito)) {
    errors.push(
      'El capital enterado supera al suscrito. Si hubo un aporte adicional, primero registra el aumento de capital o corrige el capital suscrito.'
    );
  }
  if (p.fechaInicioActividades && p.fechaConstitucion && p.fechaInicioActividades < p.fechaConstitucion) {
    errors.push('El inicio de actividades no puede ser anterior a la fecha de constitución.');
  }

  const share = p.accionistas?.reduce((a, s) => a + Number(s.sharePercent || 0), 0) ?? 0;
  if (p.accionistas?.length && Math.abs(share - 100) > 0.01) {
    warnings.push(`La participación de los accionistas suma ${share.toLocaleString('es-CL')} % en vez de 100 %.`);
  }
  if ((p.pendingConfirmation ?? []).length) {
    warnings.push(
      `Falta confirmar: ${p.pendingConfirmation.join(', ')}. Se migraron desde el campo “capital” antiguo y la aplicación no puede deducirlos.`
    );
  }
  if ((p.capitalSocial === null || p.capitalSocial === undefined) && enterado > 0) {
    warnings.push('No hay capital social declarado. La patente inicial se estimará sobre el capital enterado, que puede no ser la base correcta.');
  }
  if (!p.fechaConstitucion) warnings.push('Sin fecha de constitución no se puede determinar qué ejercicio es el primero.');

  return { valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Movimientos                                                          */
/* ------------------------------------------------------------------ */

/** Valida y normaliza un movimiento patrimonial antes de guardarlo. */
export function normalizeEquityMovement(movement = {}) {
  const kind = equityMovementKind(movement.kind);
  if (!kind) throw new Error(`Tipo de movimiento patrimonial no soportado: ${movement.kind}`);
  if (!movement.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(movement.date))) {
    throw new Error('Todo movimiento societario exige su fecha (YYYY-MM-DD).');
  }
  const amount = money(movement.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('El monto del movimiento debe ser mayor que cero.');

  if (kind.requiresAsset) {
    if (!String(movement.assetDescription || '').trim()) throw new Error('Un aporte en bienes exige describir el bien aportado.');
    if (!String(movement.contributedBy || '').trim()) throw new Error('Un aporte en bienes exige identificar al accionista aportante.');
  }

  return {
    kind: kind.id,
    date: String(movement.date),
    amount,
    description: String(movement.description || '').trim(),
    contributedBy: movement.contributedBy ? String(movement.contributedBy).trim() : null,
    assetType: movement.assetType || null,
    assetDescription: movement.assetDescription ? String(movement.assetDescription).trim() : null,
    bookValue: movement.bookValue === undefined || movement.bookValue === null || movement.bookValue === '' ? null : money(movement.bookValue),
    taxValue: movement.taxValue === undefined || movement.taxValue === null || movement.taxValue === '' ? null : money(movement.taxValue),
    evidenceRef: movement.evidenceRef ? String(movement.evidenceRef).trim() : '',
    status: DATA_STATUS_IDS.includes(movement.status) ? movement.status : 'DECLARADO',
    origin: DATA_ORIGIN_IDS.includes(movement.origin) ? movement.origin : 'usuario'
  };
}

/**
 * Agrega los movimientos hasta una fecha de corte.
 *
 * `capitalEnteradoPorMovimientos` sólo cuenta los tipos que efectivamente
 * enteran capital; un préstamo del accionista entra por el mismo banco y no
 * suma un peso aquí.
 */
export function summarizeEquityMovements(movements = [], { until } = {}) {
  const rows = movements.filter(m => !until || String(m.date) <= String(until));
  const by = id => rows.filter(m => m.kind === id).reduce((a, m) => a + money(m.amount), 0);

  const capitalEnterado = rows
    .filter(m => equityMovementKind(m.kind)?.entersCapital)
    .reduce((a, m) => a + money(m.amount), 0);

  const shareholderDebt = by('shareholder_loan') - by('shareholder_loan_repayment');

  return {
    count: rows.length,
    capitalEnteradoPorMovimientos: capitalEnterado,
    aporteInicial: by('initial_contribution'),
    aportesPosteriores: by('additional_contribution') + by('pending_capital_paid'),
    aportesEnBienes: by('asset_contribution'),
    aumentosDeCapital: by('capital_increase'),
    disminucionesDeCapital: by('capital_decrease'),
    prestamosDelAccionista: by('shareholder_loan'),
    devolucionesDePrestamo: by('shareholder_loan_repayment'),
    deudaConAccionista: Math.max(0, shareholderDebt),
    retiros: by('withdrawal'),
    sinEvidencia: rows.filter(m => !String(m.evidenceRef || '').trim()).length
  };
}
