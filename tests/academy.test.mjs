import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACADEMY_LESSONS, ACADEMY_MODULES } from '../packages/academy/index.mjs';
import { COURSE_MODULES, COURSE_CLASSES, COURSE_UNIT_GUIDES } from '../packages/academy/course.mjs';
import { ACADEMY_LABS } from '../packages/academy/labs.mjs';
import { ACADEMY_CASES } from '../packages/academy/cases.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const words = value => JSON.stringify(value).split(/\s+/).filter(Boolean).length;

test('Academia declara un catálogo real y sin identificadores duplicados', () => {
  assert.equal(ACADEMY_MODULES.length, 4);
  assert.equal(ACADEMY_LESSONS.length, 12);
  assert.equal(COURSE_MODULES.length, 17);
  assert.equal(COURSE_UNIT_GUIDES.length, 17);
  assert.equal(COURSE_CLASSES.length, 70);
  assert.equal(ACADEMY_LABS.length, 17);
  assert.equal(ACADEMY_CASES.length, 4);
  const ids = [...ACADEMY_LESSONS, ...COURSE_CLASSES, ...ACADEMY_LABS, ...ACADEMY_CASES].map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('cada unidad explica el recorrido antes de abrir una clase', () => {
  const semanticAnchors = {
    '00': /hecho|evidencia/i, '01': /empresa|régimen/i, '02': /partida doble|asiento/i,
    '03': /plan de cuentas|trazabilidad/i, '04': /venta|DTE/i, '05': /compras|gastos/i,
    '06': /Registro de Compras y Ventas|RCV/i, '07': /F29|PPM/i, '08': /honorario|boleta/i,
    '09': /tesorería|flujo de caja/i, '10': /accionista|capital/i, '11': /activos|depreciación/i,
    '12': /patente municipal|UTM/i, '13': /cerrar un mes|cierre/i, '14': /revisión anual|F22/i,
    '15': /automatizaciones|regla/i, '16': /gobierno corporativo|control/i
  };
  for (const guide of COURSE_UNIT_GUIDES) {
    assert.match(guide.icon, /\S/u, `${guide.id}: falta icono`);
    assert.ok(words(guide.summary) >= 20, `${guide.id}: resumen superficial`);
    assert.ok(words(guide.why) >= 15, `${guide.id}: falta explicar por qué importa`);
    assert.equal(guide.questions.length, 3, `${guide.id}: faltan preguntas guía`);
    assert.ok(guide.milestone.length >= 45, `${guide.id}: producto final superficial`);
    assert.match(`${guide.summary} ${guide.why} ${guide.milestone}`, semanticAnchors[guide.id], `${guide.id}: introducción no corresponde a su unidad`);
    assert.deepEqual(guide.classIds, COURSE_CLASSES.filter(item => item.module === guide.id).map(item => item.id));
  }
});

test('cada una de las 70 clases cumple el contrato pedagógico', () => {
  for (const item of COURSE_CLASSES) {
    assert.match(item.id, /^C\d{2}$/);
    assert.ok(item.durationMinutes >= 30);
    assert.ok(item.results.length >= 5, `${item.id}: faltan resultados`);
    assert.ok(item.concepts.length >= 3, `${item.id}: faltan conceptos`);
    assert.equal(item.development.length, 3, `${item.id}: desarrollo incompleto`);
    assert.ok(item.workedExample.steps.length >= 5, `${item.id}: ejemplo superficial`);
    assert.ok(item.workshop.sequence.length >= 5, `${item.id}: taller superficial`);
    assert.ok(item.workshop.acceptance.length >= 5, `${item.id}: sin criterio de aceptación`);
    assert.ok(item.commonErrors.length >= 4, `${item.id}: sin recuperación de errores`);
    assert.ok(item.checks.length >= 3, `${item.id}: sin comprobación formativa`);
    assert.ok(item.sources.length >= 2, `${item.id}: sin fuentes`);
    assert.ok(words(item) >= 700, `${item.id}: contenido insuficiente (${words(item)} palabras serializadas)`);
  }
});

test('las clases no repiten resultados, ejemplos ni talleres como placeholders', () => {
  for (const field of ['title', 'outcome', 'example', 'practice']) {
    const values = COURSE_CLASSES.map(item => item[field]);
    assert.equal(new Set(values).size, 70, `${field} contiene duplicados`);
  }
  assert.doesNotMatch(JSON.stringify(COURSE_CLASSES), /lorem ipsum|por completar|placeholder/i);
});

test('las 12 rutas guiadas incluyen explicación, práctica, evaluación y fuente', () => {
  for (const item of ACADEMY_LESSONS) {
    assert.ok(item.sections.length >= 3, `${item.id}: faltan secciones`);
    assert.ok(item.workedExample.steps.length >= 3, `${item.id}: falta ejemplo`);
    assert.ok(item.practice.tasks.length >= 3, `${item.id}: falta práctica`);
    assert.ok(item.check.options.length >= 3, `${item.id}: falta evaluación`);
    assert.ok(item.sources.every(source => /^https:\/\//.test(source.url)), `${item.id}: fuente inválida`);
  }
});

test('cada laboratorio tiene problema, procedimiento, pauta, rúbrica y recuperación', () => {
  for (const item of ACADEMY_LABS) {
    assert.ok(item.inputs.length >= 3, `${item.id}: entradas insuficientes`);
    assert.ok(item.tasks.length >= 4, `${item.id}: procedimiento insuficiente`);
    assert.ok(item.expected.length >= 3, `${item.id}: pauta insuficiente`);
    assert.equal(item.rubric.reduce((sum, row) => sum + row.weight, 0), 100, `${item.id}: rúbrica no suma 100`);
    assert.ok(item.commonErrors.length >= 3, `${item.id}: no enseña recuperación`);
    assert.ok(words(item) >= 180, `${item.id}: laboratorio demasiado breve`);
  }
});

test('cada caso integrador encadena etapas, decisiones y evidencia', () => {
  for (const item of ACADEMY_CASES) {
    assert.ok(item.facts.length >= 5, `${item.id}: expediente insuficiente`);
    assert.ok(item.stages.length >= 4, `${item.id}: recorrido insuficiente`);
    assert.ok(item.decisions.length >= 4, `${item.id}: decisiones insuficientes`);
    assert.ok(item.expectedFindings.length >= 5, `${item.id}: pauta insuficiente`);
    assert.equal(item.evaluation.reduce((sum, row) => sum + row.weight, 0), 100, `${item.id}: rúbrica no suma 100`);
  }
});

test('la documentación generada expone las 70 clases, 17 labs y 4 casos', () => {
  const classFiles = COURSE_MODULES.flatMap(module =>
    COURSE_CLASSES.filter(item => item.module === module.id).map(item => path.join(root, 'curriculum/parts', `${module.id}-${module.slug}`, 'classes', `${item.id}.md`))
  );
  assert.equal(classFiles.length, 70);
  classFiles.forEach(file => assert.ok(fs.existsSync(file), `falta ${path.relative(root, file)}`));
  for (const dir of fs.readdirSync(path.join(root, 'labs'))) {
    assert.ok(fs.existsSync(path.join(root, 'labs', dir, 'solution.md')), `${dir}: falta pauta`);
  }
  assert.equal(fs.readdirSync(path.join(root, 'labs')).filter(dir => /^\d{2}-/.test(dir)).length, 17);
  assert.equal(fs.readdirSync(path.join(root, 'cases')).filter(dir => /^\d{2}-/.test(dir)).length, 4);
  const curriculum = fs.readFileSync(path.join(root, 'curriculum', 'README.md'), 'utf8');
  assert.match(curriculum, /Las 17 unidades/);
  assert.match(curriculum, /academia-map\.svg/);
  for (const guide of COURSE_UNIT_GUIDES) {
    const unit = fs.readFileSync(path.join(root, 'curriculum', 'parts', `${guide.id}-${guide.slug}`, 'README.md'), 'utf8');
    assert.match(unit, /Qué vas a aprender/);
    assert.match(unit, /Mapa de contenidos/);
    assert.match(unit, /Producto final de la unidad/);
  }
  for (const file of classFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.match(content, /Volver a la unidad/);
    assert.match(content, /Siguiente:|Fin del curso/);
  }
});

test('el libro PDF contiene el catálogo completo y está enlazado desde el README', () => {
  const pdf = path.join(root, 'docs', 'ACADEMIA-COMPLETA.pdf');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'ACADEMIA-COMPLETA.manifest.json'), 'utf8'));
  assert.ok(fs.statSync(pdf).size >= 300_000);
  assert.equal(fs.readFileSync(pdf).subarray(0, 4).toString(), '%PDF');
  assert.equal(manifest.classes, 70);
  assert.equal(manifest.units, 17);
  assert.equal(manifest.guided, 12);
  assert.equal(manifest.labs, 17);
  assert.equal(manifest.cases, 4);
  assert.ok(manifest.pages >= 100);
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /docs\/ACADEMIA-COMPLETA\.pdf/);
});

