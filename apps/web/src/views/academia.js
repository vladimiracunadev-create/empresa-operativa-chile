import { html, raw, esc, fmtCLP, fmtPercent } from '../lib/dom.js';
import { state, ws, setMode } from '../lib/state.js';
import { openExternal } from '../lib/platform.js';
import { saleFromNet, honorariumFromGross, journal } from '../core/accounting-engine/index.mjs';
import { loadRules } from '../core/chile-tax-rules/index.mjs';
import { ACADEMY_LESSONS, ACADEMY_MODULES } from '../core/academy/index.mjs';
import { COURSE_CLASSES, COURSE_UNIT_GUIDES } from '../core/academy/course.mjs';
import { ACADEMY_LABS } from '../core/academy/labs.mjs';
import { ACADEMY_CASES } from '../core/academy/cases.mjs';

const PROGRESS_KEY = 'empresa-operativa:academy-progress:v2';
let activeTab = 'course';
let activeCourseModule = null;
let activeCourseClass = null;

const readProgress = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveProgress = progress => {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify([...progress].sort())); } catch { /* almacenamiento no disponible */ }
};

const list = values => `<ul>${values.map(value => `<li>${esc(value)}</li>`).join('')}</ul>`;
const numbered = values => `<ol>${values.map(value => `<li>${esc(value)}</li>`).join('')}</ol>`;
const completedButton = (id, progress) => `<button class="btn btn--sm ${progress.has(id) ? 'btn--ok' : ''}" data-academy-complete="${esc(id)}" aria-pressed="${progress.has(id)}">${progress.has(id) ? '✓ Completado' : 'Marcar completado'}</button>`;

