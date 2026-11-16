// Empty starter films must not hide recovered work after a reload.
export function hasProjectContent(p){
 const s=p?.storyboard;
 return !!(p?.media?.length||p?.sequences?.length||s?.shots?.length||s?.bible?.length||s?.trash?.length);
}
export function isStarterProject(p){
 if(!p||p.name!=='Mon premier film'||p.demo||hasProjectContent(p))return false;
 const settings=p.settings||{};
 if((settings.basePath||'')!==''||String(settings.fps??25)!=='25'||(settings.width??1920)!==1920||(settings.height??1080)!==1080)return false;
 const s=p.storyboard;if(!s)return true;
 if(s.order?.length||(s.zoom??1)!==1)return false;
 const defaults=[['Émilie','#76b4ac'],['Sécurité','#d59279'],['Café','#c4ad75']];
 return s.tracks?.length===3&&s.tracks.every((t,i)=>t.name===defaults[i][0]&&t.color===defaults[i][1]);
}
export function preferredProject(projects,lastId){
 const last=projects.find(p=>p.id===lastId);
 if(last&&!isStarterProject(last))return last;
 return [...projects].filter(hasProjectContent).sort((a,b)=>Number((b._sync?.revision||0)>1)-Number((a._sync?.revision||0)>1)||(b.updatedAt||0)-(a.updatedAt||0))[0]||last||projects[0];
}
export const shouldOpenRecoveredProject=(current,incoming,starterId)=>current?.id===starterId&&isStarterProject(current)&&hasProjectContent(incoming);
