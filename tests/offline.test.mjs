import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
test('Service worker : cache de l’application et repli de navigation hors connexion',async()=>{
 const handlers={},cache=new Map();let claimed=false,activated=false,fetches=0;
 const cacheApi={addAll:async list=>{for(const item of list)cache.set(item,new Response(item==='./index.html'?'<title>QUEST Montage</title>':item));},put:async(k,v)=>cache.set(k,v)};
 const ctx={self:{skipWaiting:async()=>activated=true,location:{origin:'https://montage.example'},clients:{claim:async()=>claimed=true},addEventListener:(event,fn)=>handlers[event]=fn},URL,caches:{open:async()=>cacheApi,keys:async()=>['quest-montage-v1'],delete:async()=>true,match:async key=>cache.get(key)},fetch:async()=>{fetches++;throw Error('offline');}};
 vm.runInNewContext(await readFile(new URL('../client/sw.js',import.meta.url),'utf8'),ctx);
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;handlers.activate({waitUntil:p=>pending=p});await pending;assert.equal(claimed,true);assert.equal(activated,true);assert.ok(cache.has('./app.js?v=studio-4f'));assert.ok(cache.has('./demo/paris.mp4'));
 let response;handlers.fetch({request:{method:'GET',url:'https://montage.example/',mode:'navigate'},respondWith:p=>response=p});assert.match(await(await response).text(),/QUEST Montage/);assert.equal(fetches,1);
 let intercepted=false;handlers.fetch({request:{method:'GET',url:'blob:https://montage.example/local-video',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);handlers.fetch({request:{method:'GET',url:'https://montage.example/api/sync/films',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
