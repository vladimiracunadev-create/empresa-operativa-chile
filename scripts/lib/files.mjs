import fs from 'node:fs';

/** Lee UTF-8 sin separar la comprobación de existencia de la lectura. */
export function readUtf8IfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}
