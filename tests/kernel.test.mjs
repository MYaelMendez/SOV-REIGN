import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveEntry, publicManifest, moltContext, createSession, verifyLocalReceiptIntegrity, ORIGIN, PUBLIC } from '../src/kernel.mjs';
const profile = () => ({ id: 'ae', name: '^\u00e6 / Agency 001', purpose: 'Return value to the human.', preferredExecutor: 'ae', capabilities: ['manifest.export', 'doola.handoff'] });
async function approved(session = createSession()) {
  const p = await session.prepare(profile());
  return { session, p, ticket: session.approve(p.id, p.digest, true) };
}
test('entry spellings share the human-intention pivot', () => {
  for (const x of ['$ae', '$AE', '$\u00e6', '\u00e6', '$mcp', '&MCP', '$@\u2764\ufe0f', '@\u2764', '$heart', ORIGIN]) assert.equal(resolveEntry(x), 'intention');
  assert.equal(resolveEntry(PUBLIC), 'public-review');
});
test('unknown, oversized, and hidden-character commands do not resolve', () => {
  for (const x of [null, {}, 'x'.repeat(129), '$mcp\u200b', '$mcp;publish', 'javascript:alert(1)']) assert.equal(resolveEntry(x), null);
});
test('public manifest defaults to no authority and no dispatch', () => {
  const m = publicManifest(profile());
  assert.deepEqual(m.authority, { principal: 'human', inherited: false, grant: null });
  assert.equal(m.coordinates.origin, ORIGIN); assert.equal(m.coordinates.public, PUBLIC);
  assert.equal(m.execution.dispatch, false); assert.equal(m.publication.deploymentAuthorized, false);
  assert.equal(m.capabilities[1].status, 'unbound');
});
test('Codex is a preference, not a connection or execution grant', () => {
  const m = publicManifest({ ...profile(), preferredExecutor: 'codex' });
  assert.equal(m.execution.preference, 'codex'); assert.equal(m.execution.connection, 'unverified');
});
test('private context and imported grants are rejected, not copied', () => {
  for (const key of ['privateIntent', 'token', 'authority', 'connected', '__proto__']) {
    const p = profile(); Object.defineProperty(p, key, { value: 'SECRET', enumerable: true });
    assert.throws(() => publicManifest(p), /fields/);
  }
});
test('missing or malformed public fields fail closed', () => {
  const p = profile(); delete p.purpose; assert.throws(() => publicManifest(p));
  for (const change of [{ id: '../escape' }, { name: '' }, { purpose: 'x'.repeat(241) }, { name: 'abc\u202e' }, { preferredExecutor: 'automatic-admin' }, { capabilities: {} }]) assert.throws(() => publicManifest({ ...profile(), ...change }));
});
test('capabilities are bounded identifiers without duplicates', () => {
  for (const capabilities of [['x', 'x'], ['https://malicious.example'], ['exec;rm'], Array(25).fill('x')]) assert.throws(() => publicManifest({ ...profile(), capabilities }));
});
test('public labels remain text rather than executed markup', () => {
  assert.equal(publicManifest({ ...profile(), name: '<img src=x onerror=alert(1)>' }).agency.name, '<img src=x onerror=alert(1)>');
});
test('molt requires a parent and contains only references, not authority', () => {
  const child = moltContext('parent', ['widget.a', 'widget.a', 'widget.b']);
  assert.deepEqual(child.publicRefs, ['widget.a', 'widget.b']); assert.equal(child.parentId, 'parent');
  assert.equal(child.authority, null); assert.equal(child.execution, 'not-authorized');
  assert.throws(() => moltContext('', [])); assert.throws(() => moltContext('parent', [{ authority: 'admin' }]));
});
test('preparation is deterministic for the public payload and isolates mutation', async () => {
  const s = createSession(), p = profile(), a = await s.prepare(p), b = await s.prepare(p);
  assert.equal(a.digest, b.digest); p.name = 'changed'; a.manifest.agency.name = 'spoofed';
  const result = await s.execute(s.approve(a.id, a.digest, true));
  assert.equal(result.manifest.agency.name, '^\u00e6 / Agency 001');
});
test('confirmation must be explicit and strictly boolean', async () => {
  const s = createSession(), p = await s.prepare(profile());
  for (const confirm of [false, 1, 'true', null, undefined]) assert.throws(() => s.approve(p.id, p.digest, confirm), /confirmation/);
});
test('review digest must match exact prepared output', async () => {
  const s = createSession(), p = await s.prepare(profile());
  assert.throws(() => s.approve(p.id, 'wrong', true), /digest/);
});
test('forged or deserialized approval cannot execute', async () => {
  const s = createSession(); await assert.rejects(s.execute({ approved: true }), /Approval/);
  const { ticket } = await approved(s); await assert.rejects(s.execute(JSON.parse(JSON.stringify(ticket))), /Approval/);
});
test('tickets cannot move between environments', async () => {
  const a = await approved(); await assert.rejects(createSession().execute(a.ticket), /Approval/);
});
test('only the local draft-export operation exists', async () => {
  const a = await approved();
  for (const operation of ['publish', 'doola.formation', 'email.send', 'shell.exec']) await assert.rejects(a.session.execute(a.ticket, operation), /denied/);
});
test('single-use approval rejects replay including concurrent calls', async () => {
  const a = await approved();
  const attempts = await Promise.allSettled([a.session.execute(a.ticket), a.session.execute(a.ticket)]);
  assert.equal(attempts.filter(x => x.status === 'fulfilled').length, 1);
});
test('one proposal cannot issue multiple approvals', async () => {
  const a = await approved(); assert.throws(() => a.session.approve(a.p.id, a.p.digest, true));
});
test('expired prepared proposals cannot be approved', async () => {
  let time = 0; const s = createSession({ now: () => time, ttlMs: 100 });
  const p = await s.prepare(profile()); time = 100;
  assert.throws(() => s.approve(p.id, p.digest, true), /expired/);
});
test('expired approval cannot be executed', async () => {
  let time = 0; const a = await approved(createSession({ now: () => time, ttlMs: 100 })); time = 100;
  await assert.rejects(a.session.execute(a.ticket), /expired/);
});
test('clearing revokes approvals and pending preparation', async () => {
  const a = await approved(); a.session.clear(); await assert.rejects(a.session.execute(a.ticket), /Approval/);
  const s = createSession(), pending = s.prepare(profile()); s.clear(); await assert.rejects(pending, /cancelled/);
});
test('clock regression and invalid session settings fail closed', async () => {
  for (const ttlMs of [0, -1, Infinity, 300001, '100']) assert.throws(() => createSession({ ttlMs }));
  let time = 100; const a = await approved(createSession({ now: () => time })); time = 99;
  await assert.rejects(a.session.execute(a.ticket), /clock/);
});
test('local receipt matches output without claiming external success', async () => {
  const a = await approved(), r = await a.session.execute(a.ticket);
  assert.equal(await verifyLocalReceiptIntegrity(r.manifest, r.receipt), true);
  assert.equal(r.receipt.deployed, false); assert.equal(r.receipt.externalSuccess, false); assert.equal(r.receipt.signature, null);
  r.manifest.agency.name = 'changed'; assert.equal(await verifyLocalReceiptIntegrity(r.manifest, r.receipt), false);
});
test('receipt integrity check rejects invented external success', async () => {
  const a = await approved(), r = await a.session.execute(a.ticket);
  assert.equal(await verifyLocalReceiptIntegrity(r.manifest, { ...r.receipt, externalSuccess: true }), false);
});
test('founding agency example validates', async () => {
  const p = JSON.parse(await readFile(new URL('../examples/agency-ae.json', import.meta.url), 'utf8'));
  assert.equal(publicManifest(p).agency.id, 'ae');
});
