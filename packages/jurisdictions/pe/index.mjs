import { documentaryPack, unknownAgency, verifiedAgency } from '../profile.mjs';

export const pack = documentaryPack({
  country: 'PE',
  supportedLocales: ['es-PE'],
  currency: 'PEN',
  timeZone: 'America/Lima',
  agencies: {
    businessRegistry: verifiedAgency('Superintendencia Nacional de los Registros Publicos', 'https://www.gob.pe/sunarp', 'Registro de personas juridicas; el tramite aplicable requiere verificacion por tipo de entidad.'),
    tax: verifiedAgency('Superintendencia Nacional de Aduanas y de Administracion Tributaria', 'https://centrovirtual.sunat.gob.pe/tramites/inscribete-ruc', 'Inscripcion y administracion del RUC.'),
    trademark: verifiedAgency('Instituto Nacional de Defensa de la Competencia y de la Proteccion de la Propiedad Intelectual', 'https://www.gob.pe/indecopi', 'Marcas y propiedad intelectual.'),
    insolvency: unknownAgency('Autoridad y procedimiento concursal pendientes de investigacion juridica aprobada.')
  },
  identifiers: [{ id: 'RUC', label: 'Registro Unico de Contribuyentes', authority: 'SUNAT', status: 'VERIFIED' }],
  legalEntities: [{ id: 'PERU_ENTITY_UNRESOLVED', label: 'Tipo societario por verificar con SUNARP', status: 'REQUIRES_HUMAN_REVIEW' }],
  forms: [{ id: 'RUC_REGISTRATION', label: 'Inscripción en el RUC', status: 'DOCUMENTARY_ONLY' }],
  procedures: [{ id: 'ruc-registration', authority: 'SUNAT', status: 'DOCUMENTARY_ONLY', automatic: false }],
  supportedScenarios: ['documentary-orientation', 'ruc-orientation']
});
