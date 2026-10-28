import { html, raw, attempt } from '../lib/dom.js';
import { ws } from '../lib/state.js';
import { listCountryPacks, getCountryPack, jurisdictionReadiness } from '../core/jurisdictions/registry.mjs';
import { SUPPORTED_LOCALES } from '../core/i18n/locales/index.mjs';
import { LIFECYCLE_STATES } from '../core/core/lifecycle.mjs';

const option = (value, label, current) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`;

export default {
  id: 'contexto', label: 'País e idioma', title: 'Contexto jurisdiccional',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
  render() {
    const context = ws().getJurisdictionContext();
    const pack = getCountryPack(context.fiscalCountry);
    const readiness = jurisdictionReadiness(context);
    const admin1 = context.subdivisions.state ?? context.subdivisions.province ?? context.subdivisions.autonomousCommunity ?? '';
    const admin2 = context.subdivisions.municipality ?? context.subdivisions.commune ?? '';
    const packs = listCountryPacks();
    return html`
      <div class="page__head"><h1>País, idioma y ámbito legal</h1><p>El país fiscal decide qué reglas podrían aplicarse. El idioma sólo cambia la interfaz. Operación, residencia y constitución se registran por separado.</p></div>
      <div class="note note--warn"><span class="note__icon">!</span><p><strong>${pack.verification.state}</strong> · ${pack.capabilities.taxCalculations.reason} Cambiar una etiqueta nunca convierte una regla chilena en una regla extranjera.</p></div>
      ${readiness.missingSubdivisions.length ? raw(`<div class="note note--warn"><span class="note__icon">!</span><p>Faltan subdivisiones requeridas: <strong>${readiness.missingSubdivisions.join(', ')}</strong>. Puedes guardar el borrador, pero la orientación permanece REQUIRES_HUMAN_REVIEW.</p></div>`) : ''}
      <form class="card" data-context-form>
        <div class="card__head"><h2>Selector global</h2><span class="status status--${context.verificationState === 'VERIFIED' ? 'done' : 'pending'}">${context.verificationState}</span></div>
        <div class="form__row">
          <label class="field"><span class="field__label">País fiscal</span><select name="fiscalCountry">${raw(packs.map(p => option(p.country, `${p.country} · ${p.agencies.tax.name ?? 'Autoridad por verificar'}`, context.fiscalCountry)).join(''))}</select></label>
          <label class="field"><span class="field__label">Idioma de interfaz</span><select name="locale">${raw(SUPPORTED_LOCALES.map(value => option(value, value, context.locale)).join(''))}</select></label>
        </div>
        <div class="form__row">
          <label class="field"><span class="field__label">País de constitución</span><select name="incorporationCountry">${raw(packs.map(p => option(p.country, p.country, context.incorporationCountry)).join(''))}</select></label>
          <label class="field"><span class="field__label">País de residencia</span><select name="residenceCountry"><option value="">No determinado</option>${raw(packs.map(p => option(p.country, p.country, context.residenceCountry)).join(''))}</select></label>
        </div>
        <div class="form__row">
          <label class="field"><span class="field__label">Países de operación</span><input name="operationCountries" value="${context.operationCountries.join(', ')}" placeholder="CL, PE"><span class="field__hint">Códigos ISO separados por coma.</span></label>
          <label class="field"><span class="field__label">Provincia / estado / comunidad</span><input name="admin1" value="${admin1}" placeholder="SP, Buenos Aires, Cataluña"><span class="field__hint">Competencia subnacional de primer nivel.</span></label>
        </div>
        <label class="field"><span class="field__label">Comuna / municipio</span><input name="admin2" value="${admin2}" placeholder="Providencia, São Paulo, Madrid"><span class="field__hint">Obligatoria cuando el CountryPack lo indica.</span></label>
        <div class="form__row">
          <label class="field"><span class="field__label">Moneda</span><input name="currency" value="${context.currency}" maxlength="3"></label>
          <label class="field"><span class="field__label">Zona horaria IANA</span><input name="timeZone" value="${context.timeZone}"></label>
        </div>
        <div class="form__row">
          <label class="field"><span class="field__label">Tipo de empresa</span><input name="entityType" value="${context.entityType}"></label>
          <label class="field"><span class="field__label">Régimen tributario</span><input name="taxRegime" value="${context.taxRegime}"></label>
        </div>
        <div class="form__row">
          <label class="field"><span class="field__label">Año comercial</span><input name="commercialYear" type="number" min="1900" value="${context.commercialYear}"></label>
          <label class="field"><span class="field__label">Etapa</span><select name="lifecycleStage">${raw(Object.entries(LIFECYCLE_STATES).map(([id, row]) => option(id, row.label, context.lifecycleStage)).join(''))}</select></label>
        </div>
        <button class="btn btn--primary" type="submit">Guardar contexto</button>
      </form>
      <div class="card"><div class="card__head"><h2>Autoridades del país fiscal</h2></div><div class="tablewrap"><table><thead><tr><th>Ámbito</th><th>Autoridad</th><th>Estado</th><th>Alcance</th></tr></thead><tbody>
        ${raw(Object.entries(pack.agencies).map(([key, agency]) => `<tr><td>${key}</td><td>${agency.name ?? 'No determinada'}</td><td>${agency.status}</td><td>${agency.scope}</td></tr>`).join(''))}
      </tbody></table></div></div>`;
  },
  mount(root, rerender) {
    root.querySelector('[data-context-form]')?.addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      const subdivisions = {};
      if (data.fiscalCountry === 'BR') { subdivisions.state = data.admin1.trim(); subdivisions.municipality = data.admin2.trim(); }
      else if (data.fiscalCountry === 'AR') subdivisions.province = data.admin1.trim();
      else if (data.fiscalCountry === 'ES') { subdivisions.autonomousCommunity = data.admin1.trim(); subdivisions.municipality = data.admin2.trim(); }
      else if (data.admin2.trim()) subdivisions.commune = data.admin2.trim();
      const saved = await attempt(() => ws().saveJurisdictionContext({
        fiscalCountry: data.fiscalCountry, incorporationCountry: data.incorporationCountry, residenceCountry: data.residenceCountry || null,
        operationCountries: data.operationCountries.split(',').map(value => value.trim().toUpperCase()).filter(Boolean),
        subdivisions, locale: data.locale,
        currency: data.currency.toUpperCase(), timeZone: data.timeZone, entityType: data.entityType, taxRegime: data.taxRegime,
        commercialYear: Number(data.commercialYear), lifecycleStage: data.lifecycleStage,
        verificationState: getCountryPack(data.fiscalCountry).capabilities.taxCalculations.enabled ? 'REQUIRES_VERIFICATION' : 'DOCUMENTARY_ONLY'
      }), 'Contexto guardado sin mezclar país e idioma.');
      if (saved) rerender();
    });
  }
};
