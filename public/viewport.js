// Follow the phone's REAL viewport. Never fake a 90-degree rotation: it breaks
// touch coordinates, browser chrome and the keyboard on many mobile WebViews.
// The battle prefers physical landscape; menus remain usable in portrait.
export function viewportLayout(width,height,touch=false,editing=false){
 const w=Math.max(1,Math.round(Number(width)||360)),h=Math.max(1,Math.round(Number(height)||640));
 return {rotated:false,width:w,height:h,portrait:h>w,compact:Math.min(w,h)<460,touch:!!touch,editing:!!editing};
}
export function needsLandscapePrompt(layout,inBattle,isHost,dismissed=false){
 return !!(layout.touch&&layout.portrait&&!layout.editing&&inBattle&&!isHost&&!dismissed);
}
let landscapeDismissed=false;
export function dismissLandscapePrompt(){landscapeDismissed=true;fitViewport();}
export function lockLandscape(orientation=globalThis.screen?.orientation) {
 if (typeof orientation?.lock !== 'function') return Promise.resolve(false);
 try { return Promise.resolve(orientation.lock('landscape')).then(()=>true,()=>false); }
 catch { return Promise.resolve(false); }
}

let orientationRequest;
export function enterMobileLandscape() {
 // A real tap is needed by browsers that gate fullscreen on user activation.
 const n=window.navigator;
 if(document.body.dataset.page==='mc'||!(n.maxTouchPoints>0||matchMedia('(pointer: coarse)').matches))return;
 if(orientationRequest)return orientationRequest;
 const orientation=window.screen?.orientation;
 if(!orientation?.lock)return;
 const root=document.documentElement;
 orientationRequest=(async()=>{
  if(!document.fullscreenElement&&root.requestFullscreen){
   try{await root.requestFullscreen();}catch{}
  }
  await lockLandscape(orientation);
  fitViewport();
 })().finally(()=>{orientationRequest=null;});
 return orientationRequest;
}

export function bindLandscapeNotice() {
 const notice=document.querySelector('#orientation');
 if(!notice)return;
 notice.querySelector('h2').textContent='Xoay ngang để nhìn rộng hơn';
 const skip=notice.querySelector('#ignoreOrientation');
 skip.textContent='×';
 skip.setAttribute('aria-label','Ẩn nhắc xoay màn hình');
 skip.addEventListener('click',dismissLandscapePrompt);
 if(window.screen?.orientation?.lock){
  const button=document.createElement('button');
  button.type='button';button.id='tryLandscape';button.textContent='Xoay ngang';
  button.addEventListener('click',enterMobileLandscape);
  skip.before(button);
 }
}

let scheduled=false;
export function fitViewport(){
 const app=document.querySelector('#app');
 if(!app)return;
 let shell=document.querySelector('#gameViewport');
 if(!shell){shell=document.createElement('div');shell.id='gameViewport';app.before(shell);shell.append(app);}
 const vv=window.visualViewport;
 const layout=viewportLayout(vv?.width||window.innerWidth,vv?.height||window.innerHeight,
   navigator.maxTouchPoints>0||matchMedia('(pointer: coarse)').matches||
   /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
   /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''));
 document.body.classList.remove('virtual-landscape');
 document.documentElement.classList.remove('rotated-game');
 document.body.classList.toggle('editing-game',layout.editing);
 document.body.classList.toggle('portrait-game',layout.portrait);
 document.body.classList.toggle('compact-game',layout.compact);
 if(!layout.portrait)landscapeDismissed=false;
 shell.style.width=layout.width+'px';
 shell.style.height=layout.height+'px';
 shell.style.left=Math.round(vv?.offsetLeft||0)+'px';
 shell.style.top=Math.round(vv?.offsetTop||0)+'px';
 app.style.width=layout.width+'px';app.style.height=layout.height+'px';
 app.style.transform='none';
 for(const [key,value] of Object.entries({'--game-width':layout.width+'px','--game-height':layout.height+'px'})){
   app.style.setProperty(key,value);document.body.style.setProperty(key,value);
 }
 const notice=document.querySelector('#orientation');
 if(notice)notice.hidden=!needsLandscapePrompt(layout,document.body.classList.contains('in-battle'),document.body.dataset.page==='mc',landscapeDismissed);
}
function scheduleFit(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;fitViewport();});}
for(const event of ['resize','orientationchange','focusin','pageshow'])window.addEventListener(event,scheduleFit);
document.addEventListener('fullscreenchange',scheduleFit);
window.addEventListener('focusout',()=>setTimeout(scheduleFit,140));
window.visualViewport?.addEventListener('resize',scheduleFit);
window.visualViewport?.addEventListener('scroll',scheduleFit);
screen.orientation?.addEventListener?.('change',scheduleFit);
requestAnimationFrame(fitViewport);
