/**
 * Glosario.
 *
 * Un glosario sirve para exactamente una cosa: que dos personas usen la misma
 * palabra con el mismo significado. Estos tests protegen esa propiedad —ids
 * únicos, sin enlaces rotos, sin categorías huérfanas— y, sobre todo, que las
 * distinciones caras del dominio estén declaradas de forma explícita.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TERMS, CATEGORIES, term, searchTerms, termsByCategory, danglingReferences } from '../packages/glossary/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('los identificadores son únicos', () => {
  const ids = TERMS.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('ningún término enlaza a otro que no existe', () => {
  assert.deepEqual(danglingReferences(), []);
});

test('cada término declara categoría conocida, resumen y definición', () => {
  for (const t of TERMS) {
    assert.ok(CATEGORIES.includes(t.category), `${t.id} usa una categoría desconocida: ${t.category}`);
    assert.ok(t.short?.length > 10, `${t.id} no tiene resumen útil`);
    assert.ok(t.long?.length > 60, `${t.id} no está explicado, sólo nombrado`);
    assert.notEqual(t.short, t.long, `${t.id} repite el resumen como definición`);
  }
});

test('todas las categorías declaradas tienen términos', () => {
  const usadas = new Set(TERMS.map(t => t.category));
  for (const c of CATEGORIES) assert.ok(usadas.has(c), `la categoría "${c}" quedó vacía`);
  assert.equal(termsByCategory().length, CATEGORIES.length);
});

test('las cinco magnitudes de capital existen y se declaran distintas entre sí', () => {
  const claves = ['capital-social', 'capital-enterado', 'patrimonio-contable', 'cpt', 'capital-base-patente'];
  for (const id of claves) assert.ok(term(id), `falta el término ${id}`);

  // Cada una debe advertir explícitamente contra al menos otra del grupo: es la
  // confusión que este trabajo entero viene a corregir.
  for (const id of claves) {
    const t = term(id);
    const cruces = (t.notToConfuseWith ?? []).filter(x => claves.includes(x));
    assert.ok(cruces.length > 0, `${id} no advierte contra ninguna de las otras magnitudes de capital`);
  }
});

test('aporte y préstamo del accionista se declaran mutuamente excluyentes', () => {
  assert.ok(term('aporte-de-capital').notToConfuseWith.includes('prestamo-del-accionista'));
  assert.ok(term('prestamo-del-accionista').notToConfuseWith.includes('aporte-de-capital'));
});

test('los términos con base legal citan la norma', () => {
  for (const id of ['cpt', 'cpt-simplificado', 'patente-municipal', 'capital-base-patente', 'inversiones-deducibles', 'prorrateo-sucursales']) {
    assert.ok(term(id).legalReference, `${id} debería citar su base legal`);
  }
});

test('el glosario anterior no perdió ningún término', () => {
  // El glosario mínimo original tenía estas entradas; ninguna puede desaparecer
  // al ampliarlo, o algún documento del repositorio quedaría enlazando al vacío.
  for (const id of ['activo', 'pasivo-exigible', 'debito-fiscal', 'credito-fiscal', 'dte', 'rcv', 'f29', 'ppm', 'idpc', 'f22', 'dj', 'cpt', 'utm', 'conciliacion']) {
    assert.ok(term(id), `falta el término heredado ${id}`);
  }
});

test('la búsqueda ignora tildes y mayúsculas', () => {
  assert.ok(searchTerms('PRESTAMO').some(t => t.id === 'prestamo-del-accionista'));
  assert.ok(searchTerms('préstamo').some(t => t.id === 'prestamo-del-accionista'));
  assert.ok(searchTerms('CAPITAL PROPIO').some(t => t.id === 'cpt'));
  assert.equal(searchTerms('xyzzy').length, 0);
  assert.equal(searchTerms('').length, TERMS.length);
});

test('docs/GLOSSARY.md está generado desde el módulo y sincronizado', () => {
  const doc = fs.readFileSync(path.join(root, 'docs/GLOSSARY.md'), 'utf8');
  assert.match(doc, /GENERADO POR scripts\/build-glossary\.mjs/);
  for (const t of TERMS) {
    assert.ok(doc.includes(`### ${t.term}`), `docs/GLOSSARY.md no incluye "${t.term}" — regenera con node scripts/build-glossary.mjs`);
  }
});

test('la vista Glosario consume el módulo y no una copia propia', () => {
  const view = fs.readFileSync(path.join(root, 'apps/web/src/views/glosario.js'), 'utf8');
  assert.match(view, /from '\.\.\/core\/glossary\/index\.mjs'/);
});
