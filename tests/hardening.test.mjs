import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createSession, publicManifest, moltContext, resolveEntry, digest, verifyLocalReceiptIntegrity } from '../src/kernel.mjs';
import { makeServer } from '../scripts/serve.mjs';
const profile = () => ({ id:'ae', name:'Agency', purpose:'Return value to the human.', preferredExecutor:'ae', capabilities:['manifest.export'] });
async function result() { const s=createSession(), p=await s.prepare(profile()); return s.execute(s.approve(p.id,p.digest,true)); }

// Regressions are tested against the previous commit before the fixes are applied.
test('concurrent preparation respects the 64-proposal bound', async () => {
  const s=createSession(); const r=await Promise.allSettled(Array.from({length:80},()=>s.prepare(profile())));
  assert.equal(r.filter(x=>x.status==='fulfilled').length,64);
  assert.equal(r.filter(x=>x.status==='rejected').length,16);
});
test('consumed proposals release capacity without enabling ticket reuse', async () => {
  const s=createSession();
  for(let i=0;i<80;i++){const p=await s.prepare(profile()), ticket=s.approve(p.id,p.digest,true);await s.execute(ticket);await assert.rejects(s.execute(ticket),/Approval/);}
});
test('expired proposals are swept when preparing new work', async () => {
  let now=0;const s=createSession({now:()=>now,ttlMs:100});
  for(let i=0;i<64;i++)await s.prepare(profile());
  now=100;assert.equal((await s.prepare(profile())).status,'prepared');
});
test('expiry is checked again after asynchronous hashing', async () => {
  let now=0;const s=createSession({now:()=>now,ttlMs:100});const p=s.prepare(profile());now=100;
  await assert.rejects(p,/expired/);
});
test('old in-flight work cannot corrupt capacity after clear', async () => {
  const s=createSession(), old=s.prepare(profile());s.clear();
  const results=await Promise.allSettled([old,...Array.from({length:65},()=>s.prepare(profile()))]);
  assert.equal(results[0].status,'rejected');assert.equal(results.slice(1).filter(r=>r.status==='fulfilled').length,64);
});
test('accessor fields are rejected without running their getters', () => {
  let reads=0;const p=profile();Object.defineProperty(p,'name',{get(){reads++;return 'surprise';},enumerable:true});
  assert.throws(()=>publicManifest(p),/data|fields/);assert.equal(reads,0);
});
test('symbol and non-enumerable fields are not accepted as plain public data', () => {
  for(const key of [Symbol('grant'),'privateIntention']){
    const p=profile();Object.defineProperty(p,key,{value:'private',enumerable:false});assert.throws(()=>publicManifest(p),/fields/);
  }
});
test('sparse capabilities and context reference arrays are rejected', () => {
  assert.throws(()=>publicManifest({...profile(),capabilities:Array(1)}));
  assert.throws(()=>moltContext('parent',Array(1)));
});
test('custom collection methods and getters are rejected without invocation', () => {
  let invoked=0;const caps=['manifest.export'];caps.map=()=>{invoked++;return ['../unsafe'];};
  assert.throws(()=>publicManifest({...profile(),capabilities:caps}));assert.equal(invoked,0);
  const refs=['public'];Object.defineProperty(refs,'0',{get(){invoked++;return 'public';},enumerable:true});
  assert.throws(()=>moltContext('parent',refs));assert.equal(invoked,0);
});
test('unpaired surrogate text and command controls are rejected', () => {
  for(const name of ['a\ud800','a\udc00'])assert.throws(()=>publicManifest({...profile(),name}));
  for(const cmd of ['$mcp\n','\t$ae','$mcp\u202e'])assert.equal(resolveEntry(cmd),null);
});
test('unrepresentable receipt time is rejected at preparation, not execution', async () => {
  const s=createSession({now:()=>8640000000000000});await assert.rejects(s.prepare(profile()),/clock|expiry/);
});
test('detected clock regression revokes outstanding approvals', async () => {
  let now=10;const s=createSession({now:()=>now}),p=await s.prepare(profile()),ticket=s.approve(p.id,p.digest,true);
  now=9;await assert.rejects(s.execute(ticket),/clock/);now=11;await assert.rejects(s.execute(ticket));
});
test('receipt metadata is validated, not only the content digest', async () => {
  const r=await result();
  for(const change of [{proposalId:'forged'}, {recordedAt:'not-a-date'}, {result:'formed-company'}, {authorizationBasis:'admin'}, {privateContext:'SECRET'}]){
    assert.equal(await verifyLocalReceiptIntegrity(r.manifest,{...r.receipt,...change}),false);
  }
});
test('a matching digest cannot make a malformed or authority-bearing manifest valid', async () => {
  const r=await result();r.manifest.authority.grant='imported-admin';r.receipt.contentDigest=await digest(r.manifest);
  assert.equal(await verifyLocalReceiptIntegrity(r.manifest,r.receipt),false);
});
test('receipt verification returns false for malformed values rather than throwing', async () => {
  const r=await result();for(const m of [undefined,null,1,{}, {toJSON(){throw Error('must not run');}}]){
    assert.equal(await verifyLocalReceiptIntegrity(m,r.receipt),false);
  }
});
test('receipt checks reject malicious accessors without running them', async () => {
  const r=await result();let reads=0;Object.defineProperty(r.receipt,'contentDigest',{get(){reads++;return '0'.repeat(64);},enumerable:true});
  assert.equal(await verifyLocalReceiptIntegrity(r.manifest,r.receipt),false);assert.equal(reads,0);
});

