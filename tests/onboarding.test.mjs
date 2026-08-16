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

/* ------------------------------------------- los tres formatos de la guía - */

test('la guía existe en Markdown, HTML y PDF', () => {
  for (const [file, minBytes] of [
    ['docs/EMPEZAR-AQUI.md', 20_000],
    ['docs/EMPEZAR-AQUI.html', 500_000],
    ['docs/EMPEZAR-AQUI.pdf', 500_000]
  ]) {
    const full = path.join(root, file);
    assert.ok(fs.existsSync(full), `falta ${file} — genérala con node scripts/build-guide.mjs`);
    assert.ok(fs.statSync(full).size > minBytes, `${file} es sospechosamente pequeño: probablemente se generó sin imágenes`);
  }
});

test('el HTML es autocontenido: no referencia ninguna imagen externa', () => {
  const html = fs.readFileSync(path.join(root, 'docs/EMPEZAR-AQUI.html'), 'utf8');
  // Todas las imágenes tienen que ir embebidas. Una ruta relativa haría que la
  // guía se viera rota al abrirla desde otra carpeta o dentro del APK.
  const externas = [...html.matchAll(/<img[^>]+src="(?!data:)([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(externas, [], `el HTML de la guía referencia imágenes no embebidas: ${externas.join(', ')}`);
  assert.match(html, /<img src="data:image\/png;base64,/, 'no hay ninguna captura embebida');
  assert.match(html, /<img src="data:image\/svg\+xml;base64,/, 'no hay ningún diagrama embebido');
});

test('el documento ilustra cada pantalla que la guía manda abrir', () => {
  const md = fs.readFileSync(path.join(root, 'docs/EMPEZAR-AQUI.md'), 'utf8');
  const vistas = [...new Set(STAGES.map(s => s.doInApp?.view).filter(Boolean))];
  for (const view of vistas) {
    assert.ok(fs.existsSync(path.join(root, `docs/assets/compacto/${view}.png`)), `falta la captura de la pantalla ${view}`);
    assert.ok(md.includes(`assets/compacto/${view}.png`), `la guía no muestra la pantalla ${view}`);
  }
  // Cada captura aparece UNA vez: repetirla no enseña nada y en el HTML y el
  // PDF la imagen va embebida, así que duplicarla duplica el peso de verdad.
  for (const view of vistas) {
    const veces = md.split(`assets/compacto/${view}.png`).length - 1;
    assert.equal(veces, 1, `la captura de ${view} aparece ${veces} veces en la guía`);
  }
});

test('la guía incluye los dos diagramas, y están generados', () => {
  const md = fs.readFileSync(path.join(root, 'docs/EMPEZAR-AQUI.md'), 'utf8');
  for (const svg of ['casos-de-uso', 'ruta-empresa']) {
    const file = path.join(root, `docs/assets/diagramas/${svg}.svg`);
    assert.ok(fs.existsSync(file), `falta el diagrama ${svg}.svg`);
    assert.match(fs.readFileSync(file, 'utf8'), /<svg[^>]+role="img"[^>]+aria-label=/, `${svg}.svg no describe su contenido para lectores de pantalla`);
    assert.ok(md.includes(`assets/diagramas/${svg}.svg`), `la guía no muestra el diagrama ${svg}`);
  }
});

test('el diagrama de la ruta se genera desde las etapas, no a mano', () => {
  const svg = fs.readFileSync(path.join(root, 'docs/assets/diagramas/ruta-empresa.svg'), 'utf8');
  assert.ok(svg.includes(`${STAGES.length} ETAPAS`), 'el diagrama no refleja el número real de etapas');
  for (const s of STAGES) {
    // El título va partido en líneas; basta comprobar su primera palabra larga.
    const palabra = s.title.split(' ').find(w => w.length > 6) ?? s.title;
    assert.ok(svg.includes(palabra), `el diagrama de la ruta no incluye la etapa "${s.title}"`);
  }
});

test('el bundle de la aplicación embarca la guía en sus dos formatos leíbles', () => {
  const buildWeb = fs.readFileSync(path.join(root, 'scripts/build-web.mjs'), 'utf8');
  assert.match(buildWeb, /EMPEZAR-AQUI\.html/);
  assert.match(buildWeb, /EMPEZAR-AQUI\.pdf/);
  const view = fs.readFileSync(path.join(root, 'apps/web/src/views/empezar.js'), 'utf8');
  // Rutas relativas al bundle: así funcionan igual servidas por el navegador,
  // dentro del APK y dentro del ejecutable de Windows.
  assert.match(view, /\.\/ayuda\/EMPEZAR-AQUI\.html/, 'la vista no muestra la guía embarcada');
  assert.match(view, /\.\/ayuda\/EMPEZAR-AQUI\.pdf/, 'la vista no ofrece el PDF embarcado');
  assert.match(view, /<iframe class="guiaframe"/, 'la guía debe leerse DENTRO de la aplicación, no sólo en otra pestaña');

  // El servidor local tiene que poder enmarcar su propio contenido, o el marco
  // quedaría en blanco sin explicación.
  const server = fs.readFileSync(path.join(root, 'apps/empresa-operativa/server.mjs'), 'utf8');
  assert.match(server, /frame-ancestors 'self'/, 'la política de seguridad impediría leer la guía dentro de la app');
  assert.match(server, /'\.pdf': 'application\/pdf'/, 'el servidor no declara el tipo del PDF');
});
