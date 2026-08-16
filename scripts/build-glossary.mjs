#!/usr/bin/env node
/**
 * Genera `docs/GLOSSARY.md` desde `packages/glossary/index.mjs`.
 *
 * Por qué existe este paso: el glosario tiene tres consumidores —la vista
 * “Glosario” de la aplicación, las ayudas contextuales junto a los campos y la
 * documentación del repositorio— y escribirlo tres veces garantiza que en dos
 * semanas digan cosas distintas. Aquí sólo hay una copia; el documento es una
 * proyección de ella.
 *
 * `--check` no escribe nada: falla si el documento quedó desfasado del módulo.
 * CI lo ejecuta en ese modo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TERMS, termsByCategory, danglingReferences } from '../packages/glossary/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'docs/GLOSSARY.md');

const dangling = danglingReferences();
if (dangling.length) {
  console.error('El glosario referencia términos que no existen:');
  dangling.forEach(d => console.error(`  ${d}`));
  process.exit(1);
}

const anchor = id => `#${id}`;
const link = id => {
  const t = TERMS.find(x => x.id === id);
  return t ? `[${t.term}](${anchor(id)})` : id;
};

const section = ({ category, terms }) => `
## ${category}

${terms
  .map(t => {
    const lines = [`<a id="${t.id}"></a>`, `### ${t.term}`, '', `**${t.short}**`, '', t.long];
    if (t.notToConfuseWith?.length) lines.push('', `> ⚠️ **No confundir con:** ${t.notToConfuseWith.map(link).join(' · ')}`);
    if (t.related?.length) lines.push('', `Relacionado: ${t.related.map(link).join(' · ')}`);
    const meta = [];
    if (t.legalReference) meta.push(`Base legal: ${t.legalReference}`);
    if (t.source) meta.push(`Fuente: ${t.source}`);
    if (t.lastVerified) meta.push(`Verificado: ${t.lastVerified}`);
    if (meta.length) lines.push('', `<sub>${meta.join(' · ')}</sub>`);
    return lines.join('\n');
  })
  .join('\n\n')}`;

const body = `<!-- GENERADO POR scripts/build-glossary.mjs — NO EDITAR A MANO. -->
<!-- Fuente de verdad: packages/glossary/index.mjs · Regenerar: node scripts/build-glossary.mjs -->

# 📖 Glosario

${TERMS.length} términos. Estas mismas definiciones son las que muestra la aplicación al pulsar **?** junto a cualquier campo
y las que lista la pantalla **Glosario**: hay una sola copia, en \`packages/glossary/index.mjs\`, y CI comprueba que este
documento no se desvíe de ella.

> Las cinco magnitudes que este sistema se niega a tratar como sinónimos:
> **capital social**, **capital enterado**, **patrimonio contable**, **capital propio tributario** y **capital base de patente**.
> Cada una tiene su momento en el tiempo, su método de cálculo, su fuente legal y su evidencia.

## Índice

${termsByCategory()
  .map(g => `- **${g.category}** — ${g.terms.map(t => link(t.id)).join(' · ')}`)
  .join('\n')}
${termsByCategory().map(section).join('\n')}

---

Cuando una situación dependa de interpretación, de antecedentes particulares o de reglas municipales no disponibles,
la aplicación lo dice en vez de resolverlo sola: **requiere verificación con fuente oficial, municipalidad o profesional tributario.**
`;

const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (process.argv.includes('--check')) {
  if (previous !== body) {
    console.error('docs/GLOSSARY.md está desfasado respecto de packages/glossary/index.mjs.');
    console.error('Ejecuta: node scripts/build-glossary.mjs');
    process.exit(1);
  }
  console.log(`Glosario sincronizado (${TERMS.length} términos).`);
} else {
  fs.writeFileSync(target, body);
  console.log(`docs/GLOSSARY.md generado con ${TERMS.length} términos.`);
}
