<!-- GENERADO POR scripts/build-shortcuts.mjs — NO EDITAR A MANO. -->
<!-- Fuente de verdad: packages/shortcuts/index.mjs · Regenerar: node scripts/build-shortcuts.mjs -->

# ⌨️ Atajos de teclado

12 atajos. La misma lista se abre dentro de la aplicación con <kbd>F1</kbd>, y está en
**Ayuda → Atajos de teclado**.

Están pensados sobre todo para la **aplicación de escritorio**: en Windows se trabaja sentado, con las dos
manos y durante un rato largo —cerrando un mes, revisando un cierre anual— y ahí levantar la mano al ratón
para cambiar de pantalla cuesta más de lo que parece. En el teléfono no estorban: sin teclado, no se disparan.

> [!TIP]
> Si sólo vas a aprender uno, que sea <kbd>Ctrl</kbd> + <kbd>K</kbd>. Abre el buscador, escribes tres letras
> y saltas a cualquier pantalla o a cualquier término del glosario. Reemplaza a todos los atajos de navegación.

## Moverse por la aplicación

| Atajo | Qué hace |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Abre el buscador: escribe y salta a cualquier pantalla o término del glosario.<br><sub>Es el atajo que conviene aprender primero: reemplaza a todos los demás de navegación.</sub> |
| <kbd>Alt</kbd> + <kbd>1 … 9</kbd> | Va directo a la pantalla número N de la barra lateral. |
| <kbd>F1</kbd> | Muestra esta lista de atajos sin salir de donde estás. |
| <kbd>Alt</kbd> + <kbd>H</kbd> | Lo mismo que F1, para teclados donde F1 está tomada por el sistema. |
| <kbd>Alt</kbd> + <kbd>A</kbd> | Abre Ayuda: la guía ilustrada y el manual, dentro de la aplicación. |

## Acciones

| Atajo | Qué hace |
|---|---|
| <kbd>Alt</kbd> + <kbd>M</kbd> | Cambia entre EMPRESA REAL y SANDBOX.<br><sub>El cambio se ve en la franja de color de arriba; los datos de cada entorno nunca se mezclan.</sub> |
| <kbd>Alt</kbd> + <kbd>T</kbd> | Cambia entre tema claro y oscuro. |
| <kbd>Alt</kbd> + <kbd>←</kbd> | Retrocede al período anterior con movimiento. |
| <kbd>Alt</kbd> + <kbd>→</kbd> | Avanza al período siguiente. |

## Dentro de una pantalla

| Atajo | Qué hace |
|---|---|
| <kbd>Alt</kbd> + <kbd>N</kbd> | Ejecuta la acción principal de la pantalla: registrar una operación, un movimiento de capital, una obligación.<br><sub>Sólo funciona en las pantallas que tienen una acción principal evidente.</sub> |
| <kbd>/</kbd> | Pone el cursor en el buscador de la pantalla, si lo tiene.<br><sub>No se dispara mientras escribes en un campo: ahí la barra es una barra.</sub> |
| <kbd>Esc</kbd> | Cierra el diálogo, el buscador o el panel abierto. |

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
| Tabla declarada | `packages/shortcuts/index.mjs` | Qué tecla, en qué grupo, qué hace |
| Oyente y buscador | `apps/web/src/lib/shortcuts.js` | Ejecutarlos y dibujar la ayuda |
| Este documento | `scripts/build-shortcuts.mjs` | Proyección del módulo, comprobada en CI |
