import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.webp':'image/webp', '.ttf':'font/ttf', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Private path');
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) throw new Error('Invalid path');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'X-Robots-Tag':'noindex, nofollow', 'X-Content-Type-Options':'nosniff' });
    res.end(content);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('Página não encontrada'); }
}).listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
