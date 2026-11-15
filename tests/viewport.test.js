import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync('public/viewport.js','utf8').split('let scheduled=')[0];
const {viewportLayout,needsLandscapePrompt,lockLandscape}=await import('data:text/javascript,'+encodeURIComponent(source));
test('native portrait and landscape preserve real screen dimensions on phones',()=>{
 for(const [w,h]of [[240,320],[320,568],[360,800],[375,667],[390,844],[430,932],[412,915],[768,1024],[844,390],[932,430],[320,280]]){
  for(const touch of [true,false])for(const editing of [true,false]){
   const v=viewportLayout(w,h,touch,editing);
   assert.equal(v.width,w);
   assert.equal(v.height,h);
   assert.equal(v.rotated,false,'game surface must never fake a rotation');
   assert.equal(v.portrait,h>w);
   assert.equal(v.touch,touch);
   assert.equal(v.editing,editing);
  }
 }
 assert.equal(viewportLayout(800,1200,false).rotated,false);
});
test('phones request real landscape for battles, without breaking room entry or desktops',()=>{
 for(const [w,h]of [[320,568],[360,800],[390,844],[768,1024]]){
  const layout=viewportLayout(w,h,true,false);
  assert.equal(needsLandscapePrompt(layout,true,false,false),true);
  assert.equal(needsLandscapePrompt(layout,false,false,false),false,'Joining and choosing a hero remain accessible');
  assert.equal(needsLandscapePrompt(layout,true,true,false),false,'MC broadcast is not blocked');
  assert.equal(needsLandscapePrompt(layout,true,false,true),false,'There is a portrait fallback for devices locked upright');
  assert.equal(needsLandscapePrompt(viewportLayout(w,h,true,true),true,false),false,'Do not cover a mobile keyboard');
 }
 for(const [w,h]of [[844,390],[932,430],[640,320]])assert.equal(needsLandscapePrompt(viewportLayout(w,h,true),true,false),false);
 assert.equal(needsLandscapePrompt(viewportLayout(800,1200,false),true,false),false);
 const code=fs.readFileSync('public/viewport.js','utf8');
 assert.doesNotMatch(code,/rotate\(90deg\)/);
 for(const file of ['public/mila-app.js','public/trial/mila-app.js'])assert.match(fs.readFileSync(file,'utf8'),/void enterMobileLandscape\(\)/);
});

test('landscape lock is requested when available and denial leaves the game playable',async()=>{
 let requested;
 assert.equal(await lockLandscape({lock(mode){requested=mode;}}),true);
 assert.equal(requested,'landscape');
 assert.equal(await lockLandscape({lock(){throw Error('blocked');}}),false);
 assert.equal(await lockLandscape({lock(){return Promise.reject(Error('fullscreen required'));}}),false);
 assert.equal(await lockLandscape({}),false);
});
