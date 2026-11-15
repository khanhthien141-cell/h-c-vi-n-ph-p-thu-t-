import test from 'node:test';
import assert from 'node:assert/strict';
import {newRoom,commandRoom,joinRoom} from '../shared/room-core.js';
import {roomInfo} from '../shared/roster.js';
import {joystickVector} from '../shared/controls.js';
test('teacher roster assigns team authoritatively and prevents claiming an occupied name',()=>{
 const host={id:'teacher',name:'MC'},r=newRoom('123456',host.id,'Lớp học');
 commandRoom(r,host,{action:'roster',rows:[{id:'slot-a',name:'An',team:2}]});
 joinRoom(r,{id:'free-student',name:'Tự chọn'},{team:1,hero:'luna'});assert.equal(r.players[0].team,1);r.players=[];
 joinRoom(r,{id:'student',name:'Bạn nhỏ'},{team:0,hero:'sol',rosterId:'slot-a'});assert.equal(r.players[0].team,2);assert.equal(r.players[0].rosterName,'An');
 assert.throws(()=>joinRoom(r,{id:'other',name:'Bạn khác'},{hero:'luna',rosterId:'slot-a'}),/đã có người/);
 assert.throws(()=>commandRoom(r,{id:'other'},{action:'roster',rows:[]}),/máy chủ/);
 assert.throws(()=>commandRoom(r,host,{action:'roster',rows:[]}),/giữ đúng/);
 assert.equal(roomInfo(r).roster[0].claimedBy,'student');
 commandRoom(r,host,{action:'roster',rows:[{id:'slot-a',name:'An mới',team:2}]});assert.equal(r.players[0].rosterName,'An mới');
});
test('roster rejects duplicate names, overfull teams and changes after start',()=>{
 const host={id:'mc'},r=newRoom('123456',host.id,'Lớp');assert.throws(()=>commandRoom(r,host,{action:'roster',rows:[{name:'An',team:0},{name:'an',team:0}]}),/không trùng/);assert.throws(()=>commandRoom(r,host,{action:'roster',rows:Array.from({length:6},(_,i)=>({name:'Bạn '+i,team:0}))}),/tối đa 5/);r.phase='battle';assert.throws(()=>commandRoom(r,host,{action:'roster',rows:[]}),/trước giải/);
});
test('analog joystick dead zone, direction and magnitude stay bounded',()=>{
 assert.equal(joystickVector(1,1,50).forward,0);let v=joystickVector(0,-25,50);assert.equal(v.forward,.5);assert.equal(v.right,0);v=joystickVector(100,100,50);assert.ok(Math.abs(Math.hypot(v.forward,v.right)-1)<1e-10);assert.ok(Math.abs(Math.hypot(v.x,v.y)-50)<1e-10);assert.equal(joystickVector(0,0).x,0);
});
