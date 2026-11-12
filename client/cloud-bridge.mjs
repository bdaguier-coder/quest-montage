import {PROTOCOL} from './cloud-client.mjs';
export const ALLOWED_ORIGIN='https://bdaguier-coder.github.io';
export function allowedCloudRequest(path,method){
 if(typeof path!=='string'||typeof method!=='string')return false;
 if(path==='/api/sync/films')return method==='GET';
 if(/^\/api\/sync\/films\/[a-zA-Z0-9_-]{1,128}$/.test(path))return method==='PUT';
 if(/^\/api\/sync\/films\/[a-zA-Z0-9_-]{1,128}\/history(?:\/\d+)?$/.test(path))return method==='GET';
 if(/^\/api\/story-media\/[a-zA-Z0-9_-]{1,128}$/.test(path))return ['GET','HEAD','PUT'].includes(method);
 return false;
}
export function mountCloudBridge(win=window,transport=fetch){
 const params=new URL(win.location.href).searchParams,origin=params.get('origin'),nonce=params.get('nonce');
 const status=win.document.querySelector('[data-status]');
 if(origin!==ALLOWED_ORIGIN||!win.opener||!/^[a-zA-Z0-9_-]{16,128}$/.test(nonce||'')){status.textContent='Ouvrez la synchronisation depuis votre atelier GitHub.';return ()=>{};}
 const send=data=>win.opener.postMessage({protocol:PROTOCOL,nonce,...data},origin);
 const listener=async event=>{
  if(event.origin!==origin||event.source!==win.opener)return;
  const data=event.data;if(data?.protocol!==PROTOCOL||data.nonce!==nonce)return;
  if(data.kind==='ping'){send({kind:'ready'});return;}
  if(data.kind!=='request'||typeof data.id!=='string'||!allowedCloudRequest(data.path,data.method))return;
  try{
   const headers=new Headers();for(const [key,value] of new Headers(data.headers))if(['content-type','range'].includes(key))headers.set(key,value);
   const response=await transport(data.path,{method:data.method,headers,body:['GET','HEAD'].includes(data.method)?undefined:data.body,credentials:'same-origin',cache:'no-store'});
   const body=[204,205,304].includes(response.status)||data.method==='HEAD'?null:await response.blob();
   send({kind:'response',id:data.id,status:response.status,headers:Object.fromEntries(response.headers),body});
   status.textContent=response.ok?'Films connectés · dernier échange à '+new Date().toLocaleTimeString('fr-FR'):'Connexion à vérifier dans l’atelier.';
  }catch{send({kind:'response',id:data.id,status:503,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:'sync_unavailable'})});}
 };
 win.addEventListener('message',listener);status.textContent='Vos films sont connectés à l’atelier GitHub.';send({kind:'ready'});
 return ()=>win.removeEventListener('message',listener);
}
