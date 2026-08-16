#!/usr/bin/env node
/**
 * Genera el manual de usuario en sus dos formatos publicables desde
 * `docs/MANUAL.md`:
 *
 *   docs/MANUAL.pdf   capturas a densidad 2, para leer en pantalla grande e imprimir
 *   docs/MANUAL.html  capturas compactas, autocontenido; se lee DENTRO de la app
 *
 * La diferencia de imágenes no es un descuido: el PDF se descarga una vez y
 * puede pesar; el HTML viaja dentro del APK y del ejecutable de Windows, y con
 * las capturas a densidad 2 pasaría de diez megas. `assets/compacto/` tiene las
 * mismas imágenes a densidad 1 y algo más angostas — una fracción del peso,
 * perfectamente legibles al tamaño en que se leen.
 *
 * Sin dependencias: el conversor Markdown y el envoltorio de Chrome viven en
 * `scripts/lib/`, compartidos con la guía «Empezar aquí».
 *
 *   node scripts/build-manual.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToHtml, embedFrom } from './lib/markdown.mjs';
import { printPdf } from './lib/chrome.mjs';
import { PRINT_CSS, SCREEN_CSS } from './lib/print-style.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const source = path.join(docsDir, 'MANUAL.md');
const pdfOut = path.join(docsDir, 'MANUAL.pdf');
const htmlOut = path.join(docsDir, 'MANUAL.html');

const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const embed = embedFrom(docsDir);

/**
 * Misma imagen, versión compacta. Si alguna no existe todavía, cae a la de
 * densidad 2: es preferible un HTML pesado a un HTML con un hueco.
 */
const embedCompact = src => {
  const compact = src.replace('assets/capturas/', 'assets/compacto/');
  return fs.existsSync(path.join(docsDir, compact)) ? embed(compact) : embed(src);
};

const md = fs.readFileSync(source, 'utf8');

// La portada del Markdown está pensada para GitHub (insignias que enlazan) y no
// aporta nada ni impresa ni dentro de la app: ambos formatos componen la suya.
const bodyMd = md.slice(md.indexOf('## 🧭 Contenido'));

const portada = `
<div class="portada">
  <img src="${embed('assets/banner.svg')}" alt="Empresa Operativa Chile">
  <h1>Manual de usuario</h1>
  <div class="sub">Empresa Operativa Chile · versión ${version}</div>
  <div class="meta">
    Crear, operar y controlar una empresa chilena a través del tiempo<br>
    Reglas del año comercial 2026, verificadas el 9 de agosto de 2026<br>
    MIT © Vladimir Acuña
  </div>
  <div class="aviso">
    <strong>Antes de empezar.</strong> Este manual no es asesoría tributaria ni contable.
    La aplicación no presenta ni paga nada ante el SII: calcula, controla y guarda evidencia,
    mientras la presentación ocurre en los sistemas oficiales. Cuando la aplicación y el SII no
    coincidan, manda el SII.
  </div>
</div>`;

/* --------------------------------------------------------------- PDF ---- */

const pdfHtml = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Manual de usuario · Empresa Operativa Chile</title>
<style>${PRINT_CSS}</style></head><body>
${portada}
${markdownToHtml(bodyMd, { resolveImage: embed })}
</body></html>`;

const { bytes, pages } = printPdf({ html: pdfHtml, out: pdfOut });

/* -------------------------------------------------------------- HTML ---- */

// Índice lateral construido desde los encabezados de capítulo del propio
// documento: el manual es escrito a mano, así que aquí no hay datos de los que
// derivarlo, pero sí sus `<a id="cap-N">`.
const chapters = [...md.matchAll(/<a id="(cap-[\w-]+)"><\/a>\s*\n\s*\n##\s+(.+)/g)].map(m => ({
  id: m[1],
  title: m[2].replace(/^[\d.b]+\s*·\s*/, '').trim()
}));

const html = `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual de usuario · Empresa Operativa Chile</title>
<style>${SCREEN_CSS}</style>
</head><body>
<div class="doc__bar">
  <b>📘 Manual de usuario · Empresa Operativa Chile v${version}</b>
  <a href="MANUAL.pdf" download>Descargar PDF</a>
</div>
<div class="doc">
  <nav class="doc__toc" aria-label="Índice">
    <h2>Capítulos</h2>
    ${chapters.map(c => `<a href="#${c.id}">${c.title}</a>`).join('')}
  </nav>
  <main class="doc__body">${markdownToHtml(bodyMd, { resolveImage: embedCompact, linkExternal: true })}</main>
</div>
</body></html>`;
// Sin JavaScript, igual que la guía: este HTML se abre dentro de la aplicación,
// cuya política de seguridad prohíbe scripts en línea.

fs.writeFileSync(htmlOut, html);

console.log(`docs/MANUAL.pdf  — ${(bytes / 1024 / 1024).toFixed(1)} MB, ${pages} páginas`);
console.log(`docs/MANUAL.html — ${(fs.statSync(htmlOut).size / 1024 / 1024).toFixed(1)} MB (autocontenido, ${chapters.length} capítulos)`);
