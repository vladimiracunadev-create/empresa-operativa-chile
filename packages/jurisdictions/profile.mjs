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
    procedures: [],
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
