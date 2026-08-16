#!/usr/bin/env node
/**
 * Construye `apps/web/dist`, que es la aplicación completa.
 *
 * Ese directorio es la ÚNICA fuente de interfaz del proyecto: lo sirve el
 * servidor Node, lo empaqueta Capacitor dentro del APK y lo embebe Tauri en el
 * ejecutable de Windows. Cuando la web mejora, mejoran las tres a la vez.
 *
 * No hay bundler ni transpilador: se copian módulos ES tal cual. El navegador,
 * la WebView de Android y WebView2 en Windows los cargan de forma nativa, y a
 * cambio el código que se depura en producción es exactamente el que está en el
 * repositorio.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'apps/web/src');
const distDir = path.join(root, 'apps/web/dist');

/** Módulos del dominio que sí puede cargar un navegador (sin `node:*`). */
const CORE = [
  ['chile-tax-rules/index.mjs', 'chile-tax-rules/index.mjs'],
  ['chile-tax-rules/rules.generated.mjs', 'chile-tax-rules/rules.generated.mjs'],
  ['chile-tax-rules/municipalities.mjs', 'chile-tax-rules/municipalities.mjs'],
  ['accounting-engine/index.mjs', 'accounting-engine/index.mjs'],
  ['accounting-engine/tax-equity.mjs', 'accounting-engine/tax-equity.mjs'],
  ['accounting-engine/municipal-patent.mjs', 'accounting-engine/municipal-patent.mjs'],
  ['company-operations/workspace.mjs', 'company-operations/workspace.mjs'],
  ['company-operations/capital.mjs', 'company-operations/capital.mjs'],
  ['company-operations/store.mjs', 'company-operations/store.mjs'],
  ['company-operations/rut.mjs', 'company-operations/rut.mjs'],
  ['glossary/index.mjs', 'glossary/index.mjs'],
  ['onboarding/index.mjs', 'onboarding/index.mjs']
];

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
};

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

/* ------------------------------------------------------------- build ----- */

fs.rmSync(distDir, { recursive: true, force: true });
copyDir(srcDir, distDir);

for (const [from, to] of CORE) {
  const src = path.join(root, 'packages', from);
  if (!fs.existsSync(src)) throw new Error(`Falta el módulo del núcleo: packages/${from}`);
  const dest = path.join(distDir, 'core', to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Ningún archivo publicado puede importar `node:*`: si eso llega al APK, la
// pantalla queda en blanco sin un error visible. Se comprueba aquí, en el
// build, y no en un test que quizá nadie corra antes de publicar.
const offenders = walk(distDir)
  .filter(f => f.endsWith('.mjs') || f.endsWith('.js'))
  .filter(f => /from\s+['"]node:/.test(fs.readFileSync(f, 'utf8')));
if (offenders.length) {
  console.error('Estos archivos del bundle importan módulos de Node y romperían la app:');
  offenders.forEach(f => console.error(`  ${path.relative(root, f)}`));
  process.exit(1);
}

// Identificador de build para invalidar el caché del service worker.
const buildId = crypto
  .createHash('sha256')
  .update(walk(distDir).sort().map(f => fs.readFileSync(f)).reduce((a, b) => Buffer.concat([a, b]), Buffer.alloc(0)))
  .digest('hex')
  .slice(0, 12);

const swPath = path.join(distDir, 'sw.js');
fs.writeFileSync(swPath, fs.readFileSync(swPath, 'utf8').replaceAll('__BUILD_ID__', buildId));

const files = walk(distDir);
const bytes = files.reduce((a, f) => a + fs.statSync(f).size, 0);

fs.writeFileSync(
  path.join(distDir, 'build-info.json'),
  JSON.stringify({ buildId, files: files.length, bytes, builtFrom: 'apps/web/src + packages/' }, null, 2)
);

console.log(`apps/web/dist listo — ${files.length} archivos, ${(bytes / 1024).toFixed(0)} KB, build ${buildId}`);
