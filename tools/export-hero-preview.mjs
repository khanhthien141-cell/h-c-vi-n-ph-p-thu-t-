// Offline character QA: export the exact production geometry for Blender review.
import {build} from 'esbuild';
import fs from 'node:fs/promises';
const root=process.cwd();
await build({stdin:{contents:"export {createHeroModel} from './public/hero-models.js';export {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';",resolveDir:root},bundle:true,format:'esm',platform:'node',outfile:'/tmp/arcana-model-preview.mjs',plugins:[{name:'vendor',setup(b){b.onResolve({filter:/^\/vendor\/three.module.js$/},()=>({path:root+'/node_modules/three/build/three.module.js'}));b.onResolve({filter:/^\/vendor\/merge.js$/},()=>({path:root+'/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js'}));}}]});
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const {createHeroModel,GLTFExporter}=await import('/tmp/arcana-model-preview.mjs');
for(const id of process.argv.slice(2).length?process.argv.slice(2):['luna','sol','faye']){
 const model=createHeroModel(id,{merge:false});model.traverse(o=>{o.userData={};});
 const data=await new GLTFExporter().parseAsync(model,{binary:true});
 await fs.writeFile('/tmp/arcana-'+id+'.glb',new Uint8Array(data));
 console.log(id,data.byteLength);
}
