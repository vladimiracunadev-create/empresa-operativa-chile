#!/usr/bin/env node
/**
 * Build completo, en orden. Un solo comando para dejar el repositorio listo
 * para servir la web, empaquetar el APK o compilar el instalador de Windows.
 *
 *   reglas embebidas → iconos → aplicación web
 *
 * El orden importa: la web embebe las reglas y los iconos, así que generar la
 * web con reglas viejas produciría un APK que calcula con la tasa del año
 * pasado sin que nada se ponga en rojo.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const steps = [
  ['Reglas tributarias embebidas', 'build-rules.mjs'],
  ['Iconos de las tres plataformas', 'build-icons.mjs'],
  ['Aplicación web (apps/web/dist)', 'build-web.mjs']
];

for (const [label, script] of steps) {
  console.log(`\n▸ ${label}`);
  execFileSync(process.execPath, [path.join(here, script)], { stdio: 'inherit' });
}

console.log('\nBuild completo. La aplicación está en apps/web/dist.');
