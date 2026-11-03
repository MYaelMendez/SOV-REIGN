import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRegistry, reviewComposition } from '../src/viewports.mjs';
import { resolveEntry, ORIGIN, PUBLIC } from '../src/kernel.mjs';
import { CATALOG_JSON } from '../mov/catalog.mjs';
const fixture=()=>JSON.parse(CATALOG_JSON);
const invalid=mutate=>{const r=fixture();mutate(r);assert.throws(()=>parseRegistry(JSON.stringify(r)));};
test('Chat Kernel and chat aliases reach human intention, not an executor',()=>{
  for(const alias of ['$chat','$CHAT','>_\u00e6://CHAT_KERNEL','$@\u2764\ufe0f','$mcp']) assert.equal(resolveEntry(alias),'intention');
  assert.equal(resolveEntry('$chat; publish'),null);
});
test('registry exposes exactly the four synthetic public read-only viewports',()=>{
  const r=parseRegistry(CATALOG_JSON);assert.deepEqual(r.list().map(v=>v.id),['garden','sanctuary','mobility','learning']);
  for(const v of r.list()){assert.deepEqual(v.capabilities,['viewport.read']);assert.equal(v.classification,'public');assert.equal(v.source.kind,'synthetic');}
});
test('JSON boundary rejects live objects, malformed JSON and excess bytes',()=>{
  for(const value of [fixture(),null,undefined,'{','x'.repeat(32769),'\u6f22'.repeat(11000)])assert.throws(()=>parseRegistry(value));
});
test('no hidden authority, callbacks or private fields enter registry records',()=>{
  for(const key of ['authority','token','privateIntention','onLoad','__proto__'])invalid(r=>Object.defineProperty(r,key,{value:'secret',enumerable:true}));
  invalid(r=>{r.viewports[0].authority={grant:'admin'};});
  invalid(r=>{r.viewports[0].source.token='secret';});
});
test('registry version and source revision must be explicit and well-formed',()=>{
  invalid(r=>{r.version='2.0.0';});invalid(r=>{r.schema='modelcontextprotocol';});
  invalid(r=>{r.sourceRevision='main';});invalid(r=>{delete r.sourceRevision;});
});
test('duplicate or malformed viewport identifiers are rejected',()=>{
  invalid(r=>{r.viewports[1].id='garden';});invalid(r=>{r.id='../escape';});
  for(const id of ['', '../garden','garden?token=x','GARDEN','a'.repeat(65)])invalid(r=>{r.viewports[0].id=id;});
});
test('registry count is bounded and nonempty',()=>{
  invalid(r=>{r.viewports=[];});invalid(r=>{r.viewports=Array(17).fill(r.viewports[0]);});invalid(r=>{r.viewports={};});
});
test('only public text and synthetic sources are accepted in this implementation',()=>{
  invalid(r=>{r.viewports[0].classification='private';});invalid(r=>{r.viewports[0].rendering='iframe';});
  invalid(r=>{r.viewports[0].source.kind='live';});
});
test('unknown remote or write capabilities fail closed',()=>{
  for(const caps of [['publish'],['viewport.read','shell.exec'],[],['viewport.read','viewport.read']])invalid(r=>{r.viewports[0].capabilities=caps;});
});
test('URLs with executable, local or ambiguous targets are rejected',()=>{
  const targets=['javascript:alert(1)','data:text/html,x','http://example.invalid/a','https://user:pass@example.invalid/a','https://example.invalid:443/a','https://example.invalid/a?token=secret','https://example.invalid/a?','https://example.invalid/a#','//example.invalid/a','https://localhost/a','https://127.1/a','https://[::1]/a','https://a.local/a','https://a.internal/a','https://example.invalid./a','https://example.invalid/a/../b','https://example.invalid/%2e%2e/a','https://example.invalid/%2fsecret','https://example.invalid/%252e/a','https://example.invalid/%00a','https://example.invalid/%0aa','https://example.invalid/\\evil','https://example.invalid/%ff'];
  for(const url of targets)invalid(r=>{r.viewports[0].source.url=url;});
});
test('original Unicode HTTPS destination stays visible without a URL fetch',()=>{
  const r=fixture();r.viewports[0].source.url='https://\u00e6.store/garden';
  assert.equal(parseRegistry(JSON.stringify(r)).inspect('garden').source.url,r.viewports[0].source.url);
});
test('control characters, malformed Unicode and oversized text are rejected',()=>{
  for(const title of ['', ' leading', 'trailing ', 'a\u202eb','a\u200bb','\ud800','x'.repeat(81)])invalid(r=>{r.viewports[0].title=title;});
  invalid(r=>{r.viewports[0].summary='x'.repeat(241);});
});
test('markup-like strings are data, not HTML or code',()=>{
  const r=fixture();r.viewports[0].title='<img src=x onerror=alert(1)>';
  assert.equal(parseRegistry(JSON.stringify(r)).inspect('garden').title,r.viewports[0].title);
});
test('mutable returned snapshots cannot alter the canonical registry',()=>{
  const r=parseRegistry(CATALOG_JSON),a=r.list();a[0].title='spoof';a[0].capabilities.push('publish');
  const b=r.inspect('garden');b.source.kind='verified';
  assert.equal(r.inspect('garden').title,'Garden');assert.equal(r.inspect('garden').source.kind,'synthetic');
});
test('inspect rejects unknown IDs and preserves full source metadata',()=>{
  const r=parseRegistry(CATALOG_JSON);assert.throws(()=>r.inspect('unknown'));assert.throws(()=>r.inspect('../x'));
  assert.equal(r.inspect('garden').source.revision,'garden-v1');assert.equal(r.source().revision.length,40);
});
test('composition preserves selected order, exact coordinates, and no authority',()=>{
  const c=parseRegistry(CATALOG_JSON).compose(['learning','garden'],'Public plan');
  assert.deepEqual(c.viewports.map(v=>v.id),['learning','garden']);assert.equal(c.coordinates.origin,ORIGIN);assert.equal(c.coordinates.public,PUBLIC);
  assert.deepEqual(c.authority,{principal:'human',inherited:false,grant:null});assert.deepEqual(c.effects,[]);
  assert.equal(c.execution.dispatch,false);assert.equal(c.publication.deploymentAuthorized,false);
});
test('selection must be bounded, known, dense, unique data',()=>{
  const r=parseRegistry(CATALOG_JSON);
  for(const ids of [[],['unknown'],['garden','garden'],Array(5).fill('garden'),{},null,Array(1)])assert.throws(()=>r.compose(ids));
  let touched=false;const hostile=['garden'];Object.defineProperty(hostile,'0',{get(){touched=true;return 'garden';},enumerable:true});
  assert.throws(()=>r.compose(hostile));assert.equal(touched,false);
  const customized=['garden'];customized.map=()=>['mobility'];assert.throws(()=>r.compose(customized));
});
test('composition accepts no private payload object in place of its title',()=>{
  const r=parseRegistry(CATALOG_JSON);assert.throws(()=>r.compose(['garden'],{privateIntention:'secret'}));
  assert.throws(()=>r.compose(['garden'],'x'.repeat(81)));
});
test('equivalent selection/title produce the same local digest',async()=>{
  const r=parseRegistry(CATALOG_JSON),a=await reviewComposition(r,['garden'],'Plan'),b=await reviewComposition(r,['garden'],'Plan');
  assert.equal(a.contentDigest,b.contentDigest);assert.match(a.contentDigest,/^[a-f0-9]{64}$/u);assert.equal(a.externallyVerified,false);
  const c=await reviewComposition(r,['learning'],'Plan');assert.notEqual(a.contentDigest,c.contentDigest);
});
test('changing view order or title requires a different content review',async()=>{
  const r=parseRegistry(CATALOG_JSON),a=await reviewComposition(r,['garden','learning'],'Plan');
  assert.notEqual(a.contentDigest,(await reviewComposition(r,['learning','garden'],'Plan')).contentDigest);
  assert.notEqual(a.contentDigest,(await reviewComposition(r,['garden','learning'],'Other')).contentDigest);
});
test('bounded 64-case corpus rejects injected authority at each viewport',()=>{
  for(let i=0;i<64;i++)invalid(r=>{r.viewports[i%4]['grant'+i]={scope:'admin'};});
});
