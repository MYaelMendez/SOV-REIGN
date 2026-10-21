import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/web/style.css', ['web/style.css', 'text/css; charset=utf-8']],
  ['/web/app.mjs', ['web/app.mjs', 'text/javascript; charset=utf-8']],
  ['/src/kernel.mjs', ['src/kernel.mjs', 'text/javascript; charset=utf-8']]
]);
export function makeServer() {
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'");
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end('Read only'); }
    let path;
    try { path = new URL(req.url, 'http://127.0.0.1').pathname; } catch { res.writeHead(400); return res.end('Bad path'); }
    const file = files.get(path);
    if (!file) { res.writeHead(404); return res.end('Not found'); }
    try {
      const bytes = await readFile(new URL(file[0], root));
      res.writeHead(200, { 'Content-Type': file[1] });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(500); res.end('File unavailable'); }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Use a port from 1024 to 65535');
  const server = makeServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Open Sovereign local preview: http://127.0.0.1:${port}`));
}
