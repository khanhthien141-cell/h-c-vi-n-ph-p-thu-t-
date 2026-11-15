import {apiUrl} from './api-url.js';
import {apiOrigin} from './api-config.js';
import {io} from './vendor/socket.io.js';
export function makeSocket(options){
 const handlers=new Map();let native=null,code=null,latest={},timer=null,closed=false,busy=false,phase=null,lastUI=null,lastQuiz=null,lastChats=new Set(),failed=false;
 const pendingTaps=new Set(),tapExpires=new Map();
 const fire=(event,data)=>{for(const fn of handlers.get(event)||[])fn(data);};
 const request=async(path,body)=>{const res=await fetch(apiUrl(path),{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+options.auth.token},body:JSON.stringify(body||{})});const value=await res.json();if(!res.ok)throw Error(value.error||'Không kết nối được phòng.');return value;};
 const apply=p=>{if(p.room)phase=p.room.phase;if(p.room&&lastUI!==p.room.uiVersion){lastUI=p.room.uiVersion;fire('room',p.room);}if(p.match)fire('match',p.match);if(p.question){const key=p.question.index+':'+p.question.at+':'+p.question.reason;if(key!==lastQuiz){lastQuiz=key;fire('question',p.question);}}for(const chat of p.chats||[])if(!lastChats.has(chat.seq)){lastChats.add(chat.seq);fire('chat',chat);}if(lastChats.size>150)lastChats=new Set((p.chats||[]).map(c=>c.seq));};
 const poll=async()=>{if(closed||busy||!code)return;busy=true;const started=performance.now();try{// Keep a quick tap visible across at least one server simulation tick.
  for(const skill of pendingTaps)tapExpires.set(skill,started+220);
  pendingTaps.clear();
  const input={...latest};
  for(const [skill,expires] of tapExpires){
   if(started<expires)input['a'+skill]=true;
   else tapExpires.delete(skill);
  }
  const p=await request('/api/live/'+code+'/poll',{input});apply(p);if(failed){failed=false;fire('connect');}}catch(e){pendingTaps.clear();tapExpires.clear();if(!failed){failed=true;fire('disconnect');}}finally{
  busy=false;
  if(!closed){
   const interval=failed?800:phase==='battle'?120:phase==='select'||phase==='ready'?250:500;
   timer=setTimeout(poll,pendingTaps.size?0:Math.max(25,interval-(performance.now()-started)));
  }
 }};
 const socket={on(event,fn){if(!handlers.has(event))handlers.set(event,[]);handlers.get(event).push(fn);native?.on(event,fn);return socket;},emit(event,data,cb){if(closed)return;
  if(event==='input'){
   const {skillTaps=[],...controls}=data;
   if(native){
    for(const skill of skillTaps)controls['a'+skill]=true;
    return native.emit(event,controls,cb);
   }
   latest=controls;
   for(const skill of skillTaps)pendingTaps.add(skill);
   if(pendingTaps.size&&!busy&&code&&phase==='battle'){
    clearTimeout(timer);
    void poll();
   }
   return;
  }
  if(native)return native.emit(event,data,cb);
  (async()=>{try{if(event==='join'){code=String(data.code);const p=await request('/api/live/'+code+'/join',data);apply(p);cb?.({ok:true,room:p.room,owner:p.owner});clearTimeout(timer);timer=setTimeout(poll,120);}else{const p=await request('/api/live/'+code+'/'+event,event==='chat'?{text:data}:data);if(p.room)apply(p);cb?.(p);}}catch(e){cb?.({error:e.message});}})();
 },disconnect(){closed=true;clearTimeout(timer);native?.disconnect();}};
 fetch(apiUrl('/api/health')).then(r=>r.json()).then(health=>{if(closed)return;if(health.protocol==='polling')fire('connect');else{native=apiOrigin?io(apiOrigin,options):io(options);for(const [event,fns]of handlers)for(const fn of fns)native.on(event,fn);}}).catch(()=>fire('connect_error',Error('Không kết nối được máy chủ.')));
 return socket;
}
