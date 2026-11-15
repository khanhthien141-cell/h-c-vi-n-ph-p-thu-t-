import test from 'node:test';
import assert from 'node:assert/strict';
import {newRoom,joinRoom,commandRoom,playerAction,tickRoom} from '../shared/room-core.js';
import {lockHero,selectionReady} from '../shared/selection.js';
const host={id:'mc',name:'MC'},heroIds=['sol','luna','ivy','kai','ember'];
function room(){const r=newRoom('123456',host.id,'Lớp Bông');for(const team of [0,3])for(let i=0;i<5;i++){const u={id:`p${team}-${i}`,name:`Bạn ${team}-${i}`};joinRoom(r,u,{team,hero:'sol'});commandRoom(r,host,{action:'approve',id:u.id});}return r;}
test('20 second selection auto-fills unique heroes, waits for host launch and never launches for a pupil',()=>{
 const r=room();assert.ok(r.players.every(p=>p.hero===null&&!p.heroReady));assert.throws(()=>lockHero(r,'p0-0','sol'),/giáo viên/);
 const before=Date.now();commandRoom(r,host,{action:'start'});assert.equal(r.phase,'select');assert.equal(r.match,null);assert.ok(r.selectionEnds>=before+20000&&r.selectionEnds<=Date.now()+20000);
 const deadline=r.selectionEnds;lockHero(r,'p0-0','nova',deadline-1000);assert.equal(tickRoom(r,[],deadline-1),false);assert.equal(r.phase,'select');
 assert.equal(tickRoom(r,[],deadline),true);assert.equal(r.phase,'ready');assert.equal(r.match,null);assert.ok(selectionReady(r));assert.equal(r.players[0].hero,'nova');
 assert.throws(()=>commandRoom(r,{id:'p0-0'},{action:'launch'}),/máy chủ/);tickRoom(r,[],deadline+99999);assert.equal(r.phase,'ready');commandRoom(r,host,{action:'launch'});assert.equal(r.phase,'battle');assert.equal(r.match.players.length,10);
});
test('all confirmed players enter waiting room early but still need host launch',()=>{
 const r=room();commandRoom(r,host,{action:'start'});for(const team of [0,3])for(let i=0;i<5;i++)lockHero(r,`p${team}-${i}`,heroIds[i]);assert.ok(selectionReady(r));tickRoom(r);assert.equal(r.phase,'ready');assert.equal(r.match,null);commandRoom(r,host,{action:'launch'});assert.equal(r.phase,'battle');
});
test('selection reserves hero atomically, forbids unapproved and other teams, preserves a confirmed pick on reconnect',()=>{
 const r=room();joinRoom(r,{id:'later',name:'Vòng sau'},{team:1});commandRoom(r,host,{action:'start'});
 assert.throws(()=>lockHero(r,'later','sol'),/chưa/);assert.throws(()=>lockHero(r,'mc','sol'),/chưa/);assert.throws(()=>lockHero(r,'p0-0','unknown'),/hợp lệ/);
 lockHero(r,'p0-0','sol');assert.throws(()=>lockHero(r,'p0-1','sol'),/Đồng đội/);assert.equal(r.players.find(p=>p.id==='p0-1').heroReady,false);lockHero(r,'p3-0','sol');assert.throws(()=>lockHero(r,'p0-0','luna'),/đã chốt/);
 joinRoom(r,{id:'p0-0',name:'Bạn 0-0'},{team:2,hero:'faye'});assert.equal(r.players.find(p=>p.id==='p0-0').team,0);assert.equal(r.players.find(p=>p.id==='p0-0').hero,'sol');
 r.players.find(p=>p.id==='p0-2').approved=false;assert.throws(()=>lockHero(r,'p0-2','ivy'),/chưa/);
});
test('player selection action returns the updated room and resets picks for each new round',()=>{
 const r=room();commandRoom(r,host,{action:'start'});const out=playerAction(r,{id:'p0-0'},'selectHero',{hero:'nova'});assert.equal(out.room.players[0].heroReady,true);assert.equal(out.room.players[0].hero,'nova');
 r.phase='result';r.round=1;r.results=[{winner:0},{winner:3}];commandRoom(r,host,{action:'start'});assert.equal(r.round,2);assert.ok(r.players.every(p=>p.hero===null&&!p.heroReady));assert.ok(r.selectionEnds>Date.now());
});
