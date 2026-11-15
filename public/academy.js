import * as T from '/vendor/three.module.js';

const stone = '#ddc9dd', ivory = '#f5e3cc', shadow = '#755978';
const roof = '#564582', roofLight = '#8970ad', gold = '#c99554', brass = '#f1c985';
const glass = '#453666', violet = '#ae82db', pink = '#ef9ac8', aqua = '#79d4dd';
const materials = new Map();

function material(color) {
 if (!materials.has(color)) materials.set(color,new T.MeshStandardMaterial({
  color,roughness:.76,side:T.DoubleSide,emissive:color,
  emissiveIntensity:[pink,aqua,violet].includes(color)?.30:0
 }));
 return materials.get(color);
}

function add(parent, geometry, color, x=0,y=0,z=0) {
 const mesh=new T.Mesh(geometry,material(color));
 mesh.position.set(x,y,z);
 mesh.castShadow=true;
 parent.add(mesh);
 return mesh;
}

const block=(p,x,y,z,w,h,d,c)=>add(p,new T.BoxGeometry(w,h,d),c,x,y,z);
const taper=(p,x,y,z,top,bottom,h,c,sides=8)=>add(p,new T.CylinderGeometry(top,bottom,h,sides),c,x,y,z);
function section(p,x,z,yaw=0){
 const group=new T.Group();
 group.position.set(x,0,z);
 group.rotation.y=yaw;
 p.add(group);
 return group;
}

function archProfile(width, height, spring){
 const a=width/2;
 const path=new T.Shape();
 path.moveTo(-a,0);
 path.lineTo(a,0);
 path.lineTo(a,spring);
 path.quadraticCurveTo(a,spring+(height-spring)*.48,0,height);
 path.quadraticCurveTo(-a,spring+(height-spring)*.48,-a,spring);
 path.closePath();
 return path;
}

function arch(p,x,y,z,w,h,depth,trim,fill){
 const spring=h*.68;
 const outer=archProfile(w,h,spring);
 if(fill)add(p,new T.ShapeGeometry(outer),fill,x,y,z-.04);
 const inside=w/2, outside=inside+.21;
 const rim=new T.Shape();
 rim.moveTo(-outside,0);
 rim.lineTo(-outside,spring+.05);
 rim.quadraticCurveTo(-outside,spring+(h-spring)*.55,0,h+.31);
 rim.quadraticCurveTo(outside,spring+(h-spring)*.55,outside,spring+.05);
 rim.lineTo(outside,0);
 rim.lineTo(inside,0);
 rim.lineTo(inside,spring);
 rim.quadraticCurveTo(inside,spring+(h-spring)*.48,0,h);
 rim.quadraticCurveTo(-inside,spring+(h-spring)*.48,-inside,spring);
 rim.lineTo(-inside,0);
 rim.closePath();
 add(p,new T.ExtrudeGeometry(rim,{depth,steps:1,bevelEnabled:false,curveSegments:10}),trim,x,y,z);
}

// Shaped jambs and layered glass keep the window readable from the court.
function lancet(p,x,y,z,w,h,colors=[violet,aqua,pink]){
 arch(p,x,y,z,w,h,.14,ivory,glass);
 const palette=colors;
 for(const side of [-1,1]){
  add(p,new T.ShapeGeometry(archProfile(w*.41,h*.73,h*.51)),palette[side<0?0:1],x+side*w*.225,y+.12,z+.03);
  block(p,x+side*w*.54,y+h*.22,z+.19,.12,h*.53,.16,stone);
 }
 block(p,x,y+h*.40,z+.18,.075,h*.80,.10,gold);
 block(p,x,y+.10,z+.18,w,.10,.13,gold);
 const rose=add(p,new T.CircleGeometry(w*.17,16),palette[2],x,y+h*.78,z+.05);
 add(p,new T.TorusGeometry(w*.18,.03,5,18),gold,x,rose.position.y,z+.08);
 block(p,x,y-.08,z+.14,w+.49,.14,.39,ivory);
}

