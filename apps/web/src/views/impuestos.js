import { html, raw, fmtCLP, fmtDate, fmtPeriod, fmtPercent, attempt } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { f29Basic, f29DueDates, ppmFromSalesNet, idpcProPyme } from '../core/accounting-engine/index.mjs';
import { loadRules, ruleProvenance } from '../core/chile-tax-rules/index.mjs';
import { openExternal } from '../lib/platform.js';

/**
 * Lista de control previa a presentar.
 *
 * Vive en el propio período (no en memoria volátil) porque el sentido de la
 * lista es poder responder, meses después, "¿revisé el RCV antes de declarar
 * agosto?". Una casilla que se borra al recargar no responde nada.
 */
const CHECKS = [
  ['rcv', 'Registro de Compras y Ventas conciliado con lo registrado aquí'],
  ['rechazadas', 'Facturas reclamadas, anuladas o con nota de crédito revisadas'],
  ['credito', 'IVA crédito validado: sólo documentos del giro y con derecho'],
  ['retenciones', 'Retenciones de honorarios del período revisadas'],
  ['propuesta', 'Propuesta oficial del F29 comparada con este borrador']
];

export default {
  id: 'impuestos',
  label: 'Impuestos',
  title: 'Impuestos y borrador F29',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>',

  render() {
    const w = ws();
    const period = state.period;
    const s = w.periodSummary(period);
    const carry = w.vatCarryForwardInto(period);
    const rules = loadRules(2026);

    const f29 = f29Basic({
      salesNet: s.salesNet,
      purchasesNet: s.purchasesNet,
      debitVat: s.debitVat,
      creditVat: s.creditVat,
      previousVatCredit: carry,
      honorariaGross: s.honorariaGross
    });
    const ppm = ppmFromSalesNet(s.salesNet);
    const idpc = idpcProPyme({ incomeReceived: s.cashIn, expensesPaid: s.cashOut });
    const due = f29DueDates(period);
    const checks = w.listObligations().find(o => o.id === `F29-${period}`)?.checklist ?? {};

    const line = (label, value, hint = '', strong = false) => html`
      <tr>
        <td>${label}${hint ? raw(`<br><span class="card__hint">${hint}</span>`) : ''}</td>
        <td class="num">${strong ? raw(`<strong>${fmtCLP(value)}</strong>`) : fmtCLP(value)}</td>
      </tr>`;

    return html`
      <div class="page__head">
        <div class="page__title"><h1>Impuestos · ${fmtPeriod(period)}</h1>
          <span class="tag">${f29.origin === 'documentos' ? 'IVA de documentos' : 'IVA derivado'}</span></div>
        <p>Borrador de control construido con las operaciones que registraste. No es la declaración: es lo que deberías comparar con la propuesta del SII antes de presentar.</p>
      </div>

      <div class="note note--warn">
        <span class="note__icon">!</span>
        <p>Antes de pagar o presentar, concilia con el <strong>RCV</strong> y con la propuesta oficial. Si los números no coinciden, el que está mal es este borrador, no el SII.</p>
      </div>

      <div class="grid grid--2" style="margin-top:14px">
        <div class="card">
          <div class="card__head"><h2>IVA del período</h2></div>
          <div class="tablewrap">
            <table>
              <tbody>
                ${raw(line('IVA débito fiscal', f29.debitVat, 'IVA recargado en tus ventas'))}
                ${raw(line('IVA crédito del período', f29.currentCreditVat, 'Sólo documentos con derecho a crédito'))}
                ${raw(line('Remanente del período anterior', f29.previousVatCredit, carry > 0 ? 'Arrastrado automáticamente desde meses anteriores' : 'No hay remanente acumulado'))}
                ${raw(line('Crédito disponible', f29.availableCreditVat))}
                ${raw(line('IVA a pagar', f29.vatPayable, '', true))}
                ${raw(line('Remanente para el mes siguiente', f29.nextVatCredit))}
              </tbody>
            </table>
          </div>
          ${s.rejectedVat > 0
            ? raw(html`<div class="note note--info" style="margin-top:10px"><span class="note__icon">i</span>
                <p>${fmtCLP(s.rejectedVat)} de IVA quedó <strong>fuera</strong> del crédito porque marcaste esas operaciones como sin derecho.</p></div>`)
            : ''}
        </div>

        <div class="card">
          <div class="card__head"><h2>Resto del formulario</h2></div>
          <div class="tablewrap">
            <table>
              <tbody>
                ${raw(line('PPM', f29.ppm, `Base ${fmtCLP(ppm.base)} × ${fmtPercent(ppm.rate)}`))}
                ${raw(line('Retención de honorarios', f29.honorariaWithholding, `Sobre ${fmtCLP(s.honorariaGross)} brutos al ${fmtPercent(rules.honorarios.retentionRate)}`))}
                ${raw(line('Total estimado a enterar', f29.estimatedF29Payment, 'IVA + PPM + retenciones', true))}
              </tbody>
            </table>
          </div>
          <div class="btn__row" style="margin-top:12px">
            <button class="btn btn--sm" data-sii>Abrir el SII</button>
            <button class="btn btn--sm" data-print>Imprimir / PDF</button>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h2>Vencimientos</h2></div>
          <div class="tablewrap">
            <table>
              <thead><tr><th>Vía</th><th class="num">Fecha</th></tr></thead>
              <tbody>
                <tr><td>Plazo general</td><td class="num">${fmtDate(due.general.date)}${due.general.shiftedFromWeekend ? raw(' <span class="tag">trasladado</span>') : ''}</td></tr>
                <tr><td>Internet, con pago</td><td class="num">${fmtDate(due.internetWithPayment.date)}${due.internetWithPayment.shiftedFromWeekend ? raw(' <span class="tag">trasladado</span>') : ''}</td></tr>
                <tr><td>Internet, sin pago</td><td class="num">${fmtDate(due.internetWithoutPayment.date)}${due.internetWithoutPayment.shiftedFromWeekend ? raw(' <span class="tag">trasladado</span>') : ''}</td></tr>
              </tbody>
            </table>
          </div>
          <p class="card__hint" style="margin-top:10px">Los traslados por fin de semana están calculados; los <strong>feriados legales no</strong>. Confirma en el calendario tributario oficial.</p>
        </div>

        <div class="card">
          <div class="card__head"><h2>Referencia anual (IDPC)</h2></div>
          <div class="tablewrap">
            <table>
              <tbody>
                ${raw(line('Base estimada del período', idpc.base, 'Ingresos percibidos menos gastos pagados'))}
                ${raw(line(`IDPC al ${fmtPercent(idpc.rate)}`, idpc.estimatedIdpc))}
              </tbody>
            </table>
          </div>
          <p class="card__hint" style="margin-top:10px">${idpc.note}</p>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head">
          <h2>Control previo a presentar</h2>
          <span class="tag ${raw(CHECKS.every(([k]) => checks[k]) ? 'tag--ok' : 'tag--warn')}">
            ${CHECKS.filter(([k]) => checks[k]).length}/${CHECKS.length}
          </span>
        </div>
        <p class="card__hint">Se guarda en la obligación <code>F29-${period}</code> y queda en la bitácora.</p>
        <div style="margin-top:8px">
          ${raw(CHECKS.map(([key, label]) => html`
            <label class="check"><input type="checkbox" data-check="${key}" ${raw(checks[key] ? 'checked' : '')}>
              <span>${label}</span></label>`).join(''))}
        </div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Qué NO cubre este borrador</h2></div>
        ${raw(f29.limitations.map(l => html`<div class="note note--info"><span class="note__icon">i</span><p>${l}</p></div>`).join(''))}
        <p class="card__hint" style="margin-top:12px">
          Reglas del año comercial ${rules.commercialYear}, verificadas el ${fmtDate(rules.lastVerified)}.
          IVA: <a href="${ruleProvenance(2026, 'iva').source}" data-ext>fuente oficial</a> ·
          Honorarios: <a href="${ruleProvenance(2026, 'honorarios').source}" data-ext>fuente oficial</a> ·
          F29: <a href="${ruleProvenance(2026, 'f29').source}" data-ext>fuente oficial</a>
        </p>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();
    const period = state.period;

    root.querySelector('[data-sii]')?.addEventListener('click', () => openExternal('https://www.sii.cl/'));
    root.querySelector('[data-print]')?.addEventListener('click', () => globalThis.print());
    root.querySelectorAll('[data-ext]').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        openExternal(a.getAttribute('href'));
      })
    );

    root.querySelectorAll('[data-check]').forEach(box =>
      box.addEventListener('change', async () => {
        const current = w.listObligations().find(o => o.id === `F29-${period}`)?.checklist ?? {};
        const checklist = { ...current, [box.dataset.check]: box.checked };
        await attempt(() =>
          w.upsertObligation({ id: `F29-${period}`, type: 'F29', period, checklist })
        );
        rerender();
      })
    );
  }
};
