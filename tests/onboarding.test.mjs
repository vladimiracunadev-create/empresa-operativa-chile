/**
 * La ruta de "Empezar aquí".
 *
 * Lo que se protege: que la guía no prometa pantallas que no existen, que no
 * enlace a términos del glosario inexistentes, que sus etapas de trámite
 * coincidan con los trámites reales, y —lo que más se degrada con el tiempo—
 * que el documento generado no se desvíe del módulo.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, PHASES, COVERAGE, FIRST_QUESTIONS, stage, stagesByPhase, danglingReferences } from '../packages/onboarding/index.mjs';
import { TERMS } from '../packages/glossary/index.mjs';
import { FORMATION_STEPS } from '../packages/company-operations/workspace.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIEWS = fs
  .readdirSync(path.join(root, 'apps/web/src/views'))
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace('.js', ''));

test('la ruta no referencia vistas, términos ni trámites inexistentes', () => {
  assert.deepEqual(
    danglingReferences({ views: VIEWS, glossaryIds: TERMS.map(t => t.id), formationSteps: FORMATION_STEPS.map(s => s.id) }),
    []
  );
});

test('los identificadores de etapa son únicos', () => {
  const ids = STAGES.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('cada etapa responde una pregunta y dice cuándo terminó', () => {
  for (const s of STAGES) {
    assert.ok(s.question?.length > 10, `${s.id} no plantea la pregunta del usuario`);
    assert.ok(s.why?.length > 80, `${s.id} no explica por qué importa`);
    assert.ok(s.doneWhen?.length > 20, `${s.id} no dice cómo saber que terminaste`);
    assert.ok(s.title?.length > 5, `${s.id} no tiene título`);
  }
});

test('todas las fases declaradas tienen etapas y conservan el orden', () => {
  const grouped = stagesByPhase();
  assert.equal(grouped.length, PHASES.length, 'alguna fase quedó vacía');
  assert.deepEqual(grouped.map(g => g.id), PHASES.map(p => p.id), 'el orden de las fases no puede alterarse: es cronológico');
});

test('la ruta cubre los nueve trámites de constitución, sin dejar ninguno huérfano', () => {
  const referenced = STAGES.map(s => s.formationStep).filter(Boolean);
  for (const step of FORMATION_STEPS) {
    assert.ok(referenced.includes(step.id), `el trámite "${step.id}" no aparece en ninguna etapa de la guía`);
  }
});

test('las etapas con decisiones ofrecen alternativas reales, no una sola', () => {
  for (const s of STAGES) {
    for (const d of s.decisions ?? []) {
      assert.ok(d.question?.length > 5, `${s.id} tiene una decisión sin pregunta`);
      assert.ok(d.options.length >= 1, `${s.id} tiene una decisión sin opciones`);
      for (const o of d.options) {
        assert.ok(o.label && o.whenItFits, `${s.id} tiene una opción sin etiqueta o sin cuándo encaja`);
      }
    }
  }
});

test('las etapas de trámite dicen qué documento queda', () => {
  for (const s of STAGES.filter(x => x.formationStep)) {
    assert.ok(s.documents?.length > 0, `${s.id} es un trámite y no declara qué documento te queda`);
    for (const d of s.documents) {
      assert.ok(d.name && d.whoIssues && d.whyItMatters, `${s.id} tiene un documento incompleto`);
    }
  }
});

test('cada pregunta de partida apunta a una etapa existente', () => {
  for (const q of FIRST_QUESTIONS) {
    assert.ok(stage(q.stage), `la pregunta "${q.question}" apunta a la etapa inexistente ${q.stage}`);
  }
});

test('la cobertura declara vacíos, no sólo virtudes', () => {
  assert.ok(COVERAGE.covered.length > 5);
  assert.ok(COVERAGE.notCovered.length > 5, 'una lista de limitaciones corta es sospechosa, no tranquilizadora');
  for (const gap of COVERAGE.notCovered) {
    assert.ok(gap.what && gap.why, 'cada vacío tiene que decir qué significa para el usuario');
  }
  // Los vacíos que más caro salen si se descubren tarde.
  const texto = COVERAGE.notCovered.map(g => g.what).join(' ').toLowerCase();
  for (const esperado of ['remuneraciones', 'corrección monetaria', 'término de giro']) {
    assert.ok(texto.includes(esperado.toLowerCase()), `la cobertura no menciona "${esperado}"`);
  }
});

test('docs/EMPEZAR-AQUI.md está generado desde el módulo y sincronizado', () => {
  const doc = fs.readFileSync(path.join(root, 'docs/EMPEZAR-AQUI.md'), 'utf8');
  assert.match(doc, /GENERADO POR scripts\/build-guide\.mjs/);
  for (const s of STAGES) {
    assert.ok(doc.includes(s.title), `docs/EMPEZAR-AQUI.md no incluye "${s.title}" — regenera con node scripts/build-guide.mjs`);
  }
  for (const gap of COVERAGE.notCovered) {
    assert.ok(doc.includes(gap.what), `el documento no declara el vacío "${gap.what}"`);
  }
});

test('la vista Empezar aquí consume el módulo y no una copia propia', () => {
  const view = fs.readFileSync(path.join(root, 'apps/web/src/views/empezar.js'), 'utf8');
  assert.match(view, /from '\.\.\/core\/onboarding\/index\.mjs'/);
});
