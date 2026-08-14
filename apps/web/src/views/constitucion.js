import { html, raw, esc, attempt } from '../lib/dom.js';
import { ws } from '../lib/state.js';
import { STEP_STATUSES } from '../core/company-operations/workspace.mjs';
import { openExternal } from '../lib/platform.js';

const STATUS_LABEL = {
  pending: 'Pendiente',
  in_progress: 'En trámite',
  done: 'Realizado',
  blocked: 'Bloqueado'
};

export default {
  id: 'constitucion',
  label: 'Constitución',
  title: 'Crear y habilitar la empresa',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M10 21v-6h4v6"/></svg>',

  render() {
    const w = ws();
    const steps = w.listFormationSteps();
    const progress = w.formationProgress();

    return html`
      <div class="page__head">
        <div class="page__title"><h1>Crear y habilitar la empresa</h1>
          <span class="tag ${raw(progress.ready ? 'tag--ok' : '')}">${progress.percent}%</span></div>
        <p>Cada trámite se hace en el portal del organismo que corresponde. Aquí controlas el avance y guardas la evidencia que lo prueba.</p>
      </div>

      <div class="note note--info">
        <span class="note__icon">i</span>
        <p>Un paso <strong>sólo</strong> puede marcarse como realizado si registras su evidencia: folio, número de certificado, comprobante o archivo. Sin eso, la app se negará a darlo por hecho.</p>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head">
          <h2>${progress.done} de ${progress.total} trámites con evidencia</h2>
        </div>
        <div class="progress" role="progressbar" aria-valuenow="${progress.percent}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress__fill" style="width:${progress.percent}%"></div>
        </div>
      </div>

      <div class="card">
        ${raw(steps.map((step, i) => html`
          <div class="step step--${raw(step.status)}">
            <div class="step__dot">${step.status === 'done' ? '✓' : i + 1}</div>
            <div>
              <div class="step__title">${step.title}</div>
              <div class="step__meta">
                ${step.authority}${step.evidenceHint ? ` · evidencia esperada: ${step.evidenceHint}` : ''}
                ${step.url ? raw(` · <a href="${esc(step.url)}" data-ext>abrir portal oficial</a>`) : ''}
              </div>
              <div class="step__form">
                <select data-status="${step.id}" aria-label="Estado de ${esc(step.title)}">
                  ${raw(STEP_STATUSES.map(s => `<option value="${s}" ${s === step.status ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join(''))}
                </select>
                <input type="text" data-evidence="${step.id}" value="${step.evidenceRef || ''}"
                       placeholder="Folio, certificado o comprobante" aria-label="Evidencia de ${esc(step.title)}">
                <button class="btn btn--sm" data-save="${step.id}">Guardar</button>
              </div>
            </div>
          </div>`).join(''))}
      </div>

      <div class="card">
        <div class="card__head"><h2>Después de estos nueve pasos</h2></div>
        <p class="card__hint">
          La empresa queda habilitada para operar: emitir documentos tributarios, recibir pagos en una cuenta a su nombre
          y declarar. A partir de ahí el trabajo se vuelve mensual y lo lleva la pestaña <strong>Cierre mensual</strong>.
        </p>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();

    root.querySelectorAll('[data-ext]').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        openExternal(a.getAttribute('href'));
      })
    );

    root.querySelectorAll('[data-save]').forEach(btn =>
      btn.addEventListener('click', async () => {
        const id = btn.dataset.save;
        const ok = await attempt(
          () =>
            w.updateFormationStep({
              id,
              status: root.querySelector(`[data-status="${id}"]`).value,
              evidenceRef: root.querySelector(`[data-evidence="${id}"]`).value
            }),
          'Trámite actualizado'
        );
        if (ok) rerender();
      })
    );
  }
};
