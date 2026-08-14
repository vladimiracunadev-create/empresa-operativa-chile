import { html, raw, esc, fmtCLP, fmtDate, fmtPeriod, todayISO, openModal, confirmAction, attempt, toast } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { TRANSACTION_KINDS } from '../core/company-operations/workspace.mjs';
import { loadRules } from '../core/chile-tax-rules/index.mjs';

const KIND = Object.fromEntries(TRANSACTION_KINDS.map(k => [k.id, k]));

const filters = { kind: 'all', query: '' };

const kindOptions = (selected = 'sale') =>
  TRANSACTION_KINDS.map(k => `<option value="${k.id}" ${k.id === selected ? 'selected' : ''}>${esc(k.label)}</option>`).join('');

/** Formulario compartido por alta y edición. */
function txForm(tx = {}) {
  const rate = loadRules(2026).iva.generalRate;
  return html`
    <div class="form__row">
      <label class="field"><span class="field__label">Fecha</span>
        <input type="date" name="date" required value="${tx.date || todayISO()}"></label>
      <label class="field"><span class="field__label">Tipo de operación</span>
        <select name="kind" data-kind>${raw(kindOptions(tx.kind))}</select></label>
    </div>
    <label class="field"><span class="field__label">Descripción</span>
      <input type="text" name="description" required maxlength="140" value="${tx.description || ''}"
             placeholder="Ej.: desarrollo de sitio web para Cliente X"></label>
    <div class="form__row">
      <label class="field"><span class="field__label">Monto neto</span>
        <input type="number" name="net" min="0" step="1" value="${tx.net ?? 0}" data-net></label>
      <label class="field"><span class="field__label">IVA</span>
        <input type="number" name="vat" min="0" step="1" value="${tx.vat ?? 0}" data-vat>
        <span class="field__hint">Se propone al ${(rate * 100).toFixed(0)}%; edítalo si el documento dice otra cosa.</span></label>
      <label class="field"><span class="field__label">Total</span>
        <input type="number" name="total" min="0" step="1" value="${tx.total ?? 0}" data-total></label>
    </div>
    <div class="form__row">
      <label class="field"><span class="field__label">Tipo de documento</span>
        <input type="text" name="documentType" value="${tx.documentType || ''}" placeholder="Factura electrónica"></label>
      <label class="field"><span class="field__label">N.º de documento</span>
        <input type="text" name="documentNumber" value="${tx.documentNumber || ''}" placeholder="Folio"></label>
      <label class="field"><span class="field__label">RUT de la contraparte</span>
        <input type="text" name="counterpartyRut" value="${tx.counterpartyRut || ''}" placeholder="77.111.222-3"></label>
    </div>
    <label class="check"><input type="checkbox" name="paid" ${raw(tx.paid ? 'checked' : '')}>
      <span>Ya está pagada / cobrada</span></label>
    <label class="check"><input type="checkbox" name="vatCreditEligible" ${raw(tx.vatCreditEligible !== false ? 'checked' : '')}>
      <span>El IVA da derecho a crédito fiscal
        <small>Desmárcalo si el gasto no es del giro o el documento no lo permite: el IVA queda fuera del F29.</small></span></label>
    <label class="check"><input type="checkbox" name="deductible" ${raw(tx.deductible !== false ? 'checked' : '')}>
      <span>El gasto es tributariamente deducible
        <small>Un retiro del accionista o un gasto personal no lo es, aunque salga plata de la cuenta.</small></span></label>`;
}

/**
 * Cálculo asistido en el formulario.
 *
 * Se propone el IVA sobre el neto, pero nunca se sobrescribe un valor que el
 * usuario ya escribió a mano: el documento manda sobre la fórmula.
 */
