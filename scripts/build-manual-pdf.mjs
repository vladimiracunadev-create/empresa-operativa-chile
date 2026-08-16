#!/usr/bin/env node
/**
 * Genera `docs/MANUAL.pdf` desde `docs/MANUAL.md`.
 *
 * Sin dependencias: el conversor Markdown → HTML y el envoltorio de Chrome
 * viven en `scripts/lib/`, compartidos con la guía `EMPEZAR-AQUI`. Se eligió
 * Chrome sobre una librería de PDF porque ya está en la máquina, compone
 * tipografía de verdad y renderiza los SVG de los diagramas y las capturas PNG
 * sin conversiones intermedias.
 *
 * Las imágenes se embeben como data URI: el HTML intermedio es un único archivo
 * y el PDF no depende de rutas relativas que se rompan al moverlo.
 *
 *   node scripts/build-manual-pdf.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToHtml, embedFrom } from './lib/markdown.mjs';
import { printPdf } from './lib/chrome.mjs';
import { PRINT_CSS } from './lib/print-style.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const source = path.join(docsDir, 'MANUAL.md');
const pdfOut = path.join(docsDir, 'MANUAL.pdf');

const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const embed = embedFrom(docsDir);
const md = fs.readFileSync(source, 'utf8');

// La portada del PDF se compone aquí: la del Markdown está pensada para GitHub
// (insignias que enlazan) y no aporta nada impreso.
const bodyMd = md.slice(md.indexOf('## 🧭 Contenido'));

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Manual de usuario · Empresa Operativa Chile</title>
<style>${PRINT_CSS}</style></head><body>
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
</div>
${markdownToHtml(bodyMd, { resolveImage: embed })}
</body></html>`;

const { bytes, pages } = printPdf({ html, out: pdfOut });
console.log(`docs/MANUAL.pdf — ${(bytes / 1024 / 1024).toFixed(1)} MB, ${pages} páginas`);
