import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { makeServer } from '../scripts/serve.mjs';
test('MoV uses only explicit static routes with unchanged network-denying CSP',async()=>{
  const server=makeServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    for(const path of ['/mov/','/mov/index.html','/mov/app.mjs','/mov/catalog.mjs','/mov/style.css','/src/viewports.mjs']){
      const r=await fetch(base+path);assert.equal(r.status,200,path);assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);assert.equal(r.headers.get('x-frame-options'),'DENY');
    }
    // fetch normalizes dot segments before transmission; exercise RAW HTTP targets instead.
    const rawStatus=(path,headers={})=>new Promise((resolve,reject)=>{
      const req=request({hostname:'127.0.0.1',port:server.address().port,path,headers},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});
      req.on('error',reject);req.end();
    });
    for(const path of ['/mov/?token=x','/mov/unknown.mjs','/mov/%2e%2e/index.html','/mov/../package.json'])assert.notEqual(await rawStatus(path),200,path);
    assert.equal((await fetch(base+'/mov/',{method:'POST'})).status,405);
    assert.equal(await rawStatus('/mov/',{Host:'evil.invalid'}),403);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
