/**
 * Comprobaciones estructurales de la aplicación web.
 *
 * No hay navegador en CI, así que no se prueba el render. Se prueba lo que sí
 * se puede probar sin uno y que, cuando falla, deja la app en blanco dentro del
 * APK sin ningún error visible: importar `node:*` desde código que viaja al
 * dispositivo, o dejar una vista fuera del router.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webSrc = path.join(root, 'apps/web/src');

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

/** Módulos del núcleo que se copian al bundle (scripts/build-web.mjs). */
const BROWSER_CORE = [
  'packages/chile-tax-rules/index.mjs',
  'packages/chile-tax-rules/rules.generated.mjs',
  'packages/accounting-engine/index.mjs',
  'packages/company-operations/workspace.mjs',
  'packages/company-operations/store.mjs',
  'packages/company-operations/rut.mjs'
];

test('ningún módulo que viaja al navegador importa node:*', () => {
  const sources = [...walk(webSrc).filter(f => f.endsWith('.js')), ...BROWSER_CORE.map(f => path.join(root, f))];
  for (const file of sources) {
    const code = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(
      code,
      /from\s+['"]node:/,
      `${path.relative(root, file)} importa un módulo de Node y rompería la app en Android/Windows`
    );
  }
});

test('el núcleo del navegador existe completo', () => {
  for (const file of BROWSER_CORE) {
    assert.ok(fs.existsSync(path.join(root, file)), `falta ${file}`);
  }
});

test('todas las vistas están registradas en el router', () => {
  const viewFiles = fs
    .readdirSync(path.join(webSrc, 'views'))
    .filter(f => f.endsWith('.js'))
    .map(f => f.replace('.js', ''));
  const appJs = fs.readFileSync(path.join(webSrc, 'app.js'), 'utf8');

  for (const view of viewFiles) {
    assert.match(appJs, new RegExp(`from '\\./views/${view}\\.js'`), `la vista ${view} no está importada en app.js`);
    assert.match(appJs, new RegExp(`\\b${view}\\b`), `la vista ${view} no aparece en la navegación`);
  }
  assert.ok(viewFiles.length >= 10, `se esperaban al menos 10 vistas, hay ${viewFiles.length}`);
});

test('cada vista declara id, etiqueta, título, icono y render', () => {
  for (const file of fs.readdirSync(path.join(webSrc, 'views')).filter(f => f.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(webSrc, 'views', file), 'utf8');
    for (const field of ['id:', 'label:', 'title:', 'icon:', 'render(']) {
      assert.ok(code.includes(field), `${file} no declara ${field}`);
    }
  }
});

test('la versión de la app coincide en package.json, Tauri y Cargo', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const tauri = JSON.parse(fs.readFileSync(path.join(root, 'apps/contador-desktop/src-tauri/tauri.conf.json'), 'utf8'));
  const cargo = fs.readFileSync(path.join(root, 'apps/contador-desktop/src-tauri/Cargo.toml'), 'utf8');
  const appJs = fs.readFileSync(path.join(webSrc, 'app.js'), 'utf8');
  const android = JSON.parse(fs.readFileSync(path.join(root, 'apps/android/package.json'), 'utf8'));

  assert.equal(tauri.version, pkg.version, 'tauri.conf.json quedó desfasado');
  assert.match(cargo, new RegExp(`^version = "${pkg.version}"$`, 'm'), 'Cargo.toml quedó desfasado');
  assert.match(appJs, new RegExp(`APP_VERSION = '${pkg.version}'`), 'APP_VERSION quedó desfasado');
  assert.equal(android.version, pkg.version, 'apps/android/package.json quedó desfasado');
});

test('el identificador de la aplicación es el mismo en Android y en Windows', () => {
  const tauri = JSON.parse(fs.readFileSync(path.join(root, 'apps/contador-desktop/src-tauri/tauri.conf.json'), 'utf8'));
  const cap = JSON.parse(fs.readFileSync(path.join(root, 'apps/android/capacitor.config.json'), 'utf8'));
  assert.equal(cap.appId, tauri.identifier);
});

test('el índice de la web referencia los archivos que el build produce', () => {
  const html = fs.readFileSync(path.join(webSrc, 'index.html'), 'utf8');
  for (const asset of ['./app.css', './app.js', './manifest.webmanifest', './icons/icon.svg']) {
    assert.ok(html.includes(asset), `index.html no referencia ${asset}`);
  }
});

test('el manifiesto PWA apunta a iconos que el generador crea', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(webSrc, 'manifest.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) {
    const file = path.join(webSrc, icon.src);
    assert.ok(fs.existsSync(file), `el manifiesto declara ${icon.src} pero el archivo no existe`);
  }
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable'), 'falta el icono maskable de Android');
});
