/**
 * Diagramas SVG generados desde los datos del sistema.
 *
 * Se generan —y no se dibujan a mano— por el mismo motivo que el glosario y la
 * guía: un diagrama hecho a mano envejece en silencio. Si mañana se agrega una
 * etapa a la ruta, el diagrama la muestra sin que nadie se acuerde de abrirlo.
 *
 * SVG y no PNG porque escala sin perder nitidez en el PDF, pesa unos pocos KB y
 * se puede diffear en una revisión de código.
 *
 * Paleta y tipografía calcadas de `docs/assets/diagramas/*.svg`, para que los
 * diagramas nuevos y los que ya existían parezcan del mismo documento.
 */
import { PHASES, STAGES } from '../../packages/onboarding/index.mjs';

const esc = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PALETTE = ['#4f8cff', '#34d399', '#f0a83c', '#c084fc', '#f472b6'];

const STYLE = `
    .t  { font-family: "Segoe UI", system-ui, sans-serif; }
    .n  { font-size: 13.5px; font-weight: 620; fill: #e8edf5; }
    .s  { font-size: 11px; fill: #9aa8bf; }
    .h  { font-size: 12px; font-weight: 700; letter-spacing: 0.09em; }
    .num{ font-size: 12px; font-weight: 700; fill: #0b1017; }`;

