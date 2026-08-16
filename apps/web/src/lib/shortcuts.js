/**
 * Ejecuta los atajos declarados en `packages/shortcuts`.
 *
 * Un solo oyente en `document`, registrado una vez al arrancar: la app se
 * redibuja entera en cada cambio, así que enganchar teclas por vista dejaría
 * oyentes huérfanos en cada render.
 *
 * La regla que evita el problema clásico de los atajos —que se disparen mientras
 * escribes— está en `resolveShortcut`: dentro de un campo sólo pasan los que
 * llevan modificador, y `Esc`, que es la salida de emergencia.
 */
import { resolveShortcut, shortcutsByGroup, keysFor } from '../core/shortcuts/index.mjs';
import { openModal, html, raw, esc } from './dom.js';

const isTyping = () => {
  const el = document.activeElement;
  if (!el) return false;
  return el.isContentEditable || ['input', 'textarea', 'select'].includes(el.tagName?.toLowerCase());
};

/** Marca visual de una tecla, para mostrarla junto a un botón o en una tabla. */
export const kbd = keys =>
  keys
    .split(/\s*\+\s*/)
    .map(k => `<kbd>${esc(k)}</kbd>`)
    .join('<span class="kbd__plus">+</span>');

/** Etiqueta de atajo para un botón, o cadena vacía si esa acción no tiene tecla. */
export const kbdFor = action => {
  const keys = keysFor(action);
  return keys ? `<span class="kbd__hint" aria-hidden="true">${kbd(keys)}</span>` : '';
};

/** Diálogo con todos los atajos, agrupados. */
export function openShortcutHelp() {
  const body = shortcutsByGroup()
    .map(
      g => `
      <p style="margin:14px 0 6px"><strong>${esc(g.label)}</strong></p>
      <div class="tablewrap"><table><tbody>
        ${g.shortcuts
          .map(
            s => `<tr>
              <td style="white-space:nowrap">${kbd(s.keys)}</td>
              <td>${esc(s.description)}${s.note ? `<br><span class="card__hint">${esc(s.note)}</span>` : ''}</td>
            </tr>`
          )
          .join('')}
      </tbody></table></div>`
    )
    .join('');

  openModal({
    title: 'Atajos de teclado',
    wide: true,
    body: html`
      <p class="card__hint">
        Pensados sobre todo para la aplicación de escritorio, donde se trabaja con las dos manos.
        En el teléfono no estorban: sin teclado, no se disparan.
      </p>
      ${raw(body)}`,
    submitLabel: 'Entendido',
    onSubmit: () => true
  });
}

/**
 * Buscador de comandos.
 *
 * Es el único atajo que hay que aprender: cubre a todos los de navegación y
 * además encuentra términos del glosario, que es lo que más se busca cuando uno
 * está aprendiendo.
 */
function openPalette({ views, goTo, terms }) {
  const entries = [
    ...views.map(v => ({ kind: 'Pantalla', label: v.label, hint: v.title, run: () => goTo(v.id) })),
    ...terms.map(t => ({
      kind: 'Glosario',
      label: t.term,
      hint: t.short,
      run: () => {
        goTo('glosario');
        // El glosario abre el término desplegado: llegar a la lista y tener que
        // buscarlo otra vez sería llegar a medias.
        setTimeout(() => {
          const el = document.querySelector(`#termino-${CSS.escape(t.id)}`);
          if (el) {
            el.open = true;
            el.scrollIntoView({ block: 'center' });
          }
        }, 60);
      }
    }))
  ];

  const normalize = s =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLocaleLowerCase('es-CL');

  const { close, root } = openModal({
    title: 'Ir a…',
    wide: true,
    body: html`
      <label class="field" style="margin:0">
        <span class="field__label" style="display:none">Buscar</span>
        <input type="search" data-palette placeholder="Pantalla o término: capital, patente, F29, préstamo…" autocomplete="off">
      </label>
      <div data-palette-results class="palette"></div>`,
    submitLabel: 'Abrir',
    onSubmit: () => {
      root.querySelector('.palette__item[aria-selected="true"]')?.click();
      return false;
    }
  });

  const input = root.querySelector('[data-palette]');
  const results = root.querySelector('[data-palette-results]');
  let cursor = 0;

  const render = () => {
    const q = normalize(input.value);
    const found = (q ? entries.filter(e => normalize(`${e.label} ${e.hint}`).includes(q)) : entries).slice(0, 12);
    cursor = Math.min(cursor, Math.max(0, found.length - 1));
    results.innerHTML = found.length
      ? found
          .map(
            (e, i) => `<button type="button" class="palette__item" data-i="${i}" aria-selected="${i === cursor}">
              <span class="palette__kind">${esc(e.kind)}</span>
              <span><strong>${esc(e.label)}</strong><small>${esc(e.hint ?? '')}</small></span>
            </button>`
          )
          .join('')
      : '<p class="table__empty">Sin coincidencias.</p>';

    results.querySelectorAll('.palette__item').forEach(btn =>
      btn.addEventListener('click', () => {
        close();
        found[Number(btn.dataset.i)].run();
      })
    );
  };

  input.addEventListener('input', () => {
    cursor = 0;
    render();
  });
  input.addEventListener('keydown', e => {
    const items = results.querySelectorAll('.palette__item');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      cursor = (cursor + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % Math.max(1, items.length);
      render();
      results.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      items[cursor]?.click();
    }
  });

  render();
}

/**
 * Registra el oyente global.
 *
 * @param {object} ctx
 * @param {Array}  ctx.views      vistas en el orden de la barra lateral
 * @param {Function} ctx.goTo     navega a una vista por id
 * @param {Function} ctx.onAction acciones que dependen del estado (modo, tema, período)
 * @param {Array}  ctx.terms      términos del glosario, para el buscador
 */
export function installShortcuts(ctx) {
  document.addEventListener('keydown', event => {
    const shortcut = resolveShortcut(event, { typing: isTyping() });
    if (!shortcut) return;

    // El diálogo ya gestiona su propio Escape; aquí sólo estorbaría.
    if (shortcut.action === 'close' && document.querySelector('.modal-backdrop')) return;

    switch (shortcut.action) {
      case 'goto-nth': {
        const view = ctx.views[shortcut.index];
        if (!view) return;
        event.preventDefault();
        ctx.goTo(view.id);
        return;
      }
      case 'palette':
        event.preventDefault();
        openPalette(ctx);
        return;
      case 'help':
        event.preventDefault();
        openShortcutHelp();
        return;
      case 'goto-ayuda':
        event.preventDefault();
        ctx.goTo('ayuda');
        return;
      case 'primary': {
        // La acción principal la declara cada vista con `data-primary`; si la
        // pantalla no tiene ninguna, el atajo no hace nada en vez de adivinar.
        const btn = document.querySelector('#main [data-primary]');
        if (!btn) return;
        event.preventDefault();
        btn.click();
        return;
      }
      case 'focus-search': {
        const field = document.querySelector('#main input[type="search"]');
        if (!field) return;
        event.preventDefault();
        field.focus();
        field.select();
        return;
      }
      default:
        event.preventDefault();
        ctx.onAction(shortcut.action);
    }
  });
}
