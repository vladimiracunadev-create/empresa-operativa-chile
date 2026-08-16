#!/usr/bin/env node
/**
 * Compila `docs/presentacion.md` en la muestra del producto:
 *
 *   docs/presentacion/presentacion.html → diapositivas 16:9 para proyectar
 *   docs/presentacion/PRESENTACION.pdf  → las mismas, sin conexión
 *   docs/presentacion/pauta.html        → pauta del expositor (guion + tiempos)
 *   docs/presentacion/PAUTA.pdf
 *
 * La fuente es UNA sola: cada sección `## N · Título` es una diapositiva, su
 * cuerpo es lo que se proyecta y la cita final (`> **Pauta · N min.**`) es lo
 * que dice quien expone. Tenerlas en el mismo archivo evita el problema clásico
 * de las presentaciones: el guion y las láminas se separan a la segunda edición
 * y acaban contando cosas distintas.
 *
 * Sin dependencias: usa el conversor de `scripts/lib/markdown.mjs` y Chrome.
 * `--check` valida la estructura sin generar nada; CI lo ejecuta así.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToHtml, embedFrom, esc } from './lib/markdown.mjs';
import { printPdf } from './lib/chrome.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs');
const outDir = path.join(docsDir, 'presentacion');
const source = path.join(docsDir, 'presentacion.md');

const check = process.argv.includes('--check');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const SITE = 'vladimiracunadev-create.github.io/empresa-operativa-chile';
const embed = embedFrom(docsDir);

/* ------------------------------------------------- leer y trocear -------- */

const slides = [];
let current = null;

for (const line of fs.readFileSync(source, 'utf8').split(/\r?\n/)) {
  const heading = /^##\s+(\d+)\s*·\s*(.+?)\s*$/.exec(line);
  if (heading) {
    current = { n: Number(heading[1]), title: heading[2], body: [], notes: [] };
    slides.push(current);
    continue;
  }
  // Cualquier otro `## ` cierra la lámina en curso: las secciones de
  // introducción del documento (sin número) no son diapositivas.
  if (/^##\s/.test(line)) {
    current = null;
    continue;
  }
  if (!current) continue;
  if (/^>\s?/.test(line)) current.notes.push(line.replace(/^>\s?/, ''));
  else current.body.push(line);
}

if (slides.length < 6) throw new Error(`docs/presentacion.md sólo define ${slides.length} diapositivas: se esperaban al menos 6.`);

slides.forEach((s, i) => {
  if (s.n !== i + 1) throw new Error(`Diapositivas mal numeradas: la ${i + 1}.ª declara "${s.n}".`);
  if (!s.notes.length) throw new Error(`La diapositiva ${s.n} (${s.title}) no tiene pauta del expositor.`);
});

// Los minutos se declaran en cada pauta; la duración total se calcula, no se
// escribe a mano, para que no envejezca al añadir una lámina.
for (const s of slides) {
  const text = s.notes.join('\n').trim();
  const min = /\*\*Pauta\s*·\s*(\d+)\s*min\.?\*\*/.exec(text);
  if (!min) throw new Error(`La diapositiva ${s.n} no declara los minutos: usa "> **Pauta · N min.** …".`);
  s.minutes = Number(min[1]);
  s.script = text.replace(/\*\*Pauta\s*·\s*\d+\s*min\.?\*\*\s*/, '');
}

const duration = slides.reduce((total, s) => total + s.minutes, 0);

if (check) {
  console.log(`Presentación válida: ${slides.length} diapositivas, ${duration} minutos.`);
  process.exit(0);
}

/* ------------------------------------------------------ diapositivas ----- */

const bodyHtml = s => {
  const html = markdownToHtml(s.body.join('\n').trim(), { resolveImage: embed });
  // El primer párrafo en negrita es la frase de entrada de la lámina: se compone
  // más grande y en color de acento, no como un párrafo más.
  return html.replace(/^<p><strong>([\s\S]*?)<\/strong><\/p>/, '<p class="lead">$1</p>');
};

/** Una tabla larga o una lista de ocho puntos no caben con el cuerpo por defecto. */
const density = html => ((html.match(/<tr>/g) ?? []).length >= 6 || (html.match(/<li>/g) ?? []).length >= 7 ? ' densa' : '');

