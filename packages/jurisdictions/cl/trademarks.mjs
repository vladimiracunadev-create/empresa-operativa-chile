export const CHILE_TRADEMARK_SOURCES = Object.freeze({
  inapi: 'https://www.inapi.cl/marcas/para-informarse',
  res: 'https://www.registrodeempresasysociedades.cl/FAQ.aspx?seccion=5'
});

export function trademarkChecklist({ sign = '', classes = [], domain = '', applicationEvidence = null, registrationDate = null } = {}) {
  const hasRegistration = Boolean(applicationEvidence && registrationDate);
  return {
    sign: String(sign).trim(), classes: [...classes], domain: String(domain).trim(),
    domainProtectsTrademark: false,
    status: hasRegistration ? 'REQUIRES_VERIFICATION' : 'PENDING',
    renewal: hasRegistration
      ? { frequencyYears: 10, nextDate: null, reason: 'Calcular y confirmar la vigencia exacta con el título y el portal INAPI antes de actuar.' }
      : { frequencyYears: 10, nextDate: null, reason: 'Sin título y fecha verificados no se calcula una renovación.' },
    steps: ['Buscar signos similares en INAPI', 'Definir productos/servicios y clases', 'Registrar solicitud y comprobante', 'Guardar título y fechas', 'Revisar renovación en el portal oficial'],
    sources: CHILE_TRADEMARK_SOURCES,
    warning: 'Constituir una sociedad o registrar un dominio no otorga por sí solo protección marcaria.'
  };
}

