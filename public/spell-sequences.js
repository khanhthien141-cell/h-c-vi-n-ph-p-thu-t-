import * as T from '/vendor/three.module.js';

export const SPELL_BOOK = {
  sol: ['#ff9129','#fff0a2',[['Hỏa kích','slash'],['Khiên bình minh','sunShield'],['Thái dương bùng nổ','sunburst']]],
  luna: ['#ad6aff','#ffdbc0',[['Cầu nguyệt quang','moon'],['Sóng tinh tú','starDash'],['Nguyệt thực','eclipse']]],
  ivy: ['#79e339','#ffaccd',[['Dây leo','vine'],['Hồi phục','flowerHeal'],['Khu vườn sự sống','bloomTree']]],
  kai: ['#199cff','#bbfbff',[['Thủy tiễn','waterArrow'],['Lướt sóng','waterDash'],['Mưa tên thủy triều','waterRain']]],
  ember: ['#fc4626','#ffd160',[['Địa chấn','quake'],['Giáp lửa','fireShield'],['Phượng hỏa','phoenix']]],
  nova: ['#883bff','#ffa6ef',[['Sao băng','meteor'],['Bùng nổ','novaDash'],['Dải ngân hà','galaxy']]],
  sage: ['#91cc32','#ffe080',[['Rễ cổ thụ','root'],['Hồi phục','leafHeal'],['Hộ vệ rừng xanh','ancientTree']]],
  raven: ['#7935be','#eac1ff',[['Phi tiêu','featherDart'],['Lướt bóng','shadowDash'],['Mưa tên hoàng hôn','featherRain']]],
  atlas: ['#438cff','#ffe0a3',[['Búa thiên thạch','hammer'],['Giáp đá','stoneShield'],['Thành trì tinh tú','citadel']]],
  faye: ['#ed50b9','#fff0c8',[['Trang sách ma thuật','paperBolt'],['Sóng tri thức','runeDash'],['Đại thư viện phép thuật','library']]],
  milo: ['#8ebd43','#ffe177',[['Nốt nhạc','musicBolt'],['Hồi phục','musicHeal'],['Khúc ca mùa xuân','concert']]],
  zephyr: ['#28d4c8','#d0fff2',[['Phong tiễn','windArrow'],['Lướt gió','windDash'],['Bão thiên không','cyclone']]]
};

const TAU = Math.PI * 2;
const clamp = x => Math.max(0, Math.min(1,x));
const smooth = x => x*x*(3-2*x);
const ease = x => smooth(clamp(x));
export const SPELL_DURATION = 3.6;
export const PREVIEW_REACH = 3.1;
export const ULTIMATE_OFFSET = 1.4;
export const PHASES = ['Tụ lực','Phát chiêu','Tan dần'];
export function phaseAt(elapsed, duration) {
  const t = clamp(elapsed / duration);
  return t < .27 ? [0,t/.27] : t < .70 ? [1,(t-.27)/.43] : [2,(t-.70)/.30];
}

