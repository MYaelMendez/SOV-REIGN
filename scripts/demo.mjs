import { readFile } from 'node:fs/promises';
import { createSession, verifyLocalReceiptIntegrity } from '../src/kernel.mjs';
const profile = JSON.parse(await readFile(new URL('../examples/agency-ae.json', import.meta.url), 'utf8'));
const session = createSession();
const draft = await session.prepare(profile);
// Test harness consent for a local return only; no account, filing or deployment.
const ticket = session.approve(draft.id, draft.digest, true);
const result = await session.execute(ticket);
console.log(JSON.stringify({ ...result, contentIntegrityMatches: await verifyLocalReceiptIntegrity(result.manifest, result.receipt) }, null, 2));
session.clear();
