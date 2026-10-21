/** Node DOM harness: behavioral verification, NOT browser sandbox/layout testing. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { mountViewports } from '../mov/app.mjs';
import { CATALOG_JSON } from '../mov/catalog.mjs';
function harness(json=CATALOG_JSON) {
  class Control extends EventTarget {
    constructor(tag='div'){super();this.tagName=tag;this.value='';this.checked=false;this.disabled=false;this.textContent='';this.children=[];this.attributes={};}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=[...nodes];}
    setAttribute(k,v){this.attributes[k]=v;}
    focus(){doc.activeElement=this;}
    click(){if(!this.disabled)this.dispatchEvent(new Event('click'));}
  }
  const names=['mov-review','mov-digest','mov-status','mov-prepare','mov-details','mov-train','mov-count','mov-catalog','mov-source','mov-name','mov-reflection','mov-clear','mov-entry','mov-enter','mov-inspection'];
  const nodes=Object.fromEntries(names.map(id=>[id,new Control()]));nodes['mov-name'].value='My Mixture of Viewports';
  const find=(root,id)=>root.id===id?root:root.children.map(c=>find(c,id)).find(Boolean);
  const doc={getElementById:id=>nodes[id]||Object.values(nodes).map(n=>find(n,id)).find(Boolean),createElement:tag=>new Control(tag)};
  const host=new EventTarget();mountViewports(doc,host,json);
  const get=id=>doc.getElementById(id);
  const choose=id=>{const c=get('view-'+id);c.checked=!c.checked;c.dispatchEvent(new Event('change'));};
  const until=async fn=>{for(let i=0;i<100;i++){if(fn())return;await delay(2);}throw Error(nodes['mov-status'].textContent);};
  async function prepare(){get('mov-prepare').click();await until(()=>get('mov-status').textContent.startsWith('Public composition prepared'));}
  return {nodes,get,choose,until,prepare,host,doc};
}
test('MoV starts with no selection and disabled review',()=>{
  const h=harness();assert.equal(h.get('mov-catalog').children.length,4);assert.equal(h.get('mov-prepare').disabled,true);assert.equal(h.get('mov-count').textContent,'0 / 4 selected');
});
test('select and inspect render exact source metadata as text',()=>{
  const h=harness();h.choose('garden');assert.equal(h.get('mov-prepare').disabled,false);
  h.get('mov-catalog').children[0].children.at(-1).click();
  assert.equal(JSON.parse(h.get('mov-details').textContent).source.url,'https://example.invalid/molt/garden');
  assert.equal(h.get('mov-inspection').open,true);assert.equal(h.doc.activeElement,h.get('mov-details'));
});
test('private reflection never appears in public review or content digest input',async()=>{
  const h=harness();h.get('mov-reflection').value='PRIVATE_SENTINEL';h.choose('garden');h.choose('learning');await h.prepare();
  assert.ok(!h.get('mov-review').textContent.includes('PRIVATE_SENTINEL'));
  const c=JSON.parse(h.get('mov-review').textContent);assert.deepEqual(c.effects,[]);assert.equal(c.authority.grant,null);
});
test('selection and name edits invalidate previous review',async()=>{
  const h=harness();h.choose('garden');await h.prepare();h.choose('sanctuary');assert.equal(h.get('mov-review').textContent,'No public composition prepared.');
  await h.prepare();h.get('mov-name').value='Changed';h.get('mov-name').dispatchEvent(new Event('input'));assert.equal(h.get('mov-digest').textContent,'No content digest yet.');
});
test('silent name changes while hashing cannot present a stale review',async()=>{
  const h=harness();h.choose('garden');h.get('mov-prepare').click();h.get('mov-name').value='Changed silently';
  await h.until(()=>h.get('mov-status').textContent.includes('Changed during'));assert.equal(h.get('mov-review').textContent,'No public composition prepared.');
});
test('clearing while preparing cancels stale output',async()=>{
  const h=harness();h.choose('garden');h.get('mov-reflection').value='PRIVATE';h.get('mov-prepare').click();h.get('mov-clear').click();await delay(10);
  assert.equal(h.get('mov-reflection').value,'');assert.equal(h.get('mov-prepare').disabled,true);assert.equal(h.get('mov-review').textContent,'No public composition prepared.');
});
test('page lifecycle clears reflection and composition best-effort',async()=>{
  const h=harness();h.choose('garden');await h.prepare();h.get('mov-reflection').value='PRIVATE';h.host.dispatchEvent(new Event('pagehide'));
  assert.equal(h.get('mov-reflection').value,'');assert.equal(h.get('mov-prepare').disabled,true);
});
test('chat and heart aliases stay in this surface without external navigation',()=>{
  const h=harness();for(const value of ['$chat','$@\u2764\ufe0f','$ae']){h.get('mov-entry').value=value;h.get('mov-enter').click();assert.equal(h.doc.activeElement,h.get('mov-reflection'));}
});
test('invalid registry leaves composition disabled, not apparently connected',()=>{
  const h=harness('{}');assert.equal(h.get('mov-catalog').children.length,0);assert.equal(h.get('mov-prepare').disabled,true);assert.match(h.get('mov-status').textContent,/invalid/);
});
test('untrusted markup is emitted only as textContent',()=>{
  const r=JSON.parse(CATALOG_JSON);r.viewports[0].title='<img src=x onerror=alert(1)>';const h=harness(JSON.stringify(r));
  assert.equal(h.get('mov-catalog').children[0].children[0].children[1].textContent,r.viewports[0].symbol+' '+r.viewports[0].title);
  assert.equal(h.get('mov-catalog').children[0].children[0].children[1].innerHTML,undefined);
});
