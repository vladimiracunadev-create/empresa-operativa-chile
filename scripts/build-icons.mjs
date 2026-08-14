#!/usr/bin/env node
/**
 * Genera los iconos PNG de la aplicación sin dependencias externas.
 *
 * Por qué a mano en vez de `sharp`/`resvg`: este repositorio no tiene
 * dependencias de producción y quiero que siga sin tenerlas. Un icono es un
 * rectángulo redondeado con degradado y unos cuantos rectángulos blancos
 * encima; rasterizarlo con supermuestreo y comprimirlo con `node:zlib` cabe en
 * un archivo, se ejecuta en cualquier runner de CI y no añade 40 MB de
 * `node_modules` a un proyecto cuyo argumento es la ausencia de dependencias.
 *
 * Salida: apps/web/src/icons/*.png
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'apps/web/src/icons');

/* ------------------------------------------------------------- PNG ------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

const crc32 = buf => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

/** Codifica RGBA de 8 bits (filtro 0 por fila) a un PNG completo. */
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 6; // color RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ------------------------------------------------------------ dibujo ----- */

const BRAND_A = [79, 140, 255]; // #4f8cff
const BRAND_B = [52, 211, 153]; // #34d399

const lerp = (a, b, t) => a + (b - a) * t;

/** ¿Está (x, y) dentro de un rectángulo de esquinas redondeadas? */
function insideRoundRect(x, y, rx, ry, w, h, r) {
  if (x < rx || y < ry || x > rx + w || y > ry + h) return false;
  const cx = Math.min(Math.max(x, rx + r), rx + w - r);
  const cy = Math.min(Math.max(y, ry + r), ry + h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/**
 * Dibuja el icono a `size` píxeles.
 * `inset` reserva margen para la versión maskable, donde Android recorta un
 * círculo y todo lo que quede fuera desaparece.
 */
function drawIcon(size, { inset = 0, transparentBackground = false, cornerRadius = 0.22 } = {}) {
  const SS = 3; // supermuestreo: 3×3 muestras por píxel
  const rgba = Buffer.alloc(size * size * 4);
  const S = size;
  const pad = S * inset;
  const inner = S - pad * 2;

  // Geometría del edificio, en fracciones del cuadrado interior.
  const bodyW = inner * 0.42;
  const bodyH = inner * 0.5;
  const bodyX = pad + (inner - bodyW) / 2;
  const bodyY = pad + inner * 0.28;
  const roofW = inner * 0.56;
  const roofH = inner * 0.1;
  const roofX = pad + (inner - roofW) / 2;
  const roofY = pad + inner * 0.19;

  const winSize = bodyW * 0.19;
  const winGapX = bodyW * 0.13;
  const winGapY = bodyH * 0.11;
  const winStartX = bodyX + (bodyW - (winSize * 2 + winGapX)) / 2;
  const winStartY = bodyY + bodyH * 0.13;

  const doorW = bodyW * 0.24;
  const doorH = bodyH * 0.26;
  const doorX = bodyX + (bodyW - doorW) / 2;
  const doorY = bodyY + bodyH - doorH;

  for (let py = 0; py < S; py++) {
    for (let px = 0; px < S; px++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;

          const inBg = transparentBackground || insideRoundRect(x, y, pad, pad, inner, inner, inner * cornerRadius);
          if (!inBg) continue;

          // Degradado diagonal del fondo.
          const t = Math.min(1, Math.max(0, (x + y) / (2 * S)));
          let pr = lerp(BRAND_A[0], BRAND_B[0], t);
          let pg = lerp(BRAND_A[1], BRAND_B[1], t);
          let pb = lerp(BRAND_A[2], BRAND_B[2], t);

          const inRoof = insideRoundRect(x, y, roofX, roofY, roofW, roofH, roofH * 0.42);
          const inBody = insideRoundRect(x, y, bodyX, bodyY, bodyW, bodyH, bodyW * 0.09);

          if (inRoof || inBody) {
            pr = pg = pb = 255;
            // Ventanas y puerta: se devuelve el color del fondo, así el glifo
            // queda "recortado" sin necesidad de componer capas.
            let hole = insideRoundRect(x, y, doorX, doorY, doorW, doorH, doorW * 0.3);
            if (!hole) {
              for (let c = 0; c < 2 && !hole; c++) {
                for (let f = 0; f < 2 && !hole; f++) {
                  hole = insideRoundRect(
                    x, y,
                    winStartX + c * (winSize + winGapX),
                    winStartY + f * (winSize + winGapY),
                    winSize, winSize, winSize * 0.28
                  );
                }
              }
            }
            if (hole) {
              pr = lerp(BRAND_A[0], BRAND_B[0], t);
              pg = lerp(BRAND_A[1], BRAND_B[1], t);
              pb = lerp(BRAND_A[2], BRAND_B[2], t);
            }
          }

          r += pr;
          g += pg;
          b += pb;
          a += 255;
        }
      }

      const samples = SS * SS;
      const i = (py * S + px) * 4;
      const alpha = a / samples;
      if (alpha > 0) {
        // Los canales se promedian sólo sobre las muestras cubiertas para que
        // el borde antialiaseado no se ensucie con negro.
        const covered = a / 255;
        rgba[i] = Math.round(r / covered);
        rgba[i + 1] = Math.round(g / covered);
        rgba[i + 2] = Math.round(b / covered);
      }
      rgba[i + 3] = Math.round(alpha);
    }
  }

  return encodePng(S, S, rgba);
}

