import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCountryPack } from '../packages/core/country-pack.mjs';
import { requireComputableRule, validateRegulatoryRule } from '../packages/core/regulatory-rules.mjs';
import { getCountryPack, listCountryPacks, loadTaxRules, resolveJurisdiction } from '../packages/jurisdictions/registry.mjs';
import { createTranslator, formatLocalDate, formatMoney, SUPPORTED_LOCALES } from '../packages/i18n/locales/index.mjs';

test('los siete CountryPack pasan el contrato sin campos implicitos', () => {
  assert.deepEqual(listCountryPacks().map(pack => pack.country), ['CL', 'PE', 'MX', 'CO', 'AR', 'BR', 'ES']);
  for (const pack of listCountryPacks()) assert.equal(validateCountryPack(pack), true);
  assert.throws(() => validateCountryPack({ ...getCountryPack('PE'), agencies: {} }), /Falta agencies/);
});

test('Chile conserva el motor 2026 mediante un adaptador explicito', () => {
  const rules = loadTaxRules({ country: 'CL', commercialYear: 2026 });
  assert.equal(rules.country, 'CL');
  assert.equal(rules.commercialYear, 2026);
});

test('Chile no degrada un ano ausente a reglas 2026', () => {
  assert.throws(() => loadTaxRules({ country: 'CL', commercialYear: 2025 }), /No hay reglas verificadas/);
});

test('PE es piloto documental y nunca recibe F29 ni una tasa chilena', () => {
  const pe = getCountryPack('PE');
  assert.match(pe.agencies.tax.name, /Administracion Tributaria/);
  assert.doesNotMatch(pe.agencies.tax.name, /Servicio de Impuestos Internos/);
  assert.equal(pe.identifiers[0].id, 'RUC');
  assert.equal(pe.forms.some(form => form.id === 'F29'), false);
  assert.throws(() => loadTaxRules({ country: 'PE', commercialYear: 2026 }), /REQUIRES_HUMAN_REVIEW/);
});

test('idioma portugues no cambia la jurisdiccion fiscal mexicana', () => {
  const resolved = resolveJurisdiction({ country: 'MX', locale: 'pt-BR' });
  assert.equal(resolved.countryPack.country, 'MX');
  assert.equal(resolved.countryPack.agencies.tax.name, 'Servicio de Administracion Tributaria');
  assert.equal(resolved.locale, 'pt-BR');
});

test('interfaz inglesa conserva las reglas fiscales chilenas', () => {
  const resolved = resolveJurisdiction({ country: 'CL', locale: 'en' });
  assert.equal(resolved.countryPack.country, 'CL');
  assert.equal(createTranslator(resolved.locale)('requiresVerification'), 'Requires verification');
});

test('Espana sin reglas aprobadas falla cerrado', () => {
  assert.equal(getCountryPack('ES').forms[0].id, '036');
  assert.throws(() => loadTaxRules({ country: 'ES', commercialYear: 2026 }), /deshabilitados/);
});

test('Argentina no presenta IGJ como registro nacional', () => {
  const ar = getCountryPack('AR');
  assert.match(ar.agencies.businessRegistry.scope, /Solo entidades con domicilio legal en CABA/);
  assert.equal(ar.subdivisions[0].type, 'province');
});

test('Brasil exige resolver estado y municipio antes de legalizar', () => {
  assert.deepEqual(getCountryPack('BR').subdivisions.map(row => row.type), ['state', 'municipality']);
});

test('pais y locale invalidos se rechazan con errores observables', () => {
  assert.throws(() => getCountryPack('ZZ'), /NOT_IMPLEMENTED/);
  assert.throws(() => resolveJurisdiction({ country: 'CL', locale: 'no_es_un_locale' }), /BCP 47/);
});

test('los ocho locales formatean moneda y fecha con Intl', () => {
  assert.equal(SUPPORTED_LOCALES.length, 8);
  for (const locale of SUPPORTED_LOCALES) {
    assert.ok(formatMoney(1234, { locale, currency: 'USD' }).length > 0);
    assert.ok(formatLocalDate('2026-10-27T12:00:00Z', { locale, timeZone: 'America/Santiago' }).length > 0);
  }
});

const rule = {
  country: 'CL', subdivision: null, entityType: 'SPA', taxRegime: 'PRO_PYME_GENERAL',
  validFrom: '2026-01-01', validTo: '2026-12-31', effectiveTaxYear: 2026,
  sourceUrl: 'https://www.sii.cl/', sourceTitle: 'Fuente de prueba', publicationDate: '2026-01-01',
  checkedAt: '2026-10-27', reviewStatus: 'DRAFT', approver: null, scope: 'Prueba de contrato',
  assumptions: [], exceptions: [], confidence: 'LOW', supersedes: null, ruleVersion: 'cl.test.1'
};

test('una regla normativa incompleta no pasa el contrato', () => {
  assert.throws(() => validateRegulatoryRule({ ...rule, sourceTitle: '' }), /sourceTitle/);
});

test('una regla DRAFT nunca habilita calculos', () => {
  assert.throws(() => requireComputableRule(rule, { country: 'CL', effectiveTaxYear: 2026 }), /REQUIRES_HUMAN_REVIEW/);
});

test('una regla VERIFIED exige aprobador y contexto exacto', () => {
  const verified = { ...rule, reviewStatus: 'VERIFIED', approver: 'revision-humana-registrada' };
  assert.equal(requireComputableRule(verified, { country: 'CL', effectiveTaxYear: 2026 }), verified);
  assert.throws(() => requireComputableRule(verified, { country: 'PE' }), /pais solicitado/);
});
