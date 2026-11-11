import {heroes} from './shared/heroes.js';
export function createArena(canvas){
 const ctx=canvas.getContext('2d'),map=new Image(),sprites=new Map(),positions=new Map();map.src='/assets/mila/arena.webp';
 for(const h of heroes){const im=new Image();im.src='/assets/mila/portraits/'+h.id+'.webp';sprites.set(h.id,im);}
 let readInput=()=>({}),receivedAt=0,previous=new Map();
 let match=null,localId=null,camera='follow',team=null,zoom=1,pan={x:0,y:0},drag=null,last=0,view={x:0,y:0,k:1};
 const wp=(x,z)=>({x:(.5+x*.0148)*1672,y:(.5-x*.010+z*.016)*941});
 const controls={camera(v,t){camera=v;team=t;pan={x:0,y:0};},zoom(d){zoom=Math.max(.75,Math.min(2.2,zoom+d));},reset(){zoom=1;pan={x:0,y:0};},input(fn){readInput=fn;},snapshot(m,id){previous=new Map((match?.players||[]).map(p=>[p.id,{x:p.x,z:p.z,time:match.time,dead:p.dead}]));if(!match||m.time<match.time)positions.clear();match=m;localId=id;receivedAt=performance.now();}};
 canvas.addEventListener('wheel',e=>{e.preventDefault();controls.zoom(-e.deltaY*.001);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(camera==='follow')return;canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const rotated=document.body.classList.contains('virtual-landscape'),dx=e.clientX-drag.x,dy=e.clientY-drag.y;pan.x-=(rotated?dy:dx)/view.k;pan.y-=(rotated?-dx:dy)/view.k;drag={...drag,x:e.clientX,y:e.clientY};});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>drag=null);
 function text(s,x,y,size=13,color='#fff'){ctx.font=`bold ${size}px system-ui`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#423450';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);}
 function draw(ms){const t=ms/1000,dt=Math.min(.1,t-last||.016);last=t;const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;
 if(!w||!h){requestAnimationFrame(draw);return;}if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 // Render every frame, independently of the network snapshot rate.
 for(const p of match?.players||[]){let v=positions.get(p.id),prev=previous.get(p.id);const age=Math.min(.3,Math.max(0,(ms-receivedAt)/1000));
 if(!v||p.dead||v.dead!==p.dead||Math.hypot(p.x-v.x,p.z-v.z)>6){positions.set(p.id,{x:p.x,z:p.z,dead:p.dead,moved:false});continue;}
 let tx=p.x,tz=p.z;
 if(!match.paused){if(p.id===localId){const i=readInput(),x=Number(i.x)||0,z=Number(i.z)||0,len=Math.max(1,Math.hypot(x,z)),speed=heroes.find(h=>h.id===p.hero).speed;v.x+=x/len*speed*dt;v.z+=z/len*speed*dt;tx+=x/len*speed*age;tz+=z/len*speed*age;v.moved=!!(x||z);}
 else if(prev&&!prev.dead){const span=match.time-prev.time;if(span>0){const vx=(p.x-prev.x)/span,vz=(p.z-prev.z)/span;tx+=vx*age;tz+=vz*age;}}}
 const factor=1-Math.exp(-(p.id===localId?5:12)*dt);const ox=v.x,oz=v.z;v.x+=(tx-v.x)*factor;v.z+=(tz-v.z)*factor;v.x=Math.max(-27,Math.min(27,v.x));v.z=Math.max(-10,Math.min(10,v.z));if(p.id!==localId)v.moved=Math.hypot(v.x-ox,v.z-oz)>.002;
 }
 const own=match?.players.find(p=>p.id===localId),group=match?.players.filter(p=>p.team===team&&!p.dead)||[];
 let center={x:836,y:470};if(camera==='follow'&&own)center=wp((positions.get(own.id)||own).x,(positions.get(own.id)||own).z);else if(camera==='team'&&group.length)center=wp(group.reduce((s,p)=>s+p.x,0)/group.length,group.reduce((s,p)=>s+p.z,0)/group.length);
 const k=Math.max(w/1672,h/941)*(camera==='overview'?1:1.65)*zoom;center.x=Math.max(w/k/2,Math.min(1672-w/k/2,center.x+pan.x));center.y=Math.max(h/k/2,Math.min(941-h/k/2,center.y+pan.y));view={x:center.x,y:center.y,k};
 const point=(x,z)=>{const p=wp(x,z);return{x:w/2+(p.x-center.x)*k,y:h/2+(p.y-center.y)*k};};
 ctx.fillStyle='#b4c5ad';ctx.fillRect(0,0,w,h);if(map.complete&&map.naturalWidth)ctx.drawImage(map,w/2-center.x*k,h/2-center.y*k,1672*k,941*k);
 for(let i=0;i<18;i++){const x=(i*163+t*13)%w,y=(i*79+t*22)%h;ctx.fillStyle='#ffe0ee99';ctx.beginPath();ctx.ellipse(x,y,3*k,1.5*k,t+i,0,Math.PI*2);ctx.fill();}
 for(const p of [...(match?.players||[])].sort((a,b)=>wp(a.x,a.z).y-wp(b.x,b.z).y)){
  const old=positions.get(p.id)||p,moved=old.moved,q=point(old.x,old.z),sz=94*k,bob=moved?Math.sin(t*13+p.slot)*3:Math.sin(t*2+p.slot)*1.1;
  if(p.dead){text('✧ '+Math.ceil(p.dead)+'s',q.x,q.y,15);continue;}
  ctx.fillStyle='#43334c40';ctx.beginPath();ctx.ellipse(q.x,q.y+2,sz*.27,sz*.08,0,0,Math.PI*2);ctx.fill();
  if(p.id===localId){ctx.strokeStyle='#b9ffc8';ctx.lineWidth=2.5;ctx.shadowColor='#a0ffb5';ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(q.x,q.y+2,sz*.34,sz*.12,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
  const im=sprites.get(p.hero);if(im?.complete&&im.naturalWidth){ctx.save();ctx.translate(q.x,q.y+bob);ctx.rotate(moved?Math.sin(t*13)*.025:0);ctx.drawImage(im,-sz*.57,-sz,sz*1.14,sz);ctx.restore();}
  const ally=p.team===(own?.team??match.pair[0]),bw=sz*.7,bh=Math.max(5,5*k),yy=q.y-sz-7;ctx.fillStyle='#4c3859';ctx.beginPath();ctx.roundRect(q.x-bw/2-2,yy-2,bw+4,bh+4,5);ctx.fill();const grad=ctx.createLinearGradient(0,yy,0,yy+bh);grad.addColorStop(0,ally?'#d0ffac':'#ffb5bf');grad.addColorStop(1,ally?'#63bd6c':'#d94c74');ctx.fillStyle=grad;ctx.fillRect(q.x-bw/2,yy,bw*Math.max(0,p.hp/heroes.find(h=>h.id===p.hero).hp),bh);text(p.name.slice(0,18),q.x,yy-7,Math.max(10,11*k));text(String(p.level),q.x-bw/2-10,yy+bh,Math.max(10,10*k),'#ffe1a5');
  if(p.shield>0){ctx.strokeStyle='#c5f1ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y-sz*.45,sz*.43,sz*.57,0,0,7);ctx.stroke();}
 }
 for(const s of match?.shots||[]){const a=point(s.x,s.z),b=point(s.tx,s.tz),progress=Math.max(0,Math.min(1,1-s.life/.3)),color=s.kind===3?'#fff1a0':(heroes.find(h=>h.id===s.hero)?.color||'#d5a5ff');ctx.save();ctx.shadowColor=color;ctx.shadowBlur=16;ctx.strokeStyle=color;ctx.lineWidth=(s.kind===3?8:4)*k;ctx.beginPath();ctx.moveTo(a.x,a.y-35*k);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-70*k,b.x,b.y-35*k);ctx.stroke();ctx.fillStyle='#fff9e7';ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*progress,a.y+(b.y-a.y)*progress-35*k,(s.kind===3?14:7)*k,0,7);ctx.fill();ctx.restore();}
 for(const e of match?.events||[])if(e.type==='heal'){const p=point(e.x,e.z);ctx.strokeStyle='#a0ffbf';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,50*k,18*k,0,0,7);ctx.stroke();}
 if(match?.paused){ctx.fillStyle='#58436666';ctx.fillRect(0,0,w,h);text('TRẬN ĐẤU TẠM DỪNG',w/2,h/2,26);}
 requestAnimationFrame(draw);
 }requestAnimationFrame(draw);return controls;
}
