/**
 * Chrome headless: localizarlo, capturar pantallas e imprimir a PDF.
 *
 * Se usa Chrome —y no una librería— por la misma razón en los tres casos: ya
 * está en la máquina, compone tipografía de verdad, y renderiza SVG y PNG sin
 * conversiones intermedias. El precio es depender de un binario externo, y por
 * eso todo lo que lo invoca vive aquí y no repartido por los scripts.
 *
 * Sólo lo usan scripts de build (`node scripts/*`), nunca la aplicación.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Localiza Chrome o Edge. Ambos sirven: los dos son Chromium. */
export function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
          'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

  const found = candidates.find(p => fs.existsSync(p));
  if (!found) throw new Error('No se encontró Chrome ni Edge. Define CHROME_PATH.');
  return found;
}

/**
 * Ejecuta Chrome con un perfil temporal.
 *
 * El perfil desechable no es un detalle: sin él Chrome reutiliza el del usuario,
 * arrastra su `localStorage` y las capturas dejan de ser reproducibles.
 */
function run(args, { timeBudget = 4000 } = {}) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'eoc-chrome-'));
  try {
    execFileSync(
      findBrowser(),
      ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, `--virtual-time-budget=${timeBudget}`, ...args],
      { stdio: 'pipe' }
    );
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

/**
 * Captura una página a PNG.
 *
 * `scale` es el factor de densidad: 2 para las capturas del manual (se ven
 * nítidas al ampliarlas) y 1 para las de la guía, donde importa más que el
 * archivo sea pequeño porque viaja dentro del HTML y del APK.
 */
export function screenshot({ url, out, width, height, scale = 2, timeBudget = 4000 }) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  run(
    [
      '--hide-scrollbars',
      `--force-device-scale-factor=${scale}`,
      `--window-size=${width},${height}`,
      `--screenshot=${out}`,
      url
    ],
    { timeBudget }
  );

  if (!fs.existsSync(out) || fs.statSync(out).size < 5000) {
    throw new Error(`La captura ${path.basename(out)} salió vacía o no se generó`);
  }
  return fs.statSync(out).size;
}

/** Imprime un HTML a PDF. Devuelve `{ bytes, pages }`. */
export function printPdf({ html, out, timeBudget = 15000 }) {
  const tmp = path.join(os.tmpdir(), `eoc-print-${process.pid}-${path.basename(out, '.pdf')}.html`);
  fs.writeFileSync(tmp, html);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  try {
    run(['--no-pdf-header-footer', `--print-to-pdf=${out}`, `file:///${tmp.replace(/\\/g, '/')}`], { timeBudget });
  } finally {
    if (process.env.EOC_KEEP_HTML) console.log(`HTML intermedio: ${tmp}`);
    else fs.rmSync(tmp, { force: true });
  }

  if (!fs.existsSync(out) || fs.statSync(out).size < 50_000) {
    throw new Error(`${path.basename(out)} salió vacío o demasiado pequeño: probablemente no se embebieron las imágenes.`);
  }

  const bytes = fs.statSync(out).size;
  const pages = (fs.readFileSync(out).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  return { bytes, pages };
}
