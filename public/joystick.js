import {joystickVector} from './shared/controls.js';
export function makeJoystick(element,onMove){let pointer=null;const knob=element.querySelector('.joystick-knob');
 function move(e){const rect=element.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,v=joystickVector(dx,dy,Math.min(rect.height,rect.width)*.32);knob.style.transform=`translate(${v.x}px,${v.y}px)`;onMove(v);}
 element.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;element.setPointerCapture(pointer);element.classList.add('active');move(e);});
 element.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();move(e);}});
 function reset(){pointer=null;knob.style.transform='translate(0,0)';element.classList.remove('active');onMove({forward:0,right:0});}
 for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,e=>{if(e.pointerId===pointer)reset();});window.addEventListener('blur',reset);window.addEventListener('resize',reset);window.addEventListener('orientationchange',reset);return{reset};
}

export function bindSkillButtons(buttons,{canPress,onPress,onRelease}){
 for(const button of buttons){
  const skill=Number(button.dataset.skill);
  const pointers=new Set();
  let feedback=0;
  function activate(){
   button.classList.add('skill-pressed');
   clearTimeout(feedback);
   feedback=setTimeout(()=>button.classList.remove('skill-pressed'),150);
   onPress(skill);
  }
  button.addEventListener('pointerdown',event=>{
   if((event.pointerType==='mouse'&&event.button!==0)||!canPress())return;
   event.preventDefault();
   pointers.add(event.pointerId);
   try{button.setPointerCapture(event.pointerId);}catch{}
   activate();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']){
   button.addEventListener(type,event=>{
    if(pointers.delete(event.pointerId)&&!pointers.size)onRelease(skill);
   });
  }
  button.addEventListener('click',event=>{
   if(event.detail!==0||!canPress())return;
   activate();
   if(!pointers.size)onRelease(skill);
  });
  window.addEventListener('blur',()=>{
   pointers.clear();
   clearTimeout(feedback);
   button.classList.remove('skill-pressed');
   onRelease(skill);
  });
 }
}
