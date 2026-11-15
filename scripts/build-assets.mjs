import fs from 'node:fs';

const output = 'dist-assets';
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
for (const dir of ['assets','media']) {
 if (fs.existsSync('public/'+dir)) fs.cpSync('public/'+dir,output+'/'+dir,{recursive:true});
}
fs.writeFileSync(output+'/_headers','/assets/*\n  Access-Control-Allow-Origin: *\n/media/*\n  Access-Control-Allow-Origin: *\n');
fs.writeFileSync(output+'/index.html','<!doctype html><html lang="vi"><meta charset="utf-8"><title>Tài nguyên MILA</title><p>Tài nguyên game MILA đang hoạt động.</p></html>\n');
console.log('Built public game media in '+output+'.');
