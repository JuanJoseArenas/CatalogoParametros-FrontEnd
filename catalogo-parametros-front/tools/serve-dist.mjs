import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const portal = resolve(root, 'dist/catalogo-parametros-front/browser');
const microfrontend = resolve(root, 'dist/parametros-ui');
const port = Number(process.env.FRONT_PORT ?? 4300);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };

function within(base, candidate) {
  const prefix = candidate.slice(0, base.length).toLowerCase() === base.toLowerCase();
  const next = candidate.charAt(base.length);
  return candidate === base || (prefix && (next === String.fromCharCode(92) || next === '/'));
}
async function fileFor(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const base = decoded.startsWith('/parametros-ui/') ? microfrontend : portal;
  const relative = decoded.startsWith('/parametros-ui/') ? decoded.slice('/parametros-ui/'.length) : decoded.replace(/^\//, '');
  const candidate = resolve(normalize(join(base, relative)));
  if (!within(base, candidate)) return null;
  try { if ((await stat(candidate)).isFile()) return candidate; } catch { /* fallback SPA */ }
  if (base === portal) {
    const index = join(portal, 'index.html');
    try { await stat(index); return index; } catch { return null; }
  }
  return null;
}

createServer(async (request, response) => {
  try {
    const file = await fileFor(request.url ?? '/');
    if (!file) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(file));
  } catch { response.writeHead(500); response.end('Server error'); }
}).listen(port, '127.0.0.1', () => console.log(`Frontend UCO disponible en http://localhost:${port}/`));
