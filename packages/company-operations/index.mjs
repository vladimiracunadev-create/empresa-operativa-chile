/**
 * Entrada para Node (servidor, CLI y tests).
 *
 * El motor vive en `workspace.mjs`, que no importa `node:*` para poder correr
 * también en el navegador. Aquí sólo se le enchufa el almacén de disco.
 * Las apps web/Android/Windows importan `workspace.mjs` + `store.mjs`.
 */
import { CompanyWorkspace as BaseWorkspace, seedSandboxWorkspace } from './workspace.mjs';
import { createNodeStore } from './node-store.mjs';

export {
  TRANSACTION_KINDS,
  FORMATION_STEPS,
  STEP_STATUSES,
  seedSandboxWorkspace
} from './workspace.mjs';
export { createMemoryStore, createWebStore } from './store.mjs';
export { createNodeStore } from './node-store.mjs';

/**
 * Espacio de trabajo respaldado en disco.
 *
 * Acepta `{ rootDir, mode }` (uso normal en Node) o `{ store, mode }` si ya
 * tienes un almacén construido.
 */
export class CompanyWorkspace extends BaseWorkspace {
  constructor({ rootDir, store, mode = 'real' }) {
    if (!store && !rootDir) throw new Error('CompanyWorkspace requiere rootDir o store');
    super({ store: store ?? createNodeStore({ rootDir, mode }), mode });
    this.rootDir = rootDir;
  }

  /** Ruta física de un archivo del espacio de trabajo (sólo almacén de disco). */
  file(name) {
    if (typeof this.store.file !== 'function') throw new Error('Este almacén no expone rutas de archivo');
    const key = name.replace(/\.(json|ndjson)$/, '');
    return this.store.file(key);
  }

  /** Directorio del modo actual (sólo almacén de disco). */
  get dir() {
    return this.store.dir;
  }
}

/** Crea (si hace falta) y siembra el SANDBOX en disco. */
export function seedSandbox(rootDir) {
  return seedSandboxWorkspace(new CompanyWorkspace({ rootDir, mode: 'sandbox' }));
}
