import {Miniflare} from 'miniflare';
import http from 'node:http';
import fs from 'node:fs/promises';
import './build.mjs';
const args=process.argv.slice(2),value=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const mf=new Miniflare({modules:true,scriptPath:'dist/server/index.js',compatibilityDate:'2026-06-01',r2Buckets:['MEDIA'],r2Persist:'.openai/local-preview/r2',d1Databases:['DB'],d1Persist:'.openai/local-preview/d1'});
const db=await mf.getD1Database('DB');await db.prepare('CREATE TABLE IF NOT EXISTS local_applied_migrations (name TEXT PRIMARY KEY)').run();
for(const file of (await fs.readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){if(await db.prepare('SELECT name FROM local_applied_migrations WHERE name = ?').bind(file).first())continue;for(const sql of(await fs.readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();await db.prepare('INSERT INTO local_applied_migrations (name) VALUES (?)').bind(file).run();}
// The preview server supplies a local test identity. Production trusts only Sites identity headers.
const server=http.createServer(async(req,res)=>{try{const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','quest-local-test-owner');const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const response=await mf.dispatchFetch('http://'+req.headers.host+req.url,{method:req.method,headers:Object.fromEntries(headers),body:body.length?body:undefined});res.writeHead(response.status,{...Object.fromEntries(response.headers),'cache-control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end('Local preview error');console.error(e);}});
server.listen(Number(value('--port',process.env.PORT||'4173')),value('--host','0.0.0.0'),()=>console.log('QUEST local preview ready'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>mf.dispose().then(()=>process.exit())));
