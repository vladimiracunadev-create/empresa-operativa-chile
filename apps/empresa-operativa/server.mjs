#!/usr/bin/env node
/**
 * Servidor local de la aplicación.
 *
 * Sirve `apps/web/dist` en 127.0.0.1 para usar la app en el navegador sin
 * instalar nada. No hay API ni base de datos detrás: la aplicación es
 * enteramente cliente y guarda en el almacenamiento del propio navegador. Este
 * proceso sólo entrega archivos.
 *
 * Escucha en 127.0.0.1 y no en 0.0.0.0 a propósito: son datos contables de una
 * empresa real, y no tienen por qué quedar expuestos al resto de la red local
 * porque alguien levantó la app en un café.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '../web/dist');
const port = Number(process.env.PORT || 4180);
const host = process.env.HOST || '127.0.0.1';

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('No existe apps/web/dist. Ejecuta primero:\n\n  node scripts/build-web.mjs\n');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

/**
 * Resuelve una ruta pedida dentro de `distDir`.
 *
 * Devuelve `null` si el resultado se sale del directorio. La comprobación se
 * hace con separador (`dist` + sep) y no con un `startsWith` del nombre a
 * secas: sin ese separador, un directorio hermano llamado `dist-privado`
 * pasaría el filtro.
 */
function resolveSafe(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? '/index.html' : decoded;
  const full = path.resolve(distDir, `.${path.posix.normalize(rel)}`);
  if (full !== distDir && !full.startsWith(distDir + path.sep)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' });
    return res.end('Method Not Allowed');
  }

  const full = resolveSafe(new URL(req.url, `http://${host}`).pathname);
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('No encontrado');
  }

  res.writeHead(200, {
    'content-type': `${TYPES[path.extname(full)] ?? 'application/octet-stream'}; charset=utf-8`,
    'cache-control': 'no-cache',
    // La app no carga nada de terceros: la política lo hace explícito y
    // convierte cualquier futura dependencia externa en un error visible.
    'content-security-policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer'
  });

  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(full).pipe(res);
});

server.listen(port, host, () => {
  console.log(`\n  Empresa Operativa Chile`);
  console.log(`  http://${host}:${port}\n`);
  console.log(`  Los datos se guardan en este navegador, no en el servidor.`);
  console.log(`  Ctrl+C para detener.\n`);
});
