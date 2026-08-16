/**
 * Arranque y navegación.
 *
 * Render completo en cada cambio: la app maneja decenas —no miles— de filas por
 * período, y a esa escala un re-render entero es instantáneo y elimina toda una
 * clase de errores de sincronización entre vista y datos. Los sitios donde eso
 * sí molesta (los campos de búsqueda) restauran el foco y el cursor a mano.
 */
import { html, raw, fmtPeriod } from './lib/dom.js';
import { state, ws, setMode, setTheme, toggleTheme, ensureSandboxSeeded, selectablePeriods } from './lib/state.js';
import { hydrateFromDisk, PLATFORM_LABEL } from './lib/platform.js';

import empezar from './views/empezar.js';
import panel from './views/panel.js';
import constitucion from './views/constitucion.js';
import empresa from './views/empresa.js';
import capital from './views/capital.js';
import operaciones from './views/operaciones.js';
import impuestos from './views/impuestos.js';
import obligaciones from './views/obligaciones.js';
import cierre from './views/cierre.js';
import auditoria from './views/auditoria.js';
import datos from './views/datos.js';
import academia from './views/academia.js';
import glosario from './views/glosario.js';

export const APP_VERSION = '1.2.0';

const NAV = [
  // "Empezar aquí" va primero y solo: es la única pantalla ordenada por tiempo
  // en vez de por función, y es la respuesta a "no sé por dónde empezar".
  { group: 'Empezar', views: [empezar] },
  { group: 'Operar', views: [panel, operaciones, impuestos, obligaciones, cierre] },
  { group: 'Empresa', views: [constitucion, empresa, capital] },
  { group: 'Control', views: [auditoria, datos] },
  { group: 'Aprender', views: [academia, glosario] }
];

const VIEWS = Object.fromEntries(NAV.flatMap(g => g.views).map(v => [v.id, v]));

// Mismo glifo que el icono de la aplicación (scripts/build-icons.mjs), para que
// la marca de la cabecera y la del lanzador de Android/Windows sean la misma.
const MARK = `<svg class="brand__mark" viewBox="0 0 512 512" aria-hidden="true">
  <defs>
    <linearGradient id="eocBrand" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4f8cff"/><stop offset="1" stop-color="#34d399"/>
    </linearGradient>
    <mask id="eocCut">
      <rect width="512" height="512" fill="#000"/>
      <rect x="143.4" y="97.3" width="225.3" height="51.2" rx="21.5" fill="#fff"/>
      <rect x="148.5" y="143.4" width="215" height="256" rx="19.4" fill="#fff"/>
      <rect x="176.4" y="176.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="245.3" y="176.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="176.4" y="245.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="245.3" y="245.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="230.1" y="332.8" width="51.6" height="66.6" rx="15.5" fill="#000"/>
    </mask>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#eocBrand)"/>
  <g mask="url(#eocCut)"><rect width="512" height="512" fill="#fff"/></g>
</svg>`;

function shell() {
  const periods = selectablePeriods();
  return html`
    <div class="shell">
      <div class="brand">
        ${raw(MARK)}
        <div>
          <div class="brand__name">Empresa Operativa</div>
          <div class="brand__version">v${APP_VERSION} · ${PLATFORM_LABEL}</div>
        </div>
      </div>

      <header class="topbar">
        <div class="modeswitch" role="group" aria-label="Entorno de trabajo">
          <button data-mode="real" aria-pressed="${state.mode === 'real'}">EMPRESA REAL</button>
          <button data-mode="sandbox" aria-pressed="${state.mode === 'sandbox'}">SANDBOX</button>
        </div>
        <div class="btn__row" style="align-items:center">
          <label class="field" style="margin:0">
            <span class="field__label" style="display:none">Período</span>
            <select data-period aria-label="Período de trabajo">
              ${raw(periods.map(p => `<option value="${p}" ${p === state.period ? 'selected' : ''}>${fmtPeriod(p)}</option>`).join(''))}
            </select>
          </label>
          <button class="btn btn--ghost btn--sm" data-theme title="Cambiar entre claro y oscuro" aria-label="Cambiar tema">
            ${state.theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <nav class="sidebar" aria-label="Secciones">
        ${raw(NAV.map(g => `
          <div class="sidebar__group">${g.group}</div>
          ${g.views.map(v => {
            const badge = v.badge?.() ?? 0;
            return `<button class="navitem" data-view="${v.id}" ${v.id === state.view ? 'aria-current="page"' : ''}>
              ${v.icon}<span>${v.label}</span>
              ${badge > 0 ? `<span class="navitem__badge" aria-label="${badge} pendientes">${badge}</span>` : ''}
            </button>`;
          }).join('')}`).join(''))}
      </nav>

      <main class="main" id="main" tabindex="-1"></main>
    </div>`;
}

