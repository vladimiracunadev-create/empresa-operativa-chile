import { html, raw, esc } from '../lib/dom.js';
import { openExternal, PLATFORM } from '../lib/platform.js';
import { kbd, openShortcutHelp } from '../lib/shortcuts.js';
import { shortcutsByGroup } from '../core/shortcuts/index.mjs';
import { TERMS } from '../core/glossary/index.mjs';
import { STAGES } from '../core/onboarding/index.mjs';

/**
 * Ayuda: los manuales, dentro de la aplicación.
 *
 * Un manual que vive sólo en el repositorio no lo lee nadie mientras opera —hay
 * que salir de la app, buscarlo y volver—. Aquí los dos documentos se leen en un
 * marco del mismo origen: viajan en el bundle, así que funcionan sin conexión
 * igual en el navegador, en Android y en Windows.
 */

const DOCS = [
  {
    id: 'guia',
    label: 'Empezar aquí',
    icon: '🧭',
    file: 'EMPEZAR-AQUI.html',
    pdf: 'EMPEZAR-AQUI.pdf',
    hint: 'Para quien nunca ha creado una empresa. La ruta completa ordenada por tiempo, con diagramas y la pantalla donde se hace cada cosa.'
  },
  {
    id: 'manual',
    label: 'Manual de usuario',
    icon: '📘',
    file: 'MANUAL.html',
    pdf: null,
    hint: 'El detalle de cada pantalla: qué hace cada botón, cada campo y cada aviso. Para cuando ya sabes qué quieres hacer.'
  }
];