/** Parte un texto en líneas de a lo más `max` caracteres, sin cortar palabras. */
function wrap(text, max) {
  const out = [];
  let line = '';
  for (const word of String(text).split(' ')) {
    if ((line + ' ' + word).trim().length > max && line) {
      out.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

/* ------------------------------------------------------------------ */
/* 1. La ruta completa: fases y etapas                                  */
/* ------------------------------------------------------------------ */

/**
 * Una banda por fase, con sus etapas numeradas en orden y flechas entre ellas.
 * Es el mapa que responde "¿dónde estoy y qué viene después?".
 */
export function routeDiagram() {
  const W = 1240;
  const PAD = 24;
  const LABEL_W = 168;
  const ROW_H = 118;
  const BOX_H = 78;
  const GAP = 16;

  const rows = PHASES.map(p => ({ ...p, stages: STAGES.filter(s => s.phase === p.id) })).filter(r => r.stages.length);
  const H = PAD * 2 + 46 + rows.length * ROW_H;

  let n = 0;
  const body = rows
    .map((row, r) => {
      const color = PALETTE[r % PALETTE.length];
      const y = PAD + 46 + r * ROW_H;
      const trackX = PAD + LABEL_W;
      const trackW = W - trackX - PAD;
      const boxW = (trackW - GAP * (row.stages.length - 1)) / row.stages.length;

      const label = wrap(row.label, 16)
        .map((l, i) => `<text class="t h" x="${PAD + 4}" y="${y + 26 + i * 16}" fill="${color}">${esc(l.toUpperCase())}</text>`)
        .join('');

      const boxes = row.stages
        .map((s, i) => {
          n += 1;
          const x = trackX + i * (boxW + GAP);
          const title = wrap(s.title, Math.max(18, Math.floor(boxW / 7.2)))
            .slice(0, 3)
            .map((l, k) => `<text class="t n" x="${x + 38}" y="${y + 26 + k * 16}">${esc(l)}</text>`)
            .join('');
          const arrow =
            i < row.stages.length - 1
              ? `<path d="M${x + boxW + 2} ${y + BOX_H / 2} H${x + boxW + GAP - 4}" stroke="#3c4a63" stroke-width="1.6" marker-end="url(#fl)"/>`
              : '';
          return `
      <g>
        <rect x="${x}" y="${y}" width="${boxW}" height="${BOX_H}" rx="10" fill="rgba(255,255,255,0.035)" stroke="${color}" stroke-opacity="0.45"/>
        <circle cx="${x + 20}" cy="${y + 22}" r="12" fill="${color}"/>
        <text class="t num" x="${x + 20}" y="${y + 26}" text-anchor="middle">${n}</text>
        ${title}
        ${s.formationStep ? `<text class="t s" x="${x + 12}" y="${y + BOX_H - 12}">trámite con evidencia</text>` : ''}
      </g>${arrow}`;
        })
        .join('');

      const down =
        r < rows.length - 1
          ? `<path d="M${PAD + LABEL_W - 24} ${y + BOX_H} V${y + ROW_H - 4}" stroke="#3c4a63" stroke-width="1.6" marker-end="url(#fl)"/>`
          : '';

      return `${label}${boxes}${down}`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="La ruta completa: ${STAGES.length} etapas agrupadas en ${rows.length} fases, desde antes de que la empresa exista hasta el cierre del año">
  <style>${STYLE}</style>
  <defs>
    <marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#3c4a63"/>
    </marker>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="#0f1521"/>
  <text class="t h" x="${PAD + 4}" y="${PAD + 20}" fill="#e8edf5">LA RUTA COMPLETA — ${STAGES.length} ETAPAS</text>
  <text class="t s" x="${PAD + 4}" y="${PAD + 38}">Cada fase necesita la anterior. Las etapas marcadas exigen evidencia antes de darse por hechas.</text>
  ${body}
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* 2. Casos de uso: quién hace qué, y dónde está el límite del sistema  */
/* ------------------------------------------------------------------ */

/**
 * Actores y casos de uso, con el límite del sistema dibujado explícitamente.
 *
 * El diagrama existe para dejar visible lo que más se malentiende del producto:
 * la aplicación calcula, controla y guarda evidencia, pero **no** presenta ni
 * paga. Todo lo que cruza hacia el SII, la municipalidad, el banco o el
 * registro lo hace la persona, no el sistema.
 */
const USE_CASES = [
  { id: 'decidir', label: 'Decidir y registrar\nla estructura' },
  { id: 'capital', label: 'Llevar capital,\naportes y préstamos' },
  { id: 'operar', label: 'Registrar operaciones\ncon su evidencia' },
  { id: 'calcular', label: 'Calcular IVA, PPM\ny borrador F29' },
  { id: 'cpt', label: 'Determinar el CPT\ny cerrar el ejercicio' },
  { id: 'patente', label: 'Estimar la patente\ny su base legal' },
  { id: 'auditar', label: 'Auditar, respaldar\ny exportar expediente' }
];

const ACTORS = [
  { name: 'Quien crea\nla empresa', side: 'left', does: ['decidir', 'capital', 'operar', 'calcular', 'cpt', 'patente', 'auditar'], color: '#4f8cff' },
  { name: 'Contador\n(opcional)', side: 'left', does: ['cpt', 'calcular'], color: '#34d399' },
  { name: 'Registro de\nEmpresas', side: 'right', does: ['decidir'], color: '#f0a83c', external: true },
  { name: 'SII', side: 'right', does: ['calcular', 'cpt'], color: '#f0a83c', external: true },
  { name: 'Municipalidad', side: 'right', does: ['patente'], color: '#f0a83c', external: true },
  { name: 'Banco', side: 'right', does: ['operar'], color: '#f0a83c', external: true }
];

export function useCaseDiagram() {
  const W = 1240;
  // Alto con holgura al pie: la leyenda va debajo de todo, y si los actores
  // llegan hasta el borde se le monta encima el rótulo del último.
  const H = 700;
  const BOX = { x: 340, y: 60, w: 560, h: 500 };

  const ucY = i => BOX.y + 58 + i * ((BOX.h - 96) / (USE_CASES.length - 1));
  const ucCx = BOX.x + BOX.w / 2;

  const ellipses = USE_CASES.map((u, i) => {
    const cy = ucY(i);
    const lines = u.label.split('\n');
    return `
    <g>
      <ellipse cx="${ucCx}" cy="${cy}" rx="168" ry="25" fill="rgba(79,140,255,0.10)" stroke="rgba(79,140,255,0.5)"/>
      ${lines
        .map((l, k) => `<text class="t n" x="${ucCx}" y="${cy + (k - (lines.length - 1) / 2) * 15 + 5}" text-anchor="middle">${esc(l)}</text>`)
        .join('')}
    </g>`;
  }).join('');

  const sides = { left: ACTORS.filter(a => a.side === 'left'), right: ACTORS.filter(a => a.side === 'right') };

  const actorGroup = (actor, i, list, side) => {
    const x = side === 'left' ? 118 : W - 118;
    const y = 120 + i * ((H - 320) / Math.max(1, list.length - 1));
    const lines = actor.name.split('\n');
    const head = `
      <circle cx="${x}" cy="${y - 26}" r="13" fill="none" stroke="${actor.color}" stroke-width="2"/>
      <path d="M${x} ${y - 13} V${y + 14} M${x - 16} ${y - 4} H${x + 16} M${x} ${y + 14} L${x - 13} ${y + 32} M${x} ${y + 14} L${x + 13} ${y + 32}"
            stroke="${actor.color}" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${lines
        .map((l, k) => `<text class="t n" x="${x}" y="${y + 50 + k * 15}" text-anchor="middle">${esc(l)}</text>`)
        .join('')}
      ${actor.external ? `<text class="t s" x="${x}" y="${y + 50 + lines.length * 15}" text-anchor="middle">organismo externo</text>` : ''}`;

    const links = actor.does
      .map(id => {
        const idx = USE_CASES.findIndex(u => u.id === id);
        if (idx < 0) return '';
        const cy = ucY(idx);
        const from = side === 'left' ? x + 22 : x - 22;
        const to = side === 'left' ? ucCx - 168 : ucCx + 168;
        const dash = actor.external ? ' stroke-dasharray="5 5"' : '';
        return `<path d="M${from} ${y} C ${(from + to) / 2} ${y}, ${(from + to) / 2} ${cy}, ${to} ${cy}" stroke="${actor.color}" stroke-opacity="0.45" stroke-width="1.5" fill="none"${dash}/>`;
      })
      .join('');

    return links + head;
  };

  const actors = ['left', 'right']
    .map(side => sides[side].map((a, i) => actorGroup(a, i, sides[side], side)).join(''))
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Casos de uso: quien crea la empresa usa el sistema para decidir, llevar capital, registrar operaciones, calcular impuestos, determinar el capital propio tributario, estimar la patente y auditar. Los organismos externos (Registro de Empresas, SII, municipalidad y banco) quedan fuera del sistema: la aplicación no se conecta con ellos.">
  <style>${STYLE}</style>
  <rect width="${W}" height="${H}" rx="14" fill="#0f1521"/>
  <text class="t h" x="24" y="30" fill="#e8edf5">CASOS DE USO — QUIÉN HACE QUÉ</text>
  <text class="t s" x="24" y="48">La línea discontinua marca lo que ocurre FUERA de la aplicación: ahí va la persona, no el sistema.</text>

  <rect x="${BOX.x}" y="${BOX.y}" width="${BOX.w}" height="${BOX.h}" rx="16" fill="rgba(255,255,255,0.025)" stroke="rgba(79,140,255,0.4)" stroke-width="1.5"/>
  <text class="t h" x="${ucCx}" y="${BOX.y + 26}" text-anchor="middle" fill="#4f8cff">EMPRESA OPERATIVA CHILE</text>
  ${ellipses}
  ${actors}

  <g transform="translate(24, ${H - 26})">
    <path d="M0 0 H26" stroke="#4f8cff" stroke-width="1.5"/>
    <text class="t s" x="34" y="4">usa el sistema</text>
    <path d="M150 0 H176" stroke="#f0a83c" stroke-width="1.5" stroke-dasharray="5 5"/>
    <text class="t s" x="184" y="4">trámite fuera del sistema: lo haces tú en el portal del organismo</text>
  </g>
</svg>
`;
}