function modeBar() {
  const w = ws();
  const company = w.getCompany();
  return state.mode === 'real'
    ? html`<div class="modebar modebar--real"><span class="modebar__dot"></span>
        <span><strong>EMPRESA REAL</strong> — ${company?.legalName || 'ficha sin completar'}. Todo lo que registres queda en la bitácora de auditoría.</span></div>`
    : html`<div class="modebar modebar--sandbox"><span class="modebar__dot"></span>
        <span><strong>SANDBOX</strong> — empresa ficticia para practicar. Nada de aquí se copia a la empresa real.</span></div>`;
}

function renderView(keepScroll = false) {
  const view = VIEWS[state.view] ?? panel;
  const main = document.querySelector('#main');
  const scroll = keepScroll ? globalThis.scrollY : 0;

  main.innerHTML = modeBar() + view.render();
  // Las vistas piden un redibujo tras mutar datos; se conserva el scroll para
  // que guardar una fila a mitad de tabla no salte al principio de la página.
  view.mount?.(main, () => render(true));

  main.querySelectorAll('[data-go]').forEach(btn =>
    btn.addEventListener('click', () => goTo(btn.dataset.go))
  );

  document.title = `${view.title} · Empresa Operativa Chile`;
  globalThis.scrollTo({ top: scroll });
}

/** Cambia de vista y refleja el cambio en la URL, para poder enlazarla. */
function goTo(view) {
  state.view = view;
  if (location.hash.replace('#', '') !== view) {
    history.replaceState(null, '', `#${view}`);
  }
  render();
}

/** Redibuja el shell completo (para que las insignias de navegación se actualicen). */
export function render(keepScroll = false) {
  const app = document.querySelector('#app');
  app.innerHTML = shell();

  app.querySelectorAll('[data-view]').forEach(btn =>
    btn.addEventListener('click', () => goTo(btn.dataset.view))
  );

  app.querySelectorAll('[data-mode]').forEach(btn =>
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      render();
    })
  );

  app.querySelector('[data-period]')?.addEventListener('change', e => {
    state.period = e.target.value;
    render(true);
  });

  app.querySelector('[data-theme]')?.addEventListener('click', () => {
    toggleTheme();
    render(true);
  });

  renderView(keepScroll);
}

/**
 * Estado inicial desde la URL.
 *
 * `#impuestos` abre directamente esa vista: es lo que hace que funcionen los
 * accesos directos del manifiesto PWA (mantener pulsado el icono en Android) y
 * lo que permite enlazar a una pantalla concreta desde la documentación.
 * `?modo=sandbox` y `?tema=claro` existen para que las capturas del manual se
 * generen de forma reproducible, sin depender del estado guardado.
 */
function applyUrlState() {
  const params = new URLSearchParams(location.search);
  if (params.get('modo')) setMode(params.get('modo'));
  if (params.get('tema')) setTheme(params.get('tema') === 'claro' ? 'light' : 'dark');
  if (params.get('periodo')) state.period = params.get('periodo');

  const hash = location.hash.replace('#', '');
  if (hash && VIEWS[hash]) state.view = hash;
}

async function boot() {
  setTheme(state.theme);
  await hydrateFromDisk();
  ensureSandboxSeeded();
  applyUrlState();
  render();

  globalThis.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '');
    if (hash && VIEWS[hash] && hash !== state.view) {
      state.view = hash;
      render();
    }
  });

  // Atajos de teclado: en escritorio se navega mucho más rápido así.
  document.addEventListener('keydown', e => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const all = NAV.flatMap(g => g.views);
      const index = Number(e.key) - 1;
      if (index >= 0 && index < all.length) {
        e.preventDefault();
        goTo(all[index].id);
      }
    }
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* Sin service worker la app sigue funcionando; sólo pierde el modo offline del navegador. */
    });
  }
}

boot();
