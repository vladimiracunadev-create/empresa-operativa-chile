#!/usr/bin/env node
/**
 * Copia `apps/web/dist` a `apps/android/www`, que es lo que Capacitor mete
 * dentro del APK, y aplica los iconos generados sobre el proyecto Android una
 * vez que existe.
 *
 * Verifica que la copia no quedó vacía: un APK sin contenido compila
 * perfectamente, arranca, muestra una WebView en blanco y deja todas las
 * señales de build en verde. El único momento en que ese fallo es barato de
 * detectar es aquí.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dist = path.join(root, 'apps/web/dist');
const www = path.join(here, 'www');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('No existe apps/web/dist. Ejecuta antes: node scripts/build-web.mjs');
  process.exit(1);
}

const copyDir = (from, to) => {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
};

fs.rmSync(www, { recursive: true, force: true });
copyDir(dist, www);

const walk = dir =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });

const files = walk(www);
const views = files.filter(f => f.includes(`${path.sep}views${path.sep}`)).length;
const core = files.filter(f => f.includes(`${path.sep}core${path.sep}`)).length;

if (views < 10) throw new Error(`www quedó con ${views} vistas; se esperaban al menos 10`);
if (core < 6) throw new Error(`www quedó con ${core} módulos del núcleo; se esperaban al menos 6`);
if (!fs.readFileSync(path.join(www, 'index.html'), 'utf8').includes('Empresa Operativa Chile')) {
  throw new Error('www/index.html no es la aplicación esperada');
}

console.log(`www listo — ${files.length} archivos, ${views} vistas, ${core} módulos del núcleo.`);

/* --------------------------------------------- iconos del proyecto nativo -- */

const resIcons = path.join(here, 'res-icons');
const androidRes = path.join(here, 'android/app/src/main/res');

if (fs.existsSync(androidRes) && fs.existsSync(resIcons)) {
  for (const entry of fs.readdirSync(resIcons, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const target = path.join(androidRes, entry.name);
    fs.mkdirSync(target, { recursive: true });
    for (const file of fs.readdirSync(path.join(resIcons, entry.name))) {
      fs.copyFileSync(path.join(resIcons, entry.name, file), path.join(target, file));
    }
  }
  console.log('Iconos de la aplicación aplicados al proyecto Android.');
} else {
  console.log('El proyecto Android todavía no existe: los iconos se aplicarán tras `cap add android`.');
}