function wireAutoTotals(form) {
  const net = form.querySelector('[data-net]');
  const vat = form.querySelector('[data-vat]');
  const total = form.querySelector('[data-total]');
  const kind = form.querySelector('[data-kind]');
  let vatTouched = Number(vat.value) > 0;

  vat.addEventListener('input', () => {
    vatTouched = true;
    sync(false);
  });

  const sync = (proposeVat = true) => {
    const n = Number(net.value || 0);
    const affects = KIND[kind.value]?.affectsVat !== 'none';
    if (proposeVat && !vatTouched) {
      vat.value = affects ? Math.round(n * loadRules(2026).iva.generalRate) : 0;
    }
    if (!affects && !vatTouched) vat.value = 0;
    total.value = n + Number(vat.value || 0);
  };

  net.addEventListener('input', () => sync(true));
  kind.addEventListener('change', () => {
    vatTouched = false;
    sync(true);
  });
  sync(Number(vat.value || 0) === 0);
}

const parseForm = data => ({
  ...data,
  net: Number(data.net || 0),
  vat: Number(data.vat || 0),
  total: Number(data.total || 0),
  paid: data.paid === 'on',
  vatCreditEligible: data.vatCreditEligible === 'on',
  deductible: data.deductible === 'on'
});

export default {
  id: 'operaciones',
  label: 'Operaciones',
  title: 'Operaciones',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h13M3 7l3-3M3 7l3 3"/><path d="M21 17H8m13 0-3-3m3 3-3 3"/></svg>',

  render() {
    const w = ws();
    const period = state.period;
    const closed = w.isPeriodClosed(period);
    const all = w.listTransactions().filter(t => t.date.startsWith(period));
    const q = filters.query.trim().toLowerCase();
    const rows = all
      .filter(t => filters.kind === 'all' || t.kind === filters.kind)
      .filter(t => !q || `${t.description} ${t.documentNumber ?? ''} ${t.counterpartyRut ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));

    const totals = rows.reduce(
      (acc, t) => {
        acc.net += t.net;
        acc.vat += t.vat;
        acc.total += t.total;
        return acc;
      },
      { net: 0, vat: 0, total: 0 }
    );

    return html`
      <div class="page__head">
        <div class="page__title"><h1>Operaciones</h1>
          ${closed ? raw('<span class="tag tag--warn">período cerrado</span>') : ''}</div>
        <p>Ventas, compras, gastos, honorarios y movimientos del accionista de ${fmtPeriod(period)}.</p>
      </div>

      ${closed
        ? raw(html`<div class="note note--warn"><span class="note__icon">!</span><p>Este período está cerrado: no se puede agregar, editar ni eliminar. Para corregir algo, reábrelo desde <strong>Cierre mensual</strong> indicando el motivo.</p></div>`)
        : ''}

      <div class="card" style="margin-top:14px">
        <div class="card__head">
          <h2>${rows.length} de ${all.length} operación(es)</h2>
          <div class="btn__row">
            <button class="btn btn--primary" data-add ${raw(closed ? 'disabled' : '')}>+ Nueva operación</button>
          </div>
        </div>

        <div class="form__row" style="margin-bottom:6px">
          <label class="field" style="margin:0"><span class="field__label">Filtrar por tipo</span>
            <select data-filter-kind>
              <option value="all" ${filters.kind === 'all' ? 'selected' : ''}>Todos los tipos</option>
              ${raw(TRANSACTION_KINDS.map(k => `<option value="${k.id}" ${filters.kind === k.id ? 'selected' : ''}>${esc(k.label)}</option>`).join(''))}
            </select></label>
          <label class="field" style="margin:0"><span class="field__label">Buscar</span>
            <input type="search" data-filter-q value="${filters.query}" placeholder="Descripción, folio o RUT"></label>
        </div>

        <div class="tablewrap">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Documento</th>
                  <th class="num">Neto</th><th class="num">IVA</th><th class="num">Total</th><th></th></tr>
            </thead>
            <tbody>
              ${rows.length === 0
                ? raw(`<tr><td colspan="8" class="table__empty">No hay operaciones que coincidan. ${closed ? '' : 'Registra la primera con “Nueva operación”.'}</td></tr>`)
                : raw(
                    rows
                      .map(t => {
                        const k = KIND[t.kind] ?? { label: t.kind, flow: 'out' };
                        const sinRespaldo = !t.documentNumber && (t.evidence ?? []).length === 0;
                        return html`<tr>
                          <td>${fmtDate(t.date)}</td>
                          <td><span class="tag ${raw(k.flow === 'in' ? 'tag--in' : 'tag--out')}">${k.label}</span></td>
                          <td>${t.description}
                            ${sinRespaldo ? raw('<br><span class="tag tag--warn">sin respaldo</span>') : ''}
                            ${t.vatCreditEligible === false && t.vat > 0 ? raw('<br><span class="tag">IVA no recuperable</span>') : ''}</td>
                          <td>${t.documentType || '—'}${t.documentNumber ? ` #${t.documentNumber}` : ''}</td>
                          <td class="num">${fmtCLP(t.net)}</td>
                          <td class="num">${fmtCLP(t.vat)}</td>
                          <td class="num"><strong>${fmtCLP(t.total)}</strong></td>
                          <td class="num">
                            <button class="btn btn--ghost btn--sm" data-edit="${t.id}" ${raw(closed ? 'disabled' : '')} aria-label="Editar">✎</button>
                            <button class="btn btn--ghost btn--sm" data-del="${t.id}" ${raw(closed ? 'disabled' : '')} aria-label="Eliminar">🗑</button>
                          </td>
                        </tr>`;
                      })
                      .join('')
                  )}
            </tbody>
            ${rows.length > 0
              ? raw(html`<tfoot><tr>
                  <th colspan="4">Total filtrado</th>
                  <th class="num">${fmtCLP(totals.net)}</th>
                  <th class="num">${fmtCLP(totals.vat)}</th>
                  <th class="num">${fmtCLP(totals.total)}</th><th></th>
                </tr></tfoot>`)
              : ''}
          </table>
        </div>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();

    root.querySelector('[data-filter-kind]')?.addEventListener('change', e => {
      filters.kind = e.target.value;
      rerender();
    });

    const search = root.querySelector('[data-filter-q]');
    search?.addEventListener('input', e => {
      filters.query = e.target.value;
      const caret = e.target.selectionStart;
      rerender();
      const next = document.querySelector('[data-filter-q]');
      next?.focus();
      next?.setSelectionRange(caret, caret);
    });

    root.querySelector('[data-add]')?.addEventListener('click', () => {
      const { root: modal } = openModal({
        title: 'Nueva operación',
        body: txForm({ date: `${state.period}-01` === state.period ? todayISO() : undefined }),
        submitLabel: 'Registrar',
        wide: true,
        onSubmit: async data => {
          const ok = await attempt(() => w.addTransaction(parseForm(data)), 'Operación registrada en la bitácora');
          if (!ok) return false;
          rerender();
          return true;
        }
      });
      wireAutoTotals(modal.querySelector('form'));
    });

    root.querySelectorAll('[data-edit]').forEach(btn =>
      btn.addEventListener('click', () => {
        const tx = w.listTransactions().find(t => t.id === btn.dataset.edit);
        if (!tx) return;
        const { root: modal } = openModal({
          title: 'Editar operación',
          body: txForm(tx),
          submitLabel: 'Guardar cambios',
          wide: true,
          onSubmit: async data => {
            const ok = await attempt(() => w.updateTransaction(tx.id, parseForm(data)), 'Operación actualizada');
            if (!ok) return false;
            rerender();
            return true;
          }
        });
        wireAutoTotals(modal.querySelector('form'));
      })
    );

    root.querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', async () => {
        const tx = w.listTransactions().find(t => t.id === btn.dataset.del);
        if (!tx) return;
        const yes = await confirmAction({
          title: 'Eliminar operación',
          message: `Se eliminará “${tx.description}” por ${fmtCLP(tx.total)}. La eliminación queda registrada en la bitácora de auditoría y no se puede deshacer.`,
          confirmLabel: 'Eliminar',
          danger: true
        });
        if (!yes) return;
        if (await attempt(() => w.deleteTransaction(tx.id))) {
          toast('Operación eliminada', 'ok');
          rerender();
        }
      })
    );
  }
};
