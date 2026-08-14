#!/usr/bin/env node
/**
 * Verifica que un APK lleve la aplicación DENTRO.
 *
 * Un APK vacío compila perfectamente: la WebView arranca, muestra una pantalla
 * en blanco y todas las señales del build quedan en verde. Ese es el fallo que
 * este script existe para atrapar — no comprueba que el build funcionara,
 * comprueba que el resultado sirva.
 *
 * Lee el directorio central del ZIP a mano (un APK es un ZIP) para no depender
 * de `unzip` ni de ninguna librería: el mismo script corre igual en Windows,
 * Linux y macOS.
 *
 *   node scripts/verify-apk.mjs ruta/al.apk
 */
import fs from 'node:fs';

const apkPath = process.argv[2];
if (!apkPath) {
  console.error('Uso: node scripts/verify-apk.mjs <archivo.apk>');
  process.exit(1);
}

const buf = fs.readFileSync(apkPath);

/* ------------------------------------------------- lectura del ZIP ------- */

// El "End of Central Directory" está al final, después de un comentario de
// longitud variable: se busca su firma hacia atrás.
const EOCD_SIG = 0x06054b50;
let eocd = -1;
for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65535; i--) {
  if (buf.readUInt32LE(i) === EOCD_SIG) {
    eocd = i;
    break;
  }
}
if (eocd < 0) {
  console.error('No es un archivo ZIP/APK válido: falta el directorio central.');
  process.exit(1);
}

let entries = buf.readUInt16LE(eocd + 10);
let offset = buf.readUInt32LE(eocd + 16);

// ZIP64: los APK grandes marcan los campos de 32 bits al máximo y guardan los
// valores reales en un registro aparte.
if (offset === 0xffffffff || entries === 0xffff) {
  const locatorSig = 0x07064b50;
  let locator = -1;
  for (let i = eocd - 20; i >= 0; i--) {
    if (buf.readUInt32LE(i) === locatorSig) {
      locator = i;
      break;
    }
  }
  if (locator < 0) {
    console.error('APK con ZIP64 pero sin localizador: no se puede verificar.');
    process.exit(1);
  }
  const z64 = Number(buf.readBigUInt64LE(locator + 8));
  entries = Number(buf.readBigUInt64LE(z64 + 32));
  offset = Number(buf.readBigUInt64LE(z64 + 48));
}

const names = [];
let p = offset;
for (let i = 0; i < entries; i++) {
  if (buf.readUInt32LE(p) !== 0x02014b50) break;
  const nameLen = buf.readUInt16LE(p + 28);
  const extraLen = buf.readUInt16LE(p + 30);
  const commentLen = buf.readUInt16LE(p + 32);
  names.push(buf.toString('utf8', p + 46, p + 46 + nameLen));
  p += 46 + nameLen + extraLen + commentLen;
}

/* -------------------------------------------------- comprobaciones ------- */

const ASSETS = 'assets/public/';
const has = name => names.includes(name);
const countIn = dir => names.filter(n => n.startsWith(`${ASSETS}${dir}/`) && !n.endsWith('/')).length;

const views = countIn('views');
const core = names.filter(n => n.startsWith(`${ASSETS}core/`) && n.endsWith('.mjs')).length;
const icons = countIn('icons');
const sizeMb = buf.length / 1024 / 1024;

const checks = [
  ['El APK contiene el índice de la aplicación', has(`${ASSETS}index.html`)],
  ['El APK contiene el arranque (app.js)', has(`${ASSETS}app.js`)],
  ['El APK contiene la hoja de estilos', has(`${ASSETS}app.css`)],
  ['El APK contiene el manifiesto PWA', has(`${ASSETS}manifest.webmanifest`)],
  [`El APK contiene las 10 vistas (encontradas: ${views})`, views >= 10],
  [`El APK contiene el núcleo de cálculo (módulos: ${core})`, core >= 6],
  [`El APK contiene los iconos (${icons})`, icons >= 3],
  ['El APK contiene el manifiesto de Android', has('AndroidManifest.xml')],
  ['El APK contiene los recursos compilados', has('resources.arsc')],
  ['El APK contiene el bytecode (classes.dex)', has('classes.dex')],
  [`Tamaño razonable (${sizeMb.toFixed(1)} MB)`, sizeMb > 1 && sizeMb < 120]
];

console.log(`Verificando ${apkPath} — ${names.length} entradas en el ZIP\n`);
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} ${label}`);
  if (!ok) failed++;
}

// El motor de cálculo tiene que estar de verdad, no sólo el archivo: se busca
// la tasa dentro del módulo embebido de reglas.
const rulesEntry = names.find(n => n.endsWith('core/chile-tax-rules/rules.generated.mjs'));
if (!rulesEntry) {
  console.log('  FALLA Las reglas tributarias no viajan en el APK');
  failed++;
} else {
  console.log('  OK   Las reglas tributarias viajan en el APK');
}

console.log('');
if (failed > 0) {
  console.error(`${failed} comprobación(es) fallaron: este APK NO debe publicarse.`);
  process.exit(1);
}
console.log(`APK verificado: la aplicación completa viaja dentro (${sizeMb.toFixed(1)} MB).`);
