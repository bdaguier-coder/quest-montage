import {validateStory} from './story-core.mjs';
export const COLORS=['#67d5ca','#b59ae8','#e6bc79','#ef8c91','#7ba9ee','#aecf79','#db9a68','#a7b8d5'];
export const uid=()=>crypto.randomUUID?.()||'qm-'+Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
export function newProject(name='Mon premier film'){return {schema:1,id:uid(),name,createdAt:Date.now(),updatedAt:Date.now(),media:[],sequences:[],settings:{basePath:'',fps:'25',width:1920,height:1080}};}
export function newSequence(title,color=COLORS[0],description='',target=null){return {id:uid(),title,color,description,target,notes:'',clips:[]};}
export function clipDuration(c,p){const m=p.media.find(m=>m.id===c.mediaId);return Math.max(0,(c.out??m?.duration??0)-(c.in??0));}
export const sequenceDuration=(s,p)=>s.clips.reduce((n,c)=>n+clipDuration(c,p),0);
export const totalDuration=p=>p.sequences.reduce((n,s)=>n+sequenceDuration(s,p),0);
export function time(n,precise=false){if(!Number.isFinite(n))return '—';const ms=Math.round(Math.max(0,n)*1000),h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+(precise?'.'+String(ms%1000).padStart(3,'0'):'');}
export function addClip(p,sequenceId,mediaId,index){const s=p.sequences.find(s=>s.id===sequenceId),m=p.media.find(m=>m.id===mediaId);if(!s||!m||!m.duration)throw new Error('Renseignez la durée du rush avant de l’ajouter.');const c={id:uid(),mediaId,in:0,out:null,notes:''};s.clips.splice(index??s.clips.length,0,c);return c;}
export function moveClip(p,clipId,destId,index){const src=p.sequences.find(s=>s.clips.some(c=>c.id===clipId)),dest=p.sequences.find(s=>s.id===destId);if(!src||!dest)return;const old=src.clips.findIndex(c=>c.id===clipId);const [c]=src.clips.splice(old,1);if(src===dest&&index>old)index--;dest.clips.splice(Math.max(0,index??dest.clips.length),0,c);}
export function moveSequence(p,id,index){const from=p.sequences.findIndex(s=>s.id===id);if(from<0)return;const [s]=p.sequences.splice(from,1);if(index>from)index--;p.sequences.splice(Math.max(0,index),0,s);}
export function duplicateSequence(p,id){const i=p.sequences.findIndex(s=>s.id===id);const s=structuredClone(p.sequences[i]);s.id=uid();s.title+=' — copie';s.clips.forEach(c=>c.id=uid());p.sequences.splice(i+1,0,s);return s;}
export function setTrim(c,m,start,end){if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>m.duration+0.00001)throw new Error('Les points doivent respecter 0 ≤ entrée < sortie ≤ durée originale.');c.in=start;c.out=Math.abs(end-m.duration)<0.00001?null:end;}
export function serialize(p){const clean=structuredClone(p);delete clean._sync;return JSON.stringify({application:'QUEST Montage',version:1,project:clean},null,2);}
export function restore(text){const d=JSON.parse(text);if(d.application!=='QUEST Montage'||d.version!==1)throw new Error('Ce fichier n’est pas un projet QUEST Montage version 1.');const p=d.project;if(!p||!Array.isArray(p.media)||!Array.isArray(p.sequences)||typeof p.name!=='string')throw new Error('Structure de projet incorrecte.');
 const ids=new Set();const checkId=o=>{if(typeof o.id!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(o.id)||ids.has(o.id))throw new Error('Identifiant absent ou dupliqué.');ids.add(o.id);};checkId(p);
 for(const m of p.media){checkId(m);if(typeof m.name!=='string'||!Number.isFinite(m.duration)||m.duration<0)throw new Error('Rush incorrect.');m.path=String(m.path||m.name);m.notes=String(m.notes||'');if(m.thumb&&!/^data:image\/(jpeg|png|webp);base64,/.test(m.thumb))m.thumb='';}
 for(const s of p.sequences){checkId(s);if(typeof s.title!=='string'||!Array.isArray(s.clips)||!/^#[0-9a-f]{6}$/i.test(s.color))throw new Error('Séquence incorrecte.');if(s.target!=null&&(!Number.isFinite(s.target)||s.target<0))throw new Error('Durée cible incorrecte.');for(const c of s.clips){checkId(c);const m=p.media.find(m=>m.id===c.mediaId);if(!m)throw new Error('Référence de rush absente.');setTrim(c,m,c.in??0,c.out??m.duration);}}
 if(p.storyboard)validateStory(p.storyboard);
 p.settings={basePath:'',fps:'25',width:1920,height:1080,...p.settings};p.schema=1;return p;
}
export function cloneProject(p){const c=structuredClone(p);c.id=uid();c.name+=' — restauré';c.createdAt=Date.now();delete c._sync;return c;}
export const xml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function rational(s){const n=Math.round(s*1000000),d=1000000,g=gcd(Math.abs(n),d);return d/g===1?`${n/g}s`:`${n/g}/${d/g}s`;}
export function fileURL(path){if(path.startsWith('file:')){const u=new URL(path);if(u.protocol!=='file:'||u.hostname)throw new Error('Utilisez un chemin local Mac, par exemple /Volumes/Films/Rushes.');return u.href;}if(!path.startsWith('/'))throw new Error('Le chemin Mac doit commencer par / (ex. /Volumes/Films/Rushes).');return 'file://'+path.split('/').map(encodeURIComponent).join('/');}
export function mediaURL(m,settings){const p=m.absolutePath?.trim();if(p)return fileURL(p);const base=settings.basePath.trim().replace(/\/$/,'');if(!base)return fileURL('/QUEST_A_RECONNECTER/'+m.path.replace(/^\/+/,'').split('/').filter(s=>s!=='.'&&s!=='..').join('/'));return fileURL(base+'/'+m.path.replace(/^\/+/,''));}
export function makeFCPXML(p){
 const used=[...new Set(p.sequences.flatMap(s=>s.clips.map(c=>c.mediaId)))].map(id=>p.media.find(m=>m.id===id));if(!used.length)throw new Error('Ajoutez au moins un plan au film.');
 const fps=Number(p.settings.fps);if(![23.976,24,25,29.97,30,50,59.94,60].includes(fps))throw new Error('Cadence de projet incorrecte.');const frame=fps===23.976?'1001/24000s':fps===29.97?'1001/30000s':fps===59.94?'1001/60000s':`1/${fps}s`;
 const w=Number(p.settings.width),h=Number(p.settings.height);if(!Number.isInteger(w)||!Number.isInteger(h)||w<16||h<16||w>16384||h>16384)throw new Error('Dimensions de projet incorrectes.');
 const ref=new Map(used.map((m,i)=>[m.id,`a${i+1}`]));
 const resources=[`<format id="f1" frameDuration="${frame}" width="${w}" height="${h}" colorSpace="1-1-1 (Rec. 709)"/>`];
 for(const m of used){if(!m||!m.duration)throw new Error('Un rush utilisé n’a pas de durée valide.');const af=m.fps?((Math.abs(m.fps-23.976)<.02)?'1001/24000s':(Math.abs(m.fps-29.97)<.02)?'1001/30000s':(Math.abs(m.fps-59.94)<.02)?'1001/60000s':rational(1/m.fps)):frame;
 resources.push(`<format id="f_${ref.get(m.id)}" frameDuration="${af}" width="${m.width||w}" height="${m.height||h}"/>`);
 const audio=m.hasAudio===false?'':` hasAudio="1" audioSources="1" audioChannels="${m.audioChannels||2}" audioRate="${m.audioRate||48000}"`;
 resources.push(`<asset id="${ref.get(m.id)}" name="${xml(m.name)}" start="${rational(m.sourceStart||0)}" duration="${rational(m.duration)}" hasVideo="1" format="f_${ref.get(m.id)}"${audio}><media-rep kind="original-media" src="${xml(mediaURL(m,p.settings))}"/></asset>`);}
 let offset=0;const clips=[];for(const s of p.sequences){let first=true;for(const c of s.clips){const m=used.find(m=>m.id===c.mediaId);setTrim({...c},m,c.in??0,c.out??m.duration);const dur=clipDuration(c,p),start=(m.sourceStart||0)+(c.in||0);let body='';const note=[m.notes,c.notes].filter(Boolean).join('\n');if(note)body+=`<note>${xml(note)}</note>`;if(first){body+=`<marker start="${rational(start)}" duration="${frame}" value="${xml(s.title)}" note="${xml([s.description,s.notes].filter(Boolean).join('\n'))}"/>`;first=false;}
 clips.push(`<asset-clip ref="${ref.get(m.id)}" name="${xml(m.title||m.name)}" offset="${rational(offset)}" start="${rational(start)}" duration="${rational(dur)}">${body}</asset-clip>`);offset+=dur;}}
 return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE fcpxml>\n<fcpxml version="1.9"><resources>${resources.join('\n')}</resources><library><event name="QUEST Montage"><project name="${xml(p.name)}"><sequence format="f1" duration="${rational(offset)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k"><spine>${clips.join('\n')}</spine></sequence></project></event></library></fcpxml>`;
}
