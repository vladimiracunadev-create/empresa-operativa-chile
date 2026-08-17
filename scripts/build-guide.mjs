#!/usr/bin/env node
/**
 * Genera la guía "Empezar aquí" en sus tres formatos desde
 * `packages/onboarding/index.mjs`:
 *
 *   docs/EMPEZAR-AQUI.md    para leer en GitHub y diffear en una revisión
 *   docs/EMPEZAR-AQUI.html  autocontenido; se lee en el navegador y DENTRO de la app
 *   docs/EMPEZAR-AQUI.pdf   para descargar, imprimir o mandar por correo
 *
 * Y los dos diagramas que la acompañan, también generados (`scripts/lib/diagrams.mjs`):
 * la ruta completa y los casos de uso.
 *
 * Mismo motivo que el glosario: la ruta tiene varios consumidores —la pantalla
 * "Empezar aquí", estos tres documentos y los diagramas— y mantenerlos a mano
 * garantiza que en un mes digan cosas distintas. Aquí hay una sola copia; todo
 * lo demás es una proyección de ella.
 *
 * El HTML es autocontenido (imágenes en data URI) a propósito: es un archivo que
 * se puede mover, adjuntar o abrir sin conexión, y es el que la aplicación
 * embebe para mostrarlo sin salir de ella.
 *
 * `--check` no escribe nada: falla si el Markdown quedó desfasado. CI lo ejecuta
 * en ese modo. El HTML y el PDF se regeneran con `pnpm docs`, no en `check`,
 * porque necesitan Chrome y CI no lo tiene garantizado.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, PHASES, COVERAGE, FIRST_QUESTIONS, stagesByPhase, stage, danglingReferences } from '../packages/onboarding/index.mjs';
import { TERMS } from '../packages/glossary/index.mjs';
import { FORMATION_STEPS } from '../packages/company-operations/workspace.mjs';
import { routeDiagram, useCaseDiagram } from './lib/diagrams.mjs';
import { markdownToHtml, embedFrom, slug } from './lib/markdown.mjs';
import { SCREEN_CSS, PRINT_CSS } from './lib/print-style.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const mdOut = path.join(docsDir, 'EMPEZAR-AQUI.md');
const htmlOut = path.join(docsDir, 'EMPEZAR-AQUI.html');
const pdfOut = path.join(docsDir, 'EMPEZAR-AQUI.pdf');

const check = process.argv.includes('--check');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

/* ------------------------------------------------------- integridad ------ */

const VIEWS = fs
  .readdirSync(path.join(root, 'apps/web/src/views'))
  .filter(f => f.endsWith('.js'))
  .map(f => f.replace('.js', ''));

const dangling = danglingReferences({
  views: VIEWS,
  glossaryIds: TERMS.map(t => t.id),
  formationSteps: FORMATION_STEPS.map(s => s.id)
});
if (dangling.length) {
  console.error('La ruta referencia cosas que no existen:');
  dangling.forEach(d => console.error(`  ${d}`));
  process.exit(1);
}

/* --------------------------------------------------------- diagramas ---- */

const diagrams = {
  'assets/diagramas/ruta-empresa.svg': routeDiagram(),
  'assets/diagramas/casos-de-uso.svg': useCaseDiagram()
};
if (!check) {
  for (const [rel, svg] of Object.entries(diagrams)) {
    const file = path.join(docsDir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, svg);
  }
}

/* ------------------------------------------------------------ capturas -- */

/**
 * Cada vista se ilustra UNA vez, en la primera etapa que la usa.
 *
 * Repetir la misma captura en cuatro etapas no enseña nada y multiplica el peso
 * del HTML y del PDF, donde la imagen va embebida y por tanto se duplica de
 * verdad. Las etapas siguientes remiten a la que ya la mostró.
 */
const guideShots = new Set(
  fs.existsSync(path.join(docsDir, 'assets/compacto'))
    ? fs.readdirSync(path.join(docsDir, 'assets/compacto')).filter(f => f.endsWith('.png')).map(f => f.replace('.png', ''))
    : []
);

const firstUse = new Map();
for (const s of STAGES) {
  const view = s.doInApp?.view;
  if (view && guideShots.has(view) && !firstUse.has(view)) firstUse.set(view, s.id);
}

/* -------------------------------------------------------- markdown ------ */

const termName = id => TERMS.find(t => t.id === id)?.term ?? id;
const termLink = id => `[${termName(id)}](GLOSSARY.md#${id})`;
const list = items => items.map(x => `- ${x}`).join('\n');

const decisionBlock = d => `
**Decisión: ${d.question}**

| Alternativa | Cuándo encaja | Ojo con |
|---|---|---|
${d.options.map(o => `| **${o.label}** | ${o.whenItFits} | ${o.watchOut ?? '—'} |`).join('\n')}
${d.note ? `\n> ${d.note}\n` : ''}`;

