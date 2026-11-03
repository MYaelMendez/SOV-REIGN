import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const files = new Map([
  ['/mov/', ['mov/index.html', 'text/html; charset=utf-8']],
  ['/mov/index.html', ['mov/index.html', 'text/html; charset=utf-8']],
  ['/mov/app.mjs', ['mov/app.mjs', 'text/javascript; charset=utf-8']],
  ['/mov/catalog.mjs', ['mov/catalog.mjs', 'text/javascript; charset=utf-8']],
  ['/mov/style.css', ['mov/style.css', 'text/css; charset=utf-8']],
  ['/src/viewports.mjs', ['src/viewports.mjs', 'text/javascript; charset=utf-8']],
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/web/style.css', ['web/style.css', 'text/css; charset=utf-8']],
  ['/web/app.mjs', ['web/app.mjs', 'text/javascript; charset=utf-8']],
  ['/src/kernel.mjs', ['src/kernel.mjs', 'text/javascript; charset=utf-8']]
]);
export function makeServer() {
  const server = createServer({ maxHeaderSize:8192, headersTimeout:10000, requestTimeout:15000, keepAliveTimeout:5000 }, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; object-src 'none'");
    const fail = (code, message) => { res.setHeader('Connection','close'); res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8'}); res.end(req.method === 'HEAD' ? undefined : message); req.resume(); };
    // Loopback binding alone is not a Host check. Reject rebinding-style requests.
    const port = req.socket.localPort, host = req.headers.host;
    const hosts = ['127.0.0.1:'+port, 'localhost:'+port, '[::1]:'+port];
    const count = name => req.rawHeaders.filter((x,i) => i%2 === 0 && x.toLowerCase() === name).length;
    if (count('host') !== 1 || !hosts.includes(host) || count('origin') > 1 || count('sec-fetch-site') > 1) return fail(403,'Local host required');
    if ((req.headers.origin !== undefined && req.headers.origin !== 'http://'+host) ||
        (req.headers['sec-fetch-site'] !== undefined && !['none','same-origin'].includes(req.headers['sec-fetch-site']))) return fail(403,'Same-origin preview only');
    if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); return fail(405,'Read only'); }
    if (req.headers['transfer-encoding'] || (req.headers['content-length'] !== undefined && req.headers['content-length'] !== '0')) return fail(400,'Request body not supported');
    // Match the raw request target. Never normalize traversal, encoded or absolute URLs into an allowlisted asset.
    if (typeof req.url !== 'string' || req.url.length > 1024 || !req.url.startsWith('/') || req.url.startsWith('//')) return fail(400,'Bad path');
    const file = files.get(req.url);
    if (!file) return fail(404,'Not found');
    try {
      const bytes = await readFile(new URL(file[0], root));
      res.writeHead(200, { 'Content-Type':file[1], 'Content-Length':bytes.byteLength });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { fail(500,'File unavailable'); }
  });
  server.maxHeadersCount = 64;
  server.maxRequestsPerSocket = 100;
  server.setTimeout(15000, socket => socket.destroy());
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Use a port from 1024 to 65535');
  const server = makeServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Open Sovereign local preview: http://127.0.0.1:${port}`));
}