test('la aplicación empaqueta y hace navegable toda Academia sin conexión', () => {
  const view = fs.readFileSync(path.join(root, 'apps/web/src/views/academia.js'), 'utf8');
  const build = fs.readFileSync(path.join(root, 'scripts/build-web.mjs'), 'utf8');
  for (const module of ['index.mjs', 'course.mjs', 'labs.mjs', 'cases.mjs']) {
    assert.match(build, new RegExp(`academy/${module.replace('.', '\\.')}`));
  }
  assert.match(view, /COURSE_CLASSES/);
  assert.match(view, /ACADEMY_LABS/);
  assert.match(view, /ACADEMY_CASES/);
  assert.match(view, /data-academy-search/);
  assert.match(view, /data-course-module-open/);
  assert.match(view, /data-course-class-open/);
  assert.match(view, /Clase siguiente/);
  assert.match(view, /COURSE_UNIT_GUIDES/);
  assert.match(view, /localStorage/);
  assert.doesNotMatch(view, /listOperations\(/, 'Academia debe usar la API vigente CompanyWorkspace.listTransactions');
  assert.doesNotMatch(view, /journal\.sale\(/, 'Academia debe usar la función journal con una operación tipada');
  assert.doesNotMatch(view, /incluye un currículo con laboratorios y casos completos en/);
});
