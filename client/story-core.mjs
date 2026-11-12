import {uid} from './core.mjs';
export const FIELDS=[
['title','Titre'],['description','Description'],['action','Action représentée'],['character','Personnage et apparence'],['location','Lieu et environnement'],
['framing','Cadrage',['','Plan large','Plan moyen','Plan rapproché','Gros plan','Insert']],
['angle','Angle',['','Frontal','Plongée','Contre-plongée','Subjectif','Incliné']],
['lens','Focale',['','Grand-angle','Standard','Téléobjectif']],
['perspective','Déformation de perspective'],['camera','Position et mouvement de caméra'],['lighting','Éclairage'],['grade','Colorimétrie'],['mood','Ambiance et émotion'],['notes','Notes de réalisation']];
export const STATES=['Idée','À générer','Image prête','Vidéo prête','Validé'];
export function newStory(){return {version:1,shots:[],order:[],tracks:[{id:uid(),name:'Émilie',color:'#76b4ac'},{id:uid(),name:'Sécurité',color:'#d59279'},{id:uid(),name:'Café',color:'#c4ad75'}],bible:[],trash:[],zoom:1};}
export function ensure(p){return p.storyboard ||= newStory();}
export function shot(title='',trackId=''){return {id:uid(),title,trackId,duration:5,narrative:0,status:'Idée',refs:[],media:[],prompt:'',animation:'',promptHistory:[]};}
export function ordered(s){return s.order.map(id=>s.shots.find(x=>x.id===id)).filter(Boolean);}
export const duration=s=>ordered(s).reduce((n,x)=>n+(Number(x.duration)||0),0);
export function place(s,id,before){s.order=s.order.filter(x=>x!==id);const i=s.order.indexOf(before);s.order.splice(i<0?s.order.length:i,0,id);}
export function duplicate(s,id){const old=s.shots.find(x=>x.id===id);if(!old)return;const next=structuredClone(old);next.id=uid();next.title+=' — copie';s.shots.push(next);if(s.order.includes(id))place(s,next.id,s.order[s.order.indexOf(id)+1]);return next;}
export function remove(s,id){const x=s.shots.find(x=>x.id===id);if(!x)return;s.trash.push({shot:x,index:s.order.indexOf(id),deletedAt:Date.now()});s.shots=s.shots.filter(x=>x.id!==id);s.order=s.order.filter(x=>x!==id);}
export function recover(s,id){const i=s.trash.findIndex(x=>x.shot.id===id);if(i<0)return;const [r]=s.trash.splice(i,1);s.shots.push(r.shot);if(r.index>=0)s.order.splice(Math.min(r.index,s.order.length),0,id);}
const EN={'Plan large':'wide shot','Plan moyen':'medium shot','Plan rapproché':'medium close-up','Gros plan':'close-up','Insert':'insert detail shot','Frontal':'eye-level frontal view','Plongée':'high angle','Contre-plongée':'low angle','Subjectif':'POV shot','Incliné':'Dutch angle','Grand-angle':'wide-angle lens','Standard':'normal lens','Téléobjectif':'telephoto lens'};
export function grokPrompt(x,s){const refs=s.bible.filter(b=>x.refs.includes(b.id));const details=[['Scene',x.description],['Action',x.action],['Character and wardrobe',x.character],['Location and environment',x.location],['Framing',EN[x.framing]||x.framing],['Camera angle',EN[x.angle]||x.angle],['Lens',EN[x.lens]||x.lens],['Perspective distortion',x.perspective],['Camera position and movement intent',x.camera],['Lighting',x.lighting],['Color grading',x.grade],['Mood and emotion',x.mood],['Director notes',x.notes]].filter(([,v])=>v?.trim()).map(([k,v])=>k+': '+v+'.');
return ['Cinematic film still, 16:9 composition.',...refs.map(b=>'Visual continuity — '+b.name+': '+b.description+'.'),...details,'Preserve the specified character identity, wardrobe, props, architecture and lighting continuity. Natural textures, physically plausible light, precise composition. No captions, no watermarks.'].join('\n');}
export function animationPrompt(x){return ['Animate the supplied reference image as a cinematic shot.','Duration: '+(x.duration||5)+' seconds.',x.action&&'Action: '+x.action+'.',x.camera&&'Camera movement: '+x.camera+'.','Preserve character identity, clothing, scene geometry, light direction and color palette. Continuous natural motion; no cuts, no morphing, no added objects.'].filter(Boolean).join('\n');}
export function validateStory(s){if(!s||s.version!==1||!['shots','order','tracks','bible','trash'].every(k=>Array.isArray(s[k])))throw Error('Storyboard incorrect.');
 if(s.shots.length>5000||s.bible.length>500||s.trash.length>5000)throw Error('Storyboard trop volumineux.');
 const ids=new Set();for(const x of [...s.tracks,...s.shots,...s.bible,...s.trash.map(r=>r.shot)]){if(!x||typeof x.id!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(x.id)||ids.has(x.id))throw Error('Identifiant storyboard incorrect.');ids.add(x.id);}
 if(new Set(s.order).size!==s.order.length||s.order.some(id=>!s.shots.some(x=>x.id===id)))throw Error('Ordre du storyboard incorrect.');
 for(const x of [...s.shots,...s.trash.map(r=>r.shot)]){if(!Number.isFinite(x.duration)||x.duration<0||x.duration>86400||!Number.isFinite(x.narrative)||x.narrative<0||!Array.isArray(x.refs)||!Array.isArray(x.media)||!Array.isArray(x.promptHistory))throw Error('Plan storyboard incorrect.');if(x.trackId&&!s.tracks.some(t=>t.id===x.trackId))throw Error('Piste storyboard absente.');}
 for(const x of s.tracks)if(!/^#[0-9a-f]{6}$/i.test(x.color))throw Error('Couleur de piste incorrecte.');return s;}
export function demoStory(){const s=newStory();const groups=[
['Entrée dans l’immeuble','Couloirs','Approche du coffre','Ouverture du coffre','Vol de l’IA','Changement de vêtements','Le miroir','Sortie de l’immeuble','Sur le quai de la gare'],
['Caméras de surveillance','Découverte du vol','Agents mobilisés','Postes désertés','Chaussures dans les couloirs','Recherche dans le hall'],
['Machine à café en fonctionnement','Le café commence à monter','Le café monte encore','À ras bord','Débordement final']];
const descriptions=[
['Émilie franchit le sas de l’immeuble.','Elle traverse le couloir, attentive aux caméras.','Sa main se rapproche du coffre.','Le mécanisme du coffre se déverrouille.','Émilie récupère le support contenant l’IA.','Elle change de tenue pour brouiller les pistes.','Elle vérifie sa nouvelle apparence dans le miroir.','Elle rejoint le hall et sort calmement.','Émilie attend le train, le support dissimulé.'],
['Un moniteur montre les couloirs.','Un agent remarque le coffre ouvert.','Les agents quittent leur poste.','Les sièges du poste de sécurité sont vides.','Des chaussures accélèrent dans le couloir.','Les agents scrutent la foule du hall.'],
['La machine lance un café.','Le niveau du café monte dans la tasse.','Le café continue de couler.','La surface atteint le bord de la tasse.','Le café déborde sur le plateau.']];
groups.forEach((g,t)=>g.forEach((title,i)=>{const x=shot(title,s.tracks[t].id);Object.assign(x,{duration:9,narrative:i*20,action:descriptions[t][i],framing:t===2?'Insert':t===1?'Plan rapproché':'Plan moyen',lighting:'Lumière froide architecturale, contraste contrôlé',grade:'Tons acier et verts désaturés, hautes lumières chaudes',mood:'Suspense et tension progressive',camera:t===2?'Caméra fixe':'Travelling discret'});s.shots.push(x);}));
const by=t=>s.shots.filter(x=>x.trackId===s.tracks[t].id);
const a=by(0),b=by(1),c=by(2);s.order=[a[0],b[0],c[0],a[1],a[2],c[1],a[3],a[4],b[1],c[2],b[2],a[5],b[3],a[6],b[4],c[3],a[7],b[5],c[4],a[8]].map(x=>x.id);
s.bible=[{id:uid(),name:'Émilie — identité à définir',kind:'Personnage',description:'Compléter ici l’apparence définitive et la tenue de référence avant de générer les images.'},{id:uid(),name:'Immeuble — unité visuelle',kind:'Lieu',description:'Architecture contemporaine, couloirs aux lignes nettes, métal brossé et verre, lumière froide maîtrisée.'}];a.forEach(x=>x.refs=[s.bible[0].id,s.bible[1].id]);return s;}
