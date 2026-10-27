import { defineCountryPack } from '../../core/country-pack.mjs';
import { availableYears, loadRules } from '../../chile-tax-rules/index.mjs';
import { verifiedAgency } from '../profile.mjs';

export const pack = defineCountryPack({
  country: 'CL',
  subdivisions: [],
  supportedLocales: ['es-CL'],
  currency: 'CLP',
  timeZone: 'America/Santiago',
  legalEntities: [{ id: 'SPA', label: 'Sociedad por Acciones', status: 'PARTIAL_VERIFIED' }],
  agencies: {
    businessRegistry: verifiedAgency('Registro de Empresas y Sociedades', 'https://www.registrodeempresasysociedades.cl/', 'Registro simplificado nacional; verificar otras vias registrales segun entidad.'),
    tax: verifiedAgency('Servicio de Impuestos Internos', 'https://www.sii.cl/', 'Administracion tributaria nacional.'),
    trademark: verifiedAgency('Instituto Nacional de Propiedad Industrial', 'https://www.inapi.cl/', 'Marcas y propiedad industrial.'),
    insolvency: verifiedAgency('Superintendencia de Insolvencia y Reemprendimiento', 'https://www.superir.gob.cl/', 'Orientacion y supervision concursal; los procedimientos judiciales corresponden a tribunales.')
  },
  identifiers: [{ id: 'RUT', label: 'Rol Unico Tributario', authority: 'SII', status: 'PARTIAL_VERIFIED' }],
  forms: [{ id: 'F29', label: 'Formulario 29', status: 'PARTIAL_VERIFIED' }],
  procedures: [],
  rules: [],
  supportedScenarios: ['legacy-cl-2026-tax-adapter'],
  capabilities: {
    documentaryGuidance: true,
    taxCalculations: {
      enabled: true,
      mode: 'LEGACY_ADAPTER',
      verifiedYears: availableYears(),
      reason: 'Conserva exclusivamente las reglas chilenas ya verificadas por ano comercial.'
    }
  },
  verification: {
    state: 'PARTIAL_VERIFIED',
    checkedAt: '2026-10-27',
    reviewedBy: null
  }
});

/** Adaptador sin conversion retrospectiva: conserva exactamente la API chilena. */
export function loadVerifiedChileRules(commercialYear) {
  return loadRules(commercialYear);
}
