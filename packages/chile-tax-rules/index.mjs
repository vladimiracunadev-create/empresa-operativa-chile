/**
 * Reglas tributarias chilenas versionadas por año comercial.
 *
 * Este módulo es deliberadamente libre de `node:fs`: lo importan por igual la
 * CLI, el servidor Node, el navegador, el APK de Android y el ejecutable de
 * Windows. Las tasas viven en `rules/<año>.json` y se embeben en
 * `rules.generated.mjs` mediante `scripts/build-rules.mjs`.
 */
import { RULES, AVAILABLE_YEARS } from './rules.generated.mjs';

export { AVAILABLE_YEARS };

/** Años comerciales con reglas verificadas disponibles. */
export function availableYears() {
  return [...AVAILABLE_YEARS];
}

/**
 * Devuelve las reglas de un año comercial.
 * Falla en vez de degradar a otro año: una tasa del año equivocado es peor que
 * un error visible.
 */
export function loadRules(year = 2026) {
  const key = String(year);
  const rules = RULES[key];
  if (!rules) {
    throw new Error(
      `No hay reglas verificadas para el año comercial ${key}. Disponibles: ${AVAILABLE_YEARS.join(', ')}. ` +
        'Agrega packages/chile-tax-rules/rules/' + key + '.json con su fuente oficial y regenera.'
    );
  }
  return rules;
}

/** Metadatos de trazabilidad de una regla concreta (fuente + última verificación). */
export function ruleProvenance(year, ruleName) {
  const rules = loadRules(year);
  const rule = rules[ruleName];
  if (!rule || typeof rule !== 'object') throw new Error(`Regla desconocida: ${ruleName}`);
  return {
    rule: ruleName,
    year: rules.commercialYear,
    source: rule.source ?? null,
    lastVerified: rule.lastVerified ?? rules.lastVerified,
    note: rule.note ?? null
  };
}
