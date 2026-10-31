import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(root + 'index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate element IDs');
let internalLinks = 0;
let files = new Set();
for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const value = match[1];
  if (value.startsWith('#')) {
    assert(ids.includes(value.slice(1)), `Missing anchor: ${value}`);
    internalLinks++;
  } else if (!/^[a-z]+:/i.test(value)) {
    files.add(value);
    assert((await stat(resolve(root, value))).isFile(), `Missing file: ${value}`);
  }
}
const css = await readFile(root + 'css/style.css', 'utf8');
for (const match of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
  const path = resolve(root, 'css', match[1]);
  assert((await stat(path)).isFile(), `Missing CSS dependency: ${path}`);
  files.add(path);
}
for (const match of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(match[0]), 'Missing image alternative');
assert(/lang="pt-PT"/.test(html));
assert(/name="robots" content="noindex, nofollow"/.test(html));
for (const text of ['Rua de Vale D’Álvaro, 30','5300-274 Bragança','tel:+351937588572','tel:+351964477596','mailto:geral.fisiosaude@gmail.com','mailto:fisioterapia@fisio-saude.com','14:00–21:00','Medicina Física e de Reabilitação','Pilates Clínico']) assert(html.includes(text), `Missing clinic data: ${text}`);
for (const forbidden of ['41.80964','-6.76271','502803193','273 324 829','geral@fisinor.pt','firebase-config','pmorais.pt','960471537']) assert(!html.includes(forbidden), `Foreign or superseded identity: ${forbidden}`);
assert(!/<form\b|<iframe\b/.test(html), 'Unexpected collection or third-party embedded resource');
assert.equal((html.match(/<h1\b/g) || []).length,1);
console.log(`PASS: ${internalLinks} internal links; ${files.size} local dependencies; image alternatives, identity, contact details and prototype indexing.`);
