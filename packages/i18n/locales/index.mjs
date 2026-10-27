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
