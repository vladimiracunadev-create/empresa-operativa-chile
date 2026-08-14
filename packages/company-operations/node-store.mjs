/**
 * Almacén sobre disco. Sólo lo importa el servidor Node y la CLI: mantenerlo en
 * un archivo aparte es lo que permite que `workspace.mjs` siga siendo cargable
 * en un navegador, donde `node:fs` no existe.
 */
import fs from 'node:fs';
import path from 'node:path';

const ensureDir = p => fs.mkdirSync(p, { recursive: true });

/** Escritura atómica: se escribe a un temporal y se renombra. */
const writeJsonAtomic = (file, data) => {
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
};

const FILES = {
  company: 'company.json',
  formation: 'formation.json',
  transactions: 'transactions.json',
  obligations: 'obligations.json',
  'closed-periods': 'closed-periods.json',
  'period-closes': 'period-closes.json',
  audit: 'audit.ndjson'
};

export function createNodeStore({ rootDir, mode }) {
  const dir = path.join(path.resolve(rootDir), mode);
  ensureDir(dir);
  ensureDir(path.join(dir, 'evidence'));
  ensureDir(path.join(dir, 'backups'));

  const file = key => path.join(dir, FILES[key] ?? `${key}.json`);

  const read = (key, fallback = null) => {
    const p = file(key);
    if (!fs.existsSync(p)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
      return fallback;
    }
  };

  return {
    kind: 'node',
    dir,
    file,
    read,
    write: (key, value) => writeJsonAtomic(file(key), value),
    // El log de auditoría es NDJSON append-only a propósito: una línea por
    // hecho, sin reescribir el archivo completo. Reescribirlo sería la forma
    // más fácil de perder o alterar historial.
    append: (key, row) => fs.appendFileSync(file(key), `${JSON.stringify(row)}\n`),
    readAll: key => {
      const p = file(key);
      if (!fs.existsSync(p)) return [];
      return fs
        .readFileSync(p, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { corrupt: true, line };
          }
        });
    },
    saveSnapshot: (name, data) => {
      const dest = path.join(dir, 'backups', name);
      ensureDir(dest);
      writeJsonAtomic(path.join(dest, 'snapshot.json'), data);
      for (const key of Object.keys(FILES)) {
        const src = file(key);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dest, FILES[key]));
      }
      return dest;
    },
    listSnapshots: () => {
      const backups = path.join(dir, 'backups');
      return fs.existsSync(backups) ? fs.readdirSync(backups).sort() : [];
    }
  };
}
