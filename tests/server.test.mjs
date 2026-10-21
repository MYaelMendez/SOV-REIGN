import test from 'node:test';
import assert from 'node:assert/strict';
import { makeServer } from '../scripts/serve.mjs';
test('preview serves only allowlisted files and accepts no writes', async t => {
  const s = makeServer(); await new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  t.after(() => { s.closeAllConnections(); s.close(); });
  const base = `http://127.0.0.1:${s.address().port}`;
  const page = await fetch(base); assert.equal(page.status, 200);
  assert.ok(page.headers.get('content-security-policy').includes("connect-src 'self'"));
  assert.equal(page.headers.get('referrer-policy'), 'no-referrer');
  assert.match(await page.text(), /Open Sovereign/);
  assert.equal((await fetch(base + '/.env')).status, 404);
  assert.equal((await fetch(base + '/docs/SECURITY.md')).status, 404);
  assert.equal((await fetch(base + '/', { method: 'POST', body: 'private intention' })).status, 405);
  const js = await fetch(base + '/src/kernel.mjs'); assert.equal(js.status, 200);
  assert.match(js.headers.get('content-type'), /javascript/);
});
