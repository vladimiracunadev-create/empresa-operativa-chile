/**
 * Hoja de estilo de los documentos impresos (manual y guía).
 *
 * Está aquí, y no dentro de cada script, porque el manual y la guía tienen que
 * salir del mismo producto: si uno usa otra tipografía o pinta las tablas
 * distinto, dejan de parecer partes de lo mismo.
 *
 * `PRINT_CSS` es para PDF (A4, saltos de página controlados).
 * `SCREEN_CSS` es para el HTML que se lee en pantalla y dentro de la app, con
 * tema claro y oscuro.
 */

/** Reglas comunes a papel y pantalla, parametrizadas por las variables de color. */
const SHARED = `
  * { box-sizing: border-box; }
  h1, h2, h3, h4 { line-height: 1.25; letter-spacing: -0.01em; color: var(--fg-strong); }
  h2, h3, h4 { page-break-after: avoid; }
  p { margin: 0 0 9px; }
  code { font-family: "Cascadia Mono", Consolas, monospace; font-size: 0.88em;
         background: var(--code-bg); padding: 1px 5px; border-radius: 4px; color: var(--code-fg); }
  pre.code { background: #0f1521; color: #e8edf5; padding: 12px 14px; border-radius: 8px;
             font-size: 0.86em; line-height: 1.45; overflow-x: auto; page-break-inside: avoid; }
  pre.code code { background: none; color: inherit; padding: 0; }

  table { width: 100%; border-collapse: collapse; margin: 10px 0 14px; font-size: 0.9em; page-break-inside: avoid; }
  th { background: var(--th-bg); color: var(--fg-strong); font-weight: 650; text-align: left;
       padding: 7px 9px; border: 1px solid var(--border-strong); }
  td { padding: 6px 9px; border: 1px solid var(--border); vertical-align: top; }
  tr:nth-child(even) td { background: var(--row-alt); }
  td img { width: 100%; height: auto; border-radius: 5px; border: 1px solid var(--border-strong); }

  img { max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 7px; page-break-inside: avoid; }

  ul, ol { margin: 0 0 10px; padding-left: 20px; }
  li { margin-bottom: 4px; }
  li.task { list-style: none; margin-left: -18px; }
  li.task .box { display: inline-block; width: 12px; height: 12px; border: 1.5px solid var(--fg-faint);
                 border-radius: 3px; margin-right: 8px; text-align: center; line-height: 11px;
                 font-size: 9px; color: var(--ok); vertical-align: -1px; }

  blockquote { margin: 12px 0; padding: 10px 16px; border-left: 3px solid var(--fg-faint);
               background: var(--quote-bg); color: var(--fg-dim); page-break-inside: avoid; }
  blockquote p:last-child { margin-bottom: 0; }

  .alert { margin: 12px 0; padding: 11px 14px; border-radius: 8px; border-left-width: 4px;
           border-left-style: solid; page-break-inside: avoid; }
  .alert__head { font-weight: 700; font-size: 0.92em; margin-bottom: 4px; }
  .alert p { margin: 0; }
  .alert--note      { background: var(--note-bg); border-color: #2563eb; }
  .alert--tip       { background: var(--tip-bg); border-color: #047857; }
  .alert--important { background: var(--imp-bg); border-color: #7c3aed; }
  .alert--warning   { background: var(--warn-bg); border-color: #b45309; }

  details { margin: 7px 0; border: 1px solid var(--border); border-radius: 7px; padding: 9px 12px;
            page-break-inside: avoid; background: var(--quote-bg); }
  details summary { font-weight: 620; margin-bottom: 6px; cursor: pointer; }
  details p { margin: 5px 0 0; }

  sub { font-size: 0.82em; color: var(--fg-faint); }
  hr { border: 0; border-top: 1px solid var(--border); margin: 18px 0; }
`;

const LIGHT_VARS = `
  --fg: #16202e; --fg-strong: #0d1826; --fg-dim: #3d4a5f; --fg-faint: #6b7a94;
  --bg: #ffffff; --border: #e2e8f2; --border-strong: #d5dde9;
  --th-bg: #eef3fb; --row-alt: #fafbfd; --quote-bg: #f6f8fb;
  --code-bg: #eef1f7; --code-fg: #b5265f; --accent: #1d4ed8; --ok: #047857;
  --note-bg: #eef3fb; --tip-bg: #ecfaf3; --imp-bg: #f3eefb; --warn-bg: #fef5e9;
`;

const DARK_VARS = `
  --fg: #d7dee9; --fg-strong: #eef3fa; --fg-dim: #aab6c7; --fg-faint: #8494ac;
  --bg: #0b1017; --border: #1e2836; --border-strong: #2a3646;
  --th-bg: #151d29; --row-alt: #0f151e; --quote-bg: #111925;
  --code-bg: #172131; --code-fg: #f38ba8; --accent: #7aa7ff; --ok: #34d399;
  --note-bg: #10203a; --tip-bg: #0e2a20; --imp-bg: #1d1533; --warn-bg: #2c2110;
`;

