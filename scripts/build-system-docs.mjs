#!/usr/bin/env node
/**
 * Genera los PDF de `docs/system-documentation/`.
 *
 * Un PDF por documento más un consolidado, todos en `docs/system-documentation/pdf/`.
 * El Markdown es la única fuente: aquí no se escribe contenido, sólo se compone.
 *
 * Lo específico de esta serie frente al manual y la guía son los **diagramas
 * Mermaid**. GitHub los renderiza solo; un PDF no. Este script los rasteriza a
 * SVG con `mmdc` (@mermaid-js/mermaid-cli) y los cachea por hash del contenido
 * en `assets/diagramas/`, de modo que regenerar sin tocar un diagrama no vuelve
 * a invocar el rasterizador — que es, con diferencia, el paso más lento.
 *
 * Si `mmdc` no está instalado, el script NO falla: deja los diagramas como
 * bloques de código y lo avisa. Un PDF con un diagrama en texto es peor que uno
 * con el diagrama dibujado, pero mucho mejor que ningún PDF.
 *
 *   node scripts/build-system-docs.mjs             # todos + el consolidado
 *   node scripts/build-system-docs.mjs --only 03   # sólo el 03, para iterar rápido
 *   node scripts/build-system-docs.mjs --no-diagrams
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { markdownToHtml, embedFrom } from './lib/markdown.mjs';
import { printPdf } from './lib/chrome.mjs';
import { PRINT_CSS } from './lib/print-style.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'docs/system-documentation');
const pdfDir = path.join(docsDir, 'pdf');
const diagramDir = path.join(docsDir, 'assets/diagramas');

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const noDiagrams = process.argv.includes('--no-diagrams');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

/** El commit se lee de git, no se escribe a mano: una portada mentirosa es peor que ninguna. */
const commit = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, stdio: 'pipe' }).toString().trim();
  } catch {
    return 'sin control de versiones';
  }
})();

const analysisDate = (() => {
  try {
    const raw = fs.readFileSync(path.join(docsDir, 'README.md'), 'utf8');
    return raw.match(/Fecha del análisis \|\s*([0-9-]+)/)?.[1] ?? 'no declarada';
  } catch {
    return 'no declarada';
  }
})();

/* ------------------------------------------------------------ diagramas --- */

/**
 * Localiza el rasterizador de Mermaid y devuelve cómo invocarlo.
 *
 * En Windows el ejecutable del PATH es un `.cmd`, y Node se niega a lanzarlo
 * sin `shell: true` — que a su vez concatena los argumentos sin escapar. En vez
 * de aceptar ese trato se resuelve el script real de Node y se ejecuta con
 * `process.execPath`, igual que `chrome.mjs` invoca al navegador por su ruta
 * absoluta: sin shell de por medio no hay nada que escapar.
 */
