/**
 * Utilidades de vista mínimas. No hay framework a propósito: la app viaja
 * dentro de un APK y de un ejecutable, y cada kilobyte se instala en el
 * teléfono de alguien.
 */

/** Escapa texto para insertarlo en HTML. */
export const esc = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Marca un fragmento como HTML ya seguro, para que `html` no lo vuelva a escapar. */
export const raw = value => ({ __raw: String(value) });

/**
 * Plantilla que escapa TODA interpolación por defecto.
 *
 * Los datos de esta app los escribe el usuario (descripciones de gastos, RUT de
 * proveedores, motivos de reapertura) y después se muestran en tablas y en la
 * bitácora. Escapar por defecto —y exigir `raw()` explícito— evita que una
 * descripción con `<` rompa la vista o inyecte marcado.
 */
export const html = (strings, ...values) =>
  strings.reduce((out, chunk, i) => {
    if (i === 0) return chunk;
    const v = values[i - 1];
    let rendered;
    if (v === null || v === undefined || v === false) rendered = '';
    else if (Array.isArray(v)) rendered = v.map(x => (x && x.__raw !== undefined ? x.__raw : esc(x))).join('');
    else if (v && v.__raw !== undefined) rendered = v.__raw;
    else rendered = esc(v);
    return out + rendered + chunk;
  });

/* ------------------------------------------------------------- formato --- */

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

export const fmtCLP = n => clpFormatter.format(Number(n || 0));
export const fmtNumber = n => new Intl.NumberFormat('es-CL').format(Number(n || 0));
export const fmtPercent = n => `${(Number(n || 0) * 100).toLocaleString('es-CL', { maximumFractionDigits: 2 })}%`;

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** `2026-08` → `agosto 2026`. */
export const fmtPeriod = period => {
  if (!/^\d{4}-\d{2}$/.test(String(period))) return String(period ?? '');
  const [y, m] = period.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

/** `2026-08-14` → `14 ago 2026`, sin depender de la zona horaria del equipo. */
export const fmtDate = iso => {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  if (!y || !m || !d) return String(iso);
  return `${Number(d)} ${MONTHS[Number(m) - 1]?.slice(0, 3)} ${y}`;
};

export const fmtDateTime = iso => {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return String(iso);
  return dt.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const currentPeriod = () => new Date().toISOString().slice(0, 7);

/* --------------------------------------------------------------- avisos -- */

let toastHost;

export function toast(message, kind = 'ok') {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toasts';
    toastHost.setAttribute('role', 'status');
    toastHost.setAttribute('aria-live', 'polite');
    document.body.append(toastHost);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.textContent = message;
  toastHost.append(el);
  setTimeout(() => el.remove(), kind === 'err' ? 7000 : 3600);
}

/**
 * Ejecuta una acción y traduce cualquier error a un aviso legible.
 *
 * El motor lanza mensajes pensados para una persona ("Un paso sólo puede
 * marcarse como realizado si registras su evidencia"). Mostrarlos tal cual es
 * mejor que un "Error" genérico: el mensaje ES la explicación de la regla.
 */
export async function attempt(fn, okMessage) {
  try {
    const result = await fn();
    if (okMessage) toast(okMessage, 'ok');
    return result;
  } catch (error) {
    toast(error?.message || 'Ocurrió un error inesperado', 'err');
    return undefined;
  }
}

/* --------------------------------------------------------------- modal --- */

/** Diálogo modal accesible: cierra con Escape, con el fondo y devuelve el <form>. */
export function openModal({ title, body, submitLabel = 'Guardar', onSubmit, wide = false }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = html`
    <div class="modal" role="dialog" aria-modal="true" aria-label="${title}" ${raw(wide ? 'style="width:min(760px,100%)"' : '')}>
      <div class="modal__head">
        <h2>${title}</h2>
        <button class="btn btn--ghost btn--sm" data-close aria-label="Cerrar">✕</button>
      </div>
      <form data-form>
        ${raw(body)}
        <div class="btn__row" style="margin-top:16px;justify-content:flex-end">
          <button type="button" class="btn" data-close>Cancelar</button>
          <button type="submit" class="btn btn--primary">${submitLabel}</button>
        </div>
      </form>
    </div>`;

  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = e => {
    if (e.key === 'Escape') close();
  };

  backdrop.querySelectorAll('[data-close]').forEach(b => (b.onclick = close));
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) close();
  });
  document.addEventListener('keydown', onKey);

  backdrop.querySelector('[data-form]').addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const done = await onSubmit(data, e.target);
    if (done !== false) close();
  });

  document.body.append(backdrop);
  backdrop.querySelector('input, select, textarea')?.focus();
  return { close, root: backdrop };
}

/** Confirmación explícita para acciones que no se pueden deshacer. */
export function confirmAction({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise(resolve => {
    const { close } = openModal({
      title,
      body: html`<p>${message}</p>`,
      submitLabel: confirmLabel,
      onSubmit: () => {
        resolve(true);
        return true;
      }
    });
    const backdrop = document.querySelector('.modal-backdrop:last-of-type');
    if (danger) backdrop.querySelector('button[type="submit"]').classList.add('btn--danger');
    backdrop.querySelectorAll('[data-close]').forEach(b =>
      b.addEventListener('click', () => {
        resolve(false);
        close();
      })
    );
  });
}