/** PDF: A4, cada capítulo en página nueva, colores forzados en la impresión. */
export const PRINT_CSS = `
  @page { size: A4; margin: 16mm 14mm 18mm; }
  :root { ${LIGHT_VARS} }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt; line-height: 1.55; color: var(--fg); margin: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  ${SHARED}
  h1 { font-size: 26pt; margin: 0 0 10px; }
  /* Cada capítulo empieza en página nueva: un documento que se lee a saltos lo agradece. */
  h2 { font-size: 18pt; margin: 0 0 14px; padding-bottom: 8px; border-bottom: 2.5px solid #4f8cff; page-break-before: always; }
  h2:first-of-type { page-break-before: avoid; }
  h3 { font-size: 13pt; margin: 20px 0 8px; color: var(--accent); }
  h4 { font-size: 11.5pt; margin: 16px 0 6px; }
  a { color: var(--accent); text-decoration: none; }
  .link { color: var(--accent); }
  /* Las capturas llevan marco; los diagramas SVG no lo necesitan. */
  p > img[src^="data:image/png"] { border: 1px solid var(--border-strong); box-shadow: 0 2px 8px rgba(16,24,40,0.1); }

  .portada { text-align: center; page-break-after: always; padding-top: 34mm; }
  .portada img { max-width: 100%; margin-bottom: 26px; }
  .portada h1 { font-size: 32pt; margin-bottom: 6px; }
  .portada .sub { font-size: 13pt; color: var(--fg-dim); margin-bottom: 30px; }
  .portada .meta { font-size: 9.5pt; color: var(--fg-faint); line-height: 1.9; }
  .portada .aviso { margin: 34px auto 0; max-width: 132mm; padding: 14px 18px;
                    border: 1px solid #e5c07b; background: #fef8ec; border-radius: 9px;
                    font-size: 9.5pt; color: #6b4a12; text-align: left; }
  .tablewrap { overflow: visible; }
`;

/**
 * Pantalla: una columna legible, tema claro y oscuro, y un índice lateral
 * pegajoso en pantallas anchas. Sirve igual abierto desde el disco que dentro
 * de la aplicación.
 */
export const SCREEN_CSS = `
  :root { ${LIGHT_VARS} }
  @media (prefers-color-scheme: dark) { :root { ${DARK_VARS} } }
  :root[data-tema="oscuro"] { ${DARK_VARS} }
  :root[data-tema="claro"] { ${LIGHT_VARS} }

  html { scroll-behavior: smooth; scroll-padding-top: 16px; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    font-size: 16px; line-height: 1.65; color: var(--fg); background: var(--bg);
    margin: 0; padding: 0;
  }
  ${SHARED}
  img, table, details, blockquote, .alert, pre.code { page-break-inside: auto; }

  .doc { max-width: 1180px; margin: 0 auto; padding: 28px 22px 80px; display: grid; gap: 34px;
         grid-template-columns: 250px minmax(0, 1fr); align-items: start; }
  .doc__toc { position: sticky; top: 20px; max-height: calc(100vh - 40px); overflow-y: auto;
              font-size: 0.86rem; border-right: 1px solid var(--border); padding-right: 16px; }
  .doc__toc h2 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em;
                 color: var(--fg-faint); border: 0; padding: 0; margin: 0 0 10px; }
  .doc__toc a { display: block; padding: 4px 0; color: var(--fg-dim); text-decoration: none; border-left: 2px solid transparent; padding-left: 10px; }
  .doc__toc a:hover { color: var(--accent); border-left-color: var(--accent); }
  .doc__toc .toc--phase { margin-top: 12px; font-weight: 650; color: var(--fg-strong); padding-left: 0; }
  .doc__body { min-width: 0; }

  h1 { font-size: 2.1rem; margin: 0 0 12px; }
  h2 { font-size: 1.5rem; margin: 38px 0 14px; padding-bottom: 8px; border-bottom: 2px solid var(--accent); }
  h3 { font-size: 1.15rem; margin: 30px 0 10px; color: var(--accent); }
  h4 { font-size: 1rem; margin: 18px 0 6px; }
  a { color: var(--accent); }
  .link { color: var(--accent); }

  .tablewrap { overflow-x: auto; margin: 10px 0 14px; }
  .tablewrap table { margin: 0; min-width: 460px; }

  img { border-radius: 8px; }
  .doc__body p > img { border: 1px solid var(--border-strong); box-shadow: 0 6px 22px -10px rgba(0,0,0,0.45); }
  .doc__body p > img[src$=".svg"], .doc__body p > img[src^="data:image/svg"] { border: 0; box-shadow: none; }

  .doc__bar { position: sticky; top: 0; z-index: 5; display: flex; gap: 10px; align-items: center;
              padding: 10px 22px; background: var(--bg); border-bottom: 1px solid var(--border); }
  .doc__bar b { flex: 1; font-size: 0.9rem; }
  .doc__bar button, .doc__bar a { font: inherit; font-size: 0.82rem; padding: 5px 11px; border-radius: 8px;
              border: 1px solid var(--border-strong); background: transparent; color: var(--fg);
              cursor: pointer; text-decoration: none; }
  .doc__bar button:hover, .doc__bar a:hover { border-color: var(--accent); color: var(--accent); }

  @media (max-width: 900px) {
    .doc { grid-template-columns: 1fr; padding: 18px 14px 60px; gap: 20px; }
    .doc__toc { position: static; max-height: none; border-right: 0; border-bottom: 1px solid var(--border);
                padding: 0 0 14px; }
    body { font-size: 15px; }
  }
  @media print {
    .doc { display: block; max-width: none; padding: 0; }
    .doc__toc, .doc__bar { display: none; }
  }
`;
