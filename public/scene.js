import * as T from '/vendor/three.module.js';
import {createSpellFX} from './spell-fx.js';
import {createCourtyard} from './courtyard.js';
import {createHeroModel} from './hero-models.js';
import {customization} from './shared/customization.js';
import {heroes} from './shared/heroes.js';
import {cameraPose} from './shared/camera.js';
export function makeScene(canvas,cameraState){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{throw Error('Thiết bị chưa bật WebGL. Hãy bật tăng tốc đồ họa của trình duyệt.');}
 renderer.setPixelRatio(Math.min(devicePixelRatio,navigator.maxTouchPoints?1.25:1.6));renderer.shadowMap.enabled=!navigator.maxTouchPoints;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor('#c0d6e8',1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new T.Scene();scene.fog=new T.FogExp2('#c0d6e8',.0045);const camera=new T.PerspectiveCamera(48,1,.1,220);
 scene.add(new T.HemisphereLight('#c9e8ff','#aca0bb',2.0));const sun=new T.DirectionalLight('#fff0dc',2.6);sun.position.set(-20,35,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:30,bottom:-30});scene.add(sun);
 const ambient=new T.PointLight('#a68cff',70,50);ambient.position.set(0,8,-4);scene.add(ambient);
 const courtyard=createCourtyard(scene);
 let lastAnimationTime=0,frameAverage=1/60,qualityAt=0;const maxDpr=Math.min(devicePixelRatio,navigator.maxTouchPoints?1.25:1.6);let renderDpr=maxDpr;
 const actors=new Map(),spellFX=createSpellFX(scene);let mode='lobby',focus=null,theme=-1;
 function character(p){
 const h=heroes.find(h=>h.id===p.hero)||heroes[0],g=createHeroModel(h.id);
 const ring=new T.Mesh(new T.TorusGeometry(.82,.035,8,36),new T.MeshBasicMaterial({color:p.team%2?'#dbb7ff':'#b0e9ce'}));ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);
 const bar=new T.Mesh(new T.PlaneGeometry(1.3,.07),new T.MeshBasicMaterial({color:'#91d9b0',side:T.DoubleSide}));bar.position.y=3.95;g.add(bar);
 Object.assign(g.userData,{h,bar,lastX:p.x,lastZ:p.z,speed:0});scene.add(g);actors.set(p.id,g);return g;}
 let previousW=0,previousH=0;function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(w!==previousW||h!==previousH)){previousW=w;previousH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}new ResizeObserver(resize).observe(canvas);
 const v=new T.Vector3(),look=new T.Vector3(),smoothLook=new T.Vector3();let cameraReady=false;
 function render(m,id,t){const animationDelta=Math.min(.1,Math.max(0,t-lastAnimationTime));lastAnimationTime=t;if(animationDelta>0&&animationDelta<.09){frameAverage+=(animationDelta-frameAverage)*.025;if(t-qualityAt>3){const next=frameAverage>.028?Math.max(.8,renderDpr-.15):frameAverage<.018?Math.min(maxDpr,renderDpr+.1):renderDpr;if(next!==renderDpr){renderDpr=next;renderer.setPixelRatio(renderDpr);}qualityAt=t;}}resize();courtyard.update(t);const desired=new Set(m?.players?.map(p=>p.id)||[]);for(const [key,a]of actors)if(!desired.has(key)){scene.remove(a);actors.delete(key);}if(m){if(theme!==m.round&&m.round!==undefined){theme=m.round;scene.fog.color.set(['#c0d6e8','#d9c8e3','#c3deda'][theme%3]);renderer.setClearColor(scene.fog.color);}
 for(const p of m.players){let a=actors.get(p.id);if(a&&a.userData.h.id!==p.hero){scene.remove(a);actors.delete(p.id);a=null;}a=a||character(p);a.visible=!p.dead&&!(cameraState.firstPerson&&mode==='battle'&&p.id===id);
 const speed=Math.min(10,Math.hypot(p.x-a.userData.lastX,p.z-a.userData.lastZ)/Math.max(.001,animationDelta));a.userData.speed+=(speed-a.userData.speed)*(1-Math.exp(-12*animationDelta));a.userData.lastX=p.x;a.userData.lastZ=p.z;
 a.position.set(p.x,0,p.z);const targetAngle=Number.isFinite(p.facing)?p.facing:m.pair?.indexOf(p.team)===1?-Math.PI/2:Math.PI/2;const angleDelta=Math.atan2(Math.sin(targetAngle-a.rotation.y),Math.cos(targetAngle-a.rotation.y));a.rotation.y+=angleDelta*(1-Math.exp(-20*animationDelta));
 a.userData.bar.scale.x=Math.max(.01,p.hp/a.userData.h.hp);a.userData.bar.quaternion.copy(camera.quaternion).premultiply(a.quaternion.clone().invert());
 const attacking=(m.shots||[]).some(s=>Math.hypot(s.x-p.x,s.z-p.z)<.7);a.userData.animate(t,a.userData.speed,attacking?Math.max(0,Math.sin(t*18)):0);}

 spellFX.update(m,t);

 focus=m.players.find(p=>p.id===id)||m.players[0];}
 if(mode==='battle'&&focus){const pose=cameraPose(cameraState,focus);v.set(...pose.position);look.set(...pose.target);}else if(mode==='spectate'){v.set(0,57,46);look.set(0,0,0);}else{v.set(37,36,42);look.set(0,0,0);}const alpha=cameraState.firstPerson&&mode==='battle'?1:1-Math.exp(-20*animationDelta);if(!cameraReady||camera.position.distanceTo(v)>20){camera.position.copy(v);smoothLook.copy(look);cameraReady=true;}else{camera.position.lerp(v,alpha);smoothLook.lerp(look,alpha);}camera.lookAt(smoothLook);
 renderer.render(scene,camera);}
 return{render,setMode(v){mode=v;},destroy(){spellFX.destroy();renderer.dispose();}};
}
