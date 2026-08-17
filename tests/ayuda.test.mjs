/**
 * Ayuda del producto: atajos de teclado, manuales embarcados y presentación.
 *
 * Lo que se protege aquí no es el aspecto —eso no se puede probar sin navegador—
 * sino las promesas que la documentación le hace al usuario: que el atajo que
 * dice el documento sea el que existe, que los manuales que la app dice llevar
 * dentro estén realmente en el paquete, y que la presentación no se publique con
 * una lámina sin guion.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHORTCUTS, SHORTCUT_GROUPS, shortcutsByGroup, resolveShortcut, keysFor } from '../packages/shortcuts/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

/* ------------------------------------------------------------- atajos --- */

test('cada atajo declara grupo conocido, teclas, acción y descripción', () => {
  for (const s of SHORTCUTS) {
    assert.ok(SHORTCUT_GROUPS.some(g => g.id === s.group), `${s.id} usa un grupo desconocido: ${s.group}`);
    assert.ok(s.keys?.length > 0, `${s.id} no declara sus teclas`);
    assert.ok(s.action?.length > 0, `${s.id} no declara su acción`);
    assert.ok(s.description?.length > 20, `${s.id} no explica qué hace`);
    assert.ok(s.match && (s.match.key || s.match.digits), `${s.id} no declara cómo reconocer la tecla`);
  }
});

test('no hay dos atajos con la misma combinación', () => {
  const combos = SHORTCUTS.filter(s => s.match.key).map(s => `${s.match.ctrl ? 'ctrl+' : ''}${s.match.alt ? 'alt+' : ''}${s.match.key}`);
  assert.equal(new Set(combos).size, combos.length, `combinación repetida: ${combos.join(', ')}`);
});

test('todos los grupos declarados tienen atajos', () => {
  assert.equal(shortcutsByGroup().length, SHORTCUT_GROUPS.length, 'algún grupo de atajos quedó vacío');
});

test('reconoce las combinaciones declaradas', () => {
  assert.equal(resolveShortcut({ key: 'k', ctrlKey: true })?.action, 'palette');
  assert.equal(resolveShortcut({ key: 'F1' })?.action, 'help');
  assert.equal(resolveShortcut({ key: 'm', altKey: true })?.action, 'toggle-mode');
  assert.equal(resolveShortcut({ key: 'ArrowLeft', altKey: true })?.action, 'period-prev');
  assert.equal(resolveShortcut({ key: 'z', altKey: true }), null);
});

test('Alt + número resuelve al índice de la vista', () => {
  assert.equal(resolveShortcut({ key: '3', altKey: true })?.index, 2);
  assert.equal(resolveShortcut({ key: '0', altKey: true }), null, 'no hay vista cero');
});

test('escribiendo en un campo sólo pasan los atajos con modificador, y Escape', () => {
  // Sin esto, teclear "no" en una descripción abriría un diálogo.
  assert.equal(resolveShortcut({ key: '/' }, { typing: true }), null);
  assert.equal(resolveShortcut({ key: 'escape' }, { typing: true })?.action, 'close');
  assert.equal(resolveShortcut({ key: 'k', ctrlKey: true }, { typing: true })?.action, 'palette');
});

test('keysFor devuelve las teclas de una acción conocida', () => {
  assert.equal(keysFor('palette'), 'Ctrl + K');
  assert.equal(keysFor('accion-que-no-existe'), null);
});

test('docs/ATAJOS-DE-TECLADO.md está generado y sincronizado', () => {
  const doc = read('docs/ATAJOS-DE-TECLADO.md');
  assert.match(doc, /GENERADO POR scripts\/build-shortcuts\.mjs/);
  for (const s of SHORTCUTS) {
    assert.ok(doc.includes(s.description), `el documento no describe el atajo ${s.id} — regenera con node scripts/build-shortcuts.mjs`);
  }
});

