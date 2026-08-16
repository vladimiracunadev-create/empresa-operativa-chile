import { html, raw, fmtCLP, fmtPeriod, fmtDate, currentPeriod } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { f29Basic, f29DueDates } from '../core/accounting-engine/index.mjs';

const LEVEL_TAG = { ok: 'tag--ok', warn: 'tag--warn', error: 'tag--err' };
const LEVEL_TEXT = { ok: 'Sin alertas', warn: 'Requiere atención', error: 'Hay algo vencido' };
const NOTE_KIND = { info: 'info', warn: 'warn', error: 'err' };

export default {
  id: 'panel',
  label: 'Panel',
  title: 'Panel de control',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',

  render() {
    const w = ws();
    const period = state.period;
    const company = w.getCompany();
    const summary = w.periodSummary(period);
    const health = w.healthCheck(period);
    const formation = w.formationProgress();

    // El F29 del panel usa el IVA DECLARADO en los documentos y arrastra el
    // remanente: es el mismo número que verá en la pestaña de impuestos, no una
    // aproximación distinta que después no cuadre.
    const f29 = f29Basic({
      salesNet: summary.salesNet,
      purchasesNet: summary.purchasesNet,
      debitVat: summary.debitVat,
      creditVat: summary.creditVat,
      previousVatCredit: w.vatCarryForwardInto(period),
      honorariaGross: summary.honorariaGross
    });

    const due = f29DueDates(period);

    // Indicadores de capital y patente: son accionables (falta capital por
    // enterar, falta el cierre que produce la base municipal) y no se ven en
    // ninguna otra pantalla del flujo mensual.
    const year = Number(String(period).slice(0, 4));
    const capital = w.capitalPosition();
    const ultimoCierre = w.listAnnualCloses().at(-1) ?? null;
    let patente = null;
    try {
      patente = w.municipalPatentFor(year);
    } catch {
      /* Sin reglas del año no hay patente que mostrar; la vista Capital lo explica. */
    }

    const pendientes = w.listObligations().filter(o => o.status !== 'done');
    const vencidas = pendientes.filter(o => o.dueDate && o.dueDate < new Date().toISOString().slice(0, 10));

    const kpi = (label, value, foot, tone = '') => html`
      <div class="kpi ${tone}">
        <div class="kpi__label">${label}</div>
        <div class="kpi__value">${value}</div>
        <div class="kpi__foot">${foot}</div>
      </div>`;

    return html`
      <div class="page__head">
        <div class="page__title">
          <h1>Panel de control</h1>
          <span class="tag ${raw(LEVEL_TAG[health.level])}">${LEVEL_TEXT[health.level]}</span>
        </div>
        <p>Estado de <strong>${company?.fantasyName || company?.legalName || 'tu empresa'}</strong> en ${fmtPeriod(period)}.</p>
      </div>

      <div class="grid" style="margin-bottom:16px">
        ${raw(kpi('Ventas netas', fmtCLP(summary.salesNet), `${summary.count} operación(es) registradas`))}
        ${raw(kpi('IVA a pagar', fmtCLP(f29.vatPayable), f29.nextVatCredit > 0 ? `Remanente a favor: ${fmtCLP(f29.nextVatCredit)}` : 'Débito menos crédito disponible', f29.vatPayable > 0 ? 'kpi--warn' : 'kpi--ok'))}
        ${raw(kpi('F29 estimado', fmtCLP(f29.estimatedF29Payment), `IVA + PPM + retenciones`))}
        ${raw(kpi('Flujo del mes', fmtCLP(summary.netCash), `Entradas ${fmtCLP(summary.cashIn)} · salidas ${fmtCLP(summary.cashOut)}`, summary.netCash < 0 ? 'kpi--err' : 'kpi--ok'))}
      </div>

      <div class="grid" style="margin-bottom:16px">
        ${raw(
          kpi(
            'Capital enterado',
            fmtCLP(capital.capitalEnterado),
            capital.capitalPorEnterar === null
              ? 'Falta declarar el capital suscrito'
              : capital.capitalPorEnterar > 0
                ? `Quedan ${fmtCLP(capital.capitalPorEnterar)} por enterar`
                : 'Capital suscrito íntegramente enterado',
            capital.capitalPorEnterar > 0 ? 'kpi--warn' : ''
          )
        )}
        ${raw(
          kpi(
            'CPT último cierre',
            ultimoCierre ? fmtCLP(ultimoCierre.CPT) : '—',
            ultimoCierre ? `Ejercicio ${ultimoCierre.fiscalYear} · ${ultimoCierre.CPTMethod}` : 'Aún no has cerrado ningún ejercicio',
            ultimoCierre ? '' : 'kpi--warn'
          )
        )}
        ${raw(
          kpi(
            `Patente ${year}`,
            patente ? fmtCLP(patente.annualPatent) : '—',
            patente
              ? `${patente.businessStage === 'NEW_BUSINESS' ? 'Empresa nueva' : 'En funcionamiento'} · base ${fmtCLP(patente.baseCapital)}`
              : 'Faltan las reglas del año o el cierre anterior'
          )
        )}
        ${raw(
          kpi(
            'Cierre anual',
            w.getAnnualClose(year) ? 'cerrado' : 'abierto',
            w.getAnnualClose(year) ? `Ejercicio ${year} congelado` : `Ejercicio ${year} todavía se puede modificar`,
            w.getAnnualClose(year) ? 'kpi--ok' : ''
          )
        )}
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head">
            <h2>Diagnóstico</h2>
            <span class="tag">${health.issues.length} punto(s)</span>
          </div>
          ${health.issues.length === 0
            ? raw(html`<div class="note note--ok"><span class="note__icon">✓</span><p>Sin observaciones para ${fmtPeriod(period)}. Recuerda que esto verifica lo que registraste, no lo que el SII tiene.</p></div>`)
            : raw(
                health.issues
                  .map(
                    i => html`<div class="note note--${raw(NOTE_KIND[i.level])}">
                      <span class="note__icon">${i.level === 'error' ? '✕' : i.level === 'warn' ? '!' : 'i'}</span>
                      <p>${i.message}</p>
                    </div>`
                  )
                  .join('')
              )}
        </div>

        <div class="card">
          <div class="card__head">
            <h2>Habilitación de la empresa</h2>
            <span class="tag ${raw(formation.ready ? 'tag--ok' : '')}">${formation.done}/${formation.total}</span>
          </div>
          <div class="progress" role="progressbar" aria-valuenow="${formation.percent}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress__fill" style="width:${formation.percent}%"></div>
          </div>
          <p class="card__hint" style="margin-top:10px">
            ${formation.ready
              ? 'Todos los trámites tienen evidencia registrada.'
              : `Faltan ${formation.total - formation.done} trámite(s) con evidencia. Un paso sólo cuenta cuando guardas su folio o certificado.`}
          </p>
          <div class="btn__row" style="margin-top:12px">
            <button class="btn btn--sm" data-go="constitucion">Ver constitución</button>
            <button class="btn btn--sm" data-go="capital">Capital y patrimonio</button>
            <button class="btn btn--sm" data-go="operaciones">Registrar operación</button>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h2>Próximos vencimientos</h2></div>
          <div class="tablewrap">
            <table>
              <thead><tr><th>Obligación</th><th>Período</th><th>Vence</th><th>Estado</th></tr></thead>
              <tbody>
                ${pendientes.length === 0
                  ? raw(`<tr><td colspan="4" class="table__empty">Sin obligaciones pendientes registradas.</td></tr>`)
                  : raw(
                      pendientes
                        .slice()
                        .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
                        .slice(0, 6)
                        .map(o => {
                          const late = o.dueDate && o.dueDate < new Date().toISOString().slice(0, 10);
                          return html`<tr>
                            <td>${o.type}</td>
                            <td>${o.period || '—'}</td>
                            <td>${fmtDate(o.dueDate)}</td>
                            <td><span class="tag ${raw(late ? 'tag--err' : 'tag--warn')}">${late ? 'vencida' : o.status}</span></td>
                          </tr>`;
                        })
                        .join('')
                    )}
              </tbody>
            </table>
          </div>
          ${vencidas.length > 0
            ? raw(html`<div class="note note--err" style="margin-top:12px"><span class="note__icon">✕</span><p>${vencidas.length} obligación(es) pasaron su fecha sin comprobante registrado.</p></div>`)
            : ''}
        </div>

        <div class="card">
          <div class="card__head"><h2>F29 de ${fmtPeriod(period)}</h2></div>
          <p class="card__hint">Fechas de referencia según las reglas cargadas. Verifica siempre el calendario oficial del SII, incluidos los feriados.</p>
          <div class="tablewrap" style="margin-top:8px">
            <table>
              <tbody>
                <tr><td>Plazo general</td><td class="num">${fmtDate(due.general.date)}</td></tr>
                <tr><td>Internet, con pago</td><td class="num">${fmtDate(due.internetWithPayment.date)}</td></tr>
                <tr><td>Internet, sin pago</td><td class="num">${fmtDate(due.internetWithoutPayment.date)}</td></tr>
              </tbody>
            </table>
          </div>
          <div class="btn__row" style="margin-top:12px">
            <button class="btn btn--sm btn--primary" data-go="impuestos">Abrir borrador F29</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>El ciclo que esta app controla</h2></div>
        <p class="card__hint">
          Registrar → respaldar con evidencia → conciliar con el RCV → revisar impuestos → cerrar el período →
          presentar en el portal oficial → guardar el comprobante → recién entonces marcar la obligación como cumplida.
        </p>
        <div class="note note--info" style="margin-top:10px">
          <span class="note__icon">i</span>
          <p>Esta aplicación <strong>no presenta ni paga</strong> nada ante el SII. Calcula, controla y guarda evidencia; la presentación ocurre en los sistemas oficiales.</p>
        </div>
      </div>`;
  }
};
