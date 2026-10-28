import { documentaryPack, unknownAgency, verifiedAgency } from '../profile.mjs';

export const pack = documentaryPack({
  country: 'BR',
  subdivisions: [{ type: 'state', requiredFor: ['businessRegistry', 'tax'], status: 'REQUIRES_HUMAN_REVIEW' }, { type: 'municipality', requiredFor: ['tax', 'licensing'], status: 'REQUIRES_HUMAN_REVIEW' }],
  supportedLocales: ['pt-BR'], currency: 'BRL', timeZone: 'America/Sao_Paulo',
  agencies: {
    businessRegistry: verifiedAgency('REDESIM / Junta Comercial competente', 'https://www.gov.br/empresas-e-negocios/pt-br/redesim', 'Flujo integrado con competencias estaduales y municipales que deben resolverse por domicilio.'),
    tax: verifiedAgency('Receita Federal do Brasil', 'https://www.gov.br/pt-br/servicos/inscrever-no-cnpj', 'Inscripcion federal en el CNPJ; no sustituye obligaciones estaduales o municipales.'),
    trademark: verifiedAgency('Instituto Nacional da Propriedade Industrial', 'https://www.gov.br/inpi/pt-br/servicos/marcas', 'Marcas y propiedad industrial.'),
    insolvency: unknownAgency('Autoridad y procedimiento concursal pendientes de investigacion juridica aprobada.')
  },
  identifiers: [{ id: 'CNPJ', label: 'Cadastro Nacional da Pessoa Juridica', authority: 'Receita Federal', status: 'PARTIAL_VERIFIED' }],
  legalEntities: [{ id: 'BR_ENTITY_UNRESOLVED', label: 'Natureza jurídica por verificar', status: 'REQUIRES_HUMAN_REVIEW' }],
  forms: [{ id: 'CNPJ_REGISTRATION', label: 'Inscrição no CNPJ', status: 'DOCUMENTARY_ONLY' }],
  procedures: [{ id: 'redesim-registration', authority: 'REDESIM / Junta / municipio competentes', status: 'REQUIRES_HUMAN_REVIEW', automatic: false }]
});
