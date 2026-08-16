import { html, raw, esc, fmtCLP, fmtDate, openModal, confirmAction, attempt, toast } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { termChip, mountTerms } from '../lib/terms.js';
import { EQUITY_MOVEMENT_KINDS, OWNER_MONEY_NATURES, CONTRIBUTED_ASSET_TYPES, equityMovementKind } from '../core/company-operations/capital.mjs';
import { municipalityOptions } from '../core/chile-tax-rules/municipalities.mjs';

/**
 * Capital y Patrimonio.
 *
 * Esta pantalla existe para que cinco cifras que la versión anterior fundía en
 * un solo campo `capital` se puedan ver una al lado de la otra y no puedan
 * confundirse: lo que dice el estatuto, lo que se comprometió, lo que llegó, lo
 * que vale la empresa en libros y lo que el fisco considera capital propio.
 *
 * Nada se calcula aquí: todo viene de `company-operations` y del motor
 * contable. La vista sólo presenta y explica de dónde salió cada número.
 */

const YEAR_OF = period => Number(String(period).slice(0, 4));

const statusTag = status =>
  `<span class="tag ${status === 'VERIFICADO' || status === 'PAGADO' ? 'tag--ok' : status === 'ESTIMADO' ? 'tag--warn' : ''}">${esc(status)}</span>`;

/** Desglose “¿de dónde salió este número?” en forma de tabla con signo. */
const breakdownTable = (rows, total, totalLabel) => `
  <div class="tablewrap"><table>
    <tbody>
      ${rows
        .map(
          r => `<tr>
            <td>${r.sign === undefined ? '' : `<span class="num" style="color:var(--text-faint)">${r.sign > 0 ? '+' : '−'}</span> `}${esc(r.label)}</td>
            <td class="num">${r.amount === null ? '—' : fmtCLP(r.amount)}</td>
          </tr>`
        )
        .join('')}
      <tr><td><strong>${esc(totalLabel)}</strong></td><td class="num"><strong>${fmtCLP(total)}</strong></td></tr>
    </tbody>
  </table></div>`;

const warnList = (items, kind = 'warn') =>
  items?.length
    ? items
        .map(w => `<div class="note note--${kind}" style="margin-top:8px"><span class="note__icon">${kind === 'warn' ? '!' : 'i'}</span><p>${esc(w)}</p></div>`)
        .join('')
    : '';

