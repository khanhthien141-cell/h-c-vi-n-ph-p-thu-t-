import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('the 3D gallery is published and reachable from the entry screen',()=>{
 const page=readFileSync('public/models.html','utf8');
 const app=readFileSync('public/mila-app.js','utf8');
 const worker=readFileSync('dist/server/index.js','utf8');
 assert.match(page,/id="heroes"/);
 assert.match(page,/id="view"/);
 assert.match(page,/id="zoomIn"/);
 assert.match(page,/id="zoomOut"/);
 assert.match(app,/preview\.href='\/models\.html'/);
 assert.match(app,/a:not\(\.open-3d-preview\)/);
 assert.match(worker,/models\.html/);
 assert.match(worker,/models\.css/);
});
