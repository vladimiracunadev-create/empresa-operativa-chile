#!/usr/bin/env node
/**
 * Comprueba que la presentación que se publica es la que el repositorio anuncia.
 *
 * `build-presentation.mjs --check` valida la FUENTE —láminas numeradas, pauta con
 * minutos—. Esto valida el ARTEFACTO, que es donde salen los fallos que una
 * compilación en verde no ve: una lámina que se desbordó a dos páginas del PDF,
 * una pauta que salió truncada, o un README que sigue anunciando seis
 * diapositivas cuando la fuente ya define ocho.
 *
 * Los PDF se abren y se cuentan sus páginas. Que el archivo exista y pese no
 * prueba nada: un PDF de una sola página en blanco también existe y también pesa.
 *
 * Uso: node scripts/check-presentation.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const DECK = 'docs/presentacion/PRESENTACION.pdf';
const PAUTA = 'docs/presentacion/PAUTA.pdf';

/** Sitios donde se anuncia el tamaño de la presentación y que se desincronizan solos. */
const ANUNCIOS = [
  'README.md',
  'docs/README.md',
  'docs/presentacion.md',
  'apps/web/src/views/ayuda.js',
  '.github/workflows/release.yml'
];

const fallos = [];
const fallar = mensaje => fallos.push(mensaje);

/* -------------------------------------------------------------- la fuente --- */

const fuente = read('docs/presentacion.md');
const laminas = (fuente.match(/^##\s+\d+\s*·\s+/gm) ?? []).length;
if (laminas < 6) fallar(`docs/presentacion.md define ${laminas} diapositivas: se esperaban al menos 6.`);

const minutos = [...fuente.matchAll(/\*\*Pauta\s*·\s*(\d+)\s*min\.?\*\*/g)].reduce((t, m) => t + Number(m[1]), 0);
if (minutos === 0) fallar('Ninguna diapositiva declara sus minutos: la duración de la charla no se puede calcular.');

/* ------------------------------------------------------------ los PDF ------- */

/** Cuenta objetos `/Type /Page` del PDF, excluyendo `/Pages` (el nodo del árbol). */
function paginas(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    fallar(`No existe ${rel}. Genéralo con: pnpm presentacion`);
    return null;
  }
  const total = (fs.readFileSync(full).toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (total === 0) {
    fallar(`${rel} no declara ninguna página: la generación falló y el archivo quedó inservible.`);
    return null;
  }
  return { total, kb: Math.round(fs.statSync(full).size / 1024) };
}

const deck = paginas(DECK);
if (deck && deck.total !== laminas) {
  fallar(
    `${DECK} tiene ${deck.total} páginas y la fuente define ${laminas} diapositivas: ` +
      'alguna lámina se desbordó a dos páginas. Recorta su contenido y vuelve a generar.'
  );
}

const pauta = paginas(PAUTA);
if (pauta && pauta.total < 3) {
  fallar(`${PAUTA} sólo tiene ${pauta.total} páginas: el guion no se generó completo.`);
}

/* ------------------------------------------------- lo que se anuncia fuera --- */

// Nada sujeta las cifras que aparecen en el README, en el índice de docs y en las
// notas del release salvo esta comprobación: se escriben a mano y envejecen en
// cuanto alguien añade una lámina.
for (const archivo of ANUNCIOS) {
  const texto = read(archivo);
  for (const m of texto.matchAll(/(\d+)\s+diapositivas/g)) {
    if (Number(m[1]) !== laminas) {
      fallar(`${archivo} anuncia ${m[1]} diapositivas y la presentación tiene ${laminas}. Actualiza la cifra.`);
    }
  }
  for (const m of texto.matchAll(/≈\s*\*{0,2}(\d+)\s*min/g)) {
    if (Number(m[1]) !== minutos) {
      fallar(`${archivo} anuncia ≈${m[1]} min de charla y las pautas suman ${minutos}. Actualiza la cifra.`);
    }
  }
}

// El README es el único sitio donde la duración es obligatoria: es lo primero que
// mira quien tiene que encajar la charla en un horario.
if (!/≈\s*\*{0,2}\d+\s*min/.test(read('README.md'))) {
  fallar('El README ya no declara la duración de la charla (≈**N minutos**): sin esa cifra nadie sabe si le cabe.');
}

// La presentación sólo es alcanzable si se enlaza al sitio publicado: un enlace
// relativo a un .html dentro del repositorio muestra el código fuente, no las
// diapositivas.
const SITIO = 'https://vladimiracunadev-create.github.io/empresa-operativa-chile/presentacion/presentacion.html';
if (!read('README.md').includes(SITIO)) {
  fallar(`El README no enlaza las diapositivas publicadas (${SITIO}): en GitHub, un enlace relativo a .html enseña el código.`);
}

/* ------------------------------------------------------------- resultado ---- */

if (fallos.length) {
  console.error('La presentación no coincide con lo que el repositorio anuncia:\n');
  fallos.forEach(f => console.error(`  ✗ ${f}`));
  process.exit(1);
}

console.log(
  `Presentación: ${deck.total} diapositivas (${deck.kb} KB), ≈${minutos} min, ` +
    `pauta de ${pauta.total} páginas (${pauta.kb} KB) — coincide con lo anunciado.`
);
