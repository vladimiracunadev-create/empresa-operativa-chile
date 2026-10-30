#!/usr/bin/env node
/**
 * Genera el libro completo de Academia desde la misma fuente que consumen la
 * aplicación y los Markdown. `--check` valida contenido, tamaño y huella sin
 * abrir Chromium, para que CI detecte un PDF obsoleto con bajo costo.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSE_CLASSES, COURSE_UNIT_GUIDES } from '../packages/academy/course.mjs';
import { ACADEMY_LESSONS, ACADEMY_MODULES } from '../packages/academy/index.mjs';
import { ACADEMY_LABS } from '../packages/academy/labs.mjs';
import { ACADEMY_CASES } from '../packages/academy/cases.mjs';
import { saleFromNet, honorariumFromGross } from '../packages/accounting-engine/index.mjs';
import { loadRules } from '../packages/chile-tax-rules/index.mjs';
import { printPdf } from './lib/chrome.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pdfOut = path.join(root, 'docs', 'ACADEMIA-COMPLETA.pdf');
const manifestOut = path.join(root, 'docs', 'ACADEMIA-COMPLETA.manifest.json');
const check = process.argv.includes('--check');
const catalog = { version: 1, units: COURSE_UNIT_GUIDES, classes: COURSE_CLASSES, guided: ACADEMY_LESSONS, labs: ACADEMY_LABS, cases: ACADEMY_CASES };
const sourceHash = crypto.createHash('sha256').update(JSON.stringify(catalog)).digest('hex');
const h = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const list = values => `<ul>${values.map(value => `<li>${h(value)}</li>`).join('')}</ul>`;
const ordered = values => `<ol>${values.map(value => `<li>${h(value)}</li>`).join('')}</ol>`;
const paragraphs = values => values.map(value => `<p>${h(value)}</p>`).join('');
const rows = (values, render) => values.map(render).join('');
const fmtCLP = value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

const verify = () => {
  const errors = [];
  if (!fs.existsSync(pdfOut)) errors.push('falta docs/ACADEMIA-COMPLETA.pdf');
  if (!fs.existsSync(manifestOut)) errors.push('falta docs/ACADEMIA-COMPLETA.manifest.json');
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(manifestOut, 'utf8')); } catch { errors.push('el manifiesto del PDF no es JSON válido'); }
  if (manifest?.sourceHash !== sourceHash) errors.push('el PDF no corresponde al contenido actual de Academia');
  if (manifest?.classes !== COURSE_CLASSES.length || manifest?.units !== COURSE_UNIT_GUIDES.length || manifest?.guided !== ACADEMY_LESSONS.length || manifest?.labs !== ACADEMY_LABS.length || manifest?.cases !== ACADEMY_CASES.length) errors.push('el manifiesto no contiene el catálogo completo');
  if (fs.existsSync(pdfOut) && fs.statSync(pdfOut).size < 300_000) errors.push('el PDF es demasiado pequeño para el libro completo');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  if (!readme.includes('docs/ACADEMIA-COMPLETA.pdf')) errors.push('el README principal no enlaza el PDF');
  if (errors.length) {
    console.error(`Libro de Academia desincronizado:\n- ${errors.join('\n- ')}\nEjecuta: pnpm academy:pdf`);
    process.exit(1);
  }
  console.log(`Libro de Academia sincronizado: ${manifest.pages} páginas, ${COURSE_CLASSES.length} clases, huella ${sourceHash.slice(0, 12)}.`);
};

if (check) verify();
else {
  const classHtml = COURSE_UNIT_GUIDES.map(guide => {
    const classes = COURSE_CLASSES.filter(item => item.module === guide.id);
    return `<section class="unit" id="unidad-${h(guide.id)}">
      <header class="unit-cover"><div class="unit-icon">${h(guide.icon)}</div><div><span>UNIDAD ${h(guide.id)} · ${classes.length} CLASES</span><h2>${h(guide.title)}</h2><p>${h(guide.summary)}</p></div></header>
      <div class="unit-grid"><article><h3>Por qué importa</h3><p>${h(guide.why)}</p></article><article><h3>Antes de empezar</h3><p>${h(guide.prerequisite)}</p></article></div>
      <div class="question"><h3>Preguntas que podrás responder</h3>${list(guide.questions)}</div>
      <h3>Mapa de la unidad</h3><table><thead><tr><th>Clase</th><th>Contenido</th><th>Resultado</th></tr></thead><tbody>${rows(classes, item => `<tr><td>${h(item.id)}</td><td><b>${h(item.title)}</b><br>${h(item.explanation)}</td><td>${h(item.outcome)}</td></tr>`)}</tbody></table>
      <div class="milestone"><b>Producto final:</b> ${h(guide.milestone)}</div>
      ${classes.map((item, index) => `<article class="lesson" id="${h(item.id)}">
        <header class="lesson-head"><span>CLASE ${index + 1} DE ${classes.length} · ${h(item.level)} · ${item.durationMinutes} MIN</span><h2>${h(item.id)} — ${h(item.title)}</h2><p>${h(item.explanation)}</p></header>
        <div class="callout"><b>Antes de empezar.</b> ${h(item.prerequisite)}<br><b>Caso conductor.</b> ${h(item.caseContext)}</div>
        <h3>Resultados verificables</h3>${list(item.results)}
        <h3>Conceptos operacionales</h3><table><thead><tr><th>Concepto</th><th>Cómo se usa aquí</th></tr></thead><tbody>${rows(item.concepts, concept => `<tr><td><b>${h(concept.name)}</b></td><td>${h(concept.meaning)}</td></tr>`)}</tbody></table>
        <div class="model"><h3>Modelo mental</h3><p>${h(item.mentalModel)}</p></div>
        ${item.development.map(section => `<h3>${h(section.title)}</h3><p>${h(section.body)}</p>`).join('')}
        <div class="example"><h3>Ejemplo trabajado</h3><p><b>Situación.</b> ${h(item.workedExample.situation)}</p>${ordered(item.workedExample.steps)}<p><b>Interpretación.</b> ${h(item.workedExample.interpretation)}</p></div>
        <div class="practice"><h3>Taller guiado</h3><p><b>Problema.</b> ${h(item.workshop.prompt)}</p><p>${h(item.workshop.beforeYouStart)}</p>${ordered(item.workshop.sequence)}<h4>Entregable</h4><p>${h(item.workshop.deliverable)}</p><h4>Criterio de aceptación</h4>${list(item.workshop.acceptance)}</div>
        <h3>Errores frecuentes y recuperación</h3><table><thead><tr><th>Síntoma</th><th>Causa</th><th>Cómo corregirlo</th></tr></thead><tbody>${rows(item.commonErrors, error => `<tr><td>${h(error.symptom)}</td><td>${h(error.cause)}</td><td>${h(error.correction)}</td></tr>`)}</tbody></table>
        <h3>Comprobación formativa</h3>${item.checks.map((entry, questionIndex) => `<div class="answer"><b>${questionIndex + 1}. ${h(entry.question)}</b><p>${h(entry.answer)}</p></div>`).join('')}
        <h3>Llevarlo a la aplicación</h3><p>${item.appViews.map(h).join(' → ')}</p><p class="boundary">${h(item.boundary)}</p>
        <h3>Fuentes y verificación</h3>${list(item.sources)}<p>Las tasas, plazos y formularios se verifican para el período concreto antes de actuar.</p>
      </article>`).join('')}
    </section>`;
  }).join('');

  const guidedHtml = ACADEMY_MODULES.map(module => `<section class="appendix"><h2>Rutas guiadas · ${h(module.title)}</h2><p>${h(module.description)}</p>${ACADEMY_LESSONS.filter(item => item.module === module.id).map(item => `<article class="resource"><h3>${h(item.id)} — ${h(item.title)}</h3><p><b>Meta:</b> ${h(item.goal)} · ${item.durationMinutes} min · ${h(item.level)}</p>${item.sections.map(section => `<h4>${h(section.title)}</h4>${paragraphs(section.paragraphs)}`).join('')}<div class="example"><h4>Ejemplo · ${h(item.workedExample.title)}</h4><p>${h(item.workedExample.scenario)}</p>${ordered(item.workedExample.steps)}<p><b>Conclusión.</b> ${h(item.workedExample.conclusion)}</p></div><div class="practice"><h4>Práctica</h4><p>${h(item.practice.prompt)}</p>${list(item.practice.tasks)}</div><div class="answer"><b>${h(item.check.question)}</b><p>Respuesta: ${h(item.check.options[item.check.correctIndex])}. ${h(item.check.explanation)}</p></div><h4>Evidencia</h4>${list(item.evidence)}<h4>Fuentes</h4>${list(item.sources.map(source => `${source.title}: ${source.url}`))}</article>`).join('')}</section>`).join('');

  const labsHtml = `<section class="appendix"><h2>Laboratorios con pauta y rúbrica</h2>${ACADEMY_LABS.map(item => `<article class="resource"><h3>${h(item.id)} — ${h(item.title)}</h3><p>${h(item.brief)}</p><div class="callout">${h(item.safety)}</div><h4>Entradas</h4>${list(item.inputs)}<h4>Trabajo</h4>${ordered(item.tasks)}<h4>Entregables</h4>${list(item.deliverables)}<h4>Rúbrica</h4><table><thead><tr><th>Criterio</th><th>Peso</th><th>Evidencia</th></tr></thead><tbody>${rows(item.rubric, row => `<tr><td>${h(row.criterion)}</td><td>${row.weight}%</td><td>${h(row.evidence)}</td></tr>`)}</tbody></table><h4>Pauta de solución</h4>${list(item.expected)}<h4>Errores que debes buscar</h4>${list(item.commonErrors)}<p><b>Aprobación:</b> ${h(item.pass)}</p></article>`).join('')}</section>`;

  const casesHtml = `<section class="appendix"><h2>Casos integradores</h2>${ACADEMY_CASES.map(item => `<article class="resource"><h3>${h(item.id)} — ${h(item.title)}</h3><p><b>Dedicación:</b> ${item.hours} h. ${h(item.boundary)}</p><p>${h(item.situation)}</p><h4>Objetivo</h4><p>${h(item.learningGoal)}</p><h4>Expediente inicial</h4>${list(item.facts)}<h4>Etapas</h4>${ordered(item.stages.map(stage => `${stage.name}: ${stage.work}`))}<h4>Decisiones que debes defender</h4>${list(item.decisions)}<h4>Entrega</h4>${list(item.studentPack)}<h4>Rúbrica</h4><table><thead><tr><th>Criterio</th><th>Peso</th><th>Qué se observa</th></tr></thead><tbody>${rows(item.evaluation, row => `<tr><td>${h(row.criterion)}</td><td>${row.weight}%</td><td>${h(row.descriptor)}</td></tr>`)}</tbody></table><h4>Pauta de revisión</h4>${list(item.expectedFindings)}</article>`).join('')}</section>`;

  const rules = loadRules(2026);
  const sale = saleFromNet(500000, 2026);
  const fee = honorariumFromGross(300000, 2026);
  const workshopsHtml = `<section class="appendix"><h2>Talleres calculados con el motor</h2><article class="resource"><h3>T01 — Venta: del documento a la cobranza</h3><p>Factura un servicio por ${fmtCLP(sale.net)} netos. El IVA es ${fmtCLP(sale.iva)} y el total ${fmtCLP(sale.total)}. El ingreso sigue siendo ${fmtCLP(sale.net)}; la emisión y la cobranza son hechos distintos.</p></article><article class="resource"><h3>T02 — Honorario: bruto, retención y líquido</h3><p>Para un bruto de ${fmtCLP(fee.gross)}, la regla ${rules.commercialYear} usa ${(fee.rate * 100).toFixed(1)} %. Retención: ${fmtCLP(fee.retention)}; líquido: ${fmtCLP(fee.liquid)}. La tasa se verifica nuevamente para otro período.</p></article></section>`;

  const toc = COURSE_UNIT_GUIDES.map(guide => `<li><a href="#unidad-${h(guide.id)}">${h(guide.icon)} Unidad ${h(guide.id)} · ${h(guide.title)}</a><span>${guide.classIds.join('–')}</span></li>`).join('');
  const html = `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><title>Academia completa · Empresa Operativa Chile</title><style>
    @page{size:A4;margin:15mm 14mm 17mm}@page:first{margin:0}*{box-sizing:border-box}body{margin:0;color:#172033;font:10pt/1.5 "Segoe UI",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1,h2,h3,h4{color:#10204a;line-height:1.2;page-break-after:avoid}h2{font-size:20pt}h3{margin:18px 0 7px;font-size:13pt;color:#284f9e}h4{margin:14px 0 5px;font-size:10.5pt}p{margin:0 0 8px}ul,ol{margin:5px 0 10px;padding-left:21px}li{margin:3px 0}table{width:100%;margin:8px 0 13px;border-collapse:collapse;font-size:8.4pt;page-break-inside:avoid}thead{display:table-header-group}tr{page-break-inside:avoid}th,td{padding:6px 7px;border:1px solid #ccd6e6;text-align:left;vertical-align:top}th{background:#eaf0fb;color:#10204a}a{color:#284f9e;text-decoration:none}.cover{height:297mm;padding:30mm 22mm;color:#fff;background:radial-gradient(circle at 80% 16%,#22d3ee55,transparent 30%),linear-gradient(145deg,#172554,#3730a3 60%,#0e7490);page-break-after:always}.cover .mark{display:inline-grid;place-items:center;width:72px;height:72px;border:1px solid #ffffff77;border-radius:22px;background:#ffffff18;font-size:36px}.cover h1{max-width:150mm;margin:25mm 0 10px;color:#fff;font-size:35pt}.cover .subtitle{max-width:145mm;font-size:16pt;color:#dbeafe}.cover .counts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:24mm}.cover .counts div{padding:12px;border:1px solid #ffffff44;border-radius:10px;background:#ffffff10}.cover .counts b{display:block;font-size:19pt}.cover .notice{margin-top:22mm;padding:14px;border-left:4px solid #fbbf24;background:#17255499}.toc{page-break-after:always}.toc h2{border-bottom:3px solid #4f46e5;padding-bottom:8px}.toc ol{columns:2;column-gap:22px;list-style:none;padding:0}.toc li{break-inside:avoid;margin:0 0 9px;padding:8px;border:1px solid #dbe3ef;border-radius:8px}.toc span{display:block;color:#64748b;font-size:8pt}.unit{page-break-before:always}.unit-cover{display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:center;padding:18px;border-radius:14px;background:linear-gradient(135deg,#eef2ff,#ecfeff)}.unit-icon{display:grid;place-items:center;width:64px;height:64px;border-radius:17px;background:#fff;font-size:30px}.unit-cover span,.lesson-head span{color:#4f46e5;font-size:8pt;font-weight:800;letter-spacing:.08em}.unit-cover h2,.lesson-head h2{margin:4px 0 7px}.unit-cover p,.lesson-head p{margin:0;color:#46536a}.unit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.unit-grid article,.question,.milestone{padding:11px 13px;border:1px solid #dbe3ef;border-radius:9px}.question{border-left:4px solid #4f46e5}.milestone{border-left:4px solid #059669;background:#ecfdf5}.lesson{page-break-before:always}.lesson-head{padding:13px 15px;border-left:5px solid #4f46e5;background:#f4f6fb}.callout,.model,.example,.practice,.answer{margin:10px 0;padding:10px 12px;border:1px solid #dbe3ef;border-left:4px solid #4f46e5;border-radius:8px;background:#f8fafc;page-break-inside:avoid}.example{border-left-color:#059669}.practice{border-left-color:#d97706}.answer{border-left-color:#64748b}.boundary{padding:8px 10px;background:#fff7ed;border:1px solid #fed7aa;border-radius:7px}.appendix{page-break-before:always}.resource{page-break-before:always}.resource:first-of-type{page-break-before:auto}.resource>h3:first-child{padding:10px 12px;border-left:4px solid #4f46e5;background:#f4f6fb}.footer-note{margin-top:18px;color:#64748b;font-size:8pt}
  </style></head><body>
  <section class="cover"><div class="mark">🎓</div><h1>Academia completa</h1><p class="subtitle">De los hechos y documentos al cierre, la automatización y el control interno.</p><div class="counts"><div><b>${COURSE_CLASSES.length}</b>clases</div><div><b>${COURSE_UNIT_GUIDES.length}</b>unidades</div><div><b>${ACADEMY_LABS.length}</b>laboratorios</div><div><b>${ACADEMY_CASES.length}</b>casos</div></div><div class="notice"><b>Material educativo.</b> Practica con datos ficticios en SANDBOX. Este libro no presenta declaraciones, firma, paga ni sustituye a autoridades o profesionales habilitados.</div></section>
  <section class="toc"><h2>Cómo usar este libro</h2><p>Cada clase sigue observar → razonar → resolver → comprobar → aplicar. Lee la introducción de la unidad, resuelve el taller antes de revisar la pauta y conserva un entregable trazable.</p><h3>Índice de unidades</h3><ol>${toc}</ol><p class="footer-note">Contenido generado desde la misma fuente que usan la PWA, Windows, Android y los Markdown del repositorio. Huella de contenido: ${sourceHash}.</p></section>
  ${classHtml}${guidedHtml}${labsHtml}${casesHtml}${workshopsHtml}</body></html>`;

  const result = printPdf({ html, out: pdfOut, timeBudget: 120_000, minBytes: 300_000 });
  const manifest = { generatedAt: new Date().toISOString(), sourceHash, bytes: result.bytes, pages: result.pages, units: COURSE_UNIT_GUIDES.length, classes: COURSE_CLASSES.length, guided: ACADEMY_LESSONS.length, labs: ACADEMY_LABS.length, cases: ACADEMY_CASES.length, workshops: 2 };
  fs.writeFileSync(manifestOut, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`docs/ACADEMIA-COMPLETA.pdf — ${result.pages} páginas, ${(result.bytes / 1024 / 1024).toFixed(1)} MB, ${COURSE_CLASSES.length} clases completas.`);
}
