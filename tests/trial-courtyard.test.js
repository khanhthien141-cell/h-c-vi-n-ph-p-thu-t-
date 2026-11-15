import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,step,spawn,attack} from '../public/trial/shared/engine.js';
import {ARENA} from '../public/trial/shared/arena-layout.js';
const players=[{id:'p',hero:'luna',team:0,slot:2},{id:'b',hero:'sol',team:1,slot:2}];
test('trial courtyard movement uses expanded bounds and remains frame-rate independent',()=>{
 const run=hz=>{const m=createMatch(players,[0,1]);const p=m.players[0];p.x=0;p.z=0;p.input={x:1,z:1};for(let i=0;i<hz*2;i++)step(m,1/hz);return p;};
 const a=run(60),b=run(120);assert.ok(Math.abs(a.x-b.x)<.04);assert.ok(a.x>8&&a.z>8);
 const m=createMatch(players,[0,1]);const p=m.players[0];p.input={x:1,z:1};for(let i=0;i<2400;i++)step(m,1/120);assert.equal(p.x,ARENA.halfWidth);assert.equal(p.z,ARENA.halfDepth);
 p.input={};for(let i=0;i<60;i++)step(m,1/120);assert.ok(Math.abs(p.vx)<.001);spawn(p,0);assert.equal(p.vx,0);assert.equal(p.x,-ARENA.spawnX);
});
test('trial bases and respawn match the visible crystal sanctuaries',()=>{
 const m=createMatch(players,[0,1]);const p=m.players[0];p.x=ARENA.baseX-5;p.z=0;m.players[1].dead=10;attack(m,p,0);assert.ok(m.bases[1]<2000);assert.equal(ARENA.halfDepth,20);
});