const renderGuided = progress => ACADEMY_MODULES.map(module => {
  const lessons = ACADEMY_LESSONS.filter(item => item.module === module.id);
  return `<section class="academy-module">
    <div class="academy-module__head"><div><span class="eyebrow">Ruta ${esc(module.id)}</span><h2>${esc(module.title)}</h2><p>${esc(module.description)}</p></div><span class="tag">${lessons.length} lecciones</span></div>
    ${lessons.map(item => `<details class="academy-unit" data-academy-item data-search="${esc(`${item.id} ${item.title} ${item.goal} ${item.concepts.join(' ')}`.toLowerCase())}">
      <summary><span class="academy-unit__code">${esc(item.id)}</span><span><strong>${esc(item.title)}</strong><small>${esc(item.level)} · ${item.durationMinutes} min · ${esc(item.goal)}</small></span><span class="academy-done" aria-label="${progress.has(item.id) ? 'Completado' : 'Pendiente'}">${progress.has(item.id) ? '✓' : '○'}</span></summary>
      <div class="academy-unit__body">
        <div class="academy-callout"><strong>Al terminar podrás</strong><p>${esc(item.goal)}</p></div>
        <div class="academy-concepts">${item.concepts.map(value => `<span>${esc(value)}</span>`).join('')}</div>
        ${item.sections.map(section => `<section><h3>${esc(section.title)}</h3>${section.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('')}
        <section class="academy-example"><h3>Ejemplo trabajado · ${esc(item.workedExample.title)}</h3><p>${esc(item.workedExample.scenario)}</p>${numbered(item.workedExample.steps)}<p><strong>Conclusión:</strong> ${esc(item.workedExample.conclusion)}</p></section>
        <section class="academy-practice"><h3>Ahora resuélvelo tú</h3><p>${esc(item.practice.prompt)}</p>${list(item.practice.tasks)}</section>
        <fieldset class="academy-quiz"><legend>${esc(item.check.question)}</legend>${item.check.options.map((option, index) => `<button type="button" class="academy-option" data-quiz="${esc(item.id)}" data-option="${index}" data-correct="${item.check.correctIndex}">${esc(option)}</button>`).join('')}<p class="academy-feedback" data-feedback="${esc(item.id)}" role="status" aria-live="polite"></p></fieldset>
        <section><h3>Evidencia que debes conservar</h3>${list(item.evidence)}</section>
        <div class="academy-actions">${completedButton(item.id, progress)}<button class="btn btn--sm btn--primary" data-go="${esc(item.appAction.view)}">${esc(item.appAction.label)}</button></div>
        <p class="card__hint">${esc(item.appAction.instruction)}</p>
        <div class="academy-sources">${item.sources.map(source => `<button class="btn btn--ghost btn--sm" data-ext="${esc(source.url)}">Fuente: ${esc(source.title)}</button>`).join('')}</div>
      </div>
    </details>`).join('')}
  </section>`;
}).join('');

const courseNavigation = (item, compact = false) => {
  const index = COURSE_CLASSES.findIndex(value => value.id === item.id);
  const previous = COURSE_CLASSES[index - 1];
  const next = COURSE_CLASSES[index + 1];
  return `<nav class="academy-reader-nav ${compact ? 'academy-reader-nav--compact' : ''}" aria-label="Navegación entre clases">
    ${previous ? `<button type="button" class="academy-reader-nav__step" data-course-class-open="${esc(previous.id)}"><span>← Clase anterior</span><strong>${esc(previous.id)} · ${esc(previous.title)}</strong></button>` : '<span class="academy-reader-nav__edge">Inicio del curso</span>'}
    <button type="button" class="btn btn--ghost btn--sm" data-course-back="module">↑ Unidad ${esc(item.module)}</button>
    ${next ? `<button type="button" class="academy-reader-nav__step academy-reader-nav__step--next" data-course-class-open="${esc(next.id)}"><span>Clase siguiente →</span><strong>${esc(next.id)} · ${esc(next.title)}</strong></button>` : '<span class="academy-reader-nav__edge">Fin del curso</span>'}
  </nav>`;
};

const renderCourseClass = (item, progress) => {
  const guide = COURSE_UNIT_GUIDES.find(value => value.id === item.module);
  const classIndex = COURSE_CLASSES.findIndex(value => value.id === item.id) + 1;
  return `<section class="academy-reader" data-academy-item data-search="${esc(`${item.id} ${item.title} ${item.outcome} ${item.explanation} ${item.evidence.join(' ')}`.toLowerCase())}">
    <div class="academy-breadcrumb"><button type="button" data-course-back="curriculum">Las 17 unidades</button><span>›</span><button type="button" data-course-back="module">Unidad ${esc(item.module)}</button><span>›</span><strong>${esc(item.id)}</strong></div>
    ${courseNavigation(item, true)}
    <header class="academy-reader__hero" tabindex="-1" data-course-focus>
      <div class="academy-reader__icon" aria-hidden="true">${esc(guide.icon)}</div>
      <div><span class="eyebrow">Clase ${classIndex} de ${COURSE_CLASSES.length} · Unidad ${esc(item.module)}</span><h2>${esc(item.id)} — ${esc(item.title)}</h2><p>${esc(item.explanation)}</p><div class="academy-concepts"><span>${esc(item.level)}</span><span>${item.durationMinutes} min</span><span>${progress.has(item.id) ? '✓ Completada' : '○ Pendiente'}</span></div></div>
    </header>
    <article class="academy-unit__body academy-reader__body">
      <div class="academy-callout"><strong>Antes de empezar</strong><p>${esc(item.prerequisite)}</p><p><strong>Caso conductor:</strong> ${esc(item.caseContext)}</p></div>
      <section><h3>Resultados verificables</h3>${list(item.results)}</section>
      <section><h3>Conceptos operacionales</h3><div class="tablewrap"><table><thead><tr><th>Concepto</th><th>Cómo se usa aquí</th></tr></thead><tbody>${item.concepts.map(concept => `<tr><td><strong>${esc(concept.name)}</strong></td><td>${esc(concept.meaning)}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="academy-model"><h3>Modelo mental</h3><p>${esc(item.mentalModel)}</p></section>
      ${item.development.map(section => `<section><h3>${esc(section.title)}</h3><p>${esc(section.body)}</p></section>`).join('')}
      <section class="academy-example"><h3>Ejemplo trabajado</h3><p><strong>Situación:</strong> ${esc(item.workedExample.situation)}</p>${numbered(item.workedExample.steps)}<p><strong>Interpretación:</strong> ${esc(item.workedExample.interpretation)}</p></section>
      <section class="academy-practice"><h3>Taller guiado</h3><p><strong>Problema:</strong> ${esc(item.workshop.prompt)}</p><p>${esc(item.workshop.beforeYouStart)}</p>${numbered(item.workshop.sequence)}<h4>Entregable</h4><p>${esc(item.workshop.deliverable)}</p><h4>Criterio de aceptación</h4>${list(item.workshop.acceptance)}</section>
      <section><h3>Errores frecuentes y recuperación</h3><div class="tablewrap"><table><thead><tr><th>Síntoma</th><th>Causa</th><th>Corrección</th></tr></thead><tbody>${item.commonErrors.map(error => `<tr><td>${esc(error.symptom)}</td><td>${esc(error.cause)}</td><td>${esc(error.correction)}</td></tr>`).join('')}</tbody></table></div></section>
      <section><h3>Comprobación formativa</h3>${item.checks.map((check, index) => `<details class="qa"><summary>${index + 1}. ${esc(check.question)}</summary><div class="qa__body"><p>${esc(check.answer)}</p></div></details>`).join('')}</section>
      <section><h3>Llevarlo a la aplicación</h3><p>${item.appViews.map(view => `<span class="tag">${esc(view)}</span>`).join(' ')}</p><p class="card__hint">${esc(item.boundary)}</p></section>
      <section><h3>Fuentes para verificar</h3>${list(item.sources)}</section>
      <div class="academy-actions">${completedButton(item.id, progress)}<button class="btn btn--sm btn--primary" data-to-sandbox>Practicar en SANDBOX</button></div>
    </article>
    ${courseNavigation(item)}
  </section>`;
};

const renderCourseModule = (guide, progress) => {
  const classes = COURSE_CLASSES.filter(item => item.module === guide.id);
  const completed = classes.filter(item => progress.has(item.id)).length;
  return `<section class="academy-unit-overview" data-course-module="${esc(guide.id)}">
    <div class="academy-breadcrumb"><button type="button" data-course-back="curriculum">Las 17 unidades</button><span>›</span><strong>Unidad ${esc(guide.id)}</strong></div>
    <header class="academy-unit-overview__hero" tabindex="-1" data-course-focus>
      <div class="academy-unit-overview__icon" aria-hidden="true">${esc(guide.icon)}</div><div><span class="eyebrow">Unidad ${esc(guide.id)} · ${classes.length} clases · ${completed} completadas</span><h2>${esc(guide.title)}</h2><p>${esc(guide.summary)}</p></div>
    </header>
    <div class="academy-unit-overview__grid"><section><h3>Por qué importa</h3><p>${esc(guide.why)}</p></section><section><h3>Antes de empezar</h3><p>${esc(guide.prerequisite)}</p></section></div>
    <section class="academy-question-map"><div><span aria-hidden="true">?</span><h3>Preguntas que podrás responder</h3></div>${list(guide.questions)}</section>
    <section><h3>Recorrido de la unidad</h3><p class="card__hint">Cada paso produce una evidencia. Puedes volver a este mapa o avanzar con los controles anterior/siguiente.</p><div class="academy-class-path">${classes.map((item, index) => `<button type="button" class="academy-class-card" data-course-class-open="${esc(item.id)}" data-academy-item data-search="${esc(`${item.id} ${item.title} ${item.outcome} ${item.explanation}`.toLowerCase())}"><span class="academy-class-card__step">${index + 1}</span><span><strong>${esc(item.id)} · ${esc(item.title)}</strong><small>${esc(item.outcome)}</small></span><span class="academy-done">${progress.has(item.id) ? '✓' : '→'}</span></button>`).join('')}</div></section>
    <section class="academy-milestone"><span aria-hidden="true">🏁</span><div><h3>Producto final de la unidad</h3><p>${esc(guide.milestone)}</p></div></section>
    <div class="academy-actions"><button type="button" class="btn btn--ghost" data-course-back="curriculum">← Ver las 17 unidades</button><button type="button" class="btn btn--primary" data-course-class-open="${esc(classes[0].id)}">Empezar por ${esc(classes[0].id)} →</button></div>
  </section>`;
};

const renderCourseCurriculum = progress => `<section class="academy-curriculum">
  <header class="academy-curriculum__intro" tabindex="-1" data-course-focus><div><span class="eyebrow">Currículo completo</span><h2>Una ruta visible, no una lista de 70 títulos</h2><p>Las 17 unidades avanzan desde observar un hecho hasta diseñar controles e investigaciones. Entra a una unidad para leer su explicación completa y revisar todas sus clases antes de comenzar.</p></div><div class="academy-learning-loop" role="img" aria-label="Observar, razonar, resolver, comprobar y aplicar">${['👁 Observar', '🧠 Razonar', '🛠 Resolver', '✓ Comprobar', '🚀 Aplicar'].map((label, index) => `<span><b>${index + 1}</b>${label}</span>`).join('')}</div></header>
  <div class="academy-unit-grid">${COURSE_UNIT_GUIDES.map(guide => {
    const classes = COURSE_CLASSES.filter(item => item.module === guide.id);
    const completed = classes.filter(item => progress.has(item.id)).length;
    return `<article class="academy-unit-card academy-unit-card--${esc(guide.color)}" data-academy-item data-search="${esc(`${guide.id} ${guide.title} ${guide.summary} ${guide.questions.join(' ')} ${classes.map(item => `${item.id} ${item.title}`).join(' ')}`.toLowerCase())}">
      <div class="academy-unit-card__top"><span class="academy-unit-card__icon" aria-hidden="true">${esc(guide.icon)}</span><span class="academy-unit-card__number">Unidad ${esc(guide.id)}</span></div><h3>${esc(guide.title)}</h3><p>${esc(guide.summary)}</p><div class="academy-unit-card__meta"><span>${classes.length} clases</span><span>${completed}/${classes.length} completadas</span></div><progress max="${classes.length}" value="${completed}">${completed}/${classes.length}</progress><button type="button" class="btn btn--sm btn--primary" data-course-module-open="${esc(guide.id)}">Explorar unidad →</button>
    </article>`;
  }).join('')}</div>
</section>`;

const renderCourse = progress => {
  if (activeCourseClass) {
    const item = COURSE_CLASSES.find(value => value.id === activeCourseClass);
    if (item) return renderCourseClass(item, progress);
    activeCourseClass = null;
  }
  if (activeCourseModule) {
    const guide = COURSE_UNIT_GUIDES.find(value => value.id === activeCourseModule);
    if (guide) return renderCourseModule(guide, progress);
    activeCourseModule = null;
  }
  return renderCourseCurriculum(progress);
};

const renderLabs = progress => ACADEMY_LABS.map(item => `<details class="academy-unit" data-academy-item data-search="${esc(`${item.id} ${item.title} ${item.brief} ${item.module}`.toLowerCase())}">
  <summary><span class="academy-unit__code">${esc(item.id)}</span><span><strong>${esc(item.title)}</strong><small>Laboratorio · ${item.minutes} min · parte ${esc(item.module)}</small></span><span class="academy-done">${progress.has(item.id) ? '✓' : '○'}</span></summary>
  <div class="academy-unit__body"><div class="note note--warn"><span class="note__icon">!</span><p>${esc(item.safety)}</p></div><h3>Escenario</h3><p>${esc(item.brief)}</p><h3>Material de entrada</h3>${list(item.inputs)}<h3>Trabajo</h3>${numbered(item.tasks)}<h3>Entrega</h3>${list(item.deliverables)}<h3>Rúbrica</h3><div class="tablewrap"><table><thead><tr><th>Criterio</th><th>Peso</th><th>Evidencia</th></tr></thead><tbody>${item.rubric.map(row => `<tr><td>${esc(row.criterion)}</td><td>${row.weight}%</td><td>${esc(row.evidence)}</td></tr>`).join('')}</tbody></table></div><details class="qa"><summary>Comparar con la pauta después del intento</summary><div class="qa__body">${list(item.expected)}<p><strong>Aprobación:</strong> ${esc(item.pass)}</p></div></details><div class="academy-actions">${completedButton(item.id, progress)}<button class="btn btn--sm btn--primary" data-to-sandbox>Abrir SANDBOX</button></div></div>
</details>`).join('');

const renderCases = progress => ACADEMY_CASES.map(item => `<details class="academy-unit" data-academy-item data-search="${esc(`${item.id} ${item.title} ${item.situation} ${item.facts.join(' ')}`.toLowerCase())}">
  <summary><span class="academy-unit__code">${esc(item.id)}</span><span><strong>${esc(item.title)}</strong><small>Caso integrador · ${item.hours} h</small></span><span class="academy-done">${progress.has(item.id) ? '✓' : '○'}</span></summary>
  <div class="academy-unit__body"><div class="academy-callout"><strong>Situación</strong><p>${esc(item.situation)}</p><p><strong>Objetivo:</strong> ${esc(item.learningGoal)}</p></div><h3>Expediente inicial</h3>${list(item.facts)}<h3>Etapas</h3>${item.stages.map((stage, index) => `<section class="academy-stage"><strong>${index + 1}. ${esc(stage.name)}</strong><p>${esc(stage.work)}</p></section>`).join('')}<h3>Decisiones que debes defender</h3>${list(item.decisions)}<h3>Entrega</h3>${list(item.studentPack)}<h3>Rúbrica</h3><div class="tablewrap"><table><thead><tr><th>Criterio</th><th>Peso</th><th>Qué se observa</th></tr></thead><tbody>${item.evaluation.map(row => `<tr><td>${esc(row.criterion)}</td><td>${row.weight}%</td><td>${esc(row.descriptor)}</td></tr>`).join('')}</tbody></table></div><details class="qa"><summary>Pauta de hallazgos — abrir después de entregar</summary><div class="qa__body">${list(item.expectedFindings)}</div></details><p class="card__hint">${esc(item.boundary)}</p><div class="academy-actions">${completedButton(item.id, progress)}<button class="btn btn--sm btn--primary" data-to-sandbox>Resolver en SANDBOX</button></div></div>
</details>`).join('');

const renderEngineWorkshop = (rules, progress) => {
  const sale = saleFromNet(500000, rules.commercialYear);
  const saleJournal = journal({ type: 'sale', amount: sale.net }, rules.commercialYear);
  const fee = honorariumFromGross(300000, rules.commercialYear);
  return `<section class="academy-module"><div class="academy-module__head"><div><span class="eyebrow">Motor real de la aplicación</span><h2>Dos talleres calculados, no respuestas decorativas</h2><p>Escribe tu solución antes de desplegar la pauta. Los montos usan las mismas reglas que Operaciones y F29.</p></div></div>
    <details class="academy-unit" data-academy-item data-search="venta iva factura asiento cobranza"><summary><span class="academy-unit__code">T01</span><span><strong>Venta: del documento a la cobranza</strong><small>Calcula neto, IVA, total y dos momentos contables</small></span><span class="academy-done">${progress.has('T01') ? '✓' : '○'}</span></summary><div class="academy-unit__body"><section class="academy-practice"><h3>Tu intento</h3><p>Factura un servicio por ${fmtCLP(sale.net)} netos. Explica cuánto paga el cliente, cuánto es ingreso, cuánto es IVA y qué cambia si cobra diez días después.</p><p>Antes de abrir la pauta, escribe los dos asientos y la evidencia de cada fecha.</p></section><details class="qa"><summary>Ver pauta razonada</summary><div class="qa__body"><p>IVA: <strong>${fmtCLP(sale.iva)}</strong>; total: <strong>${fmtCLP(sale.total)}</strong>. El ingreso sigue siendo ${fmtCLP(sale.net)}.</p><div class="tablewrap"><table><thead><tr><th>Debe</th><th>Haber</th><th>Monto</th><th>Por qué</th></tr></thead><tbody>${saleJournal.map(row => `<tr><td>${esc(row.debit)}</td><td>${esc(row.credit)}</td><td>${fmtCLP(row.amount)}</td><td>${esc(row.explanation)}</td></tr>`).join('')}</tbody></table></div><p>Si cobra después, la emisión crea Clientes y la cobranza cancela Clientes contra Banco. No existe una segunda venta.</p></div></details><div class="academy-actions">${completedButton('T01', progress)}<button class="btn btn--sm btn--primary" data-go="operaciones">Practicar en Operaciones</button></div></div></details>
    <details class="academy-unit" data-academy-item data-search="honorario bruto retencion liquido f29"><summary><span class="academy-unit__code">T02</span><span><strong>Honorario: bruto, retención y líquido</strong><small>Usa la regla ${rules.commercialYear} y conserva su vigencia</small></span><span class="academy-done">${progress.has('T02') ? '✓' : '○'}</span></summary><div class="academy-unit__body"><section class="academy-practice"><h3>Tu intento</h3><p>La boleta indica ${fmtCLP(fee.gross)} brutos. Calcula la retención al ${fmtPercent(fee.rate)}, el líquido y la obligación que sigue en la empresa.</p></section><details class="qa"><summary>Ver pauta razonada</summary><div class="qa__body"><p>Retención: <strong>${fmtCLP(fee.retention)}</strong>; líquido: <strong>${fmtCLP(fee.liquid)}</strong>. El gasto base del caso sigue siendo ${fmtCLP(fee.gross)}: pagar el líquido no extingue la retención por enterar.</p><p>La tasa está vinculada al año ${rules.commercialYear}, verificada el ${esc(rules.lastVerified)}. En otro período debe volver a verificarse.</p></div></details><div class="academy-actions">${completedButton('T02', progress)}<button class="btn btn--sm btn--primary" data-go="operaciones">Practicar en Operaciones</button></div></div></details>
  </section>`;
};

const tabContent = (rules, progress) => ({
  guided: renderGuided(progress),
  course: renderCourse(progress),
  labs: renderLabs(progress),
  cases: renderCases(progress),
  workshops: renderEngineWorkshop(rules, progress)
})[activeTab];

export default {
  id: 'academia', label: 'Academia', title: 'Academia', icon: '🎓',

  render() {
    const rules = loadRules();
    const progress = readProgress();
    const total = ACADEMY_LESSONS.length + COURSE_CLASSES.length + ACADEMY_LABS.length + ACADEMY_CASES.length + 2;
    const done = [...progress].filter(id => /^(?:A|C|L|K|T)\d+/.test(id)).length;
    const sandboxOps = ws('sandbox').listTransactions().length;
    return html`
      <div class="page__head"><h1>Academia</h1><p>Aprender aquí significa explicar, resolver, comprobar y producir evidencia. Todo el contenido viaja sin conexión en la PWA, Windows y Android.</p></div>
      ${state.mode === 'real' ? raw(`<div class="note note--warn"><span class="note__icon">!</span><p>Estás en <strong>EMPRESA REAL</strong>. Estudia aquí, pero practica con la empresa ficticia del SANDBOX (${sandboxOps} operaciones). <button class="btn btn--sm" data-to-sandbox>Ir al SANDBOX</button></p></div>`) : raw('<div class="note note--ok"><span class="note__icon">✓</span><p>Estás en <strong>SANDBOX</strong>. Puedes practicar sin alterar EMPRESA REAL.</p></div>')}
      <section class="academy-dashboard" aria-label="Progreso de Academia"><div><span class="eyebrow">Tu avance local</span><strong data-progress-count>${done} de ${total}</strong><span>elementos completados en este dispositivo</span></div><progress data-progress-bar max="${total}" value="${done}">${done}/${total}</progress><p>No se envía a servidores ni se mezcla con la evidencia de la empresa.</p></section>
      <nav class="academy-tabs" aria-label="Secciones de Academia">${[
        ['course', `Curso completo · ${COURSE_CLASSES.length}`], ['guided', `Rutas guiadas · ${ACADEMY_LESSONS.length}`], ['labs', `Laboratorios · ${ACADEMY_LABS.length}`], ['cases', `Casos · ${ACADEMY_CASES.length}`], ['workshops', 'Talleres del motor · 2']
      ].map(([id, label]) => raw(`<button class="academy-tab ${activeTab === id ? 'is-active' : ''}" data-academy-tab="${id}" aria-current="${activeTab === id ? 'page' : 'false'}">${esc(label)}</button>`))}</nav>
      <div class="academy-toolbar"><label class="field"><span>Buscar dentro de esta sección</span><input type="search" data-academy-search placeholder="Ej.: conciliación, F29, capital, evidencia"></label><p data-search-status role="status" aria-live="polite"></p></div>
      <div class="academy-catalog">${raw(tabContent(rules, progress))}<div class="academy-empty" data-academy-empty hidden><h2>No hay coincidencias</h2><p>Prueba otro término o borra la búsqueda. El contenido sigue disponible sin conexión.</p></div></div>
      <div class="note note--info"><span class="note__icon">i</span><p><strong>Alcance honesto.</strong> Son ${COURSE_CLASSES.length} clases desarrolladas, ${ACADEMY_LABS.length} laboratorios con pauta y rúbrica, ${ACADEMY_CASES.length} casos integradores y ${ACADEMY_LESSONS.length} rutas de entrada. No presentan formularios ni reemplazan a SII, municipalidad o profesionales.</p></div>`;
  },

  mount(root, rerender) {
    root.querySelectorAll('[data-academy-tab]').forEach(button => button.addEventListener('click', () => { activeTab = button.dataset.academyTab; rerender(true); }));
    const refreshCourse = () => {
      rerender(true);
      const target = root.querySelector('[data-course-focus]');
      target?.focus();
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    root.querySelectorAll('[data-course-module-open]').forEach(button => button.addEventListener('click', () => {
      activeCourseModule = button.dataset.courseModuleOpen;
      activeCourseClass = null;
      refreshCourse();
    }));
    root.querySelectorAll('[data-course-class-open]').forEach(button => button.addEventListener('click', () => {
      const item = COURSE_CLASSES.find(value => value.id === button.dataset.courseClassOpen);
      if (!item) return;
      activeCourseModule = item.module;
      activeCourseClass = item.id;
      refreshCourse();
    }));
    root.querySelectorAll('[data-course-back]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.courseBack === 'curriculum') activeCourseModule = null;
      activeCourseClass = null;
      refreshCourse();
    }));
    root.querySelectorAll('[data-to-sandbox]').forEach(button => button.addEventListener('click', () => { setMode('sandbox'); rerender(true); }));
    root.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => { location.hash = button.dataset.go; }));
    root.querySelectorAll('[data-ext]').forEach(button => button.addEventListener('click', () => openExternal(button.dataset.ext)));
    root.querySelectorAll('[data-academy-complete]').forEach(button => button.addEventListener('click', () => {
      const progress = readProgress();
      const id = button.dataset.academyComplete;
      if (progress.has(id)) progress.delete(id); else progress.add(id);
      saveProgress(progress);
      rerender(true);
    }));
    root.querySelectorAll('[data-quiz]').forEach(button => button.addEventListener('click', () => {
      const group = root.querySelectorAll(`[data-quiz="${button.dataset.quiz}"]`);
      const correct = button.dataset.option === button.dataset.correct;
      group.forEach(option => { option.classList.remove('is-correct', 'is-wrong'); option.disabled = true; });
      button.classList.add(correct ? 'is-correct' : 'is-wrong');
      group[Number(button.dataset.correct)]?.classList.add('is-correct');
      const lesson = ACADEMY_LESSONS.find(item => item.id === button.dataset.quiz);
      const feedback = root.querySelector(`[data-feedback="${button.dataset.quiz}"]`);
      if (feedback) feedback.textContent = `${correct ? 'Correcto. ' : 'Aún no. '}${lesson?.check.explanation ?? ''}`;
    }));
    const search = root.querySelector('[data-academy-search]');
    search?.addEventListener('input', () => {
      const query = search.value.trim().toLocaleLowerCase('es');
      let visible = 0;
      root.querySelectorAll('[data-academy-item]').forEach(item => {
        const show = !query || item.dataset.search.includes(query);
        item.hidden = !show;
        if (show) visible++;
      });
      root.querySelectorAll('[data-course-module], .academy-module').forEach(module => {
        const items = [...module.querySelectorAll('[data-academy-item]')];
        if (items.length) module.hidden = items.every(item => item.hidden);
      });
      const empty = root.querySelector('[data-academy-empty]');
      if (empty) empty.hidden = visible > 0;
      const status = root.querySelector('[data-search-status]');
      if (status) status.textContent = query ? `${visible} resultado${visible === 1 ? '' : 's'}` : '';
    });
  }
};
