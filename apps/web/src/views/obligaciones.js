import { html, raw, esc, fmtDate, fmtPeriod, openModal, confirmAction, attempt, todayISO } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { f29DueDates } from '../core/accounting-engine/index.mjs';

const TYPES = ['F29', 'PPM', 'Retención de honorarios', 'Patente municipal', 'Declaración jurada', 'F22 / Renta', 'Pago provisional', 'Otro'];
const STATUSES = [
  ['pending', 'Pendiente'],
  ['prepared', 'Preparada'],
  ['done', 'Cumplida'],
  ['blocked', 'Bloqueada']
];

const isLate = o => o.status !== 'done' && o.dueDate && o.dueDate < todayISO();

function form(ob = {}) {
  return html`
    <div class="form__row">
      <label class="field"><span class="field__label">Tipo</span>
        <select name="type">${raw(TYPES.map(t => `<option ${t === (ob.type || 'F29') ? 'selected' : ''}>${esc(t)}</option>`).join(''))}</select></label>
      <label class="field"><span class="field__label">Período</span>
        <input type="month" name="period" value="${ob.period || ''}"></label>
    </div>
    <div class="form__row">
      <label class="field"><span class="field__label">Vence</span>
        <input type="date" name="dueDate" value="${ob.dueDate || ''}"></label>
      <label class="field"><span class="field__label">Estado</span>
        <select name="status">${raw(STATUSES.map(([v, l]) => `<option value="${v}" ${v === (ob.status || 'pending') ? 'selected' : ''}>${l}</option>`).join(''))}</select></label>
    </div>
    <label class="field"><span class="field__label">Comprobante</span>
      <input type="text" name="evidenceRef" value="${ob.evidenceRef || ''}" placeholder="Folio, número de operación o archivo">
      <span class="field__hint">Obligatorio para marcarla como cumplida. Sin comprobante, la obligación no está cumplida: está calculada.</span></label>
    <label class="field"><span class="field__label">Notas</span>
      <textarea name="notes" placeholder="Monto pagado, medio de pago, incidencias.">${ob.notes || ''}</textarea></label>`;
}

export default {
  id: 'obligaciones',
  label: 'Obligaciones',
  title: 'Obligaciones y vencimientos',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
  badge: () => ws().listObligations().filter(isLate).length,

  render() {
    const w = ws();
    const rows = w
      .listObligations()
      .slice()
      .sort((a, b) => String(b.dueDate || b.period || '').localeCompare(String(a.dueDate || a.period || '')));
    const late = rows.filter(isLate);
    const due = f29DueDates(state.period);

    return html`
      <div class="page__head">
        <div class="page__title"><h1>Obligaciones</h1>
          ${late.length ? raw(`<span class="tag tag--err">${late.length} vencida(s)</span>`) : raw('<span class="tag tag--ok">al día</span>')}</div>
        <p>El calendario de lo que la empresa debe presentar y pagar. Una obligación se cierra con su comprobante, no con un cálculo.</p>
      </div>

      ${late.length
        ? raw(html`<div class="note note--err"><span class="note__icon">✕</span>
            <p>${late.length} obligación(es) pasaron su fecha sin comprobante registrado. Si ya las presentaste, registra el folio ahora.</p></div>`)
        : ''}

      <div class="card" style="margin-top:14px">
        <div class="card__head">
          <h2>Calendario</h2>
          <div class="btn__row">
            <button class="btn btn--sm" data-suggest>Sugerir F29 de ${fmtPeriod(state.period)}</button>
            <button class="btn btn--primary" data-add>+ Nueva obligación</button>
          </div>
        </div>
        <div class="tablewrap tablewrap--wide">
          <table>
            <thead><tr><th>Tipo</th><th>Período</th><th>Vence</th><th>Estado</th><th>Comprobante</th><th></th></tr></thead>
            <tbody>
              ${rows.length === 0
                ? raw('<tr><td colspan="6" class="table__empty">Sin obligaciones registradas. Empieza por el F29 del período en curso.</td></tr>')
                : raw(rows.map(o => html`
                    <tr>
                      <td><strong>${o.type}</strong>${o.notes ? raw(`<br><span class="card__hint">${esc(o.notes)}</span>`) : ''}</td>
                      <td>${o.period ? fmtPeriod(o.period) : '—'}</td>
                      <td>${fmtDate(o.dueDate)}</td>
                      <td><span class="tag ${raw(isLate(o) ? 'tag--err' : o.status === 'done' ? 'tag--ok' : 'tag--warn')}">
                        ${isLate(o) ? 'vencida' : STATUSES.find(([v]) => v === o.status)?.[1] ?? o.status}</span></td>
                      <td>${o.evidenceRef || raw('<span class="card__hint">sin comprobante</span>')}</td>
                      <td class="num">
                        <button class="btn btn--ghost btn--sm" data-edit="${o.id}" aria-label="Editar">✎</button>
                        <button class="btn btn--ghost btn--sm" data-del="${o.id}" aria-label="Eliminar">🗑</button>
                      </td>
                    </tr>`).join(''))}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Referencia de vencimientos del F29</h2></div>
        <p class="card__hint">
          Para ${fmtPeriod(state.period)}: plazo general el ${fmtDate(due.general.date)},
          por internet con pago hasta el ${fmtDate(due.internetWithPayment.date)},
          sin pago hasta el ${fmtDate(due.internetWithoutPayment.date)}.
          Los feriados no están modelados: confirma en el calendario oficial del SII.
        </p>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();

    const save = async (data, id) => {
      const ok = await attempt(() => w.upsertObligation({ ...data, id }), 'Obligación guardada');
      if (!ok) return false;
      rerender();
      return true;
    };

    root.querySelector('[data-add]')?.addEventListener('click', () =>
      openModal({ title: 'Nueva obligación', body: form(), submitLabel: 'Guardar', onSubmit: d => save(d) })
    );

    root.querySelector('[data-suggest]')?.addEventListener('click', async () => {
      // Propone el vencimiento por internet con pago, que es el escenario
      // habitual de una SpA que declara y paga en línea.
      const period = state.period;
      const due = f29DueDates(period);
      const ok = await attempt(
        () => w.upsertObligation({ id: `F29-${period}`, type: 'F29', period, dueDate: due.internetWithPayment.date }),
        `F29 de ${fmtPeriod(period)} agendado`
      );
      if (ok) rerender();
    });

    root.querySelectorAll('[data-edit]').forEach(btn =>
      btn.addEventListener('click', () => {
        const ob = w.listObligations().find(o => o.id === btn.dataset.edit);
        if (!ob) return;
        openModal({ title: `Editar ${ob.type}`, body: form(ob), submitLabel: 'Guardar', onSubmit: d => save(d, ob.id) });
      })
    );

    root.querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', async () => {
        const ob = w.listObligations().find(o => o.id === btn.dataset.del);
        if (!ob) return;
        const yes = await confirmAction({
          title: 'Eliminar obligación',
          message: `Se eliminará ${ob.type} ${ob.period || ''}. La eliminación queda en la bitácora.`,
          confirmLabel: 'Eliminar',
          danger: true
        });
        if (yes && (await attempt(() => w.deleteObligation(ob.id), 'Obligación eliminada'))) rerender();
      })
    );
  }
};