const stageSection = (s, index) => {
  const parts = [
    `<a id="${s.id}"></a>`,
    ``,
    `### ${index}. ${s.title}`,
    ``,
    `> *«${s.question}»*`,
    ``,
    s.why,
    ``,
    `**Qué necesitas tener antes**`,
    ``,
    list(s.needs ?? ['Nada especial: es el primer paso.'])
  ];

  for (const d of s.decisions ?? []) parts.push(decisionBlock(d));

  if (s.doInApp) {
    const view = s.doInApp.view;
    const owner = firstUse.get(view);
    parts.push(``, `**Dónde, en la aplicación**`, ``);
    parts.push(
      `Abre **${view}** → ${s.doInApp.label}.` +
        (s.formationStep ? ` El trámite queda registrado en **Constitución**, donde no se puede marcar como hecho sin evidencia.` : '')
    );
    if (owner === s.id) {
      parts.push(``, `![${s.doInApp.label} — pantalla ${view} de la aplicación](assets/compacto/${view}.png)`);
      parts.push(``, `<sub>La pantalla **${view}** en modo SANDBOX. Es la misma en el navegador, en Android y en Windows.</sub>`);
    } else if (owner) {
      parts.push(``, `<sub>Es la misma pantalla que viste en la etapa [«${stage(owner).title}»](#${owner}).</sub>`);
    }
  }

  if (s.documents?.length) {
    parts.push(
      ``,
      `**Qué documento te queda**`,
      ``,
      `| Documento | Quién lo emite | Por qué importa |`,
      `|---|---|---|`,
      ...s.documents.map(d => `| ${d.name} | ${d.whoIssues} | ${d.whyItMatters} |`)
    );
  }

  if (s.pitfalls?.length) parts.push(``, `**Errores típicos en esta etapa**`, ``, list(s.pitfalls.map(p => `⚠️ ${p}`)));

  parts.push(``, `**Sabes que terminaste cuando:** ${s.doneWhen}`);

  if (s.terms?.length) parts.push(``, `<sub>Términos de esta etapa: ${s.terms.map(termLink).join(' · ')}</sub>`);
  if (s.sources?.length) {
    parts.push(
      ``,
      `<sub>Fuentes: ${s.sources.map(x => (x.url.startsWith('http') ? `[${x.label}](${x.url})` : `[${x.label}](../${x.url})`)).join(' · ')}</sub>`
    );
  }
  return parts.join('\n');
};

let counter = 0;
const phaseSections = stagesByPhase()
  .map(phase => {
    const body = phase.stages.map(s => stageSection(s, ++counter)).join('\n\n---\n\n');
    return `
## ${phase.label}

*${phase.hint}*

${body}`;
  })
  .join('\n\n');

