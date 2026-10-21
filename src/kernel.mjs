/** Open Sovereign: local reference policy, NOT a production authorization service. */
export const VERSION = '0.1.0';
export const ORIGIN = 'x0:y0:z0:\u00e6:\u00e6';
export const PUBLIC = 'x0:y0:z:0:\u00e6:\u00e6:\u00e6';
const plain = x => x !== null && Object.getPrototypeOf(x) === Object.prototype;
const copy = x => structuredClone(x);
function requireThat(ok, message) { if (!ok) throw new Error(message); }
function exact(x, keys) {
  requireThat(plain(x) && Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k)), 'Unexpected or missing fields');
}
function label(x, max = 80) {
  requireThat(typeof x === 'string' && x.trim().length > 0 && x.length <= max && !/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u.test(x), 'Invalid text');
  return x.trim().normalize('NFC');
}
function identifier(x) { requireThat(typeof x === 'string' && /^[a-z][a-z0-9.-]{0,63}$/.test(x), 'Invalid identifier'); return x; }
export function resolveEntry(value) {
  if (typeof value !== 'string' || value.length > 128) return null;
  const text = value.trim().normalize('NFC').toLowerCase().replace(/\ufe0f/gu, '');
  if (['\u00e6', '$\u00e6', '$ae', '$mcp', '&mcp', '$mpc', '>_\u00e6\u00e6\u00e6://|||', ORIGIN.toLowerCase()].includes(text)) return 'intention';
  if (['$\u2764', '$@\u2764', '@\u2764', '$heart'].includes(text)) return 'intention';
  if (text === PUBLIC.toLowerCase() || text === 'public') return 'public-review';
  return null;
}
/** Strict public profile input. Private intention is not an input to this function. */
export function publicManifest(input) {
  exact(input, ['id', 'name', 'purpose', 'preferredExecutor', 'capabilities']);
  const id = identifier(input.id), name = label(input.name), purpose = label(input.purpose, 240);
  requireThat(['ae', 'codex'].includes(input.preferredExecutor), 'Unsupported executor');
  requireThat(Array.isArray(input.capabilities) && input.capabilities.length <= 24, 'Invalid capabilities');
  const ids = input.capabilities.map(identifier);
  requireThat(new Set(ids).size === ids.length, 'Duplicate capability');
  return {
    schema: 'open-sovereign.public-manifest.v1', version: VERSION,
    agency: { id, name, purpose }, coordinates: { origin: ORIGIN, public: PUBLIC },
    execution: { preference: input.preferredExecutor, connection: 'unverified', dispatch: false },
    capabilities: ids.map(id => ({ id, status: id === 'manifest.export' ? 'local-only' : 'unbound' })),
    authority: { principal: 'human', inherited: false, grant: null },
    publication: { status: 'draft', deploymentAuthorized: false }
  };
}
export async function digest(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
/** A new context envelope references public records; never copies grants or payloads. */
export function moltContext(parentId, publicRefs) {
  identifier(parentId);
  requireThat(Array.isArray(publicRefs) && publicRefs.length <= 24, 'Invalid context references');
  const refs = [...new Set(publicRefs.map(identifier))];
  return { schema: 'open-sovereign.molt-context.v1', id: crypto.randomUUID(), parentId, publicRefs: refs, authority: null, execution: 'not-authorized' };
}
/**
 * One local session, one permitted operation: return a reviewed public draft.
 * The caller is the trusted local UI/test harness. confirm:true is not authentication.
 * Tickets are nonserializable object identities held in a closure, bound to a digest,
 * expiring and single-use. A remote executor must supply its OWN authenticated policy.
 */
export function createSession({ now = Date.now, ttlMs = 300000 } = {}) {
  requireThat(typeof now === 'function' && Number.isSafeInteger(ttlMs) && ttlMs > 0 && ttlMs <= 300000, 'Invalid session options');
  const proposals = new Map(), approvals = new Map();
  let generation = 0, lastTime = -Infinity;
  function clock() {
    const time = now();
    requireThat(Number.isSafeInteger(time) && time >= 0 && time >= lastTime, 'Invalid or regressed clock');
    lastTime = time;
    return time;
  }
  function pending(id) {
    const p = proposals.get(id);
    requireThat(p && p.state === 'prepared', 'Proposal unavailable or already used');
    requireThat(clock() < p.expiresAt, 'Proposal expired');
    return p;
  }
  return Object.freeze({
    async prepare(input) {
      requireThat(proposals.size < 64, 'Session full; clear before continuing');
      const g = generation, time = clock(), manifest = publicManifest(input);
      const hash = await digest(manifest);
      requireThat(g === generation, 'Preparation cancelled');
      const id = crypto.randomUUID(), expiresAt = time + ttlMs;
      proposals.set(id, { manifest, digest: hash, expiresAt, state: 'prepared' });
      return { id, digest: hash, expiresAt, manifest: copy(manifest), scope: 'manifest.export', status: 'prepared' };
    },
    approve(id, reviewedDigest, confirmed) {
      requireThat(confirmed === true, 'Explicit local confirmation required');
      const p = pending(id);
      requireThat(reviewedDigest === p.digest, 'Review digest mismatch');
      // A ticket is not a JSON grant. Object identity must belong to this session.
      const ticket = Object.freeze(Object.create(null));
      p.state = 'approved';
      approvals.set(ticket, { id, generation });
      return ticket;
    },
    async execute(ticket, operation = 'manifest.export') {
      requireThat(operation === 'manifest.export', 'External or unknown operation denied');
      const approval = approvals.get(ticket), p = approval && proposals.get(approval.id);
      requireThat(approval && p && p.state === 'approved' && approval.generation === generation, 'Approval unavailable');
      const time = clock();
      requireThat(time < p.expiresAt, 'Approval expired');
      // Consume before any asynchronous step to prevent concurrent replay.
      approvals.delete(ticket); p.state = 'consumed';
      return { manifest: copy(p.manifest), receipt: {
        schema: 'open-sovereign.local-receipt.v1', operation,
        proposalId: approval.id, contentDigest: p.digest,
        recordedAt: new Date(time).toISOString(), result: 'public-draft-returned',
        externalSuccess: false, deployed: false, signature: null,
        authorizationBasis: 'local-user-confirmation-not-provider-authentication'
      } };
    },
    clear() { generation++; proposals.clear(); approvals.clear(); }
  });
}
/** Content integrity only. This cannot authenticate an author or external outcome. */
export async function verifyLocalReceiptIntegrity(manifest, receipt) {
  return Boolean(receipt && receipt.schema === 'open-sovereign.local-receipt.v1' &&
    receipt.operation === 'manifest.export' && receipt.externalSuccess === false &&
    receipt.deployed === false && receipt.signature === null &&
    receipt.contentDigest === await digest(manifest));
}
