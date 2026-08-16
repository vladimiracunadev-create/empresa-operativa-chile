/**
 * Conversor Markdown → HTML suficiente para los documentos de ESTE repositorio.
 *
 * No pretende ser un motor Markdown general: cubre exactamente lo que usan el
 * manual y la guía —encabezados, tablas, listas, citas, avisos de GitHub,
 * código, imágenes y bloques HTML crudos— y nada más. A cambio, no añade una
 * dependencia de producción a un proyecto que tiene cero.
 *
 * `resolveImage` decide qué hacer con cada `src`: embeberla como data URI (PDF
 * y HTML autocontenido) o dejarla como ruta relativa. Devolver `null` omite la
 * imagen, que es lo que se hace con las insignias remotas.
 *
 * Sólo lo usan scripts de build.
 */
import fs from 'node:fs';
import path from 'node:path';

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

/** Crea un `resolveImage` que embebe las imágenes locales de `baseDir`. */
export function embedFrom(baseDir) {
  return relPath => {
    if (/^https?:/.test(relPath)) return null;
    const file = path.join(baseDir, relPath);
    if (!fs.existsSync(file)) throw new Error(`El documento referencia una imagen que no existe: ${relPath}`);
    const mime = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
  };
}

/** Ancla al estilo GitHub, para que los índices funcionen igual dentro y fuera. */
export const slug = text =>
  String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const ALERTS = {
  NOTE: ['ℹ️', 'Nota', 'note'],
  TIP: ['💡', 'Consejo', 'tip'],
  IMPORTANT: ['❗', 'Importante', 'important'],
  WARNING: ['⚠️', 'Advertencia', 'warning'],
  CAUTION: ['🛑', 'Precaución', 'warning']
};

/**
 * @param {string} md
 * @param {{ resolveImage: (src: string) => string|null, linkExternal?: boolean }} options
 *        `linkExternal` deja los enlaces externos como `<a>` (HTML) en vez de
 *        convertirlos en texto plano (PDF, donde un enlace no se puede pulsar).
 */
export function markdownToHtml(md, { resolveImage, linkExternal = false } = {}) {
  const image = (alt, src) => {
    const uri = resolveImage(src);
    return uri ? `<img src="${uri}" alt="${esc(alt)}" loading="lazy">` : '';
  };

  const inline = text => {
    let out = esc(text);
    out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => image(alt, src));
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
      if (href.startsWith('#')) return `<a href="${href}">${label}</a>`;
      if (linkExternal) return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      return `<span class="link">${label}</span>`;
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>');
    return out;
  };

  const lines = md.split(/\r?\n/);
  const out = [];
  const state = { list: null };
  let i = 0;

  const closeList = () => {
    if (state.list) {
      out.push(`</${state.list}>`);
      state.list = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Bloques HTML crudos: galerías de capturas y anclas de índice.
    if (/^<(div|table|details|img|sub|tr|td|th|a|figure|p)\b/.test(line.trim())) {
      closeList();
      const block = [];
      let depth = 0;
      do {
        block.push(lines[i]);
        depth += (lines[i].match(/<(div|table|details|figure)\b/g) ?? []).length;
        depth -= (lines[i].match(/<\/(div|table|details|figure)>/g) ?? []).length;
        i++;
      } while (i < lines.length && depth > 0);
      out.push(
        block
          .join('\n')
          .replace(/<img src="([^"]+)"/g, (m, src) => {
            const uri = resolveImage(src);
            return uri ? `<img src="${uri}"` : m;
          })
          .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')
          .replace(/!\[[^\]]*\]\(https?:[^)]*\)/g, '')
      );
      continue;
    }

    const alert = line.match(/^>\s*\[!(\w+)\]/);
    if (alert && ALERTS[alert[1]]) {
      closeList();
      const [icon, label, cls] = ALERTS[alert[1]];
      i++;
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<div class="alert alert--${cls}"><div class="alert__head">${icon} ${label}</div><p>${inline(body.join(' ').trim())}</p></div>`);
      continue;
    }

    if (line.startsWith('> ')) {
      closeList();
      const body = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${body.filter(Boolean).map(b => `<p>${inline(b)}</p>`).join('')}</blockquote>`);
      continue;
    }

    if (line.startsWith('```')) {
      closeList();
      const lang = line.slice(3).trim();
      i++;
      const code = [];
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i]), i++;
      i++;
      out.push(`<pre class="code" data-lang="${esc(lang)}"><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }

    if (line.includes('|') && lines[i + 1]?.match(/^\s*\|?[\s:|-]+\|/)) {
      closeList();
      const cells = row => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(line);
      const align = cells(lines[i + 1]).map(a => (a.startsWith(':') && a.endsWith(':') ? 'center' : a.endsWith(':') ? 'right' : 'left'));
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) body.push(cells(lines[i])), i++;
      out.push(
        `<div class="tablewrap"><table><thead><tr>${head
          .map((h, n) => `<th style="text-align:${align[n] ?? 'left'}">${inline(h)}</th>`)
          .join('')}</tr></thead><tbody>${body
          .map(r => `<tr>${r.map((c, n) => `<td style="text-align:${align[n] ?? 'left'}">${inline(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      const text = heading[2].replace(/\s*\{#.*\}$/, '');
      out.push(`<h${level} id="${slug(text)}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      closeList();
      out.push('<hr>');
      i++;
      continue;
    }

    const item = line.match(/^\s*([-*]|\d+\.)\s+(.*)$/);
    if (item) {
      const tag = /\d/.test(item[1]) ? 'ol' : 'ul';
      if (state.list !== tag) {
        closeList();
        out.push(`<${tag}>`);
        state.list = tag;
      }
      const checkbox = item[2].match(/^\[( |x)\]\s+(.*)$/i);
      out.push(
        checkbox
          ? `<li class="task"><span class="box">${checkbox[1].toLowerCase() === 'x' ? '✓' : ''}</span>${inline(checkbox[2])}</li>`
          : `<li>${inline(item[2])}</li>`
      );
      i++;
      continue;
    }

    if (!line.trim()) {
      closeList();
      i++;
      continue;
    }

    closeList();
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^([-*#>|]|\d+\.|```|<)/.test(lines[i].trim())) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }

  closeList();
  return out.join('\n');
}
