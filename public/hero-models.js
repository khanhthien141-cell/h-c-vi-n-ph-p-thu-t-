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
 sol:{iris:'#bb722f',skin:'#ffe4cb'},
 luna:{iris:'#a04bc9',skin:'#ffe4d6'},
 ivy:{iris:'#4d9b5f',skin:'#ffe2cc'},
 kai:{iris:'#4382d2',skin:'#ffe1d2'},
 ember:{iris:'#bc4758',skin:'#fdddc8'},
 nova:{iris:'#a366df',skin:'#ffe5d7'},
 sage:{iris:'#609854',skin:'#ffe0cf'},
 raven:{iris:'#b4539d',skin:'#ffe1d4'},
 atlas:{iris:'#48a8e9',skin:'#ffe7d6'},
 faye:{iris:'#cf5fa2',skin:'#ffe3d2'},
 milo:{iris:'#5a9663',skin:'#ffe2ce'},
 zephyr:{iris:'#41a4cf',skin:'#ffe7d8'}
};
function batchMobileHero(root,pivots){
 const material=new T.MeshPhongMaterial({
  vertexColors:true,side:T.DoubleSide,shininess:22,specular:'#444052'
 });
 root.updateMatrixWorld(true);
 const localMatrix=new T.Matrix4();
 for(const pivot of pivots){
  const inverse=pivot.matrixWorld.clone().invert(),parts=[],objects=[];
  function collect(parent){
   for(const child of parent.children){
    if(pivots.has(child))continue;
    if(!child.isMesh){collect(child);continue;}
    const geometry=child.geometry.clone().applyMatrix4(localMatrix.multiplyMatrices(inverse,child.matrixWorld));
    geometry.deleteAttribute('uv');
    const count=geometry.attributes.position.count;
    const shading=child.material.vertexColors?geometry.attributes.color:null;
    const finish=child.material,normal=geometry.attributes.normal;
    const rgb=finish.color,colors=new Float32Array(count*3);
    for(let index=0;index<count;index++){
     // Bake a soft highlight into gold, steel and crystals before batching.
     const highlight=finish.metalness*.24*Math.max(0,.45*normal.getX(index)+.75*normal.getY(index)+.48*normal.getZ(index));
     const glow=finish.emissiveIntensity*.14;
     colors[index*3]=rgb.r*((shading?shading.getX(index):1)+glow)+highlight;
     colors[index*3+1]=rgb.g*((shading?shading.getY(index):1)+glow)+highlight*.88;
     colors[index*3+2]=rgb.b*((shading?shading.getZ(index):1)+glow)+highlight*.67;
    }
    geometry.setAttribute('color',new T.BufferAttribute(colors,3));
    if(!geometry.index){
     const indices=count>65535?new Uint32Array(count):new Uint16Array(count);
     for(let index=0;index<count;index++)indices[index]=index;
     geometry.setIndex(new T.BufferAttribute(indices,1));
    }
    parts.push(geometry);
    objects.push(child);
   }
  }
  collect(pivot);
  if(!parts.length)continue;
  const geometry=mergeGeometries(parts);
  for(const part of parts)part.dispose();
  if(!geometry)continue;
  for(const object of objects)object.removeFromParent();
  pivot.add(new T.Mesh(geometry,material));
 }
}
export function createHeroModel(id,{merge=true,mobile=false}={}){
 const d=designs[id]||designs.luna,root=new T.Group();root.name=id;
 const faceStyle=faceStyles[id]||faceStyles.luna;
 const irisColor=new T.Color(faceStyle.iris);
 const eyeLight='#'+irisColor.clone().lerp(new T.Color('#e7f9ff'),.42).getHexString();
 const mixed=(color,toward,weight)=>'#'+new T.Color(color).lerp(new T.Color(toward),weight).getHexString();
 const mats={};for(const [k,color]of Object.entries({hair:d.hair,hairLight:mixed(d.hair,'#ffefdf',.28),hairShadow:mixed(d.hair,'#30263b',.2),coat:d.coat,coatShadow:mixed(d.coat,'#2e2342',.23),silk:mixed(d.accent,'#fff7df',.55),accent:d.accent,eye:faceStyle.iris,eyeLight,skin:faceStyle.skin,cream:'#fff4dd',gold:'#dca94b',goldLight:'#ffe0a0',dark:'#352335',white:'#fffaf4',blush:'#ef9b9f',steel:'#d5d8e7',wood:'#6f4733',crystal:mixed(faceStyle.iris,'#ffffff',.24),pearl:'#fff6e7'}))mats[k]=new T.MeshStandardMaterial({color,roughness:['gold','goldLight'].includes(k)?.30:['hair','hairLight','eye','eyeLight','silk','crystal'].includes(k)?.47:k==='skin'?.68:.75,metalness:['gold','goldLight'].includes(k)?.47:k==='steel'?.5:k==='crystal'?.14:0,emissive:k==='crystal'||k==='eyeLight'?color:'#000000',emissiveIntensity:k==='crystal'?.45:k==='eyeLight'?.14:0,side:T.DoubleSide});
 const body=new T.Group(),head=new T.Group(),cape=new T.Group(),arms=[],legs=[];body.name='Body';head.name='Head';cape.name='Cape';root.add(body);body.add(head,cape);head.position.y=2.28;
 function mesh(parent,geo,mat,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,mats[mat]||mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m;}
 const sphere=new T.SphereGeometry(1,mobile?12:24,mobile?8:16);
 const ell=(p,m,pos,s)=>mesh(p,sphere,m,pos,s);
 function curve(p,pts,r,mat,end=.3){
  const c=new T.CatmullRomCurve3(pts.map(V));
  const steps=mobile?Math.max(8,pts.length*3):Math.max(12,pts.length*5),sides=mobile?5:7;
  const geo=new T.TubeGeometry(c,steps,1,sides,false),a=geo.attributes.position;
  for(let row=0;row<=steps;row++){
   const t=row/steps,center=c.getPointAt(t);
   const radius=mat==='hair'?r*(.3+.8*Math.sin(Math.PI*t)**.55)*(1-t*.7):r*(1-(1-end)*t);
   for(let col=0;col<=sides;col++){
    const index=row*(sides+1)+col;
    a.setXYZ(index,center.x+(a.getX(index)-center.x)*radius,center.y+(a.getY(index)-center.y)*radius,center.z+(a.getZ(index)-center.z)*radius*(mat==='hair'?.55:1));
   }
  }
  geo.computeVertexNormals();
  return mesh(p,geo,mat);
 }
 // Closed, softly tapered locks with roots embedded in the scalp.
 function hairLock(parent,points,width,material='hair'){
  const path=new T.CatmullRomCurve3(points.map(V));
  const steps=mobile?10:16,sides=mobile?8:12;
  const geometry=new T.TubeGeometry(path,steps,1,sides,false);
  const position=geometry.attributes.position;
  for(let row=0;row<=steps;row++){
   const t=row/steps;
   const center=path.getPointAt(t),tangent=path.getTangentAt(t);
   const across=new T.Vector3(-tangent.y,tangent.x,0).normalize();
   const taper=Math.max(.003,Math.sin(Math.PI*t)**.64);
   const breadth=width*taper;
   for(let col=0;col<=sides;col++){
    const angle=col*TAU/sides,span=breadth*Math.cos(angle);
    position.setXYZ(row*(sides+1)+col,center.x+across.x*span,center.y+across.y*span,center.z+breadth*.43*Math.sin(angle));
   }
  }
  geometry.computeVertexNormals();
  return mesh(parent,geometry,material);
 }
 function strip(p,rows,mat){const a=[],uv=[],idx=[];rows.forEach((r,i)=>{for(let j=0;j<2;j++){a.push(...r[j]);uv.push(j,i/(rows.length-1));}if(i){let n=i*2;idx.push(n-2,n-1,n,n-1,n+1,n);}});const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(p,g,mat);}
 function star(p,x,y,z,r=.13,mat='gold',points=5){const shape=new T.Shape();for(let i=0;i<points*2;i++){const a=i*Math.PI/points+Math.PI/2,q=i%2?r*.43:r;const px=x+Math.cos(a)*q,py=y+Math.sin(a)*q;i?shape.lineTo(px,py):shape.moveTo(px,py);}shape.closePath();return mesh(p,new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.012}),mat,[0,0,z]);}
 function gem(p,x,y,z,r=.12,mat='accent'){return mesh(p,new T.OctahedronGeometry(r,0),mat,[x,y,z],[.8,1.35,.6]);}
 function ring(p,x,y,z,r=.12,mat='gold',tube=.018){return mesh(p,new T.TorusGeometry(r,tube,mobile?4:6,mobile?14:28),mat,[x,y,z]);}
 function flower(p,x,y,z,s=.12){for(let i=0;i<5;i++){const a=i*TAU/5;ell(p,'cream',[x+Math.cos(a)*s*.7,y+Math.sin(a)*s*.7,z],[s*.6,s*.6,.038]);}ell(p,'gold',[x,y,z+.04],[s*.35,s*.35,.04]);}
 function leaf(p,pts,r=.1,mat='accent'){return curve(p,pts,r,mat,.02);}
 function pearls(p,pts,r=.025,mat='pearl'){for(const pt of pts)ell(p,mat,pt,[r,r,r]);}
 function flourish(p,x,y,z,s=1,mat='goldLight'){
  // Symmetric filigree made from small raised curves, not image decals.
  for(const side of[-1,1]){
   curve(p,[[x,y,z],[x+side*.09*s,y+.07*s,z+.01],[x+side*.12*s,y+.17*s,z],[x+side*.05*s,y+.19*s,z]],.009*s,mat);
   gem(p,x+side*.10*s,y+.10*s,z+.025,.027*s,'crystal');
  }
  pearls(p,[[x,y+.02*s,z+.032],[x,y+.22*s,z+.015]],.025*s);
 }
 function feather(p,x,y,z,angle=0,s=.45){const f=new T.Group();p.add(f);f.position.set(x,y,z);f.rotation.z=angle;ell(f,'cream',[0,s*.45,0],[s*.17,s*.6,.035]);curve(f,[[0,0,.04],[0,s*.55,.045],[0,s,.02]],.012,'gold');for(let j=1;j<5;j++)for(const side of[-1,1])curve(f,[[0,j*s/6,.043],[side*s*.12,(j+.7)*s/6,.04]],.006,'accent');}
 // Luna's outfit follows the reference silhouette: fitted bodice, a pleated
 // cream skirt, and two long purple front panels separated above the knees.
 if(id==='luna'){
  function cloth(parent,material,position,rows=14,columns=36){
   const points=[],faces=[];
   for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    points.push(...position(row/rows,col/columns));
    if(row&&col){const i=row*(columns+1)+col;faces.push(i-columns-2,i-columns-1,i-1,i-columns-1,i,i-1);}
   }
   const surface=new T.BufferGeometry();
   surface.setAttribute('position',new T.Float32BufferAttribute(points,3));
   surface.setIndex(faces);surface.computeVertexNormals();
   return mesh(parent,surface,material);
  }
  function skirt(t,u,offset=0){
   const a=u*TAU,fold=Math.cos(a*12)*.026*t;
   const radius=.30+.30*t**.8+fold+offset;
   return [Math.sin(a)*radius,1.32-.49*t+Math.cos(a*12)*.024*t*t,Math.cos(a)*radius*.76+.055];
  }
  cloth(body,'cream',skirt);
  cloth(body,'silk',(t,u)=>{const point=skirt(.87+t*.13,u,.012);point[1]-=.052*t;return point;});
  curve(body,Array.from({length:61},(_,i)=>skirt(.84,i/60,.014)),.009,'goldLight',1);
  mesh(body,new T.LatheGeometry([[.32,0],[.28,.16],[.30,.32],[.36,.46],[.29,.54]].map(([r,y])=>new T.Vector2(r,y)),32),'coat',[0,1.27,0],[1,1,.73]);
  mesh(body,new T.CylinderGeometry(.314,.32,.077,32),'wood',[0,1.32,0],[1,1,.78]);
  ring(body,0,1.318,.256,.080,'gold',.018);
  gem(body,0,1.318,.287,.036,'crystal');
  for(const side of [-1,1]){
   const lapel=new T.Group();body.add(lapel);lapel.position.set(side*.16,1.73,.245);lapel.rotation.z=side*.39;
   ell(lapel,'cream',[0,0,0],[.18,.092,.033]);
   curve(lapel,[[-.16,-.021,.021],[0,-.078,.03],[.16,-.021,.02]],.011,'goldLight',1);
   const bow=ell(body,'accent',[side*.116,1.67,.296],[.142,.065,.046]);bow.rotation.z=side*.26;
   curve(body,[[side*.04,1.62,.342],[side*.07,1.51,.324],[side*.126,1.44,.27]],.022,'silk',.18);
  }
  gem(body,0,1.67,.343,.075,'goldLight');gem(body,0,1.67,.378,.043,'crystal');
  function mantle(t,u,extra=0){
   const gap=.25+.60*t;
   const a=gap+u*(TAU-2*gap),fold=.043*Math.sin(a*7)*t;
   const radius=.35+.62*t+fold+extra;
   const hem=.29+.21*Math.sin(Math.PI*u)**2+.055*Math.cos(a*4);
   return [Math.sin(a)*radius,1.79-(1.79-hem)*t,Math.cos(a)*radius*.79-.035-.07*t];
  }
  cloth(cape,'coat',(t,u)=>mantle(t,u));
  cloth(cape,'silk',(t,u)=>mantle(.94+.06*t,u,.012));
  curve(cape,Array.from({length:51},(_,i)=>mantle(.94,i/50,.024)),.013,'gold',1);
  for(const side of [0,1]){
   curve(cape,Array.from({length:18},(_,i)=>mantle(i/17,side,.021)),.018,'goldLight',1);
   const sign=side? -1:1;
   for(let j=0;j<3;j++){
    const [x,y,z]=mantle(.67+j*.091,side?.965:.035,.03);
    const stitch=new T.Group();cape.add(stitch);stitch.position.set(x,y,z);stitch.rotation.y=sign*.67;
    star(stitch,0,0,0,.056,'goldLight',4);
    curve(stitch,[[-.07,-.04,.016],[0,-.112,.018],[.07,-.04,.016]],.008,'gold',.8);
   }
  }
 }else{
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
 for(const side of[-1,1]){
  // Fine hand-stitched trim over the chest, readable even from the hero viewer.
  flourish(body,side*.255,1.35,.316,.57,'goldLight');
  curve(body,[[side*.10,1.82,.29],[side*.17,1.91,.19],[side*.27,1.90,.12]],.011,'gold');
  pearls(body,[[side*.15,1.76,.30],[side*.22,1.70,.30],[side*.29,1.61,.285]],.019);
 }
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
 }
 // Separate articulated boots and shoulders; no floating capsule body.
 for(const side of[-1,1]){const leg=new T.Group();leg.position.set(side*.23,1.02,0);body.add(leg);leg.name=side<0?'Left_leg':'Right_leg';legs.push(leg);mesh(leg,new T.CylinderGeometry(.12,.10,.49,12),'skin',[0,-.22,0]);mesh(leg,new T.CylinderGeometry(.135,.115,.4,12),'dark',[0,-.57,0]);ell(leg,'dark',[0,-.85,.11],[.16,.12,.25]);mesh(leg,new T.CylinderGeometry(.15,.15,.04,12),'gold',[0,-.4,0]);curve(leg,[[-.11,-.74,.14],[0,-.65,.15],[.11,-.74,.14]],.018,'gold');curve(leg,[[-.13,-.86,.25],[0,-.88,.33],[.13,-.86,.25]],.016,'gold');gem(leg,0,-.48,.13,.07,'goldLight');if(d.kind==='knight'){ell(leg,'steel',[0,-.31,.11],[.16,.16,.095]);star(leg,0,-.31,.21,.095,'gold',4);}for(let j=0;j<2;j++){curve(leg,[[-.105,-.56-j*.105,.127],[0,-.60-j*.105,.145],[.105,-.56-j*.105,.127]],.007,'goldLight');}ring(leg,0,-.49,.142,.062,'gold',.009);}
 for(const side of[-1,1]){const arm=new T.Group();arm.position.set(side*.36,1.69,0);body.add(arm);arm.name=side<0?'Left_arm':'Right_arm';arms.push(arm);arm.rotation.z=side*.2;if(id==='luna'){
   const sleeve=mesh(arm,new T.LatheGeometry([[.219,0],[.207,.055],[.178,.145],[.145,.258],[.129,.37],[.13,.42]].map(([r,h])=>new T.Vector2(r,h)),26),'cream',[side*.12,-.421,.015]);
   sleeve.rotation.z=side*.12;
   const cuff=mesh(arm,new T.CylinderGeometry(.215,.225,.046,26,1,true),'accent',[side*.12,-.4,.015]);cuff.rotation.z=side*.12;
   const cuffTrim=ring(arm,side*.12,-.424,.015,.22,'gold',.014);cuffTrim.rotation.set(Math.PI/2,0,side*.12);
   for(let j=0;j<3;j++)star(arm,side*.12+(j-1)*.083,-.345,.198,.036,'goldLight',4);
  }else{
   mesh(arm,new T.CylinderGeometry(.15,.23,.43,14),'cream',[side*.12,-.2,.015]);
   mesh(arm,new T.CylinderGeometry(.23,.23,.05,14),'gold',[side*.12,-.42,.015]);
  }ell(arm,'skin',[side*.12,-.49,.04],[.115,.125,.105]);ell(arm,'coat',[side*.05,-.015,0],[.23,.095,.22]);curve(arm,[[side*-.11,-.03,.16],[side*.07,-.09,.2],[side*.25,-.03,.14]],.018,'gold');if(d.fur)for(let j=0;j<6;j++)ell(arm,'cream',[(j-2)*.065,0,.08],[.07,.085,.13]);gem(arm,side*.11,-.19,.167,.06,'silk');for(let j=0;j<3;j++)curve(arm,[[side*(.01+j*.065),-.35,.14],[side*(.045+j*.065),-.29,.15]],.006,'goldLight');}
 // All heroes share Luna's face geometry. Make-up, irises and lashes
 // follow the surface so the features stay flush from the side.
 {
  const profile=y=>1-.16*Math.max(0,-y/.52)+.03*Math.exp(-Math.pow((y+.12)/.16,2));
  const faceDepth=(x,y)=>.475*Math.sqrt(Math.max(0,1-(y/.52)**2-(x/(.55*profile(y)))**2));
  const face=new T.SphereGeometry(1,mobile?28:40,mobile?18:28),vertices=face.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const y=vertices.getY(i)*.52;
   vertices.setXYZ(i,vertices.getX(i)*.55*profile(y),y,vertices.getZ(i)*.475);
  }
  face.computeVertexNormals();mesh(head,face,'skin');
  function faceOval(x,y,rx,ry,material,lift,tilt=0){
   const geometry=new T.CircleGeometry(1,40),points=geometry.attributes.position;
   for(let i=0;i<points.count;i++){
    const u=points.getX(i)*rx,v=points.getY(i)*ry;
    const px=x+u,py=y+v+tilt*u;
    points.setXYZ(i,px,py,faceDepth(px,py)+lift);
   }
   geometry.computeVertexNormals();mesh(head,geometry,material);
  }
  function faceLine(points,r,material,lift=.018){
   curve(head,points.map(([x,y])=>[x,y,faceDepth(x,y)+lift]),r,material,.42);
  }
  for(const side of [-1,1]){
   const x=side*.211,y=-.014;
   ell(head,'skin',[side*.52,-.11,.025],[.082,.113,.087]);
   faceOval(x,y,.135,.118,'dark',.011,.15*side);
   faceOval(x,y-.007,.123,.108,'white',.013,.15*side);
   faceOval(x-side*.013,y-.009,.091,.096,'dark',.015);
   faceOval(x-side*.013,y-.014,.083,.088,'eye',.017);
   faceOval(x-side*.013,y-.043,.068,.057,'eyeLight',.019);
   faceOval(x-side*.013,y-.010,.042,.063,'dark',.021);
   faceOval(x-.030,y+.043,.027,.028,'white',.023);
   faceOval(x+.034,y-.048,.012,.017,'pearl',.023);
   faceLine([[side*.088,.014],[side*.146,.085],[side*.225,.108],[side*.31,.073],[side*.355,.082]],.015,'dark');
   faceLine([[side*.139,.162],[side*.221,.19],[side*.295,.170]],.009,'hairShadow');
   faceOval(side*.319,-.161,.064,.027,'blush',.011,.09*side);
  }
  ell(head,'skin',[0,-.116,.458],[.037,.032,.026]);
  faceLine([[-.056,-.231],[-.028,-.253],[.005,-.259],[.041,-.246],[.058,-.229]],.009,'dark',.013);
  faceOval(0,-.268,.023,.007,'blush',.014);
 }
 // Sculpt the locks into the cap itself. Each rib meets the next at a
 // shallow seam, so even the grooves retain a continuous hair surface.
 function scalp(){
  const shortHair=!d.long;
  const sweep={sol:.36,ivy:-.21,kai:.31,ember:.49,nova:-.28,sage:.14,
   raven:-.31,atlas:-.40,faye:.19,milo:.27,zephyr:.41,luna:-.32}[id]||0;
  const locks=shortHair?13:15,bands=mobile?21:33,segments=locks*(mobile?7:12);
  const points=[],colors=[],indices=[];
  for(let row=0;row<=bands;row++){
   const v=row/bands,tip=Math.pow(v,6);
   for(let col=0;col<=segments;col++){
    const angle=(col%segments)*TAU/segments,front=Math.cos(angle);
    const phase=locks*(angle+v*sweep)+.43*Math.sin(3*angle);
    const flute=(1+Math.cos(phase))/2;
    const rib=flute**.62;
    const edge=1.72-.53*Math.max(0,front)+.59*Math.max(0,-front);
    const scallop=(flute-.46)*.112*tip;
    const phi=Math.max(.0001,edge*v+scallop);
    const rise=Math.sin(Math.PI*v/2)**.88;
    const radius=1.012+(.085*rib+.013)*rise;
    points.push(
     .560*Math.sin(phi)*Math.sin(angle)*radius,
     .048+.550*Math.cos(phi)*radius,
     -.027+.503*Math.sin(phi)*front*radius
    );
    const groove=(.81+.16*rib+.025*Math.sin(phase))*rise+1-rise;
    colors.push(groove,groove,groove);
    if(row&&col){
     const i=row*(segments+1)+col;
     indices.push(i-segments-2,i-1,i-segments-1,i-segments-1,i-1,i);
    }
   }
  }
  const surface=new T.BufferGeometry();
  surface.setAttribute('position',new T.Float32BufferAttribute(points,3));
  surface.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  surface.setIndex(indices);
  surface.computeVertexNormals();
  const normals=surface.attributes.normal;
  const seamNormal=new T.Vector3();
  for(let row=0;row<=bands;row++){
   const first=row*(segments+1),last=first+segments;
   seamNormal.set(normals.getX(first)+normals.getX(last),normals.getY(first)+normals.getY(last),normals.getZ(first)+normals.getZ(last)).normalize();
   normals.setXYZ(first,seamNormal.x,seamNormal.y,seamNormal.z);
   normals.setXYZ(last,seamNormal.x,seamNormal.y,seamNormal.z);
  }
  const material=mats.hair.clone();material.vertexColors=true;
  mesh(head,surface,material).name='Continuous layered hair';
 }
 scalp();
 for(const side of [-1,1]){
  const tipY=d.long?-.25:-.115;
  hairLock(head,[[side*.35,.40,.13],[side*.465,.29,.172],
   [side*.545,.13,.127],[side*.554,.015,.037],[side*.524,tipY,.014]],.116);
  hairLock(head,[[side*.373,.39,-.13],[side*.478,.27,-.167],
   [side*.55,.10,-.137],[side*.556,-.01,-.119],[side*.512,tipY-.048,-.156]],.111);
 }
 function backLocks(hairPaths){
  const backAxis=new T.Vector3(0,0,1);
  const rearHairMaterial=mats.hair.clone();
  rearHairMaterial.vertexColors=true;
  for(const [index,{points,width,depth,steps=24}] of hairPaths.entries()){
   const path=new T.CatmullRomCurve3(points.map(V));
   const edgeShade=(index===0||index===hairPaths.length-1) ? .90 : 1;
   const segments=mobile?Math.max(10,Math.ceil(steps*.6)):steps,sides=mobile?12:24;
   const surface=new T.TubeGeometry(path,segments,1,sides,false);
   const positions=surface.attributes.position,colors=[];
   for(let row=0;row<=segments;row++){
    const t=row/segments,center=path.getPointAt(t),forward=path.getTangentAt(t);
    const across=new T.Vector3().crossVectors(forward,backAxis).normalize();
    const outward=new T.Vector3().crossVectors(forward,across).normalize();
    const rootBlend=Math.min(1,.12+t*7);
    const widthAt=width*rootBlend*(1+.24*Math.sin(Math.PI*t))*Math.max(.012,(1-t)**.37);
    for(let col=0;col<=sides;col++){
     const angle=col*TAU/sides;
     // Fine grooves run along the length of the lock and taper at its tip.
     const ridge=Math.cos(angle*5+index*.59+t*1.3);
     const thickness=depth*rootBlend*(1+.36*Math.sin(Math.PI*t))*(1-t)**.46+.002;
     const pt=center.clone().addScaledVector(across,widthAt*Math.cos(angle)).addScaledVector(outward,(thickness+ridge*.006*Math.sin(Math.PI*t))*Math.sin(angle));
     positions.setXYZ(row*(sides+1)+col,pt.x,pt.y,pt.z);
     const sheen=(.92+ridge*.055+Math.sin(angle)*.025)*edgeShade;
     colors.push(sheen,sheen,sheen);
    }
   }
   surface.setAttribute('color',new T.Float32BufferAttribute(colors,3));
   surface.computeVertexNormals();
   mesh(head,surface,rearHairMaterial).name='Back hair '+(index+1);
  }
 }
 if(id==='luna'){
  // Continuous tapered curls with an oval cross-section. Narrower ribbons
  // in the same S-curves separate highlights from the shadowed underlayer.
  function curl(points,width,depth,material){
   const path=new T.CatmullRomCurve3(points.map(V));
   const segments=mobile?16:28,sides=mobile?8:12,frame=path.computeFrenetFrames(segments,false);
   const geometry=new T.TubeGeometry(path,segments,1,sides,false);
   const position=geometry.attributes.position;
   for(let i=0;i<=segments;i++){
    const t=i/segments,center=path.getPointAt(t);
    const taper=(.65+.48*Math.sin(Math.PI*t))*Math.pow(1-t,.42)+.012;
    for(let j=0;j<=sides;j++){
     const a=j*TAU/sides;
     const vertex=center.clone().addScaledVector(frame.normals[i],-Math.cos(a)*width*taper).addScaledVector(frame.binormals[i],Math.sin(a)*depth*taper);
     position.setXYZ(i*(sides+1)+j,vertex.x,vertex.y,vertex.z);
    }
   }
   geometry.computeVertexNormals();mesh(head,geometry,material);
  }
  // Curve the roots over the crown and under the tilted brim, then carry
  // each lock all the way down the back. A short underlayer closes the
  // seams near the scalp while the independent tips remain visible.
  ell(head,'hair',[0,-.17,-.29],[.47,.53,.248]);
  curl([[.025,.43,-.32],[.065,.13,-.49],[.07,-.23,-.57],[.15,-.58,-.61],[.14,-.93,-.67],[.19,-1.22,-.7],[.31,-1.27,-.66]],.158,.123,'hairShadow');
  const rearLocks=[
   {x:-.36,root:-.21,flow:-1,tip:-1.27},
   {x:-.20,root:-.11,flow:-1,tip:-1.43},
   {x:-.025,root:.02,flow:1,tip:-1.55},
   {x:.16,root:.13,flow:1,tip:-1.44},
   {x:.34,root:.23,flow:1,tip:-1.30}
  ];
  backLocks(rearLocks.map(({x,root,flow,tip})=>{
   const side=x<0?-1:1;
   return {width:.137,depth:.075,steps:30,points:[
    [root,.46,-.225],[root*1.35,.38,-.387],[x,.22,-.50],
    [x-flow*.038,-.13,-.57],[x+flow*.078,-.48,-.655],
    [x+flow*.115,-.82,-.762],[x+flow*.015,-1.05,-.823],
    [x+flow*.065,tip+.035,-.818],[x+side*.23,tip,-.726],
    [x+side*.29,tip+.14,-.65]
   ]};
  }));
  const fringe=[
   [[-.38,.48,.28],[-.43,.35,.42],[-.44,.17,.49],[-.373,.048,.46]],
   [[-.26,.53,.30],[-.29,.41,.45],[-.34,.27,.50],[-.408,.128,.46]],
   [[-.11,.55,.32],[-.12,.43,.47],[-.204,.275,.53],[-.284,.145,.499]],
   [[.072,.54,.33],[.054,.426,.487],[-.039,.284,.535],[-.14,.146,.516]],
   [[.17,.52,.33],[.235,.39,.476],[.285,.27,.49],[.321,.132,.446]],
   [[.29,.46,.29],[.38,.36,.40],[.424,.25,.42],[.465,.11,.34]]
  ];
  fringe.forEach((points,index)=>{
   hairLock(head,points,index===3?.145:.118,'hair');

  });
  for(const side of [-1,1]){
   for(let layer=0;layer<3;layer++){
    const base=.36+.135*layer,z=-.47+.13*layer;
    const points=[[side*.25,.38,-.21],[side*.35,.23,z*.85],[side*(base+.06),.055,z],[side*(base-.045),-.34,z+.01],[side*(base+.21),-.64,z+.01],[side*(base+.36),-.91,z+.035],[side*(base+.23),-1.13,z+.10],[side*(base+.33),-1.33,z+.10],[side*(base+.60),-1.36+.08*layer,z+.15],[side*(base+.65),-1.18+.09*layer,z+.18]];
    curl(points,.161,.151,layer===0?'hairShadow':'hair');

   }
   const cheek=[[side*.34,.34,.21],[side*.419,.25,.25],[side*.49,.01,.245],[side*.47,-.265,.253],[side*.56,-.47,.18],[side*.66,-.45,.16],[side*.664,-.32,.18]];
   curl(cheek,.112,.096,'hair');

  }
 }else{
 // Sweep the fringe directly out of the front of the cap.
 const fringeSweep={sol:.061,ivy:-.046,kai:.083,ember:.092,nova:-.071,sage:.038,raven:-.093,atlas:-.068,faye:.052,milo:.069,zephyr:.11}[id]||0;
 for(let index=0;index<6;index++){
  const x=(index-2.5)*.149;
  hairLock(head,[
   [x*.66,.474,.215],[x*.875,.423,.387],
   [x+fringeSweep*.38,.322,.474],[x+fringeSweep,.194+(index%3)*.022,.445]
  ],.145);
 }
 // Back hair is shaped separately for each hero. The cap lies under the
 // locks and closes their roots around the crown and nape.
 const styles={
  sol:{length:.34,sweep:.075,volume:.066},
  ivy:{length:1.15,sweep:.080,volume:.085},
  kai:{length:.36,sweep:-.095,volume:.069},
  ember:{length:.42,sweep:.12,volume:.092},
  nova:{length:1.42,sweep:-.08,volume:.105},
  sage:{length:.41,sweep:.045,volume:.061},
  raven:{length:1.28,sweep:.085,volume:.096},
  atlas:{length:.46,sweep:-.12,volume:.090},
  faye:{length:1.02,sweep:-.060,volume:.084},
  milo:{length:.39,sweep:.063,volume:.079},
  zephyr:{length:1.47,sweep:.14,volume:.093}
 };
 const {length,sweep,volume}=styles[id]||styles.sol;
 const nape=length<.5;

 const count=nape?7:5;
 const paths=Array.from({length:count},(_,index)=>{
  const offset=(index-(count-1)/2)/((count-1)/2);
  const side=offset<0?-1:1;
  const x=offset*.394;
  const end=-length+Math.abs(offset)*.09+(index%2)*.032;
  if(nape)return {width:.104,depth:volume,steps:16,points:[
   [x*.54,.49,-.175],[x*.80,.36,-.364],[x,.19,-.457],
   [x+sweep*.34,-.047,-.525],[x+sweep*.62,end*.74,-.478],
   [x+sweep,end-.04,-.36-Math.abs(offset)*.012]
  ]};
  return {width:.145,depth:volume,points:[
   [x*.55,.49,-.203],[x*.81,.36,-.383],[x,.17,-.485],
   [x-sweep*.35,-.12,-.572],[x+side*.028,-.44,-.658],
   [x+sweep+side*.036,end*.68,-.727],
   [x-sweep*.28,end*.90,-.766],[x+sweep+side*.083,end,-.732],
   [x+sweep+side*.153,end+.13,-.654]
  ]};
 });
 // Tuck Sage's rear strands inside the hood lining.
 if(d.hood)for(const lock of paths)lock.points=lock.points.map(([x,y,z])=>[x*.92,y,z+.077]);
 backLocks(paths);
 if(d.long){
  for(const side of [-1,1]){
   hairLock(head,[[side*.33,.36,.14],[side*.47,.18,.15],[side*.49,-.12,.13],[side*.53,-.37,.10],[side*.65,-.54,.04]],.17);
   if(id==='ivy'||id==='faye')continue;
   for(let i=0;i<2;i++){
    const spread=i*.105;
    hairLock(head,[[side*.36,.24,-.20],[side*(.44+spread),-.12,-.27],
     [side*(.49+spread),-.47,-.32],[side*(.61+spread),-.77,-.34],
     [side*(.72+spread),-1.05,-.30],[side*(.65+spread),-1.20,-.23]],.168);
   }
  }
 }
 }
 function hatBrim(parent,r,y,mat){const h=mesh(parent,new T.CylinderGeometry(r,r,.045,48),mat,[0,y,0],[1,1,.8]);const rim=ring(parent,0,y,0,r,'gold',.014);rim.rotation.x=Math.PI/2;rim.scale.y=.8;return h;}
 if(d.kind==='witch'&&!d.hat&&id!=='luna'){hatBrim(head,.88,.55,'coat');const hatPoints=[[0,.55,0],[.03,.84,-.02],[-.08,1.02,-.07],[-.3,1.17,-.07],[-.4,1.1,-.07]];curve(head,hatPoints,.51,'coat',.015);for(let j=0;j<5;j++)star(head,-.3+j*.13,.67+(j%2)*.15,.42,.07,'goldLight',4);const bow=new T.Group();head.add(bow);bow.position.set(-.57,.65,.17);for(const s of[-1,1])ell(bow,'accent',[s*.13,0,0],[.17,.11,.055]);gem(bow,0,0,.07,.08,'gold');curve(head,[[-.64,.52,0],[-.79,.22,.02],[-.73,-.01,.04]],.012,'gold');star(head,-.73,-.1,.04,.1);}
 if(d.hat==='beret'){ell(head,'coat',[0,.56,-.04],[.65,.18,.51]);curve(head,[[-.48,.53,.32],[0,.61,.45],[.48,.53,.32]],.018,'gold');star(head,-.34,.65,.42,.105);}
 if(d.hat==='feather'){hatBrim(head,.7,.52,'coat');ell(head,'coat',[0,.65,-.04],[.46,.3,.39]);for(let j=0;j<3;j++)feather(head,-.43,.55,0,.4+j*.2,.57+j*.1);star(head,-.44,.59,.35,.11);}
 if(d.ears)for(const s of[-1,1]){const e=mesh(head,new T.ConeGeometry(.22,.48,3),'hair',[s*.43,.67,0]);e.rotation.z=-s*.25;const pink=mesh(head,new T.ConeGeometry(.13,.3,3),'blush',[s*.43,.7,.11]);pink.rotation.z=-s*.25;}if(d.ears)curve(body,[[0,1,-.15],[-.48,1.15,-.45],[-.86,1.55,-.42],[-1.0,1.49,-.32]],.13,'hair',.8);
 if(d.horns)for(const s of[-1,1])curve(head,[[s*.43,.42,0],[s*.61,.64,0],[s*.56,.87,.02]],.11,'gold',.01);
 if(d.hood){mesh(head,new T.SphereGeometry(.68,32,24,Math.PI,Math.PI),'coat',[0,.06,.055],[1.055,1.1,1.13]);curve(head,[[-.64,-.28,.06],[-.58,.32,.1],[0,.76,.05],[.58,.32,.1],[.64,-.28,.06]],.025,'gold');}
 if(d.antlers)for(const s of[-1,1]){curve(head,[[s*.5,.42,-.15],[s*.79,.63,-.14],[s*.87,1.03,-.12]],.07,'wood',.25);curve(head,[[s*.76,.61,-.14],[s*1.02,.72,-.14],[s*1.08,.92,-.12]],.05,'wood',.2);}
 if(d.kind==='garden'){for(const s of[-1,1]){flower(head,s*.5,.36,.22,.11);flower(head,s*.57,.12,.16,.075);}flower(body,0,1.78,.33,.09);}
 if(d.feathers)for(let j=0;j<3;j++)feather(head,-.46,.31,0,.3+j*.25,.39+j*.05);
 if(d.glasses){for(const s of[-1,1])ring(head,s*.205,.015,.51,.158,'gold',.012);curve(head,[[-.05,.035,.52],[0,.055,.52],[.05,.035,.52]],.012,'gold');}
 // Character-specific hair, silhouette and facial accents from the 2D sheets.
 if(id==='ivy'||id==='faye'){
  for(const side of [-1,1]){
   const braidPath=new T.CatmullRomCurve3([[side*.37,.18,-.18],[side*.49,-.19,-.19],
    [side*.55,-.42,-.14],[side*.64,-.77,-.16],[side*.73,-1.15,-.22]].map(V));
   for(let j=0;j<10;j++){
    const t=j/11,center=braidPath.getPointAt(t);
    const sign=j%2?1:-1;
    center.x+=sign*.043;
    const section=ell(head,'hair',center.toArray(),[.135-t*.042,.12-t*.024,.103-t*.020]);
    section.rotation.z=sign*.54;
   }
   const tip=braidPath.getPointAt(.91);
   const tie=ring(head,tip.x,tip.y,tip.z,.075,'gold',.019);tie.rotation.x=Math.PI/2;
  }
 }
 if(id==='raven'){for(let k=0;k<7;k++)feather(cape,-.8+k*.21,1.35,-.72,-.6+(k%3)*.28,.5);}
 if(id==='zephyr'){for(let k=0;k<5;k++)feather(cape,-.5+k*.23,1.6,-.58,.22+k*.14,.52);}
 if(id==='ivy')for(const s of[-1,1])flower(head,s*.49,.41,.32,.18);
 if(id==='sol')for(const s of[-1,1])ell(head,'blush',[s*.28,-.21,.44],[.085,.024,.016]);
 // Distinct small 3D details traced from each supplied full-body portrait.
 // The flourishes use the same shared materials and merge with the hero mesh.
 if(id==='luna'){
  const hat=new T.Group();head.add(hat);
  hat.position.set(-.035,.55,-.035);hat.rotation.set(-.18,0,.24);
  const brim=mesh(hat,new T.SphereGeometry(1,48,16),'coat',[0,0,0],[.99,.064,.77]);
  brim.name='Velvet hat brim';
  ell(hat,'silk',[0,-.028,0],[.9,.044,.70]);
  const rim=ring(hat,0,0,0,.972,'gold',.014);rim.rotation.x=Math.PI/2;rim.scale.y=.78;
  const crown=mesh(hat,new T.LatheGeometry([[.61,0],[.57,.15],[.46,.32],[.34,.46],[.21,.58],[.08,.64],[0,.65]].map(([r,h])=>new T.Vector2(r,h)),40),'coat');
  const crownPositions=crown.geometry.attributes.position;
  for(let i=0;i<crownPositions.count;i++){
   const y=crownPositions.getY(i);
   crownPositions.setX(i,crownPositions.getX(i)-.94*y*y);
   crownPositions.setZ(i,crownPositions.getZ(i)*.85);
  }
  crown.geometry.computeVertexNormals();
  mesh(hat,new T.CylinderGeometry(.564,.588,.075,40),'accent',[-.012,.12,0],[1,1,.85]);
  const moon=mesh(hat,new T.TorusGeometry(.17,.037,10,34,Math.PI*1.54),'goldLight',[-.46,.205,.43]);moon.rotation.z=.74;
  gem(hat,-.445,.201,.455,.066,'crystal');
  const bow=new T.Group();hat.add(bow);bow.position.set(-.62,.1,.40);bow.rotation.z=.29;
  for(const side of [-1,1]){
   const loop=ell(bow,'accent',[side*.11,0,0],[.145,.083,.054]);loop.rotation.z=side*.28;
   strip(bow,[[[side*.035,-.02,.015],[side*.078,-.016,.015]],[[side*.06,-.26,.022],[side*.145,-.22,.035]],[[side*.105,-.42,.025],[side*.198,-.37,.009]]],'silk');
  }
  gem(bow,0,0,.056,.053,'goldLight');
  curve(hat,[[-.79,-.01,.23],[-.89,-.24,.245],[-.86,-.42,.251]],.010,'gold',.65);
  star(hat,-.86,-.47,.25,.085,'goldLight');

 }
 if(id==='nova'){
  for(let j=0;j<9;j++){const a=j*TAU/9;star(head,Math.cos(a)*.52,.71+Math.sin(a)*.10,.35,.045,'goldLight',5);}
  for(const s of[-1,1]){flourish(cape,s*.50,1.24,.24,.52,'goldLight');gem(head,s*.43,.79,.3,.055,'crystal');}
 }
 if(id==='ivy')for(const s of[-1,1]){
  curve(body,[[s*.28,1.57,.34],[s*.40,1.23,.34],[s*.53,.92,.23]],.014,'gold');
  for(let j=0;j<3;j++){leaf(body,[[s*(.31+j*.06),1.50-j*.19,.36],[s*(.47+j*.10),1.53-j*.19,.33]],.028,'accent');flower(body,s*(.33+j*.07),1.35-j*.16,.36,.055);}
 }
 if(id==='sage')for(const s of[-1,1]){
  for(let j=0;j<3;j++)leaf(head,[[s*(.54+j*.12),.6+j*.12,.08],[s*(.68+j*.12),.68+j*.13,.09]],.03,'accent');
  flourish(body,s*.24,1.28,.32,.50,'goldLight');
 }
 if(id==='sol')for(const s of[-1,1]){
  ell(head,'cream',[s*.43,.70,.13],[.067,.16,.018]);
  curve(body,[[s*.37,1.87,.23],[s*.46,1.73,.26],[s*.42,1.57,.26]],.026,'gold');
  star(body,s*.42,1.72,.27,.09,'goldLight',8);
 }
 if(id==='atlas')for(const s of[-1,1]){
  gem(body,s*.43,1.78,.29,.095,'crystal');
  curve(body,[[s*.28,1.96,.18],[s*.48,1.98,.19],[s*.58,1.79,.16]],.02,'goldLight');
 }
 if(id==='kai'){
  const badge=new T.Group();head.add(badge);badge.position.set(0,.57,.52);star(badge,0,0,0,.09,'goldLight');gem(badge,0,0,.04,.055,'crystal');
  for(const s of[-1,1])curve(body,[[s*.13,1.77,.3],[s*.27,1.6,.31],[s*.38,1.26,.28]],.017,'gold');
 }
 if(id==='raven')for(const s of[-1,1]){
  for(let j=0;j<4;j++)feather(cape,s*(.35+j*.17),1.33-j*.16,-.55-j*.06,s*.22,.38+j*.08);
  gem(head,s*.48,.37,.23,.09,'crystal');
 }
 if(id==='ember')for(const s of[-1,1]){
  for(let j=0;j<4;j++)curve(cape,[[s*(.22+j*.12),1.56,-.39],[s*(.4+j*.1),1.21,-.49],[s*(.57+j*.08),.73-j*.04,-.47]],.043,'gold',.02);
  gem(body,s*.37,1.75,.30,.09,'crystal');
 }
 if(id==='faye'){
  for(const s of[-1,1]){ring(head,s*.205,.015,.53,.16,'goldLight',.009);star(head,s*.49,.60,.32,.055,'goldLight');}
  flourish(cape,0,1.17,-.7,.9,'goldLight');
 }
 if(id==='milo'){
  flourish(body,0,1.16,.34,.8,'goldLight');
  for(let j=0;j<3;j++)star(head,-.48+j*.11,.76,.38,.055,'goldLight',4);
 }
 if(id==='zephyr')for(const s of[-1,1]){
  for(let j=0;j<4;j++){gem(cape,s*(.37+j*.12),1.56-j*.19,-.42,.055,'crystal');leaf(head,[[s*(.47+j*.07),.51+j*.06,.12],[s*(.6+j*.08),.73+j*.05,.11]],.03,'silk');}
 }
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
 if(merge&&mobile)batchMobileHero(root,new Set([head,cape,...arms,...legs,body]));
 else if(merge){const pivots=new Set([head,cape,...arms,...legs,body]);for(const group of pivots){group.updateWorldMatrix(true,true);const inverse=group.matrixWorld.clone().invert(),byMat=new Map();function collect(node){for(const o of node.children){if(pivots.has(o))continue;if(o.isMesh){if(!byMat.has(o.material))byMat.set(o.material,[]);byMat.get(o.material).push(o);}else collect(o);}}collect(group);for(const [mat,objects]of byMat){const geos=objects.map(o=>{const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;});const geo=mergeGeometries(geos,false);if(geo){objects.forEach(o=>o.removeFromParent());mesh(group,geo,mat);}geos.forEach(g=>g.dispose());}}}

 let walk=0;
 root.userData={id,design:d,body,head,arms,legs,cape,animate(t,speed=0,attack=0){walk+=(Math.min(speed,8)*.95+.1)*.016;const step=Math.sin(t*9),amount=Math.min(1,speed/3);body.position.y=Math.abs(step)*.055*amount;legs[0].rotation.x=step*.55*amount;legs[1].rotation.x=-step*.55*amount;arms[0].rotation.x=-step*.2*amount;arms[1].rotation.x=step*.2*amount-attack*.65;head.rotation.z=Math.sin(t*1.5)*.015;cape.rotation.x=-.06-amount*.11+Math.sin(t*3)*.025;}};
 return root;
}
