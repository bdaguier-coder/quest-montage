import fs from 'node:fs/promises';
import path from 'node:path';
import {build} from 'esbuild';
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4'};
const assets={};async function walk(dir,relative=''){for(const entry of await fs.readdir(dir,{withFileTypes:true})){const rel=relative+'/'+entry.name,full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full,rel);else assets[rel]={type:types[path.extname(entry.name)]||'application/octet-stream',data:(await fs.readFile(full)).toString('base64')};}}
await walk('client');await fs.mkdir('.openai',{recursive:true});await fs.writeFile('.openai/assets.generated.mjs','export default '+JSON.stringify(assets)+';\n');
if(await fs.stat('dist/index.html').then(()=>true).catch(()=>false)){await fs.mkdir('.openai/previous-static',{recursive:true});for(const name of await fs.readdir('dist')){if(name==='server'||name==='.openai')continue;await fs.rename('dist/'+name,'.openai/previous-static/'+name);}}
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['server/worker.mjs'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:false});
await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await fs.cp('drizzle','dist/drizzle',{recursive:true});
console.log('Built Worker, local interface assets and D1 migrations.');
