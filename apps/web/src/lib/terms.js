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
  return `<button type="button" class="termchip" data-term="${esc(id)}" aria-label="Qué significa ${esc(t.term)}">?</button>`;
}

/** Rótulo + marca de ayuda, para usar dentro de `raw()`. */
export function labelWithTerm(label, id) {
  return `${esc(label)} ${termChip(id)}`;
}

/**
 * Palabra del texto que explica qué es al pasar el cursor por encima.
 *
 * Distinto de `termChip`: aquí no hay un signo aparte, se subraya la palabra
 * misma. Sirve dentro de una frase, donde un `?` interrumpiría la lectura.
 */
export function termWord(id, label) {
  const t = term(id);
  if (!t) return esc(label ?? id);
  return `<button type="button" class="termword" data-term="${esc(id)}" aria-label="Qué significa ${esc(t.term)}">${esc(label ?? t.term)}</button>`;
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

/* ------------------------------------------------------------- tooltip --- */

/**
 * Un único globo de ayuda, colocado por JavaScript sobre `document.body`.
 *
 * Se hizo así y no con CSS puro por una razón concreta: la mitad de las marcas
 * viven dentro de tablas, y `.tablewrap` tiene `overflow-x: auto` — un globo
 * posicionado dentro quedaría recortado. Colgándolo del `body` con posición
 * fija se sale de cualquier contenedor y además se puede voltear cuando no cabe
 * arriba.
 */
let tip;

function ensureTip() {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.className = 'termtip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);
  return tip;
}

function showTip(anchor, t) {
  const el = ensureTip();
  el.innerHTML = `<strong>${esc(t.term)}</strong><span>${esc(t.short)}</span><em>Pulsa para la definición completa</em>`;
  el.hidden = false;

  const box = anchor.getBoundingClientRect();
  const size = el.getBoundingClientRect();
  const margin = 8;

  let left = box.left + box.width / 2 - size.width / 2;
  left = Math.max(margin, Math.min(left, globalThis.innerWidth - size.width - margin));

  // Debajo si cabe; si no, encima. Un globo que se sale de la pantalla no
  // explica nada.
  const below = box.bottom + margin;
  const top = below + size.height < globalThis.innerHeight ? below : box.top - size.height - margin;

  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(Math.max(margin, top))}px`;
}

function hideTip() {
  if (tip) tip.hidden = true;
}

/**
 * Conecta todas las marcas de ayuda de un contenedor.
 *
 * Al pasar el cursor (o al tabular hasta ella) muestra qué es en una línea; al
 * pulsar, la definición completa con aquello con lo que NO hay que confundirla.
 * Se llama desde el `mount()` de cada vista que use `termChip()` o `termWord()`.
 */
export function mountTerms(root) {
  root.querySelectorAll('[data-term]').forEach(btn => {
    const t = term(btn.dataset.term);
    if (!t) return;

    btn.addEventListener('mouseenter', () => showTip(btn, t));
    btn.addEventListener('focus', () => showTip(btn, t));
    btn.addEventListener('mouseleave', hideTip);
    btn.addEventListener('blur', hideTip);

    btn.addEventListener('click', e => {
      e.preventDefault();
      hideTip();
      openModal({
        title: t.term,
        body: html`${raw(termBody(t))}`,
        submitLabel: 'Entendido',
        onSubmit: () => true
      });
    });
  });

  // Al redibujar la vista el ancla desaparece pero el globo seguiría flotando.
  hideTip();
}