async function withServer(fn){const s=makeServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));try{await fn(s.address().port,s);}finally{await new Promise(r=>s.close(r));}}
function raw(port,path='/',headers={},method='GET'){
  return new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port,path,method,headers},res=>{let body='';res.setEncoding('utf8');res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);req.end();});
}
test('loopback preview rejects arbitrary Host headers', async()=>withServer(async port=>{
  for(const host of ['attacker.invalid:'+port,'127.0.0.1.attacker.invalid:'+port,'127.0.0.1:1','localhost:'+port+'@attacker.invalid']){
    assert.equal((await raw(port,'/',{Host:host})).status,403,host);
  }
  assert.equal((await raw(port,'/',{Host:'localhost:'+port})).status,200);
}));
test('loopback preview rejects cross-origin and cross-site requests', async()=>withServer(async port=>{
  for(const headers of [{Origin:'https://attacker.invalid'},{Origin:'null'},{'Sec-Fetch-Site':'cross-site'},{'Sec-Fetch-Site':'same-site'}]){
    assert.equal((await raw(port,'/',headers)).status,403);
  }
  assert.equal((await raw(port,'/',{Origin:'http://127.0.0.1:'+port,'Sec-Fetch-Site':'same-origin'})).status,200);
}));
test('raw traversal and absolute request targets are not normalized into valid resources', async()=>withServer(async port=>{
  for(const path of ['/a/../index.html','/%2e/index.html','http://attacker.invalid/','//attacker.invalid/','/%00','/index.html?token=SECRET']){
    assert.notEqual((await raw(port,path)).status,200,path);
  }
}));
test('all five allowlisted assets remain readable and carry defensive headers', async()=>withServer(async port=>{
  for(const path of ['/','/index.html','/web/app.mjs','/web/style.css','/src/kernel.mjs']){
    const r=await raw(port,path);assert.equal(r.status,200);assert.equal(r.headers['cache-control'],'no-store');
    assert.equal(r.headers['x-content-type-options'],'nosniff');assert.equal(r.headers['x-frame-options'],'DENY');
    assert.equal(r.headers['referrer-policy'],'no-referrer');assert.equal(r.headers['cross-origin-resource-policy'],'same-origin');
    assert.match(r.headers['content-security-policy'],/frame-ancestors 'none'/);
  }
}));
test('HTTP methods and server resource exposure are bounded', async()=>withServer(async(port,s)=>{
  for(const method of ['POST','PUT','PATCH','DELETE']){
    const r=await raw(port,'/',{},method);assert.equal(r.status,405);assert.equal(r.headers.allow,'GET, HEAD');
  }
  for(const path of ['/package.json','/.git/config','/AGENTS.md','/docs/SECURITY.md'])assert.equal((await raw(port,path)).status,404);
  const r=await raw(port,'/',{},'HEAD');assert.equal(r.status,200);assert.equal(r.body,'');
  assert.ok(s.headersTimeout>0 && s.headersTimeout<=10000);assert.ok(s.requestTimeout>0 && s.requestTimeout<=15000);
  assert.ok(s.maxRequestsPerSocket>0 && s.maxRequestsPerSocket<=100);
}));

test('digests are stable across record key order but not changed values', async () => {
  const m=publicManifest(profile());const reordered=Object.fromEntries(Object.entries(m).reverse());
  assert.equal(await digest(m),await digest(reordered));reordered.agency={...m.agency,name:'Other'};
  assert.notEqual(await digest(m),await digest(reordered));
});
test('canonical hashing rejects cycles, custom serialization and depth/size excess', async () => {
  let calls=0;const cycle={};cycle.self=cycle;let deep={};for(let i=0;i<20;i++)deep={child:deep};
  for(const x of [cycle, deep, {toJSON(){calls++;return {}; }}, 'x'.repeat(4097), {n:Infinity}, {n:undefined}])await assert.rejects(digest(x));
  assert.equal(calls,0);
});
test('invalid preparations do not consume capacity', async () => {
  const s=createSession();for(let i=0;i<70;i++)await assert.rejects(s.prepare({...profile(),capabilities:['../escape']}));
  const r=await Promise.allSettled(Array.from({length:64},()=>s.prepare(profile())));assert.equal(r.filter(x=>x.status==='fulfilled').length,64);
});
test('receipt verification cannot authenticate a copied plausible receipt', async () => {
  const r=await result();const forged={...r.receipt,proposalId:crypto.randomUUID()};
  // An unsigned record cannot authenticate an author. Keep that limitation explicit in tests.
  assert.equal(await verifyLocalReceiptIntegrity(r.manifest,forged),true);
  await assert.rejects(createSession().execute(forged),/Approval/);
});
test('a receipt may be verified even after object-key reordering', async () => {
  const r=await result();assert.equal(await verifyLocalReceiptIntegrity(Object.fromEntries(Object.entries(r.manifest).reverse()),r.receipt),true);
});
test('bounded mutation corpus never adds authority to exported profiles', () => {
  let seed=3750;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
  for(let i=0;i<200;i++){
    const name='Agency-'+rng(), p={...profile(),name,preferredExecutor:rng()%2?'ae':'codex'};
    const m=publicManifest(p);assert.equal(m.authority.grant,null);assert.equal(m.execution.dispatch,false);
    const k=['privateIntent','token','grant','connected'][rng()%4];assert.throws(()=>publicManifest({...p,[k]:'synthetic'}));
  }
});
