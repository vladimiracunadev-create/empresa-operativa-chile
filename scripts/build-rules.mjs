#!/usr/bin/env node
/**
 * Genera `packages/chile-tax-rules/rules.generated.mjs` desde `rules/*.json`.
 *
 * Por qué existe este paso: el JSON es la fuente de verdad (se revisa, se
 * diffea y se cita contra la fuente oficial), pero el navegador, el APK y el
 * ejecutable de Windows no tienen `node:fs` para leerlo. El módulo generado
 * embebe exactamente el mismo contenido como ESM, así que las tres apps y la
 * CLI calculan con las MISMAS tasas.
 *
 * `--check` no escribe nada: falla si el archivo generado quedó desfasado.
 * CI lo ejecuta en ese modo para que nadie pueda editar un JSON y publicar una
 * app que sigue calculando con la tasa anterior.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = path.join(root, 'packages/chile-tax-rules/rules');
const target = path.join(root, 'packages/chile-tax-rules/rules.generated.mjs');

const years = fs
  .readdirSync(rulesDir)
  .filter(f => /^\d{4}\.json$/.test(f))
  .map(f => f.slice(0, 4))
  .sort();

if (years.length === 0) throw new Error('No hay archivos de reglas en packages/chile-tax-rules/rules');

const entries = years.map(year => {
  const parsed = JSON.parse(fs.readFileSync(path.join(rulesDir, `${year}.json`), 'utf8'));
  if (String(parsed.commercialYear) !== year) {
    throw new Error(`${year}.json declara commercialYear=${parsed.commercialYear}`);
  }
  if (!parsed.lastVerified) throw new Error(`${year}.json no declara lastVerified`);
  return `  ${year}: ${JSON.stringify(parsed, null, 2).split('\n').join('\n  ')}`;
});

const body = `// GENERADO POR scripts/build-rules.mjs — NO EDITAR A MANO.
// Fuente de verdad: packages/chile-tax-rules/rules/<año>.json
// Regenerar con: node scripts/build-rules.mjs

export const RULES = {
${entries.join(',\n')}
};

export const AVAILABLE_YEARS = ${JSON.stringify(years.map(Number))};

export default RULES;
`;

const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (process.argv.includes('--check')) {
  if (previous !== body) {
    console.error('rules.generated.mjs está desfasado respecto de rules/*.json.');
    console.error('Ejecuta: node scripts/build-rules.mjs');
    process.exit(1);
  }
  console.log(`Reglas embebidas sincronizadas (${years.join(', ')}).`);
} else {
  fs.writeFileSync(target, body);
  console.log(`Reglas embebidas generadas para ${years.join(', ')}.`);
}
