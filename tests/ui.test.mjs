/** DOM harness, not a real browser or device test. Executes the actual web/app.mjs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
let iteration=0;
async function harness(t){
  const oldDoc=globalThis.document, oldWin=globalThis.window;
  const oldCreate=URL.createObjectURL, oldRevoke=URL.revokeObjectURL;
  const objects=new Map(), downloads=[];
  class Control extends EventTarget {
    constructor(id){super();this.id=id;this.value='';this.checked=false;this.disabled=false;this.textContent='';}
    focus(){document.activeElement=this;}
    remove(){}
    click(){if(this.href)downloads.push(objects.get(this.href));else this.dispatchEvent(new Event('click'));}
  }
  const ids=['intention','name','purpose','executor','prepare','consent','download','preview','receipt','status','clear','entry','enter'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Control(id)]));
  nodes.name.value='Agency';nodes.purpose.value='Human agency';nodes.executor.value='ae';
  globalThis.document={getElementById:id=>nodes[id],createElement:()=>new Control('link'),body:{append(){}}};
  globalThis.window=new EventTarget();
  URL.createObjectURL=blob=>{const url='blob:local-'+objects.size;objects.set(url,blob);return url;};
  URL.revokeObjectURL=url=>objects.delete(url);
  t.after(()=>{globalThis.document=oldDoc;globalThis.window=oldWin;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
  await import('../web/app.mjs?test='+iteration++);
  async function until(fn){for(let i=0;i<100;i++){if(fn())return;await delay(2);}throw Error('UI did not settle: '+nodes.status.textContent);}
  const input=(id,value)=>{nodes[id].value=value;nodes[id].dispatchEvent(new Event('input'));};
  async function prepare(){nodes.prepare.click();await until(()=>!nodes.consent.disabled);}
  const consent=()=>{nodes.consent.checked=true;nodes.consent.dispatchEvent(new Event('change'));};
  return {nodes,downloads,input,until,prepare,consent};
}
test('UI returns a public draft while private intention stays out of the export', async t=>{
  const h=await harness(t);h.input('intention','PRIVATE_TEST_SENTINEL');await h.prepare();
  assert.ok(!h.nodes.preview.textContent.includes('PRIVATE_TEST_SENTINEL'));h.consent();h.nodes.download.click();
  await h.until(()=>h.downloads.length===1);const text=await h.downloads[0].text();
  assert.ok(!text.includes('PRIVATE_TEST_SENTINEL'));const r=JSON.parse(text);assert.equal(r.receipt.deployed,false);assert.equal(r.receipt.signature,null);
});
test('UI invalidates review on each editable field input', async t=>{
  const h=await harness(t);
  for(const [id,value] of [['intention','private'],['name','Other'],['purpose','New purpose'],['executor','codex']]){
    await h.prepare();h.consent();h.input(id,value);assert.equal(h.nodes.consent.disabled,true);assert.equal(h.nodes.download.disabled,true);
  }
});
test('silent DOM edits cannot reuse an earlier review digest', async t=>{
  const h=await harness(t);await h.prepare();h.consent();h.nodes.name.value='Changed without input event';h.nodes.download.click();
  await h.until(()=>h.nodes.status.textContent.includes('review again'));assert.equal(h.downloads.length,0);
});
test('double download click cannot replay an approval', async t=>{
  const h=await harness(t);await h.prepare();h.consent();h.nodes.download.click();h.nodes.download.click();
  await h.until(()=>h.downloads.length===1);await delay(10);assert.equal(h.downloads.length,1);
});
test('clearing during asynchronous preparation prevents stale UI approval', async t=>{
  const h=await harness(t);h.input('intention','SECRET');h.nodes.prepare.click();h.nodes.clear.click();await delay(10);
  assert.equal(h.nodes.intention.value,'');assert.equal(h.nodes.consent.disabled,true);assert.equal(h.nodes.download.disabled,true);
});
test('page lifecycle removes private intention and revokes review', async t=>{
  const h=await harness(t);h.input('intention','SECRET');await h.prepare();h.consent();window.dispatchEvent(new Event('pagehide'));
  assert.equal(h.nodes.intention.value,'');assert.equal(h.nodes.download.disabled,true);
  const e=new Event('pageshow');Object.defineProperty(e,'persisted',{value:true});window.dispatchEvent(e);
  assert.ok(h.nodes.status.textContent.includes('Restored without'));assert.equal(h.downloads.length,0);
});
test('heart and public aliases focus locally without navigation', async t=>{
  const h=await harness(t);h.nodes.entry.value='$@\u2764\ufe0f';h.nodes.enter.click();assert.equal(document.activeElement,h.nodes.intention);
  h.nodes.entry.value='public';h.nodes.enter.click();assert.equal(document.activeElement,h.nodes.name);
});
test('markup-like public labels stay text in the reviewed JSON', async t=>{
  const h=await harness(t);h.input('name','<img src=x onerror=alert(1)>');await h.prepare();
  assert.equal(JSON.parse(h.nodes.preview.textContent).agency.name,'<img src=x onerror=alert(1)>');
});
