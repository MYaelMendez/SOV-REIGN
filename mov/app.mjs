import { parseRegistry, reviewComposition } from '../src/viewports.mjs';
import { CATALOG_JSON } from './catalog.mjs';
import { resolveEntry } from '../src/kernel.mjs';
/** Dependency-injected DOM for testing; default host is a normal browser document. */
export function mountViewports(doc, host, json = CATALOG_JSON) {
  const el = id => doc.getElementById(id);
  let registry, generation = 0, busy = false;
  const controls = [];
  el('mov-count').textContent = '0 / 4 selected';
  function invalidate(message = 'Selection changed. Prepare a fresh public review.') {
    generation++; busy = false;
    el('mov-review').textContent = 'No public composition prepared.';
    el('mov-digest').textContent = 'No content digest yet.';
    el('mov-status').textContent = message;
    el('mov-prepare').disabled = !registry || controls.every(c => !c.checked);
  }
  const node = (tag, text, className) => { const n = doc.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  function inspect(id) {
    const v = registry.inspect(id);
    el('mov-details').textContent = JSON.stringify(v, null, 2);
    el('mov-inspection').open = true;
    el('mov-details').focus();
  }
  function chosen() { return controls.filter(c => c.checked).map(c => c.value); }
  function updateTrain() {
    const chips = chosen().map(id => { const v = registry.inspect(id); return node('span', v.symbol+' '+v.title, 'train-chip'); });
    el('mov-train').replaceChildren(...chips);
    el('mov-count').textContent = chosen().length+' / 4 selected';
    invalidate();
  }
  try {
    registry = parseRegistry(json);
    for (const v of registry.list()) {
      const card = node('article', undefined, 'viewport-card');
      const label = node('label', undefined, 'viewport-choice');
      const check = node('input'); check.type = 'checkbox'; check.value = v.id; check.id = 'view-'+v.id;
      check.setAttribute('aria-label', 'Include '+v.title+' viewport'); controls.push(check);
      const title = node('span', v.symbol+' '+v.title);
      label.append(check, title); card.append(label, node('p', v.summary), node('small', 'SYNTHETIC / PUBLIC / READ ONLY'));
      const button = node('button','Inspect source'); button.type='button'; button.addEventListener('click',()=>inspect(v.id));
      card.append(button); el('mov-catalog').append(card);
      check.addEventListener('change',updateTrain);
    }
    const s = registry.source();
    el('mov-source').textContent = s.id+' / v'+s.version+' / inspected base '+s.revision;
    invalidate('Registry validated locally. Select viewports; nothing is connected or dispatched.');
  } catch {
    registry = null; el('mov-catalog').replaceChildren();
    el('mov-prepare').disabled = true;
    el('mov-status').textContent = 'Registry is invalid. Composition stays disabled.';
  }
  el('mov-name').addEventListener('input',()=>invalidate());
  el('mov-prepare').addEventListener('click',async()=>{
    if (!registry || busy || !chosen().length) return;
    const current=++generation, ids=chosen(), title=el('mov-name').value;
    busy=true; el('mov-prepare').disabled=true;
    try {
      const reviewed=await reviewComposition(registry,ids,title);
      if(current!==generation)return;
      // Silent DOM changes must not present old content as the current selection.
      if(title!==el('mov-name').value || JSON.stringify(ids)!==JSON.stringify(chosen())) { invalidate('Changed during preparation. Prepare again.'); return; }
      el('mov-review').textContent=JSON.stringify(reviewed.composition,null,2);
      el('mov-digest').textContent='SHA-256 / local public content: '+reviewed.contentDigest;
      el('mov-status').textContent='Public composition prepared. No action, grant, provider connection, or publication.';
    } catch { if(current===generation) invalidate('Composition unavailable. Check your public title and selection.'); }
    finally { if(current===generation){busy=false;el('mov-prepare').disabled=!chosen().length;} }
  });
  function clear() {
    el('mov-reflection').value=''; el('mov-name').value='My Mixture of Viewports';
    controls.forEach(c=>{c.checked=false;});
    el('mov-details').textContent='Select Inspect source to see the original destination and fixture revision.';
    if(registry) updateTrain();
    invalidate('Local composition and private reflection cleared. No external operation occurred.');
  }
  el('mov-clear').addEventListener('click',clear);
  host.addEventListener('pagehide',clear);
  host.addEventListener('pageshow',event=>{if(event.persisted)clear();});
  const enter=()=>{
    const command=resolveEntry(el('mov-entry').value);
    if(command==='intention') { el('mov-reflection').focus(); el('mov-status').textContent='Stay here. Human reflection stays private; this alias does not launch a plugin.'; }
    else if(command==='public-review')el('mov-name').focus();
    else el('mov-status').textContent='Use $chat, $ae, $mcp, $@\u2764\ufe0f or public. No navigation occurred.';
  };
  el('mov-enter').addEventListener('click',enter);
  el('mov-entry').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();enter();}});
  return Object.freeze({ clear });
}
if (typeof document !== 'undefined') mountViewports(document, window);
