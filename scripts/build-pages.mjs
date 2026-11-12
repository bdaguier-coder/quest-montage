import fs from 'node:fs/promises';
// Support both Pages settings: / (root) and /docs, with the same interface.
const entries=(await fs.readdir('client')).filter(name=>!['sync-bridge.html','cloud-bridge.mjs'].includes(name));
for(const directory of ['docs','.']){
 await fs.mkdir(directory,{recursive:true});
 for(const name of entries)await fs.cp('client/'+name,directory+'/'+name,{recursive:true});
 await fs.writeFile(directory+'/.nojekyll','');
}
await fs.rm('docs/sync-bridge.html',{force:true});
await fs.rm('docs/cloud-bridge.mjs',{force:true});
console.log('GitHub Pages interface prepared at the root and in docs/.');
