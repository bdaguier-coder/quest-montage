import fs from 'node:fs/promises';
// docs/ is GitHub Pages' published directory; private data never enters it.
await fs.mkdir('docs',{recursive:true});
await fs.cp('client','docs',{recursive:true});
await fs.rm('docs/sync-bridge.html',{force:true});
await fs.rm('docs/cloud-bridge.mjs',{force:true});
await fs.writeFile('docs/.nojekyll','');
console.log('GitHub Pages interface prepared in docs/.');
