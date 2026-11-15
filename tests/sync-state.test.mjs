import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FilmSync,pendingMedia,signature} from '../client/sync.mjs';
import {newProject} from '../client/core.mjs';
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('Les photos en attente, y compris dans la bible et la corbeille, interdisent Synchronisé',async()=>{
 const p=newProject('Photo non envoyée');p.storyboard={shots:[{media:[{id:'photo',remote:false}]}],bible:[{media:[{id:'reference',remote:false}]}],trash:[{shot:{media:[{id:'photo',remote:false},{id:'archive',remote:false}]}}]};
 p._sync={revision:1,fingerprint:signature(p)};assert.equal(pendingMedia([p]),3);
 const states=[];const sync=new FilmSync({list:()=>[p],store:async()=>{},onState:s=>states.push(s),transport:async()=>response({films:[]})});
 await sync.once();assert.equal(states.at(-1),'pending');
 for(const item of [...p.storyboard.shots,...p.storyboard.bible,...p.storyboard.trash.map(r=>r.shot)])for(const m of item.media)m.remote=true;
 p._sync.fingerprint=signature(p);await sync.once();assert.equal(states.at(-1),'synced');
});
test('Erreur serveur, authentification et panne réseau ont des états distincts',async()=>{
 for(const [transport,expected] of [[async()=>response({error:'sync_unavailable'},503),'error'],[async()=>response({error:'auth_required'},401),'auth'],[async()=>{throw new TypeError('Failed to fetch')},'offline']]){
  const states=[];const sync=new FilmSync({list:()=>[],store:async()=>{},onState:s=>states.push(s),transport});await sync.once();assert.equal(states.at(-1),expected);
 }
});
