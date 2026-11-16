import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject} from '../client/core.mjs';
import {ensure,shot} from '../client/story-core.mjs';
import {hasProjectContent,isStarterProject,preferredProject,shouldOpenRecoveredProject} from '../client/project-selection.mjs';
const work=()=>{const p=newProject('Émilie');ensure(p).shots.push(shot('Mon plan'));return p;};
test('Un film vide déjà enregistré ne masque pas le storyboard au redémarrage',()=>{
 const empty=newProject(),film=work();ensure(empty);empty._sync={revision:9};empty.updatedAt=film.updatedAt+1000;
 const before=JSON.stringify([empty,film]);assert.equal(preferredProject([empty,film],empty.id).id,film.id);assert.equal(JSON.stringify([empty,film]),before);
});
test('Un premier film vide reçu du serveur ne bloque pas le film contenant les plans',()=>{
 const current=newProject();ensure(current);const incomingEmpty=newProject(),film=work();
 assert.equal(shouldOpenRecoveredProject(current,incomingEmpty,current.id),false);
 assert.equal(shouldOpenRecoveredProject(current,film,current.id),true);
});
test('La saisie ou le choix explicite d’un film protège la sélection',()=>{
 const current=newProject(),id=current.id,film=work();ensure(current);current.storyboard.shots.push(shot('Saisie en cours'));
 assert.equal(shouldOpenRecoveredProject(current,film,id),false);assert.equal(preferredProject([current,film],current.id),current);
 assert.equal(shouldOpenRecoveredProject(newProject(),film,null),false);
});
test('Bible, corbeille, montage et réglages personnalisés ne sont pas des brouillons jetables',()=>{
 for(const change of [p=>ensure(p).bible.push({id:'ref'}),p=>ensure(p).trash.push({shot:shot('Retiré')}),p=>p.sequences.push({id:'sequence'}),p=>p.settings.fps='30',p=>ensure(p).tracks[0].name='Personnalisé',p=>p.name='Mon nouveau film']){
  const p=newProject();change(p);assert.equal(isStarterProject(p),false);assert.equal(preferredProject([p,work()],p.id),p);
 }
});
test('Un appareil sans film ne fabrique pas de travail et conserve son brouillon',()=>{
 const p=newProject();ensure(p);assert.equal(isStarterProject(p),true);assert.equal(hasProjectContent(p),false);assert.equal(preferredProject([p],p.id),p);assert.equal(preferredProject([],null),undefined);
});
