export const CLOUD_ORIGIN='https://quest-montage.korben.chatgpt.site';
export const PROTOCOL='quest-montage-cloud-v1';
export const usesCloudBridge=()=>typeof location!=='undefined'&&location.hostname==='bdaguier-coder.github.io';
let popup=null,nonce='',ready=false,listening=false;
const pending=new Map(),waiting=new Set();

function listen(){
 if(listening)return;listening=true;
 window.addEventListener('message',event=>{
  if(event.origin!==CLOUD_ORIGIN||event.source!==popup)return;
  const data=event.data;if(data?.protocol!==PROTOCOL||data.nonce!==nonce)return;
  if(data.kind==='ready'){ready=true;for(const done of waiting)done();waiting.clear();window.dispatchEvent(new Event('quest-cloud-connected'));return;}
  if(data.kind==='response')pending.get(data.id)?.(data);
 });
}
export function connectCloud(){
 if(!usesCloudBridge())return Promise.resolve();listen();
 if(popup&&!popup.closed){popup.focus();if(ready)return Promise.resolve();}
 else{
  ready=false;nonce=crypto.randomUUID();
  const url=new URL('/sync-bridge.html',CLOUD_ORIGIN);url.searchParams.set('origin',location.origin);url.searchParams.set('nonce',nonce);
  popup=window.open(url.href,'quest-montage-synchronisation','popup,width=520,height=600');
  if(!popup)return Promise.reject(Error('Autorisez l’ouverture de la fenêtre de synchronisation, puis cliquez à nouveau sur Connecter mes films.'));
 }
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{waiting.delete(done);reject(Error('La connexion des films attend votre connexion dans la fenêtre de synchronisation.'));},120000);
  const done=()=>{clearTimeout(timer);resolve();};waiting.add(done);
  popup.postMessage({protocol:PROTOCOL,nonce,kind:'ping'},CLOUD_ORIGIN);
 });
}
export async function cloudFetch(path,options={}){
 if(!usesCloudBridge())return fetch(path,options);
 if(!popup||popup.closed||!ready){ready=false;return new Response(JSON.stringify({error:'auth_required'}),{status:401,headers:{'Content-Type':'application/json'}});}
 if(options.signal?.aborted)throw options.signal.reason;
 const id=crypto.randomUUID();
 return new Promise((resolve,reject)=>{
  const finish=()=>{clearTimeout(timer);pending.delete(id);options.signal?.removeEventListener('abort',abort);};
  const abort=()=>{finish();reject(options.signal.reason);};
  const timer=setTimeout(()=>{finish();reject(Error('Synchronisation indisponible. Vérifiez que sa fenêtre est toujours ouverte.'));},120000);
  pending.set(id,data=>{finish();resolve(new Response(data.body,{status:data.status,headers:data.headers}));});
  options.signal?.addEventListener('abort',abort,{once:true});
  try{popup.postMessage({protocol:PROTOCOL,nonce,kind:'request',id,path,method:options.method||'GET',headers:Object.fromEntries(new Headers(options.headers)),body:options.body},CLOUD_ORIGIN);}catch(error){finish();reject(error);}
 });
}
