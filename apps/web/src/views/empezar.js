import { html, raw, esc } from '../lib/dom.js';
import { ws } from '../lib/state.js';
import { termChip, mountTerms } from '../lib/terms.js';
import { stagesByPhase, stage, FIRST_QUESTIONS, COVERAGE, STAGES } from '../core/onboarding/index.mjs';
import { openExternal } from '../lib/platform.js';

/**
 * Empezar aquí: la ruta, no el catálogo de pantallas.
 *
 * El resto de la aplicación está organizada por FUNCIÓN —operaciones,
 * impuestos, cierre—, que es lo correcto cuando ya sabes qué buscas. Quien abre
 * esto por primera vez no lo sabe: necesita una secuencia. Esta vista es esa
 * secuencia, y cada etapa tiene un botón que abre la ventana donde se hace.
 *
 * El contenido sale de `packages/onboarding`, el mismo módulo del que se genera
 * `docs/EMPEZAR-AQUI.md`. El estado (hecho / pendiente) sale de los trámites
 * reales del espacio de trabajo, no de una lista paralela.
 */

const STATUS = {
  done: { tag: 'tag--ok', label: 'hecho' },
  in_progress: { tag: 'tag--warn', label: 'en trámite' },
  blocked: { tag: 'tag--err', label: 'bloqueado' },
  pending: { tag: '', label: 'pendiente' }
};

