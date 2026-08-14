import { html, raw, fmtCLP, fmtDateTime, toast, confirmAction, attempt } from '../lib/dom.js';
import { state, ws } from '../lib/state.js';
import { saveTextFile, pickTextFile, PLATFORM, PLATFORM_LABEL } from '../lib/platform.js';

const csvEscape = value => {
  const s = String(value ?? '');
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export default {
  id: 'datos',
  label: 'Datos',
  title: 'Datos y respaldos',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',

  render() {
    const w = ws();
    const txs = w.listTransactions();
    const backups = w.listBackups();
    const audit = w.listAudit();

    return html`
      <div class="page__head">
        <h1>Datos y respaldos</h1>
        <p>Tus datos viven en este dispositivo y no se envían a ningún servidor. Eso también significa que <strong>el respaldo es tu responsabilidad</strong>.</p>
      </div>

      <div class="note note--warn">
        <span class="note__icon">!</span>
        <p>Si borras los datos del navegador o desinstalas la aplicación sin exportar, la información se pierde. Exporta un respaldo cada vez que cierres un período.</p>
      </div>

      <div class="grid" style="margin-top:14px">
        <div class="kpi"><div class="kpi__label">Operaciones</div><div class="kpi__value">${txs.length}</div>
          <div class="kpi__foot">En el entorno ${state.mode === 'real' ? 'real' : 'sandbox'}</div></div>
        <div class="kpi"><div class="kpi__label">Eventos auditados</div><div class="kpi__value">${audit.length}</div>
          <div class="kpi__foot">Bitácora completa</div></div>
        <div class="kpi"><div class="kpi__label">Respaldos locales</div><div class="kpi__value">${backups.length}</div>
          <div class="kpi__foot">Guardados dentro de la app</div></div>
        <div class="kpi"><div class="kpi__label">Plataforma</div><div class="kpi__value" style="font-size:1.1rem">${PLATFORM_LABEL}</div>
          <div class="kpi__foot">${PLATFORM === 'windows' ? 'Con espejo en archivos del disco' : 'Almacenamiento local del dispositivo'}</div></div>
      </div>

      <div class="grid grid--2" style="margin-top:14px">
        <div class="card">
          <div class="card__head"><h2>Exportar</h2></div>
          <p class="card__hint">El respaldo completo incluye ficha, constitución, operaciones, obligaciones, cierres y bitácora. Es el archivo que puedes llevarte a otro dispositivo.</p>
          <div class="btn__row" style="margin-top:12px">
            <button class="btn btn--primary" data-export-json>Respaldo completo (JSON)</button>
            <button class="btn" data-export-csv>Operaciones (CSV)</button>
            <button class="btn" data-export-audit>Bitácora (CSV)</button>
          </div>
        </div>

        <div class="card">
          <div class="card__head"><h2>Importar</h2></div>
          <p class="card__hint">Restaura un respaldo exportado desde esta misma aplicación, en cualquier plataforma. El archivo se valida antes de tocar nada.</p>
          <div class="btn__row" style="margin-top:12px">
            <button class="btn" data-import-merge>Fusionar operaciones</button>
            <button class="btn btn--danger" data-import-replace>Reemplazar todo</button>
          </div>
          <p class="card__hint" style="margin-top:10px">
            <strong>Fusionar</strong> agrega lo que falte sin tocar lo existente.
            <strong>Reemplazar</strong> descarta el contenido actual del entorno ${state.mode}.
          </p>
        </div>

        <div class="card">
          <div class="card__head"><h2>Respaldos internos</h2></div>
          <p class="card__hint">Copias hechas desde “Cierre mensual”. Viven dentro de la app: no reemplazan a un archivo exportado fuera del dispositivo.</p>
          <div class="tablewrap" style="margin-top:8px">
            <table>
              <tbody>
                ${backups.length === 0
                  ? raw('<tr><td class="table__empty">Todavía no hay respaldos internos.</td></tr>')
                  : raw(backups.slice().reverse().slice(0, 12).map(b => html`<tr><td><code>${b}</code></td></tr>`).join(''))}
              </tbody>
            </table>
          </div>
          <div class="btn__row" style="margin-top:12px"><button class="btn btn--sm" data-backup>Crear respaldo interno</button></div>
        </div>

        <div class="card">
          <div class="card__head"><h2>Privacidad</h2></div>
          <p class="card__hint">
            Esta aplicación no tiene servidor, no tiene cuentas y no envía telemetría. No se conecta a ningún sistema del SII ni a ningún banco:
            los enlaces a portales oficiales abren el navegador, y ahí eres tú quien se autentica.
          </p>
          ${state.mode === 'sandbox'
            ? raw(html`<div class="note note--ok" style="margin-top:10px"><span class="note__icon">✓</span>
                <p>Estás en <strong>SANDBOX</strong>: estos datos son sintéticos y puedes borrarlos sin consecuencias.</p></div>`)
            : raw(html`<div class="note note--warn" style="margin-top:10px"><span class="note__icon">!</span>
                <p>Estás en <strong>EMPRESA REAL</strong>: exporta antes de cualquier operación destructiva.</p></div>`)}
          <div class="btn__row" style="margin-top:12px">
            <button class="btn btn--danger" data-wipe>Borrar todo este entorno</button>
          </div>
        </div>
      </div>`;
  },

  mount(root, rerender) {
    const w = ws();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const prefix = `empresa-operativa-${state.mode}-${stamp}`;

    const deliver = async (name, contents, mime) => {
      const r = await saveTextFile(name, contents, mime);
      toast(r.saved ? `Archivo generado: ${r.where}` : 'Exportación cancelada', r.saved ? 'ok' : 'err');
    };

    root.querySelector('[data-export-json]')?.addEventListener('click', () =>
      deliver(`${prefix}.json`, JSON.stringify(w.exportAll(), null, 2))
    );

    root.querySelector('[data-export-csv]')?.addEventListener('click', () => {
      const head = ['fecha', 'tipo', 'descripcion', 'documento', 'folio', 'rut_contraparte', 'neto', 'iva', 'total', 'iva_con_derecho', 'deducible', 'pagado'];
      // Delimitador `;`: es lo que Excel en configuración regional chilena espera.
      const body = w
        .listTransactions()
        .map(t => [t.date, t.kind, t.description, t.documentType ?? '', t.documentNumber ?? '', t.counterpartyRut ?? '', t.net, t.vat, t.total, t.vatCreditEligible ? 'si' : 'no', t.deductible ? 'si' : 'no', t.paid ? 'si' : 'no'].map(csvEscape).join(';'));
      deliver(`${prefix}-operaciones.csv`, ['﻿' + head.join(';'), ...body].join('\r\n'), 'text/csv');
    });

    root.querySelector('[data-export-audit]')?.addEventListener('click', () => {
      const head = ['fecha', 'entorno', 'accion', 'detalle'];
      const body = w.listAudit().map(r => [r.at, r.mode, r.action, JSON.stringify(r.detail)].map(csvEscape).join(';'));
      deliver(`${prefix}-bitacora.csv`, ['﻿' + head.join(';'), ...body].join('\r\n'), 'text/csv');
    });

    root.querySelector('[data-backup]')?.addEventListener('click', async () => {
      if (await attempt(() => w.backup(), 'Respaldo interno creado')) rerender();
    });

    const doImport = async replace => {
      const file = await pickTextFile();
      if (!file) return;
      let payload;
      try {
        payload = JSON.parse(file.text);
      } catch {
        return toast('El archivo no es un JSON válido', 'err');
      }
      if (replace) {
        const yes = await confirmAction({
          title: 'Reemplazar todo el entorno',
          message: `Se descartará TODO el contenido actual de ${state.mode === 'real' ? 'EMPRESA REAL' : 'SANDBOX'} y quedará el del archivo “${file.name}”. Esta acción no se puede deshacer.`,
          confirmLabel: 'Reemplazar',
          danger: true
        });
        if (!yes) return;
      }
      if (await attempt(() => w.importAll(payload, { replace }), 'Respaldo importado')) rerender();
    };

    root.querySelector('[data-import-merge]')?.addEventListener('click', () => doImport(false));
    root.querySelector('[data-import-replace]')?.addEventListener('click', () => doImport(true));

    root.querySelector('[data-wipe]')?.addEventListener('click', async () => {
      const yes = await confirmAction({
        title: 'Borrar todo este entorno',
        message: `Se eliminarán ${w.listTransactions().length} operación(es), la ficha, las obligaciones, los cierres y la bitácora de ${state.mode === 'real' ? 'EMPRESA REAL' : 'SANDBOX'}. Exporta un respaldo antes si tienes la menor duda.`,
        confirmLabel: 'Borrar definitivamente',
        danger: true
      });
      if (!yes) return;
      // Se reutiliza la ruta de importación con una carga vacía en vez de
      // manipular el almacén a mano: así el borrado también queda auditado.
      await attempt(
        () =>
          w.importAll(
            { format: 'empresa-operativa-chile/backup', formatVersion: 1, company: null, formation: [], transactions: [], obligations: [], closedPeriods: [], periodCloses: [] },
            { replace: true }
          ),
        'Entorno vaciado'
      );
      rerender();
    });
  }
};
