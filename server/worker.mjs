import assets from '../.openai/assets.generated.mjs';
import {restore} from '../client/core.mjs';
import {cloudData} from '../client/sync.mjs';

const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function sharedProject(input){
 const p=restore(JSON.stringify({application:'QUEST Montage',version:1,project:input}));
 if(p.media.length>5000||p.sequences.length>1000||p.sequences.reduce((n,s)=>n+s.clips.length,0)>20000)throw new Error('Ce projet dépasse les limites de synchronisation.');
 return cloudData(p);
}
export async function syncAPI(request,env){
 const url=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return json({error:'auth_required'},401);
 if(!env.DB)return json({error:'sync_unavailable'},503);
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'origin_denied'},403);
 try{
  if(url.pathname==='/api/sync/films'&&request.method==='GET'){
   const rows=await env.DB.prepare('SELECT project_json, revision, updated_at FROM montage_films WHERE owner_id = ? ORDER BY updated_at DESC').bind(owner).all();
   return json({films:rows.results.map(row=>({project:JSON.parse(row.project_json),revision:row.revision,updatedAt:row.updated_at}))});
  }
  const history=url.pathname.match(/^\/api\/sync\/films\/([a-zA-Z0-9_-]{1,128})\/history(?:\/(\d+))?$/);
  if(history&&request.method==='GET'){
   if(history[2]){
    const row=await env.DB.prepare('SELECT project_json, revision, updated_at FROM montage_film_versions WHERE owner_id = ? AND project_id = ? AND revision = ?').bind(owner,history[1],Number(history[2])).first();
    return row?json({project:JSON.parse(row.project_json),revision:row.revision,updatedAt:row.updated_at}):json({error:'not_found'},404);
   }
   const rows=await env.DB.prepare('SELECT revision, updated_at FROM montage_film_versions WHERE owner_id = ? AND project_id = ? ORDER BY revision DESC LIMIT 100').bind(owner,history[1]).all();
   return json({versions:rows.results.map(row=>({revision:row.revision,updatedAt:row.updated_at}))});
  }
  const match=url.pathname.match(/^\/api\/sync\/films\/([a-zA-Z0-9_-]{1,128})$/);
  if(match&&request.method==='PUT'){
   if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'json_required'},415);
   if(Number(request.headers.get('content-length'))>2000000)return json({error:'project_too_large'},413);
   const text=await request.text();if(text.length>2000000)return json({error:'project_too_large'},413);
   const body=JSON.parse(text),base=body.baseRevision;if(!Number.isInteger(base)||base<0)return json({error:'invalid_revision'},400);
   const project=sharedProject(body.project);if(project.id!==match[1])return json({error:'project_id_mismatch'},400);
   if(!Object.hasOwn(body.project,'storyboard')){const previous=await env.DB.prepare('SELECT project_json FROM montage_films WHERE owner_id = ? AND project_id = ?').bind(owner,project.id).first();if(previous){const prior=JSON.parse(previous.project_json);if(prior.storyboard)project.storyboard=prior.storyboard;}}
   const now=Date.now();project.updatedAt=now;const data=JSON.stringify(project);
   const write=base===0?env.DB.prepare('INSERT INTO montage_films (owner_id, project_id, revision, project_json, updated_at) VALUES (?, ?, 1, ?, ?) ON CONFLICT(owner_id, project_id) DO NOTHING').bind(owner,project.id,data,now):env.DB.prepare('UPDATE montage_films SET project_json = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND project_id = ? AND revision = ?').bind(data,now,owner,project.id,base);
   // Archive both sides of an accepted change in the same atomic transaction.
   // The first save after this upgrade also preserves the existing production film.
   const snapshot=()=>env.DB.prepare('INSERT OR IGNORE INTO montage_film_versions (owner_id, project_id, revision, project_json, updated_at) SELECT owner_id, project_id, revision, project_json, updated_at FROM montage_films WHERE owner_id = ? AND project_id = ?').bind(owner,project.id);
   const results=await env.DB.batch([snapshot(),write,snapshot()]);
   const result=results[1];
   if(result.meta.changes===0){const remote=await env.DB.prepare('SELECT project_json, revision, updated_at FROM montage_films WHERE owner_id = ? AND project_id = ?').bind(owner,project.id).first();return json({error:'conflict',remote:remote?{project:JSON.parse(remote.project_json),revision:remote.revision,updatedAt:remote.updated_at}:null},409);}
   return json({revision:base+1,updatedAt:now});
  }
  return json({error:'not_found'},404);
 }catch(error){if(error instanceof SyntaxError||/projet|séquence|rush|Identifiant|Référence|points|Durée|durée/i.test(error.message))return json({error:'invalid_project',message:error.message},400);console.error('Sync storage error');return json({error:'sync_unavailable'},503);}
}

export async function storyMediaAPI(request,env){
 const url=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 if(!owner)return json({error:'auth_required'},401);
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({error:'origin_denied'},403);
 const match=url.pathname.match(/^\/api\/story-media\/([a-zA-Z0-9_-]{1,128})$/);if(!match)return json({error:'not_found'},404);
 if(!env.MEDIA)return json({error:'media_unavailable'},503);
 const key=encodeURIComponent(owner)+'/'+match[1];
 if(request.method==='PUT'){
  const type=(request.headers.get('content-type')||'').split(';')[0];
  if(!/^(image\/(png|jpeg|webp)|video\/[a-zA-Z0-9.+-]+)$/.test(type))return json({error:'unsupported_media'},415);
  const size=Number(request.headers.get('content-length'));if(!size||size>200*1024*1024)return json({error:'media_too_large'},413);
  // IDs are immutable; a repeated upload only reconnects the same authenticated owner's object.
  if(!await env.MEDIA.head(key))await env.MEDIA.put(key,request.body,{httpMetadata:{contentType:type}});
  return json({ok:true});
 }
 if(['GET','HEAD'].includes(request.method)){
  const object=await env.MEDIA.get(key,{range:request.headers});if(!object)return json({error:'not_found'},404);
  const headers=new Headers({'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Security-Policy':"default-src 'none'; sandbox"});
  object.writeHttpMetadata(headers);headers.set('ETag',object.httpEtag);
  let status=200;if(request.headers.has('range')&&object.range){const start=object.range.offset??Math.max(0,object.size-object.range.suffix);const length=object.range.length??object.size-start;headers.set('Content-Range','bytes '+start+'-'+(start+length-1)+'/'+object.size);headers.set('Content-Length',String(length));status=206;}else headers.set('Content-Length',String(object.size));
  return new Response(request.method==='HEAD'?null:object.body,{status,headers});
 }
 return json({error:'method_not_allowed'},405);
}

export default {async fetch(request,env){
 const url=new URL(request.url);if(url.pathname.startsWith('/api/story-media/'))return storyMediaAPI(request,env);if(url.pathname.startsWith('/api/sync/'))return syncAPI(request,env);
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 const asset=assets[url.pathname==='/'?'/index.html':url.pathname];if(!asset)return new Response('Page introuvable',{status:404});
 const cache=['/','/index.html','/sw.js','/version.json'].includes(url.pathname)?'no-store':'private, max-age=3600';
 const headers={'Content-Type':asset.type,'Cache-Control':cache,'X-Content-Type-Options':'nosniff'};
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers});
}};
