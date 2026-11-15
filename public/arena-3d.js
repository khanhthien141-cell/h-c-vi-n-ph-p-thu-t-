import {ARENA} from './shared/arena-layout.js';
import {makeScene} from './scene.js';
import {makeFallbackScene} from '/fallback-scene.js';
import {createCameraState,cameraMovement,rotateCamera,zoomCamera,resetCamera} from './shared/camera.js';
import {motionBlend,predictedLocal,remoteLead} from './shared/motion.js';
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
 function frame(ms){if(!externalClock)requestAnimationFrame(frame);const dt=Math.min(.08,Math.max(0,(ms-last)/1000||1/60));last=ms;if(!match||document.hidden||!canvas.clientWidth||!canvas.clientHeight)return;
 const age=Math.max(0,(ms-received)/1000),fresh=age<.9,ps=[];
 for(const p of match.players){let v=positions.get(p.id),prev=previous.get(p.id);if(!v||p.dead||v.dead!==p.dead||Math.hypot(p.x-v.x,p.z-v.z)>5){v={x:p.x,z:p.z,dead:p.dead};positions.set(p.id,v);}
 else{
  const local=p.id===id&&id!=='practice',speed=(heroes.find(h=>h.id===p.hero)||heroes[0]).speed;
  let target={x:p.x,z:p.z},rate=14;
  if(!match.paused&&!match.done&&fresh){
   if(local){
    const control=readInput(),x=Number(control.x)||0,z=Number(control.z)||0,len=Math.max(1,Math.hypot(x,z));
    // Move immediately on this phone; use new server positions only to
    // reconcile small errors. This decouples joystick feel from network RTT.
    v.x+=x/len*speed*dt;v.z+=z/len*speed*dt;
    target=predictedLocal(p,control,speed,age);
    const error=Math.hypot(target.x-v.x,target.z-v.z);
    rate=error>.75?10:error>.3?5:1.8;
   }else if(id!=='practice')target=remoteLead(p,prev,age,speed,match.time);
  }
  const smooth=id==='practice'?target:motionBlend(v,target,dt,rate,4.5);
  v.x=Math.max(-ARENA.halfWidth,Math.min(ARENA.halfWidth,smooth.x));
  v.z=Math.max(-ARENA.halfDepth,Math.min(ARENA.halfDepth,smooth.z));
 }
 ps.push({...p,x:v.x,z:v.z,...(p.id===id?{facing:state.yaw+Math.PI}:{})});}
 const focus=['player','third-player'].includes(mode)?selectedPlayer:mode==='team'?ps.find(p=>p.team===side)?.id:id||ps.find(p=>p.team===side)?.id;
 if(['player','third-player'].includes(mode)){const watched=ps.find(p=>p.id===focus);if(watched){state.yaw=Number.isFinite(watched.viewYaw)?watched.viewYaw:(watched.facing||0)-Math.PI;state.pitch=watched.viewPitch||0;}}
 scene.setMode(mode==='overview'||!focus?'spectate':'battle');scene.render({...match,players:ps},focus,ms/1000);
 }
 requestAnimationFrame(ms=>{if(!externalClock)frame(ms);});return api;
}