const DECK_CSS = `
  :root { --tinta:#0d1826; --suave:#6b7a94; --acento:#2563eb; --verde:#047857; --linea:#dde3ed; }
  * { box-sizing:border-box; }
  html, body { margin:0; padding:0; background:#20242c; }
  body { font-family:"Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif; color:#0d1826; }
  .slide { width:1280px; height:720px; background:#fff; position:relative; overflow:hidden;
           page-break-after:always; break-after:page; margin:0 auto 24px; padding:46px 72px 92px;
           display:flex; flex-direction:column; }
  .slide:last-child { page-break-after:auto; break-after:auto; margin-bottom:0; }
  .slide::before { content:""; position:absolute; inset:0 0 auto 0; height:10px;
                   background:linear-gradient(90deg,#4f8cff,#34d399); }
  .tope { display:flex; justify-content:space-between; align-items:center; font-size:19px; color:#6b7a94; }
  .tope .marca { font-weight:600; }
  h2 { font-size:52px; line-height:1.1; margin:26px 0 0; letter-spacing:-.015em; }
  h2::after { content:""; display:block; width:104px; height:7px; border-radius:4px; background:#4f8cff; margin-top:18px; }
  .zona { flex:1; min-height:0; overflow:hidden; display:flex; align-items:flex-start; margin-top:24px; }
  .contenido { width:100%; flex:0 0 auto; transform-origin:top left; }
  .lead { font-size:33px; line-height:1.32; font-weight:700; color:#1d4ed8; margin:0 0 22px; }
  .contenido p { font-size:28px; line-height:1.42; margin:0 0 18px; }
  .contenido ul, .contenido ol { font-size:29px; line-height:1.42; margin:0; padding-left:1.15em; }
  .contenido li { margin-bottom:15px; }
  .contenido li::marker { color:#4f8cff; }
  .contenido code { font-family:"Cascadia Mono",Consolas,monospace; font-size:.86em;
                    background:#eef1f7; color:#b5265f; padding:.1em .32em; border-radius:5px; }
  .contenido table { border-collapse:collapse; width:100%; font-size:25px; }
  .contenido th, .contenido td { border-bottom:2px solid #dde3ed; padding:11px 16px; text-align:left; }
  .contenido th { background:#eef3fb; font-size:22px; text-transform:uppercase; letter-spacing:.04em; color:#6b7a94; }
  .contenido .tablewrap { overflow:visible; }
  .contenido.densa .lead { font-size:30px; margin-bottom:16px; }
  .contenido.densa ul, .contenido.densa ol { font-size:26px; }
  .contenido.densa li { margin-bottom:10px; }
  .contenido.densa table { font-size:23px; }
  .contenido.densa th, .contenido.densa td { padding:7px 14px; }
  .pie { position:absolute; left:72px; right:72px; bottom:26px; display:flex; justify-content:space-between;
         font-size:16px; color:#6b7a94; border-top:2px solid #dde3ed; padding-top:12px; }
  .slide.portada { justify-content:center; text-align:center;
                   background:linear-gradient(160deg,#0b1017 0%,#132038 60%,#1b2c4d 100%); color:#fff; }
  .slide.portada .tope, .slide.portada .pie { color:#9fb2d0; border-color:#2a3f63; }
  .slide.portada h2 { font-size:76px; margin:0; color:#fff; }
  .slide.portada h2::after { margin:26px auto 0; background:#34d399; }
  /* La portada no se recorta: flex:0 con overflow:hidden dejaría la zona a
     altura cero y el contenido invisible. Aquí crece con lo que tiene. */
  .slide.portada .zona { flex:0 0 auto; overflow:visible; justify-content:center; margin-top:26px; }
  .slide.portada .contenido { max-width:960px; }
  .slide.portada .lead { color:#7aa7ff; font-size:36px; }
  .slide.portada .contenido ul { list-style:none; padding:0; }
  .slide.portada .contenido li { color:#e3ebf7; }
  .slide.portada .contenido strong { color:#fff; }
  @page { size:1280px 720px; margin:0; }
  @media print { body { background:#fff; } .slide { margin:0; } }
`;

const deckSlides = slides
  .map(s => {
    const body = bodyHtml(s);
    return `
<section class="slide${s.n === 1 ? ' portada' : ''}">
  <div class="tope"><span class="marca">${s.n === 1 ? '🎤 Presentación del producto' : '🏢 Empresa Operativa Chile'}</span><span>${s.n} / ${slides.length}</span></div>
  <h2>${esc(s.title)}</h2>
  <div class="zona"><div class="contenido${density(body)}">${body}</div></div>
  <div class="pie"><span>v${version} · ${duration} min · Android · Windows · Web</span><span>${SITE}</span></div>
</section>`;
  })
  .join('\n');

/**
 * Ajuste de escala: una lámina que se pasa de alto se encoge en bloque en vez
 * de desbordar y perder la última línea al imprimir. Se hace en el navegador,
 * que es el único que sabe cuánto ocupa el texto de verdad.
 */
