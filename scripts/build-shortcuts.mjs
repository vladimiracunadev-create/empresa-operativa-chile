#!/usr/bin/env node
/**
 * Genera `docs/ATAJOS-DE-TECLADO.md` desde `packages/shortcuts/index.mjs`.
 *
 * Mismo motivo que el glosario y la guía: la tabla de atajos tiene tres
 * consumidores —el oyente que los ejecuta, la ayuda que muestra la app y este
 * documento— y mantenerlos a mano garantiza que en un mes digan cosas
 * distintas. `--check` falla si el documento quedó desfasado; CI lo ejecuta así.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHORTCUTS, shortcutsByGroup } from '../packages/shortcuts/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'docs/ATAJOS-DE-TECLADO.md');

const keys = s =>
  s.keys
    .split(/\s*\+\s*/)
    .map(k => `<kbd>${k}</kbd>`)
    .join(' + ');

const body = `<!-- GENERADO POR scripts/build-shortcuts.mjs — NO EDITAR A MANO. -->
<!-- Fuente de verdad: packages/shortcuts/index.mjs · Regenerar: node scripts/build-shortcuts.mjs -->

# ⌨️ Atajos de teclado

${SHORTCUTS.length} atajos. La misma lista se abre dentro de la aplicación con <kbd>F1</kbd>, y está en
**Ayuda → Atajos de teclado**.

Están pensados sobre todo para la **aplicación de escritorio**: en Windows se trabaja sentado, con las dos
manos y durante un rato largo —cerrando un mes, revisando un cierre anual— y ahí levantar la mano al ratón
para cambiar de pantalla cuesta más de lo que parece. En el teléfono no estorban: sin teclado, no se disparan.

> [!TIP]
> Si sólo vas a aprender uno, que sea <kbd>Ctrl</kbd> + <kbd>K</kbd>. Abre el buscador, escribes tres letras
> y saltas a cualquier pantalla o a cualquier término del glosario. Reemplaza a todos los atajos de navegación.

${shortcutsByGroup()
  .map(
    g => `## ${g.label}

| Atajo | Qué hace |
|---|---|
${g.shortcuts.map(s => `| ${keys(s)} | ${s.description}${s.note ? `<br><sub>${s.note}</sub>` : ''} |`).join('\n')}`
  )
  .join('\n\n')}

## Cómo se comportan mientras escribes

Un atajo que se dispara mientras rellenas una descripción es peor que no tener atajos. La regla es simple y
está en el propio motor: **dentro de un campo de texto sólo pasan los atajos con modificador**
(<kbd>Ctrl</kbd> o <kbd>Alt</kbd>) y <kbd>Esc</kbd>, que es la salida de emergencia de cualquier diálogo.
Escribir «no» en una descripción no abre nada.

## Diferencias por plataforma

| Plataforma | Qué cambia |
|---|---|
| **Windows** (instalador o portable) | Todos funcionan. Es donde se diseñaron: no hay barra del navegador que se quede con ninguna combinación. |
| **Navegador / PWA** | Todos funcionan, pero algunas combinaciones las intercepta primero el navegador según su configuración. Instalada como PWA se comporta igual que la de escritorio. |
| **Android** | Sólo con teclado externo. Sin él, la navegación es la barra inferior. |

## Dónde vive esto en el código

| Pieza | Ruta | Responsabilidad |
|---|---|---|
| Tabla declarada | \`packages/shortcuts/index.mjs\` | Qué tecla, en qué grupo, qué hace |
| Oyente y buscador | \`apps/web/src/lib/shortcuts.js\` | Ejecutarlos y dibujar la ayuda |
| Este documento | \`scripts/build-shortcuts.mjs\` | Proyección del módulo, comprobada en CI |
`;

const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (process.argv.includes('--check')) {
  if (previous !== body) {
    console.error('docs/ATAJOS-DE-TECLADO.md está desfasado respecto de packages/shortcuts/index.mjs.');
    console.error('Ejecuta: node scripts/build-shortcuts.mjs');
    process.exit(1);
  }
  console.log(`Atajos sincronizados (${SHORTCUTS.length}).`);
} else {
  fs.writeFileSync(target, body);
  console.log(`docs/ATAJOS-DE-TECLADO.md generado con ${SHORTCUTS.length} atajos.`);
}
