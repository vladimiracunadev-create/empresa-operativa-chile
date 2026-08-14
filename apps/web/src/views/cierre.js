import { html, raw, fmtCLP, fmtPeriod, fmtDateTime, openModal, confirmAction, attempt } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';

/**
 * Lo que hay que haber hecho ANTES de cerrar.
 *
 * La app deja cerrar aunque falten casillas —no es su trabajo bloquear a
 * alguien que sabe lo que hace— pero deja constancia exacta de qué se declaró
 * revisado y qué no. Meses después, esa constancia es la diferencia entre
 * "creo que lo revisé" y saberlo.
 */
const CHECKLIST = [
  ['bank', 'Banco conciliado', 'Los movimientos de la cartola cuadran con lo registrado.'],
  ['rcv', 'RCV conciliado', 'Compras y ventas del SII coinciden con las operaciones del mes.'],
  ['tax', 'Impuestos revisados', 'El borrador F29 se comparó con la propuesta oficial.'],
  ['evidence', 'Evidencia completa', 'Cada operación tiene documento o respaldo asociado.'],
  ['backup', 'Respaldo creado', 'Existe una copia exportada de este período.']
];

export default {
  id: 'cierre',
  label: 'Cierre',
  title: 'Cierre mensual',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',

  render() {
    const w = ws();
    const period = state.period;
    const closed = w.isPeriodClosed(period);
    const summary = w.periodSummary(period);
    const closes = w.listPeriodCloses().slice().reverse();
    const health = w.healthCheck(period);

    return html`
      <div class="page__head">
        <div class="page__title"><h1>Cierre mensual</h1>
          <span class="tag ${raw(closed ? 'tag--ok' : 'tag--warn')}">${closed ? 'cerrado' : 'abierto'}</span></div>
        <p>Cerrar ${fmtPeriod(period)} congela sus operaciones: no se podrá agregar, editar ni eliminar nada de ese mes.</p>
      </div>

      <div class="grid" style="margin-bottom:14px">
        <div class="kpi"><div class="kpi__label">Operaciones</div><div class="kpi__value">${summary.count}</div>
          <div class="kpi__foot">${fmtPeriod(period)}</div></div>
        <div class="kpi ${raw(summary.withoutEvidence > 0 ? 'kpi--warn' : 'kpi--ok')}">
          <div class="kpi__label">Sin respaldo</div><div class="kpi__value">${summary.withoutEvidence}</div>
          <div class="kpi__foot">Operaciones sin documento ni evidencia</div></div>
        <div class="kpi"><div class="kpi__label">Flujo neto</div><div class="kpi__value">${fmtCLP(summary.netCash)}</div>
          <div class="kpi__foot">Entradas menos salidas</div></div>
        <div class="kpi ${raw(health.level === 'error' ? 'kpi--err' : health.level === 'warn' ? 'kpi--warn' : 'kpi--ok')}">
          <div class="kpi__label">Diagnóstico</div><div class="kpi__value">${health.issues.length}</div>
          <div class="kpi__foot">Observaciones abiertas</div></div>
      </div>

      ${closed
        ? raw(html`
            <div class="card">
              <div class="card__head"><h2>${fmtPeriod(period)} está cerrado</h2></div>
              <p class="card__hint">Si necesitas corregir algo —una factura de proveedor que llegó tarde, un error de digitación— puedes reabrirlo. Se te pedirá el motivo y quedará en la bitácora.</p>
              <div class="btn__row" style="margin-top:12px"><button class="btn btn--danger" data-reopen>Reabrir período</button></div>
            </div>`)
        : raw(html`
            <div class="card">
              <div class="card__head"><h2>Antes de cerrar</h2></div>
              <form data-close-form>
                ${raw(CHECKLIST.map(([key, label, hint]) => html`
                  <label class="check"><input type="checkbox" name="${key}">
                    <span>${label}<small>${hint}</small></span></label>`).join(''))}
                <div class="btn__row" style="margin-top:14px">
                  <button class="btn btn--primary" type="submit">Cerrar ${fmtPeriod(period)}</button>
                  <button class="btn" type="button" data-backup>Crear respaldo ahora</button>
                </div>
              </form>
            </div>`)}

      <div class="card">
        <div class="card__head"><h2>Historial de cierres</h2></div>
        <div class="tablewrap tablewrap--wide">
          <table>
            <thead><tr><th>Período</th><th>Cerrado</th><th class="num">Ventas netas</th><th class="num">IVA débito</th><th class="num">IVA crédito</th><th>Control</th></tr></thead>
            <tbody>
              ${closes.length === 0
                ? raw('<tr><td colspan="6" class="table__empty">Todavía no has cerrado ningún período.</td></tr>')
                : raw(closes.map(c => {
                    const marcados = CHECKLIST.filter(([k]) => c.checklist?.[k]).length;
                    return html`<tr>
                      <td><strong>${fmtPeriod(c.period)}</strong>${w.isPeriodClosed(c.period) ? '' : raw(' <span class="tag tag--warn">reabierto</span>')}</td>
                      <td>${fmtDateTime(c.at)}</td>
                      <td class="num">${fmtCLP(c.summary.salesNet)}</td>
                      <td class="num">${fmtCLP(c.summary.debitVat)}</td>
                      <td class="num">${fmtCLP(c.summary.creditVat)}</td>
                      <td><span class="tag ${raw(marcados === CHECKLIST.length ? 'tag--ok' : 'tag--warn')}">${marcados}/${CHECKLIST.length}</span></td>
                    </tr>`;
                  }).join(''))}
            </tbody>
          </table>
        </div>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();
    const period = state.period;

    root.querySelector('[data-backup]')?.addEventListener('click', async () => {
      const r = await attempt(() => w.backup());
      if (r) {
        const { toast } = await import('../lib/dom.js');
        toast(`Respaldo creado (${r.name}). Expórtalo desde “Datos” para sacarlo del dispositivo.`, 'ok');
      }
    });

    root.querySelector('[data-close-form]')?.addEventListener('submit', async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      const checklist = Object.fromEntries(CHECKLIST.map(([k]) => [k, data.has(k)]));
      const faltan = CHECKLIST.filter(([k]) => !checklist[k]).length;

      const yes = await confirmAction({
        title: `Cerrar ${fmtPeriod(period)}`,
        message: faltan
          ? `Quedan ${faltan} punto(s) del control sin marcar. Puedes cerrar igual: se registrará exactamente qué declaraste revisado y qué no. Después de cerrar, el período no admite cambios sin reabrirlo.`
          : 'Todo el control está marcado. Después de cerrar, el período no admite cambios sin reabrirlo.',
        confirmLabel: 'Cerrar período'
      });
      if (!yes) return;
      if (await attempt(() => w.closePeriod(period, checklist), `${fmtPeriod(period)} cerrado`)) rerender();
    });

    root.querySelector('[data-reopen]')?.addEventListener('click', () =>
      openModal({
        title: `Reabrir ${fmtPeriod(period)}`,
        body: html`
          <p>Reabrir deja el período editable otra vez. La acción y su motivo quedan permanentemente en la bitácora de auditoría.</p>
          <label class="field"><span class="field__label">Motivo</span>
            <textarea name="reason" required placeholder="Ej.: llegó una factura de proveedor con fecha del período ya cerrado."></textarea></label>`,
        submitLabel: 'Reabrir período',
        onSubmit: async d => {
          const ok = await attempt(() => w.reopenPeriod(period, d.reason), 'Período reabierto');
          if (!ok) return false;
          rerender();
          return true;
        }
      })
    );
  }
};
