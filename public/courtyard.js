import * as T from '/vendor/three.module.js';
import {mergeGeometries} from '/vendor/merge.js';
export function createCourtyard(scene){
 const group=new T.Group();scene.add(group);const materials=new Map(),animated=[];let seed=419;
 const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 function mat(c,glow=0){const key=c+':'+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color:c,roughness:.85,metalness:0,emissive:c,emissiveIntensity:glow,side:T.DoubleSide}));return materials.get(key);}
 function mesh(geo,c,x,y,z,scale=[1,1,1],glow=0){const o=new T.Mesh(geo,mat(c,glow));o.position.set(x,y,z);o.scale.set(...scale);o.receiveShadow=true;group.add(o);return o;}
 const box=(w,h,d,c,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z);
 const cyl=(r,h,c,x,y,z,n=24)=>mesh(new T.CylinderGeometry(r,r,h,n),c,x,y,z);
 const sphere=new T.SphereGeometry(1,10,7);
 const ball=(c,x,y,z,s)=>mesh(sphere,c,x,y,z,s);
 function ring(r,c,x,y,z,t=.06){const o=mesh(new T.TorusGeometry(r,t,6,80),c,x,y,z);o.rotation.x=Math.PI/2;return o;}
 function line(points,c,r=.035){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),points.length*4,r,5,false),c,0,0,0);}
 function star(r,x,y,z,c,points=8){const sh=new T.Shape();for(let i=0;i<points*2;i++){const a=i*Math.PI/points,q=i%2?r*.36:r;i?sh.lineTo(Math.cos(a)*q,Math.sin(a)*q):sh.moveTo(Math.cos(a)*q,Math.sin(a)*q);}sh.closePath();const o=mesh(new T.ShapeGeometry(sh),c,x,y,z);o.rotation.x=-Math.PI/2;return o;}
 // Broad lavender stone plaza, cream / gold inlays and an open central dueling court.
 box(102,2,78,'#b3b3b4',0,-1.14,0);box(100,.16,76,'#97bd84',0,-.12,0);
 box(70,.05,42,'#c3b4cb',0,-.04,0);
 for(let x=-34;x<34;x+=2)for(let z=-20;z<20;z+=2)box(1.97,.025,1.97,['#e2d4e3','#d8c8dd','#e8dae7','#ddcbd9'][Math.floor(rnd()*4)],x+1,-.009,z+1);
 // Radial mosaic surrounding the academy seal, all walkable at y = 0.
 for(let r=5;r<17;r+=1.5){const count=Math.round(r*3.8);for(let j=0;j<count;j++){const a=j/count*Math.PI*2,arc=Math.PI*2/count;const sh=new T.Shape();sh.absarc(0,0,r,a+.004,a+arc-.004,false);sh.lineTo(Math.cos(a+arc-.004)*(r+1.46),Math.sin(a+arc-.004)*(r+1.46));sh.absarc(0,0,r+1.46,a+arc-.004,a+.004,true);sh.closePath();const o=mesh(new T.ShapeGeometry(sh),j%3?'#e5d6e5':'#d5c3d8',0,.011,0);o.rotation.x=-Math.PI/2;}}
 cyl(4.9,.02,'#f8e9d6',0,.015,0,80);for(const r of[4.9,5.2,16.8,17.1])ring(r,'#d7ad69',0,.04,0,.035);
 for(const x of[-33.8,33.8])box(.075,.015,39.8,'#f6ddb0',x,.025,0);for(const z of[-19.8,19.8])box(67.6,.015,.075,'#f6ddb0',0,.025,z);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;star(1.3,Math.cos(a)*17,.035,Math.sin(a)*17,'#cda260',4);star(.8,Math.cos(a)*17,.038,Math.sin(a)*17,'#fff0c9',4);}
 star(3.9,0,.029,0,'#dec18a',8);cyl(2.6,.013,'#faf0df',0,.035,0,64);
 // Open-book emblem with page lines and laurel leaves (geometry, not a flat background).
 for(const s of[-1,1]){const b=box(1.35,.025,1.9,'#b79460',s*.69,.06,0);b.rotation.y=s*.12;const p=box(1.19,.025,1.72,'#fff5dd',s*.68,.078,0);p.rotation.y=s*.12;for(let j=0;j<5;j++)line([[s*.18,.1,-.6+j*.27],[s*.65,.1,-.64+j*.27],[s*1.1,.1,-.55+j*.27]],'#d3b27a',.018);for(let j=0;j<7;j++){const a=-1.05+j*.32;const o=ball('#c2a367',s*(2+Math.cos(a)*.65),.07,Math.sin(a)*2,[.15,.022,.3]);o.rotation.y=s*(a+.9);}}
 // Rose beds are raised beyond the playable boundary, keeping movement unobstructed.
 const petalGeometry=new T.SphereGeometry(1,6,4);function flower(x,y,z,c,size=.18){for(let k=0;k<5;k++){const a=k*Math.PI*2/5;mesh(petalGeometry,c,x+Math.cos(a)*size*.6,y,z+Math.sin(a)*size*.6,[size*.55,.065,size*.55]);}mesh(petalGeometry,'#efcb71',x,y+.025,z,[size*.25,.05,size*.25]);}
 function bed(x,z,w=8,d=3){box(w+.35,.45,d+.35,'#ece1d5',x,.18,z);box(w,.12,d,'#658a5a',x,.42,z);for(let i=0;i<Math.floor(w*d*2);i++){const xx=x+(rnd()-.5)*(w-.3),zz=z+(rnd()-.5)*(d-.3);ball(['#6b9e69','#83b078','#91b67a'][i%3],xx,.65,zz,[.3,.3,.3]);flower(xx,.95+rnd()*.18,zz,['#fff3d9','#f4b9d5','#d3b1ed','#ffdcaa'][i%4],.16+rnd()*.1);}box(w+.4,.07,d+.4,'#d1ae79',x,.43,z);box(w,.08,d,'#679462',x,.48,z);}
 for(const z of[-24,24])for(const x of[-25,-11,11,25])bed(x,z,8,3);
 function bench(x,z,rot=0){const b=new T.Group();group.add(b);b.position.set(x,0,z);b.rotation.y=rot;function part(w,h,d,c,xx,yy,zz){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));o.position.set(xx,yy,zz);b.add(o);}for(let j=0;j<3;j++){part(3.1,.12,.18,'#c7a374',0,.82,(j-1)*.23);part(3.1,.18,.1,'#e8c698',0,1.2+j*.21,-.35);}for(const s of[-1,1]){part(.14,.8,.65,'#b39b73',s*1.3,.4,0);part(.13,1.35,.12,'#c6a56d',s*1.5,1,-.34);part(.12,.1,.75,'#e5c08b',s*1.5,1.2,0);}}
 for(const z of[-22,22])for(const x of[-18,0,18])bench(x,z,z<0?0:Math.PI);
 // Blossom trees with branching trunks, layered foliage and individually grouped blooms.
 for(const z of[-28,28])for(const x of[-32,-19,0,19,32]){line([[x,0,z],[x+.25,2,z],[x-.1,4.2,z]],'#997666',.26);for(const s of[-1,1])line([[x,2.7,z],[x+s*1.1,3.7,z+.1],[x+s*2,4.2,z]],'#997666',.13);for(let j=0;j<11;j++){const a=j*2.4,r=1.6*Math.sqrt(j/11);ball(['#edb2d1','#f5c5df','#f8d9e7'][j%3],x+Math.cos(a)*r,4.5+rnd()*.6,z+Math.sin(a)*r,[1.15,.75,1.03]);}for(let j=0;j<48;j++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*2.5;flower(x+Math.cos(a)*r,4.6+rnd()*.7,z+Math.sin(a)*r,j%2?'#fff0e8':'#f5c0d9',.16);}cyl(1.25,.22,'#eadbc8',x,.08,z);}
 // Low perimeter walls, gold lanterns, banners and clipped cypress trees.
 function pillar(x,z){box(.65,1.8,.65,'#e8dae1',x,.9,z);box(.85,.15,.85,'#f9ebd7',x,1.85,z);mesh(new T.OctahedronGeometry(.22),'#ecc884',x,2.15,z,[1,1.3,1],.25);}
 for(const z of[-31,31]){for(let x=-40;x<=40;x+=8){pillar(x,z);if(x<40){box(7.4,.9,.28,'#d9ccd8',x+4,.55,z);box(7.4,.12,.45,'#f9e7d0',x+4,1.06,z);}}}
 for(const x of[-39,39])for(const z of[-24,-12,12,24]){cyl(.16,2,'#a98667',x,1,z);for(let j=0;j<3;j++)mesh(new T.ConeGeometry(1.05-j*.23,2.4,12),'#578d70',x,2.6+j*.8,z);pillar(x+1.7,z);}
 for(const x of[-35,35])for(const z of[-17,17]){cyl(.06,4.7,'#ccaa6c',x,2.35,z);mesh(new T.OctahedronGeometry(.2),'#efd6a1',x,4.85,z);box(1.45,2.25,.045,x<0?'#688cba':'#a36f9d',x+.73,3.1,z);box(1.45,.06,.07,'#f7deaa',x+.73,4.25,z);const emblem=mesh(new T.TorusGeometry(.4,.045,5,24),'#f6dc9e',x+.73,3.15,z+.04);}
 // Crystal team sanctuaries and two garden fountains.
 for(const side of[-1,1]){const x=side*32,c=side<0?'#8ddaf1':'#d8a4ef';cyl(2.3,.04,'#eee2ed',x,.025,0,48);ring(2.1,'#d9b46b',x,.07,0);cyl(.95,.38,'#f0dcb7',x,.2,0);const crystal=mesh(new T.OctahedronGeometry(.85),'#bcdff0',x,1.55,0,[.85,1.65,.85],.2);crystal.material=mat(c,.28);animated.push(crystal);for(let j=0;j<6;j++){const a=j*Math.PI/3;line([[x+Math.cos(a)*.7,.4,Math.sin(a)*.7],[x+Math.cos(a)*1.15,.95,Math.sin(a)*1.15],[x+Math.cos(a)*.62,1.27,Math.sin(a)*.62]],'#d3af67',.05);}ring(1.15,'#fff2bf',x,1.1,0,.035);}
 for(const [x,z]of[[-34,-24],[34,24]]){cyl(2,.35,'#f2dfd4',x,.18,z,48);cyl(1.7,.04,'#a5dbeb',x,.38,z,48);ring(1.9,'#d7b780',x,.4,z,.1);cyl(.38,1,'#e4d2cd',x,.8,z);cyl(.95,.16,'#f6e4d8',x,1.35,z);mesh(new T.OctahedronGeometry(.25),'#c5f4ff',x,2.1,z,[1,1.8,1],.5);for(let j=0;j<6;j++){const a=j*Math.PI/3;line([[x,1.75,z],[x+Math.cos(a)*.65,1.8,z+Math.sin(a)*.65],[x+Math.cos(a)*1.2,.45,z+Math.sin(a)*1.2]],'#9fd4e7',.025);}}
 // Cream stone academy wings: pointed windows, violet roofs, towers and golden spires.
 function windowAt(x,y,z,w=1.05,h=2){box(w,h,.09,'#8f91be',x,y,z);for(const s of[-1,1])box(.07,h,.13,'#efcc88',x+s*w/2,y,z+.07);box(w,.07,.13,'#efcc88',x,y-h/2,z+.07);box(.055,h,.13,'#efcc88',x,y,z+.07);line([[x-w/2,y+h/2,z+.07],[x,y+h/2+.65,z+.07],[x+w/2,y+h/2,z+.07]],'#efcc88',.055);}
 function tower(x,z,height=12){cyl(2.2,height,'#e6dce7',x,height/2,z,12);for(const y of[.4,height-1.4,height])cyl(2.35,.22,'#f7e5cc',x,y,z,12);mesh(new T.ConeGeometry(2.8,5,12),'#8b7aaf',x,height+2.5,z);mesh(new T.ConeGeometry(.25,1.4,8),'#e5bf74',x,height+5.4,z);windowAt(x,height-3,z+2.17,.9,2.7);for(const s of[-1,1])box(.2,height,.15,'#f9ead7',x+s*1.5,height/2,z+1.6);}
 for(const z of[-38,38]){box(77,9,6,'#e8dce5',0,4.5,z);box(78,.45,7,'#f4e4ce',0,9,z);const roofGeometry=new T.BufferGeometry();roofGeometry.setAttribute('position',new T.Float32BufferAttribute([-39,9,z-4,39,9,z-4,-39,12,z,39,12,z,-39,9,z+4,39,9,z+4],3));roofGeometry.setIndex([0,2,1,1,2,3,2,4,3,3,4,5,0,4,2,1,3,5]);roofGeometry.computeVertexNormals();mesh(roofGeometry,'#9685b5',0,0,0);for(let x=-34;x<=34;x+=4){windowAt(x,3,z+(z<0?3.07:-3.07),1.2,2.4);windowAt(x,6.8,z+(z<0?3.07:-3.07),1.2,1.6);box(.22,8,.25,'#fff0de',x+1.8,4.4,z+(z<0?3.2:-3.2));}for(const x of[-38,-19,19,38])tower(x,z,11+(Math.abs(x)<30?2:0));}
 tower(0,-40,19);box(8,11,2,'#f1e3e9',0,5.5,-33.5);windowAt(0,4,-32.42,3.5,5);const clock=mesh(new T.CircleGeometry(1.3,48),'#fff0d1',0,9.3,-32.4);mesh(new T.TorusGeometry(1.3,.09,6,40),'#cfa35f',0,9.3,-32.32);line([[0,10.2,-32.2],[0,9.3,-32.2],[.55,9.6,-32.2]],'#9373a5',.05);
 // Grand gateways close the long axis seen by the behind-character camera.
 for(const side of[-1,1]){const x=side*44;for(const z of[-9,9])tower(x,z,10);for(const z of[-6.5,6.5]){box(1.3,5,1.3,'#f4e5dc',x,2.5,z);box(1.7,.25,1.7,'#d3b47b',x,5,z);}const arch=mesh(new T.TorusGeometry(6.5,.42,8,48,Math.PI),'#f7e8d7',x,5,0);arch.rotation.y=Math.PI/2;const trim=mesh(new T.TorusGeometry(6.5,.07,6,48,Math.PI),'#d5af6c',x-side*.45,5,0);trim.rotation.y=Math.PI/2;mesh(new T.OctahedronGeometry(.7),'#d6b8ee',x,12.3,0,[.5,1.4,1],.1);}
 // Clouds above the towers; drifting petals use one GPU draw call.
 for(let i=0;i<14;i++){const x=(rnd()-.5)*160,z=(rnd()-.5)*150;for(let j=0;j<3;j++)ball('#fff3f0',x+j*2,25+rnd()*3,z,[3.5,1.1,2]);}
 const pts=[];for(let i=0;i<90;i++)pts.push((rnd()-.5)*75,2+rnd()*8,(rnd()-.5)*52);const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(pts,3));const petals=new T.Points(pg,new T.PointsMaterial({color:'#ffd7e8',size:.09,transparent:true,opacity:.8}));scene.add(petals);
 // Batch decorative geometry by material, leaving only crystals animated.
 group.updateMatrixWorld(true);const batches=new Map();group.traverse(o=>{if(!o.isMesh||animated.includes(o))return;if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(o);});for(const [material,list]of batches){const geos=list.map(o=>{const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;});const g=mergeGeometries(geos,false);if(g){const m=new T.Mesh(g,material);m.receiveShadow=true;scene.add(m);list.forEach(o=>o.removeFromParent());}geos.forEach(g=>g.dispose());}
 return{update(t){animated.forEach((o,i)=>{o.rotation.y=t*.35+i;o.position.y=1.55+Math.sin(t*1.4+i)*.1;});petals.rotation.y=Math.sin(t*.04)*.08;}};
}