const FIT = `
<script>
(function () {
  document.querySelectorAll('.slide').forEach(function (slide) {
    if (slide.classList.contains('portada')) return;
    var zona = slide.querySelector('.zona');
    var caja = slide.querySelector('.contenido');
    if (!zona || !caja) return;
    var disponible = zona.clientHeight - 2;
    if (disponible <= 0 || caja.scrollHeight <= disponible) return;

    function aplicar(e) {
      caja.style.transform = e < 1 ? 'scale(' + e + ')' : '';
      caja.style.width = (100 / e) + '%';
    }
    var segura = Math.max(0.62, disponible / caja.scrollHeight);
    aplicar(segura);
    var alta = 1;
    for (var i = 0; i < 5 && alta - segura > 0.015; i++) {
      var media = (segura + alta) / 2;
      aplicar(media);
      if (caja.scrollHeight * media <= disponible) segura = media;
      else alta = media;
    }
    aplicar(segura);
  });
})();
</script>`;

const deck = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Empresa Operativa Chile · Presentación</title><style>${DECK_CSS}</style></head>
<body>${deckSlides}${FIT}</body></html>`;

/* ------------------------------------------------------------- pauta ----- */

const PAUTA_CSS = `
  @page { size:A4; margin:16mm 15mm 18mm; }
  body { font-family:"Segoe UI",system-ui,Arial,sans-serif; font-size:11pt; line-height:1.55; color:#16202e; margin:0;
         -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  h1 { font-size:26pt; margin:0 0 6px; }
  .sub { color:#4a5a72; font-size:12pt; margin-bottom:26px; }
  .lamina { page-break-inside:avoid; border-top:2px solid #dde3ed; padding-top:14px; margin-top:20px; }
  .lamina h2 { font-size:15pt; margin:0 0 4px; color:#0d1826; }
  .meta { font-size:9.5pt; color:#6b7a94; margin-bottom:10px; }
  .cols { display:grid; grid-template-columns:1fr 1.25fr; gap:18px; }
  .caja { border:1px solid #dde3ed; border-radius:8px; padding:11px 13px; }
  .caja h3 { font-size:9pt; text-transform:uppercase; letter-spacing:.07em; color:#6b7a94; margin:0 0 7px; }
  .caja--pantalla { background:#f6f8fb; }
  .caja--guion { background:#fffdf5; border-color:#e5c07b; }
  .caja p, .caja li { font-size:9.6pt; line-height:1.5; }
  .caja ul, .caja ol { margin:0; padding-left:17px; }
  .caja table { width:100%; border-collapse:collapse; font-size:8.6pt; }
  .caja th, .caja td { border:1px solid #dde3ed; padding:4px 6px; text-align:left; }
  .caja .tablewrap { overflow:visible; }
  code { font-family:"Cascadia Mono",Consolas,monospace; font-size:.9em; background:#eef1f7; padding:1px 4px; border-radius:4px; }
  .total { margin-top:24px; padding:12px 15px; background:#eef3fb; border-radius:8px; font-size:10pt; }
`;

const pauta = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Pauta del expositor · Empresa Operativa Chile</title>
<style>${PAUTA_CSS}</style></head><body>
<h1>Pauta del expositor</h1>
<div class="sub">Empresa Operativa Chile · v${version} · ${slides.length} diapositivas · ${duration} minutos</div>
${slides
  .map(
    s => `
<div class="lamina">
  <h2>${s.n} · ${esc(s.title)}</h2>
  <div class="meta">${s.minutes} min · acumulado ${slides.slice(0, s.n).reduce((t, x) => t + x.minutes, 0)} min</div>
  <div class="cols">
    <div class="caja caja--pantalla"><h3>Lo que se ve proyectado</h3>${bodyHtml(s)}</div>
    <div class="caja caja--guion"><h3>Lo que dices</h3>${markdownToHtml(s.script, { resolveImage: embed })}</div>
  </div>
</div>`
  )
  .join('')}
<div class="total">
  <strong>Duración estimada: ${duration} minutos</strong> sin contar preguntas.
  Reserva otros 10 para el turno de preguntas: en este tema siempre aparecen casos concretos del público.
</div>
</body></html>`;

/* ------------------------------------------------------------ escribir --- */

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'presentacion.html'), deck);
fs.writeFileSync(path.join(outDir, 'pauta.html'), pauta);

const deckPdf = printPdf({ html: deck, out: path.join(outDir, 'PRESENTACION.pdf'), timeBudget: 12000 });
const pautaPdf = printPdf({ html: pauta, out: path.join(outDir, 'PAUTA.pdf'), timeBudget: 12000 });

console.log(`docs/presentacion/presentacion.html — ${slides.length} diapositivas`);
console.log(`docs/presentacion/PRESENTACION.pdf  — ${(deckPdf.bytes / 1024).toFixed(0)} KB, ${deckPdf.pages} páginas`);
console.log(`docs/presentacion/PAUTA.pdf         — ${(pautaPdf.bytes / 1024).toFixed(0)} KB, ${pautaPdf.pages} páginas`);
console.log(`Duración declarada: ${duration} minutos.`);