export default {
  id: 'empezar',
  label: 'Empezar aquí',
  title: 'Empezar aquí',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m15 9-2.5 5.5L7 17l2.5-5.5z"/></svg>',

  /** Insignia de navegación: cuántas etapas con trámite siguen pendientes. */
  badge() {
    try {
      const steps = ws().listFormationSteps();
      return STAGES.filter(s => s.formationStep && steps.find(x => x.id === s.formationStep)?.status !== 'done').length;
    } catch {
      return 0;
    }
  },

  render() {
    const w = ws();
    const steps = w.listFormationSteps();
    const progress = w.formationProgress();
    const open = this.open ?? null;

    const statusOf = s => {
      if (!s.formationStep) return null;
      return steps.find(x => x.id === s.formationStep)?.status ?? 'pending';
    };

    // Primera etapa con trámite sin terminar: es la respuesta literal a
    // "¿por dónde sigo?", que es la pregunta que trae aquí a la gente.
    const next = STAGES.find(s => s.formationStep && statusOf(s) !== 'done') ?? STAGES.find(s => !s.formationStep);

    return html`
      <div class="page__head">
        <h1>Empezar aquí</h1>
        <p>
          El resto de la aplicación está ordenada por función, que sirve cuando ya sabes qué buscas.
          Esta pantalla está ordenada por <strong>tiempo</strong>: qué se hace primero, qué decidir en cada punto,
          qué papel te queda y cómo sabes que terminaste. No supone que sepas contabilidad.
        </p>
      </div>

      <div class="note note--info"><span class="note__icon">i</span>
        <p>Esta aplicación <strong>no presenta ni paga</strong> nada ante el SII ni ante ninguna municipalidad, y no es asesoría tributaria.
        Calcula, te dice de dónde salió cada número y guarda la evidencia. Los trámites los haces tú en los portales oficiales.</p></div>

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>La guía completa, ilustrada</h2>${raw(this.guiaAbierta ? '<span class="tag tag--ok">abierta</span>' : '')}</div>
        <p class="card__hint">
          Las mismas ${STAGES.length} etapas con los diagramas de la ruta y de casos de uso, y una captura de la pantalla donde se hace cada cosa.
          Va <strong>dentro</strong> de la aplicación: se lee y se descarga sin conexión.
        </p>
        <div class="btn__row" style="margin-top:12px">
          <button class="btn btn--primary" data-guia-toggle>${this.guiaAbierta ? 'Cerrar la guía' : 'Leer la guía ilustrada'}</button>
          <a class="btn" href="./ayuda/EMPEZAR-AQUI.pdf" download="Empezar-aqui.pdf">Descargar el PDF</a>
          <button class="btn btn--ghost" data-guia-nueva>Abrirla en otra ventana</button>
        </div>
        ${raw(
          this.guiaAbierta
            ? `<iframe class="guiaframe" src="./ayuda/EMPEZAR-AQUI.html" title="Guía Empezar aquí" loading="lazy"></iframe>`
            : ''
        )}
      </div>

      ${next
        ? raw(html`
            <div class="card" style="margin-top:14px">
              <div class="card__head"><h2>Por dónde sigues</h2><span class="tag">${progress.done}/${progress.total} trámites</span></div>
              <div class="progress" role="progressbar" aria-valuenow="${progress.percent}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress__fill" style="width:${progress.percent}%"></div>
              </div>
              <p style="margin-top:12px"><strong>${next.title}</strong></p>
              <p class="card__hint">${next.question}</p>
              <div class="btn__row" style="margin-top:10px">
                <button class="btn btn--sm btn--primary" data-open="${next.id}">Ver qué hacer</button>
                ${next.doInApp ? raw(`<button class="btn btn--sm" data-go="${esc(next.doInApp.view)}">${esc(next.doInApp.label)}</button>`) : ''}
              </div>
            </div>`)
        : ''}

      <div class="card">
        <div class="card__head"><h2>Si sólo tienes una pregunta</h2></div>
        <div class="tablewrap"><table><tbody>
          ${raw(
            FIRST_QUESTIONS.map(
              q => `<tr>
                <td>${esc(q.question)}</td>
                <td style="text-align:right"><button class="btn btn--ghost btn--sm" data-open="${esc(q.stage)}">Ver →</button></td>
              </tr>`
            ).join('')
          )}
        </tbody></table></div>
      </div>

      ${raw(
        stagesByPhase()
          .map(
            phase => `
        <div class="card" style="margin-top:14px">
          <div class="card__head"><h2>${esc(phase.label)}</h2><span class="tag">${phase.stages.length} etapa(s)</span></div>
          <p class="card__hint">${esc(phase.hint)}</p>
          <ol class="flow" style="margin-top:10px">
            ${phase.stages
              .map(s => {
                const st = statusOf(s);
                const badge = st ? `<span class="tag ${STATUS[st].tag}" style="margin-left:8px">${STATUS[st].label}</span>` : '';
                return `<li>
                  <strong>${esc(s.title)}${badge}</strong>
                  <span>${esc(s.question)}</span>
                  <span class="btn__row" style="margin-top:8px">
                    <button class="btn btn--sm" data-open="${esc(s.id)}">${open === s.id ? 'Ocultar' : 'Qué hacer'}</button>
                    ${s.doInApp ? `<button class="btn btn--sm btn--primary" data-go="${esc(s.doInApp.view)}">${esc(s.doInApp.label)}</button>` : ''}
                  </span>
                  ${open === s.id ? detail(s) : ''}
                </li>`;
              })
              .join('')}
          </ol>
        </div>`
          )
          .join('')
      )}

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Qué cubre este sistema y qué no</h2></div>
        <p class="card__hint">
          La respuesta honesta a “¿están todas las alternativas posibles?” es <strong>no</strong>.
          Un vacío declarado se puede trabajar; uno silencioso se descubre tarde y caro.
        </p>
        <details class="qa" style="margin-top:10px"><summary>Sí está modelado</summary>
          <div class="qa__body"><ul class="termlist">${raw(COVERAGE.covered.map(x => `<li>${esc(x)}</li>`).join(''))}</ul></div>
        </details>
        <details class="qa" style="margin-top:8px" open><summary>No está modelado — y qué significa para ti</summary>
          <div class="qa__body">
            <div class="tablewrap"><table>
              <thead><tr><th>Qué falta</th><th>Qué significa</th></tr></thead>
              <tbody>${raw(COVERAGE.notCovered.map(x => `<tr><td><strong>${esc(x.what)}</strong></td><td>${esc(x.why)}</td></tr>`).join(''))}</tbody>
            </table></div>
          </div>
        </details>
        <div class="note note--warn" style="margin-top:10px"><span class="note__icon">!</span><p>${COVERAGE.principle}</p></div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Cuándo dejar de leer y llamar a un contador</h2></div>
        <ul class="termlist">
          <li>Al elegir el régimen tributario.</li>
          <li>Con varios socios, o con aportes de bienes de valor relevante.</li>
          <li>Cuando el SII notifique una diferencia.</li>
          <li>Al dividir, fusionar, transformar o cerrar la empresa.</li>
          <li>Siempre que la aplicación diga <em>“requiere verificación con fuente oficial, municipalidad o profesional tributario”</em>.</li>
        </ul>
        <div class="btn__row" style="margin-top:12px">
          <button class="btn btn--sm" data-go="glosario">Abrir el glosario</button>
          <button class="btn btn--sm" data-go="constitucion">Ver los trámites</button>
          <button class="btn btn--sm" data-go="academia">Ir a la academia</button>
        </div>
      </div>`;
  },

  mount(root, rerender) {
    mountTerms(root);

    root.querySelectorAll('[data-open]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.open = this.open === btn.dataset.open ? null : btn.dataset.open;
        rerender(true);
      })
    );

    root.querySelectorAll('[data-ext]').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        openExternal(a.getAttribute('href'));
      })
    );

    // La guía viaja dentro del bundle (`scripts/build-web.mjs`), así que la ruta
    // es relativa y funciona igual servida por el navegador, dentro del APK y
    // dentro del ejecutable de Windows, con o sin conexión. Se muestra en un
    // marco del mismo origen —no en una pestaña nueva— porque "verla dentro de
    // la aplicación" es justamente el punto: no hay que salir para leerla.
    root.querySelector('[data-guia-toggle]')?.addEventListener('click', () => {
      this.guiaAbierta = !this.guiaAbierta;
      rerender(true);
    });

    root.querySelector('[data-guia-nueva]')?.addEventListener('click', () =>
      openExternal(new URL('./ayuda/EMPEZAR-AQUI.html', location.href).href)
    );
  }
};

