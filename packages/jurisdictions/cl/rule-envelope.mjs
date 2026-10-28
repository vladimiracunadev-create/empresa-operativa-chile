import { loadRules } from '../../chile-tax-rules/index.mjs';
import { requireComputableRule } from '../../core/regulatory-rules.mjs';

const titles = Object.freeze({
  iva: 'IVA general', honorarios: 'Retención de honorarios', ppmProPyme: 'PPM Pro Pyme',
  idpcProPyme: 'IDPC Pro Pyme', utm: 'Unidad Tributaria Mensual', municipalPatent: 'Patente municipal',
  taxEquity: 'Capital propio tributario', f29: 'Vencimientos de Formulario 29'
});

export function chileRuleEnvelope(ruleName, commercialYear = 2026, { entityType = 'SPA', taxRegime = 'PRO_PYME_GENERAL' } = {}) {
  const rules = loadRules(commercialYear);
  const rule = rules[ruleName];
  if (!rule || typeof rule !== 'object') throw new Error(`Regla chilena desconocida: ${ruleName}`);
  const sourceUrl = rule.source ?? Object.values(rule.methods ?? {}).find(value => value?.source)?.source;
  if (!sourceUrl) throw new Error(`La regla ${ruleName} no tiene fuente exacta`);
  const checkedAt = rule.lastVerified ?? Object.values(rule.methods ?? {}).find(value => value?.lastVerified)?.lastVerified ?? rules.lastVerified;
  return {
    country: 'CL', subdivision: null, entityType, taxRegime,
    validFrom: `${commercialYear}-01-01`, validTo: `${commercialYear}-12-31`, effectiveTaxYear: commercialYear,
    sourceUrl, sourceTitle: titles[ruleName] ?? ruleName, publicationDate: `${commercialYear}-01-01`, checkedAt,
    reviewStatus: 'VERIFIED', approver: 'project-source-review', scope: rule.note ?? `Regla ${ruleName} para ${commercialYear}`,
    assumptions: [], exceptions: [], confidence: 'SOURCE_VERIFIED_SCOPE_LIMITED', supersedes: null,
    ruleVersion: `cl.${ruleName}.${commercialYear}.1`
  };
}

export function loadChileRuleWithMetadata(ruleName, commercialYear = 2026, context = {}) {
  const metadata = chileRuleEnvelope(ruleName, commercialYear, context);
  requireComputableRule(metadata, { country: 'CL', effectiveTaxYear: commercialYear, entityType: metadata.entityType, taxRegime: metadata.taxRegime });
  return { value: loadRules(commercialYear)[ruleName], metadata };
}