export function buildSpell(hero, slot, reach=4.5, direction=1) {
  const [base,highlight,spells] = SPELL_BOOK[hero];
  const [name,kind] = spells[slot-1];
  const root = new T.Group();
  root.name = 'hero-spell-sequence';
  const charge = new T.Group(), action = new T.Group(), decay = new T.Group();
  root.add(charge,action,decay);
  const resources = new Set();
  const animate = [];
  const impact = reach * direction;
  const travels=kind.endsWith("Dash")||slot===1;
  function surface(color,alpha=1,additive=false) {
    const material = new T.MeshBasicMaterial({
      color,transparent:true,opacity:alpha,depthWrite:false,
      side:T.DoubleSide,toneMapped:false,blending:additive?T.AdditiveBlending:T.NormalBlending
    });
    resources.add(material);
    return material;
  }
  const bright = surface(highlight,.97), vivid=surface(base,.88), sheen=surface(base,.34,true), glass=surface(highlight,.25,true);
  const wood=surface('#98704d',.96), rock=surface('#555877',.97);
  const core = new T.OctahedronGeometry(1), orb=new T.SphereGeometry(1,20,12);
  const box=new T.BoxGeometry(1,1,1), cone=new T.ConeGeometry(1,1,10);
  for(const geometry of [core,orb,box,cone])resources.add(geometry);
  function mesh(parent,geometry,material,x=0,y=0,z=0,scale=[1,1,1]) {
    const object = new T.Mesh(geometry,material);
    object.position.set(x,y,z);object.scale.set(...scale);
    parent.add(object);
    return object;
  }
  function ring(parent,r,x=0,y=.07,z=0,mat=bright,flat=true,span=TAU) {
    const geometry=new T.TorusGeometry(r,.025,6,52,span);
    resources.add(geometry);
    const item=mesh(parent,geometry,mat,x,y,z);
    if(flat)item.rotation.x=-Math.PI/2;
    return item;
  }
  function path(parent,points,thick,mat=bright) {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const geometry=new T.TubeGeometry(curve,Math.max(14,points.length*5),thick,6,false);
    resources.add(geometry);
    return mesh(parent,geometry,mat);
  }
  const ribbons = [];
  // A ribbon is a curved mesh with a moving bright core and soft edges.
  function ribbon(parent,points,width,phase,roll=0) {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const positions=[],uvs=[],triangles=[],segments=36;
    const normal=new T.Vector3(Math.sin(roll),Math.cos(roll),.46);
    for(let i=0;i<=segments;i++){
      const t=i/segments,position=curve.getPointAt(t),tangent=curve.getTangentAt(t);
      const side=new T.Vector3().crossVectors(tangent,normal).normalize();
      const taper=Math.pow(Math.sin(Math.PI*t),.68);
      for(let rail=0;rail<2;rail++){
        const offset=(rail*2-1)*width*(.045+.955*taper);
        positions.push(position.x+side.x*offset,position.y+side.y*offset,position.z+side.z*offset);
        uvs.push(t,rail);
      }
      if(i){const n=i*2;triangles.push(n-2,n-1,n,n,n-1,n+1);}
    }
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
    geometry.setIndex(triangles);
    const material=new T.ShaderMaterial({
      transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      uniforms:{base:{value:new T.Color(base)},light:{value:new T.Color(highlight)},fade:{value:0},progress:{value:0}},
      vertexShader:`varying vec2 vUV;
        uniform float progress;
        void main(){
          vUV=uv;
          vec3 moved=position;
          moved.y+=sin(uv.x*14.0-progress*6.283)*sin(uv.x*3.14159)*.045;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(moved,1.0);
        }`,
      fragmentShader:`varying vec2 vUV;
        uniform vec3 base; uniform vec3 light;
        uniform float fade; uniform float progress;
        void main(){
          float center=1.0-abs(vUV.y*2.0-1.0);
          float rim=pow(max(0.0,1.0-abs(vUV.y-.73)*4.0),5.0);
          float wave=.59+.41*sin(vUV.x*26.0-progress*16.0+vUV.y*8.0);
          float offset=(vUV.x-progress*.84-.08)*6.0;
          float pulse=exp(-offset*offset);
          float filaments=pow(.5+.5*sin(vUV.y*27.0+vUV.x*19.0-progress*17.0),8.0);
          float rimGlow=pow(max(0.0,center),.38)*.34;
          float hotCore=pow(max(0.0,center),8.0);
          float tip=smoothstep(0.0,.14,vUV.x)*(1.0-smoothstep(.91,1.0,vUV.x));
          vec3 color=mix(base,light,clamp(hotCore*.85+rim*.30+filaments*.22+pulse*.28,0.0,1.0));
          float alpha=rimGlow+hotCore*(.36+.38*pulse)+rim*.21+center*filaments*.22*wave;
          gl_FragColor=vec4(color,clamp(alpha*tip*fade,0.0,1.0));
          #include <colorspace_fragment>
        }`
    });
    resources.add(geometry);resources.add(material);
    ribbons.push({material,phase});
    return mesh(parent,geometry,material);
  }
  function orbitBand(parent,radius,y,width,phase,turns=1,tilt=.18) {
    const points=Array.from({length:27},(_,i)=>{
      const a=i/26*TAU*turns;
      return [Math.cos(a)*radius,y+Math.sin(a*2)*tilt,Math.sin(a)*radius];
    });
    return ribbon(parent,points,width,phase);
  }

  // Local glow: a single small quad per focal point, with no full-screen bloom pass.
  const glowGeometry=new T.PlaneGeometry(2,2);
  resources.add(glowGeometry);
  const glows=[];
  function glow(parent,x,y,z,size,phase,strength){
    const material=new T.ShaderMaterial({
      transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      uniforms:{color:{value:new T.Color(base)},hot:{value:new T.Color(highlight)},gain:{value:0}},
      vertexShader:`varying vec2 coord;
        void main(){
          coord=uv*2.0-1.0;
          vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);
          vec2 size=vec2(length(modelViewMatrix[0].xyz),length(modelViewMatrix[1].xyz));
          gl_Position=projectionMatrix*(center+vec4(position.xy*size,0.,0.));
        }`,
      fragmentShader:`varying vec2 coord;
        uniform vec3 color;uniform vec3 hot;uniform float gain;
        void main(){
          float r=length(coord);
          float aura=exp(-r*r*5.2)*(1.-smoothstep(.64,1.,r));
          float core=exp(-r*r*21.);
          gl_FragColor=vec4(mix(color,hot,core),gain*(aura*.46+core*.27));
          #include <colorspace_fragment>
        }`
    });
    resources.add(material);
    const light=mesh(parent,glowGeometry,material,x,y,z,[size,size,1]);
    glows.push({light,material,phase,size,strength});
    return light;
  }

  function sweep(parent,rise,radius,loops,mat,start=0) {
    const points=Array.from({length:28},(_,i)=>{
      const t=i/27,a=TAU*loops*t+start;
      return [Math.cos(a)*radius*(.48+.52*t),.13+rise*t,Math.sin(a)*radius*(.48+.52*t)];
    });
    return path(parent,points,.038,mat);
  }
  function shards(parent,count,spread,height,x=0,mat=bright) {
    const burst=new T.InstancedMesh(core,mat,count);
    const transform=new T.Object3D();
    burst.frustumCulled=false;
    parent.add(burst);resources.add(burst);
    const phase=parent===charge?0:parent===decay?2:1;
    animate.push((current,t)=>{
      if(current!==phase)return;
      for(let i=0;i<count;i++){
        const angle=i*2.39996+t*(phase===0?-.85:1);
        const r=spread*(.35+(i%8)/11)*(phase===0?1-t*.67:.35+.82*t);
        const size=(.04+(i%4)*.023)*(phase===2?1-t*.92:1);
        transform.position.set(x+Math.cos(angle)*r,.15+(i%7)*height/7+Math.sin(t*Math.PI)*.32,Math.sin(angle)*r);
        transform.rotation.set(i*.7+t*3,i+t*4,angle);
        transform.scale.set(size,size*(1.35+i%3*.48),size);
        transform.updateMatrix();burst.setMatrixAt(i,transform.matrix);
      }
      burst.instanceMatrix.needsUpdate=true;
    });
  }
  function mark(parent,r,x=0) {
    ring(parent,r,x);
    ring(parent,r*.82,x,.08,0,sheen);
    ring(parent,r*.56,x,.09,0,glass);
    const runes=new T.InstancedMesh(core,bright,16);
    const transform=new T.Object3D();
    for(let i=0;i<16;i++){
      const a=i*TAU/16;
      transform.position.set(x+Math.cos(a)*r,.11,Math.sin(a)*r);
      transform.scale.set(i%4===0?.09:.047,.032,i%4===0?.16:.09);
      transform.rotation.y=-a;
      transform.updateMatrix();runes.setMatrixAt(i,transform.matrix);
    }
    parent.add(runes);resources.add(runes);
  }
  function cross(parent,x,y,z) {
    mesh(parent,box,bright,x,y,z,[.41,.11,.075]);
    mesh(parent,box,bright,x,y,z,[.11,.41,.075]);
  }
  function arrow(parent,x,y,z,material=bright,down=false) {
    const a=new T.Group();a.position.set(x,y,z);parent.add(a);
    mesh(a,cone,bright,.26,0,0,[.13,.37,.07]).rotation.z=-Math.PI/2;
    mesh(a,box,material,-.13,0,0,[.58,.049,.049]);
    if(down)a.rotation.z=-Math.PI/2;
    return a;
  }
  function feather(parent,x,y,z,spin,material=vivid){
    const shaft=new T.Group();
    shaft.position.set(x,y,z);shaft.rotation.z=spin;parent.add(shaft);
    path(shaft,[[-.22,0,0],[0,.02,0],[.30,.08,.02]],.018,bright);
    for(const side of [-1,1]){
      const quill=[[-.21,0,0],[-.065,side*.085,.015],[.14,side*.081,.01],[.30,.08,.02]];
      ribbon(shaft,quill,.081,1,side*.66);
      if(material===vivid)mesh(shaft,core,material,.03,side*.035,0,[.20,.035,.026]);
    }
    return shaft;
  }
  function impactPulse(parent,x,z,delay,radius){
    const wave=ring(parent,1,x,.11,z,bright);
    const halo=orbitBand(parent,1,.14,.12,1,.9,.09);
    halo.position.set(x,0,z);
    animate.push((phase,t)=>{
      if(phase!==1)return;
      const p=clamp((t-delay)/.28);
      const edge=ease(p/.13)*(1-ease((p-.63)/.37));
      wave.visible=halo.visible=edge>.001;
      wave.scale.set(.16+radius*p,.16+radius*p,edge*.32);
      halo.scale.set(.16+radius*p,edge,.16+radius*p);
    });
  }
  function leaf(parent,x,y,z,mat=vivid) {
    return mesh(parent,orb,mat,x,y,z,[.21,.07,.11]);
  }
  function flower(parent,x,y,z) {
    for(let i=0;i<5;i++){
      const a=i*TAU/5;
      leaf(parent,x+Math.cos(a)*.13,y,z+Math.sin(a)*.13,bright).rotation.y=-a;
    }
    mesh(parent,orb,vivid,x,y+.04,z,[.08,.08,.08]);
  }
  function note(parent,x,y,z) {
    mesh(parent,orb,bright,x,y,z,[.16,.10,.08]).rotation.z=.36;
    mesh(parent,box,bright,x+.13,y+.19,z,[.055,.43,.05]);
    path(parent,[[x+.13,y+.39,z],[x+.30,y+.34,z],[x+.33,y+.20,z]],.026,bright);
  }
  function page(parent,x,y,z,tilt) {
    const blade=mesh(parent,box,bright,x,y,z,[.46,.58,.025]);
    blade.rotation.set(.42,tilt,.36);
    const detail=mesh(blade,core,vivid,0,0,.65,[.18,.14,.8]);
    detail.rotation.z=.2;
  }

  mark(charge,.94);
  const chargeY=1.65;
  if(kind==='musicHeal'||kind==='musicBolt'||kind==='concert')note(charge,0,chargeY,0);
  else if(kind==='vine'||kind==='root'||kind==='flowerHeal'||kind.endsWith('Tree')){
    leaf(charge,-.15,.66,0).rotation.z=.72;
    leaf(charge,.13,.73,0).rotation.z=-.49;
    path(charge,[[0,.12,0],[.04,.41,0],[0,.83,0]],.032,vivid);
  }else if(kind==='paperBolt'||kind==='runeDash'||kind==='library'){
    page(charge,-.17,chargeY,0,-.45);page(charge,.17,chargeY,0,.45);
  }else if(kind==='moon'||kind==='eclipse'||kind==='sunburst'||kind==='sunShield'){
    mesh(charge,orb,kind==='eclipse'?vivid:bright,0,chargeY,0,[.26,.26,.26]);
    ring(charge,.37,0,chargeY,0,bright,false,5.1).rotation.y=.35;
  }else if(kind==='waterArrow'||kind==='featherDart'||kind==='windArrow'){
    arrow(charge,0,chargeY,0,vivid).rotation.y=direction===1?0:Math.PI;
  }else{
    mesh(charge,core,bright,.32,chargeY,0,[.23,.23,.23]);
  }
  const chargeBands=new T.Group();charge.add(chargeBands);
  for(let i=0;i<2;i++)orbitBand(chargeBands,.83+i*.19,.55+i*.56,.11,0,.83,.37);
  animate.push((phase,t)=>{if(phase===0)chargeBands.rotation.y=-t*2.9;});
  sweep(charge,1.82,.82,1.05,vivid);
  shards(charge,10,1.16,1.7);
  shards(decay,21,slot===3?2.55:1.23,slot===3?2.35:1.05,travels?impact:0);
  const residue=new T.Group();residue.position.x=travels?impact:0;decay.add(residue);
  ring(residue,slot===3?2.7:1.25,0,.09,0,sheen);
  orbitBand(residue,slot===3?2.5:1.08,.19,.15,2,.78,.18);
  animate.push((phase,t)=>{
    residue.scale.setScalar(1+t*.18);residue.rotation.y=t*.43;
  });

  // Travel and direction are kept explicit so impact effects land on the
  // combat target, while the preview can use the same scene at a larger scale.
  if(['slash','quake','hammer'].includes(kind)){
    const x=kind==='slash'?impact*.58:impact;
    mark(action,1.14,x);
    if(kind==='slash'){
      for(let i=0;i<3;i++){
        const points=Array.from({length:19},(_,j)=>{
          const t=j/18,a=-1.8+t*3.3,r=1.05+i*.23;
          return [x+Math.sin(a)*r,.54+(1+Math.cos(a))*(.3+i*.13),Math.cos(a)*r*.81];
        });
        ribbon(action,points,.19+i*.045,1,i*.3);
      }
      for(let i=0;i<4;i++){
        const arc=ring(action,.85+i*.17,x,.82+i*.10,0,i%2?bright:vivid,false,3.9);
        arc.rotation.set(.47,0,-.92+i*.2);
        arc.scale.y=.72;
      }
    }else{
      for(let i=0;i<10;i++){
        const y=.42+(i%4)*.26;
        const chunk=mesh(action,core,i%3?rock:vivid,x+(i-4.5)*.25,y,Math.cos(i*2)*.75,[.24,y*.66,.23]);
        chunk.rotation.set(.5,i*.4,-.43);
      }
      if(kind==='hammer'){
        const handle=mesh(action,box,bright,x-.25,1.01,0,[.13,1.58,.14]);handle.rotation.z=.55;
        mesh(action,box,vivid,x-.66,1.76,0,[.77,.46,.36]).rotation.z=.55;
        ring(action,.88,x-.27,1.02,0,bright,false,2.35).rotation.z=.63;
      }
      if(kind==='quake')for(let i=0;i<5;i++)path(action,[[x,.045,0],[x-.65+i*.31,.058,.48],[x-.8+i*.4,.06,1.12]],.037,vivid);
    }
    shards(action,20,1.65,1.8,x);
  }else if(['sunShield','fireShield','stoneShield'].includes(kind)){
    mark(action,1.48);
    mesh(action,orb,glass,0,1.35,0,[1.43,1.38,1.43]);
    for(let i=0;i<6;i++){
      const angle=i*TAU/6;
      const x=Math.cos(angle)*1.25,z=Math.sin(angle)*1.25;
      const plate=mesh(action,kind==='stoneShield'?box:core,kind==='stoneShield'?rock:vivid,x,1.18,z,[.53,.56,.16]);
      plate.rotation.y=Math.PI/2-angle;
      animate.push((phase,t)=>{
        if(phase!==1)return;
        const open=1.37-.37*smooth(clamp(t*3.4));
        plate.position.set(x*open,1.18+.45*(open-1),z*open);
        plate.rotation.z=(open-1)*(i%2?1:-1);
      });
      mesh(action,core,bright,x*1.06,1.18,z*1.06,[.14,.24,.14]);
    }
    for(let i=0;i<3;i++)ring(action,1.44,0,1.27,0,i%2?bright:glass,false).rotation.y=i*Math.PI/3;
    const bands=new T.Group();action.add(bands);
    orbitBand(bands,1.46,.62,.16,1,1,.24);
    orbitBand(bands,1.22,1.87,.11,1,.9,.22);
    animate.push((phase,t)=>{if(phase===1)bands.rotation.y=t*2;});
    sweep(action,2.48,1.56,.8,bright);
  }else if(['starDash','waterDash','novaDash','shadowDash','runeDash','windDash'].includes(kind)){
    for(let lane=0;lane<5;lane++){
      const points=Array.from({length:7},(_,i)=>{
        const t=i/6;
        return [impact*t,.18+Math.sin(t*Math.PI)*(.15+lane*.19),Math.sin(t*TAU+lane*.75)*(.12+lane*.12)];
      });
      ribbon(action,points,lane%2?.10:.19,1,lane*.47);
      if(lane%2===0)path(action,points,.029,bright);
      const x=impact*(lane+1)/6;
      if(kind==='waterDash'){
        const curl=Array.from({length:12},(_,i)=>{
          const a=i/11*Math.PI*1.51;
          return [x+direction*Math.sin(a)*.56,.09+(1-Math.cos(a))*.38,Math.sin(lane)*.38];
        });
        ribbon(action,curl,.16,1,.51);
        mesh(action,orb,glass,x,.31,lane*.1,[.32,.17,.29]);
      }
      if(kind==='shadowDash')feather(action,x,.53,Math.sin(lane)*.38,.33+lane*.2);
      if(kind==='windDash')leaf(action,x,.53,Math.sin(lane)*.38);
      if(kind==='runeDash')ring(action,.28,x,.53,0,bright,false,4.8).rotation.y=1.3;
      if(kind==='starDash'||kind==='novaDash')mesh(action,core,bright,x,.72,Math.sin(lane)*.42,[.1,.27,.08]);
    }
    shards(action,14,1.35,.95,impact*.56);
  }else if(['flowerHeal','leafHeal','musicHeal'].includes(kind)){
    mark(action,1.65);
    sweep(action,1.12,1.7,1.4,vivid);
    orbitBand(action,1.79,.31,.14,1);
    for(let i=0;i<6;i++){
      const a=i*TAU/6,x=Math.cos(a)*1.45,z=Math.sin(a)*1.45;
      ribbon(action,[[x,.07,z],[x+.08,.67,z],[x,.99,z+.06],[x-.04,1.51,z]],.16,1,a);
    }
    for(let i=0;i<6;i++){
      const a=i*TAU/6,x=Math.cos(a)*1.19,z=Math.sin(a)*1.19;
      cross(action,x,.96+(i%2)*.38,z);
      if(kind==='flowerHeal')flower(action,x,.11,z);
      if(kind==='leafHeal')leaf(action,x,.20,z).rotation.y=a;
      if(kind==='musicHeal')note(action,x,.53,z);
    }
  }else if(kind==='root'||kind==='vine'){
    for(let i=0;i<5;i++){
      const z=(i-2)*.23;
      path(action,[[0,.11,z],[impact*.32,.24,z*2],[impact*.68,.58,z*2],[impact,.94,z],[impact+.29,1.18,z*.45]],kind==='root'?.108:.062,kind==='root'?wood:vivid);
      leaf(action,impact*.73,.64,z*2.1);
      if(kind==='vine')flower(action,impact*.89,.95,z*2);
    }
    shards(action,12,1.05,1.1,impact);
  }else if(slot===3){
    mark(action,2.8);
    const field=new T.Group();action.add(field);
    orbitBand(field,2.91,.17,.19,1,1,.12);
    orbitBand(field,2.51,.29,.093,1,.97,.12);
    animate.push((phase,t)=>{if(phase===1)field.rotation.y=-t*.7;});
    sweep(action,.42,2.85,1.5,sheen);
    if(kind==='sunburst'||kind==='eclipse'){
      const x=0,y=2.75;
      mesh(action,orb,kind==='eclipse'?surface('#211330',.96):bright,x,y,0,[.91,.91,.39]);
      ring(action,1.01,x,y,.13,bright,false);
      const crown=new T.Group();action.add(crown);
      orbitBand(crown,1.16,2.75,.12,1,.94,.29);
      orbitBand(crown,1.29,2.64,.068,1,.82,.36);
      animate.push((phase,t)=>{if(phase===1)crown.rotation.y=t*1.6;});
      impactPulse(action,0,0,.21,2.7);
      impactPulse(action,0,0,.39,2.38);
      for(let i=0;i<18;i++){
        const a=i*TAU/18;
        if(kind==='sunburst'){
          mesh(action,cone,i%3?vivid:bright,Math.cos(a)*1.35,y+Math.sin(a)*1.35,0,[.14,.66,.11]).rotation.z=a-Math.PI/2;
        }else if(i%2===0){
          const b=i*TAU/18;
          path(action,[[Math.cos(b)*1.1,2.39,Math.sin(b)*1.1],[Math.cos(b)*2.4,.13,Math.sin(b)*2.4]],.035,bright);
        }
      }
    }else if(kind==='waterRain'||kind==='featherRain'){
      for(let i=0;i<19;i++){
        const a=i*2.39996,r=2.48*Math.sqrt(i/19),y=.43+(i%6)*.57;
        const drop=arrow(action,Math.cos(a)*r,y,Math.sin(a)*r,vivid,true);
        if(kind==='featherRain')feather(drop,-.16,.08,0,.21,bright);
        const offset=(i%5)*.081;
        animate.push((phase,t)=>{
          if(phase!==1)return;
          const p=clamp((t-offset)/.46);
          drop.position.y=3.6+y*.34-Math.pow(p,1.19)*3.54;
          const envelope=ease(p/.16)*(1-ease((p-.82)/.18));
          drop.visible=envelope>.001;
          drop.scale.setScalar(.22+.78*envelope);
        });
        if(i%3===0)impactPulse(action,Math.cos(a)*r,Math.sin(a)*r,offset+.46,.58);
      }
      for(let i=0;i<4;i++)ring(action,.59+i*.55,0,.12+i*.01,0,sheen);
    }else if(kind==='galaxy'||kind==='cyclone'){
      for(let i=0;i<4;i++){
        const spiral=sweep(action,kind==='galaxy'?.84:3.35,2.55,kind==='galaxy'?1.04:1.65,i%2?vivid:bright,i*TAU/4);
        if(kind==='galaxy')spiral.position.y=2.49;
        const wisps=new T.Group();action.add(wisps);
        for(let j=0;j<3;j++){
          const a=i*TAU/4+j*.34,r=1.55+j*.22;
          const curl=Array.from({length:15},(_,k)=>{
            const t=k/14,b=a+t*1.65;
            return [Math.cos(b)*r,kind==='galaxy'?2.76+t*.14:.54+j*.71+t*.8,Math.sin(b)*r];
          });
          ribbon(wisps,curl,.105+j*.025,1,j*.37);
        }
        animate.push((phase,t)=>{if(phase===1)wisps.rotation.y=t*(kind==='galaxy'?1.85:3.7);});
        const arms=Array.from({length:33},(_,j)=>{
          const u=j/32,a=i*TAU/4+TAU*u*(kind==='galaxy'?1.3:1.8);
          const r=.31+2.28*u;
          return [Math.cos(a)*r,kind==='galaxy'?2.65+.39*u:3.45*u,Math.sin(a)*r];
        });
        const stream=ribbon(action,arms,kind==='galaxy'?.37:.31,1,i*.4);
        animate.push((phase,t)=>{if(phase===1)stream.rotation.y=t*(kind==='galaxy'?1.25:3.1);});
      }
      if(kind==='galaxy')for(let i=0;i<10;i++){
        const a=i*2.39996;
        path(action,[[Math.cos(a)*1.85,2.75,Math.sin(a)*1.85],[Math.cos(a)*1.85,.14,Math.sin(a)*1.85]],.022,bright);
      }
    }else if(kind==='phoenix'){
      for(const side of [-1,1])for(let i=0;i<8;i++){
        const x=side*(1.15+i*.18),y=2.47+i*.082;
        const feathers=new T.Group();action.add(feathers);
        const spine=[[0,1.55,0],[side*.74,1.78,.05],[x,y,.19],[x*1.13,y+.31,.1]];
        ribbon(feathers,spine,.19,1,side*.75);
        if(i%2===0)path(feathers,spine,.035,bright);
        animate.push((phase,t)=>{
          if(phase===1)feathers.rotation.y=side*(.71*(1-smooth(clamp(t*3)))+.18*Math.sin(t*8));
        });
      }
      const body=[[0,.22,0],[-.26,1,0],[.1,1.82,0],[.28,2.41,0],[.58,2.29,0]];
      ribbon(action,body,.35,1,.22);
      path(action,body,.083,vivid);
      mesh(action,core,bright,.33,2.42,.025,[.19,.13,.12]);
      for(let i=0;i<3;i++){
        const shift=(i-1)*.37;
        const tail=[[0,1.45,0],[shift,.90,.07],[shift*1.7,.45,.31],[shift*2.7,.33,.65],[shift*3.2,.62,1.1]];
        ribbon(action,tail,.13+i*.025,1,.31+i*.32);
      }
      glow(action,.34,2.42,.07,.46,1,.85);
    }else if(kind==='citadel'||kind==='library'){
      for(let i=0;i<5;i++){
        const a=.35+i*.65,x=Math.cos(a)*2.18,z=-Math.sin(a)*2.18;
        const height=1.43+(i%2)*.36;
        mesh(action,box,kind==='citadel'?rock:vivid,x,height/2,z,[.55,height,.46]).rotation.y=a;
        mesh(action,box,bright,x,height,z,[.66,.11,.57]).rotation.y=a;
        for(let j=0;j<3;j++){
          if(kind==='library')page(action,x-.15+j*.15,.68+j*.26,z+.37,a);
          else mesh(action,core,bright,x,height+.19+j*.15,z,[.063,.11,.063]);
        }
      }
      ring(action,1.3,0,1.71,-1.25,bright,false,Math.PI);
      for(let i=0;i<3;i++){
        const x=(i-1)*1.03,z=-1.32+Math.abs(i-1)*.27;
        const arch=ring(action,.55,x,1.98,z,i%2?vivid:bright,false,Math.PI);
        arch.scale.y=.75;
        ribbon(action,[[x-.49,1.94,z],[x-.33,2.23,z],[x,2.39,z],[x+.33,2.23,z],[x+.49,1.94,z]],.13,1,.3);
      }
      mesh(action,core,bright,0,2.69,-1.24,[.32,.5,.12]);
      if(kind==='library')for(let i=0;i<8;i++)page(action,Math.cos(i*TAU/8)*2.13,.41+i*.29,Math.sin(i*TAU/8)*2.13,i);
    }else if(kind==='bloomTree'||kind==='ancientTree'){
      path(action,[[0,.05,0],[.08,.63,0],[-.11,1.29,0],[.08,2.45,0]],.19,wood);
      for(let i=0;i<8;i++){
        const a=i*TAU/8,x=Math.cos(a),z=Math.sin(a);
        path(action,[[0,.45,0],[x*.67,.14,z*.67],[x*2.37,.12,z*2.37]],.095,wood);
        path(action,[[0,1.06+i%3*.23,0],[x*.71,1.65,z*.71],[x*1.49,2.35,z*1.49]],.10,wood);
        mesh(action,orb,vivid,x*1.32,2.43+i%3*.13,z*1.32,[.65,.44,.62]);
        if(kind==='bloomTree')flower(action,x*1.49,2.81,z*1.49);
      }
      mesh(action,orb,glass,0,1.29,0,[2.7,1.32,2.7]);
      for(let i=-1;i<=1;i++)cross(action,i*1.13,.92,.9);
    }else if(kind==='concert'){
      for(let lane=0;lane<5;lane++){
        const pts=Array.from({length:13},(_,i)=>{const a=i*Math.PI/12;return [Math.cos(a)*2.45,1.10+Math.sin(a)*1.24+lane*.115,-.55];});
        path(action,pts,.023,bright);
      }
      for(let i=-2;i<=2;i++){
        note(action,i*.82,2.35-Math.abs(i)*.39,-.47);
        flower(action,i*.91,.12,.83);
      }
      for(let i=-1;i<=1;i++){
        mesh(action,orb,glass,i*1.41,.58,.18,[.62,.65,.62]);
        cross(action,i*1.41,.69,.34);
      }
    }
    shards(action,36,2.8,3.1);
  }else {
    const missile=new T.Group();
    action.add(missile);
    if(kind==='moon'){
      mesh(missile,orb,bright,0,0,0,[.33,.33,.33]);
      ring(missile,.42,0,0,0,vivid,false,5.5).rotation.y=.42;
    }else if(kind==='meteor'){
      mesh(missile,core,vivid,0,0,0,[.43,.31,.27]).rotation.z=.62;
      mesh(missile,core,bright,.19,0,0,[.28,.18,.16]);
    }else if(kind==='paperBolt'){
      for(let i=0;i<3;i++)page(missile,-i*.32,.08*i,(i%2)*.25,.2+i*.15);
    }else if(kind==='musicBolt'){
      note(missile,0,0,0);note(missile,-.52,-.13,.15);
    }else{
      arrow(missile,0,0,0,vivid).rotation.y=direction===1?0:Math.PI;
      if(kind==='featherDart')feather(missile,-direction*.22,.13,0,.18);
      if(kind==='waterArrow'){
        const wave=Array.from({length:17},(_,i)=>{
          const a=i/16*Math.PI*1.56;
          return [-direction*(.20+Math.sin(a)*.58),.07+(.44-Math.cos(a)*.44),Math.cos(a)*.47];
        });
        ribbon(missile,wave,.21,1,.60);
      }
    }
    for(let lane=0;lane<3;lane++){
      const pts=Array.from({length:9},(_,i)=>{
        const t=i/8;
        return [-direction*(1.9*t+.13),Math.sin(t*TAU+lane*TAU/3)*(.08+t*.22),Math.cos(t*TAU+lane*TAU/3)*(.09+t*.22)];
      });
      ribbon(missile,pts,.086+lane*.028,1,lane*.62);
      if(lane===0)path(missile,pts,.023,bright);
    }
    const hit=new T.Group();hit.position.x=impact;
    mark(hit,.64);shards(hit,12,.83,1.2);action.add(hit);
    impactPulse(action,impact,0,.68,1.08);
    animate.push((phase,t)=>{
      if(phase!==1)return;
      const travel=ease(t/.76);
      missile.position.set(impact*travel,1.28+Math.sin(travel*Math.PI)*.44,0);
      missile.scale.setScalar(.44+.56*ease(t/.12)-.43*ease((t-.68)/.23));
      missile.visible=t<.96;
      hit.visible=t>.64;
      hit.scale.set(.66+.34*ease((t-.64)/.24),ease((t-.64)/.19),.66+.34*ease((t-.64)/.24));
    });
  }

  glow(charge,0,1.37,0,.82,0,.80);
  if(slot===3){
    glow(action,0,kind==='galaxy'||kind==='eclipse'?2.7:.62,0,1.76,1,.66);
    // Orbiting star filaments distinguish the final spell from a normal cast.
    const crest=new T.Group();action.add(crest);
    for(let turn=0;turn<2;turn++){
      orbitBand(crest,2.93+turn*.15,.11+turn*.09,.10,1,.78,.06).rotation.y=Math.PI*turn;
    }
    animate.push((phase,t)=>{if(phase===1)crest.rotation.y=t*1.55;});
  }else if(travels){
    glow(action,impact,.43,0,.86,1,.72);
    impactPulse(action,impact,0,.71,1.15);
  }else{
    glow(action,0,.6,0,1.13,1,.62);
  }
  glow(decay,travels?impact:0,.23,0,slot===3?1.45:.77,2,.40);

  // Keep separate opacity per phase because geometry and materials are reused
  // across the sequence. Bind once so scrubbing never allocates materials.
  const groups=[charge,action,decay];
  const alphaByGroup=groups.map(group=>{
    const materials=new Map();
    group.traverse(object=>{
      const material=object.material;
      if(!material||material.isShaderMaterial)return;
      if(!materials.has(material)){
        const copy=material.clone();
        resources.add(copy);
        materials.set(material,[copy,material.opacity]);
      }
      object.material=materials.get(material)[0];
    });
    return [...materials.values()];
  });
  function update(elapsed,duration) {
    const [phase]=phaseAt(elapsed,duration);
    const q=clamp(elapsed/duration);
    const steps=[clamp(q/.27),clamp((q-.27)/.43),clamp((q-.70)/.30)];
    const alpha=[
      ease(q/.065)*(1-ease((q-.245)/.105)),
      ease((q-.235)/.105)*(1-ease((q-.665)/.14)),
      ease((q-.66)/.125)*(1-ease((q-.81)/.19))
    ];
    root.visible=elapsed>=0&&elapsed<duration;
    charge.scale.setScalar(.56+.48*ease(steps[0]));
    charge.rotation.y=steps[0]*.75;
    action.scale.set(1,.84+.16*ease(steps[1]*3.2),1);
    decay.scale.set(1,1+ease(steps[2])*.29,1);
    decay.position.y=ease(steps[2])*.39;
    for(let i=0;i<groups.length;i++){
      groups[i].visible=root.visible&&alpha[i]>.001;
      for(const [mat,original] of alphaByGroup[i])mat.opacity=original*alpha[i];
      if(groups[i].visible)for(const updateItem of animate)updateItem(i,steps[i]);
    }
    for(const layer of ribbons){
      layer.material.uniforms.fade.value=alpha[layer.phase];
      layer.material.uniforms.progress.value=steps[layer.phase];
    }
    for(const {light,material,phase:layer,size,strength} of glows){
      const t=steps[layer];
      const envelope=layer===1?.34+.66*Math.sin(t*Math.PI)**2:.44+.56*ease(t);
      material.uniforms.gain.value=alpha[layer]*strength*envelope;
      const spread=size*(.84+.24*t);
      light.scale.set(spread,spread,1);
    }
    return phase;
  }
  return {root,name,kind,travels,charge,update,destroy(){
    root.removeFromParent();
    for(const item of resources)item.dispose();
  }};
}
