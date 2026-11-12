import {cloudFetch} from './cloud-client.mjs?v=studio-4e';
import {uid} from './core.mjs?v=studio-4e';
const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,o[k]]));
export function cloudData(p){
 const out=pick(p,['schema','id','name','createdAt','updatedAt','demo','storyboard']);
 out.settings=pick(p.settings||{},['basePath','fps','width','height']);
 out.media=p.media.map(m=>pick(m,['id','name','title','path','absolutePath','size','modified','type','notes','duration','width','height','fps','hasAudio','audioChannels','audioRate','sourceStart','demoFile']));
 out.sequences=p.sequences.map(s=>({...pick(s,['id','title','color','description','target','notes']),clips:s.clips.map(c=>pick(c,['id','mediaId','in','out','notes']))}));return out;
}
export function signature(p){const d=cloudData(p);delete d.updatedAt;return JSON.stringify(d);}
export const isDirty=p=>!p._sync?.revision||p._sync.fingerprint!==signature(p);
// Recheck after a queued local write; the user may have typed while it completed.
export const canApplyRemote=(local,expected)=>expected===null?!local:!!local&&signature(local)===expected;
export function mergeRemote(remote,local){const p=structuredClone(remote.project);p.media=p.media.map(m=>{const old=local?.media.find(o=>o.id===m.id);return {...m,...(old?.thumb?{thumb:old.thumb}:{}),...(old?.previewable!==undefined?{previewable:old.previewable}:{})};});p._sync={revision:remote.revision,fingerprint:signature(p)};return p;}
class AuthRequired extends Error{}
export class FilmSync {
 constructor({list,store,onState=()=>{},onConflict=()=>{},blocked=()=>false,transport=(...args)=>cloudFetch(...args)}){Object.assign(this,{list,store,onState,onConflict,blocked,transport});this.running=null;this.repeat=false;}
 async request(path,options){const response=await this.transport(path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(12000),...options});if([401,403].includes(response.status)||!response.headers.get('content-type')?.includes('application/json'))throw new AuthRequired();const data=await response.json();return {response,data};}
 async conflict(local,remote){
  if(!remote){local._sync={revision:0};await this.store(local,{kind:'ack'});return;}
  const copy=structuredClone(local);copy.id=uid();copy.name+=' — copie locale';copy.createdAt=Date.now();copy._sync={revision:0};
  await this.store(copy,{kind:'conflict',replaceActive:local.id});await this.store(mergeRemote(remote,local),{kind:'remote'});this.onConflict(copy.name);this.repeat=true;
 }
 async run(){
  this.onState('syncing');
  try{
   const pull=await this.request('/api/sync/films');if(!pull.response.ok)throw new Error('sync_unavailable');
   let deferred=false;
   for(const remote of [...pull.data.films].sort((a,b)=>Number(b.revision>1)-Number(a.revision>1)||(b.updatedAt||0)-(a.updatedAt||0))){const local=this.list().find(p=>p.id===remote.project.id);if(this.blocked(remote.project.id,'pull')){if(!local||remote.revision>(local._sync?.revision||0))deferred=true;continue;}if(!local){if(await this.store(mergeRemote(remote),{kind:'remote',expectedFingerprint:null})===false)deferred=true;continue;}if(remote.revision>(local._sync?.revision||0)){if(isDirty(local)&&signature(local)!==signature(remote.project))await this.conflict(local,remote);else if(await this.store(mergeRemote(remote,local),{kind:'remote',expectedFingerprint:signature(local)})===false)deferred=true;}}
   for(const local of this.list()){
    if(!isDirty(local)||this.blocked(local.id,'push'))continue;
    const sent=cloudData(local),fingerprint=signature(local),baseRevision=local._sync?.revision||0;
    const result=await this.request('/api/sync/films/'+encodeURIComponent(local.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({project:sent,baseRevision})});
    const current=this.list().find(p=>p.id===local.id);if(!current)continue;
    if(result.response.status===409){await this.conflict(current,result.data.remote);continue;}
    if(!result.response.ok)throw new Error('sync_unavailable');
    current._sync={revision:result.data.revision,fingerprint};await this.store(current,{kind:'ack'});
   }
   const pending=deferred||this.list().some(isDirty);this.onState(pending?'pending':'synced');return true;
  }catch(error){console.warn('QUEST sync:',error.message);this.onState(error instanceof AuthRequired?'auth':'offline');return false;}
 }
 async once(){if(this.running){this.repeat=true;return this.running;}this.running=(async()=>{for(let i=0;i<3;i++){this.repeat=false;const ok=await this.run();if(!ok||!this.repeat)break;}})();try{await this.running;}finally{this.running=null;}}
}
