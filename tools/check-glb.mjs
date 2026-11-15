import {build} from 'esbuild';import assert from 'node:assert/strict';
const root=process.cwd();await build({stdin:{contents:"export {createHeroModel} from './public/hero-models.js';export {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';",resolveDir:root},bundle:true,format:'esm',platform:'node',outfile:'/tmp/mila-glb-test.mjs',plugins:[{name:'vendor',setup(b){b.onResolve({filter:/^\/vendor\/three.module.js$/},()=>({path:root+'/node_modules/three/build/three.module.js'}));b.onResolve({filter:/^\/vendor\/merge.js$/},()=>({path:root+'/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'}));}}]});
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const {createHeroModel,GLTFExporter}=await import('/tmp/mila-glb-test.mjs');
const heroes=['sol','luna','ivy','kai','ember','nova','sage','raven','atlas','faye','milo','zephyr'];
for(const id of heroes){
 const model=createHeroModel(id,{merge:false});
 const head=model.userData.head;
 assert.ok(head.getObjectByName('Left eye'),`${id}: missing sculpted left eye`);
 assert.ok(head.getObjectByName('Right eye'),`${id}: missing sculpted right eye`);
 assert.equal(head.getObjectByName('Original portrait expression'),undefined,`${id}: faulty face decal returned`);
 model.updateMatrixWorld(true);
 model.traverse(o=>{if(o.isMesh){const pos=o.geometry.attributes.position.array;for(const p of pos)assert.ok(Number.isFinite(p),`${id}: invalid geometry`);}});
 if(id==='luna'){
  model.traverse(o=>{o.userData={};});
  const bytes=await new GLTFExporter().parseAsync(model,{binary:true});
  assert.equal(new DataView(bytes).getUint32(0,true),0x46546c67);
  assert.ok(bytes.byteLength>10000);
  console.log('Luna GLB export valid header,',bytes.byteLength,'bytes');
 }
}
console.log('12 sculpted hero faces passed geometry checks');
