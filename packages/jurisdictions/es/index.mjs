import { documentaryPack, unknownAgency, verifiedAgency } from '../profile.mjs';

export const pack = documentaryPack({
  country: 'ES',
  subdivisions: [{ type: 'autonomousCommunity', requiredFor: ['regionalTax', 'licensing'], status: 'REQUIRES_HUMAN_REVIEW' }, { type: 'municipality', requiredFor: ['licensing'], status: 'REQUIRES_HUMAN_REVIEW' }],
  supportedLocales: ['es-ES'], currency: 'EUR', timeZone: 'Europe/Madrid',
  agencies: {
    businessRegistry: verifiedAgency('Registro Mercantil / CIRCE', 'https://paeelectronico.es/', 'La via y el registro competente dependen del tipo de entidad y domicilio.'),
    tax: verifiedAgency('Agencia Estatal de Administracion Tributaria', 'https://sede.agenciatributaria.gob.es/Sede/procedimientos/G322.shtml', 'Declaracion censal Modelo 036; otras obligaciones dependen del perfil.'),
    trademark: verifiedAgency('Oficina Espanola de Patentes y Marcas', 'https://www.oepm.es/', 'Marcas y nombres comerciales.'),
    insolvency: unknownAgency('Autoridad y procedimiento concursal pendientes de investigacion juridica aprobada.')
  },
  identifiers: [{ id: 'NIF', label: 'Numero de Identificacion Fiscal', authority: 'AEAT', status: 'PARTIAL_VERIFIED' }],
  forms: [{ id: '036', label: 'Declaracion censal de alta, modificacion y baja', status: 'VERIFIED' }]
});
