/** Local reference policy, NOT production authentication or an authorization server. */
export const VERSION = '0.1.1';
export const ORIGIN = 'x0:y0:z0:\u00e6:\u00e6';
export const PUBLIC = 'x0:y0:z:0:\u00e6:\u00e6:\u00e6';
const MAX_TIME = 8640000000000000;
const MAX_PENDING = 64;
const HIDDEN = /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u;
const copy = x => structuredClone(x);
function requireThat(ok, message) { if (!ok) throw new Error(message); }
const plain = x => x !== null && typeof x === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(x));
/** Inspect own data descriptors without executing accessors. Live hostile Proxies are not sandboxed. */
function fields(x) {
  requireThat(plain(x), 'Expected plain data fields');
  const keys = Reflect.ownKeys(x);
  requireThat(keys.length <= 64 && keys.every(k => typeof k === 'string'), 'Unexpected fields');
  const out = Object.create(null);
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(x, key);
    requireThat(d && Object.hasOwn(d, 'value') && d.enumerable, 'Expected enumerable data fields');
    out[key] = d.value;
  }
  return out;
}
function exact(x, keys) {
  const out = fields(x), found = Object.keys(out);
  requireThat(found.length === keys.length && keys.every(k => Object.hasOwn(out, k)), 'Unexpected or missing fields');
  return out;
}
function dense(x, max = 24) {
  requireThat(Array.isArray(x) && Object.getPrototypeOf(x) === Array.prototype, 'Expected plain array');
  const length = Object.getOwnPropertyDescriptor(x, 'length').value;
  requireThat(length <= max && Reflect.ownKeys(x).length === length + 1, 'Invalid array length or fields');
  const out = [];
  for (let i = 0; i < length; i++) {
    const d = Object.getOwnPropertyDescriptor(x, String(i));
    requireThat(d && Object.hasOwn(d, 'value') && d.enumerable, 'Expected dense data array');
    out.push(d.value);
  }
  return out;
}
function label(x, max = 80) {
  requireThat(typeof x === 'string' && x.trim().length > 0 && x.length <= max && x.isWellFormed() && !HIDDEN.test(x), 'Invalid text');
  return x.trim().normalize('NFC');
}
function identifier(x) { requireThat(typeof x === 'string' && /^[a-z][a-z0-9.-]{0,63}$/.test(x), 'Invalid identifier'); return x; }
export function resolveEntry(value) {
  if (typeof value !== 'string' || value.length > 128 || !value.isWellFormed() || HIDDEN.test(value)) return null;
  const text = value.trim().normalize('NFC').toLowerCase().replace(/\ufe0f/gu, '');
  if (['$chat', '>_\u00e6://chat_kernel', '\u00e6', '$\u00e6', '$ae', '$mcp', '&mcp', '$mpc', '>_\u00e6\u00e6\u00e6://|||', ORIGIN.toLowerCase()].includes(text)) return 'intention';
  if (['$\u2764', '$@\u2764', '@\u2764', '$heart'].includes(text)) return 'intention';
  if (text === PUBLIC.toLowerCase() || text === 'public') return 'public-review';
  return null;
}
/** Strict public projection. Private intention is deliberately not an input. */
export function publicManifest(input) {
  const p = exact(input, ['id', 'name', 'purpose', 'preferredExecutor', 'capabilities']);
  const id = identifier(p.id), name = label(p.name), purpose = label(p.purpose, 240);
  requireThat(['ae', 'codex'].includes(p.preferredExecutor), 'Unsupported executor');
  const ids = dense(p.capabilities).map(identifier);
  requireThat(new Set(ids).size === ids.length, 'Duplicate capability');
  return {
    schema: 'open-sovereign.public-manifest.v1', version: VERSION,
    agency: { id, name, purpose }, coordinates: { origin: ORIGIN, public: PUBLIC },
    execution: { preference: p.preferredExecutor, connection: 'unverified', dispatch: false },
    capabilities: ids.map(id => ({ id, status: id === 'manifest.export' ? 'local-only' : 'unbound' })),
    authority: { principal: 'human', inherited: false, grant: null },
    publication: { status: 'draft', deploymentAuthorized: false }
  };
}
/** Sorted-key JSON, bounded and accessor-free; NOT a claim of RFC 8785 compatibility. */
function canonical(value) {
  let nodes = 0;
  const seen = new Set();
  function walk(x, depth) {
    requireThat(++nodes <= 2048 && depth <= 12, 'JSON budget exceeded');
    if (x === null || typeof x === 'boolean') return x;
    if (typeof x === 'string') { requireThat(x.length <= 4096 && x.isWellFormed(), 'Invalid JSON text'); return x; }
    if (typeof x === 'number') { requireThat(Number.isFinite(x), 'Invalid JSON number'); return x; }
    requireThat(typeof x === 'object' && !seen.has(x), 'Expected acyclic JSON data');
    seen.add(x);
    let out;
    if (Array.isArray(x)) out = dense(x, 128).map(item => walk(item, depth + 1));
    else {
      const record = fields(x); out = Object.create(null);
      for (const k of Object.keys(record).sort()) out[k] = walk(record[k], depth + 1);
    }
    seen.delete(x); return out;
  }
  const text = JSON.stringify(walk(value, 0));
  requireThat(text.length <= 65536, 'JSON budget exceeded');
  return text;
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(canonical(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export function moltContext(parentId, publicRefs) {
  identifier(parentId);
  const refs = [...new Set(dense(publicRefs).map(identifier))];
  return { schema: 'open-sovereign.molt-context.v1', id: crypto.randomUUID(), parentId, publicRefs: refs, authority: null, execution: 'not-authorized' };
}
/**
 * Trusted local UI/test harness only. A confirmation boolean is NOT authentication.
 * Tickets are nonserializable object identities, expiring, single-use and session-local.
 */
export function createSession({ now = Date.now, ttlMs = 300000 } = {}) {
  requireThat(typeof now === 'function' && Number.isSafeInteger(ttlMs) && ttlMs > 0 && ttlMs <= 300000, 'Invalid session options');
  const fresh = () => ({ proposals: new Map(), approvals: new Map(), inFlight: 0 });
  let state = fresh(), lastTime = -Infinity, clockFault = false;
  function clock() {
    requireThat(!clockFault, 'Session clock fault; create a new session');
    let time;
    try { time = now(); } catch { clockFault = true; state = fresh(); throw Error('Invalid session clock'); }
    if (!Number.isSafeInteger(time) || time < 0 || time > MAX_TIME || time < lastTime) {
      clockFault = true; state = fresh(); throw Error('Invalid or regressed clock');
    }
    lastTime = time; return time;
  }
  function sweep(s, time) {
    for (const [id, p] of s.proposals) if (time >= p.expiresAt) {
      if (p.ticket) s.approvals.delete(p.ticket);
      s.proposals.delete(id);
    }
  }
  function pending(id) {
    const p = state.proposals.get(id);
    requireThat(p && p.state === 'prepared', 'Proposal unavailable or already used');
    requireThat(clock() < p.expiresAt, 'Proposal expired'); return p;
  }
  return Object.freeze({
    async prepare(input) {
      const s = state, time = clock(); sweep(s, time);
      requireThat(s.proposals.size + s.inFlight < MAX_PENDING, 'Session full; clear before continuing');
      requireThat(time <= MAX_TIME - ttlMs, 'Invalid expiry clock range');
      const manifest = publicManifest(input), expiresAt = time + ttlMs;
      s.inFlight++; // Reserve synchronously, BEFORE the first await.
      try {
        const hash = await digest(manifest);
        requireThat(s === state, 'Preparation cancelled');
        requireThat(clock() < expiresAt, 'Proposal expired during preparation');
        const id = crypto.randomUUID();
        requireThat(!s.proposals.has(id), 'Proposal identifier collision');
        s.proposals.set(id, { manifest, digest: hash, expiresAt, state: 'prepared' });
        return { id, digest: hash, expiresAt, manifest: copy(manifest), scope: 'manifest.export', status: 'prepared' };
      } finally { s.inFlight--; } // An old generation never decrements the new generation's counter.
    },
    approve(id, reviewedDigest, confirmed) {
      requireThat(confirmed === true, 'Explicit local confirmation required');
      const p = pending(id); requireThat(reviewedDigest === p.digest, 'Review digest mismatch');
      const ticket = Object.freeze(Object.create(null));
      p.state = 'approved'; p.ticket = ticket;
      state.approvals.set(ticket, id); return ticket;
    },
    async execute(ticket, operation = 'manifest.export') {
      requireThat(operation === 'manifest.export', 'External or unknown operation denied');
      const s = state, id = s.approvals.get(ticket), p = id && s.proposals.get(id);
      requireThat(p && p.state === 'approved', 'Approval unavailable');
      const time = clock(); requireThat(time < p.expiresAt, 'Approval expired');
      // Consume synchronously. Replay fails and completed work releases bounded capacity.
      s.approvals.delete(ticket); s.proposals.delete(id);
      return { manifest: copy(p.manifest), receipt: {
        schema: 'open-sovereign.local-receipt.v1', operation,
        proposalId: id, contentDigest: p.digest,
        recordedAt: new Date(time).toISOString(), result: 'public-draft-returned',
        externalSuccess: false, deployed: false, signature: null,
        authorizationBasis: 'local-user-confirmation-not-provider-authentication'
      } };
    },
    clear() { state = fresh(); }
  });
}
/** Shape + public-content integrity only; NEVER author authenticity or external success. */
export async function verifyLocalReceiptIntegrity(manifest, receipt) {
  try {
    // Snapshot BEFORE await; reject accessors, custom toJSON, cycles and excess data.
    const m = JSON.parse(canonical(manifest));
    exact(m, ['schema','version','agency','coordinates','execution','capabilities','authority','publication']);
    const agency = exact(m.agency, ['id','name','purpose']);
    const execution = exact(m.execution, ['preference','connection','dispatch']);
    const expected = publicManifest({ ...agency, preferredExecutor:execution.preference, capabilities:dense(m.capabilities).map(c => exact(c,['id','status']).id) });
    if (canonical(m) !== canonical(expected)) return false;
    const r = exact(receipt, ['schema','operation','proposalId','contentDigest','recordedAt','result','externalSuccess','deployed','signature','authorizationBasis']);
    if (r.schema !== 'open-sovereign.local-receipt.v1' || r.operation !== 'manifest.export' ||
        r.result !== 'public-draft-returned' || r.externalSuccess !== false || r.deployed !== false || r.signature !== null ||
        r.authorizationBasis !== 'local-user-confirmation-not-provider-authentication' ||
        typeof r.proposalId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(r.proposalId) ||
        typeof r.contentDigest !== 'string' || !/^[0-9a-f]{64}$/u.test(r.contentDigest) ||
        typeof r.recordedAt !== 'string' || r.recordedAt.length > 27 || !Number.isFinite(Date.parse(r.recordedAt)) || new Date(r.recordedAt).toISOString() !== r.recordedAt) return false;
    return r.contentDigest === await digest(m);
  } catch { return false; }
}
