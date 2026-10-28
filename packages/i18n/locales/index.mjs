export const SUPPORTED_LOCALES = Object.freeze(['es-CL', 'es-PE', 'es-MX', 'es-CO', 'es-AR', 'pt-BR', 'es-ES', 'en']);

const messages = Object.freeze({
  'es-CL': { requiresVerification: 'Requiere verificacion', noActivity: 'Sin actividad', noMovement: 'Sin movimiento', notApplicable: 'No aplica', simulation: 'Simulacion', evidence: 'Evidencia', officialPortalWarning: 'Confirma siempre en el portal oficial.' },
  'es-PE': { requiresVerification: 'Requiere verificacion', noActivity: 'Sin actividad', noMovement: 'Sin movimiento', notApplicable: 'No aplica', simulation: 'Simulacion', evidence: 'Evidencia', officialPortalWarning: 'Confirma siempre en el portal oficial.' },
  'es-MX': { requiresVerification: 'Requiere verificacion', noActivity: 'Sin actividad', noMovement: 'Sin movimiento', notApplicable: 'No aplica', simulation: 'Simulacion', evidence: 'Evidencia', officialPortalWarning: 'Confirma siempre en el portal oficial.' },
  'es-CO': { requiresVerification: 'Requiere verificacion', noActivity: 'Sin actividad', noMovement: 'Sin movimiento', notApplicable: 'No aplica', simulation: 'Simulacion', evidence: 'Evidencia', officialPortalWarning: 'Confirma siempre en el portal oficial.' },
  'es-AR': { requiresVerification: 'Requiere verificacion', noActivity: 'Sin actividad', noMovement: 'Sin movimiento', notApplicable: 'No aplica', simulation: 'Simulacion', evidence: 'Evidencia', officialPortalWarning: 'Confirma siempre en el portal oficial.' },
  'pt-BR': { requiresVerification: 'Requer verificacao', noActivity: 'Sem atividade', noMovement: 'Sem movimento', notApplicable: 'Nao se aplica', simulation: 'Simulacao', evidence: 'Evidencia', officialPortalWarning: 'Confirme sempre no portal oficial.' },
  'es-ES': { requiresVerification: 'Requiere verificacion', noActivity: 'Sin actividad', noMovement: 'Sin movimiento', notApplicable: 'No aplica', simulation: 'Simulacion', evidence: 'Evidencia', officialPortalWarning: 'Confirma siempre en la sede oficial.' },
  en: { requiresVerification: 'Requires verification', noActivity: 'No activity', noMovement: 'No movement', notApplicable: 'Not applicable', simulation: 'Simulation', evidence: 'Evidence', officialPortalWarning: 'Always confirm on the official portal.' }
});

export function getMessages(locale) {
  const canonical = Intl.getCanonicalLocales(locale)[0];
  const dictionary = messages[canonical];
  if (!dictionary) throw new Error(`Locale no soportado: ${canonical}`);
  return dictionary;
}

export function createTranslator(locale) {
  const dictionary = getMessages(locale);
  return key => {
    if (!(key in dictionary)) throw new Error(`Mensaje no definido: ${key}`);
    return dictionary[key];
  };
}

export function formatPlural(count, { locale, one, other }) {
  if (!Number.isFinite(Number(count))) throw new Error('count debe ser numerico');
  const category = new Intl.PluralRules(locale).select(Number(count));
  const template = category === 'one' ? one : other;
  if (typeof template !== 'string' || !template.includes('{count}')) throw new Error('Los mensajes plurales deben incluir {count}');
  return template.replaceAll('{count}', new Intl.NumberFormat(locale).format(Number(count)));
}

const contextualGlossary = Object.freeze({
  'es-CL': { taxAuthority: 'Servicio de Impuestos Internos (SII)', businessIdentifier: 'Rol Único Tributario (RUT)', initialTaxRegistration: 'Inicio de Actividades' },
  'es-PE': { taxAuthority: 'Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT)', businessIdentifier: 'Registro Único de Contribuyentes (RUC)', initialTaxRegistration: 'Inscripción en el RUC' },
  'es-MX': { taxAuthority: 'Servicio de Administración Tributaria (SAT)', businessIdentifier: 'Registro Federal de Contribuyentes (RFC)', initialTaxRegistration: 'Inscripción en el RFC' },
  'es-CO': { taxAuthority: 'Dirección de Impuestos y Aduanas Nacionales (DIAN)', businessIdentifier: 'Registro Único Tributario (RUT)', initialTaxRegistration: 'Inscripción en el RUT' },
  'es-AR': { taxAuthority: 'Agencia de Recaudación y Control Aduanero (ARCA)', businessIdentifier: 'Clave Única de Identificación Tributaria (CUIT)', initialTaxRegistration: 'Alta tributaria aplicable' },
  'pt-BR': { taxAuthority: 'Receita Federal', businessIdentifier: 'Cadastro Nacional da Pessoa Jurídica (CNPJ)', initialTaxRegistration: 'Inscrição no CNPJ' },
  'es-ES': { taxAuthority: 'Agencia Estatal de Administración Tributaria (AEAT)', businessIdentifier: 'Número de Identificación Fiscal (NIF)', initialTaxRegistration: 'Declaración censal aplicable' },
  en: { taxAuthority: 'Tax authority for the selected jurisdiction', businessIdentifier: 'Jurisdiction-specific business identifier', initialTaxRegistration: 'Applicable initial tax registration' }
});

export function getContextualGlossary(locale) {
  const canonical = Intl.getCanonicalLocales(locale)[0];
  getMessages(canonical);
  return contextualGlossary[canonical];
}

export function getStructuredMessages(locale) {
  const status = getMessages(locale);
  return Object.freeze({
    status,
    errors: Object.freeze({ missingEvidence: `${status.requiresVerification}: ${status.evidence}`, officialPortal: status.officialPortalWarning }),
    accessibility: Object.freeze({ statusPrefix: status.requiresVerification, simulationPrefix: status.simulation })
  });
}

export function formatMoney(amount, { locale, currency }) {
  if (!Number.isFinite(Number(amount))) throw new Error('amount debe ser numerico');
  if (!/^[A-Z]{3}$/.test(String(currency))) throw new Error('currency debe ser ISO 4217');
  getMessages(locale);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount));
}

export function formatLocalDate(value, { locale, timeZone }) {
  getMessages(locale);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Fecha invalida');
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(date);
}
