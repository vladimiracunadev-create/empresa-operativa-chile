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
import { fileURLToPath } from 'node:url';
import { screenshot, findBrowser } from './lib/chrome.mjs';
import { STAGES } from '../packages/onboarding/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/assets/capturas');
const compactDir = path.join(root, 'docs/assets/compacto');
const base = process.env.CAPTURE_URL || 'http://127.0.0.1:4180';

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
  { name: 'ayuda', view: 'ayuda', w: 1440, h: 1400, alt: 'Ayuda: los manuales dentro de la aplicación y la tabla de atajos de teclado' },
  { name: 'panel-claro', view: 'panel', w: 1440, h: 940, tema: 'claro', alt: 'El panel en tema claro' },
  { name: 'panel-real', view: 'panel', w: 1440, h: 800, modo: 'real', alt: 'El panel en EMPRESA REAL, con la franja ámbar de advertencia' },
  // Móvil: es la forma en que se usa el APK, y la navegación cambia a barra inferior.
  { name: 'movil-panel', view: 'panel', w: 412, h: 915, alt: 'El panel en un teléfono' },
  { name: 'movil-operaciones', view: 'operaciones', w: 412, h: 915, alt: 'Las operaciones en un teléfono' },
  { name: 'movil-impuestos', view: 'impuestos', w: 412, h: 915, alt: 'El borrador del F29 en un teléfono' }
];

/**
 * Juego COMPACTO de las mismas capturas.
 *
 * Existe por una razón de peso, literalmente: la guía y el manual en HTML
 * embeben sus imágenes como data URI y viajan dentro del APK y del ejecutable
 * de Windows. A densidad 2 el manual pasaría de diez megas; a densidad 1 y algo
 * más angostas pesan una fracción y siguen siendo perfectamente legibles al
 * tamaño en que se leen.
 *
 * Es un espejo de `SHOTS`, no una lista aparte: si mañana se agrega una captura
 * al manual, su versión compacta aparece sola.
 */
const COMPACT_WIDTH = 1180;
const COMPACT_SHOTS = SHOTS.filter(s => s.w >= 900);

// Toda vista que la guía manda abrir tiene que tener captura, o el documento
// saldría con un hueco. Falla aquí antes que en la revisión.
const missing = [...new Set(STAGES.map(s => s.doInApp?.view).filter(Boolean))].filter(
  view => !COMPACT_SHOTS.some(s => s.name === view)
);
if (missing.length) {
  throw new Error(`La guía manda abrir pantallas sin captura declarada en SHOTS: ${missing.join(', ')}`);
}

const browser = findBrowser();
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(compactDir, { recursive: true });
console.log(`Navegador: ${browser}`);
console.log(`Aplicación: ${base}\n`);

const urlFor = shot => {
  const params = new URLSearchParams({ modo: shot.modo ?? 'sandbox', periodo: '2026-08' });
  if (shot.tema) params.set('tema', shot.tema);
  return `${base}/?${params}#${shot.view}`;
};

for (const shot of SHOTS) {
  const dest = path.join(outDir, `${shot.name}.png`);
  const bytes = screenshot({ url: urlFor(shot), out: dest, width: shot.w, height: shot.h, scale: 2 });
  console.log(`  ${shot.name}.png — ${(bytes / 1024).toFixed(0)} KB (${shot.w}×${shot.h})`);
}

console.log('');
for (const shot of COMPACT_SHOTS) {
  const dest = path.join(compactDir, `${shot.name}.png`);
  const bytes = screenshot({ url: urlFor(shot), out: dest, width: COMPACT_WIDTH, height: shot.h, scale: 1 });
  console.log(`  compacto/${shot.name}.png — ${(bytes / 1024).toFixed(0)} KB (${COMPACT_WIDTH}×${shot.h})`);
}

// Índice con los textos alternativos: el manual y el README los usan para no
// repetir a mano una descripción que puede quedar desfasada.
fs.writeFileSync(
  path.join(outDir, 'index.json'),
  JSON.stringify(SHOTS.map(({ name, view, alt, w, h }) => ({ name, view, alt, w, h })), null, 2)
);
fs.writeFileSync(
  path.join(compactDir, 'index.json'),
  JSON.stringify(COMPACT_SHOTS.map(({ name, view, alt, h }) => ({ name, view, alt, w: COMPACT_WIDTH, h })), null, 2)
);

console.log(`\n${SHOTS.length} capturas a densidad 2 y ${COMPACT_SHOTS.length} compactas.`);