function gable(p,x,y,z,w,h,d){
 const shape=new T.Shape();
 shape.moveTo(-w/2,0);
 shape.lineTo(w/2,0);
 shape.lineTo(0,h);
 shape.closePath();
 return add(p,new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),roof,x,y,z-d);
}

function strap(p,x1,y1,x2,y2,z,thickness,c){
 const length=Math.hypot(x2-x1,y2-y1);
 const bar=block(p,(x1+x2)/2,(y1+y2)/2,z,length,thickness,thickness,c);
 bar.rotation.z=Math.atan2(y2-y1,x2-x1);
}

function clock(p,z,y){
 add(p,new T.CircleGeometry(1.16,32),shadow,0,y,z);
 add(p,new T.CircleGeometry(1.03,32),ivory,0,y,z+.03);
 add(p,new T.TorusGeometry(1.11,.084,6,32),gold,0,y,z+.07);
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  const mark=block(p,Math.sin(a)*.84,y+Math.cos(a)*.84,z+.1,.059,i%3?.11:.19,.06,shadow);
  mark.rotation.z=-a;
 }
 strap(p,0,y,.40,y+.27,z+.14,.075,roof);
 strap(p,0,y,-.20,y+.69,z+.14,.06,roof);
 add(p,new T.CircleGeometry(.13,12),gold,0,y,z+.18);
}

function turret(p,x,z,height,r){
 taper(p,x,0,z,r*1.13,r*1.18,.55,shadow,10);
 taper(p,x,height*.5,z,r,r*1.04,height,stone,10);
 for(const level of [.45,height*.51,height-.43,height]){
  taper(p,x,level,z,r*1.07,r*1.12,.18,ivory,10);
 }
 const wall=section(p,x,z);
 lancet(wall,0,height*.57,r*.957,r*.50,height*.26);
 for(const i of [-1,1]){
  const side=section(p,x,z,i*Math.PI/2);
  lancet(side,0,height*.60,r*.957,r*.40,height*.22,[aqua,violet,pink]);
 }
 // Stepped, slightly flared roof with gold ribs and a crystal finial.
 const points=[[r*1.25,0],[r*1.18,.25],[r*.9,1.17],[r*.55,2.43],[r*.23,3.67],[.07,4.42]];
 const crown=add(p,new T.LatheGeometry(points.map(([a,b])=>new T.Vector2(a,b)),10),roof,x,height,z);
 crown.rotation.y=Math.PI/10;
 for(const [size,lift] of [[r*1.21,.15],[r*.86,1.32],[r*.5,2.61]]){
  const band=add(p,new T.TorusGeometry(size,.049,5,10),roofLight,x,height+lift,z);
  band.rotation.x=-Math.PI/2;
 }
 taper(p,x,height+4.57,z,.07,.17,.48,gold,8);
 add(p,new T.OctahedronGeometry(.31),brass,x,height+5.07,z).scale.y=1.55;
}

function wing(p,x){
 const local=section(p,x,0);
 block(local,0,.50,-2.56,18.9,1,5.1,shadow);
 block(local,0,4.50,-2.75,18.6,8.2,5.06,stone);
 for(const y of [1,4.48,8.50])block(local,0,y,-2.64,19.14,.27,5.65,ivory);
 gable(local,0,8.57,.49,19.6,3.42,6.22);
 for(const s of [-1,1]){
  strap(local,0,12,s*9.8,8.58,.53,.16,roofLight);
 }
 const crest=add(local,new T.CircleGeometry(.63,24),glass,0,9.9,.52);
 add(local,new T.TorusGeometry(.63,.055,5,24),gold,0,crest.position.y,.56);
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3;
  add(local,new T.CircleGeometry(.13,10),i%2?aqua:violet,Math.cos(a)*.30,9.9+Math.sin(a)*.30,.57);
 }
 for(let i=-2;i<=2;i++){
  const bay=i*3.7;
  lancet(local,bay,1.08,.01,1.4,2.74);
  lancet(local,bay,4.84,.01,1.18,2.60,[aqua,violet,pink]);
  block(local,bay+1.81,4.55,-.02,.25,7.6,.40,ivory);
 }
}

