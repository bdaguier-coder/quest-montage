import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mountCloudBridge,allowedCloudRequest,ALLOWED_ORIGIN} from '../client/cloud-bridge.mjs';
import {PROTOCOL,CLOUD_ORIGIN,connectCloud,cloudFetch} from '../client/cloud-client.mjs?v=studio-4g';

test('La passerelle limite les échanges au propriétaire de l’atelier, à son origine et aux API du film',async()=>{
 let listener,calls=0;const messages=[],status={textContent:''},nonce='abcdefghijklmnopqrstuv';
 const opener={postMessage:(data,origin)=>messages.push({data,origin})};
 const win={location:{href:CLOUD_ORIGIN+'/sync-bridge.html?origin='+encodeURIComponent(ALLOWED_ORIGIN)+'&nonce='+nonce},opener,document:{querySelector:()=>status},addEventListener:(_type,fn)=>listener=fn,removeEventListener:()=>{}};
 const stop=mountCloudBridge(win,async(path,options)=>{calls++;assert.equal(path,'/api/sync/films');assert.equal(options.credentials,'same-origin');assert.equal(options.headers.has('oai-authenticated-user-id'),false);return new Response(JSON.stringify({films:[{id:'private-film'}]}),{headers:{'Content-Type':'application/json'}});});
 assert.equal(messages[0].origin,ALLOWED_ORIGIN);assert.equal(messages[0].data.kind,'ready');
 const request={protocol:PROTOCOL,nonce,kind:'request',id:'request-id',path:'/api/sync/films',method:'GET',headers:{'oai-authenticated-user-id':'forged-owner'}};
 await listener({origin:'https://attacker.example',source:opener,data:request});
 await listener({origin:ALLOWED_ORIGIN,source:{},data:request});
 await listener({origin:ALLOWED_ORIGIN,source:opener,data:{...request,nonce:'incorrect'}});
 await listener({origin:ALLOWED_ORIGIN,source:opener,data:{...request,path:'https://attacker.example/steal'}});
 assert.equal(calls,0);
 await listener({origin:ALLOWED_ORIGIN,source:opener,data:request});assert.equal(calls,1);
 assert.equal(messages.at(-1).data.status,200);assert.deepEqual(JSON.parse(await messages.at(-1).data.body.text()),{films:[{id:'private-film'}]});stop();
 assert.equal(allowedCloudRequest('/api/sync/films/film-a','DELETE'),false);
 assert.equal(allowedCloudRequest('/api/sync/films/film-a/history/72','GET'),true);
 assert.equal(allowedCloudRequest('/api/story-media/photo-a','PUT'),true);
 assert.equal(allowedCloudRequest('/api/story-media/../secret','GET'),false);
});

test('Une origine étrangère ne peut pas activer la passerelle privée',()=>{
 let listening=false;const status={textContent:''};mountCloudBridge({location:{href:CLOUD_ORIGIN+'/sync-bridge.html?origin=https://attacker.example&nonce=abcdefghijklmnopqrstuv'},opener:{},document:{querySelector:()=>status},addEventListener:()=>listening=true});assert.equal(listening,false);assert.match(status.textContent,/depuis votre atelier/);
});

test('L’atelier GitHub attend la connexion, échange films et photos, et détecte la fenêtre fermée',async()=>{
 const oldWindow=globalThis.window,oldLocation=globalThis.location;let listener,opened;const events=[];
 const popup={closed:false,focus:()=>{},postMessage(data){queueMicrotask(()=>listener({origin:CLOUD_ORIGIN,source:popup,data:{protocol:PROTOCOL,nonce:data.nonce,kind:data.kind==='ping'?'ready':'response',id:data.id,status:200,headers:{'Content-Type':data.path?.includes('story-media')?'image/png':'application/json'},body:data.path?.includes('story-media')?new Blob([new Uint8Array([1,2,3])],{type:'image/png'}):JSON.stringify({films:[{id:'film-a'}]})}}));}};
 globalThis.location={hostname:'bdaguier-coder.github.io',origin:ALLOWED_ORIGIN};globalThis.window={addEventListener:(_type,fn)=>listener=fn,dispatchEvent:event=>events.push(event.type),open:url=>{opened=new URL(url);return popup;}};
 try{
  assert.equal((await cloudFetch('/api/sync/films')).status,401);
  await connectCloud();assert.equal(opened.origin,CLOUD_ORIGIN);assert.equal(opened.searchParams.get('origin'),ALLOWED_ORIGIN);assert.ok(events.includes('quest-cloud-connected'));
  assert.deepEqual(await(await cloudFetch('/api/sync/films')).json(),{films:[{id:'film-a'}]});
  assert.deepEqual(new Uint8Array(await(await cloudFetch('/api/story-media/photo-a')).arrayBuffer()),new Uint8Array([1,2,3]));
  popup.closed=true;assert.equal((await cloudFetch('/api/sync/films')).status,401);
 }finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldLocation===undefined)delete globalThis.location;else globalThis.location=oldLocation;}
});
