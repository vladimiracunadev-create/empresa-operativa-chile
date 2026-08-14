/**
 * Estado de la aplicación.
 *
 * Dos espacios de trabajo vivos al mismo tiempo (real y sandbox) pero jamás
 * mezclados: cada uno con su propio almacén. Cambiar de modo cambia a cuál
 * apunta la UI, no mueve un solo dato.
 */
import { CompanyWorkspace, seedSandboxWorkspace } from '../core/company-operations/workspace.mjs';
import { createPlatformStore } from './platform.js';

const PREF = 'empresa-operativa-chile:prefs';

const readPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREF)) ?? {};
  } catch {
    return {};
  }
};

export const state = {
  mode: readPrefs().mode === 'sandbox' ? 'sandbox' : 'real',
  theme: readPrefs().theme === 'light' ? 'light' : 'dark',
  view: 'panel',
  period: new Date().toISOString().slice(0, 7),
  workspaces: {}
};

const savePrefs = () => localStorage.setItem(PREF, JSON.stringify({ mode: state.mode, theme: state.theme }));

/** Espacio de trabajo del modo actual (o del pedido explícitamente). */
export function ws(mode = state.mode) {
  if (!state.workspaces[mode]) {
    state.workspaces[mode] = new CompanyWorkspace({ store: createPlatformStore(mode), mode });
  }
  return state.workspaces[mode];
}

/** Siembra el sandbox la primera vez. La empresa real nunca se siembra. */
export function ensureSandboxSeeded() {
  const sandbox = ws('sandbox');
  if (sandbox.listTransactions().length === 0) seedSandboxWorkspace(sandbox);
}

export function setMode(mode) {
  state.mode = mode === 'sandbox' ? 'sandbox' : 'real';
  savePrefs();
}

export function setTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  savePrefs();
}

export function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}

/** Períodos con movimiento, más el actual, del más nuevo al más viejo. */
export function selectablePeriods() {
  const periods = new Set(ws().listPeriods());
  periods.add(new Date().toISOString().slice(0, 7));
  periods.add(state.period);
  return [...periods].sort().reverse();
}
