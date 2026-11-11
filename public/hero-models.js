import * as T from '/vendor/three.module.js';
import {mergeGeometries} from '/vendor/merge.js';
// Art-directed silhouettes sampled from the approved MILA portrait set.
export const designs={
 sol:{hair:'#e9b858',coat:'#f4ebd4',accent:'#6b347d',eye:'#ad662c',kind:'knight',ears:true,weapon:'sword',shield:true},
 luna:{hair:'#9b6eb7',coat:'#573074',accent:'#b081cc',eye:'#893aad',kind:'witch',long:true,weapon:'moon'},
 ivy:{hair:'#8db79b',coat:'#497b58',accent:'#bcdbac',eye:'#388b54',kind:'garden',long:true,weapon:'flowers'},
 kai:{hair:'#52749b',coat:'#304e7e',accent:'#94cfee',eye:'#347ab8',kind:'archer',hat:'beret',weapon:'bow'},
 ember:{hair:'#ad3545',coat:'#8b2838',accent:'#ffc149',eye:'#b3293d',kind:'knight',horns:true,weapon:'flame'},
 nova:{hair:'#bfabdf',coat:'#503371',accent:'#d7b8f4',eye:'#8543a5',kind:'witch',long:true,weapon:'star'},
 sage:{hair:'#8b6350',coat:'#4d784d',accent:'#abc18a',eye:'#4c924a',kind:'garden',hood:true,antlers:true,weapon:'leaf'},
 raven:{hair:'#693b79',coat:'#442447',accent:'#9863a9',eye:'#aa4b79',kind:'archer',long:true,hat:'feather',weapon:'bow'},
 atlas:{hair:'#d4c5d5',coat:'#365b9a',accent:'#b4c7f0',eye:'#318bc6',kind:'knight',weapon:'hammer',shield:true,fur:true},
 faye:{hair:'#e58da7',coat:'#923b75',accent:'#efb5ca',eye:'#b95799',kind:'witch',long:true,hat:'beret',glasses:true,weapon:'book'},
 milo:{hair:'#9f6c4e',coat:'#3b7054',accent:'#c3d0a0',eye:'#4f925b',kind:'bard',hat:'feather',weapon:'lute'},
 zephyr:{hair:'#73b8bf',coat:'#327f87',accent:'#beeff0',eye:'#2b86ac',kind:'archer',long:true,feathers:true,weapon:'bow'}
};
const V=(p)=>new T.Vector3(...p);
const TAU=Math.PI*2;
// Character-specific sculpting. The old portrait crop was drawn as a rectangular
// plane across the face, with eyes/mouth from the WRONG part of the illustration.
// Facial features below are real 3D geometry: no image decal, alpha seams or
// floating card can cover the eyes when the head turns.
const faceStyles={
 sol:{eyeScale:1,iris:'#bb722f',skin:'#ffe4cb',mouth:'smile',lash:.8},
 luna:{eyeScale:1.14,iris:'#a04bc9',skin:'#ffe4d6',mouth:'open',lash:1.16},
 ivy:{eyeScale:1.1,iris:'#4d9b5f',skin:'#ffe2cc',mouth:'smile',lash:1.12},
 kai:{eyeScale:1.04,iris:'#4382d2',skin:'#ffe1d2',mouth:'smile',lash:.88},
 ember:{eyeScale:.95,iris:'#bc4758',skin:'#fdddc8',mouth:'grin',lash:.78},
 nova:{eyeScale:1.15,iris:'#a366df',skin:'#ffe5d7',mouth:'open',lash:1.22},
 sage:{eyeScale:1.1,iris:'#609854',skin:'#ffe0cf',mouth:'smile',lash:1.02},
 raven:{eyeScale:1.08,iris:'#b4539d',skin:'#ffe1d4',mouth:'smile',lash:1.2},
 atlas:{eyeScale:1.02,iris:'#48a8e9',skin:'#ffe7d6',mouth:'grin',lash:.83},
 faye:{eyeScale:1.14,iris:'#cf5fa2',skin:'#ffe3d2',mouth:'open',lash:1.22},
 milo:{eyeScale:1.03,iris:'#5a9663',skin:'#ffe2ce',mouth:'grin',lash:.88},
 zephyr:{eyeScale:1.13,iris:'#41a4cf',skin:'#ffe7d8',mouth:'open',lash:1.16}
};
export function createHeroModel(id,{merge=true}={}){
 const d=designs[id]||designs.luna,root=new T.Group();root.name=id;
 const faceStyle=faceStyles[id]||faceStyles.luna;
 const irisColor=new T.Color(faceStyle.iris);
 const eyeLight='#'+irisColor.clone().lerp(new T.Color('#e7f9ff'),.42).getHexString();
 const mixed=(color,toward,weight)=>'#'+new T.Color(color).lerp(new T.Color(toward),weight).getHexString();
 const mats={};for(const [k,color]of Object.entries({hair:d.hair,hairLight:mixed(d.hair,'#ffefdf',.28),hairShadow:mixed(d.hair,'#30263b',.2),coat:d.coat,coatShadow:mixed(d.coat,'#2e2342',.23),silk:mixed(d.accent,'#fff7df',.55),accent:d.accent,eye:faceStyle.iris,eyeLight,skin:faceStyle.skin,cream:'#fff4dd',gold:'#dca94b',goldLight:'#ffe0a0',dark:'#352335',white:'#fffaf4',blush:'#ef9b9f',steel:'#d5d8e7',wood:'#6f4733'}))mats[k]=new T.MeshStandardMaterial({color,roughness:['gold','goldLight'].includes(k)?.34:['hair','hairLight','eye','eyeLight','silk'].includes(k)?.57:.79,metalness:['gold','goldLight'].includes(k)?.36:k==='steel'?.4:0,side:T.DoubleSide});
 const body=new T.Group(),head=new T.Group(),cape=new T.Group(),arms=[],legs=[];body.name='Body';head.name='Head';cape.name='Cape';root.add(body);body.add(head,cape);head.position.y=2.28;
 function mesh(parent,geo,mat,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,mats[mat]||mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
 const sphere=new T.SphereGeometry(1,16,10);
 const ell=(p,m,pos,s)=>mesh(p,sphere,m,pos,s);
 function curve(p,pts,r,mat,end=.3){const c=new T.CatmullRomCurve3(pts.map(V)),geo=new T.TubeGeometry(c,Math.max(12,pts.length*5),1,7,false),a=geo.attributes.position,n=geo.attributes.normal;for(let i=0;i<a.count;i++){const ring=Math.floor(i/8),t=ring/Math.max(12,pts.length*5),center=c.getPointAt(t),radius=mat==='hair'?r*(.3+.8*Math.pow(Math.sin(Math.PI*t),.55))*(1-t*.7):r*(1-(1-end)*t);a.setXYZ(i,center.x+(a.getX(i)-center.x)*radius,center.y+(a.getY(i)-center.y)*radius,center.z+(a.getZ(i)-center.z)*radius*(mat==='hair'?.55:1));}geo.computeVertexNormals();return mesh(p,geo,mat);}
 // Tapered, gently curved hair leaves follow the portrait's painted tufts.
 // These replace the oversized tube curls that used to obscure the forehead.
 function hairLock(p,pts,width,mat='hair'){
  const line=new T.CatmullRomCurve3(pts.map(V)),positions=[],indices=[],steps=12;
  for(let i=0;i<=steps;i++){
   const t=i/steps,c=line.getPointAt(t),tangent=line.getTangentAt(t);
   const across=new T.Vector3(-tangent.y,tangent.x,0).normalize();
   const w=width*(.55+.45*Math.sin(Math.PI*(t*.8+.1)))*Math.pow(1-t,.64)+.001;
   for(const s of[-1,1])positions.push(c.x+across.x*w*s,c.y+across.y*w*s,c.z+.012);
   if(i){const n=i*2;indices.push(n-2,n-1,n,n-1,n+1,n);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(p,g,mat);
 }
 function strip(p,rows,mat){const a=[],uv=[],idx=[];rows.forEach((r,i)=>{for(let j=0;j<2;j++){a.push(...r[j]);uv.push(j,i/(rows.length-1));}if(i){let n=i*2;idx.push(n-2,n-1,n,n-1,n+1,n);}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(p,g,mat);}
 function star(p,x,y,z,r=.13,mat='gold',points=5){const shape=new T.Shape();for(let i=0;i<points*2;i++){const a=i*Math.PI/points+Math.PI/2,q=i%2?r*.43:r;const px=x+Math.cos(a)*q,py=y+Math.sin(a)*q;i?shape.lineTo(px,py):shape.moveTo(px,py);}shape.closePath();return mesh(p,new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.012}),mat,[0,0,z]);}
 function gem(p,x,y,z,r=.12,mat='accent'){return mesh(p,new T.OctahedronGeometry(r,0),mat,[x,y,z],[.8,1.35,.6]);}
 function ring(p,x,y,z,r=.12,mat='gold',tube=.018){return mesh(p,new T.TorusGeometry(r,tube,6,28),mat,[x,y,z]);}
 function flower(p,x,y,z,s=.12){for(let i=0;i<5;i++){const a=i*TAU/5;ell(p,'cream',[x+Math.cos(a)*s*.7,y+Math.sin(a)*s*.7,z],[s*.6,s*.6,.038]);}ell(p,'gold',[x,y,z+.04],[s*.35,s*.35,.04]);}
 function leaf(p,pts,r=.1,mat='accent'){return curve(p,pts,r,mat,.02);}
 function feather(p,x,y,z,angle=0,s=.45){const f=new T.Group();p.add(f);f.position.set(x,y,z);f.rotation.z=angle;ell(f,'cream',[0,s*.45,0],[s*.17,s*.6,.035]);curve(f,[[0,0,.04],[0,s*.55,.045],[0,s,.02]],.012,'gold');for(let j=1;j<5;j++)for(const side of[-1,1])curve(f,[[0,j*s/6,.043],[side*s*.12,(j+.7)*s/6,.04]],.006,'accent');}
 // Tailored torso, pleated underskirt / shorts, belt and layered lapels.
 mesh(body,new T.CylinderGeometry(.29,.39,.63,16),'cream',[0,1.49,0],[1,1,.65]);
 for(const side of[-1,1]){strip(body,[[[side*.06,1.81,.22],[side*.33,1.78,.08]],[[side*.09,1.35,.245],[side*.34,1.34,.13]],[[side*.14,1.04,.31],[side*.51,1.0,.13]]],'coat');curve(body,[[side*.07,1.79,.24],[side*.1,1.35,.27],[side*.15,1.04,.33],[side*.49,1.02,.16]],.019,'gold');strip(body,[[[side*.07,1.81,.25],[side*.28,1.81,.18]],[[side*.17,1.57,.27],[side*.31,1.72,.2]]],'cream');}
 if(d.long||d.kind==='witch'||d.kind==='garden'){
 mesh(body,new T.CylinderGeometry(.31,.61,.55,24,1,true),'cream',[0,1.12,0],[1,1,.78]);for(let i=0;i<20;i++){const a=i*TAU/20;ell(body,'cream',[Math.cos(a)*.57,.83,Math.sin(a)*.44],[.09,.07,.07]);curve(body,[[Math.cos(a)*.33,1.37,Math.sin(a)*.26],[Math.cos(a)*.53,.91,Math.sin(a)*.42]],.008,'goldLight');}
 }else mesh(body,new T.CylinderGeometry(.31,.35,.35,12),'dark',[0,1.03,0],[1,1,.75]);
 mesh(body,new T.CylinderGeometry(.365,.365,.105,24),'wood',[0,1.3,0],[1,1,.72]);ring(body,0,1.3,.279,.079,'gold',.025);gem(body,0,1.73,.31,.12);for(const side of[-1,1])ell(body,'coat',[side*.14,1.77,.29],[.15,.08,.035]);for(let j=0;j<3;j++)ell(body,'gold',[.08,1.56-j*.09,.26],[.024,.024,.02]);
 // Faceted neckline jewel, layered silk collar, fine necklace and belt chain.
 ring(body,0,1.73,.315,.155,'goldLight',.012);
 for(const side of[-1,1]){
  curve(body,[[side*.28,1.78,.19],[side*.22,1.68,.25],[side*.1,1.61,.31],[0,1.57,.345]],.011,'goldLight');
  ell(body,'silk',[side*.20,1.81,.26],[.135,.052,.02]);
  curve(body,[[0,1.27,.30],[side*.12,1.19,.33],[side*.21,1.2,.32]],.014,'gold');
  for(let j=0;j<3;j++)gem(body,side*(.1+j*.046),1.18-j*.018,.338,.026,'goldLight');
 }
 star(body,0,1.49,.33,.065,'goldLight',8);
 // Split mantle: genuinely volumetric curved back, open front, gold perimeter and embroidered motifs.
 const rows=10,cols=18,pos=[],idx=[];for(let y=0;y<=rows;y++){const t=y/rows;for(let j=0;j<=cols;j++){const a=.24+(TAU-.48)*j/cols,rad=.38+t*.55;pos.push(Math.sin(a)*rad,1.8-t*(1.25+.1*Math.cos(a*3)),Math.cos(a)*rad*.7-.07-t*.15);if(y&&j){let q=y*(cols+1)+j;idx.push(q-cols-2,q-cols-1,q-1,q-cols-1,q,q-1);}}}const cg=new T.BufferGeometry();cg.setAttribute('position',new T.Float32BufferAttribute(pos,3));cg.setIndex(idx);cg.computeVertexNormals();mesh(cape,cg,'coat');
 for(const a of[.24,TAU-.24])curve(cape,Array.from({length:8},(_,i)=>{let t=i/7,r=.38+t*.55;return[Math.sin(a)*r,1.8-t*(1.25+.1*Math.cos(a*3)),Math.cos(a)*r*.7-.07-t*.15+.01];}),.022,'gold');
 curve(cape,Array.from({length:25},(_,i)=>{const a=.24+(TAU-.48)*i/24;return[Math.sin(a)*.93,.55-.1*Math.cos(a*3),Math.cos(a)*.93*.7-.22];}),.022,'gold');
 // Back crest is visible from the requested follow camera.
 const crest=new T.Group();cape.add(crest);crest.position.set(0,1.18,-.67);crest.rotation.y=Math.PI;ring(crest,0,0,0,.21,'gold',.013);star(crest,0,0,.01,.16,'goldLight',d.kind==='garden'?6:8);for(const s of[-1,1])curve(crest,[[s*.12,-.19,0],[s*.23,-.29,0],[s*.31,-.35,0]],.012,'gold');
 for(const side of[-1,1])for(let j=0;j<3;j++){const motif=new T.Group();cape.add(motif);motif.position.set(side*(.4+j*.13),1.17-j*.2,-.43);motif.rotation.y=side*-.7;star(motif,0,0,0,.07,'goldLight',d.kind==='garden'?6:4);}
 for(const side of[-1,1]){for(let j=0;j<3;j++){const x=side*(.19+j*.09),y=1.2-j*.075;curve(body,[[x,y,.32],[x+side*.035,y-.07,.32],[x+side*.095,y-.08,.3]],.009,'goldLight');star(body,x+side*.08,y-.04,.32,.035,'goldLight',4);}for(let j=0;j<4;j++){const decoration=new T.Group();cape.add(decoration);decoration.position.set(side*(.22+j*.12),.72+j*.08,-.74+j*.07);decoration.rotation.y=Math.PI-side*.3;curve(decoration,[[0,0,0],[side*.03,.12,0],[side*.09,.2,0]],.009,'gold');for(let n=0;n<3;n++)leaf(decoration,[[side*.03,.07+n*.04,0],[side*(.09+n*.01),.1+n*.04,0]],.018,'goldLight');}}
 // Character-family motifs embroidered on the lower front robes; use thin
 // genuine 3D ornament, not portrait textures or fragile image stickers.
 for(const side of[-1,1]){
  const jewel=new T.Group();body.add(jewel);jewel.position.set(side*.32,1.09,.335);jewel.rotation.y=side*.23;
  if(d.kind==='garden'){flower(jewel,0,0,0,.09);curve(jewel,[[0,-.055,0],[side*.045,-.13,.008],[side*.11,-.17,.01]],.009,'gold');}
  else if(d.kind==='witch'){star(jewel,0,0,0,.105,'goldLight',5);ring(jewel,0,0,.003,.135,'gold',.007);}
  else if(d.kind==='archer'){gem(jewel,0,0,.01,.105,'silk');curve(jewel,[[-.11,-.09,0],[0,-.14,.005],[.11,-.09,0]],.009,'gold');}
  else if(d.kind==='bard'){ring(jewel,0,0,.006,.083,'goldLight',.009);curve(jewel,[[.04,.05,.01],[.04,.16,.01],[-.02,.20,.01]],.012,'gold');}
  else{star(jewel,0,0,0,.1,'goldLight',8);gem(jewel,0,0,.045,.045,'accent');}
 }
 for(let j=0;j<5;j++){
  const a=.48+j*(Math.PI-.96)/4,t=.87,r=.38+t*.55;
  const x=Math.sin(a)*(r+.018),y=1.8-t*(1.25+.1*Math.cos(a*3)),z=Math.cos(a)*(r*.7+.018)-.07-t*.15;
  const stitch=new T.Group();cape.add(stitch);stitch.position.set(x,y,z);stitch.rotation.y=a;
  gem(stitch,0,0,0,.041,'goldLight');
  curve(stitch,[[-.046,.045,0],[0,.09,.004],[.046,.045,0]],.006,'gold');
 }
 // Separate articulated boots and shoulders; no floating capsule body.
 for(const side of[-1,1]){const leg=new T.Group();leg.position.set(side*.23,1.02,0);body.add(leg);leg.name=side<0?'Left_leg':'Right_leg';legs.push(leg);mesh(leg,new T.CylinderGeometry(.12,.10,.49,12),'skin',[0,-.22,0]);mesh(leg,new T.CylinderGeometry(.135,.115,.4,12),'dark',[0,-.57,0]);ell(leg,'dark',[0,-.85,.11],[.16,.12,.25]);mesh(leg,new T.CylinderGeometry(.15,.15,.04,12),'gold',[0,-.4,0]);curve(leg,[[-.11,-.74,.14],[0,-.65,.15],[.11,-.74,.14]],.018,'gold');curve(leg,[[-.13,-.86,.25],[0,-.88,.33],[.13,-.86,.25]],.016,'gold');gem(leg,0,-.48,.13,.07,'goldLight');if(d.kind==='knight'){ell(leg,'steel',[0,-.31,.11],[.16,.16,.095]);star(leg,0,-.31,.21,.095,'gold',4);}for(let j=0;j<2;j++){curve(leg,[[-.105,-.56-j*.105,.127],[0,-.60-j*.105,.145],[.105,-.56-j*.105,.127]],.007,'goldLight');}ring(leg,0,-.49,.142,.062,'gold',.009);}
 for(const side of[-1,1]){const arm=new T.Group();arm.position.set(side*.36,1.69,0);body.add(arm);arm.name=side<0?'Left_arm':'Right_arm';arms.push(arm);arm.rotation.z=side*.2;mesh(arm,new T.CylinderGeometry(.15,.23,.43,14),'cream',[side*.12,-.2,.015]);mesh(arm,new T.CylinderGeometry(.23,.23,.05,14),'gold',[side*.12,-.42,.015]);ell(arm,'skin',[side*.12,-.49,.04],[.115,.125,.105]);ell(arm,'coat',[side*.05,-.015,0],[.23,.095,.22]);curve(arm,[[side*-.11,-.03,.16],[side*.07,-.09,.2],[side*.25,-.03,.14]],.018,'gold');if(d.fur)for(let j=0;j<6;j++)ell(arm,'cream',[(j-2)*.065,0,.08],[.07,.085,.13]);gem(arm,side*.11,-.19,.167,.06,'silk');for(let j=0;j<3;j++)curve(arm,[[side*(.01+j*.065),-.35,.14],[side*(.045+j*.065),-.29,.15]],.006,'goldLight');}
 // A shaped skull and jaw, with inset, curved anime eyes rather than a flat
 // portrait pasted on top. Every eye part rotates with the head in 3D.
 ell(head,'skin',[0,0,0],[.55,.55,.46]);ell(head,'skin',[0,-.225,.065],[.435,.31,.38]);
 for(const side of[-1,1]){
  ell(head,'skin',[side*.54,-.085,-.025],[.095,.145,.091]);
  const eye=new T.Group();eye.name=side<0?'Left eye':'Right eye';head.add(eye);
  eye.position.set(side*.207,.025,.435);eye.rotation.y=side*.23;
  eye.scale.setScalar(faceStyle.eyeScale);
  ell(eye,'dark',[0,0,.001],[.157,.138,.007]);
  ell(eye,'white',[0,-.004,.009],[.145,.126,.006]);
  ell(eye,'dark',[-side*.011,-.018,.016],[.11,.106,.005]);
  ell(eye,'eye',[-side*.011,-.022,.022],[.1,.099,.005]);
  ell(eye,'eyeLight',[-side*.003,-.039,.028],[.065,.069,.004]);
  ell(eye,'dark',[-side*.011,-.015,.033],[.043,.067,.004]);
  ell(eye,'white',[-.041,.058,.039],[.042,.037,.005]);
  ell(eye,'white',[.047,-.048,.036],[.017,.019,.004]);
  // Micro-reflections on the iris restore the illustrated bright-eyed look.
  for(let j=0;j<4;j++){const a=.3+j*.65;ell(eye,'eyeLight',[-side*.012+Math.cos(a)*.078,-.021+Math.sin(a)*.074,.03],[.007,.011,.004]);}
  // Raised upper lash line, fine lower lashes and a soft coloured eyelid.
  curve(eye,[[-.152,.058,.012],[-.11,.119,.014],[-.015,.143,.014],[.095,.115,.014],[.154,.047,.008]],.012*faceStyle.lash,'dark');
  for(let k=0;k<2;k++)curve(eye,[[side*.10,.106,.013],[side*(.145+k*.022),.155+k*.019,.007]],.007*faceStyle.lash,'dark');
  curve(eye,[[-.106,-.10,.013],[-.02,-.14,.016],[.097,-.105,.013]],.006,'blush');
  curve(head,[[side*.10,.244,.392],[side*.21,.27,.375],[side*.323,.236,.345]],.012,'hair');
  ell(head,'blush',[side*.345,-.152,.409],[.09,.035,.013]);
  for(let j=0;j<2;j++)ell(head,'white',[side*(.33+j*.047),-.157+j*.029,.425],[.009,.008,.006]);
 }
 ell(head,'skin',[0,-.101,.473],[.041,.046,.029]);
 ell(head,'blush',[0,-.127,.501],[.016,.009,.007]);
 if(faceStyle.mouth==='open'){
  ell(head,'dark',[0,-.248,.423],[.065,.052,.015]);
  ell(head,'blush',[0,-.273,.435],[.042,.015,.013]);
  ell(head,'white',[0,-.22,.437],[.042,.012,.008]);
 }else if(faceStyle.mouth==='grin'){
  curve(head,[[-.09,-.229,.404],[-.04,-.265,.431],[.04,-.265,.431],[.09,-.229,.404]],.011,'dark');
  ell(head,'white',[0,-.242,.438],[.047,.011,.007]);
 }else{
  curve(head,[[-.066,-.239,.409],[0,-.263,.436],[.065,-.24,.409]],.01,'dark');
 }
 ell(head,'blush',[0,-.282,.415],[.052,.012,.005]);
 // Sculpted layered hair: crown, individual curved locks, swept fringe and long flowing back curls.
 mesh(head,new T.SphereGeometry(.57,24,16,0,TAU,0,Math.PI*.55),'hair',[0,.055,-.045],[1,1, .88]);
 for(let j=0;j<13;j++){const a=j*TAU/13,x=Math.sin(a),z=Math.cos(a),front=z>.35;curve(head,[[x*.15,.58,z*.1-.02],[x*.45,.4,z*.35-.03],[x*.59,.17,z*.46-.02],[x*.57,front?.14:-.2,z*.49-.03]],.12,'hair',.03);}
 for(let j=0;j<7;j++){
  const x=(j-3)*.135,tilt=(j%3-1)*.055;
  const points=[[x*.7,.53,.32],[x+tilt*.6,.435,.48],[x+tilt,.32+(j%3)*.025,.515],[x+tilt-.025,.205+(j%3)*.052,.49]];
  hairLock(head,points,.10,'hair');
  hairLock(head,[[x*.72,.49,.346],[x+tilt*.6,.41,.504],[x+tilt,.302+(j%3)*.025,.529]],.014,'hairLight');
 }
 // Individual highlights along the crown and temples give dimension to hair
 // without using image planes that break when the character turns.
 for(let j=0;j<9;j+=2){const a=j*TAU/9,x=Math.sin(a),z=Math.cos(a),front=z>.35;
  curve(head,[[x*.18,.59,z*.1-.015],[x*.46,.42,z*.34+.005],[x*.575,.16,z*.46+.008],[x*.56,front?.17:-.16,z*.49+.01]],.012,'hairLight',.08);
 }
 if(d.long){for(let j=0;j<9;j++){const x=(j-4)*.14;curve(head,[[x*.8,.25,-.32],[x*1.2,-.22,-.48],[x*1.5,-.73,-.48],[x*1.65+.1*Math.sin(j),-1.17,-.42],[x*1.55,-1.35,-.25]],.15,'hair',.13);}for(const s of[-1,1]){curve(head,[[s*.47,.05,0],[s*.57,-.3,.04],[s*.53,-.55,.05],[s*.7,-.73,-.03]],.14,'hair',.07);for(let j=0;j<3;j++)curve(head,[[s*(.52+j*.09),-.35,-.4],[s*(.72+j*.11),-.65,-.5],[s*(.83+j*.12),-.98,-.35],[s*(.68+j*.13),-1.13,-.2]],.11,'hair',.03);}}
 if(d.long)for(let j=0;j<6;j++){const x=(j-2.5)*.2;curve(head,[[x*.82,.13,-.38],[x*1.14,-.36,-.51],[x*1.3,-.77,-.49],[x*1.23,-1.12,-.28]],.014,'hairLight',.03);}
 function hatBrim(parent,r,y,mat){const h=mesh(parent,new T.CylinderGeometry(r,r,.045,48),mat,[0,y,0],[1,1,.8]);const rim=ring(parent,0,y,0,r,'gold',.014);rim.rotation.x=Math.PI/2;rim.scale.y=.8;return h;}
 if(d.kind==='witch'&&!d.hat){hatBrim(head,.88,.55,'coat');const hatPoints=[[0,.55,0],[.03,.84,-.02],[-.08,1.02,-.07],[-.3,1.17,-.07],[-.4,1.1,-.07]];curve(head,hatPoints,.51,'coat',.015);for(let j=0;j<5;j++)star(head,-.3+j*.13,.67+(j%2)*.15,.42,.07,'goldLight',4);const bow=new T.Group();head.add(bow);bow.position.set(-.57,.65,.17);for(const s of[-1,1])ell(bow,'accent',[s*.13,0,0],[.17,.11,.055]);gem(bow,0,0,.07,.08,'gold');curve(head,[[-.64,.52,0],[-.79,.22,.02],[-.73,-.01,.04]],.012,'gold');star(head,-.73,-.1,.04,.1);}
 if(d.hat==='beret'){ell(head,'coat',[0,.56,-.04],[.65,.18,.51]);curve(head,[[-.48,.53,.32],[0,.61,.45],[.48,.53,.32]],.018,'gold');star(head,-.34,.65,.42,.105);}
 if(d.hat==='feather'){hatBrim(head,.7,.52,'coat');ell(head,'coat',[0,.65,-.04],[.46,.3,.39]);for(let j=0;j<3;j++)feather(head,-.43,.55,0,.4+j*.2,.57+j*.1);star(head,-.44,.59,.35,.11);}
 if(d.ears)for(const s of[-1,1]){const e=mesh(head,new T.ConeGeometry(.22,.48,3),'hair',[s*.43,.67,0]);e.rotation.z=-s*.25;const pink=mesh(head,new T.ConeGeometry(.13,.3,3),'blush',[s*.43,.7,.11]);pink.rotation.z=-s*.25;}if(d.ears)curve(body,[[0,1,-.15],[-.48,1.15,-.45],[-.86,1.55,-.42],[-1.0,1.49,-.32]],.13,'hair',.8);
 if(d.horns)for(const s of[-1,1])curve(head,[[s*.43,.42,0],[s*.61,.64,0],[s*.56,.87,.02]],.11,'gold',.01);
 if(d.hood){mesh(head,new T.SphereGeometry(.68,20,16,0,Math.PI),'coat',[0,.06,-.12],[1,1.1,1]);curve(head,[[-.64,-.28,.06],[-.58,.32,.1],[0,.76,.05],[.58,.32,.1],[.64,-.28,.06]],.025,'gold');}
 if(d.antlers)for(const s of[-1,1]){curve(head,[[s*.5,.42,-.15],[s*.79,.63,-.14],[s*.87,1.03,-.12]],.07,'wood',.25);curve(head,[[s*.76,.61,-.14],[s*1.02,.72,-.14],[s*1.08,.92,-.12]],.05,'wood',.2);}
 if(d.kind==='garden'){for(const s of[-1,1]){flower(head,s*.5,.36,.22,.11);flower(head,s*.57,.12,.16,.075);}flower(body,0,1.78,.33,.09);}
 if(d.feathers)for(let j=0;j<3;j++)feather(head,-.46,.31,0,.3+j*.25,.39+j*.05);
 if(d.glasses){for(const s of[-1,1])ring(head,s*.205,.015,.51,.158,'gold',.012);curve(head,[[-.05,.035,.52],[0,.055,.52],[.05,.035,.52]],.012,'gold');}
 // Character-specific hair, silhouette and facial accents from the 2D sheets.
 if(['ivy','faye'].includes(id)){
  for(const s of[-1,1]){const braid=new T.Group();braid.position.set(s*.53,-.3,-.13);head.add(braid);
   for(let k=0;k<6;k++){const y=-k*.17;ell(braid,'hair',[s*(.08+k*.027),y,-.14],[.15-k*.012,.12-k*.005,.13]);}
   ring(braid,s*.22,-.95,-.12,.065,'gold',.024);}
 }
 if(['luna','nova','zephyr'].includes(id)){
  for(const s of[-1,1])for(let k=0;k<4;k++){
   const x=s*(.5+k*.14),y=-.45-k*.18;
   curve(head,[[x,y,-.3],[x+s*.22,y-.2,-.3],[x+s*.13,y-.45,-.23],[x-s*.04,y-.5,-.16]],.09,'hair',.03);
  }
 }
 if(['kai','ember','sol','atlas'].includes(id)){
  for(let k=0;k<6;k++){const x=(k-2.5)*.18;curve(head,[[x*.72,.5,.13],[x,.7+(k%2)*.07,.22],[x+.05,.48,.49]],.095,'hair',.08);}
 }
 if(id==='raven'){for(let k=0;k<7;k++)feather(cape,-.8+k*.21,1.35,-.72,-.6+(k%3)*.28,.5);}
 if(id==='zephyr'){for(let k=0;k<5;k++)feather(cape,-.5+k*.23,1.6,-.58,.22+k*.14,.52);}
 if(id==='ivy')for(const s of[-1,1])flower(head,s*.49,.41,.32,.18);
 if(id==='sol')for(const s of[-1,1])ell(head,'blush',[s*.28,-.21,.44],[.085,.024,.016]);
 // Weapons are built per illustration and attached to the hands.
 const weapon=new T.Group();arms[1].add(weapon);weapon.position.set(.39,-.46,.35);
 if(['moon','star','flowers','leaf'].includes(d.weapon)){
 mesh(weapon,new T.CylinderGeometry(.033,.044,1.67,10),'wood',[.04,.37,0]);for(let j=0;j<4;j++)ring(weapon,.04,j*.29-.22,0,.06,'gold',.018).rotation.x=Math.PI/2;
 if(d.weapon==='moon'){const m=mesh(weapon,new T.TorusGeometry(.26,.055,8,32,Math.PI*1.55),'gold',[.04,1.29,0]);m.rotation.z=.72;gem(weapon,.08,1.29,.02,.14);}
 if(d.weapon==='star'){star(weapon,.04,1.25,0,.32,'gold',5);gem(weapon,.04,1.25,.07,.17);}
 if(d.weapon==='flowers'||d.weapon==='leaf'){ring(weapon,.04,1.21,0,.23,'wood',.045);for(let j=0;j<6;j++){const a=j*TAU/6;leaf(weapon,[[.04+Math.cos(a)*.23,1.21+Math.sin(a)*.23,0],[.04+Math.cos(a)*.38,1.21+Math.sin(a)*.38,0]],.065,'accent');}if(d.weapon==='flowers')flower(weapon,.04,1.23,.04,.17);else gem(weapon,.04,1.21,.04,.16);}
 }
 if(d.weapon==='bow'){
 curve(weapon,[[0,-.86,0],[.25,-.58,.04],[.29,-.32,.02],[0,0,0],[.29,.32,.02],[.25,.58,.04],[0,.86,0]],.038,'gold',1);curve(weapon,[[0,-.86,0],[-.09,0,0],[0,.86,0]],.006,'cream',1);for(const s of[-1,1]){gem(weapon,.24,s*.47,.04,.15);curve(weapon,[[.19,s*.31,.04],[.4,s*.54,.04],[.16,s*.68,.04]],.033,'accent',.05);}gem(weapon,0,-1.02,0,.11);
 const quiver=new T.Group();body.add(quiver);quiver.position.set(-.36,1.34,-.45);quiver.rotation.z=-.2;mesh(quiver,new T.CylinderGeometry(.12,.11,.53,12),'wood');for(let j=0;j<4;j++){mesh(quiver,new T.CylinderGeometry(.012,.012,.68,6),'gold',[(j-1.5)*.055,.32,0]);feather(quiver,(j-1.5)*.055,.55,0,0,.2);}}
 if(d.weapon==='sword'){
 const blade=new T.Shape();blade.moveTo(-.065,0);blade.lineTo(-.07,-.91);blade.lineTo(0,-1.15);blade.lineTo(.07,-.91);blade.lineTo(.065,0);blade.closePath();mesh(weapon,new T.ExtrudeGeometry(blade,{depth:.035,bevelEnabled:false}),'steel',[0,-.12,0]);curve(weapon,[[-.23,-.12,0],[0,-.07,0],[.23,-.12,0]],.03,'gold');gem(weapon,0,-.08,.05,.08,'gold');}
 if(d.weapon==='hammer'){mesh(weapon,new T.CylinderGeometry(.04,.045,1.1,10),'wood',[0,.3,0]);const hammer=mesh(weapon,new T.CylinderGeometry(.24,.24,.75,8),'steel',[0,.91,0]);hammer.rotation.z=Math.PI/2;for(const x of[-.3,0,.3]){const band=mesh(weapon,new T.CylinderGeometry(.255,.255,.07,8),'gold',[x,.91,0]);band.rotation.z=Math.PI/2;}gem(weapon,0,.91,.245,.18);}
 if(d.shield){const shield=new T.Group();arms[0].add(shield);shield.position.set(-.2,-.4,.18);shield.rotation.y=-.25;const points=[[-.39,.42],[0,.59],[.39,.42],[.32,-.17],[0,-.65],[-.32,-.17]];const sh=new T.Shape();points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();mesh(shield,new T.ExtrudeGeometry(sh,{depth:.065,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:1}),'accent');curve(shield,[...points,points[0]].map(([x,y])=>[x,y,.1]),.028,'gold',1);star(shield,0,0,.1,.26,'goldLight',8);gem(shield,0,0,.15,.1,'gold');}
 if(d.weapon==='flame')for(const arm of arms){ell(arm,'dark',[.12,-.46,.07],[.17,.15,.15]);for(let j=0;j<4;j++)curve(arm,[[.03+j*.06,-.44,.2],[.04+j*.06,-.22,.21],[.03+j*.06,-.08,.19]],.04,'gold',.02);}
 if(d.weapon==='book'){weapon.position.y+=.3;for(const s of[-1,1]){const page=mesh(weapon,new T.BoxGeometry(.3,.38,.055),'coat',[s*.15,.17,.2]);page.rotation.y=-s*.35;const pages=mesh(weapon,new T.BoxGeometry(.27,.34,.04),'cream',[s*.15,.17,.16]);pages.rotation.y=-s*.35;star(weapon,s*.15,.17,.24,.09);}}
 if(d.weapon==='lute'){const lute=new T.Group();body.add(lute);lute.position.set(0,1.4,.34);lute.rotation.z=-.5;ell(lute,'gold',[0,-.1,0],[.26,.34,.065]);ell(lute,'wood',[0,.04,.062],[.07,.08,.012]);mesh(lute,new T.BoxGeometry(.09,.55,.055),'wood',[0,.4,0]);for(let j=-2;j<=2;j++)curve(lute,[[j*.013,-.27,.078],[j*.013,.67,.06]],.003,'cream',1);}
 // Merge by material inside each animation pivot, reducing draw calls without freezing limbs.
 if(merge){const pivots=new Set([head,cape,...arms,...legs,body]);for(const group of pivots){group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),byMat=new Map();function collect(node){for(const o of node.children){if(pivots.has(o))continue;if(o.isMesh){if(!byMat.has(o.material))byMat.set(o.material,[]);byMat.get(o.material).push(o);}else collect(o);}}collect(group);for(const [mat,objects]of byMat){const geos=objects.map(o=>{const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;});const geo=mergeGeometries(geos,false);if(geo){objects.forEach(o=>o.removeFromParent());mesh(group,geo,mat);}geos.forEach(g=>g.dispose());}}}

 let walk=0;
 root.userData={id,design:d,body,head,arms,legs,cape,animate(t,speed=0,attack=0){walk+=(Math.min(speed,8)*.95+.1)*.016;const step=Math.sin(t*9),amount=Math.min(1,speed/3);body.position.y=Math.abs(step)*.055*amount;legs[0].rotation.x=step*.55*amount;legs[1].rotation.x=-step*.55*amount;arms[0].rotation.x=-step*.2*amount;arms[1].rotation.x=step*.2*amount-attack*.65;head.rotation.z=Math.sin(t*1.5)*.015;cape.rotation.x=-.06-amount*.11+Math.sin(t*3)*.025;}};
 return root;
}
