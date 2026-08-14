/**
 * Adaptadores de almacenamiento.
 *
 * `CompanyWorkspace` no sabe si está sobre un disco, sobre `localStorage` o
 * sobre memoria: sólo habla este contrato. Gracias a eso el MISMO motor
 * contable corre en el servidor Node, en el navegador, dentro del APK de
 * Android y dentro del ejecutable de Windows, sin ramas `if (isBrowser)`
 * repartidas por la lógica de negocio.
 *
 *   read(key, fallback)      → valor JSON o `fallback`
 *   write(key, value)        → persiste el valor (debe ser atómico si puede)
 *   append(key, row)         → agrega una fila a un log append-only
 *   readAll(key)             → filas del log, en orden
 *   saveSnapshot(name, data) → guarda un respaldo y devuelve su ubicación
 *   listSnapshots()          → nombres de respaldos existentes
 */

const clone = value => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

/** Almacén en memoria. Útil para tests y para simulaciones desechables. */
export function createMemoryStore() {
  const docs = new Map();
  const logs = new Map();
  const snaps = new Map();
  return {
    kind: 'memory',
    read: (key, fallback = null) => (docs.has(key) ? clone(docs.get(key)) : fallback),
    write: (key, value) => docs.set(key, clone(value)),
    append: (key, row) => {
      if (!logs.has(key)) logs.set(key, []);
      logs.get(key).push(clone(row));
    },
    readAll: key => clone(logs.get(key) ?? []),
    saveSnapshot: (name, data) => {
      snaps.set(name, clone(data));
      return `memory://${name}`;
    },
    listSnapshots: () => [...snaps.keys()].sort()
  };
}

/**
 * Almacén sobre `localStorage` (navegador, WebView de Android, WebView de
 * Windows). Cada modo tiene su propio prefijo, de modo que EMPRESA REAL y
 * SANDBOX no pueden pisarse aunque compartan el mismo origen.
 */
export function createWebStore({ namespace, storage = globalThis.localStorage } = {}) {
  if (!storage) throw new Error('createWebStore requiere localStorage');
  if (!namespace) throw new Error('createWebStore requiere namespace');
  const k = key => `${namespace}:${key}`;

  const readRaw = (key, fallback) => {
    const raw = storage.getItem(k(key));
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  return {
    kind: 'web',
    namespace,
    read: (key, fallback = null) => readRaw(key, fallback),
    write: (key, value) => storage.setItem(k(key), JSON.stringify(value)),
    append: (key, row) => {
      const rows = readRaw(key, []);
      rows.push(row);
      storage.setItem(k(key), JSON.stringify(rows));
    },
    readAll: key => readRaw(key, []),
    saveSnapshot: (name, data) => {
      const index = readRaw('__snapshots', []);
      storage.setItem(`${namespace}:snapshot:${name}`, JSON.stringify(data));
      if (!index.includes(name)) {
        index.push(name);
        storage.setItem(k('__snapshots'), JSON.stringify(index));
      }
      return `${namespace}:snapshot:${name}`;
    },
    listSnapshots: () => readRaw('__snapshots', []).slice().sort()
  };
}
