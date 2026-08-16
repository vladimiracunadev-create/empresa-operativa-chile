#!/usr/bin/env node
/**
 * Captura las imágenes del manual con Chrome en modo headless.
 *
 * Las capturas del manual tienen que poder REGENERARSE. Una imagen hecha a mano
 * envejece en silencio: la interfaz cambia, el manual sigue mostrando la versión
 * anterior y nadie se entera hasta que alguien intenta seguir el manual y no
 * encuentra el botón. Este script vuelve a producirlas todas con un comando.
 *
 * Es reproducible porque la app acepta su estado por URL (`?modo=sandbox`,
 * `?tema=claro`, `?periodo=`, `#vista`): no hay que tocar `localStorage` ni
 * pinchar nada antes de disparar la foto.
 *
 *   node scripts/build-all.mjs
 *   node apps/empresa-operativa/server.mjs &
 *   node scripts/capture-screenshots.mjs
 *
 * Salida: docs/assets/capturas/
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/assets/capturas');
const base = process.env.CAPTURE_URL || 'http://127.0.0.1:4180';

/** Localiza Chrome o Edge. Ambos sirven: los dos son Chromium. */
function findBrowser() {
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

/* Cada captura: nombre, vista, tamaño y estado que se pide por URL. */
const SHOTS = [
  { name: 'empezar', view: 'empezar', w: 1440, h: 1700, alt: 'Empezar aquí: la ruta completa ordenada por tiempo, con el avance real de los trámites' },
  { name: 'panel', view: 'panel', w: 1440, h: 940, alt: 'Panel de control con los indicadores del mes y el diagnóstico' },
  { name: 'operaciones', view: 'operaciones', w: 1440, h: 940, alt: 'Listado de operaciones del período con sus totales' },
  { name: 'impuestos', view: 'impuestos', w: 1440, h: 1180, alt: 'Borrador del F29 con el remanente arrastrado y los vencimientos' },
  { name: 'constitucion', view: 'constitucion', w: 1440, h: 1180, alt: 'Los nueve trámites de constitución con su evidencia' },
  { name: 'obligaciones', view: 'obligaciones', w: 1440, h: 900, alt: 'Calendario de obligaciones y comprobantes' },
  { name: 'cierre', view: 'cierre', w: 1440, h: 980, alt: 'Cierre mensual con su lista de control' },
  { name: 'empresa', view: 'empresa', w: 1440, h: 1020, alt: 'Ficha de la empresa y patente municipal estimada' },
  { name: 'auditoria', view: 'auditoria', w: 1440, h: 900, alt: 'Bitácora de auditoría' },
  { name: 'datos', view: 'datos', w: 1440, h: 980, alt: 'Exportación, importación y respaldos' },
  { name: 'capital', view: 'capital', w: 1440, h: 1400, alt: 'Capital y patrimonio: las seis magnitudes, el CPT con su desglose y la patente municipal' },
  { name: 'academia', view: 'academia', w: 1440, h: 1020, alt: 'Academia: una venta y un honorario explicados paso a paso' },
  { name: 'glosario', view: 'glosario', w: 1440, h: 1020, alt: 'Glosario buscable con las definiciones del sistema' },
  { name: 'panel-claro', view: 'panel', w: 1440, h: 940, tema: 'claro', alt: 'El panel en tema claro' },
  { name: 'panel-real', view: 'panel', w: 1440, h: 800, modo: 'real', alt: 'El panel en EMPRESA REAL, con la franja ámbar de advertencia' },
  // Móvil: es la forma en que se usa el APK, y la navegación cambia a barra inferior.
  { name: 'movil-panel', view: 'panel', w: 412, h: 915, alt: 'El panel en un teléfono' },
  { name: 'movil-operaciones', view: 'operaciones', w: 412, h: 915, alt: 'Las operaciones en un teléfono' },
  { name: 'movil-impuestos', view: 'impuestos', w: 412, h: 915, alt: 'El borrador del F29 en un teléfono' }
];

const browser = findBrowser();
fs.mkdirSync(outDir, { recursive: true });
console.log(`Navegador: ${browser}`);
console.log(`Aplicación: ${base}\n`);

for (const shot of SHOTS) {
  const params = new URLSearchParams({ modo: shot.modo ?? 'sandbox', periodo: '2026-08' });
  if (shot.tema) params.set('tema', shot.tema);
  const url = `${base}/?${params}#${shot.view}`;
  const dest = path.join(outDir, `${shot.name}.png`);

  // Perfil temporal por captura: sin él, Chrome reutiliza el perfil del usuario,
  // arrastra su `localStorage` y las capturas dejarían de ser reproducibles.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'eoc-shot-'));

  execFileSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      `--user-data-dir=${profile}`,
      `--window-size=${shot.w},${shot.h}`,
      '--virtual-time-budget=4000',
      `--screenshot=${dest}`,
      url
    ],
    { stdio: 'pipe' }
  );

  fs.rmSync(profile, { recursive: true, force: true });

  if (!fs.existsSync(dest) || fs.statSync(dest).size < 5000) {
    throw new Error(`La captura ${shot.name} salió vacía o no se generó`);
  }
  console.log(`  ${shot.name}.png — ${(fs.statSync(dest).size / 1024).toFixed(0)} KB (${shot.w}×${shot.h})`);
}

// Índice con los textos alternativos: el manual y el README los usan para no
// repetir a mano una descripción que puede quedar desfasada.
fs.writeFileSync(
  path.join(outDir, 'index.json'),
  JSON.stringify(SHOTS.map(({ name, view, alt, w, h }) => ({ name, view, alt, w, h })), null, 2)
);

console.log(`\n${SHOTS.length} capturas en docs/assets/capturas/`);
