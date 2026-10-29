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
  'packages/core/jurisdiction-context.mjs',
  'packages/core/lifecycle.mjs',
  'packages/core/legal-calendar.mjs',
  'packages/core/country-pack.mjs',
  'packages/core/regulatory-rules.mjs',
  'packages/i18n/locales/index.mjs',
  'packages/jurisdictions/registry.mjs',
  'packages/jurisdictions/cl/rule-envelope.mjs',
  'packages/jurisdictions/cl/operations.mjs',
  'packages/jurisdictions/cl/insolvency.mjs',
  'packages/jurisdictions/cl/trademarks.mjs',
  'packages/chile-tax-rules/municipalities.mjs',
  'packages/accounting-engine/index.mjs',
  'packages/accounting-engine/tax-equity.mjs',
  'packages/accounting-engine/municipal-patent.mjs',
  'packages/company-operations/workspace.mjs',
  'packages/company-operations/governance.mjs',
  'packages/company-operations/capital.mjs',
  'packages/company-operations/store.mjs',
  'packages/company-operations/rut.mjs',
  'packages/glossary/index.mjs',
  'packages/onboarding/index.mjs',
  'packages/shortcuts/index.mjs'
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
  const desktop = JSON.parse(fs.readFileSync(path.join(root, 'apps/contador-desktop/package.json'), 'utf8'));

  assert.equal(tauri.version, pkg.version, 'tauri.conf.json quedó desfasado');
  assert.match(cargo, new RegExp(`^version = "${pkg.version}"$`, 'm'), 'Cargo.toml quedó desfasado');
  assert.match(appJs, new RegExp(`APP_VERSION = '${pkg.version}'`), 'APP_VERSION quedó desfasado');
  assert.equal(android.version, pkg.version, 'apps/android/package.json quedó desfasado');
  assert.equal(desktop.version, pkg.version, 'apps/contador-desktop/package.json quedó desfasado');
});

test('pnpm es el único gestor y no existen lockfiles de npm', () => {
  const lockfilesNpm = [];
  const visitar = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) visitar(target);
      else if (entry.name === 'package-lock.json' || entry.name === 'npm-shrinkwrap.json') lockfilesNpm.push(target);
    }
  };
  visitar(root);
  assert.deepEqual(lockfilesNpm, [], `se encontraron lockfiles ajenos a pnpm: ${lockfilesNpm.join(', ')}`);
});

test('los runtimes de build están fijados a baselines corregidos', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const android = JSON.parse(fs.readFileSync(path.join(root, 'apps/android/package.json'), 'utf8'));
  const desktop = JSON.parse(fs.readFileSync(path.join(root, 'apps/contador-desktop/package.json'), 'utf8'));
  const nodeVersion = fs.readFileSync(path.join(root, '.node-version'), 'utf8').trim();
  const rustToolchain = fs.readFileSync(path.join(root, 'rust-toolchain.toml'), 'utf8');
  const cargoLock = path.join(root, 'apps/contador-desktop/src-tauri/Cargo.lock');
  const workflows = walk(path.join(root, '.github/workflows'))
    .filter(file => file.endsWith('.yml'))
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n');

  assert.equal(pkg.packageManager, 'pnpm@11.25.0');
  assert.equal(pkg.engines.node, '>=22.23.4 <23 || >=24.22.1 <25 || >=26.13.0 <27');
  assert.equal(android.packageManager, pkg.packageManager);
  assert.equal(android.engines.node, pkg.engines.node);
  assert.equal(desktop.packageManager, pkg.packageManager);
  assert.equal(desktop.engines.node, pkg.engines.node);
  assert.equal(nodeVersion, '24.22.2');
  assert.match(rustToolchain, /^channel = "1\.99\.1"$/m);
  assert.ok(fs.existsSync(cargoLock), 'falta Cargo.lock para el escritorio Tauri');
  assert.doesNotMatch(workflows, /node-version:\s*['"]?(?:20|22)['"]?\s*$/m);
  assert.doesNotMatch(workflows, /rustup toolchain install stable/);
  assert.doesNotMatch(workflows, /github\/codeql-action\/.+?# v3/);
});

test('la automatización de dependencias cubre pnpm, Cargo y GitHub Actions', () => {
  const dependabot = fs.readFileSync(path.join(root, '.github/dependabot.yml'), 'utf8');
  const security = fs.readFileSync(path.join(root, '.github/workflows/security.yml'), 'utf8');
  const cargoAudit = fs.readFileSync(path.join(root, '.cargo/audit.toml'), 'utf8');

  assert.match(dependabot, /package-ecosystem: npm[\s\S]+directory: \/apps\/android/);
  assert.match(
    dependabot,
    /capacitor:[\s\S]+update-types:[\s\S]+- minor[\s\S]+- patch[\s\S]+patterns:[\s\S]+"@capacitor\/\*"/,
    'Dependabot no debe proponer saltos mayores de Capacitor sin una migración explícita'
  );
  assert.match(dependabot, /package-ecosystem: npm[\s\S]+directory: \/apps\/contador-desktop/);
  assert.match(dependabot, /package-ecosystem: cargo[\s\S]+directory: \/apps\/contador-desktop\/src-tauri/);
  assert.match(dependabot, /package-ecosystem: github-actions[\s\S]+directory: \//);
  assert.match(security, /pnpm --dir apps\/android audit --audit-level high/);
  assert.match(security, /pnpm --dir apps\/contador-desktop audit --audit-level high/);
  assert.match(security, /cargo audit --file apps\/contador-desktop\/src-tauri\/Cargo\.lock/);
  assert.match(security, /actions\/dependency-review-action@[0-9a-f]{40}/);
  assert.doesNotMatch(security, /^\s*(?:run:\s*)?npm\s/m, 'el workflow no debe ejecutar npm');
  assert.match(cargoAudit, /^arch = \["x86_64"\]$/m);
  assert.match(cargoAudit, /^os = \["windows"\]$/m);
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
