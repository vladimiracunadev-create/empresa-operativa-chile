import { documentaryPack, unknownAgency, verifiedAgency } from '../profile.mjs';

export const pack = documentaryPack({
  country: 'CO', supportedLocales: ['es-CO'], currency: 'COP', timeZone: 'America/Bogota',
  agencies: {
    businessRegistry: unknownAgency('Camara de Comercio competente segun domicilio; no existe una autoridad unica configurada.'),
    tax: verifiedAgency('Direccion de Impuestos y Aduanas Nacionales', 'https://www.dian.gov.co/impuestos/RUT/Paginas/Inscripcion-y-actualizacion-RUT.aspx', 'Inscripcion y actualizacion del RUT.'),
    trademark: verifiedAgency('Superintendencia de Industria y Comercio', 'https://www.sic.gov.co/', 'Marcas y propiedad industrial.'),
    insolvency: unknownAgency('Autoridad y procedimiento concursal pendientes de investigacion juridica aprobada.')
  },
  identifiers: [{ id: 'RUT', label: 'Registro Unico Tributario', authority: 'DIAN', status: 'PARTIAL_VERIFIED' }],
  legalEntities: [{ id: 'CO_ENTITY_UNRESOLVED', label: 'Tipo societario colombiano por verificar', status: 'REQUIRES_HUMAN_REVIEW' }],
  forms: [{ id: 'RUT_REGISTRATION', label: 'Inscripción y actualización RUT', status: 'DOCUMENTARY_ONLY' }],
  procedures: [{ id: 'chamber-registration', authority: 'Cámara de Comercio competente', status: 'REQUIRES_HUMAN_REVIEW', automatic: false }]
});
