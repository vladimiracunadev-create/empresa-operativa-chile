import { projectObligationCost } from '../../core/obligations.mjs';

const SII = 'https://www.sii.cl/';
const INAPI = 'https://www.inapi.cl/marcas/para-informarse';

const base = (id, label, frequency, sourceUrl, sourceTitle, portalUrl, evidenceRequired, failureRecovery, trigger = null) =>
  Object.freeze({ id, label, country: 'CL', subdivision: null, frequency, trigger, nextDueDate: null, sourceUrl, sourceTitle, portalUrl, checkedAt: '2026-10-27', evidenceRequired, failureRecovery });

export const CHILE_OBLIGATION_CATALOG = Object.freeze([
  base('cl.inapi.application', 'Solicitud de marca INAPI', 'ONE_TIME', INAPI, 'INAPI · Marcas', INAPI, 'Comprobante de solicitud y expediente', 'Conservar el error y revisar el expediente en INAPI; no asumir rectificación universal.', 'Sólo si la empresa decide solicitar protección marcaria.'),
  base('cl.f29', 'Formulario 29 según perfil tributario', 'MONTHLY', 'https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_1964.htm', 'SII · Declaración mensual', SII, 'Folio o certificado de declaración', 'Confirmar estado y opciones vigentes directamente en SII.', 'Inicio de actividades y obligaciones del perfil verificados.'),
  base('cl.bank.account', 'Cuenta bancaria empresarial', 'MONTHLY', SII, 'Política contractual, no obligación tributaria universal', SII, 'Cartola y contrato bancario local', 'Contactar al banco; la aplicación no ejecuta cobros.', 'Sólo cuando exista una cuenta y su contrato cobre mantención.'),
  base('cl.virtual.office', 'Oficina virtual o domicilio contratado', 'MONTHLY', 'https://www.registrodeempresasysociedades.cl/FAQ.aspx?seccion=5', 'RES · Domicilio social', 'https://www.registrodeempresasysociedades.cl/', 'Contrato, factura y comprobante de pago', 'Contactar al proveedor y revisar efectos societarios/tributarios con profesional.', 'Sólo cuando exista contrato vigente.'),
  base('cl.dj', 'Declaración jurada según obligación concreta', 'CONDITIONAL', SII, 'SII · Declaraciones juradas', SII, 'Folio de la declaración aplicable', 'Revisar calendario y procedimiento de la DJ específica en SII.', 'Perfil, hechos y declaración específica verificados.'),
  base('cl.patent', 'Patente municipal', 'SEMIANNUAL', 'https://www.bcn.cl/leychile/navegar?idNorma=18967', 'DL 3.063 · Rentas municipales', 'https://www.chileatiende.gob.cl/', 'Comprobante municipal y certificado', 'Consultar a la municipalidad competente; tasa y calendario varían.', 'Actividad, comuna, base y tasa municipal verificadas.'),
  base('cl.f22', 'Declaración anual de renta F22 según perfil', 'ANNUAL', SII, 'SII · Operación Renta', SII, 'Folio o certificado de declaración', 'Confirmar estado y rectificación aplicable en SII y con contador.', 'Obligación anual concreta verificada.'),
  base('cl.inapi.renewal', 'Renovación de marca INAPI', 'DECENNIAL', 'https://www.inapi.cl/marcas/tramites/renovacion', 'INAPI · Renovación de marcas', 'https://www.inapi.cl/marcas/tramites/renovacion', 'Título, comprobante y nueva vigencia', 'Verificar plazo exacto y opciones en INAPI antes de actuar.', 'Sólo con título y fecha de vigencia verificados.')
]);

export const CHILE_CAPITAL_CONCEPTS = Object.freeze([
  { id: 'social_capital', label: 'Capital social', isExpense: false, isBankDeposit: false, description: 'Monto pactado en los documentos societarios.' },
  { id: 'bank_deposit', label: 'Depósito bancario', isExpense: false, isCapitalByItself: false, description: 'Movimiento de caja; requiere identificar su causa.' },
  { id: 'capital_disbursement', label: 'Desembolso o aporte enterado', isExpense: false, isBankDeposit: 'POSSIBLE', description: 'Cumplimiento del aporte, con evidencia y trazabilidad.' },
  { id: 'business_expense', label: 'Gasto empresarial', isCapital: false, description: 'Consumo o servicio del negocio; no equivale a aporte.' }
]);

export function projectChileObligations(overrides = {}) {
  return CHILE_OBLIGATION_CATALOG.map(definition => projectObligationCost(definition, overrides[definition.id] ?? {}));
}
