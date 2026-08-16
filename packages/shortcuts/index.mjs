/**
 * Atajos de teclado, declarados una vez.
 *
 * Existen sobre todo por la versión de escritorio: en Windows la aplicación se
 * usa sentado, con las dos manos y durante un rato largo —cerrando un mes,
 * revisando un cierre anual— y ahí levantar la mano al ratón para cambiar de
 * pantalla cuesta más de lo que parece. En el teléfono no estorban: no hay
 * teclado, así que simplemente no se disparan.
 *
 * Este módulo es DATOS: qué tecla, en qué contexto, qué hace y cómo se llama.
 * Quien los ejecuta es `apps/web/src/lib/shortcuts.js`, y quien los documenta es
 * `scripts/build-shortcuts.mjs`, que genera `docs/ATAJOS-DE-TECLADO.md`. Los
 * tres leen de aquí, así que la ayuda que muestra la app y la que dice el
 * documento no pueden decir cosas distintas.
 *
 * Módulo puro: sin `node:*` y sin DOM.
 */

export const SHORTCUT_GROUPS = Object.freeze([
  { id: 'navegar', label: 'Moverse por la aplicación' },
  { id: 'acciones', label: 'Acciones' },
  { id: 'contexto', label: 'Dentro de una pantalla' }
]);

/**
 * Cada atajo declara:
 *   `keys`        combinación, ya escrita como se muestra
 *   `match`       cómo reconocerla: `{ key, alt, ctrl, shift }` (`key` en minúscula)
 *   `action`      identificador que ejecuta la capa de UI
 *   `description` qué hace, en una frase
 *   `note`        advertencia cuando el sistema operativo o el navegador interfiere
 */
export const SHORTCUTS = Object.freeze([
  /* ------------------------------------------------------------ navegar -- */
  {
    id: 'palette',
    group: 'navegar',
    keys: 'Ctrl + K',
    match: { key: 'k', ctrl: true },
    action: 'palette',
    description: 'Abre el buscador: escribe y salta a cualquier pantalla o término del glosario.',
    note: 'Es el atajo que conviene aprender primero: reemplaza a todos los demás de navegación.'
  },
  {
    id: 'view-n',
    group: 'navegar',
    keys: 'Alt + 1 … 9',
    match: { digits: true, alt: true },
    action: 'goto-nth',
    description: 'Va directo a la pantalla número N de la barra lateral.'
  },
  {
    id: 'help',
    group: 'navegar',
    keys: 'F1',
    match: { key: 'f1' },
    action: 'help',
    description: 'Muestra esta lista de atajos sin salir de donde estás.'
  },
  {
    id: 'help-alt',
    group: 'navegar',
    keys: 'Alt + H',
    match: { key: 'h', alt: true },
    action: 'help',
    description: 'Lo mismo que F1, para teclados donde F1 está tomada por el sistema.'
  },
  {
    id: 'guide',
    group: 'navegar',
    keys: 'Alt + A',
    match: { key: 'a', alt: true },
    action: 'goto-ayuda',
    description: 'Abre Ayuda: la guía ilustrada y el manual, dentro de la aplicación.'
  },

  /* ----------------------------------------------------------- acciones -- */
  {
    id: 'mode',
    group: 'acciones',
    keys: 'Alt + M',
    match: { key: 'm', alt: true },
    action: 'toggle-mode',
    description: 'Cambia entre EMPRESA REAL y SANDBOX.',
    note: 'El cambio se ve en la franja de color de arriba; los datos de cada entorno nunca se mezclan.'
  },
  {
    id: 'theme',
    group: 'acciones',
    keys: 'Alt + T',
    match: { key: 't', alt: true },
    action: 'toggle-theme',
    description: 'Cambia entre tema claro y oscuro.'
  },
  {
    id: 'period-prev',
    group: 'acciones',
    keys: 'Alt + ←',
    match: { key: 'arrowleft', alt: true },
    action: 'period-prev',
    description: 'Retrocede al período anterior con movimiento.'
  },
  {
    id: 'period-next',
    group: 'acciones',
    keys: 'Alt + →',
    match: { key: 'arrowright', alt: true },
    action: 'period-next',
    description: 'Avanza al período siguiente.'
  },

  /* ---------------------------------------------------------- contexto --- */
  {
    id: 'primary',
    group: 'contexto',
    keys: 'Alt + N',
    match: { key: 'n', alt: true },
    action: 'primary',
    description: 'Ejecuta la acción principal de la pantalla: registrar una operación, un movimiento de capital, una obligación.',
    note: 'Sólo funciona en las pantallas que tienen una acción principal evidente.'
  },
  {
    id: 'search',
    group: 'contexto',
    keys: '/',
    match: { key: '/' },
    action: 'focus-search',
    description: 'Pone el cursor en el buscador de la pantalla, si lo tiene.',
    note: 'No se dispara mientras escribes en un campo: ahí la barra es una barra.'
  },
  {
    id: 'close',
    group: 'contexto',
    keys: 'Esc',
    match: { key: 'escape' },
    action: 'close',
    description: 'Cierra el diálogo, el buscador o el panel abierto.'
  }
]);

const BY_ACTION = new Map(SHORTCUTS.map(s => [s.action, s]));

/** Atajos de un grupo, en el orden declarado. */
export function shortcutsOf(groupId) {
  return SHORTCUTS.filter(s => s.group === groupId);
}

/** Agrupados, saltando los grupos vacíos. */
export function shortcutsByGroup() {
  return SHORTCUT_GROUPS.map(g => ({ ...g, shortcuts: shortcutsOf(g.id) })).filter(g => g.shortcuts.length > 0);
}

/** Las teclas declaradas para una acción, para mostrarlas junto a un botón. */
export function keysFor(action) {
  return BY_ACTION.get(action)?.keys ?? null;
}

/**
 * Resuelve un evento de teclado a una acción, o `null`.
 *
 * `typing` lo decide quien llama: dentro de un campo de texto sólo pasan los
 * atajos con modificador, porque si no, escribir "no" en una descripción abriría
 * un diálogo.
 */
export function resolveShortcut(event, { typing = false } = {}) {
  const key = String(event.key ?? '').toLowerCase();
  const alt = Boolean(event.altKey);
  const ctrl = Boolean(event.ctrlKey || event.metaKey);
  const shift = Boolean(event.shiftKey);

  for (const s of SHORTCUTS) {
    const m = s.match;
    if (m.digits) {
      if (alt && !ctrl && /^[1-9]$/.test(key)) return { ...s, index: Number(key) - 1 };
      continue;
    }
    if (m.key !== key) continue;
    if (Boolean(m.alt) !== alt) continue;
    if (Boolean(m.ctrl) !== ctrl) continue;
    if (m.shift !== undefined && Boolean(m.shift) !== shift) continue;
    // Escape siempre pasa: es la salida de emergencia de cualquier diálogo.
    if (typing && !alt && !ctrl && key !== 'escape') continue;
    return s;
  }
  return null;
}
