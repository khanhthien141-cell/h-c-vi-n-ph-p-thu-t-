import * as T from '/vendor/three.module.js';
import {createSpellFX} from './spell-fx.js';
import {createCourtyard} from './courtyard.js';
import {createHeroModel} from './hero-models.js';
import {customization} from './shared/customization.js';
import {heroes} from './shared/heroes.js';
import {cameraPose} from './shared/camera.js';
function mobileGraphicsSettings(device, pixelRatio=1) {
 const touch=device.maxTouchPoints>0;
 const modest=touch&&(device.deviceMemory<=4||device.hardwareConcurrency<=4);
 return {
  touch,
  maxDpr:Math.min(pixelRatio||1,touch?(modest ? .9 : 1.1):1.6),
  minDpr:Math.min(pixelRatio||1,modest ? .60 : touch ? .68 : .85),
  antialias:!touch
 };
}
function createContactShadows(scene){
 const size=32,pixels=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const radius=Math.min(1,Math.hypot(2*(x+.5)/size-1,2*(y+.5)/size-1));
  const i=(y*size+x)*4;
  pixels.set([46,30,55,Math.round(142*(1-radius*radius)**2)],i);
 }
 const texture=new T.DataTexture(pixels,size,size);
 texture.colorSpace=T.SRGBColorSpace;
 texture.magFilter=texture.minFilter=T.LinearFilter;
 texture.needsUpdate=true;
 const geometry=new T.PlaneGeometry(2.4,1.85).rotateX(-Math.PI/2);
 const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const capacity=24,shadow=new T.InstancedMesh(geometry,material,capacity),matrix=new T.Matrix4();
 shadow.count=0;shadow.frustumCulled=false;
 shadow.instanceMatrix.setUsage(T.DynamicDrawUsage);
 scene.add(shadow);
 return{
  update(players,hiddenId){
   let count=0;
   for(const p of players){
    if(p.dead||p.id===hiddenId||count===capacity)continue;
    shadow.setMatrixAt(count++,matrix.makeTranslation(p.x,.042,p.z));
   }
   shadow.count=count;
   if(count)shadow.instanceMatrix.needsUpdate=true;
  },
  destroy(){shadow.removeFromParent();shadow.dispose();geometry.dispose();material.dispose();texture.dispose();}
 };
}
function makeNameplate(name,color){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;
 const ctx=canvas.getContext('2d');
 ctx.font='700 40px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.lineJoin='round';ctx.lineWidth=7;ctx.strokeStyle='#1c1425';ctx.fillStyle=color;
 const text=String(name||'Nhân vật');
 ctx.strokeText(text,256,40,480);ctx.fillText(text,256,40,480);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthWrite:false,toneMapped:false}));
 sprite.position.y=4.30;sprite.scale.set(3.3,.52,1);
 return sprite;
}
export function makeScene(canvas,cameraState){
 const {touch,maxDpr,minDpr,antialias}=mobileGraphicsSettings(navigator,globalThis.devicePixelRatio);
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias,alpha:true,powerPreference:'high-performance'});}catch{throw Error('Thiết bị chưa bật WebGL. Hãy bật tăng tốc đồ họa của trình duyệt.');}
 const startDpr=touch?Math.min(maxDpr,.85):maxDpr;
 renderer.setPixelRatio(startDpr);renderer.shadowMap.enabled=!touch;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor('#c0d6e8',1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new T.Scene();scene.fog=new T.FogExp2('#c0d6e8',.0045);const camera=new T.PerspectiveCamera(48,1,.1,220);
 scene.add(new T.HemisphereLight('#c9e8ff','#aca0bb',touch?1.7:2.0));const sun=new T.DirectionalLight('#fff0dc',touch?2.85:2.6);sun.position.set(-20,35,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:30,bottom:-30});scene.add(sun);
 const ambient=new T.PointLight('#a68cff',70,50);ambient.position.set(0,8,-4);scene.add(ambient);
 const courtyard=createCourtyard(scene,{mobile:touch});
 const contactShadows=touch?createContactShadows(scene):null;
 let lastAnimationTime=0,frameAverage=1/60,qualityAt=0,renderDpr=startDpr;
 const actors=new Map(),spellFX=createSpellFX(scene,{mobile:touch});let mode='lobby',focus=null,theme=-1;
 function character(p,color){
 const h=heroes.find(h=>h.id===p.hero)||heroes[0],g=createHeroModel(h.id,{mobile:touch});
 const ring=new T.Mesh(new T.TorusGeometry(.82,.035,8,36),new T.MeshBasicMaterial({color:p.team%2?'#dbb7ff':'#b0e9ce'}));ring.rotation.x=Math.PI/2;ring.position.y=.08;g.add(ring);
 const hpLabel=new T.Group();hpLabel.position.y=3.95;
 const track=new T.Mesh(new T.PlaneGeometry(1.56,.14),new T.MeshBasicMaterial({color:'#231a2b',side:T.DoubleSide}));
 const bar=new T.Mesh(new T.PlaneGeometry(1.48,.084),new T.MeshBasicMaterial({color,side:T.DoubleSide,toneMapped:false}));
 bar.position.z=.013;hpLabel.add(track,bar);
 const nameplate=makeNameplate(p.name,color);
 g.add(hpLabel,nameplate);
 Object.assign(g.userData,{h,bar,hpLabel,nameplate,labelName:p.name,labelColor:color,lastX:p.x,lastZ:p.z,speed:0});scene.add(g);actors.set(p.id,g);return g;}
 function removeActor(id){
  const actor=actors.get(id),geometries=new Set(),materials=new Set();
  actor.traverse(object=>{
   if(object.isMesh){geometries.add(object.geometry);materials.add(object.material);}
   if(object.isSprite){object.material.map.dispose();materials.add(object.material);}
  });
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  actor.removeFromParent();
  actors.delete(id);
 }
 let previousW=0,previousH=0;function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(w!==previousW||h!==previousH)){previousW=w;previousH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}new ResizeObserver(resize).observe(canvas);
 const v=new T.Vector3(),look=new T.Vector3(),smoothLook=new T.Vector3(),barRotation=new T.Quaternion(),inverseActor=new T.Quaternion();let cameraReady=false;
 function render(m,id,t){const animationDelta=Math.min(.1,Math.max(0,t-lastAnimationTime));lastAnimationTime=t;if(animationDelta>0){frameAverage+=(Math.min(.09,animationDelta)-frameAverage)*.06;if(t-qualityAt>(touch ? .85 : 1.8)){const next=frameAverage>.036?Math.max(minDpr,renderDpr-.19):frameAverage>.027?Math.max(minDpr,renderDpr-.12):frameAverage<.02?Math.min(maxDpr,renderDpr+.055):renderDpr;if(Math.abs(next-renderDpr)>.015){renderDpr=next;renderer.setPixelRatio(renderDpr);}qualityAt=t;}}resize();courtyard.update(t);const desired=new Set(m?.players?.map(p=>p.id)||[]);for(const key of actors.keys())if(!desired.has(key))removeActor(key);if(m){if(theme!==m.round&&m.round!==undefined){theme=m.round;scene.fog.color.set(['#c0d6e8','#d9c8e3','#c3deda'][theme%3]);renderer.setClearColor(scene.fog.color);}
 focus=m.players.find(p=>p.id===id)||m.players[0];
 const ownTeam=m.players.find(p=>p.id===id)?.team??m.pair?.[0];
 contactShadows?.update(m.players,cameraState.firstPerson&&mode==='battle'?id:null);
 spellFX.update(m,t,mode==='battle'&&cameraState.firstPerson?{player:focus,yaw:cameraState.yaw}:null);
 for(const p of m.players){
  let a=actors.get(p.id);
  if(a&&a.userData.h.id!==p.hero){removeActor(p.id);a=null;}
  if(p.dead||(cameraState.firstPerson&&mode==='battle'&&p.id===id)){
   if(a)a.visible=false;
   continue;
  }
  const color=p.team===ownTeam?'#91f6a8':'#ff767e';
 a=a||character(p,color);
 if(a.userData.labelName!==p.name||a.userData.labelColor!==color){
  const old=a.userData.nameplate;
  old.removeFromParent();old.material.map.dispose();old.material.dispose();
  const nameplate=makeNameplate(p.name,color);a.add(nameplate);
  Object.assign(a.userData,{nameplate,labelName:p.name,labelColor:color});
  a.userData.bar.material.color.set(color);
 }
  a.visible=true;
 const speed=Math.min(10,Math.hypot(p.x-a.userData.lastX,p.z-a.userData.lastZ)/Math.max(.001,animationDelta));a.userData.speed+=(speed-a.userData.speed)*(1-Math.exp(-12*animationDelta));a.userData.lastX=p.x;a.userData.lastZ=p.z;
 a.position.set(p.x,0,p.z);const targetAngle=Number.isFinite(p.facing)?p.facing:m.pair?.indexOf(p.team)===1?-Math.PI/2:Math.PI/2;const angleDelta=Math.atan2(Math.sin(targetAngle-a.rotation.y),Math.cos(targetAngle-a.rotation.y));a.rotation.y+=angleDelta*(1-Math.exp(-20*animationDelta));
 const hp=Math.max(0,Math.min(1,p.hp/a.userData.h.hp));
 a.userData.bar.scale.x=hp;
 a.userData.bar.position.x=.74*(hp-1);
 inverseActor.copy(a.quaternion).invert();barRotation.copy(camera.quaternion).premultiply(inverseActor);
 a.userData.hpLabel.quaternion.copy(barRotation);
 const attacking=(m.shots||[]).some(s=>s.kind===0&&Math.hypot(s.x-p.x,s.z-p.z)<.7);
 a.userData.animate(t,a.userData.speed,spellFX.castPose(p.id)||(attacking?Math.max(0,Math.sin(t*18)):0));}}
 if(mode==='battle'&&focus){const pose=cameraPose(cameraState,focus);v.set(...pose.position);look.set(...pose.target);}else if(mode==='spectate'){v.set(32,65,56);look.set(0,2,-3);}else{v.set(37,36,42);look.set(0,0,0);}const alpha=cameraState.firstPerson&&mode==='battle'?1:1-Math.exp(-20*animationDelta);if(!cameraReady||camera.position.distanceTo(v)>20){camera.position.copy(v);smoothLook.copy(look);cameraReady=true;}else{camera.position.lerp(v,alpha);smoothLook.lerp(look,alpha);}camera.lookAt(smoothLook);
 renderer.render(scene,camera);}
 return{render,setMode(v){mode=v;},destroy(){for(const id of actors.keys())removeActor(id);contactShadows?.destroy();spellFX.destroy();renderer.dispose();}};
}
