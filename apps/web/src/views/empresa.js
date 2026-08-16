import { html, raw, fmtCLP, fmtDateTime, attempt } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { loadRules } from '../core/chile-tax-rules/index.mjs';
import { validateRut } from '../core/company-operations/rut.mjs';
import { termChip, mountTerms } from '../lib/terms.js';

const REGIMES = ['Pro Pyme General (14 D N.º 3)', 'Pro Pyme Transparente (14 D N.º 8)', 'Régimen General semi integrado (14 A)', 'Por definir'];
const OFFICE = [
  ['virtual', 'Oficina virtual'],
  ['propia', 'Domicilio propio'],
  ['arrendada', 'Oficina arrendada'],
  ['coworking', 'Coworking']
];

export default {
  id: 'empresa',
  label: 'Empresa',
  title: 'Ficha de la empresa',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M9 11h2M9 15h2M14 7h1M14 11h1M14 15h1"/></svg>',

  render() {
    const w = ws();
    const c = w.getCompany() ?? {};
    const rules = loadRules(2026);
    const year = Number(String(state.period).slice(0, 4));
    const position = w.capitalPosition();

    // La patente ya no se estima aquí con “capital × tasa mínima”: eso trataba
    // el capital enterado como si fuera siempre la base legal. Ahora la calcula
    // el motor, que distingue empresa nueva de empresa en funcionamiento, y la
    // ficha sólo muestra el resultado y remite a la pantalla que lo explica.
    let patente = null;
    let patenteError = null;
    try {
      patente = w.municipalPatentFor(year);
    } catch (error) {
      patenteError = error.message;
    }

    return html`
      <div class="page__head">
        <h1>Ficha de la empresa</h1>
        <p>Los datos de identidad que usan el resto de las pestañas. Cambiarlos queda registrado en la bitácora.
        El capital vive ahora en <strong>Capital y patrimonio</strong>, donde cada magnitud tiene su propio campo.</p>
      </div>

      <div class="grid grid--2">
        <div class="card">
          <div class="card__head"><h2>Identificación</h2></div>
          <form data-form>
            <div class="form__row">
              <label class="field"><span class="field__label">Razón social</span>
                <input type="text" name="legalName" value="${c.legalName || ''}" placeholder="Mi Empresa SpA" required></label>
              <label class="field"><span class="field__label">Nombre de fantasía</span>
                <input type="text" name="fantasyName" value="${c.fantasyName || ''}" placeholder="Mi Empresa"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">RUT</span>
                <input type="text" name="rut" value="${c.rut || ''}" placeholder="76.123.456-7" data-rut>
                <span class="field__hint" data-rut-hint>Se valida el dígito verificador.</span></label>
              <label class="field"><span class="field__label">Accionista / representante</span>
                <input type="text" name="owner" value="${c.owner || ''}" placeholder="Nombre completo"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Régimen tributario</span>
                <select name="taxRegime">
                  ${raw(REGIMES.map(r => `<option ${r === (c.taxRegime || 'Pro Pyme General (14 D N.º 3)') ? 'selected' : ''}>${r}</option>`).join(''))}
                </select></label>
              <label class="field"><span class="field__label">Giro / actividad principal</span>
                <input type="text" name="activity" value="${c.activity || ''}" placeholder="Servicios de desarrollo de software"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Tipo de domicilio</span>
                <select name="officeType">
                  ${raw(OFFICE.map(([v, l]) => `<option value="${v}" ${v === (c.officeType || 'virtual') ? 'selected' : ''}>${l}</option>`).join(''))}
                </select></label>
              <label class="field"><span class="field__label">Dirección</span>
                <input type="text" name="address" value="${c.address || ''}" placeholder="Calle 123, oficina 4, comuna"></label>
            </div>
            <div class="form__row">
              <label class="field"><span class="field__label">Comuna de la patente</span>
                <input type="text" name="commune" value="${c.commune || ''}" placeholder="Providencia">
                <span class="field__hint">Determina la municipalidad competente, no el capital.</span></label>
              <label class="field"><span class="field__label">Tipo de sociedad</span>
                <input type="text" name="companyType" value="${c.companyType || 'SpA'}" placeholder="SpA"></label>
            </div>
            <label class="field"><span class="field__label">Notas internas</span>
              <textarea name="notes" placeholder="Contexto que quieras recordar: contador, plazos propios, acuerdos.">${c.notes || ''}</textarea></label>
            <button class="btn btn--primary" type="submit">Guardar ficha</button>
            ${c.updatedAt ? raw(`<p class="card__hint" style="margin-top:10px">Última actualización: ${fmtDateTime(c.updatedAt)}</p>`) : ''}
          </form>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card__head"><h2>Capital, en cuatro cifras distintas</h2></div>
            <div class="tablewrap"><table><tbody>
              <tr><td>${raw(`Capital social ${termChip('capital-social')}`)}</td>
                <td class="num">${position.capitalSocial === null ? '—' : fmtCLP(position.capitalSocial)}</td></tr>
              <tr><td>${raw(`Capital suscrito ${termChip('capital-suscrito')}`)}</td>
                <td class="num">${position.capitalSuscrito === null ? '—' : fmtCLP(position.capitalSuscrito)}</td></tr>
              <tr><td>${raw(`Capital enterado ${termChip('capital-enterado')}`)}</td>
                <td class="num">${fmtCLP(position.capitalEnterado)}</td></tr>
              <tr><td>${raw(`Capital por enterar ${termChip('capital-por-enterar')}`)}</td>
                <td class="num">${position.capitalPorEnterar === null ? '—' : fmtCLP(position.capitalPorEnterar)}</td></tr>
            </tbody></table></div>
            ${position.pendingConfirmation.length
              ? raw(html`<div class="note note--warn" style="margin-top:10px"><span class="note__icon">!</span>
                  <p>Faltan por confirmar: <strong>${position.pendingConfirmation.join(', ')}</strong>.
                  Se migraron desde el antiguo campo único “capital” y la aplicación no los inventa.</p></div>`)
              : ''}
            <div class="btn__row" style="margin-top:12px"><button class="btn btn--sm btn--primary" data-go="capital">Abrir Capital y patrimonio</button></div>
          </div>

          <div class="card">
            <div class="card__head"><h2>Patente municipal estimada</h2></div>
            ${patenteError
              ? raw(html`<div class="note note--err"><span class="note__icon">✕</span><p>${patenteError}</p></div>`)
              : raw(html`
                  <div class="kpi__value">${fmtCLP(patente.annualPatent)}</div>
                  <p class="card__hint" style="margin-top:6px">
                    ${patente.businessStage === 'NEW_BUSINESS'
                      ? 'Empresa nueva: base = capital propio inicial declarado'
                      : 'Empresa en funcionamiento: base = capital propio del cierre anterior'}
                    ${fmtCLP(patente.baseCapital)} × ${(patente.rate * 1000).toFixed(2)}‰,
                    acotado entre ${fmtCLP(patente.minimumPatent)} y ${fmtCLP(patente.maximumPatent)}
                    (1 y 8.000 UTM de ${fmtCLP(patente.utm)}).
                  </p>
                  ${patente.warnings
                    .map(warning => html`<div class="note note--warn" style="margin-top:10px"><span class="note__icon">!</span><p>${warning}</p></div>`)
                    .join('')}
                  <div class="btn__row" style="margin-top:10px"><button class="btn btn--sm" data-go="capital">Ver cómo se calculó</button></div>`)}
          </div>

          <div class="card">
            <div class="card__head"><h2>Reglas aplicadas</h2></div>
            <div class="tablewrap">
              <table>
                <tbody>
                  <tr><td>Año comercial</td><td class="num">${rules.commercialYear}</td></tr>
                  <tr><td>IVA general</td><td class="num">${(rules.iva.generalRate * 100).toFixed(0)}%</td></tr>
                  <tr><td>Retención de honorarios</td><td class="num">${(rules.honorarios.retentionRate * 100).toFixed(2)}%</td></tr>
                  <tr><td>PPM inicial Pro Pyme</td><td class="num">${(rules.ppmProPyme.initialYearRate * 100).toFixed(2)}%</td></tr>
                  <tr><td>UTM de referencia</td><td class="num">${fmtCLP(rules.utm['2026-08'])}</td></tr>
                  <tr><td>Patente municipal (rango legal)</td><td class="num">${(rules.municipalPatent.minRate * 1000).toFixed(1)}‰ – ${(rules.municipalPatent.maxRate * 1000).toFixed(1)}‰</td></tr>
                  <tr><td>Tope de la patente</td><td class="num">${rules.municipalPatent.minUtm} – ${rules.municipalPatent.maxUtm.toLocaleString('es-CL')} UTM</td></tr>
                  <tr><td>Última verificación</td><td class="num">${rules.lastVerified}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();
    mountTerms(root);
    const rutInput = root.querySelector('[data-rut]');
    const rutHint = root.querySelector('[data-rut-hint]');

    const checkRut = () => {
      const value = rutInput.value.trim();
      if (!value) {
        rutHint.textContent = 'Se valida el dígito verificador.';
        rutHint.style.color = '';
        return true;
      }
      const result = validateRut(value);
      rutHint.textContent = result.valid ? `RUT válido: ${result.formatted}` : result.reason;
      rutHint.style.color = result.valid ? 'var(--ok)' : 'var(--err)';
      return result.valid;
    };

    rutInput?.addEventListener('blur', checkRut);

    root.querySelector('[data-form]')?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!checkRut()) {
        const { toast } = await import('../lib/dom.js');
        toast('Corrige el RUT antes de guardar', 'err');
        return;
      }
      // `capital` ya no se edita aquí: lo gobierna la ficha de capital. Si se
      // enviara vacío desde este formulario, borraría el capital enterado.
      const data = Object.fromEntries(new FormData(e.target));
      if (await attempt(() => w.saveCompany(data), 'Ficha guardada')) rerender();
    });
  }
};