function arcade(p,x,z,yaw,bays){
 const row=section(p,x,z,yaw);
 const stride=3.8;
 block(row,0,4.20,-.7,bays*stride+.35,.57,1.75,roof);
 block(row,0,4.53,-.69,bays*stride+.48,.13,1.82,gold);
 for(let j=0;j<=bays;j++){
  const a=(j-bays/2)*stride;
  block(row,a,.2,-.52,.83,.40,.82,stone);
  block(row,a,1.75,-.52,.54,3.0,.63,ivory);
  block(row,a,3.22,-.52,.76,.31,.81,gold);
 }
 for(let j=0;j<bays;j++){
  const a=(j-(bays-1)/2)*stride;
  arch(row,a,0,-.47,stride-.72,4.03,.35,ivory);
 }
}

function moon(p,x,y,z){
 const shape=new T.Shape();
 shape.absarc(0,0,.63,Math.PI*.22,Math.PI*1.78,false);
 shape.quadraticCurveTo(-.24,-.57,-.22,-.17);
 shape.quadraticCurveTo(-.29,.44,.48,.41);
 shape.closePath();
 add(p,new T.ExtrudeGeometry(shape,{depth:.09,bevelEnabled:false}),brass,x,y,z);
}

function gate(p,x,z,yaw){
 const entry=section(p,x,z,yaw);
 turret(entry,-6,-1.0,8,1.68);
 turret(entry,6,-1.0,8,1.68);
 arch(entry,0,0,0,9.6,8.45,.67,stone);
 arch(entry,0,0,.70,9.64,8.48,.19,ivory);
 arch(entry,0,0,.90,9.76,8.56,.10,gold);
 for(const s of [-1,1]){
  block(entry,s*5.03,.72,.29,.88,1.40,1.3,ivory);
  block(entry,s*5.03,4.22,.51,.70,.21,1.33,gold);
  block(entry,s*4.46,2.77,.90,.07,1.37,.12,gold);
  add(entry,new T.OctahedronGeometry(.30),aqua,s*4.46,3.45,.94).scale.y=1.45;
 }
 moon(entry,0,8.83,.97);
}

export function createAcademy(parent) {
 const model=new T.Group();
 model.name='MILA khanitta · Học viện phép thuật';
 parent.add(model);
 const north=section(model,0,-33);
 for(const side of [-1,1]){
  wing(north,side*14.2);
  turret(north,side*24,-1.65,11.7,1.85);
  turret(north,side*5.0,-1.9,13.1,1.85);
 }
 block(north,0,6.43,-2.9,8.3,12.85,5.55,stone);
 for(const y of [1,6.15,9.42,12.72])block(north,0,y,-2.81,8.63,.24,5.8,ivory);
 gable(north,0,12.76,.31,9.14,4.12,6.4);
 for(const s of [-1,1])strap(north,0,16.88,s*4.57,12.76,.36,.15,gold);
 arch(north,0,.13,.24,3.95,5.79,.23,ivory,shadow);
 arch(north,0,.26,.57,3.15,5.22,.17,gold,roof);
 block(north,0,1.92,.79,.10,3.3,.08,gold);
 for(const side of [-1,1])lancet(north,side*2.94,6.48,.18,.88,2.25);
 clock(north,.28,10.99);
 moon(north,0,14.12,.38);
 for(const step of [0,1,2])block(north,0,.08+step*.115,.92+step*.24,6.6-step*.68,.13+step*.08,2.9-step*.63,ivory);
 arcade(model,-19,32,Math.PI,6);
 arcade(model,19,32,Math.PI,6);
 for(const x of [-34,0,34])turret(model,x,34,x===0?11.7:9.2,1.9);
 for(const side of [-1,1]){
  const yaw=-side*Math.PI/2;
  gate(model,side*43,0,yaw);
  for(const z of [-17,17])arcade(model,side*43,z,yaw,4);
 }

 return model;
}
