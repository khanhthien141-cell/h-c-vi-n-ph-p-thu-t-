import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {serviceOrigin} from './shared/service-origin.js';

if (fs.existsSync('.env') && process.loadEnvFile) process.loadEnvFile('.env');
const worker = (await import('./dist/server/index.js')).default;
const frontendOrigin = process.env.FRONTEND_ORIGIN
 ? serviceOrigin(process.env.FRONTEND_ORIGIN,'FRONTEND_ORIGIN')
 : '';
const dir = process.env.DATA_DIR || './data';
fs.mkdirSync(dir,{recursive:true});
const sqlite = new DatabaseSync(path.join(dir,'mila.sqlite'));
sqlite.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS arcana_store (key TEXT PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0);');
const DB = {
 prepare(sql) {
  return {bind(...args) {
   return {
    async first() { return sqlite.prepare(sql).get(...args) || null; },
    async all() { return {results:sqlite.prepare(sql).all(...args)}; },
    async run() { return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}; }
   };
  }};
 }
};
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(process.env.PORT || (portIndex>=0 ? args[portIndex+1] : 3000));

function cors(req,res,pathname) {
 if (!frontendOrigin || !pathname.startsWith('/api/')) return false;
 res.setHeader('Vary','Origin');
 const allowed = req.headers.origin === frontendOrigin;
 if (allowed) res.setHeader('Access-Control-Allow-Origin',frontendOrigin);
 if (req.method !== 'OPTIONS') return false;
 if (!allowed) {
  res.writeHead(403);
  res.end();
  return true;
 }
 res.writeHead(204,{
  'Access-Control-Allow-Methods':'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers':'Authorization, Content-Type',
  'Access-Control-Max-Age':'86400'
 });
 res.end();
 return true;
}

createServer(async (req,res) => {
 try {
  const url = new URL(req.url,'http://localhost:'+port);
  if (cors(req,res,url.pathname)) return;
  const parts = [];
  let size = 0;
  for await (const chunk of req) {
   size += chunk.length;
   if (size > 2*1024*1024) {
    res.writeHead(413);
    res.end('File quá lớn');
    return;
   }
   parts.push(chunk);
  }
  const headers = new Headers();
  for (const [key,value] of Object.entries(req.headers)) {
   if (value) headers.set(key,Array.isArray(value) ? value.join(',') : value);
  }
  headers.set('CF-Connecting-IP',req.socket.remoteAddress || 'local');
  const request = new Request(url,{
   method:req.method,headers,
   ...(!['GET','HEAD'].includes(req.method) ? {body:Buffer.concat(parts)} : {})
  });
  const response = await worker.fetch(request,{DB,HOST_PASSWORD:process.env.HOST_PASSWORD});
  res.writeHead(response.status,Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
 } catch {
  res.writeHead(500,{'Content-Type':'application/json'});
  res.end(JSON.stringify({error:'Máy chủ gặp lỗi. Hãy tải lại trang.'}));
 }
}).listen(port,'0.0.0.0',() => console.log('MILA ready on port '+port));
