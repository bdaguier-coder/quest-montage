import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {Miniflare} from 'miniflare';
import {newProject,newSequence,addClip,totalDuration,serialize,restore,cloneProject} from '../client/core.mjs';
import {FilmSync,signature,canApplyRemote} from '../client/sync.mjs';
let mf;
const origin='https://montage.test';
before(async()=>{mf=new Miniflare({modules:true,scriptPath:'dist/server/index.js',compatibilityDate:'2026-06-01',d1Databases:['DB'],r2Buckets:['MEDIA']});const db=await mf.getD1Database('DB');for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();}});
after(async()=>{await mf?.dispose();});
function project(){const p=newProject('Film synchronisé');p.media=[{id:'rush-a',name:'Paris.mp4',title:'Paris',path:'Paris.mp4',duration:8,notes:'Rush original',width:1920,height:1080,fps:25,hasAudio:false,thumb:'data:image/jpeg;base64,AAAA'},{id:'rush-b',name:'Emilie.mp4',title:'Émilie',path:'Emilie.mp4',duration:5,notes:'',fps:25,hasAudio:false}];p.sequences=[newSequence('Contexte','#67d5ca'),newSequence('Fuite','#e6bc79')];addClip(p,p.sequences[0].id,'rush-a');addClip(p,p.sequences[0].id,'rush-b');addClip(p,p.sequences[1].id,'rush-a');return p;}
async function api(owner,path,options={}){const headers=new Headers(options.headers);if(owner)headers.set('oai-authenticated-user-id',owner);return mf.dispatchFetch(origin+path,{...options,headers:Object.fromEntries(headers)});}
const upload=(owner,p,revision=0)=>api(owner,'/api/sync/films/'+p.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:p,baseRevision:revision})});
function device(owner,initial=[]){const state={records:structuredClone(initial),statuses:[],conflicts:[]};const sync=new FilmSync({list:()=>state.records,store:async p=>{const index=state.records.findIndex(r=>r.id===p.id);if(index<0)state.records.push(structuredClone(p));else state.records[index]=structuredClone(p);},onState:s=>state.statuses.push(s),onConflict:s=>state.conflicts.push(s),transport:(path,options)=>api(owner,path,options)});return {state,sync};}
test('API privée : identité obligatoire, origine étrangère refusée',async()=>{assert.equal((await api(null,'/api/sync/films')).status,401);assert.equal((await api(null,'/api/sync/films',{headers:{'OAI-Sites-Authorization':'Bearer not-a-visitor'}})).status,401);assert.equal((await api('a','/api/sync/films',{headers:{Origin:'https://other.example'}})).status,403);});
test('D1 conserve la structure ; aucun fichier, miniature ou état local n’est transféré',async()=>{const p=project();p._sync={revision:123};p.media[0].file='binary-secret';const response=await upload('structure-owner',p);assert.equal(response.status,200);const body=await(await api('structure-owner','/api/sync/films')).json();const shared=body.films[0].project;assert.equal(shared.sequences[0].clips.length,2);assert.equal(totalDuration(shared),21);assert.equal(shared.media[0].thumb,undefined);assert.equal(shared.media[0].file,undefined);assert.equal(shared._sync,undefined);assert.equal(body.films[0].revision,1);});
test('Les films d’un autre compte ne peuvent être lus ou écrasés',async()=>{const p=project();await upload('owner-one',p);const other=await(await api('owner-two','/api/sync/films')).json();assert.deepEqual(other.films,[]);const denied=await upload('owner-two',p,1);assert.equal(denied.status,409);assert.equal((await denied.json()).remote,null);});
test('Deux appareils indépendants retrouvent ordre, couleur, notes et coupe ; miniatures locales préservées',async()=>{const p=project(),a=device('two-devices',[p]),b=device('two-devices');await a.sync.once();await b.sync.once();assert.equal(b.state.records.length,1);assert.equal(b.state.records[0].media[0].thumb,undefined);const remote=b.state.records[0];remote.sequences.reverse();remote.sequences[0].notes='Montage sur le téléphone';remote.sequences[0].color='#b59ae8';remote.sequences[0].clips[0].in=1;remote.sequences[0].clips[0].out=6;await b.sync.once();await a.sync.once();assert.equal(signature(a.state.records[0]),signature(b.state.records[0]));assert.equal(a.state.records[0].media[0].thumb,p.media[0].thumb);assert.equal(totalDuration(a.state.records[0]),18);assert.equal(a.state.statuses.at(-1),'synced');});
test('Une modification hors connexion est envoyée au retour du réseau',async()=>{const p=project(),a=device('offline-device',[p]);await a.sync.once();a.state.records[0].sequences[0].notes='Écrit sans réseau';const transport=a.sync.transport;a.sync.transport=async()=>{throw Error('offline');};await a.sync.once();assert.equal(a.state.statuses.at(-1),'offline');assert.equal(a.state.records[0].sequences[0].notes,'Écrit sans réseau');a.sync.transport=transport;await a.sync.once();const b=device('offline-device');await b.sync.once();assert.equal(b.state.records[0].sequences[0].notes,'Écrit sans réseau');});
test('Les modifications simultanées préservent une copie au lieu d’écraser l’autre appareil',async()=>{const p=project(),a=device('conflict-devices',[p]),b=device('conflict-devices');await a.sync.once();await b.sync.once();a.state.records[0].sequences[0].notes='Version PC';b.state.records[0].sequences[0].notes='Version téléphone';await a.sync.once();await b.sync.once();const all=(await(await api('conflict-devices','/api/sync/films')).json()).films;assert.equal(all.length,2);assert.equal(all.find(f=>f.project.id===p.id).project.sequences[0].notes,'Version PC');assert.equal(all.find(f=>f.project.id!==p.id).project.sequences[0].notes,'Version téléphone');assert.equal(b.state.conflicts.length,1);});
test('Une modification pendant un envoi reste en attente et n’est pas perdue',async()=>{const p=project(),a=device('in-flight',[p]);await a.sync.once();a.state.records[0].name='Premier changement';const original=a.sync.transport;let changed=false;a.sync.transport=async(path,options)=>{const response=await original(path,options);if(options.method==='PUT'&&!changed){changed=true;a.state.records[0].name='Changement pendant l’envoi';}return response;};await a.sync.once();assert.equal(a.state.records[0].name,'Changement pendant l’envoi');assert.equal(a.state.statuses.at(-1),'pending');await a.sync.once();const stored=(await(await api('in-flight','/api/sync/films')).json()).films[0].project;assert.equal(stored.name,'Changement pendant l’envoi');});
test('Interface et ressources versionnées servies par le Worker, données de synchronisation non cachées',async()=>{const html=await api(null,'/');assert.equal(html.status,200);assert.equal(html.headers.get('cache-control'),'no-store');assert.match(await html.text(),/studio-4/);const version=await api(null,'/version.json');assert.equal((await version.json()).version,'4.2.0');const css=await api(null,'/style.css?v=studio-4');assert.equal(css.status,200);assert.match(css.headers.get('content-type'),/text\/css/);});
test('Un export JSON synchronisé se restaure comme un film indépendant',()=>{const p=project();p._sync={revision:9,fingerprint:'cloud-state'};const file=serialize(p);assert.doesNotMatch(file,/_sync|cloud-state/);const restored=cloneProject(restore(file));assert.notEqual(restored.id,p.id);assert.equal(restored._sync,undefined);});
test('Projet incohérent et numéro de révision invalide refusés avant écriture',async()=>{const p=project();p.sequences[0].clips[0].mediaId='missing';assert.equal((await upload('invalid-owner',p)).status,400);assert.equal((await upload('invalid-owner',project(),-1)).status,400);assert.deepEqual((await(await api('invalid-owner','/api/sync/films')).json()).films,[]);});

