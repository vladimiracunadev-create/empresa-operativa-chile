import { documentaryPack, unknownAgency, verifiedAgency } from '../profile.mjs';

export const pack = documentaryPack({
  country: 'AR',
  subdivisions: [{ type: 'province', requiredFor: ['businessRegistry'], status: 'REQUIRES_HUMAN_REVIEW' }],
  supportedLocales: ['es-AR'], currency: 'ARS', timeZone: 'America/Argentina/Buenos_Aires',
  agencies: {
    businessRegistry: verifiedAgency('Inspeccion General de Justicia', 'https://www.argentina.gob.ar/justicia/igj', 'Solo entidades con domicilio legal en CABA y competencias especiales; fuera de CABA se debe resolver el registro provincial.'),
    tax: verifiedAgency('Agencia de Recaudacion y Control Aduanero', 'https://www.arca.gob.ar/', 'Administracion tributaria nacional y CUIT.'),
    trademark: verifiedAgency('Instituto Nacional de la Propiedad Industrial', 'https://www.argentina.gob.ar/inpi/marcas/registrar-una-marca', 'Registro nacional de marcas.'),
    insolvency: unknownAgency('Autoridad y competencia concursal pendientes de investigacion por jurisdiccion.')
  },
  identifiers: [{ id: 'CUIT', label: 'Clave Unica de Identificacion Tributaria', authority: 'ARCA', status: 'PARTIAL_VERIFIED' }],
  legalEntities: [{ id: 'AR_ENTITY_UNRESOLVED', label: 'Tipo societario y registro provincial por verificar', status: 'REQUIRES_HUMAN_REVIEW' }],
  forms: [{ id: 'CUIT_REGISTRATION', label: 'Inscripción fiscal ante ARCA', status: 'DOCUMENTARY_ONLY' }],
  procedures: [{ id: 'provincial-registry-resolution', authority: 'Registro según provincia; IGJ sólo cuando corresponda', status: 'REQUIRES_HUMAN_REVIEW', automatic: false }]
});