/* --------------------------------------------------------------- SVG ----- */

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Empresa Operativa Chile">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#4f8cff"/>
      <stop offset="1" stop-color="#34d399"/>
    </linearGradient>
    <mask id="cut">
      <rect width="512" height="512" fill="#000"/>
      <rect x="143.4" y="97.3" width="225.3" height="51.2" rx="21.5" fill="#fff"/>
      <rect x="148.5" y="143.4" width="215" height="256" rx="19.4" fill="#fff"/>
      <rect x="176.4" y="176.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="245.3" y="176.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="176.4" y="245.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="245.3" y="245.6" width="40.9" height="40.9" rx="11.5" fill="#000"/>
      <rect x="230.1" y="332.8" width="51.6" height="66.6" rx="15.5" fill="#000"/>
    </mask>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#brand)"/>
  <g mask="url(#cut)"><rect width="512" height="512" fill="#fff"/></g>
</svg>
`;

/* -------------------------------------------------------------- main ----- */

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon.svg'), SVG);

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-1024.png', 1024, {}],
  // Android recorta la maskable a un círculo: el glifo se encoge para que no
  // le corten el techo al edificio.
  ['icon-maskable-512.png', 512, { inset: 0.11 }],
  ['icon-foreground-1024.png', 1024, { inset: 0.18, transparentBackground: true }]
];

for (const [name, size, options] of targets) {
  fs.writeFileSync(path.join(outDir, name), drawIcon(size, options));
  console.log(`  web/${name} (${size}×${size})`);
}

/* ------------------------------------------------- iconos de escritorio -- */

/**
 * Contenedor ICO con PNG dentro.
 *
 * Windows admite ICO con imágenes PNG desde Vista, así que no hace falta
 * escribir un DIB de mapa de bits: basta con la cabecera del contenedor y los
 * PNG que ya sabemos generar. Un lado de 256 se codifica como 0 en la
 * cabecera, que es como el formato representa "256".
 */
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: icono
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, png } of images) {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e[2] = 0; // paleta
    e[3] = 0; // reservado
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(i => i.png)]);
}

const tauriDir = path.join(root, 'apps/contador-desktop/src-tauri/icons');
fs.mkdirSync(tauriDir, { recursive: true });

const desktop = [
  ['32x32.png', 32],
  ['128x128.png', 128],
  ['128x128@2x.png', 256],
  ['icon.png', 512]
];
for (const [name, size] of desktop) {
  fs.writeFileSync(path.join(tauriDir, name), drawIcon(size));
  console.log(`  desktop/${name} (${size}×${size})`);
}

const ico = encodeIco([16, 32, 48, 64, 128, 256].map(size => ({ size, png: drawIcon(size) })));
fs.writeFileSync(path.join(tauriDir, 'icon.ico'), ico);
console.log(`  desktop/icon.ico (6 tamaños, ${(ico.length / 1024).toFixed(0)} KB)`);

/* ---------------------------------------------------- iconos de Android -- */

/**
 * Android no escala un único PNG: espera un juego por densidad, más un icono
 * adaptativo cuyo primer plano el sistema recorta en círculo, cuadrado o
 * "squircle" según el lanzador. Por eso el primer plano se dibuja con margen
 * (`inset`) y sobre fondo transparente: el color de fondo lo pone
 * `ic_launcher_background`.
 *
 * Se generan aquí, versionados, en vez de depender de `@capacitor/assets`:
 * el APK se compila en CI y un icono es demasiado visible para dejarlo a merced
 * de una herramienta que puede cambiar de comportamiento entre versiones.
 */
const androidDir = path.join(root, 'apps/android/res-icons');
fs.rmSync(androidDir, { recursive: true, force: true });

const DENSITIES = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432]
];

for (const [density, launcher, foreground] of DENSITIES) {
  const dir = path.join(androidDir, `mipmap-${density}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), drawIcon(launcher));
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), drawIcon(launcher, { cornerRadius: 0.5 }));
  fs.writeFileSync(
    path.join(dir, 'ic_launcher_foreground.png'),
    drawIcon(foreground, { inset: 0.19, transparentBackground: true })
  );
}
console.log(`  android/mipmap-* (${DENSITIES.length} densidades × 3 archivos)`);

// Color de fondo del icono adaptativo, referenciado por ic_launcher.xml.
const valuesDir = path.join(androidDir, 'values');
fs.mkdirSync(valuesDir, { recursive: true });
fs.writeFileSync(
  path.join(valuesDir, 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por scripts/build-icons.mjs -->
<resources>
    <color name="ic_launcher_background">#4F8CFF</color>
</resources>
`
);
console.log('  android/values/ic_launcher_background.xml');

console.log('Iconos generados.');