function findMmdc() {
  const isWin = process.platform === 'win32';
  const exe = isWin ? 'mmdc.cmd' : 'mmdc';
  for (const dir of (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(dir, exe);
    if (!fs.existsSync(candidate)) continue;

    // Layout estándar de un paquete global de npm: el lanzador y `node_modules`
    // son hermanos.
    const pkgJson = path.join(dir, 'node_modules/@mermaid-js/mermaid-cli/package.json');
    if (fs.existsSync(pkgJson)) {
      const bin = JSON.parse(fs.readFileSync(pkgJson, 'utf8')).bin?.mmdc;
      if (bin) {
        return { bin: process.execPath, prefix: [path.resolve(path.dirname(pkgJson), bin)] };
      }
    }
    // Fuera de Windows el lanzador es el propio script con shebang.
    if (!isWin) return { bin: candidate, prefix: [] };
  }
  return null;
}

const mmdc = noDiagrams ? null : findMmdc();

const mmdcAvailable = (() => {
  if (!mmdc) return false;
  try {
    execFileSync(mmdc.bin, [...mmdc.prefix, '--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

/**
 * Un SVG de Mermaid trae `width="100%"` y su tamaño real sólo en un `style`.
 * Dentro de un `<img>` con data URI eso deja la altura sin resolver y el
 * diagrama se colapsa. Se le fijan ancho y alto explícitos desde el `viewBox`.
 */
function pinSvgSize(svg) {
  const box = svg.match(/viewBox="([\d.\s-]+)"/);
  if (!box) return { svg, width: null };
  // viewBox = "minX minY ancho alto": el ancho es el tercer valor, no el cuarto.
  const [, , w, h] = box[1].trim().split(/\s+/).map(Number);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return { svg, width: null };
  const pinned = svg
    .replace(/\swidth="[^"]*"/, ` width="${Math.round(w)}"`)
    .replace(/\sheight="[^"]*"/, ` height="${Math.round(h)}"`)
    .replace(/style="max-width:[^"]*"/, 'style="max-width:100%"');
  return { svg: pinned, width: w };
}

/**
 * Ancho útil de una A4 con los márgenes de `PRINT_CSS` (16mm/14mm), en píxeles
 * CSS a 96 ppp. Un diagrama más ancho que esto se imprime reducido, y a partir
 * de cierto factor su texto deja de leerse: el prompt de esta serie exige que
 * no haya diagramas ilegibles, así que el generador avisa en vez de dejarlo
 * pasar en silencio.
 */
const A4_CONTENT_PX = Math.round(((210 - 14 * 2) / 25.4) * 96);
const MIN_LEGIBLE_SCALE = 0.45;

/**
 * Rasteriza un diagrama y devuelve su ruta relativa a `docsDir`.
 * El nombre sale del hash del código: el mismo diagrama nunca se rasteriza dos
 * veces, y cambiar una flecha produce un archivo nuevo sin dejar huérfano el
 * anterior hasta que alguien lo borre.
 */
function renderDiagram(code) {
  const hash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 12);
  const rel = `assets/diagramas/mermaid-${hash}.svg`;
  const out = path.join(docsDir, rel);
  if (fs.existsSync(out)) {
    return { rel, width: widthOf(fs.readFileSync(out, 'utf8')) };
  }

  fs.mkdirSync(diagramDir, { recursive: true });
  const input = path.join(diagramDir, `.tmp-${hash}.mmd`);
  fs.writeFileSync(input, code);
  try {
    execFileSync(mmdc.bin, [...mmdc.prefix, '-i', input, '-o', out, '-b', 'white', '-t', 'default', '-q'], {
      stdio: 'pipe'
    });
    const { svg, width } = pinSvgSize(fs.readFileSync(out, 'utf8'));
    fs.writeFileSync(out, svg);
    return { rel, width };
  } finally {
    fs.rmSync(input, { force: true });
  }
}

const widthOf = svg => Number(svg.match(/viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)/)?.[1]) || null;

/** Sustituye cada ```mermaid por una imagen. Devuelve el Markdown y cuántos convirtió. */
function replaceMermaid(md, docName) {
  let converted = 0;
  let failed = 0;
  const tooWide = [];
  const out = md.replace(/```mermaid\n([\s\S]*?)```/g, (whole, code) => {
    if (!mmdcAvailable) return whole;
    try {
      const { rel, width } = renderDiagram(code.trim());
      converted++;
      if (width && A4_CONTENT_PX / width < MIN_LEGIBLE_SCALE) {
        tooWide.push({ rel, width, scale: A4_CONTENT_PX / width });
      }
      return `![Diagrama de ${docName}](${rel})`;
    } catch (error) {
      failed++;
      console.warn(`    ⚠ Mermaid falló en ${docName}: ${String(error.message).split('\n')[0]}`);
      return whole;
    }
  });
  for (const d of tooWide) {
    console.warn(
      `    ⚠ ${docName}: ${path.basename(d.rel)} mide ${Math.round(d.width)} px y en A4 se reduce al ` +
        `${Math.round(d.scale * 100)} % — su texto quedará ilegible. Divídelo, o dale orientación TB.`
    );
  }
  return { md: out, converted, failed, tooWide: tooWide.length };
}

/* ----------------------------------------------------------- composición --- */

const embed = embedFrom(docsDir);

/**
 * `markdownToHtml` marca las imágenes como `loading="lazy"`, que es lo correcto
 * para el HTML del manual y un riesgo innecesario al imprimir: un diagrama que
 * el navegador considere fuera de vista puede no haberse decodificado cuando se
 * dispara la impresión, y sale un hueco. Para papel se piden todas ya.
 */
const eager = html => html.replaceAll(' loading="lazy"', '');

/** Portada. Los datos salen de package.json y de git, nunca escritos a mano. */
const cover = (title, subtitle) => `
<div class="portada">
  <img src="${embedFrom(path.join(root, 'docs'))('assets/banner.svg')}" alt="Empresa Operativa Chile">
  <h1>${title}</h1>
  <div class="sub">Documentación de sistema · Empresa Operativa Chile</div>
  <div class="meta">
    ${subtitle}<br>
    Versión del manifiesto ${pkg.version} · commit <code>${commit}</code><br>
    Análisis del ${analysisDate}
  </div>
  <div class="aviso">
    Documento técnico generado desde <code>docs/system-documentation/</code>. La fuente es el
    Markdown del repositorio: si este PDF y el Markdown difieren, manda el Markdown.
    Esta aplicación no presenta ni paga nada ante el SII y no es asesoría tributaria.
  </div>
</div>`;

/**
 * Ajustes de impresión propios de esta serie.
 *
 * Los dos primeros existen por una razón concreta y medida: estos documentos
 * llevan tablas de referencia con identificadores largos
 * (`shareholder_loan_repayment`, rutas de archivo) y bloques de código con
 * líneas largas. Con las reglas compartidas, esas tablas empujaban hasta 816 px
 * sobre un ancho útil de 688, y `pre { overflow-x: auto }` —correcto en
 * pantalla— **recorta** el contenido al imprimir en vez de desplazarlo: el
 * lector del PDF no vería que falta texto.
 *
 * Van aquí y no en `print-style.mjs` para no cambiar cómo salen el manual y la
 * guía, que hoy están bien.
 */
const EXTRA_CSS = `
  /* Ningún identificador largo puede ensanchar una tabla más allá de la página. */
  td, th { overflow-wrap: anywhere; }
  /* Al imprimir, una línea larga se parte; nunca se recorta. */
  pre.code { white-space: pre-wrap; overflow-wrap: anywhere; overflow-x: visible; }

  .portada code { background: none; color: inherit; padding: 0; }
  h2 { break-before: page; }
  .doc-sep { page-break-before: always; }
`;

function compose(title, subtitle, bodyHtml) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title>
<style>${PRINT_CSS}${EXTRA_CSS}</style></head><body>
${cover(title, subtitle)}
${bodyHtml}
</body></html>`;
}

/* ------------------------------------------------------------------ main --- */

const files = fs
  .readdirSync(docsDir)
  .filter(f => f.endsWith('.md'))
  .sort((a, b) => (a === 'README.md' ? -1 : b === 'README.md' ? 1 : a.localeCompare(b)))
  .filter(f => !only || f.startsWith(only) || (only === '00' && f === 'README.md'));

if (!files.length) {
  console.error(`No hay documentos que generar${only ? ` para --only ${only}` : ''}.`);
  process.exit(1);
}

if (!mmdcAvailable) {
  console.warn(
    noDiagrams
      ? '\n⚠ --no-diagrams: los diagramas Mermaid quedan como bloques de código.\n'
      : '\n⚠ mmdc no está disponible: los diagramas Mermaid quedan como bloques de código.\n' +
        '  Instálalo con: pnpm add -g @mermaid-js/mermaid-cli\n'
  );
}

fs.mkdirSync(pdfDir, { recursive: true });

/** El título del PDF sale del primer `# ` del documento, no del nombre del archivo. */
const titleOf = md => md.match(/^#\s+(.+)$/m)?.[1].replace(/^[^\w¿¡]+\s*/, '') ?? 'Documento';

const results = [];
const consolidated = [];
let totalDiagrams = 0;
let totalFailed = 0;
let totalTooWide = 0;

for (const file of files) {
  const raw = fs.readFileSync(path.join(docsDir, file), 'utf8');
  const name = path.basename(file, '.md');
  const title = titleOf(raw);

  // La barra de navegación entre documentos es útil en GitHub y ruido en papel.
  const cleaned = raw
    .split('\n')
    .filter(line => !/^\[⬅|^\[Índice\]|^\[⬅ Índice\]/.test(line.trim()))
    .join('\n');

  const { md, converted, failed, tooWide } = replaceMermaid(cleaned, name);
  totalDiagrams += converted;
  totalFailed += failed;
  totalTooWide += tooWide;

  const bodyHtml = eager(markdownToHtml(md, { resolveImage: embed }));
  const out = path.join(pdfDir, `${name}.pdf`);
  const { bytes, pages } = printPdf({
    html: compose(title, file === 'README.md' ? 'Índice general' : `Documento ${name.slice(0, 2)} de la serie`, bodyHtml),
    out,
    timeBudget: 25000,
    // Sólo texto y diagramas vectoriales: un documento corto pesa bastante
    // menos que el manual, y rechazarlo por eso sería un falso positivo.
    minBytes: 12_000
  });

  results.push({ name, pages, kb: Math.round(bytes / 1024), diagrams: converted });
  consolidated.push(`\n\n<div class="doc-sep"></div>\n\n${md}`);
  console.log(`  ${name}.pdf — ${pages} páginas, ${Math.round(bytes / 1024)} KB${converted ? `, ${converted} diagrama(s)` : ''}`);
}

/* El consolidado sólo tiene sentido con la serie completa. */
if (!only) {
  const all = eager(markdownToHtml(consolidated.join('\n'), { resolveImage: embed }));
  const out = path.join(pdfDir, 'documentacion-completa.pdf');
  const { bytes, pages } = printPdf({
    html: compose('Documentación de sistema completa', `Los ${files.length} documentos de la serie`, all),
    out,
    timeBudget: 90000,
    minBytes: 12_000
  });
  console.log(`\n  documentacion-completa.pdf — ${pages} páginas, ${Math.round(bytes / 1024)} KB`);
  results.push({ name: 'documentacion-completa', pages, kb: Math.round(bytes / 1024), diagrams: totalDiagrams });
}

console.log(
  `\n${results.length} PDF generados en docs/system-documentation/pdf/ · ` +
    `${results.reduce((a, r) => a + r.pages, 0)} páginas · ${totalDiagrams} diagrama(s) rasterizado(s).`
);

if (totalTooWide) {
  console.warn(`${totalTooWide} diagrama(s) se imprimen demasiado reducidos. Ver los avisos de arriba.`);
}

if (totalFailed) {
  console.error(`\n${totalFailed} diagrama(s) Mermaid no se pudieron rasterizar. Revisa su sintaxis.`);
  process.exit(1);
}
