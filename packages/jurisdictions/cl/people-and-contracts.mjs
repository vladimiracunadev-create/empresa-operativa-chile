export const CHILE_PEOPLE_SOURCES = Object.freeze([
  'https://www.dt.gob.cl/',
  'https://www.sii.cl/',
  'https://www.bcn.cl/leychile/'
]);

export function assessCollaboratorRelationship({ fixedSchedule = null, instructionsAndControl = null, exclusivity = null, ownBusinessRisk = null, projectAgreement = null, ipTerms = null } = {}) {
  const facts = { fixedSchedule, instructionsAndControl, exclusivity, ownBusinessRisk, projectAgreement, ipTerms };
  const missing = Object.values(facts).some(value => value === null || value === '');
  const dependencySignals = [fixedSchedule, instructionsAndControl, exclusivity].filter(Boolean).length;
  return {
    state: missing || dependencySignals > 0 ? 'REQUIRES_VERIFICATION' : 'DOCUMENTARY_ONLY',
    classification: 'NO_DETERMINADO',
    dependencySignals,
    facts,
    warning: 'Un contrato por proyecto o una boleta no decide por sí solo si existe subordinación o dependencia. Revisar hechos con profesional laboral.',
    ipWarning: ipTerms ? 'Conservar el acuerdo de propiedad intelectual y verificar su alcance.' : 'Falta acordar y verificar propiedad intelectual.',
    sources: CHILE_PEOPLE_SOURCES
  };
}

export function assessExpenseBoundary({ businessPurpose = null, personalBenefit = null, evidenceRef = null } = {}) {
  const boundary = businessPurpose === true && personalBenefit === false ? 'POTENTIALLY_BUSINESS' : personalBenefit === true && businessPurpose === false ? 'PERSONAL' : 'NO_DETERMINADO';
  return {
    boundary,
    taxDeductibility: 'REQUIRES_VERIFICATION',
    evidenceRef,
    warning: 'La clasificación contable y la aceptación tributaria son decisiones distintas; no registrar como gasto empresarial sin propósito y respaldo.',
    source: 'https://www.sii.cl/'
  };
}

export function assessPersonalGuarantee({ hasPersonalGuarantee = null, mixedFunds = null, unlawfulConductConcern = null } = {}) {
  const needsLawyer = hasPersonalGuarantee !== false || mixedFunds !== false || unlawfulConductConcern !== false;
  return {
    state: needsLawyer ? 'REQUIRES_VERIFICATION' : 'DOCUMENTARY_ONLY',
    limitedLiabilityIsAbsolute: false,
    personalGuaranteeMayCreatePersonalExposure: hasPersonalGuarantee === true,
    warning: 'La responsabilidad limitada no elimina garantías personales ni todas las excepciones legales. No concluir responsabilidad sin revisión profesional.',
    sources: CHILE_PEOPLE_SOURCES
  };
}

export function administratorContinuityChecklist({ event = 'change', authorityEvidence = [], successionEvidence = [] } = {}) {
  if (!['change', 'incapacity', 'death'].includes(event)) throw new Error('Evento de administrador no soportado');
  if (!Array.isArray(authorityEvidence) || !Array.isArray(successionEvidence)) throw new Error('La evidencia debe ser una lista');
  return {
    event,
    state: 'REQUIRES_VERIFICATION',
    rightsAdjudicated: false,
    identitiesForPublicRepository: false,
    checklist: ['Preservar estatutos y poderes', 'Verificar representación vigente', 'Revisar acciones y pactos', 'Consultar testamento y reglas sucesorias con profesional', 'Documentar continuidad operativa sin adjudicar derechos'],
    authorityEvidence: [...authorityEvidence],
    successionEvidence: [...successionEvidence],
    warning: 'La aplicación sólo registra orientación y evidencia. No determina herederos, legitimarios, propiedad de acciones ni facultades de representación.',
    sources: CHILE_PEOPLE_SOURCES
  };
}
