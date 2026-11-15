import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createMatch} from '../shared/engine.js';

test('hosted anonymous rooms: nickname join, MC isolation, 20 players, private quiz, resume and export',async t=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'arcana-worker-')),bundle=path.join(temp,'worker.mjs');t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 await build({entryPoints:['worker/index.js'],outfile:bundle,bundle:true,platform:'browser',format:'esm',plugins:[{name:'assets',setup(b){b.onResolve({filter:/^arcana:assets$/},()=>({path:'test',namespace:'assets'}));b.onLoad({filter:/.*/,namespace:'assets'},()=>({contents:'export default {"/mc.html":{type:"text/html",text:"MC public"},"/player.html":{type:"text/html",text:"Nickname only"}}'}));}}]});
 const worker=(await import(pathToFileURL(bundle).href)).default,sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());sqlite.exec(fs.readFileSync('drizzle/0000_glamorous_colonel_america.sql','utf8'));
 const db={prepare(sql){return{bind(...args){return{async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return{results:sqlite.prepare(sql).all(...args)};},async run(){const r=sqlite.prepare(sql).run(...args);return{meta:{changes:r.changes}};}};}};}};
 async function api(route,body,token){const res=await worker.fetch(new Request('https://test.local'+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})}),{DB:db,HOST_PASSWORD:'test-host-password'});return{status:res.status,body:res.headers.get('content-type')?.includes('application/json')?await res.json():res};}
 const a=(await api('/api/guest',{nickname:'Pupil'})).body;assert.equal((await api('/api/duels',{},a.token)).status,403);assert.equal((await api('/api/host',{nickname:'MC',password:'wrong'})).status,401);
 assert.equal((await api('/player.html')).status,200);assert.equal((await api('/mc.html')).status,200);
 const host=(await api('/api/host',{nickname:'MC',password:'test-host-password'})).body,otherHost=(await api('/api/host',{nickname:'MC khác',password:'test-host-password'})).body;assert.ok(host.token);const room=(await api('/api/rooms',{title:'Lớp Bông',mode:'tournament'},host.token)).body;assert.equal(room.code.length,6);
 assert.equal((await api('/api/live/'+room.code+'/mc',{action:'bots'},a.token)).status,400);
 const guests=[];const heroIds=['sol','luna','ivy','kai','ember'];for(let i=0;i<20;i++){const guest=(await api('/api/guest',{nickname:'Bạn '+i})).body;guests.push(guest);const joined=await api('/api/live/'+room.code+'/join',{team:Math.floor(i/5),hero:heroIds[i%5]},guest.token);assert.equal(joined.status,200);assert.equal(joined.body.owner,false);await api('/api/live/'+room.code+'/mc',{action:'approve',id:guest.id},host.token);}
 const extra=(await api('/api/guest',{nickname:'Bạn thêm'})).body;assert.equal((await api('/api/live/'+room.code+'/join',{team:0,hero:'nova'},extra.token)).status,400);
 assert.equal((await api('/api/rooms',{title:'Giả MC'},guests[0].token)).status,403);assert.equal((await api('/api/live/'+room.code+'/mc',{action:'start'},guests[0].token)).status,400);
 const started=await api('/api/live/'+room.code+'/mc',{action:'start'},host.token);assert.equal(started.body.room.phase,'select');assert.equal(started.body.room.players[0].hero,null);assert.ok(started.body.room.selectionEnds>Date.now());for(let i=0;i<20;i++){if(i>=5&&i<15)continue;const picked=await api('/api/live/'+room.code+'/selectHero',{hero:heroIds[i%5]},guests[i].token);assert.equal(picked.status,200);assert.equal(picked.body.room.players.find(p=>p.id===guests[i].id).heroReady,true);}assert.equal((await api('/api/live/'+room.code+'/selectHero',{hero:'nova'},guests[0].token)).status,400);
 const ready=await api('/api/live/'+room.code+'/poll',{},host.token);assert.equal(ready.body.room.phase,'ready');assert.equal(ready.body.match,null);assert.equal((await api('/api/live/'+room.code+'/mc',{action:'launch'},guests[0].token)).status,400);const launched=await api('/api/live/'+room.code+'/mc',{action:'launch'},host.token);assert.equal(launched.body.room.phase,'battle');
 const key='room:'+room.code;let stored=JSON.parse(sqlite.prepare('SELECT value FROM arcana_store WHERE key=?').get(key).value);stored.phase='battle';stored.match=createMatch(stored.players,stored.pair,420);const p=stored.match.players.find(p=>p.id===guests[0].id);p.hp=0;p.dead=10;p.quizTriggers=[{reason:'death'}];stored.lastWall=Date.now()-120;sqlite.prepare('UPDATE arcana_store SET value=? WHERE key=?').run(JSON.stringify(stored),key);
 const polled=await api('/api/live/'+room.code+'/poll',{input:{x:0,z:0}},guests[0].token);assert.equal(polled.body.question.reason,'death');assert.equal(polled.body.question.answer,undefined);assert.equal(polled.body.match.players.find(p=>p.id===guests[0].id).quiz,undefined);
 const spectator=await api('/api/live/'+room.code+'/poll',{},host.token);assert.equal(spectator.body.question,null);
 stored=JSON.parse(sqlite.prepare('SELECT value FROM arcana_store WHERE key=?').get(key).value);const correct=stored.match.players.find(p=>p.id===guests[0].id).quiz.answer,index=polled.body.question.index;
 const wrong=await api('/api/live/'+room.code+'/answer',{index,value:!correct},guests[0].token);assert.equal(wrong.body.ok,false);assert.equal(wrong.body.isCorrect,false);assert.equal(wrong.body.points,0);assert.equal(wrong.body.correctAnswer,correct);assert.equal((await api('/api/live/'+room.code+'/answer',{index,value:correct},guests[0].token)).status,400);
 stored=JSON.parse(sqlite.prepare('SELECT value FROM arcana_store WHERE key=?').get(key).value);const again=stored.match.players.find(p=>p.id===guests[0].id);assert.equal(again.wallet,0);assert.equal(again.ultimate,false);again.quiz={...again.quiz,index:index+1,resolved:false,at:stored.match.time};sqlite.prepare('UPDATE arcana_store SET value=? WHERE key=?').run(JSON.stringify(stored),key);
 const answered=await api('/api/live/'+room.code+'/answer',{index:index+1,value:correct},guests[0].token);assert.equal(answered.body.isCorrect,true);assert.ok(answered.body.points>0);
 const resumed=(await api('/api/guest',{nickname:'Bạn 0',resumeToken:guests[0].token})).body;assert.equal(resumed.id,guests[0].id);
 const ended=await api('/api/live/'+room.code+'/mc',{action:'finish'},host.token);assert.equal(ended.body.room.phase,'result');assert.equal((await api('/api/export/'+room.code,null,host.token)).status,200);assert.equal((await api('/api/export/'+room.code,null,guests[0].token)).status,403);
 const changed=await api('/api/host/password',{currentPassword:'test-host-password',newPassword:'changed-password'},host.token);assert.equal(changed.status,200);assert.ok(changed.body.token);assert.equal((await api('/api/rooms',null,host.token)).status,400);assert.equal((await api('/api/host',{nickname:'MC',password:'test-host-password'})).status,401);const newer=(await api('/api/host',{nickname:'MC',password:'changed-password'})).body;assert.ok(newer.token);assert.equal((await api('/api/rooms',null,newer.token)).status,200);
 for(const mode of ['duel','trio','squad']){const managed=(await api('/api/rooms',{mode},newer.token)).body;assert.equal(managed.managed,true);const code=managed.code;const g=(await api('/api/guest',{nickname:'Managed '+mode})).body;await api('/api/live/'+code+'/join',{team:0},g.token);await api('/api/live/'+code+'/mc',{action:'approve',id:g.id},newer.token);await api('/api/live/'+code+'/mc',{action:'bots'},newer.token);const select=await api('/api/live/'+code+'/mc',{action:'start'},newer.token);assert.equal(select.body.room.players.length,({duel:2,trio:6,squad:10})[mode]);assert.equal(select.body.room.phase,'select');await api('/api/live/'+code+'/selectHero',{hero:'luna'},g.token);const ready=await api('/api/live/'+code+'/poll',{},g.token);assert.equal(ready.body.room.phase,'ready');assert.equal(ready.body.match,null);assert.equal((await api('/api/live/'+code+'/mc',{action:'launch'},newer.token)).body.room.phase,'battle');}
 // Real people (not bots) must enter each versus format immediately when both teams
 // fill up. Players in these formats join their assigned teams automatically.
 for(const mode of ['duel','trio','squad']){
  const created=(await api('/api/rooms',{mode},newer.token)).body;
  assert.equal(created.mode,mode);
  const code=created.code,size=({duel:1,trio:3,squad:5})[mode],route='/api/live/'+code;
  const joined=[];
  for(let team=0;team<2;team++)for(let slot=0;slot<size;slot++){
   const guest=(await api('/api/guest',{nickname:`Người thật ${mode} ${team}-${slot}`})).body;
   const response=await api(route+'/join',{team},guest.token);
   assert.equal(response.status,200,JSON.stringify(response.body));
   const player=response.body.room.players.find(p=>p.id===guest.id);
   assert.equal(player.approved,true,'Versus players are admitted on joining');
   assert.equal(player.team,team);
   joined.push({guest,team,slot});
   assert.equal(response.body.room.phase,joined.length===size*2?'select':'lobby');
  }
  const duplicate=await api(route+'/join',{team:joined[0].team},joined[0].guest.token);
  assert.equal(duplicate.status,200,'Reconnecting players can rejoin during selection');
  assert.equal(duplicate.body.room.players.length,size*2,'Rejoining does not duplicate a player');
  assert.equal((await api(route+'/mc',{action:'launch'},joined[0].guest.token)).status,400);
  for(const {guest,slot} of joined){const choice=await api(route+'/selectHero',{hero:heroIds[slot]},guest.token);assert.equal(choice.status,200,JSON.stringify(choice.body));}
  const ready=await api(route+'/poll',{},newer.token);
  assert.equal(ready.body.room.phase,'ready',mode+' is ready after all real players choose');
  const launched=await api(route+'/mc',{action:'launch'},newer.token);
  assert.equal(launched.status,200,JSON.stringify(launched.body));
  assert.equal(launched.body.room.phase,'battle',mode+' launches when both teams are full');
  assert.equal(launched.body.match.players.length,size*2);
 }
});
