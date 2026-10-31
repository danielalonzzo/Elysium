import { mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const path of ['index.html', 'assets', 'css', 'js', 'robots.txt', '_headers']) {
  await cp(root + path, new URL(path, dist), { recursive: true });
}
console.log('Build complete: dist/ (static assets only, original photographs excluded).');
