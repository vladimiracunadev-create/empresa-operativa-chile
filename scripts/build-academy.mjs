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
import { COURSE_MODULES, COURSE_CLASSES, COURSE_UNIT_GUIDES } from '../packages/academy/course.mjs';
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
const xml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

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
  const guide = COURSE_UNIT_GUIDES.find(item => item.id === module.id);
  yaml.push(`  - id: ${quote(module.id)}`, `    slug: ${quote(module.slug)}`, `    icon: ${quote(guide.icon)}`, `    title: ${quote(module.title)}`, `    goal: ${quote(module.goal)}`, `    summary: ${quote(guide.summary)}`, '    classes:');
  for (const item of COURSE_CLASSES.filter(value => value.module === module.id)) {
    yaml.push(`      - id: ${item.id}`, `        title: ${quote(item.title)}`, `        duration_minutes: ${item.durationMinutes}`, `        level: ${quote(item.level)}`, `        outcome: ${quote(item.outcome)}`);
  }
}
put('curriculum/curriculum.yaml', yaml.join('\n'));

const curriculumMap = (() => {
  const width = 1200;
  const cardWidth = 270;
  const cardHeight = 104;
  const gapX = 24;
  const gapY = 28;
  const startX = 24;
  const startY = 84;
  const cards = COURSE_UNIT_GUIDES.map((guide, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);
    const next = index < COURSE_UNIT_GUIDES.length - 1 && col < 3
      ? `<path d="M ${x + cardWidth} ${y + cardHeight / 2} H ${x + cardWidth + gapX - 7}" class="arrow"/>`
      : '';
    const label = guide.title.length > 31 ? `${guide.title.slice(0, 29)}…` : guide.title;
    return `${next}<g class="card"><rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="18"/><text x="${x + 20}" y="${y + 34}" class="icon">${xml(guide.icon)}</text><text x="${x + 60}" y="${y + 31}" class="part">UNIDAD ${guide.id}</text><text x="${x + 20}" y="${y + 65}" class="title">${xml(label)}</text><text x="${x + 20}" y="${y + 87}" class="count">${guide.classIds.length} clases · ${guide.classIds[0]}–${guide.classIds.at(-1)}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="780" viewBox="0 0 ${width} 780" role="img" aria-labelledby="title desc">
  <title id="title">Mapa curricular de Academia</title><desc id="desc">Diecisiete unidades desde mentalidad contable hasta gobierno y control interno.</desc>
  <defs><linearGradient id="bg" x1="0" x2="1"><stop stop-color="#eef2ff"/><stop offset="1" stop-color="#ecfeff"/></linearGradient><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#64748b"/></marker></defs>
  <style>.heading{font:700 28px system-ui,sans-serif;fill:#172554}.sub{font:15px system-ui,sans-serif;fill:#475569}.card rect{fill:#fff;stroke:#cbd5e1;stroke-width:2}.part{font:700 12px system-ui,sans-serif;letter-spacing:1px;fill:#4f46e5}.title{font:700 16px system-ui,sans-serif;fill:#0f172a}.count{font:13px system-ui,sans-serif;fill:#64748b}.icon{font:25px "Segoe UI Emoji",sans-serif}.arrow{stroke:#64748b;stroke-width:2;fill:none;marker-end:url(#arrowhead)}</style>
  <rect width="1200" height="780" rx="24" fill="url(#bg)"/><text x="24" y="38" class="heading">Ruta completa · 70 clases</text><text x="24" y="64" class="sub">Observar → razonar → resolver → comprobar → aplicar</text>${cards}
  <text x="24" y="754" class="sub">Cada unidad produce una evidencia revisable y prepara la siguiente.</text></svg>`;
})();
put('curriculum/academia-map.svg', curriculumMap);

const unitCatalogMarkdown = COURSE_UNIT_GUIDES.map(guide => `### ${guide.icon} [Unidad ${guide.id} — ${guide.title}](parts/${guide.id}-${guide.slug}/)\n\n${guide.summary}\n\n**Producto de la unidad:** ${guide.milestone}\n\n**Clases:** ${guide.classIds.join(', ')}.`).join('\n\n');

put('curriculum/README.md', `
# Currículo completo de Academia

Academia no es una lista de títulos: es una ruta de **70 clases desarrolladas** en 17 unidades. Empieza por reconstruir hechos y documentos, avanza hacia contabilidad e impuestos operativos y termina con automatización, gobierno y control interno.

![Mapa de las 17 unidades](academia-map.svg)

## Cómo está diseñado el aprendizaje

Cada clase recorre cinco movimientos: **observar → razonar → resolver → comprobar → aplicar**. Antes de avanzar debes producir un entregable que otra persona pueda revisar. El contenido usa una empresa ficticia —Ruta Andina SpA— y se practica en SANDBOX, sin datos personales ni operaciones reales.

| Etapa | Unidades | Qué construyes |
|---|---|---|
| Fundamentos | 00–03 | Lenguaje contable, partida doble, cuentas y trazabilidad |
| Operación | 04–09 | Ventas, compras, RCV, F29, honorarios y relación empresa/propietario |
| Cierre y decisión | 10–14 | Activos, cumplimiento municipal, cierres, caja y renta anual |
| Control | 15–16 | Reglas seguras, automatización, gobierno, riesgo e investigación |

## Las 17 unidades

${unitCatalogMarkdown}

## Cómo recorrerlo sin perderse

1. Lee la introducción de la unidad: allí se explican el propósito, el caso y todo el recorrido.
2. Entra a la primera clase y conserva el entregable antes de marcarla como completada.
3. Usa los enlaces **clase anterior / volver a la unidad / clase siguiente** al inicio y al final de cada clase.
4. Cierra la unidad con el laboratorio del mismo número y usa los casos para integrar varias unidades.
5. Si falta un dato legal o tributario, conserva \`REQUIERE_VERIFICACION\`: nunca lo reemplaces por cero ni por una suposición.

## Otras formas de estudiar

- [Guía de estudio](../docs/ACADEMIA.md)
- [Laboratorios con pauta y rúbrica](../labs/)
- [Casos integradores](../cases/)
- [Libro completo de Academia en PDF](../docs/ACADEMIA-COMPLETA.pdf)
`);

const renderClass = (item, classIndex) => {
  const previous = COURSE_CLASSES[classIndex - 1];
  const next = COURSE_CLASSES[classIndex + 1];
  const unitPath = `../../${item.module}-${COURSE_MODULES.find(module => module.id === item.module).slug}/README.md`;
  const nav = [previous ? `[← Anterior: ${previous.id} — ${previous.title}](../../${previous.module}-${COURSE_MODULES.find(module => module.id === previous.module).slug}/classes/${previous.id}.md)` : '← Inicio del curso', `[↑ Volver a la unidad ${item.module}](${unitPath})`, next ? `[Siguiente: ${next.id} — ${next.title} →](../../${next.module}-${COURSE_MODULES.find(module => module.id === next.module).slug}/classes/${next.id}.md)` : 'Fin del curso →'].join(' · ');
  return `
# ${item.id} — ${item.title}

${nav}

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

---

${nav}
`;
};

for (const module of COURSE_MODULES) {
  const dir = `curriculum/parts/${module.id}-${module.slug}`;
  const classes = COURSE_CLASSES.filter(item => item.module === module.id);
  const guide = COURSE_UNIT_GUIDES.find(item => item.id === module.id);
  put(`${dir}/README.md`, `
# ${guide.icon} Unidad ${module.id} — ${module.title}

> **${classes.length} clases · ${classes.reduce((sum, item) => sum + item.durationMinutes, 0)} minutos orientativos · Nivel ${classes[0].level}**

[← Volver al currículo completo](../../README.md)

## Qué vas a aprender

${guide.summary}

## Por qué esta unidad importa

${guide.why}

## Antes de empezar

${guide.prerequisite}

**Caso conductor.** ${guide.caseContext}

## Preguntas que podrás responder

${bullets(guide.questions)}

## Mapa de contenidos

| Paso | Clase | Pregunta práctica | Resultado |
|---:|---|---|---|
${classes.map((item, index) => `| ${index + 1} | [${item.id} — ${item.title}](classes/${item.id}.md) | ${item.explanation} | ${item.outcome} |`).join('\n')}

## Cómo se conectan las clases

${classes.map((item, index) => `**${index + 1}. ${item.title}.** ${item.explanation} La evidencia principal será: ${item.evidence.join(', ')}.`).join('\n\n')}

## Producto final de la unidad

${guide.milestone}

El producto no es una tarea decorativa: debe permitir reconstruir la decisión, sus datos, su evidencia, lo que falta verificar y la acción siguiente.

## Recorrido en la aplicación

Practica en SANDBOX mediante: ${guide.appViews.map(view => `**${view}**`).join(' → ')}.

## Fuentes de orientación

${bullets(guide.sources)}

## Criterio de dominio

La unidad queda dominada cuando las evidencias de todas sus clases cumplen sus criterios de aceptación y puedes explicar, sin copiar la pauta, cómo una decisión cambia el registro, la caja, la obligación y la evidencia.
`);
  for (const item of classes) put(`${dir}/classes/${item.id}.md`, renderClass(item, COURSE_CLASSES.indexOf(item)));
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
