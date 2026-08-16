/**
 * Maestro municipal extensible.
 *
 * Regla de la casa, y la razón de que este archivo exista: **ninguna comuna
 * viene con una tasa inventada**. El D.L. 3.063 fija un RANGO (2,5‰ a 5‰) y
 * cada municipalidad elige su tasa dentro de él por ordenanza. Publicar aquí
 * una tabla nacional de tasas sería fabricar treinta y tantas cifras que nadie
 * verificó, y el usuario las leería como si fueran la boleta.
 *
 * Por eso el catálogo trae identidad (comuna, región, enlace de trámites) y
 * deja `patentRate: null` con `status: 'UNVERIFIED'`. La tasa la aporta el
 * usuario desde la aplicación, junto con su fuente y la fecha en que la
 * verificó, y queda guardada en su espacio de trabajo — no aquí.
 *
 * Módulo puro: sin `node:*`. Viaja al navegador, al APK y a Windows.
 */

/** Estados posibles de la tasa de una municipalidad. */
export const RATE_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  UNVERIFIED: 'UNVERIFIED'
});

const m = (municipalityId, name, commune, region, requirementsUrl = null) =>
  Object.freeze({
    municipalityId,
    name,
    commune,
    region,
    patentRate: null,
    rateSource: null,
    effectiveFrom: null,
    effectiveTo: null,
    requirementsUrl,
    lastVerified: null,
    status: RATE_STATUS.UNVERIFIED
  });

/**
 * Catálogo base. Sólo identidad: ni una sola tasa.
 *
 * No pretende ser el listado completo de las 345 comunas de Chile; es el punto
 * de partida para las más consultadas y el ejemplo de la forma que debe tener
 * cualquier entrada añadida después.
 */
export const MUNICIPALITIES = Object.freeze([
  m('cl-13101', 'Ilustre Municipalidad de Santiago', 'Santiago', 'Metropolitana de Santiago', 'https://www.munistgo.cl/'),
  m('cl-13123', 'Ilustre Municipalidad de Providencia', 'Providencia', 'Metropolitana de Santiago', 'https://www.providencia.cl/'),
  m('cl-13114', 'Ilustre Municipalidad de Las Condes', 'Las Condes', 'Metropolitana de Santiago', 'https://www.lascondes.cl/'),
  m('cl-13132', 'Ilustre Municipalidad de Vitacura', 'Vitacura', 'Metropolitana de Santiago', 'https://www.vitacura.cl/'),
  m('cl-13119', 'Ilustre Municipalidad de Ñuñoa', 'Ñuñoa', 'Metropolitana de Santiago', 'https://www.nunoa.cl/'),
  m('cl-13108', 'Ilustre Municipalidad de La Florida', 'La Florida', 'Metropolitana de Santiago', 'https://www.laflorida.cl/'),
  m('cl-13122', 'Ilustre Municipalidad de Maipú', 'Maipú', 'Metropolitana de Santiago', 'https://www.maipu.cl/'),
  m('cl-13110', 'Ilustre Municipalidad de La Reina', 'La Reina', 'Metropolitana de Santiago', 'https://www.lareina.cl/'),
  m('cl-05101', 'Ilustre Municipalidad de Valparaíso', 'Valparaíso', 'Valparaíso', 'https://www.municipalidaddevalparaiso.cl/'),
  m('cl-05109', 'Ilustre Municipalidad de Viña del Mar', 'Viña del Mar', 'Valparaíso', 'https://www.munivina.cl/'),
  m('cl-08101', 'Ilustre Municipalidad de Concepción', 'Concepción', 'Biobío', 'https://www.concepcion.cl/'),
  m('cl-09101', 'Ilustre Municipalidad de Temuco', 'Temuco', 'La Araucanía', 'https://www.temuco.cl/'),
  m('cl-02101', 'Ilustre Municipalidad de Antofagasta', 'Antofagasta', 'Antofagasta', 'https://www.municipalidadantofagasta.cl/'),
  m('cl-14101', 'Ilustre Municipalidad de Valdivia', 'Valdivia', 'Los Ríos', 'https://www.munivaldivia.cl/'),
  m('cl-10101', 'Ilustre Municipalidad de Puerto Montt', 'Puerto Montt', 'Los Lagos', 'https://www.puertomontt.cl/')
]);

/** Busca una municipalidad del catálogo base por id o por nombre de comuna. */
export function findMunicipality(idOrCommune) {
  if (!idOrCommune) return null;
  const needle = String(idOrCommune).trim().toLocaleLowerCase('es-CL');
  return (
    MUNICIPALITIES.find(x => x.municipalityId.toLocaleLowerCase('es-CL') === needle) ??
    MUNICIPALITIES.find(x => x.commune.toLocaleLowerCase('es-CL') === needle) ??
    null
  );
}

/** Comunas del catálogo base, ordenadas para poblar un desplegable. */
export function municipalityOptions() {
  return MUNICIPALITIES.map(x => ({ id: x.municipalityId, commune: x.commune, region: x.region })).sort((a, b) =>
    a.commune.localeCompare(b.commune, 'es-CL')
  );
}

/**
 * Normaliza una entrada municipal aportada por el usuario.
 *
 * Una tasa sólo queda `VERIFIED` si viene acompañada de fuente y fecha de
 * verificación. Marcar como verificado algo sin respaldo sería exactamente el
 * problema que este módulo existe para evitar.
 */
export function normalizeMunicipality(input = {}) {
  const base = findMunicipality(input.municipalityId ?? input.commune) ?? {};
  const rate = input.patentRate === '' || input.patentRate === null || input.patentRate === undefined ? null : Number(input.patentRate);

  const hasRate = rate !== null && Number.isFinite(rate);
  const hasSource = Boolean(String(input.rateSource || '').trim());
  const hasDate = Boolean(String(input.lastVerified || '').trim());

  return {
    municipalityId: input.municipalityId || base.municipalityId || null,
    name: input.name || base.name || null,
    commune: input.commune || base.commune || null,
    region: input.region || base.region || null,
    patentRate: hasRate ? rate : null,
    rateSource: hasSource ? String(input.rateSource).trim() : null,
    effectiveFrom: input.effectiveFrom || null,
    effectiveTo: input.effectiveTo || null,
    requirementsUrl: input.requirementsUrl || base.requirementsUrl || null,
    lastVerified: hasDate ? String(input.lastVerified).trim() : null,
    status: hasRate && hasSource && hasDate ? RATE_STATUS.VERIFIED : RATE_STATUS.UNVERIFIED
  };
}

/** Aviso estándar cuando la tasa de la comuna no está verificada. */
export const UNVERIFIED_RATE_WARNING =
  'Tasa municipal no verificada. La cifra es una simulación y debe contrastarse con la municipalidad correspondiente.';
