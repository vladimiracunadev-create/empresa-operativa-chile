import { defineCountryPack } from '../core/country-pack.mjs';

const checkedAt = '2026-10-27';

export const verifiedAgency = (name, url, scope) => Object.freeze({
  name,
  url,
  scope,
  status: 'VERIFIED',
  checkedAt
});

export const unknownAgency = scope => Object.freeze({
  name: null,
  url: null,
  scope,
  status: 'REQUIRES_HUMAN_REVIEW',
  checkedAt: null
});

export function documentaryPack(profile) {
  return defineCountryPack({
    subdivisions: [],
    legalEntities: [],
    identifiers: [],
    forms: [],
    initialDeclarations: [],
    obligations: [],
    currencies: [{ code: profile.currency, roundingMode: 'CURRENCY_DEFAULT', status: 'DOCUMENTARY_ONLY' }],
    procedures: [],
    evidenceRequirements: [{ id: 'official-receipt', label: 'Comprobante emitido por la autoridad competente', status: 'DOCUMENTARY_ONLY' }],
    alerts: [{ id: 'legal-review', label: 'Revisión humana antes de actuar', status: 'REQUIRES_HUMAN_REVIEW' }],
    officialRoutes: Object.entries(profile.agencies ?? {}).filter(([, agency]) => agency?.url).map(([id, agency]) => ({ id, label: agency.name, url: agency.url, status: agency.status })),
    calendar: { status: 'NOT_IMPLEMENTED', holidaysSource: null },
    rounding: { mode: 'CURRENCY_DEFAULT', scale: 2 },
    rules: [],
    supportedScenarios: ['documentary-orientation'],
    capabilities: {
      documentaryGuidance: true,
      taxCalculations: {
        enabled: false,
        mode: 'FAIL_CLOSED',
        reason: 'No hay reglas tributarias aprobadas y versionadas para esta jurisdiccion.'
      }
    },
    verification: {
      state: 'DOCUMENTARY_ONLY',
      checkedAt,
      reviewedBy: null
    },
    ...profile
  });
}
