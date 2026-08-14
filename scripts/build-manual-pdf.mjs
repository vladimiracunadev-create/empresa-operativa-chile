#!/usr/bin/env node
/**
 * Genera `docs/MANUAL.pdf` desde `docs/MANUAL.md`.
 *
 * Sin dependencias: un conversor Markdown → HTML suficiente para ESTE documento
 * (no un motor Markdown general) y Chrome en modo headless para imprimir. Se
 * eligió Chrome sobre una librería de PDF porque ya está en la máquina, compone
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
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const source = path.join(docsDir, 'MANUAL.md');
const pdfOut = path.join(docsDir, 'MANUAL.pdf');

/* ------------------------------------------------------------ Chrome ----- */

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

/* ------------------------------------------------------- utilidades ------ */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

const dataUri = relPath => {
  const file = path.join(docsDir, relPath);
  if (!fs.existsSync(file)) throw new Error(`El manual referencia una imagen que no existe: ${relPath}`);
  const mime = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
};

/** Ancla al estilo GitHub, para que el índice del manual funcione en el PDF. */
const slug = text =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

/** Formato en línea: negrita, cursiva, código, enlaces e imágenes. */
function inline(text) {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
    src.startsWith('http') ? '' : `<img src="${dataUri(src)}" alt="${alt}">`
  );
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
    href.startsWith('#') ? `<a href="${href}">${label}</a>` : `<span class="link">${label}</span>`
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>');
  return out;
}

const ALERTS = {
  NOTE: ['ℹ️', 'Nota', 'note'],
  TIP: ['💡', 'Consejo', 'tip'],
  IMPORTANT: ['❗', 'Importante', 'important'],
  WARNING: ['⚠️', 'Advertencia', 'warning'],
  CAUTION: ['🛑', 'Precaución', 'warning']
};

