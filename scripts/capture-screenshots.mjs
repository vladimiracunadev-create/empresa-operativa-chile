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
const guideDir = path.join(root, 'docs/assets/guia');
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
  { name: 'panel-claro', view: 'panel', w: 1440, h: 940, tema: 'claro', alt: 'El panel en tema claro' },
  { name: 'panel-real', view: 'panel', w: 1440, h: 800, modo: 'real', alt: 'El panel en EMPRESA REAL, con la franja ámbar de advertencia' },
  // Móvil: es la forma en que se usa el APK, y la navegación cambia a barra inferior.
  { name: 'movil-panel', view: 'panel', w: 412, h: 915, alt: 'El panel en un teléfono' },
  { name: 'movil-operaciones', view: 'operaciones', w: 412, h: 915, alt: 'Las operaciones en un teléfono' },
  { name: 'movil-impuestos', view: 'impuestos', w: 412, h: 915, alt: 'El borrador del F29 en un teléfono' }
];

/**
 * Capturas de la guía "Empezar aquí".
 *
 * Van aparte de las del manual por una razón de peso, literalmente: éstas se
 * embeben como data URI dentro del HTML de la guía, que a su vez viaja dentro
 * del APK y del ejecutable de Windows. Por eso se toman a densidad 1 y algo más
 * angostas — pesan una fracción y siguen siendo perfectamente legibles al
 * tamaño en que se leen.
 *
 * La lista se DERIVA de las etapas de `packages/onboarding`: cada vista que una
 * etapa manda abrir tiene su captura, sin listas paralelas que se desincronicen.
 */
const GUIDE_VIEWS = [...new Set(STAGES.map(s => s.doInApp?.view).filter(Boolean))];
const GUIDE_HEIGHT = { capital: 1500, empresa: 1120, constitucion: 1240, operaciones: 1040, impuestos: 1240 };

const GUIDE_SHOTS = [
  { name: 'empezar', view: 'empezar', h: 1700, alt: 'La pantalla “Empezar aquí” con las etapas y el avance real' },
  ...GUIDE_VIEWS.map(view => ({ name: view, view, h: GUIDE_HEIGHT[view] ?? 1100, alt: `La pantalla ${view} de la aplicación` }))
];

const browser = findBrowser();
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(guideDir, { recursive: true });
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
for (const shot of GUIDE_SHOTS) {
  const dest = path.join(guideDir, `${shot.name}.png`);
  const bytes = screenshot({ url: urlFor(shot), out: dest, width: 1180, height: shot.h, scale: 1 });
  console.log(`  guia/${shot.name}.png — ${(bytes / 1024).toFixed(0)} KB (1180×${shot.h})`);
}

// Índice con los textos alternativos: el manual y el README los usan para no
// repetir a mano una descripción que puede quedar desfasada.
fs.writeFileSync(
  path.join(outDir, 'index.json'),
  JSON.stringify(SHOTS.map(({ name, view, alt, w, h }) => ({ name, view, alt, w, h })), null, 2)
);
fs.writeFileSync(
  path.join(guideDir, 'index.json'),
  JSON.stringify(GUIDE_SHOTS.map(({ name, view, alt, h }) => ({ name, view, alt, w: 1180, h })), null, 2)
);

console.log(`\n${SHOTS.length} capturas del manual y ${GUIDE_SHOTS.length} de la guía.`);
