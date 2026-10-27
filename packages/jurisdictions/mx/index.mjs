import { documentaryPack, unknownAgency, verifiedAgency } from '../profile.mjs';

export const pack = documentaryPack({
  country: 'MX', supportedLocales: ['es-MX'], currency: 'MXN', timeZone: 'America/Mexico_City',
  agencies: {
    businessRegistry: verifiedAgency('Secretaria de Economia', 'https://www.gob.mx/tramites/ficha/constitucion-de-sociedad-por-acciones-simplificada-sas/SE2568', 'Orientacion federal inicial; el registro aplicable depende del tramite y entidad.'),
    tax: verifiedAgency('Servicio de Administracion Tributaria', 'https://www.sat.gob.mx/portal/public/tramites/inscripcion-al-rfc-pm', 'Inscripcion de personas morales en el RFC.'),
    trademark: verifiedAgency('Instituto Mexicano de la Propiedad Industrial', 'https://www.gob.mx/impi', 'Marcas y propiedad industrial.'),
    insolvency: unknownAgency('Autoridad y procedimiento concursal pendientes de investigacion juridica aprobada.')
  },
  identifiers: [{ id: 'RFC', label: 'Registro Federal de Contribuyentes', authority: 'SAT', status: 'PARTIAL_VERIFIED' }]
});
