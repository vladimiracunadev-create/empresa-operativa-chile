/**
 * Guardia de las tasas del año en curso.
 *
 * No valida el esquema (eso lo hace `build-rules.mjs`): valida los VALORES que
 * alguien podría cambiar sin querer al editar el JSON. Cada línea de aquí es
 * una cifra que, equivocada, se propaga a una declaración real.
 */
import { loadRules } from '../packages/chile-tax-rules/index.mjs';

const r = loadRules(2026);
const errors = [];

if (r.iva.generalRate !== 0.19) errors.push('IVA 2026 esperado 19%');
if (r.honorarios.retentionRate !== 0.1525) errors.push('Retención honorarios 2026 esperada 15,25%');
if (r.ppmProPyme.initialYearRate !== 0.0025) errors.push('PPM inicial Pro Pyme esperado 0,25%');
if (!r.lastVerified) errors.push('Falta lastVerified');

// Patente municipal: el rango y los topes del art. 24 del D.L. 3.063. El tope
// máximo son 8.000 UTM desde la Ley 20.280; el 4.000 que traía este repositorio
// era el texto anterior a esa reforma.
const p = r.municipalPatent;
if (p.minRate !== 0.0025 || p.maxRate !== 0.005) errors.push('Rango legal de patente esperado 2,5‰ a 5‰ (D.L. 3.063 art. 24)');
if (p.minUtm !== 1) errors.push('Mínimo legal de patente esperado 1 UTM');
if (p.maxUtm !== 8000) errors.push('Máximo legal de patente esperado 8.000 UTM (D.L. 3.063 art. 24)');
if (!p.legalReference) errors.push('La regla de patente municipal no cita su norma');
if (!p.capitalBasis?.newBusiness || !p.capitalBasis?.establishedBusiness) {
  errors.push('Falta la distinción entre base de empresa nueva y empresa en funcionamiento');
}

// Capital propio tributario: los dos métodos y sus normas.
const t = r.taxEquity;
if (!t?.methods?.article41?.legalReference) errors.push('Falta el método de CPT del art. 41 con su referencia legal');
if (!t?.methods?.simplified14D3j?.legalReference) errors.push('Falta el método de CPT simplificado con su referencia legal');
if (t?.methods?.simplified14D3j?.floorZero !== true) errors.push('El CPT simplificado debe declarar que su piso es $0');

// Toda regla con tasas tiene que decir de dónde salió y cuándo se comprobó.
for (const [name, rule] of Object.entries(r)) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) continue;
  if (name === 'taxEquity') continue;
  if (!rule.source) errors.push(`La regla "${name}" no declara su fuente`);
  if (!rule.lastVerified) errors.push(`La regla "${name}" no declara su última verificación`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Reglas ${r.commercialYear} validadas; última verificación ${r.lastVerified}`);