const markdown = `<!-- GENERADO POR scripts/build-guide.mjs — NO EDITAR A MANO. -->
<!-- Fuente de verdad: packages/onboarding/index.mjs · Regenerar: node scripts/build-guide.mjs -->

# 🧭 Empezar aquí

**Guía para quien nunca ha creado una empresa y no sabe por dónde empezar.**

Disponible también en [HTML](EMPEZAR-AQUI.html), que se abre dentro de la propia aplicación en la pestaña
*Empezar aquí*, y en [PDF](EMPEZAR-AQUI.pdf) para descargar o imprimir. Los tres formatos salen del mismo
sitio: [\`packages/onboarding/index.mjs\`](../packages/onboarding/index.mjs).

El [manual de usuario](MANUAL.md) explica **pantallas**: qué hace cada botón. Sirve cuando ya sabes qué quieres hacer.
Este documento explica el **camino**: qué hacer primero, qué decidir en cada punto, qué papel te va a quedar y cómo sabes
que terminaste. No supone que sepas contabilidad. Si algo no se entiende, es un defecto de este documento, no tuyo.

> [!IMPORTANT]
> Esta aplicación **no presenta ni paga nada** ante el SII ni ante ninguna municipalidad, y **no es asesoría tributaria**.
> Calcula, te dice de dónde salió cada número y guarda la evidencia. Los trámites los haces tú en los portales oficiales.

## Quién hace qué

![Casos de uso: quien crea la empresa usa el sistema para decidir, llevar capital, registrar operaciones, calcular impuestos, determinar el CPT, estimar la patente y auditar; los organismos externos quedan fuera](assets/diagramas/casos-de-uso.svg)

Lo que está **dentro** del recuadro lo hace la aplicación. Todo lo que cruza hacia el Registro de Empresas, el SII, la
municipalidad o el banco lo haces **tú**, en el portal del organismo: la aplicación no está conectada con ninguno de ellos,
y la línea discontinua está ahí para que eso no se malinterprete nunca.

## El camino completo

![La ruta completa: ${STAGES.length} etapas agrupadas en ${PHASES.length} fases](assets/diagramas/ruta-empresa.svg)

Las ${PHASES.length} fases no son sugerencias de orden: cada una necesita la anterior. No puedes obtener el RUT sin haber
constituido, ni la patente sin domicilio, ni cerrar el año sin haber cerrado los meses.

## Si sólo tienes una pregunta

| Tu pregunta | Ve a |
|---|---|
${FIRST_QUESTIONS.map(q => `| ${q.question} | [${stage(q.stage).title}](#${q.stage}) |`).join('\n')}

## La ruta, dentro de la aplicación

La misma secuencia está en la pestaña **Empezar aquí**, con una diferencia que en papel no se puede tener: muestra **tu**
avance real y cada etapa tiene un botón que abre la ventana donde se hace.

![La pantalla Empezar aquí de la aplicación](assets/compacto/empezar.png)

## Cómo leer cada etapa

Todas tienen la misma estructura, para que puedas saltar a la que necesites:

- **la pregunta** que probablemente te estés haciendo;
- **por qué** importa, en lenguaje corriente;
- **qué necesitas tener antes** de empezar;
- **las decisiones** con sus alternativas y con qué tener cuidado en cada una;
- **dónde**, en la aplicación, con la pantalla donde se hace;
- **qué documento te queda** y quién lo emite;
- **errores típicos**;
- **cómo sabes que terminaste**.

---
${phaseSections}

---

## Qué cubre este sistema y qué no

La respuesta honesta a «¿están todas las alternativas posibles?» es **no**. Un vacío declarado se puede trabajar;
uno silencioso se descubre tarde y caro.

### Sí está modelado

${list(COVERAGE.covered)}

### No está modelado

| Qué falta | Qué significa para ti |
|---|---|
${COVERAGE.notCovered.map(x => `| **${x.what}** | ${x.why} |`).join('\n')}

> ${COVERAGE.principle}

## Los cinco errores que más caro salen

1. **Registrar como capital todo el dinero que pone el dueño.** Un préstamo del accionista es una deuda de la empresa
   contigo: baja el capital propio tributario, mientras que un aporte lo sube. En la cartola se ven idénticos.
2. **Mezclar la cuenta personal con la de la empresa.** Reconstruirlo después es arqueología.
3. **Creer que la patente se calcula sobre las ventas.** Se calcula sobre el capital propio.
4. **Suponer que la patente del año 2 será igual que la del año 1.** La ley cambia la base: el primer año es el capital
   propio inicial declarado; desde el segundo, el capital propio del cierre anterior.
5. **No declarar el F29 los meses sin movimiento.** La obligación existe desde el inicio de actividades, tengas o no ventas.

## Cuándo dejar de leer y llamar a un contador

Esta aplicación te ayuda a operar y a entender, pero hay decisiones donde el ahorro de consultar es enorme:

- elegir el régimen tributario;
- estructuras con varios socios o con aportes de bienes de valor relevante;
- cuando el SII te notifica una diferencia;
- reorganizaciones: dividir, fusionar, transformar o cerrar la empresa;
- cualquier situación donde la aplicación diga *«requiere verificación con fuente oficial, municipalidad o profesional tributario»*.

## Para seguir

| Documento | Cuándo |
|---|---|
| [Manual de usuario](MANUAL.md) | Cuando ya sepas qué quieres hacer y necesites el detalle de la pantalla |
| [Glosario](GLOSSARY.md) | Cada vez que aparezca una palabra que no manejas |
| [Capital y patrimonio](accounting/CAPITAL-PATRIMONIO.md) | Para entender por qué son magnitudes distintas |
| [Capital Propio Tributario](tax/CAPITAL-PROPIO-TRIBUTARIO.md) | Antes del primer cierre anual |
| [Patente municipal](municipal/PATENTE-MUNICIPAL.md) | Antes de ir a la municipalidad |
| [Oficina virtual](guides/OFICINA-VIRTUAL.md) | Si operas sin oficina física |
| [Runbook mensual](RUNBOOK-MENSUAL.md) | Cuando la rutina ya esté andando |
| [Fuentes oficiales](SOURCES-2026.md) | Para verificar cualquier tasa o plazo |
`;

/* ------------------------------------------------------------- check ---- */

if (check) {
  const previous = fs.existsSync(mdOut) ? fs.readFileSync(mdOut, 'utf8') : '';
  if (previous !== markdown) {
    console.error('docs/EMPEZAR-AQUI.md está desfasado respecto de packages/onboarding/index.mjs.');
    console.error('Ejecuta: node scripts/build-guide.mjs');
    process.exit(1);
  }
  for (const [rel, svg] of Object.entries(diagrams)) {
    const file = path.join(docsDir, rel);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== svg) {
      console.error(`${rel} está desfasado. Ejecuta: node scripts/build-guide.mjs`);
      process.exit(1);
    }
  }
  console.log(`Guía sincronizada (${STAGES.length} etapas, ${Object.keys(diagrams).length} diagramas).`);
  process.exit(0);
}

fs.writeFileSync(mdOut, markdown);

/* -------------------------------------------------------------- HTML ---- */

const embed = embedFrom(docsDir);
const bodyHtml = markdownToHtml(markdown.slice(markdown.indexOf('# 🧭 Empezar aquí')), {
  resolveImage: embed,
  linkExternal: true
});

// Índice lateral: fases como cabecera y etapas debajo, en el mismo orden que el
// documento. Se arma desde los datos y no leyendo el HTML, para que no dependa
// de cómo quedó el marcado.
let tocN = 0;
const toc = stagesByPhase()
  .map(
    phase =>
      `<span class="toc--phase">${phase.label}</span>` +
      phase.stages.map(s => `<a href="#${s.id}">${++tocN}. ${s.title}</a>`).join('')
  )
  .join('');

const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Empezar aquí · Empresa Operativa Chile</title>
<style>${SCREEN_CSS}</style>
</head><body>
<div class="doc__bar">
  <b>🧭 Empezar aquí · Empresa Operativa Chile v${version}</b>
  <a href="EMPEZAR-AQUI.pdf" download>Descargar PDF</a>
</div>
<div class="doc">
  <nav class="doc__toc" aria-label="Índice">
    <h2>Contenido</h2>
    <a href="#empezar-aqui">Portada</a>
    <a href="#quien-hace-que">Quién hace qué</a>
    <a href="#el-camino-completo">El camino completo</a>
    <a href="#si-solo-tienes-una-pregunta">Si sólo tienes una pregunta</a>
    ${toc}
    <span class="toc--phase">Al final</span>
    <a href="#que-cubre-este-sistema-y-que-no">Qué cubre y qué no</a>
    <a href="#los-cinco-errores-que-mas-caro-salen">Errores caros</a>
    <a href="#cuando-dejar-de-leer-y-llamar-a-un-contador">Cuándo llamar a un contador</a>
  </nav>
  <main class="doc__body">${bodyHtml}</main>
</div>
</body></html>`;
// Sin una sola línea de JavaScript, a propósito: este HTML se abre DENTRO de la
// aplicación, cuya política de seguridad prohíbe scripts en línea. Un documento
// que necesita ejecutar código para leerse es, además, un documento frágil. El
// tema sigue al del sistema con `prefers-color-scheme`.

fs.writeFileSync(htmlOut, html);

/* --------------------------------------------------------------- PDF ---- */

const pdfHtml = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Empezar aquí · Empresa Operativa Chile</title>
<style>${PRINT_CSS}
  /* En papel el documento se lee de corrido: cada FASE abre página, no cada etapa. */
  h2 { page-break-before: always; }
  h3 { page-break-before: auto; }
</style></head><body>
<div class="portada">
  <img src="${embed('assets/banner.svg')}" alt="Empresa Operativa Chile">
  <h1>Empezar aquí</h1>
  <div class="sub">Guía para quien nunca ha creado una empresa · versión ${version}</div>
  <div class="meta">
    ${STAGES.length} etapas, de antes de existir al cierre del segundo ejercicio<br>
    Reglas del año comercial 2026 · MIT © Vladimir Acuña
  </div>
  <div class="aviso">
    <strong>Antes de empezar.</strong> Esta guía no es asesoría tributaria ni contable. La aplicación
    no presenta ni paga nada ante el SII ni ante ninguna municipalidad: calcula, explica de dónde salió
    cada número y guarda evidencia. Los trámites los haces tú en los portales oficiales, y cuando la
    aplicación y la fuente oficial no coincidan, manda la fuente oficial.
  </div>
</div>
${markdownToHtml(markdown.slice(markdown.indexOf('## Quién hace qué')), { resolveImage: embed })}
</body></html>`;

const { printPdf } = await import('./lib/chrome.mjs');
const { bytes, pages } = printPdf({ html: pdfHtml, out: pdfOut, timeBudget: 20000 });

console.log(`docs/EMPEZAR-AQUI.md   — ${STAGES.length} etapas en ${PHASES.length} fases`);
console.log(`docs/EMPEZAR-AQUI.html — ${(fs.statSync(htmlOut).size / 1024 / 1024).toFixed(1)} MB (autocontenido)`);
console.log(`docs/EMPEZAR-AQUI.pdf  — ${(bytes / 1024 / 1024).toFixed(1)} MB, ${pages} páginas`);
