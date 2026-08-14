import { html, raw, fmtDateTime } from '../lib/dom.js';
import { ws } from '../lib/state.js';

/** Traducción de los códigos internos a algo legible por una persona. */
const ACTION_LABEL = {
  'company.saved': 'Ficha de empresa guardada',
  'formation.step.updated': 'Trámite de constitución actualizado',
  'transaction.added': 'Operación registrada',
  'transaction.updated': 'Operación modificada',
  'transaction.deleted': 'Operación eliminada',
  'obligation.upserted': 'Obligación creada o actualizada',
  'obligation.deleted': 'Obligación eliminada',
  'period.closed': 'Período cerrado',
  'period.reopened': 'Período reabierto',
  'backup.created': 'Respaldo creado',
  'backup.imported': 'Respaldo importado'
};

const TONE = {
  'transaction.deleted': 'tag--err',
  'obligation.deleted': 'tag--err',
  'period.reopened': 'tag--warn',
  'backup.imported': 'tag--warn',
  'period.closed': 'tag--ok',
  'backup.created': 'tag--ok'
};

const filters = { query: '' };

export default {
  id: 'auditoria',
  label: 'Auditoría',
  title: 'Bitácora de auditoría',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',

  render() {
    const w = ws();
    const q = filters.query.trim().toLowerCase();
    const rows = w
      .listAudit()
      .slice()
      .reverse()
      .filter(r => !q || `${r.action} ${ACTION_LABEL[r.action] ?? ''} ${JSON.stringify(r.detail)}`.toLowerCase().includes(q));

    return html`
      <div class="page__head">
        <h1>Bitácora de auditoría</h1>
        <p>Todo lo que cambió en este espacio de trabajo, en orden. Es un registro de sólo escritura: la app no ofrece ninguna forma de borrar o editar una línea.</p>
      </div>

      <div class="note note--info">
        <span class="note__icon">i</span>
        <p>La bitácora de <strong>EMPRESA REAL</strong> y la de <strong>SANDBOX</strong> son archivos distintos. Estás viendo la del entorno activo.</p>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head">
          <h2>${rows.length} evento(s)</h2>
        </div>
        <label class="field"><span class="field__label">Buscar en la bitácora</span>
          <input type="search" data-q value="${filters.query}" placeholder="Ej.: eliminada, cerrado, respaldo"></label>
        <div class="tablewrap tablewrap--wide">
          <table>
            <thead><tr><th>Cuándo</th><th>Qué pasó</th><th>Detalle</th></tr></thead>
            <tbody>
              ${rows.length === 0
                ? raw('<tr><td colspan="3" class="table__empty">Sin eventos que coincidan.</td></tr>')
                : raw(rows.slice(0, 400).map(r => html`
                    <tr>
                      <td>${fmtDateTime(r.at)}</td>
                      <td><span class="tag ${raw(TONE[r.action] ?? '')}">${ACTION_LABEL[r.action] ?? r.action}</span></td>
                      <td><code>${JSON.stringify(r.detail)}</code></td>
                    </tr>`).join(''))}
            </tbody>
          </table>
        </div>
        ${rows.length > 400 ? raw(`<p class="card__hint" style="margin-top:10px">Se muestran los 400 eventos más recientes de ${rows.length}. Exporta los datos desde “Datos” para revisarlos completos.</p>`) : ''}
      </div>`;
  },

  mount(root, rerender) {
    const input = root.querySelector('[data-q]');
    input?.addEventListener('input', e => {
      filters.query = e.target.value;
      const caret = e.target.selectionStart;
      rerender();
      const next = document.querySelector('[data-q]');
      next?.focus();
      next?.setSelectionRange(caret, caret);
    });
  }
};
