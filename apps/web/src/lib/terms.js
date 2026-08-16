/**
 * Ayudas contextuales apoyadas en el glosario.
 *
 * El glosario no es una página aparte a la que nadie entra: es la misma
 * definición, mostrada donde aparece la palabra. `termChip()` deja un botón
 * junto a un rótulo y `mountTerms()` lo conecta a un modal. Como el texto sale
 * de `packages/glossary`, corregir una definición la corrige en todas partes.
 */
import { html, raw, openModal, esc } from './dom.js';
import { term } from '../core/glossary/index.mjs';

/**
 * Marca visual junto a un rótulo. Devuelve HTML ya seguro.
 * @param {string} id id del término en el glosario
 */
export function termChip(id) {
  const t = term(id);
  if (!t) return '';
  return `<button type="button" class="termchip" data-term="${esc(id)}" title="Qué significa: ${esc(t.term)}" aria-label="Qué significa ${esc(t.term)}">?</button>`;
}

/** Rótulo + marca de ayuda, para usar dentro de `raw()`. */
export function labelWithTerm(label, id) {
  return `${esc(label)} ${termChip(id)}`;
}

/** Cuerpo explicativo de un término, reutilizado por el modal y por la vista Glosario. */
export function termBody(t) {
  const list = (title, ids, kind) => {
    if (!ids?.length) return '';
    const items = ids
      .map(id => term(id))
      .filter(Boolean)
      .map(x => `<li><strong>${esc(x.term)}</strong> — ${esc(x.short)}</li>`)
      .join('');
    return `<div class="note note--${kind}" style="margin-top:10px"><span class="note__icon">${kind === 'warn' ? '!' : 'i'}</span>
      <div><p style="margin-bottom:6px"><strong>${esc(title)}</strong></p><ul class="termlist">${items}</ul></div></div>`;
  };

  return `
    <p>${esc(t.long)}</p>
    ${list('No confundir con', t.notToConfuseWith, 'warn')}
    ${list('Relacionado', t.related, 'info')}
    ${
      t.legalReference
        ? `<p class="card__hint" style="margin-top:10px">Base legal: ${esc(t.legalReference)}${
            t.lastVerified ? ` · verificado el ${esc(t.lastVerified)}` : ''
          }</p>`
        : ''
    }`;
}

/**
 * Conecta todas las marcas de ayuda de un contenedor.
 * Se llama desde el `mount()` de cada vista que use `termChip()`.
 */
export function mountTerms(root) {
  root.querySelectorAll('[data-term]').forEach(btn =>
    btn.addEventListener('click', e => {
      e.preventDefault();
      const t = term(btn.dataset.term);
      if (!t) return;
      openModal({
        title: t.term,
        body: html`${raw(termBody(t))}`,
        submitLabel: 'Entendido',
        onSubmit: () => true
      });
    })
  );
}
