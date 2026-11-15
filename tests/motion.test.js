import test from 'node:test';
import assert from 'node:assert/strict';
import {motionBlend,predictedLocal,remoteLead} from '../shared/motion.js';

test('local input prediction moves between sparse network packets',()=>{
 const server={x:0,z:0},control={x:1,z:0},speed=6;
 let visible={...server};
 for(let i=0;i<12;i++){
  const dt=1/60,age=(i+1)*dt;
  visible.x+=speed*dt;
  visible=motionBlend(visible,predictedLocal(server,control,speed,age),dt,1.8);
 }
 assert.ok(visible.x>1.1&&visible.x<1.3,'The joystick advances without waiting for a packet');
 assert.deepEqual(predictedLocal(server,{x:3,z:4},5,.2),{x:.48,z:.64});
});

test('remote players never extrapolate more than 75ms or past their speed cap',()=>{
 const prev={x:0,z:0,time:1,dead:0},current={x:1.2,z:0};
 const short=remoteLead(current,prev,.075,6,1.2);
 const late=remoteLead(current,prev,1.5,6,1.2);
 assert.equal(short.x,late.x,'A stale packet cannot make opponents fly across the map');
 assert.ok(short.x>1.2&&short.x<=1.65);
 const spike=remoteLead({x:30,z:0},prev,.075,6,1.2);
 assert.ok(spike.x<=30.52,'Bad velocity samples are capped');
 assert.deepEqual(remoteLead(current,null,.5,6,1.2),current);
});

test('corrections are frame-rate independent and snap only on teleports',()=>{
 const target={x:3,z:1},frames=[1/30,1/60];
 const states=frames.map(dt=>{let p={x:0,z:0};for(let t=0;t<1-.00001;t+=dt)p=motionBlend(p,target,dt,8);return p;});
 assert.ok(Math.abs(states[0].x-states[1].x)<.005);
 assert.deepEqual(motionBlend({x:0,z:0},{x:10,z:0},1/60,10),{x:10,z:0});
 assert.ok(Number.isFinite(motionBlend({x:0,z:0},{x:NaN,z:Infinity},1/60).x));
});
