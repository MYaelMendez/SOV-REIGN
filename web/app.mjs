import { createSession, resolveEntry, verifyLocalReceiptIntegrity } from '../src/kernel.mjs';
const el = id => document.getElementById(id);
const session = createSession();
const supported = Boolean(globalThis.crypto?.subtle);
let draft = null, epoch = 0, busy = false;
const profile = () => ({ id: 'ae', name: el('name').value, purpose: el('purpose').value, preferredExecutor: el('executor').value, capabilities: ['manifest.export', 'repo.prepare', 'doola.handoff', 'publishing.review'] });
function invalidate(message = 'Changed locally. Prepare and review a new draft.') {
  epoch++; busy = false; session.clear(); draft = null;
  el('consent').checked = false; el('consent').disabled = true; el('download').disabled = true;
  el('prepare').disabled = !supported; el('preview').textContent = 'No public draft prepared.';
  el('receipt').textContent = 'No export performed in this review cycle.';
  el('status').textContent = message;
}
['intention', 'name', 'purpose', 'executor'].forEach(id => el(id).addEventListener('input', () => invalidate()));
el('prepare').addEventListener('click', async () => {
  if (busy) return;
  invalidate('Preparing an allowlisted public record locally...');
  busy = true; el('prepare').disabled = true;
  const current = epoch;
  try {
    const result = await session.prepare(profile());
    if (current !== epoch) return;
    draft = result; el('preview').textContent = JSON.stringify(draft.manifest, null, 2);
    el('consent').disabled = false;
    el('status').textContent = 'Prepared locally. Private intention is excluded. Review the full record before downloading.';
  } catch (error) { if (current === epoch) el('status').textContent = error.message; }
  finally { if (current === epoch) { busy = false; el('prepare').disabled = false; } }
});
el('consent').addEventListener('change', () => { el('download').disabled = !draft || !el('consent').checked || busy; });
el('download').addEventListener('click', async () => {
  if (!draft || !el('consent').checked || busy) return;
  busy = true; el('download').disabled = true; el('consent').disabled = true;
  const current = epoch;
  try {
    const ticket = session.approve(draft.id, draft.digest, true);
    const result = await session.execute(ticket);
    const matches = await verifyLocalReceiptIntegrity(result.manifest, result.receipt);
    if (current !== epoch) return;
    if (!matches) throw Error('Local digest mismatch; no download.');
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2) + '\n'], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'open-sovereign-public-draft.json';
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    el('receipt').textContent = JSON.stringify(result.receipt, null, 2);
    el('status').textContent = 'Draft download initiated. Digest verified locally. Not signed, not published, no provider action.';
    draft = null;
  } catch (error) { if (current === epoch) { draft = null; el('status').textContent = error.message + ' Prepare a fresh draft to retry.'; } }
  finally { if (current === epoch) { busy = false; el('consent').checked = false; } }
});
el('clear').addEventListener('click', () => { el('intention').value = ''; invalidate('Private intention and local approvals cleared. Previously downloaded files are unchanged.'); });
function enter() {
  const route = resolveEntry(el('entry').value);
  if (route === 'intention') { el('intention').focus(); el('status').textContent = 'Human intention first. This alias does not invoke a remote plugin.'; }
  else if (route === 'public-review') { el('name').focus(); el('status').textContent = 'Prepare a public draft below. No publication has been authorized.'; }
  else el('status').textContent = 'Unknown local entry. Use $ae, $mcp, &mcp, $@\u2764\ufe0f, or public.';
}
el('enter').addEventListener('click', enter);
el('entry').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); enter(); } });
if (supported) invalidate('Local session ready. No accounts, plugins, or external executors are connected.');
else { el('prepare').disabled = true; el('status').textContent = 'Use HTTPS or localhost for Web Crypto. Preparation stays disabled.'; }