/* --------------------------------------------------------- conversor ----- */

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  const closeList = state => {
    if (state.list) {
      out.push(`</${state.list}>`);
      state.list = null;
    }
  };
  const state = { list: null };

  while (i < lines.length) {
    let line = lines[i];

    // Bloques HTML crudos: galerías de capturas y las anclas `<a id="cap-N">`
    // que hacen que el índice funcione igual en GitHub y en el PDF.
    if (/^<(div|table|details|img|sub|tr|td|th|a)\b/.test(line.trim())) {
      closeList(state);
      const block = [];
      let depth = 0;
      do {
        block.push(lines[i]);
        depth += (lines[i].match(/<(div|table|details)\b/g) ?? []).length;
        depth -= (lines[i].match(/<\/(div|table|details)>/g) ?? []).length;
        i++;
      } while (i < lines.length && depth > 0);
      out.push(
        block
          .join('\n')
          .replace(/<img src="([^"]+)"/g, (m, src) => (src.startsWith('http') ? m : `<img src="${dataUri(src)}"`))
          .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
          .replace(/!\[[^\]]*\]\(https?:[^)]*\)/g, '')
      );
      continue;
    }

    // Avisos de GitHub
    const alert = line.match(/^>\s*\[!(\w+)\]/);
    if (alert && ALERTS[alert[1]]) {
      closeList(state);
      const [icon, label, cls] = ALERTS[alert[1]];
      i++;
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(
        `<div class="alert alert--${cls}"><div class="alert__head">${icon} ${label}</div>` +
          `<p>${inline(body.join(' ').trim())}</p></div>`
      );
      continue;
    }

    // Cita simple
    if (line.startsWith('> ')) {
      closeList(state);
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${body.filter(Boolean).map(b => `<p>${inline(b)}</p>`).join('')}</blockquote>`);
      continue;
    }

    // Código
    if (line.startsWith('```')) {
      closeList(state);
      const lang = line.slice(3).trim();
      i++;
      const code = [];
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]), i++;
      i++;
      out.push(`<pre class="code" data-lang="${esc(lang)}"><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }

    // Tabla
    if (line.includes('|') && lines[i + 1]?.match(/^\s*\|?[\s:|-]+\|/)) {
      closeList(state);
      const cells = row => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(line);
      const align = cells(lines[i + 1]).map(a => (a.startsWith(':') && a.endsWith(':') ? 'center' : a.endsWith(':') ? 'right' : 'left'));
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) body.push(cells(lines[i])), i++;
      out.push(
        `<table><thead><tr>${head.map((h, n) => `<th style="text-align:${align[n] ?? 'left'}">${inline(h)}</th>`).join('')}</tr></thead>` +
          `<tbody>${body
            .map(r => `<tr>${r.map((c, n) => `<td style="text-align:${align[n] ?? 'left'}">${inline(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`
      );
      continue;
    }

    // Encabezados
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList(state);
      const level = heading[1].length;
      const text = heading[2].replace(/\s*\{#.*\}$/, '');
      out.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // Separador
    if (/^---+$/.test(line.trim())) {
      closeList(state);
      out.push('<hr>');
      i++;
      continue;
    }

    // Listas (incluidas las de casillas)
    const item = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (item) {
      const tag = /\d/.test(item[1]) ? 'ol' : 'ul';
      if (state.list !== tag) {
        closeList(state);
        out.push(`<${tag}>`);
        state.list = tag;
      }
      const checkbox = item[2].match(/^\[( |x)\]\s+(.*)$/i);
      out.push(
        checkbox
          ? `<li class="task"><span class="box">${checkbox[1].toLowerCase() === 'x' ? '✓' : ''}</span>${inline(checkbox[2])}</li>`
          : `<li>${inline(item[2])}</li>`
      );
      i++;
      continue;
    }

    if (!line.trim()) {
      closeList(state);
      i++;
      continue;
    }

    closeList(state);
    // Párrafo: se unen las líneas contiguas.
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^([-*#>|]|\d+\.|```|<)/.test(lines[i].trim())) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }

  closeList(state);
  return out.join('\n');
}

/* ------------------------------------------------------------- estilo --- */

const CSS = `
  @page { size: A4; margin: 16mm 14mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.55; color: #16202e; margin: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1, h2, h3, h4 { color: #0d1826; line-height: 1.25; letter-spacing: -0.01em; }
  /* Cada capítulo empieza en página nueva: un manual que se lee a saltos lo agradece. */
  h2 { font-size: 18pt; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2.5px solid #4f8cff; page-break-before: always; }
  h2:first-of-type { page-break-before: avoid; }
  h1 { font-size: 26pt; margin: 0 0 10px; }
  h3 { font-size: 13pt; margin: 20px 0 8px; color: #1d4ed8; }
  h4 { font-size: 11.5pt; margin: 16px 0 6px; }
  h2, h3, h4 { page-break-after: avoid; }
  p { margin: 0 0 9px; }
  a { color: #1d4ed8; text-decoration: none; }
  .link { color: #1d4ed8; }
  hr { border: 0; border-top: 1px solid #dde3ed; margin: 18px 0; }
  code { font-family: "Cascadia Mono", Consolas, monospace; font-size: 9pt;
         background: #eef1f7; padding: 1px 5px; border-radius: 4px; color: #b5265f; }
  pre.code { background: #0f1521; color: #e8edf5; padding: 12px 14px; border-radius: 8px;
             font-size: 8.8pt; line-height: 1.45; overflow: hidden; page-break-inside: avoid; }
  pre.code code { background: none; color: inherit; padding: 0; }

  table { width: 100%; border-collapse: collapse; margin: 10px 0 14px; font-size: 9.4pt;
          page-break-inside: avoid; }
  th { background: #eef3fb; color: #0d1826; font-weight: 650; text-align: left;
       padding: 7px 9px; border: 1px solid #d5dde9; }
  td { padding: 6px 9px; border: 1px solid #e2e8f2; vertical-align: top; }
  tr:nth-child(even) td { background: #fafbfd; }
  td img { width: 100%; height: auto; border-radius: 5px; border: 1px solid #d5dde9; }

  img { max-width: 100%; height: auto; display: block; margin: 12px auto;
        border-radius: 7px; page-break-inside: avoid; }
  /* Las capturas llevan marco; los diagramas SVG no lo necesitan. */
  p > img[src^="data:image/png"] { border: 1px solid #ccd5e3; box-shadow: 0 2px 8px rgba(16,24,40,0.1); }

  ul, ol { margin: 0 0 10px; padding-left: 20px; }
  li { margin-bottom: 4px; }
  li.task { list-style: none; margin-left: -18px; }
  li.task .box { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #8494ac;
                 border-radius: 3px; margin-right: 8px; text-align: center; line-height: 11px;
                 font-size: 9px; color: #047857; vertical-align: -1px; }

  blockquote { margin: 12px 0; padding: 10px 16px; border-left: 3px solid #8494ac;
               background: #f6f8fb; color: #3d4a5f; page-break-inside: avoid; }
  blockquote p:last-child { margin-bottom: 0; }

  .alert { margin: 12px 0; padding: 11px 14px; border-radius: 8px; border-left-width: 4px;
           border-left-style: solid; page-break-inside: avoid; }
  .alert__head { font-weight: 700; font-size: 9.6pt; margin-bottom: 4px; }
  .alert p { margin: 0; }
  .alert--note      { background: #eef3fb; border-color: #2563eb; }
  .alert--tip       { background: #ecfaf3; border-color: #047857; }
  .alert--important { background: #f3eefb; border-color: #7c3aed; }
  .alert--warning   { background: #fef5e9; border-color: #b45309; }

  details { margin: 7px 0; border: 1px solid #dde3ed; border-radius: 7px; padding: 9px 12px;
            page-break-inside: avoid; background: #fbfcfe; }
  details summary { font-weight: 620; margin-bottom: 6px; list-style: none; }
  details p { margin: 5px 0 0; }

  .portada { text-align: center; page-break-after: always; padding-top: 34mm; }
  .portada img { max-width: 100%; margin-bottom: 26px; }
  .portada h1 { font-size: 32pt; margin-bottom: 6px; }
  .portada .sub { font-size: 13pt; color: #4a5a72; margin-bottom: 30px; }
  .portada .meta { font-size: 9.5pt; color: #6b7a94; line-height: 1.9; }
  .portada .aviso { margin: 34px auto 0; max-width: 132mm; padding: 14px 18px;
                    border: 1px solid #e5c07b; background: #fef8ec; border-radius: 9px;
                    font-size: 9.5pt; color: #6b4a12; text-align: left; }
  sub { font-size: 8.6pt; color: #6b7a94; }
`;

/* --------------------------------------------------------------- main --- */

const md = fs.readFileSync(source, 'utf8');

// La portada del PDF se compone aquí: la del Markdown está pensada para GitHub
// (insignias que enlazan) y no aporta nada impreso.
const bodyMd = md.slice(md.indexOf('## 🧭 Contenido'));

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Manual de usuario · Empresa Operativa Chile</title>
<style>${CSS}</style></head><body>
<div class="portada">
  <img src="${dataUri('assets/banner.svg')}" alt="Empresa Operativa Chile">
  <h1>Manual de usuario</h1>
  <div class="sub">Empresa Operativa Chile · versión 1.0.0</div>
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
${markdownToHtml(bodyMd)}
</body></html>`;

const tmpHtml = path.join(os.tmpdir(), `manual-eoc-${process.pid}.html`);
fs.writeFileSync(tmpHtml, html);

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'eoc-pdf-'));
execFileSync(
  findBrowser(),
  [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--user-data-dir=${profile}`,
    '--virtual-time-budget=15000',
    `--print-to-pdf=${pdfOut}`,
    `file:///${tmpHtml.replace(/\\/g, '/')}`
  ],
  { stdio: 'pipe' }
);

fs.rmSync(profile, { recursive: true, force: true });
if (!process.env.EOC_KEEP_HTML) fs.rmSync(tmpHtml, { force: true });
else console.log(`HTML intermedio: ${tmpHtml}`);

if (!fs.existsSync(pdfOut) || fs.statSync(pdfOut).size < 100_000) {
  throw new Error('El PDF salió vacío o demasiado pequeño: probablemente no se embebieron las imágenes.');
}

const kb = fs.statSync(pdfOut).size / 1024;
const paginas = (fs.readFileSync(pdfOut).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`docs/MANUAL.pdf — ${(kb / 1024).toFixed(1)} MB, ${paginas} páginas`);