/** Ficha completa de una etapa, con la misma estructura que el documento. */
function detail(s) {
  const block = (title, body) => (body ? `<p style="margin:12px 0 4px"><strong>${title}</strong></p>${body}` : '');
  const ul = items => `<ul class="termlist">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;

  const decisions = (s.decisions ?? [])
    .map(
      d => `
      <p style="margin:12px 0 4px"><strong>Decisión: ${esc(d.question)}</strong></p>
      <div class="tablewrap"><table>
        <thead><tr><th>Alternativa</th><th>Cuándo encaja</th><th>Ojo con</th></tr></thead>
        <tbody>${d.options
          .map(o => `<tr><td><strong>${esc(o.label)}</strong></td><td>${esc(o.whenItFits)}</td><td>${esc(o.watchOut ?? '—')}</td></tr>`)
          .join('')}</tbody>
      </table></div>
      ${d.note ? `<div class="note note--info" style="margin-top:8px"><span class="note__icon">i</span><p>${esc(d.note)}</p></div>` : ''}`
    )
    .join('');

  const documents = s.documents?.length
    ? `<div class="tablewrap"><table>
        <thead><tr><th>Documento</th><th>Quién lo emite</th><th>Por qué importa</th></tr></thead>
        <tbody>${s.documents.map(d => `<tr><td><strong>${esc(d.name)}</strong></td><td>${esc(d.whoIssues)}</td><td>${esc(d.whyItMatters)}</td></tr>`).join('')}</tbody>
      </table></div>`
    : '';

  return `
    <div class="stagebox">
      <p>${esc(s.why)}</p>
      ${block('Qué necesitas tener antes', ul(s.needs ?? ['Nada especial: es el primer paso.']))}
      ${decisions}
      ${block('Qué documento te queda', documents)}
      ${s.pitfalls?.length ? `<div class="note note--warn" style="margin-top:12px"><span class="note__icon">!</span><div><p style="margin-bottom:6px"><strong>Errores típicos</strong></p>${ul(s.pitfalls)}</div></div>` : ''}
      <div class="note note--ok" style="margin-top:10px"><span class="note__icon">✓</span>
        <p><strong>Sabes que terminaste cuando:</strong> ${esc(s.doneWhen)}</p></div>
      ${
        s.terms?.length
          ? `<p class="card__hint" style="margin-top:10px">Términos de esta etapa: ${s.terms.map(t => termChip(t)).join(' ')} <span style="opacity:.8">— pulsa para la definición</span></p>`
          : ''
      }
      ${
        s.sources?.length
          ? `<p class="card__hint">Fuentes: ${s.sources
              .map(x => (x.url.startsWith('http') ? `<a href="${esc(x.url)}" data-ext>${esc(x.label)}</a>` : esc(x.label)))
              .join(' · ')}</p>`
          : ''
      }
    </div>`;
}
