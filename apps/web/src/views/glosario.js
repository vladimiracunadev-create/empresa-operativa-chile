import { html, raw, esc } from '../lib/dom.js';
import { termBody } from '../lib/terms.js';
import { TERMS, termsByCategory, searchTerms } from '../core/glossary/index.mjs';

/**
 * Glosario buscable.
 *
 * Los textos son exactamente los mismos que aparecen en las ayudas
 * contextuales y en `docs/GLOSSARY.md`: los tres salen de
 * `packages/glossary/index.mjs`. Un glosario escrito tres veces se contradice;
 * éste no puede.
 */
export default {
  id: 'glosario',
  label: 'Glosario',
  title: 'Glosario de términos',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M8 7.5h7M8 11h7"/></svg>',

  render() {
    const query = this.query ?? '';
    const found = query ? searchTerms(query) : null;
    const groups = found ? [{ category: `${found.length} resultado(s) para “${query}”`, terms: found }] : termsByCategory();

    return html`
      <div class="page__head">
        <h1>Glosario de términos</h1>
        <p>
          ${TERMS.length} términos con su definición, su base legal cuando la tiene y —lo más importante— con qué NO hay que confundirlos.
          Estas mismas definiciones son las que aparecen al pulsar el signo <strong>?</strong> junto a cualquier campo de la aplicación.
        </p>
      </div>

      <div class="card">
        <label class="field" style="margin:0">
          <span class="field__label">Buscar</span>
          <input type="search" data-search value="${query}" placeholder="capital, patente, CPT, préstamo, oficina virtual…" autocomplete="off">
          <span class="field__hint">La búsqueda ignora tildes y mayúsculas.</span>
        </label>
      </div>

      <div class="note note--info" style="margin-top:14px"><span class="note__icon">i</span>
        <p>Las cinco magnitudes que esta aplicación se niega a tratar como sinónimos:
        <strong>capital social</strong>, <strong>capital enterado</strong>, <strong>patrimonio contable</strong>,
        <strong>capital propio tributario</strong> y <strong>capital base de patente</strong>.
        Cada una tiene su momento, su método de cálculo y su evidencia.</p></div>

      ${raw(
        groups.length === 0 || groups[0].terms.length === 0
          ? '<div class="card"><p class="table__empty">Ningún término coincide con la búsqueda.</p></div>'
          : groups
              .map(
                g => `
        <div class="card" style="margin-top:14px">
          <div class="card__head"><h2>${esc(g.category)}</h2><span class="tag">${g.terms.length}</span></div>
          ${g.terms
            .map(
              t => `<details class="qa" id="termino-${esc(t.id)}">
                  <summary>${esc(t.term)} — <span style="font-weight:400">${esc(t.short)}</span></summary>
                  <div class="qa__body">${termBody(t)}</div>
                </details>`
            )
            .join('')}
        </div>`
              )
              .join('')
      )}

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>De dónde salen estas definiciones</h2></div>
        <p class="card__hint">
          Viven en <code>packages/glossary/index.mjs</code>, que es la única copia. De ahí se generan la ayuda contextual, esta pantalla
          y <code>docs/GLOSSARY.md</code>; CI comprueba que el documento no se desvíe del módulo.
          Las referencias legales apuntan a la norma, no a una interpretación: cuando una situación dependa de antecedentes propios,
          la aplicación lo dice en vez de resolverlo sola.
        </p>
      </div>`;
  },

  mount(root, rerender) {
    const input = root.querySelector('[data-search]');
    if (!input) return;
    // Render completo en cada tecla (es la convención de la app), restaurando
    // foco y cursor para que escribir no se sienta interrumpido.
    input.addEventListener('input', () => {
      this.query = input.value;
      const position = input.selectionStart;
      rerender(true);
      const next = document.querySelector('[data-search]');
      if (next) {
        next.focus();
        next.setSelectionRange(position, position);
      }
    });
  }
};
