/**
 * Capa de plataforma.
 *
 * La misma app corre en tres sitios y sólo aquí se nota la diferencia:
 *
 *   navegador / PWA  → localStorage
 *   Android (APK)    → localStorage de la WebView (queda en el sandbox de la app)
 *   Windows (Tauri)  → localStorage + espejo en archivos JSON reales del disco
 *
 * El espejo de Windows existe porque en el escritorio la gente espera que sus
 * datos sean archivos que pueda copiar, respaldar y ver. `localStorage` sigue
 * siendo la fuente que lee la UI (es síncrono, y el motor contable no es async),
 * y el disco recibe una copia tras cada escritura.
 */
import { createWebStore } from '../core/company-operations/store.mjs';

const tauri = () => globalThis.__TAURI__?.core;

export const PLATFORM = (() => {
  if (tauri()) return 'windows';
  if (globalThis.Capacitor?.isNativePlatform?.()) return 'android';
  return 'web';
})();

export const PLATFORM_LABEL = { windows: 'Windows', android: 'Android', web: 'Navegador' }[PLATFORM];

const NS = mode => `empresa-operativa-chile:${mode}`;

/**
 * Almacén de un modo, con espejo a disco cuando la plataforma lo permite.
 * El espejo es "best effort": si el disco falla, la app sigue funcionando con
 * localStorage y avisa por consola. Perder la sesión por un error de escritura
 * sería peor que perder el espejo.
 */
export function createPlatformStore(mode) {
  const base = createWebStore({ namespace: NS(mode) });
  const invoke = tauri()?.invoke;
  if (!invoke) return base;

  let pending = null;
  const mirror = () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      const dump = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`${NS(mode)}:`)) dump[key] = localStorage.getItem(key);
      }
      invoke('save_workspace', { mode, payload: JSON.stringify(dump) }).catch(err =>
        console.warn('No se pudo escribir el espejo en disco:', err)
      );
    }, 180);
  };

  return {
    ...base,
    write: (key, value) => {
      base.write(key, value);
      mirror();
    },
    append: (key, row) => {
      base.append(key, row);
      mirror();
    },
    saveSnapshot: (name, data) => {
      const location = base.saveSnapshot(name, data);
      mirror();
      return location;
    }
  };
}

/**
 * Hidrata `localStorage` desde el disco al arrancar en Windows.
 * Sólo se ejecuta una vez, antes de montar la UI.
 */
export async function hydrateFromDisk() {
  const invoke = tauri()?.invoke;
  if (!invoke) return { hydrated: false };
  try {
    let restored = 0;
    for (const mode of ['real', 'sandbox']) {
      const payload = await invoke('load_workspace', { mode });
      if (!payload) continue;
      const dump = JSON.parse(payload);
      for (const [key, value] of Object.entries(dump)) {
        // El disco sólo repone lo que falta: si la WebView ya tiene el dato,
        // gana el dato vivo. Así no se pisa una sesión en curso con un espejo
        // viejo por una carrera al arrancar.
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, value);
          restored++;
        }
      }
    }
    return { hydrated: true, restored };
  } catch (error) {
    console.warn('No se pudo leer el espejo del disco:', error);
    return { hydrated: false, error };
  }
}

/**
 * Entrega un archivo al usuario.
 * En Windows abre un diálogo nativo de guardado; en web y Android descarga.
 */
export async function saveTextFile(filename, contents, mime = 'application/json') {
  const invoke = tauri()?.invoke;
  if (invoke) {
    const path = await invoke('export_file', { filename, contents });
    return path ? { saved: true, where: path } : { saved: false };
  }
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { saved: true, where: filename };
}

/** Pide un archivo de texto al usuario y devuelve su contenido. */
export function pickTextFile(accept = 'application/json,.json') {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, text: String(reader.result) });
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

/** Abre un enlace externo sin dejar la app atrapada dentro de la WebView. */
export function openExternal(url) {
  if (PLATFORM === 'android' && globalThis.Capacitor?.Plugins?.Browser) {
    globalThis.Capacitor.Plugins.Browser.open({ url });
    return;
  }
  globalThis.open(url, '_blank', 'noopener,noreferrer');
}
