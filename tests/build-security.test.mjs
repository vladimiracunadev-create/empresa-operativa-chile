import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { readUtf8IfExists } from '../scripts/lib/files.mjs';
import { escAttr, markdownToHtml } from '../scripts/lib/markdown.mjs';

test('los valores de atributos HTML escapan comillas además de etiquetas', () => {
  assert.equal(escAttr(`a&b<"'`), 'a&amp;b&lt;&quot;&#39;');

  const html = markdownToHtml(
    `[enlace](https://example.test/?q=" onmouseover="alert)\n\n![texto" onerror="alert](local.png)`,
    {
      linkExternal: true,
      resolveImage: () => `data:image/png;base64,abc" onerror="alert`
    }
  );

  assert.doesNotMatch(html, / on(?:mouseover|error)="alert/i);
  assert.match(html, /&quot; onmouseover=&quot;/);
  assert.match(html, /alt="texto&quot; onerror=&quot;alert"/);
  assert.match(html, /src="data:image\/png;base64,abc&quot; onerror=&quot;alert"/);
});

test('la lectura opcional no separa exists de read y sólo tolera ENOENT', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eoc-files-test-'));
  try {
    const present = path.join(dir, 'present.txt');
    fs.writeFileSync(present, 'contenido');
    assert.equal(readUtf8IfExists(present), 'contenido');
    assert.equal(readUtf8IfExists(path.join(dir, 'missing.txt')), '');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('los generadores usan temporales exclusivos y evitan exists/read', () => {
  const chrome = fs.readFileSync(new URL('../scripts/lib/chrome.mjs', import.meta.url), 'utf8');
  const systemDocs = fs.readFileSync(new URL('../scripts/build-system-docs.mjs', import.meta.url), 'utf8');
  const projections = ['build-rules.mjs', 'build-glossary.mjs', 'build-shortcuts.mjs'].map(file =>
    fs.readFileSync(new URL(`../scripts/${file}`, import.meta.url), 'utf8')
  );

  assert.match(chrome, /mkdtempSync\(path\.join\(os\.tmpdir\(\), 'eoc-print-'\)\)/);
  assert.match(systemDocs, /mkdtempSync\(path\.join\(os\.tmpdir\(\), 'eoc-mermaid-'\)\)/);
  assert.match(systemDocs, /COPYFILE_EXCL/);
  for (const source of projections) {
    assert.doesNotMatch(source, /existsSync\(target\)/);
    assert.match(source, /readUtf8IfExists\(target\)/);
  }
});
