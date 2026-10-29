#!/usr/bin/env node
/**
 * Genera la documentación de Academia desde los módulos que también consume la
 * aplicación. Así la PWA, Windows, Android y el repositorio enseñan lo mismo.
 *
 *   node scripts/build-academy.mjs          # escribir
 *   node scripts/build-academy.mjs --check  # comprobar sincronía
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSE_MODULES, COURSE_CLASSES } from '../packages/academy/course.mjs';
import { ACADEMY_LESSONS } from '../packages/academy/index.mjs';
import { ACADEMY_LABS } from '../packages/academy/labs.mjs';
import { ACADEMY_CASES } from '../packages/academy/cases.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const outputs = new Map();
const put = (relative, content) => outputs.set(relative.replaceAll('\\', '/'), `${content.trim()}\n`);
const quote = value => `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
const bullets = values => values.map(value => `- ${value}`).join('\n');
const numbered = values => values.map((value, index) => `${index + 1}. ${value}`).join('\n');

const labDirs = [
  '01-venta-afecta-simple', '02-compra-del-giro', '03-mes-con-iva-a-pagar', '04-mes-con-remanente',
  '05-honorario-2026', '06-ppm-inicio', '07-patente-minima', '08-aporte-de-capital',
  '09-retiro-personal', '10-conciliacion-bancaria', '11-nota-de-crédito', '12-gasto-dudoso',
  '13-cierre-mensual-completo', '14-detectar-diferencia-sii', '15-cierre-anual-basico',
  '16-auditoria-de-evidencia', '17-investigacion-de-integridad'
];
const caseDirs = ['01-primer-mes-spa', '02-doce-meses', '03-descalce-custodia', '04-operacion-que-si-cuadraba'];

const yaml = [
  'version: 2',
  'country: CL',
  'reference_date: 2026-10-29',
  'pedagogical_contract: "observar -> razonar -> resolver -> comprobar -> aplicar"',
  `guided_routes: ${ACADEMY_LESSONS.length}`,
  `labs: ${ACADEMY_LABS.length}`,
  `cases: ${ACADEMY_CASES.length}`,
  'parts:'
];
for (const module of COURSE_MODULES) {
  yaml.push(`  - id: ${quote(module.id)}`, `    slug: ${quote(module.slug)}`, `    title: ${quote(module.title)}`, `    goal: ${quote(module.goal)}`, '    classes:');
  for (const item of COURSE_CLASSES.filter(value => value.module === module.id)) {
    yaml.push(`      - id: ${item.id}`, `        title: ${quote(item.title)}`, `        duration_minutes: ${item.durationMinutes}`, `        level: ${quote(item.level)}`, `        outcome: ${quote(item.outcome)}`);
  }
}
put('curriculum/curriculum.yaml', yaml.join('\n'));

const renderClass = item => `
# ${item.id} — ${item.title}

> **Nivel:** ${item.level} · **Tiempo orientativo:** ${item.durationMinutes} min · **Parte:** ${item.module} — ${item.moduleTitle}

> **Límite:** ${item.boundary}

## Antes de empezar

${item.prerequisite}

**Caso conductor.** ${item.caseContext}

## Propósito

${item.explanation}

La clase no se aprueba por recordar una frase. Se aprueba al poder **${item.outcome.toLowerCase()}** y demostrarlo mediante un artefacto que otra persona pueda revisar.

## Resultados de aprendizaje

${bullets(item.results)}

## Conceptos operacionales

| Concepto | Cómo se usa aquí |
|---|---|
${item.concepts.map(concept => `| ${concept.name} | ${concept.meaning} |`).join('\n')}

## Modelo mental

${item.mentalModel}

${item.development.map(section => `## ${section.title}\n\n${section.body}`).join('\n\n')}

## Ejemplo trabajado

**Situación.** ${item.workedExample.situation}

${numbered(item.workedExample.steps)}

**Interpretación.** ${item.workedExample.interpretation}

## Taller guiado

**Problema.** ${item.workshop.prompt}

${item.workshop.beforeYouStart}

${numbered(item.workshop.sequence)}

### Entregable

${item.workshop.deliverable}

### Criterio de aceptación

${bullets(item.workshop.acceptance)}

## Errores frecuentes y recuperación

| Síntoma | Causa | Cómo corregirlo |
|---|---|---|
${item.commonErrors.map(error => `| ${error.symptom} | ${error.cause} | ${error.correction} |`).join('\n')}

## Comprobación formativa

${item.checks.map((entry, index) => `<details>\n<summary>${index + 1}. ${entry.question}</summary>\n\n${entry.answer}\n</details>`).join('\n\n')}

## Llevarlo a la aplicación

Practica en SANDBOX y recorre: ${item.appViews.map(view => `**${view}**`).join(' → ')}. Marca la clase como completada sólo después de conservar el entregable.

## Fuentes y verificación

${bullets(item.sources)}

Las fuentes indican dónde comprobar el principio o la obligación; las tasas, plazos y formularios se verifican para el período concreto antes de actuar.
`;

for (const module of COURSE_MODULES) {
  const dir = `curriculum/parts/${module.id}-${module.slug}`;
  const classes = COURSE_CLASSES.filter(item => item.module === module.id);
  put(`${dir}/README.md`, `
# Parte ${module.id} — ${module.title}

## Pregunta que guía la parte

${module.goal}

Esta parte usa el caso continuo de Ruta Andina SpA. Cada clase produce una evidencia distinta; leer sin resolver el taller no cuenta como finalización.

## Recorrido

${classes.map((item, index) => `${index + 1}. [${item.id} — ${item.title}](classes/${item.id}.md) — ${item.outcome}`).join('\n')}

## Criterio de dominio

La parte queda dominada cuando las evidencias de todas sus clases cumplen sus criterios de aceptación y la persona puede explicar cómo una decisión cambia el registro, la caja, la obligación y la evidencia.
`);
  for (const item of classes) put(`${dir}/classes/${item.id}.md`, renderClass(item));
}

for (const [index, item] of ACADEMY_LABS.entries()) {
  const dir = `labs/${labDirs[index]}`;
  put(`${dir}/README.md`, `
# ${item.id} — ${item.title}

> **Parte:** ${item.module} · **Tiempo:** ${item.minutes} min · **Aprobación:** ${item.pass}

## Escenario

${item.brief}

> ${item.safety}

## Material de entrada

${bullets(item.inputs)}

## Trabajo

${numbered(item.tasks)}

## Entrega

${bullets(item.deliverables)}

## Rúbrica

| Criterio | Peso | Evidencia observable |
|---|---:|---|
${item.rubric.map(row => `| ${row.criterion} | ${row.weight}% | ${row.evidence} |`).join('\n')}

## Errores que debes buscar antes de entregar

${bullets(item.commonErrors)}

No abras [la pauta de solución](solution.md) antes de completar y guardar tu primer intento.
`);
  put(`${dir}/solution.md`, `
# Pauta de solución — ${item.title}

La pauta permite comparar razonamiento; no reemplaza tu entregable ni autoriza una operación real.

## Hallazgos esperados

${bullets(item.expected)}

## Autoevaluación

1. Reproduce cada cifra desde las entradas.
2. Explica por qué cada clasificación sigue siendo válida si cambia la fecha de pago.
3. Compara tu trabajo con la rúbrica del laboratorio.
4. Corrige mediante una nueva versión; no borres tu primer intento.

## En la aplicación

Practica en SANDBOX: ${item.appViews.join(' → ')}.
`);
}

for (const [index, item] of ACADEMY_CASES.entries()) {
  put(`cases/${caseDirs[index]}/README.md`, `
# ${item.id} — ${item.title}

> **Dedicación orientativa:** ${item.hours} h · ${item.boundary}

## Situación

${item.situation}

## Objetivo de aprendizaje

${item.learningGoal}

## Expediente inicial

${bullets(item.facts)}

## Etapas

${item.stages.map((stage, stageIndex) => `${stageIndex + 1}. **${stage.name}.** ${stage.work}`).join('\n')}

## Decisiones que debes defender

${bullets(item.decisions)}

## Entrega

${bullets(item.studentPack)}

## Rúbrica

| Criterio | Peso | Qué se observa |
|---|---:|---|
${item.evaluation.map(row => `| ${row.criterion} | ${row.weight}% | ${row.descriptor} |`).join('\n')}

## Pauta de revisión

Abre esta sección sólo después de entregar tu primera versión.

<details>
<summary>Hallazgos que una solución sólida debería descubrir</summary>

${bullets(item.expectedFindings)}
</details>

## En la aplicación

Recorre el caso en SANDBOX mediante: ${item.appViews.join(' → ')}.
`);
}

put('docs/ACADEMIA.md', `
# Academia — guía de estudio

Academia es una superficie ejecutable y offline de la misma aplicación: web/PWA, Windows y Android contienen las mismas clases. El material no vive sólo en el repositorio.

## Contrato pedagógico

Cada clase sigue **observar → razonar → resolver → comprobar → aplicar** y contiene resultados medibles, conceptos, desarrollo, ejemplo trabajado, taller, errores con recuperación, tres comprobaciones, entregable, criterio de aceptación y fuentes.

## Catálogo verificable

- ${ACADEMY_LESSONS.length} rutas guiadas para empezar desde una necesidad concreta.
- ${COURSE_CLASSES.length} clases en ${COURSE_MODULES.length} partes secuenciales.
- ${ACADEMY_LABS.length} laboratorios con pauta y rúbrica.
- ${ACADEMY_CASES.length} casos integradores de 4 a 6 horas.

## Cómo estudiar

1. Usa una ruta guiada para detectar tu punto de entrada.
2. Abre la clase correspondiente y escribe tu hipótesis antes del ejemplo.
3. Resuelve el taller en SANDBOX; nunca practiques con datos personales reales.
4. Revisa errores y comprobaciones.
5. Conserva el entregable y marca progreso local sólo si cumple el criterio.
6. Cierra cada parte con su laboratorio y usa los casos para integrar el recorrido.

## Límites

La Academia enseña a razonar, preparar evidencia y usar la aplicación. No presenta declaraciones, firma, paga, determina derechos ni reemplaza a profesionales o autoridades.
`);

const differences = [];
for (const [relative, content] of outputs) {
  const target = path.join(root, relative);
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') : null;
  const normalized = content.replaceAll('\r\n', '\n');
  if (current === normalized) continue;
  if (check) differences.push(relative);
  else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temp = `${target}.tmp`;
    fs.writeFileSync(temp, content, 'utf8');
    fs.renameSync(temp, target);
  }
}

if (check && differences.length) {
  console.error(`Academia desincronizada (${differences.length} archivos):`);
  differences.slice(0, 20).forEach(file => console.error(`  ${file}`));
  if (differences.length > 20) console.error(`  … y ${differences.length - 20} más`);
  console.error('Ejecuta: pnpm build:academy');
  process.exit(1);
}

console.log(`Academia ${check ? 'sincronizada' : 'generada'}: ${outputs.size} archivos, ${COURSE_CLASSES.length} clases, ${ACADEMY_LABS.length} labs, ${ACADEMY_CASES.length} casos.`);
