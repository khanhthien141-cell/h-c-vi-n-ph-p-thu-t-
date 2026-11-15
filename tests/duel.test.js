import test from 'node:test';
import assert from 'node:assert/strict';
import {newRoom,joinRoom,tickRoom,playerAction,finishRoom,commandRoom} from '../shared/room-core.js';
function room(){const r=newRoom('123456','a','Duel');r.mode='duel';r.pair=[0,1];r.teams=['A','B'];return r;}
test('duel: creator plays, second guest starts selection, third rejected, both lock and fight',()=>{
 const r=room(),a={id:'a',name:'A'},b={id:'b',name:'B'};
 joinRoom(r,a,{});assert.equal(r.phase,'lobby');assert.equal(r.players[0].approved,true);
 joinRoom(r,b,{});assert.equal(r.phase,'select');assert.deepEqual(r.players.map(p=>p.team),[0,1]);
 assert.throws(()=>joinRoom(r,{id:'c',name:'C'},{}));joinRoom(r,a,{});assert.equal(r.players.length,2);
 playerAction(r,a,'selectHero',{hero:'luna'});playerAction(r,b,'selectHero',{hero:'sol'});
 tickRoom(r,[],Date.now());assert.equal(r.phase,'battle');assert.equal(r.match.players.length,2);assert.equal(r.match.duration,180);
 assert.throws(()=>commandRoom(r,a,{action:'bots'}));finishRoom(r);assert.equal(r.phase,'finished');
});
test('duel selection auto-picks after 20 seconds without MC',()=>{const r=room();joinRoom(r,{id:'a',name:'A'},{});joinRoom(r,{id:'b',name:'B'},{});tickRoom(r,[],r.selectionEnds+1);assert.equal(r.phase,'battle');assert.equal(r.match.players.length,2);assert.ok(r.players.every(p=>p.heroReady));});
test('5 vs 5 balances ten people, waits for all ten, then launches ten unique-per-team heroes',()=>{const r=room();r.mode='squad';for(let i=0;i<9;i++){joinRoom(r,{id:String(i),name:'P'+i},{});assert.equal(r.phase,'lobby');}joinRoom(r,{id:'9',name:'P9'},{});assert.equal(r.phase,'select');assert.deepEqual([0,1].map(t=>r.players.filter(p=>p.team===t).length),[5,5]);assert.throws(()=>joinRoom(r,{id:'extra',name:'Extra'},{}));tickRoom(r,[],r.selectionEnds+1);assert.equal(r.phase,'battle');assert.equal(r.match.players.length,10);for(const t of [0,1])assert.equal(new Set(r.players.filter(p=>p.team===t).map(p=>p.hero)).size,5);});
