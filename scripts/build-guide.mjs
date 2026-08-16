#!/usr/bin/env node
/**
 * Genera `docs/EMPEZAR-AQUI.md` desde `packages/onboarding/index.mjs`.
 *
 * Mismo motivo que el glosario: la ruta tiene dos consumidores —la vista
 * “Empezar aquí” y este documento— y mantenerlos a mano garantiza que en un mes
 * digan cosas distintas. Aquí hay una sola copia; el documento es una
 * proyección de ella.
 *
 * `--check` no escribe nada: falla si el documento quedó desfasado. CI lo
 * ejecuta en ese modo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGES, PHASES, COVERAGE, FIRST_QUESTIONS, stagesByPhase, stage, danglingReferences } from '../packages/onboarding/index.mjs';
import { TERMS } from '../packages/glossary/index.mjs';
import { FORMATION_STEPS } from '../packages/company-operations/workspace.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'docs/EMPEZAR-AQUI.md');

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

const termName = id => TERMS.find(t => t.id === id)?.term ?? id;
const termLink = id => `[${termName(id)}](GLOSSARY.md#${id})`;

const stageAnchor = id => `#${id}`;

const list = items => items.map(x => `- ${x}`).join('\n');

const decisionBlock = d => {
  const rows = d.options
    .map(o => `| **${o.label}** | ${o.whenItFits} | ${o.watchOut ?? '—'} |`)
    .join('\n');
  return `
**Decisión: ${d.question}**

| Alternativa | Cuándo encaja | Ojo con |
|---|---|---|
${rows}
${d.note ? `\n> ${d.note}\n` : ''}`;
};

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
    parts.push(
      ``,
      `**Dónde, en la aplicación**`,
      ``,
      `Abre **${s.doInApp.view}** → ${s.doInApp.label}.` +
        (s.formationStep ? ` El trámite queda registrado en **Constitución**, donde no se puede marcar como hecho sin evidencia.` : '')
    );
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

  if (s.pitfalls?.length) {
    parts.push(``, `**Errores típicos en esta etapa**`, ``, list(s.pitfalls.map(p => `⚠️ ${p}`)));
  }

  parts.push(``, `**Sabes que terminaste cuando:** ${s.doneWhen}`);

  if (s.terms?.length) {
    parts.push(``, `<sub>Términos de esta etapa: ${s.terms.map(termLink).join(' · ')}</sub>`);
  }
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

const body = `<!-- GENERADO POR scripts/build-guide.mjs — NO EDITAR A MANO. -->
<!-- Fuente de verdad: packages/onboarding/index.mjs · Regenerar: node scripts/build-guide.mjs -->

# 🧭 Empezar aquí

**Guía para quien nunca ha creado una empresa y no sabe por dónde empezar.**

El [manual de usuario](MANUAL.md) explica **pantallas**: qué hace cada botón. Sirve cuando ya sabes qué quieres hacer.
Este documento explica el **camino**: qué hacer primero, qué decidir en cada punto, qué papel te va a quedar y cómo sabes
que terminaste. No supone que sepas contabilidad. Si algo no se entiende, es un defecto de este documento, no tuyo.

> [!IMPORTANT]
> Esta aplicación **no presenta ni paga nada** ante el SII ni ante ninguna municipalidad, y **no es asesoría tributaria**.
> Calcula, te dice de dónde salió cada número y guarda la evidencia. Los trámites los haces tú en los portales oficiales.

## Si sólo tienes una pregunta

| Tu pregunta | Ve a |
|---|---|
${FIRST_QUESTIONS.map(q => `| ${q.question} | [${stage(q.stage).title}](${stageAnchor(q.stage)}) |`).join('\n')}

## El camino completo

${PHASES.map(p => {
  const items = STAGES.filter(s => s.phase === p.id);
  return `**${p.label}** — ${items.map(s => `[${s.title}](${stageAnchor(s.id)})`).join(' → ')}`;
}).join('\n\n')}

Las cinco fases no son sugerencias de orden: cada una necesita la anterior. No puedes obtener el RUT sin haber
constituido, ni la patente sin domicilio, ni cerrar el año sin haber cerrado los meses.

## Cómo leer cada etapa

Todas tienen la misma estructura, para que puedas saltar a la que necesites:

- **la pregunta** que probablemente te estés haciendo;
- **por qué** importa, en lenguaje corriente;
- **qué necesitas tener antes** de empezar;
- **las decisiones** con sus alternativas y con qué tener cuidado en cada una;
- **dónde**, en la aplicación;
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

const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (process.argv.includes('--check')) {
  if (previous !== body) {
    console.error('docs/EMPEZAR-AQUI.md está desfasado respecto de packages/onboarding/index.mjs.');
    console.error('Ejecuta: node scripts/build-guide.mjs');
    process.exit(1);
  }
  console.log(`Guía sincronizada (${STAGES.length} etapas).`);
} else {
  fs.writeFileSync(target, body);
  console.log(`docs/EMPEZAR-AQUI.md generado con ${STAGES.length} etapas en ${PHASES.length} fases.`);
}