test('Storyboard privé et médias persistants : sauvegarde, lecture, plage vidéo et isolation des comptes',async()=>{
 const p=project();p.storyboard={version:1,shots:[],order:[],tracks:[],bible:[],trash:[]};
 assert.equal((await upload('story-owner',p)).status,200);
 const saved=(await(await api('story-owner','/api/sync/films')).json()).films[0].project;
 assert.deepEqual(saved.storyboard,p.storyboard);
 const mediaPath='/api/story-media/test-media';
 assert.equal((await api(null,mediaPath)).status,401);
 assert.equal((await api('story-owner',mediaPath,{method:'PUT',headers:{'Content-Type':'image/svg+xml','Content-Length':'4'},body:'test'})).status,415);
 const bytes=new Uint8Array([1,2,3,4,5,6,7,8]);
 assert.equal((await api('story-owner',mediaPath,{method:'PUT',headers:{'Content-Type':'video/mp4','Content-Length':'8'},body:bytes})).status,200);
 const response=await api('story-owner',mediaPath);assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
 assert.equal((await api('other-owner',mediaPath)).status,404);
 const partial=await api('story-owner',mediaPath,{headers:{Range:'bytes=2-4'}});assert.equal(partial.status,206);assert.deepEqual(new Uint8Array(await partial.arrayBuffer()),bytes.slice(2,5));
});

