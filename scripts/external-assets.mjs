import fs from 'node:fs';
import path from 'node:path';

// Substitute media URL literals in the generated pages and game modules.
// The source and the ordinary Render build retain same-origin URLs.
export function moveAssetUrls(output, origin) {
 function visit(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
   if (['assets','media','vendor'].includes(entry.name)) continue;
   const file = path.join(dir,entry.name);
   if (entry.isDirectory()) {
    visit(file);
    continue;
   }
   if (!/\.(?:html|css|js)$/.test(entry.name)) continue;
   const initial = fs.readFileSync(file,'utf8');
   const updated = initial.replace(/(["'`]|\burl\()\.?\/(assets|media)\//g,
    (_,prefix,folder) => prefix+origin+'/'+folder+'/');
   if (updated !== initial) fs.writeFileSync(file,updated);
  }
 }
 visit(output);
 for (const dir of ['assets','media']) fs.rmSync(path.join(output,dir),{recursive:true,force:true});
}