export default {
  id: 'ayuda',
  label: 'Ayuda',
  title: 'Ayuda y manuales',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4"/><path d="M12 17.2h.01"/></svg>',

  render() {
    const abierto = this.abierto ?? null;
    const doc = DOCS.find(d => d.id === abierto);

    return html`
      <div class="page__head">
        <h1>Ayuda y manuales</h1>
        <p>
          Los dos documentos del producto, leíbles <strong>dentro</strong> de la aplicación y sin conexión:
          viajan en el mismo paquete que instalaste. Abajo, los atajos de teclado.
        </p>
      </div>

      <div class="grid grid--2">
        ${raw(
          DOCS.map(
            d => `
          <div class="card">
            <div class="card__head"><h2>${d.icon} ${esc(d.label)}</h2>${abierto === d.id ? '<span class="tag tag--ok">abierto</span>' : ''}</div>
            <p class="card__hint">${esc(d.hint)}</p>
            <div class="btn__row" style="margin-top:12px">
              <button class="btn btn--sm ${abierto === d.id ? '' : 'btn--primary'}" data-doc="${d.id}">
                ${abierto === d.id ? 'Cerrar' : 'Leer aquí'}
              </button>
              <button class="btn btn--sm btn--ghost" data-doc-nueva="${d.id}">Otra ventana</button>
              ${d.pdf ? `<a class="btn btn--sm" href="./ayuda/${d.pdf}" download>PDF</a>` : ''}
            </div>
            ${
              d.pdf
                ? ''
                : `<p class="card__hint" style="margin-top:8px">El PDF del manual (7,7 MB) no viaja dentro de la aplicación para no engordar la instalación: está en el repositorio y en cada release.</p>`
            }
          </div>`
          ).join('')
        )}
      </div>

      ${doc
        ? raw(
            `<div class="card" style="margin-top:14px">
              <div class="card__head"><h2>${doc.icon} ${esc(doc.label)}</h2>
                <button class="btn btn--ghost btn--sm" data-doc="${doc.id}">Cerrar</button></div>
              <iframe class="guiaframe" src="./ayuda/${doc.file}" title="${esc(doc.label)}" loading="lazy"></iframe>
            </div>`
          )
        : ''}

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>🎤 Presentar el producto</h2><span class="tag">8 diapositivas · ≈28 min</span></div>
        <p class="card__hint">
          Para mostrar esto en una clase, un comité o una reunión con un contador. Las diapositivas se abren
          <strong>en otra ventana</strong>, no aquí dentro: están compuestas a pantalla completa para proyectar.
          La <strong>pauta del expositor</strong> lleva el guion hablado y el tiempo de cada lámina, para llevarla
          impresa o en un segundo monitor. Las tres viajan en el paquete: funcionan sin conexión.
        </p>
        <div class="btn__row" style="margin-top:12px">
          <button class="btn btn--sm btn--primary" data-deck="presentacion.html">Proyectar</button>
          <a class="btn btn--sm" href="./presentacion/PRESENTACION.pdf" download>Diapositivas (PDF)</a>
          <a class="btn btn--sm btn--ghost" href="./presentacion/PAUTA.pdf" download>Pauta del expositor</a>
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Atajos de teclado</h2>
          <span class="tag">${PLATFORM === 'android' ? 'con teclado externo' : PLATFORM === 'windows' ? 'escritorio' : 'navegador'}</span></div>
        <p class="card__hint">
          Pensados sobre todo para la versión de escritorio, donde la aplicación se usa sentado y durante un rato largo.
          En el teléfono no estorban: sin teclado, no se disparan. Puedes abrir esta lista en cualquier momento con ${raw(kbd('F1'))}.
        </p>
        ${raw(
          shortcutsByGroup()
            .map(
              g => `
          <p style="margin:16px 0 6px"><strong>${esc(g.label)}</strong></p>
          <div class="tablewrap"><table><tbody>
            ${g.shortcuts
              .map(
                s => `<tr>
                  <td style="white-space:nowrap;width:150px">${kbd(s.keys)}</td>
                  <td>${esc(s.description)}${s.note ? `<br><span class="card__hint">${esc(s.note)}</span>` : ''}</td>
                </tr>`
              )
              .join('')}
          </tbody></table></div>`
            )
            .join('')
        )}
        <div class="note note--info" style="margin-top:12px"><span class="note__icon">i</span>
          <p>La lista sale de <code>packages/shortcuts</code>, el mismo sitio del que se genera
          <code>docs/ATAJOS-DE-TECLADO.md</code>. Si un atajo cambia, cambian los dos a la vez.</p></div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card__head"><h2>Dónde seguir</h2></div>
        <div class="tablewrap"><table>
          <tbody>
            <tr><td><strong>No sé por dónde empezar</strong></td>
              <td>${STAGES.length} etapas, de antes de existir al segundo ejercicio</td>
              <td style="text-align:right"><button class="btn btn--sm" data-go="empezar">Empezar aquí</button></td></tr>
            <tr><td><strong>Qué significa esta palabra</strong></td>
              <td>${TERMS.length} términos con lo que NO hay que confundirlos</td>
              <td style="text-align:right"><button class="btn btn--sm" data-go="glosario">Glosario</button></td></tr>
            <tr><td><strong>Por qué se calcula así</strong></td>
              <td>Las mismas reglas del motor, explicadas con ejemplos</td>
              <td style="text-align:right"><button class="btn btn--sm" data-go="academia">Academia</button></td></tr>
            <tr><td><strong>Qué cambió y con qué reglas</strong></td>
              <td>Bitácora de auditoría y reglas del año con su fuente</td>
              <td style="text-align:right"><button class="btn btn--sm" data-go="auditoria">Auditoría</button></td></tr>
          </tbody>
        </table></div>
      </div>

      <div class="card">
        <div class="card__head"><h2>Qué NO hace esta aplicación</h2></div>
        <div class="note note--warn"><span class="note__icon">!</span>
          <p>No presenta ni paga nada ante el SII ni ante ninguna municipalidad, no está conectada a ningún sistema oficial
          y no es asesoría tributaria. Calcula, explica de dónde salió cada número y guarda evidencia; los trámites los haces
          tú en los portales oficiales. Cuando la aplicación y la fuente oficial no coincidan, <strong>manda la fuente oficial</strong>.</p></div>
      </div>`;
  },

  mount(root, rerender) {
    root.querySelectorAll('[data-doc]').forEach(btn =>
      btn.addEventListener('click', () => {
        this.abierto = this.abierto === btn.dataset.doc ? null : btn.dataset.doc;
        rerender(true);
      })
    );

    root.querySelectorAll('[data-doc-nueva]').forEach(btn =>
      btn.addEventListener('click', () => {
        const doc = DOCS.find(d => d.id === btn.dataset.docNueva);
        openExternal(new URL(`./ayuda/${doc.file}`, location.href).href);
      })
    );

    // Las diapositivas se abren fuera: llevan un script en línea que las ajusta al
    // alto de la lámina y la política de seguridad de la app lo bloquearía dentro
    // de un marco, dejando la última línea de cada lámina cortada.
    root.querySelector('[data-deck]')?.addEventListener('click', e =>
      openExternal(new URL(`./presentacion/${e.currentTarget.dataset.deck}`, location.href).href)
    );

    root.querySelector('[data-atajos]')?.addEventListener('click', openShortcutHelp);
  }
};
