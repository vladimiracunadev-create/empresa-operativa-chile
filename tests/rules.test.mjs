import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRules, availableYears, ruleProvenance } from '../packages/chile-tax-rules/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rulesDir = path.join(root, 'packages/chile-tax-rules/rules');
const years = fs.readdirSync(rulesDir).filter(f => /^\d{4}\.json$/.test(f));

test('el módulo embebido coincide exactamente con los JSON fuente', () => {
  for (const file of years) {
    const year = file.slice(0, 4);
    const fromDisk = JSON.parse(fs.readFileSync(path.join(rulesDir, file), 'utf8'));
    assert.deepEqual(loadRules(year), fromDisk, `${file} y rules.generated.mjs difieren`);
  }
});

test('cada año publicado expone año, verificación y advertencias', () => {
  for (const year of availableYears()) {
    const r = loadRules(year);
    assert.equal(r.commercialYear, year);
    assert.match(r.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(r.warnings) && r.warnings.length > 0, `${year} no declara advertencias`);
  }
});

test('toda regla numérica declara fuente oficial y fecha de verificación', () => {
  const traceable = ['iva', 'honorarios', 'ppmProPyme', 'idpcProPyme', 'utm', 'municipalPatent', 'f29'];
  for (const year of availableYears()) {
    for (const name of traceable) {
      const p = ruleProvenance(year, name);
      assert.ok(p.source?.startsWith('http'), `${year}/${name} no cita una fuente`);
      assert.match(p.lastVerified, /^\d{4}-\d{2}-\d{2}$/, `${year}/${name} no declara lastVerified`);
    }
  }
});

test('un año sin reglas falla en vez de degradar a otro año', () => {
  // Devolver silenciosamente las reglas de otro año sería el peor error posible
  // del sistema: cálculos plausibles con la tasa equivocada.
  assert.throws(() => loadRules(1999), /No hay reglas verificadas/);
});
