import {GLTFExporter} from '/vendor/gltf-exporter.js';
import * as T from '/vendor/three.module.js';
import {createHeroModel,designs} from './hero-models.js';
import {buildSpell, PHASES, SPELL_BOOK, SPELL_DURATION, PREVIEW_REACH, ULTIMATE_OFFSET} from '/spell-sequences.js';
const canvas=document.querySelector('#view'),status=document.querySelector('#status');
let activeId='luna';
const download=document.createElement('button');download.textContent='↓ Tải nhân vật GLB để chỉnh sửa';status.after(download);download.onclick=async()=>{download.disabled=true;try{const editable=createHeroModel(activeId,{merge:false});editable.traverse(o=>{o.userData={};});const data=await new GLTFExporter().parseAsync(editable,{binary:true,onlyVisible:true});const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download='MILA-'+activeId+'.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);status.textContent='Đã xuất GLB. Mở bằng Blender: File → Import → glTF 2.0. Các bộ phận riêng, chưa có bộ xương skinning.';}catch(e){status.textContent='Không xuất được: '+e.message;}finally{download.disabled=false;}};
const labels={sol:'Tai mèo · tóc vàng · kiếm và khiên mặt trời',luna:'Tóc tím dài · mũ phù thủy · trượng trăng',ivy:'Tóc xanh · hoa trắng · trượng cây',kai:'Mũ xanh · cung tinh thể · ống tên',ember:'Sừng vàng · tóc đỏ · găng lửa',nova:'Tóc tím nhạt · mũ sao · trượng tinh tú',sage:'Mũ trùm xanh · gạc cây · trượng lá',raven:'Tóc tím · mũ lông vũ · cung hoàng hôn',atlas:'Tóc bạc · cổ lông · búa và khiên',faye:'Tóc hồng · kính tròn · sách phép',milo:'Mũ lông vũ · áo xanh · đàn',zephyr:'Tóc xanh ngọc · lông vũ · cung gió'};
try{
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.1,50);scene.add(new T.HemisphereLight('#fff3df','#8b7da1',2.4));for(const [color,intensity,pos]of[['#ffeed9',3,[-3,6,5]],['#d2c7ff',2,[4,4,-4]]]){const l=new T.DirectionalLight(color,intensity);l.position.set(...pos);scene.add(l);}
const floor=new T.Mesh(new T.CylinderGeometry(1.7,1.8,.14,64),new T.MeshStandardMaterial({color:'#51435f',roughness:.9}));floor.position.y=-.06;scene.add(floor);const rim=new T.Mesh(new T.TorusGeometry(1.6,.012,6,64),new T.MeshBasicMaterial({color:'#e6c482'}));rim.rotation.x=Math.PI/2;rim.position.y=.025;scene.add(rim);
const picker=document.createElement('section');
picker.className='spell-preview';
picker.setAttribute('aria-label','Xem trước hiệu ứng chiêu thức');
picker.innerHTML='<h3>Xem trước chiêu thức</h3><div class="spell-buttons"></div><div class="spell-playback" hidden><button type="button" id="spellPause">Tạm dừng</button><button type="button" id="spellReplay">Phát lại</button><button type="button" id="spellClose">Đóng</button><input id="spellSeek" type="range" min="0" max="100" value="0" aria-label="Tiến trình hiệu ứng"><span id="spellPhase" aria-live="polite"></span></div>';
canvas.closest('.stage').after(picker);
const playback=picker.querySelector('.spell-playback'),seek=picker.querySelector('#spellSeek');
const pause=picker.querySelector('#spellPause'),phaseLabel=picker.querySelector('#spellPhase');
const spellRig=new T.Group();scene.add(spellRig);
const duration=SPELL_DURATION;
let effect=null,elapsed=0,paused=false,lastPhase=-1;
function closeSpell(){
 if(effect)effect.destroy();
 effect=null;playback.hidden=true;
 for(const button of picker.querySelectorAll('[data-spell]'))button.setAttribute('aria-pressed','false');
}
function playSpell(slot){
 closeSpell();
 effect=buildSpell(activeId,slot,PREVIEW_REACH);
 effect.root.position.x=slot===3?ULTIMATE_OFFSET:0;
 spellRig.add(effect.root);playback.hidden=false;
 elapsed=0;paused=false;lastPhase=-1;pause.textContent='Tạm dừng';
 picker.querySelector('[data-spell="'+slot+'"]').setAttribute('aria-pressed','true');
}
function fillSpells(){
 picker.querySelector('.spell-buttons').replaceChildren(...SPELL_BOOK[activeId][2].map(([name],index)=>{
  const button=document.createElement('button');button.type='button';
  button.dataset.spell=index+1;button.textContent=(index===2?'Chiêu cuối':('Chiêu '+(index+1)))+' · '+name;
  button.setAttribute('aria-pressed','false');button.onclick=()=>playSpell(index+1);return button;
 }));
}
pause.onclick=()=>{
 if(elapsed>=duration){elapsed=0;paused=true;}
 paused=!paused;pause.textContent=paused?'Tiếp tục':'Tạm dừng';
};
picker.querySelector('#spellReplay').onclick=()=>{elapsed=0;paused=false;pause.textContent='Tạm dừng';};
picker.querySelector('#spellClose').onclick=closeSpell;
seek.oninput=()=>{
 elapsed=Number(seek.value)/100*duration;paused=true;pause.textContent='Tiếp tục';
};
let model,yaw=0,pitch=.13,distance=7.3,turn=false,walk=false,drag=null,lastW=0,lastH=0;
function select(id){closeSpell();activeId=id;fillSpells();if(model){scene.remove(model);const materials=new Set();model.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});for(const material of materials)material.dispose();}model=createHeroModel(id);scene.add(model);document.querySelector('#reference').src='/assets/mila/portraits/'+id+'.webp';document.querySelector('#name').textContent=id[0].toUpperCase()+id.slice(1);document.querySelector('#desc').textContent=labels[id];document.querySelectorAll('[data-hero]').forEach(b=>b.classList.toggle('active',b.dataset.hero===id));status.textContent='Mô hình 3D đang được dùng trong bản chính thức và chế độ luyện tập.';}
const grid=document.querySelector('#heroes');for(const id of Object.keys(designs)){const b=document.createElement('button');b.dataset.hero=id;b.innerHTML=`<img src="/assets/mila/portraits/${id}.webp" alt="">${id[0].toUpperCase()+id.slice(1)}`;b.onclick=()=>select(id);grid.append(b);}select('luna');
// One-finger turn plus two-finger pinch zoom for landscape phones.
const pointers=new Map();
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture?.(e.pointerId);drag=pointers.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;turn=false;});
canvas.addEventListener('pointermove',e=>{
 const previous=pointers.get(e.pointerId);if(!previous)return;
 const other=[...pointers].find(([id])=>id!==e.pointerId)?.[1];
 if(other){const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);distance=Math.max(4.1,Math.min(10,distance+(before-after)*.02));drag=null;}
 else if(drag?.id===e.pointerId){yaw+=(e.clientX-drag.x)*.009;pitch=Math.max(-.2,Math.min(.7,pitch+(e.clientY-drag.y)*.005));drag={id:e.pointerId,x:e.clientX,y:e.clientY};}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
});
for(const ev of['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{pointers.delete(e.pointerId);drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(4.1,Math.min(10,distance+e.deltaY*.005));},{passive:false});
document.querySelector('#zoomIn')?.addEventListener('click',()=>distance=Math.max(4.1,distance-.7));
document.querySelector('#zoomOut')?.addEventListener('click',()=>distance=Math.min(10,distance+.7));
document.querySelector('#front').onclick=()=>{yaw=0;turn=false;};document.querySelector('#back').onclick=()=>{yaw=Math.PI;turn=false;};document.querySelector('#turn').onclick=e=>{turn=!turn;e.target.classList.toggle('active',turn);};document.querySelector('#walk').onclick=e=>{walk=!walk;e.target.classList.toggle('active',walk);};let last=0,spellFraming=0;
const center=new T.Vector3(),up=new T.Vector3(0,1,0);
function frame(ms){
 requestAnimationFrame(frame);
 if(document.hidden)return;
 const dt=Math.min(.05,Math.max(0,(ms-last)/1000));last=ms;
 const w=canvas.clientWidth,h=canvas.clientHeight;
 if(w&&h&&(w!==lastW||h!==lastH)){
  lastW=w;lastH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 if(turn)yaw+=dt*.4;
 const t=effect?Math.min(1,elapsed/duration):0;
 const pose=effect?Math.sin(Math.PI*Math.min(1,Math.max(0,(t-.13)/.44)))**2:0;
 spellFraming+=(Number(Boolean(effect))-spellFraming)*(1-Math.exp(-9*dt));
 model.rotation.y=yaw+spellFraming*Math.PI/2;
 model.userData.animate(effect?elapsed:ms/1000,walk&&!effect?6:0,.89*pose);
 spellRig.rotation.y=yaw;
 if(effect){
  if(!paused)elapsed=Math.min(duration,elapsed+dt);
  const phase=effect.update(elapsed,duration);
  seek.value=elapsed/duration*100;
  const display=elapsed>=duration?3:phase;
  if(lastPhase!==display){lastPhase=display;phaseLabel.textContent=PHASES[display]||'Đã phát xong';}
  if(elapsed>=duration){paused=true;pause.textContent='Phát lại';}
 }
 const wide=Math.max(distance+2.6,w<560?11:9.5);
 const framing=distance+(wide-distance)*spellFraming;
 center.set(1.30*spellFraming,1.78,0).applyAxisAngle(up,yaw);
 camera.position.set(center.x,center.y+Math.sin(pitch)*framing,center.z+Math.cos(pitch)*framing);
 camera.lookAt(center);
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
}catch(e){
 status.textContent='Trình duyệt này chưa hỗ trợ WebGL 3D. Vẫn có thể xem đủ 12 ảnh gốc hoặc tải mô hình GLB.';
 const stage=canvas.closest('.stage');
 document.querySelector('.spell-preview')?.remove();
 if(stage){canvas.style.display='none';const box=document.createElement('div');box.className='fallback-portrait';box.innerHTML='<img src="/assets/mila/portraits/luna.webp" alt="Ảnh gốc của nhân vật"><p>Máy này đang dùng chế độ xem ảnh. Hãy mở bằng trình duyệt hỗ trợ WebGL để xoay 3D.</p>';stage.append(box);}
 for(const button of document.querySelectorAll('.controls button')){button.disabled=true;button.title='Cần trình duyệt hỗ trợ WebGL để dùng điều khiển 3D';}
 const fallback=stage?.querySelector('.fallback-portrait img'),grid=document.querySelector('#heroes');
 for(const id of Object.keys(designs)){const b=document.createElement('button');b.dataset.hero=id;b.innerHTML='<img src="/assets/mila/portraits/'+id+'.webp" alt="">'+id;b.onclick=()=>{activeId=id;document.querySelector('#reference').src='/assets/mila/portraits/'+id+'.webp';document.querySelector('#name').textContent=id[0].toUpperCase()+id.slice(1);document.querySelector('#desc').textContent=labels[id];document.querySelectorAll('[data-hero]').forEach(el=>el.classList.toggle('active',el.dataset.hero===id));if(fallback)fallback.src='/assets/mila/portraits/'+id+'.webp';};grid.append(b);}
 document.querySelector('#reference').src='/assets/mila/portraits/luna.webp';document.querySelector('#name').textContent='Luna';
}
