import * as T from '/vendor/three.module.js';
import { buildSpell, SPELL_BOOK, SPELL_DURATION, PREVIEW_REACH, ULTIMATE_OFFSET } from './spell-sequences.js';
export const SPELL_STYLES={sol:{color:'#ffbb43',light:'#fff2ab',shape:'sun'},luna:{color:'#a766eb',light:'#e4bdff',shape:'moon'},ivy:{color:'#40b978',light:'#d6ffb8',shape:'leaf'},kai:{color:'#308fe5',light:'#b0eeff',shape:'arrow'},ember:{color:'#ff5c33',light:'#ffd258',shape:'fire'},nova:{color:'#b76eef',light:'#ffe2fc',shape:'star'},sage:{color:'#60aa47',light:'#d7f18f',shape:'leaf'},raven:{color:'#8a4bc1',light:'#e4a3f4',shape:'arrow'},atlas:{color:'#7299da',light:'#ffe4ab',shape:'stone'},faye:{color:'#e86db4',light:'#ffd0f0',shape:'star'},milo:{color:'#55bb99',light:'#ffe5a0',shape:'note'},zephyr:{color:'#44c7ce',light:'#d1ffff',shape:'wind'}};
export function createSpellFX(scene,{sequencesOnly=false}={}){
 const root=new T.Group();root.name='spell-effects';scene.add(root);const dummy=new T.Object3D(),color=new T.Color();
 const particles=new T.InstancedMesh(new T.OctahedronGeometry(1,0),new T.MeshBasicMaterial({transparent:true,opacity:.85,depthWrite:false,toneMapped:false}),320);particles.instanceMatrix.setUsage(T.DynamicDrawUsage);particles.frustumCulled=false;particles.count=0;root.add(particles);
 const motes=Array.from({length:320},()=>({life:0}));let moteIndex=0,seed=12345;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const material=()=>new T.MeshBasicMaterial({transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 const ringGeo=new T.TorusGeometry(1,.025,5,40),arcGeo=new T.TorusGeometry(1,.07,5,28,Math.PI*1.35),orbGeo=new T.IcosahedronGeometry(.17,1),shieldGeo=new T.SphereGeometry(1,12,8);
 const glyphs={};const starShape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.18:.42;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();glyphs.star=new T.ShapeGeometry(starShape);glyphs.sun=glyphs.star;glyphs.moon=new T.TorusGeometry(.3,.07,6,24,Math.PI*1.5);glyphs.wind=new T.TorusGeometry(.3,.025,6,24,Math.PI*1.7);const leaf=new T.Shape();leaf.moveTo(0,-.35);leaf.quadraticCurveTo(-.4,.08,0,.4);leaf.quadraticCurveTo(.4,.08,0,-.35);glyphs.leaf=new T.ShapeGeometry(leaf);const note=new T.Shape();note.absellipse(-.1,-.15,.16,.1,0,Math.PI*2,false,0);note.moveTo(.02,-.15);note.lineTo(.02,.4);note.lineTo(.3,.29);note.lineTo(.3,.18);note.lineTo(.09,.28);note.lineTo(.09,-.15);glyphs.note=new T.ShapeGeometry(note);
 const slots=Array.from({length:36},()=>{const group=new T.Group();root.add(group);const ring=new T.Mesh(ringGeo,material()),halo=new T.Mesh(new T.TorusGeometry(1,.017,5,48),material()),arc=new T.Mesh(arcGeo,material()),orb=new T.Mesh(orbGeo,material());const glyph=new T.Mesh(glyphs.star,material());group.add(ring,halo,arc,orb,glyph);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(12),3));const line=new T.Line(geo,new T.LineBasicMaterial({transparent:true,depthWrite:false,toneMapped:false}));group.add(line);group.visible=false;return{group,ring,halo,arc,orb,glyph,line,e:null,hit:false};});
 const sequences=[];
 const spareSpells=new Map();
 const poolLimit=12;
 function recycle({spell,key}){
  spell.root.removeFromParent();
  if(spareSpells.has(key))spell.destroy();
  else spareSpells.set(key,spell);
  if(spareSpells.size>poolLimit){
   const oldest=spareSpells.keys().next().value;
   spareSpells.get(oldest).destroy();spareSpells.delete(oldest);
  }
 }
 const shields=new Map();
 let cursor=0,lastSequence=0,lastMatchTime=-1,lastTime=0;
 let visualTime=0,receivedAt=0;
 function advanceVisualTime(match, now, frameDelta){
  if(lastMatchTime<0||match.time<lastMatchTime){
   clear();visualTime=match.time;receivedAt=now;
  }else if(match.time!==lastMatchTime){
   receivedAt=now;
  }
  lastMatchTime=match.time;
  if(match.paused||match.done)return 0;
  // A live snapshot usually arrives every 120 ms. Advance on every frame,
  // with a short ceiling when the network stops delivering snapshots.
  const limit=match.time+.24;
  const target=match.time+Math.min(.24,Math.max(0,now-receivedAt));
  const correction=(target-visualTime)*(1-Math.exp(-7*frameDelta));
  const rateAdvance=Math.max(frameDelta*.40,frameDelta+correction);
  const next=Math.max(visualTime,Math.min(limit,visualTime+rateAdvance));
  const step=next-visualTime;visualTime=next;
  return step;
 }
 function particle(x,y,z,vx,vy,vz,c,size=.09,life=.6,stretch=1){const p=motes[moteIndex++%motes.length];Object.assign(p,{x,y,z,vx,vy,vz,c,size,life,max:life,stretch});}
 function burst(e,x,y,z,n=14){const s=SPELL_STYLES[e.hero]||SPELL_STYLES.luna;for(let j=0;j<n;j++){const a=rand()*Math.PI*2,v=.8+rand()*2;particle(x,y,z,Math.cos(a)*v,.5+rand()*2.4,Math.sin(a)*v,j%3?s.color:s.light,.04+rand()*.09,.35+rand()*.35,s.shape==='fire'?2.6:1);}}
 function start(e){e={...e,visualAt:visualTime-Math.min(.075,Math.max(0,lastMatchTime-e.at))};const s=slots[cursor++%slots.length],style=SPELL_STYLES[e.hero]||SPELL_STYLES.luna;s.e=e;s.hit=false;s.glyph.geometry=glyphs[style.shape]||glyphs.star;s.group.visible=true;s.group.position.set(0,0,0);for(const obj of[s.ring,s.halo,s.arc,s.orb,s.glyph,s.line]){obj.visible=false;obj.material.color.set(style.color);}if(e.type==='heal')for(let i=0;i<16;i++){const a=rand()*Math.PI*2;particle(e.x+Math.cos(a)*.6,.4,e.z+Math.sin(a)*.6,0,.8+rand(),0,'#66e8ad',.07,.9,1.5);}if(e.type==='guard'||e.type==='level')burst(e,e.x,1.3,e.z,22);if(e.kind===3&&e.type!=='heal'&&e.type!=='level')burst(e,e.x,1.8,e.z,34);}
 function clear(){
  for(const s of slots){s.e=null;s.group.visible=false;}
  for(const p of motes)p.life=0;
  while(sequences.length)sequences.pop().spell.destroy();
  for(const spell of spareSpells.values())spell.destroy();
  spareSpells.clear();
  lastSequence=0;lastMatchTime=-1;
 }
 function startSequence(e,target) {
  const dx=(target?.tx??e.x)-e.x,dz=(target?.tz??e.z)-e.z;
  const reach=Math.hypot(dx,dz);
  // Quantize only the visual distance. The server still computes the actual hit.
  const distance=reach>.15?Math.round(reach*4)/4:PREVIEW_REACH;
  const key=e.hero+':'+e.kind+':'+distance;
  const spell=spareSpells.get(key)||buildSpell(e.hero,e.kind,distance);
  spareSpells.delete(key);
  const yaw=reach>.15?Math.atan2(-dz,dx):(e.facing??Math.PI/2)-Math.PI/2;
  const offset=e.kind===3?ULTIMATE_OFFSET:0;
  spell.root.position.set(e.x+Math.cos(yaw)*offset,0,e.z-Math.sin(yaw)*offset);
  spell.root.rotation.y=yaw;
  spell.update(0,SPELL_DURATION);
  root.add(spell.root);
  if(sequences.length>=24)recycle(sequences.shift());
  const missed=Math.min(.075,Math.max(0,lastMatchTime-e.at));
  sequences.push({spell,key,source:e.source,at:visualTime-missed,x:e.x,z:e.z,yaw,offset});
 }
 function update(m,t,eyes){
  const frameDelta=lastTime?Math.min(.05,Math.max(0,t-lastTime)):0;
  lastTime=t;
  if(!m)return;
  const dt=advanceVisualTime(m,t,frameDelta);
  const events=m.fx||[];
  for(const e of events){
   if(e.id<=lastSequence)continue;
   lastSequence=e.id;
   if(m.time-e.at>=1.6)continue;
   if(!SPELL_BOOK[e.hero]||e.kind<1||e.kind>3||e.type==='heal'||e.type==='level'){
    if(!sequencesOnly)start(e);
    continue;
   }
   if(e.type==='cast'){
    const target=events.find(other=>other.source===e.source&&other.at===e.at&&other.kind===e.kind&&['bolt','slash'].includes(other.type));
    startSequence(e,target);
   }else if(['aura','guard','dash'].includes(e.type)){
    startSequence(e,e.type==='dash'?e:null);
   }else if(['bolt','slash'].includes(e.type)&&!events.some(other=>other.source===e.source&&other.at===e.at&&other.kind===e.kind&&other.type==='cast')){
    startSequence(e,e);
   }
  }
  for(let i=sequences.length-1;i>=0;i--){
   const {spell,at,source,x,z,yaw,offset}=sequences[i],age=visualTime-at;
   if(age>=SPELL_DURATION){recycle(sequences[i]);sequences.splice(i,1);}
   else {
    const ownView=eyes?.player?.id===source;
    // Keep the opening rune ahead of the first-person camera, even after
    // a dash has already landed. Traveling parts stay on their world path.
    const viewYaw=ownView?eyes.yaw:0;
    const originX=x+Math.cos(yaw)*offset,originZ=z-Math.sin(yaw)*offset;
    const ahead=ownView&&!spell.travels?2.8:0;
    const rootX=ahead?eyes.player.x-Math.sin(viewYaw)*ahead:originX;
    const rootZ=ahead?eyes.player.z-Math.cos(viewYaw)*ahead:originZ;
    spell.root.position.set(rootX,0,rootZ);
    if(ownView){
     const dx=eyes.player.x-Math.sin(viewYaw)*2.6-rootX;
     const dz=eyes.player.z-Math.cos(viewYaw)*2.6-rootZ;
     spell.charge.position.set(dx*Math.cos(yaw)-dz*Math.sin(yaw),.42,dx*Math.sin(yaw)+dz*Math.cos(yaw));
    }else spell.charge.position.set(0,0,0);
    spell.update(age,SPELL_DURATION);
   }
  }
  if(sequencesOnly)return;
 for(const slot of slots){const e=slot.e;if(!e)continue;const age=visualTime-e.visualAt,style=SPELL_STYLES[e.hero]||SPELL_STYLES.luna,life=e.type==='aura'||e.type==='level'?1.25:e.type==='cast'?.7:e.type==='heal'?1:.65;
 if(age>life){slot.group.visible=false;slot.e=null;continue;}const {ring,halo,arc,orb,glyph,line}=slot,fade=Math.max(0,1-age/life),strength=e.kind===3?1.6:e.kind===1?1.15:.75;
 for(const obj of[ring,halo,arc,orb,glyph,line]){obj.visible=false;obj.material.opacity=fade*.8;}
 if(e.kind===3){halo.visible=true;halo.position.set(e.tx??e.x,.16,e.tz??e.z);halo.rotation.set(Math.PI/2,0,age*5);halo.scale.setScalar((1.2+age*4.2)*strength);halo.material.color.set(style.light);halo.material.opacity=fade*.55;}
 if(e.type==='bolt'||e.type==='dash'){
 const progress=Math.min(1,age/(e.type==='dash'?.18:.24)),x=e.x+(e.tx-e.x)*progress,z=e.z+(e.tz-e.z)*progress,y=e.type==='dash'?.6:1.45+Math.sin(progress*Math.PI)*(style.shape==='star'?.8:.12);orb.visible=progress<1;orb.position.set(x,y,z);orb.scale.setScalar(strength*(style.shape==='fire'?1.3:1));orb.rotation.set(age*8,age*6,age*7);orb.material.color.set(style.light);
 const tail=Math.max(0,progress-.22),p=line.geometry.attributes.position;line.visible=true;for(let j=0;j<4;j++){const q=tail+(progress-tail)*j/3;p.setXYZ(j,e.x+(e.tx-e.x)*q,y,e.z+(e.tz-e.z)*q);}p.needsUpdate=true;line.geometry.computeBoundingSphere();
 if(!slot.hit&&progress>=1){slot.hit=true;if(!e.miss)burst(e,e.tx,1.3,e.tz,e.kind===3?28:12);}if(progress<1&&rand()<.65)particle(x,y,z,(rand()-.5)*.4,style.shape==='fire'?1:.2,(rand()-.5)*.4,style.color,.06,.3,style.shape==='arrow'?2:1);
 if(style.shape==='moon'||style.shape==='wind'){arc.visible=progress<1;arc.position.set(x,y,z);arc.rotation.set(Math.PI/2,0,age*9);arc.scale.setScalar(strength*.4);}
 }else if(e.type==='slash'){
 const dx=e.tx-e.x,dz=e.tz-e.z;arc.visible=true;arc.position.set(e.x+dx*.4,1.1,e.z+dz*.4);arc.rotation.set(Math.PI/2,.3,Math.atan2(dx,dz)+age*7);arc.scale.set(1.1*strength,1.1*strength,1);if(!slot.hit&&age>.12){slot.hit=true;if(!e.miss)burst(e,e.tx,1.1,e.tz,e.kind===3?30:14);}if(style.shape==='stone'||e.kind===3){ring.visible=true;ring.rotation.x=Math.PI/2;ring.position.set(e.tx,.12,e.tz);ring.scale.setScalar(.3+age*5);}
 }else{
 const target=['heal','guard','level'].includes(e.type)?m.players.find(p=>p.id===e.source):null,x=target?.x??e.x,z=target?.z??e.z;
 ring.visible=true;ring.rotation.x=Math.PI/2;ring.position.set(x,.12,z);const radius=e.type==='aura'?(e.kind===3?5.5:3.2):e.type==='cast'?(e.kind===3?2.6:1.3):1.05;ring.scale.setScalar(radius*(.5+.5*Math.min(1,age*4)));ring.material.color.set(e.type==='heal'?'#4edb95':style.color);
 arc.visible=true;arc.position.set(x,.18+Math.sin(age*4)*.12,z);arc.rotation.set(Math.PI/2,0,-age*3);arc.scale.setScalar(radius*.72);arc.material.color.set(style.light);
 if(e.type==='cast'||e.type==='aura'){glyph.visible=true;glyph.position.set(x,2.5+age*.5,z);glyph.rotation.set(0,t*.9,Math.sin(age*3)*.15);glyph.scale.setScalar(e.kind===3?1.6:1);glyph.material.color.set(style.light);}
 if(e.type==='cast'&&e.kind===3&&!slot.hit){slot.hit=true;for(let j=0;j<36;j++){const a=j*Math.PI*2/36;particle(x+Math.cos(a)*1.4,.15,z+Math.sin(a)*1.4,Math.cos(a)*.7,2+rand()*2,Math.sin(a)*.7,style.light,.06,.9,2);}}
 if(e.type==='level'){orb.visible=true;orb.position.set(x,3.7+age,z);orb.material.color.set('#ffe284');orb.scale.setScalar(1.8*fade);orb.rotation.y=age*4;}
 if(e.type==='heal'&&rand()<1-Math.exp(-24*dt))particle(x+(rand()-.5),1,z+(rand()-.5),0,1,0,'#9bffcc',.07,.7,1.5);
 }
 }
 // Shields follow their owner and disappear when absorbed or the hero dies.
 const visible=new Set();for(const p of m.players){if(p.dead||p.shield<=0)continue;visible.add(p.id);let shield=shields.get(p.id);if(!shield){shield=new T.Mesh(shieldGeo,material());shield.material.wireframe=true;root.add(shield);shields.set(p.id,shield);}shield.visible=true;shield.position.set(p.x,1.45,p.z);shield.scale.set(1,1.55,1);shield.rotation.y=visualTime*.25;shield.material.color.set(SPELL_STYLES[p.hero]?.color||'#a4d6ff');shield.material.opacity=.18+Math.sin(visualTime*3)*.035;}for(const[id,s]of shields)if(!visible.has(id))s.visible=false;
 let count=0;for(const p of motes){if(p.life<=0)continue;p.life-=dt;if(p.life<=0)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vy-=.8*dt;dummy.position.set(p.x,p.y,p.z);const size=p.size*Math.min(1,p.life/.2);dummy.scale.set(size,size*p.stretch,size);dummy.rotation.set(t*2+p.x,t+p.z,0);dummy.updateMatrix();particles.setMatrixAt(count,dummy.matrix);color.set(p.c);particles.setColorAt(count,color);count++;}particles.count=count;particles.instanceMatrix.needsUpdate=true;if(particles.instanceColor)particles.instanceColor.needsUpdate=true;
 }
 return{root,update,clear,castPose(id){
  const cast=sequences.findLast(s=>s.source===id);
  if(!cast)return 0;
  const progress=Math.max(0,Math.min(1,((visualTime-cast.at)/SPELL_DURATION-.13)/.44));
  return .89*Math.sin(Math.PI*progress)**2;
 },stats(){return{particles:motes.filter(p=>p.life>0).length,effects:slots.filter(s=>s.e).length+sequences.length};},destroy(){clear();root.traverse(o=>{if(o.isMesh||o.isLine){o.geometry.dispose();o.material.dispose();}});root.removeFromParent();}};
}
