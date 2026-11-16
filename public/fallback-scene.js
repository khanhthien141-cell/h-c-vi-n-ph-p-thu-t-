import {ACADEMY_MAP} from '/shared/arena-layout.js';
import {heroes} from '/shared/heroes.js';
import {Group} from '/vendor/three.module.js';
import {createSpellFX} from './spell-fx.js';
import {paintSpellCanvas} from './spell-canvas.js';

// Accessible 2D renderer for browsers that disable WebGL (notably embedded
// webviews, low-memory phones and cloud browsers). Gameplay remains intact.
export function makeFallbackScene(original){
 const names=['sol','luna','ivy','kai','ember','nova','sage','raven','atlas','faye','milo','zephyr'];
 const portraits=new Map(),arenaImage=new Image();arenaImage.decoding='async';arenaImage.src='/assets/mila/academy-map.webp';
 for(const id of names){const image=new Image();image.decoding='async';image.src='/assets/mila/portraits/'+id+'.webp';portraits.set(id,image);}
 const canvas=original.cloneNode();original.replaceWith(canvas);
 const ctx=canvas.getContext('2d',{alpha:false});
 if(!ctx)throw Error('Trình duyệt không hỗ trợ Canvas. Hãy thử Chrome hoặc Safari phiên bản mới.');
 const note=document.createElement('div');note.id='rendererNotice';
 note.textContent='Chế độ tương thích · Vẫn di chuyển và chiến đấu bình thường';
 canvas.parentElement.querySelector('#rendererNotice')?.remove();canvas.after(note);
 let mode='battle';
 const spellFX=createSpellFX(new Group(),{sequencesOnly:true});
 const maxHealth=new Map(heroes.map(h=>[h.id,h.hp]));
 function ring(x,y,r,color,line=3){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=line;ctx.stroke();}
 function render(m,id,t){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  const ratio=Math.min(1.5,window.devicePixelRatio||1);
  const px=Math.round(w*ratio),py=Math.round(h*ratio);
  if(canvas.width!==px||canvas.height!==py){canvas.width=px;canvas.height=py;}
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.clearRect(0,0,w,h);
  if(arenaImage.complete&&arenaImage.naturalWidth){
   // Art-directed arena under all figures; draw a tinted edge vignette.
   ctx.drawImage(arenaImage,0,0,w,h);
   const veil=ctx.createLinearGradient(0,0,w,h);veil.addColorStop(0,'rgba(35,25,53,.19)');
   veil.addColorStop(.5,'rgba(248,232,245,.06)');veil.addColorStop(1,'rgba(35,25,53,.23)');
   ctx.fillStyle=veil;ctx.fillRect(0,0,w,h);
  }else{ctx.fillStyle='#cfbfdd';ctx.fillRect(0,0,w,h);}
  const scale=Math.min(w/ACADEMY_MAP.width,h/ACADEMY_MAP.depth);
  const X=x=>w*(.5+x/ACADEMY_MAP.width),Y=z=>h*(.5+z/ACADEMY_MAP.depth);
  const viewTeam=m?.players.find(p=>p.id===id)?.team??m?.pair?.[0];
  for(const p of m?.players||[]){
   if(p.dead)continue;
   const x=X(p.x),y=Y(p.z),r=Math.max(11,Math.min(22,scale*.87));
   const color=p.team===viewTeam?'#91f6a8':'#ff767e',glow=p.id===id;
   ctx.save();ctx.shadowColor=color;ctx.shadowBlur=glow?22:12;
   ctx.fillStyle='rgba(28,18,43,.75)';ctx.beginPath();ctx.arc(x,y,r+4,0,Math.PI*2);ctx.fill();
   ctx.shadowBlur=0;ring(x,y,r+2,glow?'#fff1a2':color,glow?4:2.5);
   ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
   const img=portraits.get(p.hero);
   if(img?.complete&&img.naturalWidth){ctx.fillStyle='#f4deee';ctx.fillRect(x-r,y-r,2*r,2*r);ctx.drawImage(img,0,0,img.naturalWidth,img.naturalHeight,x-r*1.2,y-r*1.12,r*2.4,r*2.4);}
   else{ctx.fillStyle=color;ctx.fillRect(x-r,y-r,r*2,r*2);}
   ctx.restore();
   ctx.fillStyle='rgba(32,22,45,.82)';ctx.fillRect(x-r-8,y-r-22,r*2+16,15);
   ctx.font='600 10px system-ui';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(String(p.name||'Nhân vật'),x,y-r-11,r*2+12);
   const hp=Math.max(0,Math.min(1,(p.hp||0)/(maxHealth.get(p.hero)||120)));
   ctx.fillStyle='#44384a';ctx.fillRect(x-r,y-r-6,r*2,4);
   ctx.fillStyle=color;ctx.fillRect(x-r,y-r-6,r*2*hp,4);
  }
  spellFX.update(m,t);
  paintSpellCanvas(ctx,spellFX.root,X,Y,scale);
  for(const shot of m?.shots||[]){
   if(shot.kind>0)continue;
   const x=X(shot.x),y=Y(shot.z);
   ctx.save();ctx.shadowColor='#ffe7a1';ctx.shadowBlur=15;ctx.fillStyle='#fff4c8';
   ctx.beginPath();ctx.arc(x,y,Math.max(3,scale*.25),0,Math.PI*2);ctx.fill();ctx.restore();
  }
  for(const fx of m?.fx||[]){
   if(fx.kind>0&&fx.type!=='heal'&&fx.type!=='level')continue;
   const age=Math.max(0,(m.time||0)-fx.at),life=fx.kind===3?1.5:1;
   if(age>life)continue;const x=X(fx.tx??fx.x??0),y=Y(fx.tz??fx.z??0);
   ctx.save();ctx.globalAlpha=Math.max(0,1-age/life);
   ctx.shadowColor=fx.kind===3?'#ffdc7a':'#c78ef8';ctx.shadowBlur=15;
   ring(x,y,(.5+age*3.1)*scale,fx.kind===3?'#ffde91':'#e8b6ff',3+age);
   for(let i=0;i<(fx.kind===3?10:5);i++){const a=i*Math.PI*2/(fx.kind===3?10:5)+age*2;
    ctx.fillStyle=i%2?'#e9d5ff':'#ffe9ad';ctx.beginPath();ctx.arc(x+Math.cos(a)*(8+age*18),y+Math.sin(a)*(8+age*18),2.5,0,Math.PI*2);ctx.fill();}
   ctx.restore();
  }
  if(mode==='spectate'){ctx.font='600 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff8dd';ctx.shadowColor='#3d1d56';ctx.shadowBlur=4;ctx.fillText('✦ TOÀN CẢNH ĐẤU TRƯỜNG ✦',w/2,h-16);ctx.shadowBlur=0;}
 }
 return{canvas,setMode(v){mode=v;},destroy(){spellFX.destroy();note.remove();},render};
}