test('Un ancien appareil ne supprime pas le storyboard en enregistrant son montage',async()=>{const p=project();p.storyboard={version:1,shots:[],order:[],tracks:[],bible:[],trash:[]};assert.equal((await upload('old-client',p)).status,200);delete p.storyboard;p.name='Montage modifié';assert.equal((await upload('old-client',p,1)).status,200);const all=(await(await api('old-client','/api/sync/films')).json()).films;assert.ok(all[0].project.storyboard);assert.equal(all[0].project.name,p.name);});

test('Historique durable : chaque écriture acceptée conserve ses notes, un conflit ne les remplace pas',async()=>{
 const p=project(),path='/api/sync/films/'+p.id+'/history';
 p.sequences[0].notes='Première description';await upload('history-owner',p);
 p.sequences[0].notes='Description suivante';await upload('history-owner',p,1);
 p.sequences[0].notes='Écriture périmée';assert.equal((await upload('history-owner',p,1)).status,409);
 const list=await(await api('history-owner',path)).json();assert.deepEqual(list.versions.map(v=>v.revision),[2,1]);
 const first=await(await api('history-owner',path+'/1')).json();assert.equal(first.project.sequences[0].notes,'Première description');
 const second=await(await api('history-owner',path+'/2')).json();assert.equal(second.project.sequences[0].notes,'Description suivante');
 const recovered=cloneProject(restore(JSON.stringify({application:'QUEST Montage',version:1,project:first.project})));
 assert.notEqual(recovered.id,p.id);assert.equal((await upload('history-owner',recovered)).status,200);
 assert.equal((await api('other-history-owner',path+'/1')).status,404);
 assert.deepEqual((await(await api('other-history-owner',path)).json()).versions,[]);
});

test('Le premier enregistrement après migration archive aussi la version précédente',async()=>{
 const p=project(),db=await mf.getD1Database('DB');
 await db.prepare('INSERT INTO montage_films (owner_id, project_id, revision, project_json, updated_at) VALUES (?, ?, ?, ?, ?)').bind('legacy-history',p.id,42,JSON.stringify(p),1).run();
 p.name='Après mise à jour';assert.equal((await upload('legacy-history',p,42)).status,200);
 const prior=await(await api('legacy-history','/api/sync/films/'+p.id+'/history/42')).json();assert.equal(prior.project.name,'Film synchronisé');
});

test('Un champ saisi pendant une écriture locale interdit le remplacement distant retardé',()=>{
 const p=project(),expected=signature(p);assert.equal(canApplyRemote(p,expected),true);
 p.sequences[0].notes='Saisie pendant la sauvegarde';assert.equal(canApplyRemote(p,expected),false);
 assert.equal(canApplyRemote(undefined,null),true);assert.equal(canApplyRemote(p,null),false);
});

test('Une fiche en cours de saisie envoie ses changements sans recevoir un remplacement distant',async()=>{
 const p=project(),a=device('editing-owner',[p]),b=device('editing-owner');await a.sync.once();await b.sync.once();
 a.state.records[0].name='Depuis un autre appareil';await a.sync.once();
 b.sync.blocked=(_id,phase)=>phase==='pull';await b.sync.once();assert.equal(b.state.records[0].name,p.name);assert.equal(b.state.statuses.at(-1),'pending');
 b.sync.blocked=()=>false;await b.sync.once();assert.equal(b.state.records[0].name,'Depuis un autre appareil');
 b.sync.blocked=(_id,phase)=>phase==='pull';b.state.records[0].sequences[0].notes='Saisie active';await b.sync.once();
 const saved=(await(await api('editing-owner','/api/sync/films')).json()).films[0].project;assert.equal(saved.sequences[0].notes,'Saisie active');
});
