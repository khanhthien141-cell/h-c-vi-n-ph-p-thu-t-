import {isVersus} from '../shared/modes.js';
import {makePassword,checkPassword,passwordEpoch} from '../server/host-auth.js';
import {roomInfo} from '../shared/roster.js';
import ASSETS from 'arcana:assets';
import * as XLSX from 'xlsx';
import {newRoom,publicRoom,requireRoomAccess,joinRoom,commandRoom,tickRoom,inputData,playerAction,packet,bankFor,cleanName,id} from '../shared/room-core.js';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
async function get(db,key){return db.prepare('SELECT value, revision FROM arcana_store WHERE key = ?').bind(key).first();}
async function set(db,key,value){await db.prepare('INSERT INTO arcana_store (key,value,revision) VALUES (?,?,0) ON CONFLICT(key) DO UPDATE SET value=excluded.value, revision=arcana_store.revision+1').bind(key,JSON.stringify(value)).run();}
async function list(db,prefix){const rows=await db.prepare('SELECT value FROM arcana_store WHERE key LIKE ?').bind(prefix+'%').all();return rows.results.map(r=>JSON.parse(r.value));}
async function user(db,request,env){const t=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!t)throw Error('Hãy nhập lại biệt danh.');const row=await get(db,'session:'+t),u=row&&JSON.parse(row.value);if(!u||u.expires<Date.now())throw Error('Phiên đã hết hạn. Hãy nhập lại biệt danh.');if(u.role==='host'){const record=await get(db,'config:host-password');if(u.authEpoch!==passwordEpoch(record&&JSON.parse(record.value),env.HOST_PASSWORD))throw Error('Phiên quản trò hết hiệu lực. Hãy đăng nhập lại.');}return u;}
async function mutate(db,code,fn){for(let attempt=0;attempt<24;attempt++){const row=await get(db,'room:'+code);if(!row)throw Error('Không tìm thấy mã phòng.');const r=JSON.parse(row.value),value=await fn(r);const out=await db.prepare('UPDATE arcana_store SET value = ?, revision = revision + 1 WHERE key = ? AND revision = ?').bind(JSON.stringify(r),'room:'+code,row.revision).run();if(out.meta.changes)return{r,value};if(attempt>1)await new Promise(resolve=>setTimeout(resolve,Math.min(80,attempt*5)+Math.random()*12));}throw Error('Có nhiều người vào phòng cùng lúc. Hãy thử lại sau 1 giây.');}
async function poll(db,code,u,data){
 const row=await get(db,'room:'+code);if(!row)throw Error('Không tìm thấy phòng.');let r=JSON.parse(row.value);
 requireRoomAccess(r,u);
 if(r.owner!==u.id&&!r.players.some(p=>p.id===u.id)&&!u.spectating?.includes(code))throw Error('Hãy vào phòng trước.');
 if(r.match?.players.some(p=>p.id===u.id)&&data.input)await set(db,'input:'+code+':'+u.id,{id:u.id,at:Date.now(),input:inputData(data.input)});
 if(['battle','select'].includes(r.phase)){
  const inputs=r.phase==='battle'&&!r.paused?await list(db,'input:'+code+':'):[];
  if(tickRoom(r,inputs)){const out=await db.prepare('UPDATE arcana_store SET value=?, revision=revision+1 WHERE key=? AND revision=?').bind(JSON.stringify(r),'room:'+code,row.revision).run();if(!out.meta.changes)r=JSON.parse((await get(db,'room:'+code)).value);}
 }
 requireRoomAccess(r,u);
 return packet(r,u);
}
async function api(request,env,path){const db=env.DB;if(path==='/api/health')return json({ok:true,version:'2.0.0',protocol:'polling',storage:!!db,roomModeration:true});if(!db)return json({error:'Máy chủ đang khởi tạo dữ liệu.'},503);
 const body=request.method==='GET'?{}:await request.json().catch(()=>({}));
 if(['/api/guest','/api/host'].includes(path)&&request.method==='POST'){
 const role=path.endsWith('host')?'host':'guest',name=cleanName(body.nickname||body.name||(role==='host'?'Quản trò':''));if(!name)throw Error('Nhập biệt danh.');
 const raw=role==='host'?await get(db,'config:host-password'):null,record=raw&&JSON.parse(raw.value),epoch=passwordEpoch(record,env.HOST_PASSWORD);
 if(body.resumeToken){const row=await get(db,'session:'+String(body.resumeToken));if(row){const prev=JSON.parse(row.value);if(prev.role===role&&prev.expires>Date.now()&&(role==='host'?prev.authEpoch===epoch:prev.name===name))return json({token:body.resumeToken,id:prev.id,name:prev.name,role});}}
 if(role==='host'){if(typeof body.password!=='string'||!body.password)return json({error:'Nhập mật khẩu quản trò.'},401);const rateKey='login:'+ (request.headers.get('CF-Connecting-IP')||'local'),rawRate=await get(db,rateKey);let rate=rawRate&&JSON.parse(rawRate.value);if(!rate||Date.now()-rate.at>300000)rate={at:Date.now(),count:0};if(rate.count>=8)return json({error:'Thử sai quá nhiều. Chờ 5 phút rồi thử lại.'},429);if(!await checkPassword(body.password,record,env.HOST_PASSWORD)){rate.count++;await set(db,rateKey,rate);return json({error:env.HOST_PASSWORD||record?'Mật khẩu quản trò chưa đúng.':'Máy chủ chưa cấu hình HOST_PASSWORD.'},401);}await set(db,rateKey,{at:Date.now(),count:0});}
 const token=id()+id(),u={id:role==='host'?'mila-mc-admin':id(),name,role,authEpoch:role==='host'?epoch:undefined,expires:Date.now()+(role==='host'?8*3600000:30*86400000)};await set(db,'session:'+token,u);return json({token,id:u.id,name,role});
 }

 const info=path.match(/^\/api\/room-info\/(\d{6})$/);if(info){const row=await get(db,'room:'+info[1]);return row?json(roomInfo(JSON.parse(row.value))):json({error:'Không tìm thấy phòng.'},404);}
 const u=await user(db,request,env);
 if(path==='/api/host/password'&&request.method==='POST'){if(u.role!=='host')return json({error:'Chỉ quản trò.'},403);const old=await get(db,'config:host-password'),record=old&&JSON.parse(old.value);if(!await checkPassword(body.currentPassword,record,env.HOST_PASSWORD))return json({error:'Mật khẩu hiện tại chưa đúng.'},401);const next=await makePassword(body.newPassword);await set(db,'config:host-password',next);u.authEpoch=next.epoch;const token=id()+id();await set(db,'session:'+token,u);return json({token,id:u.id,name:u.name,role:u.role});}
 if(path==='/api/host/check')return u.role==='host'?json({ok:true}):json({error:'Chỉ quản trò.'},403);
 if(path==='/api/duels')return json({error:'Chỉ quản trò được tạo phòng. Hãy nhập mã phòng do quản trò cung cấp.'},403);
 if(path==='/api/rooms'){
  if(u.role!=='host')return json({error:'Trang này dành cho máy chủ.'},403);
  if(request.method==='GET')return json((await list(db,'room:')).filter(r=>r.owner===u.id).map(publicRoom));
  const mine=(await list(db,'room:')).filter(r=>r.owner===u.id);if(mine.length>=100)throw Error('Mỗi quản trò tối đa 100 phòng. Có thể mở lại phòng cũ để tiếp tục thi đấu.');
  for(let attempt=0;attempt<10;attempt++){const code=String(Math.floor(100000+Math.random()*900000)),r=newRoom(code,u.id,body.title);r.managed=true;r.mode=isVersus(body.mode)||body.mode==='tournament'?body.mode:'squad';if(r.mode!=='tournament')r.pair=[0,1];const inserted=await db.prepare('INSERT OR IGNORE INTO arcana_store (key,value,revision) VALUES (?,?,0)').bind('room:'+code,JSON.stringify(r)).run();if(inserted.meta.changes)return json(publicRoom(r));}throw Error('Chưa tạo được mã phòng, thử lại nhé.');
 }
 if(path==='/api/bank'){if(u.role!=='host')return json({error:'Chỉ máy chủ.'},403);const rooms=(await list(db,'room:')).filter(r=>r.owner===u.id);const unique=[...new Map(rooms.flatMap(r=>r.bank||[]).map(q=>[q.id,q])).values()];return json(bankFor({bank:unique}));}
 const live=path.match(/^\/api\/live\/(\d{6})\/(join|poll|mc|answer|buy|chat|selectHero)$/);
 if(live){const [,code,event]=live;if(event==='poll')return json(await poll(db,code,u,body));if(event==='join'){
   const out=await mutate(db,code,r=>joinRoom(r,u,body));if(body.spectator&&out.r.owner!==u.id){const t=request.headers.get('Authorization').slice(7);u.spectating=[...new Set([...(u.spectating||[]),code])].slice(-30);await set(db,'session:'+t,u);}return json(packet(out.r,u));
  }
  const out=await mutate(db,code,r=>event==='mc'?commandRoom(r,u,body):playerAction(r,u,event,body));return json(event==='mc'?packet(out.r,u):out.value);
 }
 const archive=path.match(/^\/api\/archives\/(\d{6})$/),exported=path.match(/^\/api\/export\/(\d{6})$/);
 if(archive||exported){const row=await get(db,'room:'+(archive||exported)[1]),r=row&&JSON.parse(row.value);if(!r||r.owner!==u.id)return json({error:'Chỉ máy chủ của phòng.'},403);if(archive)return json(r.archives||[]);const wb=XLSX.utils.book_new(),rows=r.results.flatMap((m,i)=>m.players.map(p=>({Tran:i+1,BietDanh:p.name,Doi:r.teams[p.team],Tuong:p.hero,Dung:p.correct,DiemKienThuc:p.knowledge,HaGuc:p.kills})));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'KetQua');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(r.history),'LichSu');return new Response(XLSX.write(wb,{type:'array',bookType:'xlsx'}),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="arcana-'+r.code+'.xlsx"'}});}
 if(path==='/api/import'&&request.method==='POST'){
  if(u.role!=='host')return json({error:'Chỉ máy chủ.'},403);if(typeof body.base64!=='string'||body.base64.length>1500000)throw Error('File tối đa 1 MB.');const wb=XLSX.read(body.base64,{type:'base64'}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);if(!rows.length||rows.length>1000)throw Error('Cần 1–1000 dòng.');const added=rows.map((a,i)=>{const v=String(a.DapAn).toLowerCase().trim();if(!String(a.CauHoi||'').trim()||!['true','false','đúng','sai','1','0'].includes(v))throw Error('Dòng '+(i+2)+' cần CauHoi và DapAn TRUE/FALSE.');return{id:id(),text:String(a.CauHoi).slice(0,500),answer:['true','đúng','1'].includes(v),round:Math.max(0,Math.min(3,Number(a.Vong)||0)),difficulty:['Dễ','Trung bình','Khó'].includes(a.DoKho)?a.DoKho:'Trung bình',topic:String(a.ChuDe||'Tự nhập').slice(0,60),owner:u.id};});const rooms=(await list(db,'room:')).filter(r=>r.owner===u.id&&r.phase==='lobby');if(!rooms.length)throw Error('Tạo hoặc mở phòng ở sảnh trước khi nhập câu hỏi.');for(const room of rooms)await mutate(db,room.code,r=>{r.bank=[...(r.bank||[]),...added];});return json({count:added.length});
 }
 const edit=path.match(/^\/api\/bank\/([a-zA-Z0-9_-]+)$/);if(edit&&request.method==='PATCH'){if(u.role!=='host')return json({error:'Chỉ máy chủ.'},403);const rooms=(await list(db,'room:')).filter(r=>r.owner===u.id&&(r.bank||[]).some(q=>q.id===edit[1]));if(!rooms.length)throw Error('Không tìm thấy câu hỏi của bạn.');if(rooms.some(r=>['select','battle'].includes(r.phase)&&r.questionIds.includes(edit[1])))throw Error('Câu hỏi đã khóa trong trận.');if(typeof body.text!=='string'||typeof body.answer!=='boolean')throw Error('Dữ liệu không hợp lệ.');for(const room of rooms)await mutate(db,room.code,r=>{const q=r.bank.find(q=>q.id===edit[1]);q.text=body.text.slice(0,500);q.answer=body.answer;});return json({ok:true});}
 return json({error:'Không tìm thấy chức năng.'},404);
}
export default{async fetch(request,env){try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env,url.pathname);const path=['/mc','/mc.html'].includes(url.pathname)?'/mc.html':['/play','/player','/player.html'].includes(url.pathname)?'/player.html':url.pathname==='/'?'/index.html':url.pathname;const asset=ASSETS[path];if(!asset)return new Response('Không tìm thấy trang',{status:404});const bytes=asset.text!==undefined?new TextEncoder().encode(asset.text):Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));const headers={'Content-Type':asset.type,'Cache-Control':path.endsWith('.mp4')?'public, max-age=86400':'no-cache','Accept-Ranges':'bytes'};const range=request.headers.get('Range')?.match(/^bytes=(\d+)-(\d*)$/);if(range){const start=Number(range[1]),end=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);if(start>=bytes.length)return new Response(null,{status:416});return new Response(bytes.slice(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`}});}return new Response(request.method==='HEAD'?null:bytes,{headers});}catch(error){if(error.code==='room_kicked')return json({error:error.message,code:error.code},403);return json({error:error.message||'Máy chủ chưa sẵn sàng.'},400);}}};