export default {
  id: 'capital',
  label: 'Capital',
  title: 'Capital y patrimonio',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 20h18"/><path d="M5 20V9l7-5 7 5v11"/><path d="M10 20v-6h4v6"/></svg>',

  render() {
    const w = ws();
    const year = this.year ?? YEAR_OF(state.period);
    const profile = w.getCapitalProfile();
    const position = w.capitalPosition();
    const municipal = w.getMunicipalProfile();
    const balance = w.estimatedBalance(year);
    const close = w.getAnnualClose(year);
    const movements = w.effectiveEquityMovements();
    const history = w.capitalHistory();

    let cpt = null;
    let cptError = null;
    try {
      cpt = close?.taxEquity ?? w.taxEquityFor(year);
    } catch (error) {
      cptError = error.message;
    }

    let patent = null;
    let patentError = null;
    try {
      patent = w.municipalPatentFor(year);
    } catch (error) {
      patentError = error.message;
    }

    const years = [...new Set([...history.map(h => h.year), year, YEAR_OF(state.period)])].sort().reverse();

    return html`
      <div class="page__head">
        <div class="page__title"><h1>Capital y patrimonio</h1>
          <span class="tag ${raw(close ? 'tag--ok' : 'tag--warn')}">${close ? `${year} cerrado` : `${year} abierto`}</span></div>
        <p>
          Seis magnitudes distintas, nunca sinónimos: lo que dice el estatuto, lo que se comprometió, lo que efectivamente llegó,
          lo que falta por enterar, lo que vale la empresa en libros y lo que el fisco considera capital propio —más la que la ley
          manda usar para la patente de este período. Pulsa <strong>?</strong> junto a cualquiera para ver qué es.
        </p>
        <label class="field" style="max-width:220px;margin-top:10px">
          <span class="field__label">Ejercicio</span>
          <select data-year>${raw(years.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`).join(''))}</select>
        </label>
      </div>

      <!-- ------------------------------------------------ las cinco cifras -->
      <div class="grid" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi__label">${raw(`Capital social ${termChip('capital-social')}`)}</div>
          <div class="kpi__value">${position.capitalSocial === null ? '—' : fmtCLP(position.capitalSocial)}</div>
          <div class="kpi__foot">${position.capitalSocial === null ? 'Sin declarar en la ficha' : 'Según el estatuto'}</div></div>
        <div class="kpi"><div class="kpi__label">${raw(`Capital enterado ${termChip('capital-enterado')}`)}</div>
          <div class="kpi__value">${fmtCLP(position.capitalEnterado)}</div>
          <div class="kpi__foot">Lo que efectivamente entró</div></div>
        <div class="kpi ${raw(position.capitalPorEnterar > 0 ? 'kpi--warn' : '')}">
          <div class="kpi__label">${raw(`Por enterar ${termChip('capital-por-enterar')}`)}</div>
          <div class="kpi__value">${position.capitalPorEnterar === null ? '—' : fmtCLP(position.capitalPorEnterar)}</div>
          <div class="kpi__foot">${position.capitalPorEnterar === null ? 'Falta el capital suscrito' : 'Compromiso pendiente'}</div></div>
        <div class="kpi"><div class="kpi__label">${raw(`Patrimonio contable ${termChip('patrimonio-contable')}`)}</div>
          <div class="kpi__value">${fmtCLP(balance.accountingEquity)}</div>
          <div class="kpi__foot">Activos ${fmtCLP(balance.assets)} − pasivos ${fmtCLP(balance.liabilities)}</div></div>
        <div class="kpi"><div class="kpi__label">${raw(`CPT estimado ${termChip('cpt')}`)}</div>
          <div class="kpi__value">${cpt ? fmtCLP(cpt.calculatedCPT) : '—'}</div>
          <div class="kpi__foot">${cpt ? (close ? `Cierre ${year}` : 'Estimación interna') : 'No calculable'}</div></div>
        <div class="kpi"><div class="kpi__label">${raw(`Base patente ${termChip('capital-base-patente')}`)}</div>
          <div class="kpi__value">${patent ? fmtCLP(patent.baseCapital) : '—'}</div>
          <div class="kpi__foot">${patent ? (patent.businessStage === 'NEW_BUSINESS' ? 'Empresa nueva' : 'Empresa en funcionamiento') : 'No calculable'}</div></div>
      </div>

      ${raw(warnList(position.validation.warnings))}
      ${raw(
        position.pendingConfirmation.length
          ? `<div class="note note--warn"><span class="note__icon">!</span><p>
              Estos campos se migraron desde el antiguo campo único “capital” y siguen marcados como
              <code>PENDING_CONFIRMATION</code>: <strong>${esc(position.pendingConfirmation.join(', '))}</strong>.
              La aplicación no los inventa — confírmalos en el formulario de constitución.</p></div>`
          : ''
      )}

      <div class="grid grid--2" style="margin-top:14px">
        <!-- ------------------------------------------------- constitución -->
        <div class="card">
          <div class="card__head"><h2>Constitución</h2></div>
          <form data-capital-form>
            <div class="form__row">
              <label class="field"><span class="field__label">${raw(`Capital social ${termChip('capital-social')}`)}</span>
                <input type="number" name="capitalSocial" min="0" step="1" value="${profile.capitalSocial ?? ''}" placeholder="Lo que dice el estatuto"></label>
              <label class="field"><span class="field__label">${raw(`Capital suscrito ${termChip('capital-suscrito')}`)}</span>
                <input type="number" name="capitalSuscrito" min="0" step="1" value="${profile.capitalSuscrito ?? ''}" placeholder="Lo comprometido"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">${raw(`Capital enterado ${termChip('capital-enterado')}`)}</span>
                <input type="number" name="capitalEnterado" min="0" step="1" value="${profile.capitalEnterado ?? 0}">
                <span class="field__hint">Los movimientos registrados abajo pueden elevarlo por su cuenta.</span></label>
              <label class="field"><span class="field__label">N.º de acciones</span>
                <input type="number" name="numeroAcciones" min="0" step="1" value="${profile.numeroAcciones ?? ''}"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Valor nominal (si aplica)</span>
                <input type="number" name="valorNominal" min="0" step="1" value="${profile.valorNominal ?? ''}"></label>
              <label class="field"><span class="field__label">Fecha de constitución</span>
                <input type="date" name="fechaConstitucion" value="${profile.fechaConstitucion ?? ''}"></label>
            </div>
            <label class="field"><span class="field__label">Fecha de inicio de actividades</span>
              <input type="date" name="fechaInicioActividades" value="${profile.fechaInicioActividades ?? ''}">
              <span class="field__hint">Decide qué ejercicio es el primero, y con eso qué capital usa la patente.</span></label>
            <button class="btn btn--primary" type="submit">Guardar constitución</button>
          </form>

          ${raw(
            profile.accionistas.length
              ? `<div class="tablewrap" style="margin-top:14px"><table>
                  <thead><tr><th>Accionista</th><th class="num">%</th><th class="num">Suscrito</th><th class="num">Enterado</th></tr></thead>
                  <tbody>${profile.accionistas
                    .map(
                      s => `<tr><td>${esc(s.name)}${s.rut ? `<br><span class="card__hint">${esc(s.rut)}</span>` : ''}</td>
                        <td class="num">${s.sharePercent ?? '—'}</td>
                        <td class="num">${s.capitalSuscrito === null ? '—' : fmtCLP(s.capitalSuscrito)}</td>
                        <td class="num">${s.capitalEnterado === null ? '—' : fmtCLP(s.capitalEnterado)}</td></tr>`
                    )
                    .join('')}</tbody></table></div>`
              : `<p class="card__hint" style="margin-top:12px">Sin accionistas registrados. Una SpA con un accionista único al 100 % es una estructura perfectamente válida y la aplicación no supone lo contrario.</p>`
          )}
          <div class="btn__row" style="margin-top:10px"><button class="btn btn--sm" data-add-shareholder>Agregar accionista</button></div>
        </div>

        <!-- ------------------------------------------------- situación ---- -->
        <div class="card">
          <div class="card__head"><h2>Situación al cierre de ${year}</h2>${raw(statusTag(close ? 'DECLARADO' : 'ESTIMADO'))}</div>
          <div class="tablewrap"><table><tbody>
            <tr><td>${raw(`Activos ${termChip('activo')}`)}</td><td class="num">${fmtCLP(close?.assets ?? balance.assets)}</td></tr>
            <tr><td>${raw(`Pasivos exigibles ${termChip('pasivo-exigible')}`)}</td><td class="num">${fmtCLP(close?.liabilities ?? balance.liabilities)}</td></tr>
            <tr><td>${raw(`Patrimonio contable ${termChip('patrimonio-contable')}`)}</td><td class="num">${fmtCLP(close?.accountingEquity ?? balance.accountingEquity)}</td></tr>
            <tr><td>${raw(`Deuda con el accionista ${termChip('prestamo-del-accionista')}`)}</td><td class="num">${fmtCLP(position.deudaConAccionista)}</td></tr>
            <tr><td>${raw(`Retiros del ejercicio ${termChip('retiro')}`)}</td><td class="num">${fmtCLP(position.retiros)}</td></tr>
          </tbody></table></div>
          ${raw(warnList(balance.limitations, 'info'))}
        </div>
      </div>

      <!-- ------------------------------------------------------------ CPT -->
      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Capital Propio Tributario estimado</h2>${raw(cpt ? statusTag(close ? 'DECLARADO' : cpt.status) : '')}</div>
        ${raw(
          cptError
            ? `<div class="note note--err"><span class="note__icon">✕</span><p>${esc(cptError)}</p></div>`
            : `
          <div class="kpi__value" style="font-size:1.7rem">${fmtCLP(cpt.calculatedCPT)}</div>
          <p class="card__hint" style="margin-top:6px">
            Método: <strong>${esc(cpt.calculationMethodLabel)}</strong> · Base legal: ${esc(cpt.legalBasis)} ·
            Reglas del año ${cpt.rulesYear}, verificadas el ${esc(cpt.rulesLastVerified)}.
          </p>
          <details class="qa" style="margin-top:12px"><summary>¿Cómo llegamos a este valor?</summary>
            <div class="qa__body">
              ${breakdownTable(cpt.breakdown, cpt.calculatedCPT, 'Capital propio tributario')}
              <p class="card__hint" style="margin-top:10px">${esc(cpt.formula)}</p>
              ${cpt.flooredAtZero ? '<p class="card__hint">El resultado bruto fue negativo y la ley manda considerar $0.</p>' : ''}
            </div>
          </details>
          <details class="qa" style="margin-top:8px"><summary>¿Para qué sirve y está confirmado?</summary>
            <div class="qa__body">
              <p>El CPT es la medida tributaria del patrimonio. Se declara en el F22 y es la cifra que el SII pone a disposición
              de la municipalidad para calcular la patente del período siguiente.</p>
              <p><strong>${close ? 'Guardado en el cierre anual' : 'Estimación interna'}</strong> —
              ${close ? 'quedó congelado al cerrar el ejercicio.' : 'aún no verificada con la declaración anual.'}</p>
            </div>
          </details>
          ${warnList(cpt.assumptions, 'info')}
          ${warnList(cpt.warnings)}`
        )}
      </div>

      <!-- -------------------------------------------------- municipalidad -->
      <div class="grid grid--2" style="margin-top:14px">
        <div class="card">
          <div class="card__head"><h2>Municipalidad</h2></div>
          <form data-municipal-form>
            <div class="form__row">
              <label class="field"><span class="field__label">Comuna</span>
                <select name="municipalityId">
                  <option value="">— Selecciona o escribe abajo —</option>
                  ${raw(municipalityOptions().map(o => `<option value="${esc(o.id)}" ${o.id === municipal.municipalityId ? 'selected' : ''}>${esc(o.commune)} (${esc(o.region)})</option>`).join(''))}
                </select></label>
              <label class="field"><span class="field__label">Comuna (si no está en la lista)</span>
                <input type="text" name="commune" value="${municipal.commune ?? ''}" placeholder="Nombre de la comuna"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Tasa municipal (por mil)</span>
                <input type="number" name="patentRatePerMil" min="2.5" max="5" step="0.01" value="${municipal.patentRate === null ? '' : (municipal.patentRate * 1000).toFixed(2)}" placeholder="entre 2,50 y 5,00">
                <span class="field__hint">Rango legal del art. 24: 2,5‰ a 5‰. Si la dejas vacía se usa el mínimo como supuesto.</span></label>
              <label class="field"><span class="field__label">Fuente de la tasa</span>
                <input type="text" name="rateSource" value="${municipal.rateSource ?? ''}" placeholder="Ordenanza municipal, URL o certificado"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Fecha de verificación</span>
                <input type="date" name="lastVerified" value="${municipal.lastVerified ?? ''}"></label>
              <label class="field"><span class="field__label">UTM del período (YYYY-MM)</span>
                <input type="text" name="utmPeriod" value="${municipal.utmPeriod ?? ''}" placeholder="2026-08" pattern="\\d{4}-\\d{2}"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Capital propio inicial declarado</span>
                <input type="number" name="initialOwnCapital" min="0" step="1" value="${municipal.initialOwnCapital ?? ''}" placeholder="Sólo empresa nueva">
                <span class="field__hint">La base legal de la patente inicial. Si lo dejas vacío se usa el capital enterado.</span></label>
              <label class="field"><span class="field__label">${raw(`Inversiones deducibles ${termChip('inversiones-deducibles')}`)}</span>
                <input type="number" name="deductibleInvestments" min="0" step="1" value="${municipal.deductibleInvestments || ''}" placeholder="0">
                <span class="field__hint">Exige certificado de la municipalidad correspondiente.</span></label>
            </div>
            <label class="field"><span class="field__label">${raw(`Capital asignado a esta unidad ${termChip('prorrateo-sucursales')}`)}</span>
              <input type="number" name="allocatedCapital" min="0" step="1" value="${municipal.allocatedCapital ?? ''}" placeholder="Sólo si hay sucursales en otras comunas"></label>
            <button class="btn btn--primary" type="submit">Guardar datos municipales</button>
          </form>
        </div>

        <div class="card">
          <div class="card__head"><h2>Patente municipal ${year}</h2>${raw(patent ? statusTag(patent.status) : '')}</div>
          ${raw(
            patentError
              ? `<div class="note note--err"><span class="note__icon">✕</span><p>${esc(patentError)}</p></div>
                 <p class="card__hint" style="margin-top:8px">La aplicación falla en vez de calcular con las tasas de otro año: una cifra del año equivocado es peor que un error visible.</p>`
              : `
            <div class="kpi__value" style="font-size:1.7rem">${fmtCLP(patent.annualPatent)}</div>
            <p class="card__hint" style="margin-top:6px">
              ${patent.businessStage === 'NEW_BUSINESS'
                ? 'Empresa nueva — patente calculada sobre el capital propio inicial declarado.'
                : 'Empresa en funcionamiento — patente calculada sobre el capital propio del cierre anterior.'}
              Semestral estimado: ${fmtCLP(patent.semesterAmount)}.
            </p>
            <details class="qa" style="margin-top:12px" open><summary>¿De dónde salió este número?</summary>
              <div class="qa__body">
                ${breakdownTable(
                  [
                    { label: 'Capital base de patente', amount: patent.baseCapital },
                    { label: `Tasa municipal (${(patent.rate * 1000).toLocaleString('es-CL', { maximumFractionDigits: 2 })}‰)`, amount: null },
                    { label: 'Patente calculada', amount: patent.rawPatent },
                    { label: `Mínimo legal (1 UTM de ${fmtCLP(patent.utm)})`, amount: patent.minimumPatent },
                    { label: `Máximo legal (8.000 UTM)`, amount: patent.maximumPatent }
                  ],
                  patent.annualPatent,
                  patent.cappedBy === 'minimo' ? 'Patente anual (se aplicó el mínimo)' : patent.cappedBy === 'maximo' ? 'Patente anual (se aplicó el máximo)' : 'Patente anual'
                )}
                <div class="tablewrap" style="margin-top:10px"><table><tbody>
                  <tr><td>Origen de la base</td><td>${esc(patent.baseOrigin.rule)}</td></tr>
                  <tr><td>Fuente legal</td><td>${esc(patent.legalBasis)}</td></tr>
                  <tr><td>UTM utilizada</td><td>${fmtCLP(patent.utm)}${patent.utmPeriod ? ` (${esc(patent.utmPeriod)})` : ''}</td></tr>
                  <tr><td>Estado de la tasa</td><td>${patent.rateStatus === 'VERIFIED' ? 'verificada' : 'no verificada'}</td></tr>
                  <tr><td>Última verificación de la regla</td><td>${esc(patent.rulesLastVerified)}</td></tr>
                </tbody></table></div>
              </div>
            </details>
            ${warnList(patent.assumptions, 'info')}
            ${warnList(patent.warnings)}`
          )}
        </div>
      </div>

      <!-- ------------------------------------------------- movimientos ---- -->
      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Movimientos de capital</h2>
          <button class="btn btn--sm btn--primary" data-add-movement>Registrar movimiento</button></div>
        <p class="card__hint">
          Un aporte y un préstamo del accionista entran por el mismo banco y son opuestos en el balance.
          Por eso la aplicación pregunta la naturaleza en vez de suponer que todo lo que pone el dueño es capital.
        </p>
        <div class="tablewrap tablewrap--wide" style="margin-top:10px">
          <table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th class="num">Monto</th><th>Evidencia</th><th></th></tr></thead>
            <tbody>
              ${movements.length === 0
                ? raw('<tr><td colspan="6" class="table__empty">Sin movimientos patrimoniales registrados.</td></tr>')
                : raw(
                    movements
                      .slice()
                      .reverse()
                      .map(mv => {
                        const kind = equityMovementKind(mv.kind);
                        return `<tr>
                          <td>${fmtDate(mv.date)}</td>
                          <td><span class="tag ${kind?.equityEffect > 0 ? 'tag--in' : kind?.liabilityEffect > 0 ? 'tag--warn' : kind?.equityEffect < 0 ? 'tag--out' : ''}">${esc(kind?.label ?? mv.kind)}</span></td>
                          <td>${esc(mv.description || '—')}${mv.assetDescription ? `<br><span class="card__hint">${esc(mv.assetDescription)}</span>` : ''}</td>
                          <td class="num">${fmtCLP(mv.amount)}</td>
                          <td>${mv.evidenceRef ? esc(mv.evidenceRef) : '<span class="tag tag--warn">sin evidencia</span>'}</td>
                          <td>${mv.derivedFromTransaction ? '<span class="card__hint">desde operación</span>' : `<button class="btn btn--ghost btn--sm" data-del-movement="${esc(mv.id)}" aria-label="Eliminar">✕</button>`}</td>
                        </tr>`;
                      })
                      .join('')
                  )}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ------------------------------------------------- cierre anual --- -->
      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Cierre anual ${year}</h2>${raw(close ? '<span class="tag tag--ok">cerrado</span>' : '<span class="tag tag--warn">abierto</span>')}</div>
        ${raw(
          close
            ? `<p class="card__hint">Cerrado el ${esc(close.createdAt.slice(0, 10))}. El snapshot es inmutable: guarda activos, pasivos, patrimonio, CPT, movimientos
                 y la VERSIÓN de las reglas con que se calculó, para que dentro de años siga explicándose solo.</p>
               <div class="tablewrap" style="margin-top:10px"><table><tbody>
                 <tr><td>Régimen tributario</td><td>${esc(close.taxRegime ?? '—')}</td></tr>
                 <tr><td>CPT (${esc(close.CPTMethod)})</td><td class="num">${fmtCLP(close.CPT)}</td></tr>
                 <tr><td>Origen del balance</td><td>${esc(close.balanceOrigin)}</td></tr>
                 <tr><td>Base municipal para ${close.municipalPatentBaseForNextPeriod.period}</td><td class="num">${fmtCLP(close.municipalPatentBaseForNextPeriod.baseCapital)}</td></tr>
                 <tr><td>Reglas usadas</td><td>año ${close.legalRulesVersion.commercialYear}, verificadas el ${esc(close.legalRulesVersion.lastVerified)}</td></tr>
               </tbody></table></div>
               <div class="btn__row" style="margin-top:12px">
                 <button class="btn btn--sm" data-export-dossier>Exportar expediente anual</button>
                 <button class="btn btn--sm btn--danger" data-reopen-year>Reabrir ejercicio</button>
               </div>`
            : `<p class="card__hint">Cerrar el ejercicio fija el CPT del año y produce la base municipal del período siguiente.
                 Puedes declarar activos y pasivos reales; si los dejas vacíos se usa la estimación derivada de las operaciones.</p>
               <form data-close-year style="margin-top:12px">
                 <div class="form__row">
                   <label class="field"><span class="field__label">Activos declarados</span>
                     <input type="number" name="assets" min="0" step="1" placeholder="${balance.assets}"></label>
                   <label class="field"><span class="field__label">Pasivos exigibles declarados</span>
                     <input type="number" name="liabilities" min="0" step="1" placeholder="${balance.liabilities}"></label>
                 </div>
                 <label class="field"><span class="field__label">Notas del cierre</span>
                   <textarea name="notes" placeholder="Qué revisaste, qué quedó pendiente, con qué contador se validó."></textarea></label>
                 <button class="btn btn--primary" type="submit">Cerrar ejercicio ${year}</button>
               </form>`
        )}
      </div>

      <!-- ---------------------------------------------------- historial --- -->
      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Historial</h2></div>
        <p class="card__hint">
          Un ejercicio cerrado no se recalcula nunca: se muestra lo que quedó guardado. Eso es lo que permite auditarlo y reproducirlo.
          Cuando un período todavía no tiene reglas tributarias verificadas, su patente aparece marcada como
          <strong>simulada con las reglas del último año disponible</strong> — nunca calculada como si fueran las del período.
        </p>
        <div class="tablewrap tablewrap--wide" style="margin-top:10px">
          <table>
            <thead><tr><th>Año</th><th class="num">Capital enterado</th><th class="num">Patrimonio</th><th class="num">CPT</th><th class="num">Base patente</th><th class="num">Patente</th><th>Estado</th></tr></thead>
            <tbody>
              ${history.length === 0
                ? raw('<tr><td colspan="7" class="table__empty">Todavía no hay ejercicios con movimiento.</td></tr>')
                : raw(
                    history
                      .slice()
                      .reverse()
                      .map(
                        h => `<tr>
                          <td><strong>${h.year}</strong></td>
                          <td class="num">${fmtCLP(h.capitalEnterado)}</td>
                          <td class="num">${h.accountingEquity === null ? '—' : fmtCLP(h.accountingEquity)}</td>
                          <td class="num">${h.CPT === null ? '—' : fmtCLP(h.CPT)}</td>
                          <td class="num">${h.patent ? fmtCLP(h.patent.baseCapital) : '—'}</td>
                          <td class="num">${
                            h.patent
                              ? `${fmtCLP(h.patent.annualPatent)}${
                                  h.simulatedWithRulesYear
                                    ? `<br><span class="tag tag--warn">simulada con reglas ${h.simulatedWithRulesYear}</span>`
                                    : ''
                                }`
                              : `<span class="card__hint">${esc(h.patentError ?? '—')}</span>`
                          }</td>
                          <td><span class="tag ${h.closed ? 'tag--ok' : 'tag--warn'}">${h.closed ? 'cerrado' : 'abierto'}</span></td>
                        </tr>`
                      )
                      .join('')
                  )}
            </tbody>
          </table>
        </div>
      </div>

      ${state.mode === 'sandbox' ? raw(this.simulator(w, year)) : ''}

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>El ciclo completo</h2></div>
        <p class="card__hint">
          Constitución → capital societario → capital enterado → inicio de actividades → declaración inicial → <strong>patente inicial</strong> →
          operaciones del año → contabilidad → <strong>cierre anual</strong> → renta (F22) → <strong>CPT</strong> →
          base municipal del período siguiente → <strong>patente siguiente</strong> → nuevo ejercicio.
        </p>
        <div class="note note--info" style="margin-top:10px"><span class="note__icon">i</span>
          <p>Esta aplicación <strong>no está conectada</strong> al SII ni a ninguna municipalidad. El SII pone el capital propio declarado a
          disposición de cada municipalidad dentro del mes de mayo (art. 24 del D.L. 3.063); aquí sólo se modela ese flujo.</p></div>
      </div>`;
  },

  /**
   * Simulador educativo. Sólo en SANDBOX, para que quede claro que son cifras
   * de práctica y no la situación de la empresa real.
   */
  simulator(w, year) {
    const escenarios = [500000, 1000000, 5000000];
    const filas = escenarios
      .map(capital => {
        try {
          const patente = w.municipalPatentFor(year, { initialOwnCapital: capital, businessStage: 'NEW_BUSINESS' });
          return `<tr>
            <td class="num">${fmtCLP(capital)}</td>
            <td class="num">${fmtCLP(patente.rawPatent)}</td>
            <td class="num">${fmtCLP(patente.annualPatent)}</td>
            <td>${patente.cappedBy === 'minimo' ? '<span class="tag tag--warn">mínimo legal</span>' : patente.cappedBy === 'maximo' ? '<span class="tag tag--warn">máximo legal</span>' : '<span class="tag tag--ok">cálculo normal</span>'}</td>
          </tr>`;
        } catch (error) {
          return `<tr><td class="num">${fmtCLP(capital)}</td><td colspan="3"><span class="card__hint">${esc(error.message)}</span></td></tr>`;
        }
      })
      .join('');

    return `
      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Simulador: ¿qué cambia según el capital inicial?</h2><span class="tag">sandbox</span></div>
        <p class="card__hint">Misma comuna, misma tasa, mismo año. Sólo cambia el capital propio inicial declarado.</p>
        <div class="tablewrap" style="margin-top:10px"><table>
          <thead><tr><th class="num">Capital inicial</th><th class="num">Patente calculada</th><th class="num">Patente anual</th><th>Qué pasó</th></tr></thead>
          <tbody>${filas}</tbody>
        </table></div>
        <div class="note note--info" style="margin-top:10px"><span class="note__icon">i</span>
          <p>Con capitales pequeños la patente no baja: choca contra el mínimo de 1 UTM. Ese es el efecto que hace que
          “poner poco capital para pagar menos patente” funcione mucho menos de lo que la gente supone —
          y no dice nada de lo que ocurrirá el año 2, cuando la base pase a ser el capital propio tributario.</p></div>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();
    const year = this.year ?? YEAR_OF(state.period);
    mountTerms(root);

    root.querySelector('[data-year]')?.addEventListener('change', e => {
      this.year = Number(e.target.value);
      rerender(true);
    });

    root.querySelector('[data-capital-form]')?.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const num = v => (v === '' || v === null || v === undefined ? null : Number(v));
      const ok = await attempt(
        () =>
          w.saveCapitalProfile({
            capitalSocial: num(d.capitalSocial),
            capitalSuscrito: num(d.capitalSuscrito),
            capitalEnterado: Number(d.capitalEnterado || 0),
            numeroAcciones: num(d.numeroAcciones),
            valorNominal: num(d.valorNominal),
            fechaConstitucion: d.fechaConstitucion || null,
            fechaInicioActividades: d.fechaInicioActividades || null
          }),
        'Constitución guardada'
      );
      if (ok) rerender(true);
    });

    root.querySelector('[data-municipal-form]')?.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const num = v => (v === '' || v === null || v === undefined ? null : Number(v));
      const ok = await attempt(
        () =>
          w.saveMunicipalProfile({
            municipalityId: d.municipalityId || null,
            commune: d.commune || null,
            // El usuario piensa en “por mil”; el motor trabaja con la fracción.
            patentRate: d.patentRatePerMil === '' ? null : Number(d.patentRatePerMil) / 1000,
            rateSource: d.rateSource || null,
            lastVerified: d.lastVerified || null,
            utmPeriod: d.utmPeriod || null,
            initialOwnCapital: num(d.initialOwnCapital),
            deductibleInvestments: Number(d.deductibleInvestments || 0),
            allocatedCapital: num(d.allocatedCapital)
          }),
        'Datos municipales guardados'
      );
      if (ok) rerender(true);
    });

    root.querySelector('[data-add-shareholder]')?.addEventListener('click', () =>
      openModal({
        title: 'Agregar accionista',
        body: html`
          <div class="form__row">
            <label class="field"><span class="field__label">Nombre</span><input type="text" name="name" required></label>
            <label class="field"><span class="field__label">RUT</span><input type="text" name="rut" placeholder="11.111.111-1"></label>
          </div>
          <div class="form__row">
            <label class="field"><span class="field__label">Participación (%)</span><input type="number" name="sharePercent" min="0" max="100" step="0.01" value="100"></label>
            <label class="field"><span class="field__label">Capital suscrito</span><input type="number" name="capitalSuscrito" min="0" step="1"></label>
          </div>
          <label class="field"><span class="field__label">Capital enterado por este accionista</span>
            <input type="number" name="capitalEnterado" min="0" step="1"></label>`,
        submitLabel: 'Agregar',
        onSubmit: async d => {
          const profile = w.getCapitalProfile();
          const ok = await attempt(
            () => w.saveCapitalProfile({ accionistas: [...profile.accionistas, d] }),
            'Accionista agregado'
          );
          if (!ok) return false;
          rerender(true);
          return true;
        }
      })
    );

    root.querySelector('[data-add-movement]')?.addEventListener('click', () =>
      openModal({
        title: 'Registrar movimiento de capital',
        wide: true,
        body: html`
          <div class="note note--info"><span class="note__icon">i</span>
            <p>Si el dueño depositó dinero, elige qué fue realmente. La cartola bancaria no distingue, pero el balance,
            el capital propio tributario y la patente municipal sí:</p></div>
          <ul class="termlist" style="margin:8px 0 14px">
            ${raw(OWNER_MONEY_NATURES.map(n => `<li><strong>${esc(n.label)}</strong> — ${esc(n.effect)}</li>`).join(''))}
          </ul>
          <label class="field"><span class="field__label">Tipo de movimiento</span>
            <select name="kind" data-kind required>
              ${raw(EQUITY_MOVEMENT_KINDS.map(k => `<option value="${esc(k.id)}">${esc(k.label)}</option>`).join(''))}
            </select>
            <span class="field__hint" data-kind-hint>${esc(EQUITY_MOVEMENT_KINDS[0].hint)}</span></label>
          <div class="form__row">
            <label class="field"><span class="field__label">Fecha</span><input type="date" name="date" required></label>
            <label class="field"><span class="field__label">Monto (CLP)</span><input type="number" name="amount" min="1" step="1" required></label>
          </div>
          <label class="field"><span class="field__label">Descripción</span><input type="text" name="description" placeholder="Aporte del accionista, mutuo, retiro…"></label>
          <div class="form__row">
            <label class="field"><span class="field__label">Accionista</span><input type="text" name="contributedBy"></label>
            <label class="field"><span class="field__label">Evidencia</span><input type="text" name="evidenceRef" placeholder="Cartola, escritura, contrato de mutuo"></label>
          </div>
          <div class="form__row">
            <label class="field"><span class="field__label">Tipo de bien (aporte en bienes)</span>
              <select name="assetType">
                <option value="">—</option>
                ${raw(CONTRIBUTED_ASSET_TYPES.map(t => `<option>${esc(t)}</option>`).join(''))}
              </select></label>
            <label class="field"><span class="field__label">Descripción del bien</span><input type="text" name="assetDescription"></label>
          </div>
          <div class="form__row">
            <label class="field"><span class="field__label">Valor contable</span><input type="number" name="bookValue" min="0" step="1"></label>
            <label class="field"><span class="field__label">Valor tributario</span><input type="number" name="taxValue" min="0" step="1">
              <span class="field__hint">No tiene por qué coincidir con el valor de aporte.</span></label>
          </div>
          <label class="check"><input type="checkbox" name="registerCashMovement" checked>
            <span>Registrar también el movimiento de caja<small>Crea la operación enlazada para que el dinero aparezca en el flujo del mes, sin contarlo dos veces.</small></span></label>`,
        submitLabel: 'Registrar',
        onSubmit: async (d, form) => {
          const ok = await attempt(
            () => w.addEquityMovement(d, { registerCashMovement: form.querySelector('[name=registerCashMovement]').checked }),
            'Movimiento registrado'
          );
          if (!ok) return false;
          rerender(true);
          return true;
        }
      })
    );

    // El texto de ayuda cambia con el tipo elegido: es donde se explica que un
    // préstamo no es capital, justo cuando la persona lo está decidiendo.
    document.addEventListener(
      'change',
      e => {
        if (e.target?.dataset?.kind === undefined && e.target?.name !== 'kind') return;
        const hint = document.querySelector('[data-kind-hint]');
        if (hint) hint.textContent = equityMovementKind(e.target.value)?.hint ?? '';
      },
      { once: false }
    );

    root.querySelectorAll('[data-del-movement]').forEach(btn =>
      btn.addEventListener('click', async () => {
        const yes = await confirmAction({
          title: 'Eliminar movimiento',
          message: 'El movimiento desaparece del ledger patrimonial. La eliminación queda registrada en la bitácora.',
          confirmLabel: 'Eliminar',
          danger: true
        });
        if (!yes) return;
        if (await attempt(() => w.deleteEquityMovement(btn.dataset.delMovement), 'Movimiento eliminado')) rerender(true);
      })
    );

    root.querySelector('[data-close-year]')?.addEventListener('submit', async e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      const yes = await confirmAction({
        title: `Cerrar ejercicio ${year}`,
        message:
          'El cierre fija el CPT del año y produce la base municipal del período siguiente. Queda inmutable: reabrirlo exigirá indicar el motivo.',
        confirmLabel: 'Cerrar ejercicio'
      });
      if (!yes) return;
      const ok = await attempt(
        () =>
          w.closeFiscalYear(year, {
            assets: d.assets === '' ? undefined : Number(d.assets),
            liabilities: d.liabilities === '' ? undefined : Number(d.liabilities),
            notes: d.notes || ''
          }),
        `Ejercicio ${year} cerrado`
      );
      if (ok) rerender(true);
    });

    root.querySelector('[data-reopen-year]')?.addEventListener('click', () =>
      openModal({
        title: `Reabrir ejercicio ${year}`,
        body: html`
          <p>El snapshot del cierre se elimina y el ejercicio vuelve a ser calculable. La acción y su motivo quedan permanentemente en la bitácora.</p>
          <label class="field"><span class="field__label">Motivo</span>
            <textarea name="reason" required placeholder="Ej.: llegó una factura con fecha del ejercicio ya cerrado."></textarea></label>`,
        submitLabel: 'Reabrir',
        onSubmit: async d => {
          const ok = await attempt(() => w.reopenFiscalYear(year, d.reason), 'Ejercicio reabierto');
          if (!ok) return false;
          rerender(true);
          return true;
        }
      })
    );

    root.querySelector('[data-export-dossier]')?.addEventListener('click', async () => {
      const close = w.getAnnualClose(year);
      const company = w.getCompany() ?? {};
      const dossier = {
        format: 'empresa-operativa-chile/expediente-anual',
        formatVersion: 1,
        generatedAt: new Date().toISOString(),
        empresa: { legalName: company.legalName ?? null, rut: company.rut ?? null, commune: company.commune ?? null, taxRegime: company.taxRegime ?? null },
        ejercicio: close,
        patenteDelPeriodo: (() => {
          try {
            return w.municipalPatentFor(year);
          } catch (error) {
            return { error: error.message };
          }
        })(),
        municipalidad: w.getMunicipalProfile(),
        bitacora: w.listAudit()
      };
      const { saveTextFile } = await import('../lib/platform.js');
      const result = await saveTextFile(`expediente-anual-${year}.json`, JSON.stringify(dossier, null, 2));
      if (result.saved) toast(`Expediente anual ${year} exportado (${result.where}).`, 'ok');
    });
  }
};