test('la app ejecuta los atajos desde el módulo, no desde una copia', () => {
  const lib = read('apps/web/src/lib/shortcuts.js');
  assert.match(lib, /from '\.\.\/core\/shortcuts\/index\.mjs'/);
  const app = read('apps/web/src/app.js');
  assert.match(app, /installShortcuts\(/, 'app.js no instala los atajos');
  assert.doesNotMatch(app, /Number\(e\.key\) - 1/, 'quedó el manejo de teclas antiguo duplicando la tabla');
});

/* ---------------------------------------------------- manuales en la app - */

test('los documentos que la app dice llevar dentro se generan de verdad', () => {
  for (const [file, minBytes] of [
    ['docs/EMPEZAR-AQUI.html', 500_000],
    ['docs/EMPEZAR-AQUI.pdf', 500_000],
    ['docs/MANUAL.html', 500_000],
    ['docs/MANUAL.pdf', 1_000_000]
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `falta ${file}`);
    assert.ok(fs.statSync(path.join(root, file)).size > minBytes, `${file} es sospechosamente pequeño`);
  }
});

test('el HTML del manual es autocontenido y sin scripts', () => {
  const html = read('docs/MANUAL.html');
  const externas = [...html.matchAll(/<img[^>]+src="(?!data:)([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(externas, [], `el manual referencia imágenes no embebidas: ${externas.join(', ')}`);
  // La política de seguridad de la app prohíbe scripts en línea: uno aquí
  // dejaría el documento a medias justo dentro de la aplicación.
  assert.doesNotMatch(html, /<script/i, 'el HTML del manual no puede llevar JavaScript');
  assert.doesNotMatch(read('docs/EMPEZAR-AQUI.html'), /<script/i, 'el HTML de la guía no puede llevar JavaScript');
});

test('el manual en HTML usa las capturas compactas, no las de densidad 2', () => {
  // Con las grandes el archivo pasaría de diez megas y engordaría el APK.
  assert.ok(fs.statSync(path.join(root, 'docs/MANUAL.html')).size < 6_000_000, 'el manual en HTML pesa demasiado para viajar en el paquete');
  assert.ok(fs.existsSync(path.join(root, 'docs/assets/compacto/panel.png')), 'falta el juego compacto de capturas');
});

test('el bundle embarca los dos manuales y la presentación', () => {
  const buildWeb = read('scripts/build-web.mjs');
  for (const asset of ['EMPEZAR-AQUI.html', 'EMPEZAR-AQUI.pdf', 'MANUAL.html', 'presentacion.html', 'PRESENTACION.pdf']) {
    assert.ok(buildWeb.includes(asset), `el bundle no embarca ${asset}`);
  }
  const view = read('apps/web/src/views/ayuda.js');
  for (const file of ['EMPEZAR-AQUI.html', 'MANUAL.html']) {
    assert.ok(view.includes(file), `la vista Ayuda no declara ${file}`);
  }
  // Ruta relativa al bundle: funciona igual servida por el navegador, dentro del
  // APK y dentro del ejecutable de Windows.
  assert.match(view, /\.\/ayuda\/\$\{doc\.file\}/, 'la vista Ayuda no abre los manuales embarcados');
  assert.match(view, /<iframe class="guiaframe"/, 'los manuales deben leerse DENTRO de la aplicación');

  // La presentación viaja en el paquete: si nada la enlaza, es peso muerto en el
  // APK y en el instalador, y quien tiene que exponer no la encuentra.
  for (const file of ['presentacion.html', 'PRESENTACION.pdf', 'PAUTA.pdf']) {
    assert.ok(view.includes(file), `la vista Ayuda no ofrece ${file}, que sí se embarca`);
  }
});

/* ------------------------------------------------------- presentación --- */

test('la presentación tiene láminas numeradas en orden y todas con pauta', () => {
  const md = read('docs/presentacion.md');
  const slides = [...md.matchAll(/^##\s+(\d+)\s*·\s*(.+)$/gm)];
  assert.ok(slides.length >= 6, `sólo hay ${slides.length} diapositivas`);
  slides.forEach((s, i) => assert.equal(Number(s[1]), i + 1, `la diapositiva ${i + 1} declara "${s[1]}"`));

  const bodies = md.split(/^##\s+\d+\s*·\s*/m).slice(1);
  for (const [i, body] of bodies.entries()) {
    assert.match(body, /\*\*Pauta\s*·\s*\d+\s*min\.?\*\*/, `la diapositiva ${i + 1} no declara su pauta con minutos`);
  }
});

test('la presentación se publica en sus formatos', () => {
  for (const file of ['presentacion.html', 'PRESENTACION.pdf', 'pauta.html', 'PAUTA.pdf']) {
    const full = path.join(root, 'docs/presentacion', file);
    assert.ok(fs.existsSync(full), `falta docs/presentacion/${file} — genérala con node scripts/build-presentation.mjs`);
    assert.ok(fs.statSync(full).size > 10_000, `docs/presentacion/${file} salió vacío`);
  }
});

test('las diapositivas declaran el aviso de que la app no presenta ni paga', () => {
  // Es la aclaración que evita el malentendido más caro del producto: si no está
  // en la presentación, alguien se va creyendo que declara por él.
  const md = read('docs/presentacion.md');
  assert.match(md, /no presenta ni paga/i);
});
