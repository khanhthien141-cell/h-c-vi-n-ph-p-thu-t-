import {ARENA} from './shared/arena-layout.js';
import {makeScene} from './scene.js';
import {makeFallbackScene} from '/fallback-scene.js';
import {createCameraState,cameraMovement,rotateCamera,zoomCamera,resetCamera} from './shared/camera.js';
import {heroes} from './shared/heroes.js';
export function createArena(canvas){
 const state=createCameraState(true);state.pitch=0;state.distance=9;
 let scene;try{scene=makeScene(canvas,state);}catch(e){scene=makeFallbackScene(canvas,state);canvas=scene.canvas;}canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();scene.destroy?.();scene=makeFallbackScene(canvas,state);canvas=scene.canvas;});const positions=new Map();let externalClock=false;let match=null,id=null,previous=new Map(),received=0,last=0,readInput=()=>({}),mode='follow',side=null,selectedPlayer=null,drag=null;
 function reset(){resetCamera(state,side||0);state.pitch=0;state.distance=9;}
 const api={view(){return{viewYaw:state.yaw,viewPitch:state.pitch};},externalClock(){externalClock=true;},render:frame,input(fn){readInput=fn;},movement(forward,right){return cameraMovement(state,forward,right);},camera(v,t){mode=v;state.firstPerson=!['third','third-player','overview','team'].includes(v);if(v==='player'||v==='third-player'){selectedPlayer=t;state.distance=9;}if(v==='team'){side=t;reset();}if(v==='follow'&&!state.userMoved)reset();},zoom(d){state.firstPerson=false;state.pitch=.3;mode='third';zoomCamera(state,-d*600);},reset,snapshot(m,who){
 if(!match||m.time<match.time||m.players.map(p=>p.id).join()!==match.players.map(p=>p.id).join()){positions.clear();side=m.pair.indexOf(m.players.find(p=>p.id===who)?.team);reset();}
 previous=new Map((match?.players||[]).map(p=>[p.id,{x:p.x,z:p.z,time:match.time,dead:p.dead}]));match=m;id=who;received=performance.now();
 }};
 canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;rotateCamera(state,dx,dy);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();zoomCamera(state,e.deltaY);},{passive:false});
 function frame(ms){if(!externalClock)requestAnimationFrame(frame);const dt=Math.min(.05,(ms-last)/1000||1/60);last=ms;if(!match||document.hidden||!canvas.clientWidth||!canvas.clientHeight)return;
 const age=Math.min(.25,Math.max(0,(ms-received)/1000)),fresh=ms-received<800,ps=[];
 for(const p of match.players){let v=positions.get(p.id),prev=previous.get(p.id);if(!v||p.dead||v.dead!==p.dead||Math.hypot(p.x-v.x,p.z-v.z)>5){v={x:p.x,z:p.z,dead:p.dead};positions.set(p.id,v);}
 else{let tx=p.x,tz=p.z;const local=p.id===id&&id!=='practice';if(!match.paused&&fresh&&!match.done){if(local){const input=readInput(),x=Number(input.x)||0,z=Number(input.z)||0,l=Math.max(1,Math.hypot(x,z)),speed=heroes.find(h=>h.id===p.hero).speed;v.x+=x/l*speed*dt;v.z+=z/l*speed*dt;tx+=x/l*speed*age;tz+=z/l*speed*age;}else if(prev&&!prev.dead&&id!=='practice'){const span=match.time-prev.time;if(span>0){tx+=(p.x-prev.x)/span*age;tz+=(p.z-prev.z)/span*age;}}}
 const alpha=id==='practice'?1:1-Math.exp(-(local?5:14)*dt);v.x+=(tx-v.x)*alpha;v.z+=(tz-v.z)*alpha;v.x=Math.max(-ARENA.halfWidth,Math.min(ARENA.halfWidth,v.x));v.z=Math.max(-ARENA.halfDepth,Math.min(ARENA.halfDepth,v.z));}
 ps.push({...p,x:v.x,z:v.z,...(p.id===id?{facing:state.yaw+Math.PI}:{})});}
 const focus=['player','third-player'].includes(mode)?selectedPlayer:mode==='team'?ps.find(p=>p.team===side)?.id:id||ps.find(p=>p.team===side)?.id;
 if(['player','third-player'].includes(mode)){const watched=ps.find(p=>p.id===focus);if(watched){state.yaw=Number.isFinite(watched.viewYaw)?watched.viewYaw:(watched.facing||0)-Math.PI;state.pitch=watched.viewPitch||0;}}
 scene.setMode(mode==='overview'||!focus?'spectate':'battle');scene.render({...match,players:ps},focus,ms/1000);
 }
 requestAnimationFrame(ms=>{if(!externalClock)frame(ms);});return api;
}
