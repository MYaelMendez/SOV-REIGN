/** MoV v0.1: parsed public data -> read-only composition. No provider or DOM access. */
import { ORIGIN, PUBLIC, digest } from './kernel.mjs';
export const MOV_VERSION = '0.1.0';
const MAX_BYTES = 32768;
const unsafe = /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u;
const requireThat = (ok, message) => { if (!ok) throw Error(message); };
function exact(record, keys) {
  requireThat(record !== null && typeof record === 'object' && Object.getPrototypeOf(record) === Object.prototype, 'Expected public data record');
  const own = Reflect.ownKeys(record);
  requireThat(own.length === keys.length && keys.every(key => Object.hasOwn(record, key)), 'Unexpected or missing fields');
}
function text(value, max = 240) {
  requireThat(typeof value === 'string' && value.length > 0 && value.length <= max && value === value.trim() && value.isWellFormed() && !unsafe.test(value), 'Invalid public text');
  return value;
}
function id(value) {
  requireThat(typeof value === 'string' && /^[a-z][a-z0-9.-]{0,63}$/u.test(value), 'Invalid public identifier');
  return value;
}
function sourceURL(value) {
  text(value, 1024);
  requireThat(/^https:\/\//u.test(value) && !/[\s\\]/u.test(value), 'Source requires an unambiguous HTTPS URL');
  const u = new URL(value);
  requireThat(!u.username && !u.password && !u.port && !u.search && !u.hash && !/[?#]/u.test(value) && !value.slice(8).split('/')[0].includes(':'), 'Source cannot include credentials, port, query or fragment');
  requireThat(u.hostname.includes('.') && !/^[\d.]+$/u.test(u.hostname) && !u.hostname.includes(':') && !u.hostname.endsWith('.') && !/\.(?:localhost|local|internal)$/u.test(u.hostname), 'Source requires a public DNS name');
  requireThat(!/(?:^|\/)\.{1,2}(?:\/|$)/u.test(value.slice(8)) && !/%(?:2e|2f|5c|25)/iu.test(value), 'Ambiguous source path');
  const decoded = decodeURIComponent(value);
  requireThat(!unsafe.test(decoded) && !/[\s\\]/u.test(decoded), 'Unsafe source encoding');
  return value; // Keep the exact original destination visible; never fetch or navigate it.
}
function selection(values) {
  requireThat(Array.isArray(values) && Object.getPrototypeOf(values) === Array.prototype, 'Selection must be a plain array');
  const n = Object.getOwnPropertyDescriptor(values, 'length').value;
  requireThat(n > 0 && n <= 4 && Reflect.ownKeys(values).length === n + 1, 'Choose one to four viewports');
  const result = [];
  for (let i = 0; i < n; i++) {
    const d = Object.getOwnPropertyDescriptor(values, String(i));
    requireThat(d && d.enumerable && Object.hasOwn(d, 'value'), 'Selection must contain data values');
    result.push(id(d.value));
  }
  requireThat(new Set(result).size === result.length, 'Duplicate selection');
  return result;
}
/** Accept JSON text only, never live JavaScript objects or imported executable modules. */
export function parseRegistry(json) {
  requireThat(typeof json === 'string' && json.length <= MAX_BYTES && new TextEncoder().encode(json).length <= MAX_BYTES, 'Registry JSON exceeds data budget or is not text');
  const r = JSON.parse(json);
  exact(r, ['schema', 'version', 'id', 'sourceRevision', 'viewports']);
  requireThat(r.schema === 'open-sovereign.viewport-registry.v1' && r.version === MOV_VERSION, 'Unsupported registry version');
  id(r.id);
  requireThat(typeof r.sourceRevision === 'string' && /^[0-9a-f]{40}$/u.test(r.sourceRevision), 'Invalid source revision');
  requireThat(Array.isArray(r.viewports) && r.viewports.length > 0 && r.viewports.length <= 16, 'Invalid viewport count');
  const found = new Set();
  for (const v of r.viewports) {
    exact(v, ['id', 'title', 'symbol', 'summary', 'source', 'classification', 'capabilities', 'rendering']);
    id(v.id); requireThat(!found.has(v.id), 'Duplicate viewport'); found.add(v.id);
    text(v.title, 80); text(v.symbol, 12); text(v.summary);
    exact(v.source, ['url', 'revision', 'kind']); sourceURL(v.source.url); id(v.source.revision);
    requireThat(v.source.kind === 'synthetic', 'Only explicitly synthetic sources are supported in this slice');
    requireThat(v.classification === 'public' && v.rendering === 'text', 'Only public text viewports are supported');
    requireThat(Array.isArray(v.capabilities) && v.capabilities.length === 1 && v.capabilities[0] === 'viewport.read', 'Only viewport.read is supported');
  }
  const catalogue = structuredClone(r);
  // Validated snapshots are detached: consumers cannot mutate the canonical catalogue.
  const compose = (requestedIds, title = 'My Mixture of Viewports') => {
    text(title, 80);
    const selected = selection(requestedIds).map(key => {
      const v = catalogue.viewports.find(item => item.id === key);
      requireThat(v, 'Unknown viewport'); return structuredClone(v);
    });
    return {
      schema: 'open-sovereign.viewport-composition.v1', version: MOV_VERSION, title,
      registry: { id: catalogue.id, version: catalogue.version, sourceRevision: catalogue.sourceRevision },
      coordinates: { origin: ORIGIN, public: PUBLIC }, viewports: selected,
      authority: { principal: 'human', inherited: false, grant: null },
      effects: [], execution: { dispatch: false, status: 'read-only-local', providerConnection: 'unverified' },
      publication: { status: 'draft', deploymentAuthorized: false }
    };
  };
  return Object.freeze({ list: () => structuredClone(catalogue.viewports),
    inspect(key) { id(key); const v = catalogue.viewports.find(item => item.id === key); requireThat(v, 'Unknown viewport'); return structuredClone(v); },
    source: () => ({ id: catalogue.id, version: catalogue.version, revision: catalogue.sourceRevision }), compose });
}
/** Canonical local content digest, not an authorization or provider attestation. */
export async function reviewComposition(registry, ids, title) {
  const composition = registry.compose(ids, title);
  const contentDigest = await digest(composition);
  return { composition, contentDigest, evidence: 'local-content-only', externallyVerified: false };
}
