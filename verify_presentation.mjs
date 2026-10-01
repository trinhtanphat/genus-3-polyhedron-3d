import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('./app.js', import.meta.url), 'utf8');

assert.match(html, /CAD Z ↑/);
assert.match(html, /data-view="paper1"/);
assert.match(html, /data-view="paper2"/);
assert.match(html, /data-view="paper3"/);
assert.match(html, /id="showVertices" type="checkbox" \/>/);
assert.match(html, /id="opacity"[^>]*value="1"/);
assert.match(html, /id="opacityValue">100%/);
assert.match(html, /Published Figure 1/);
assert.match(html, /Published Figure 2/);

assert.match(app, /camera\.up\.set\(0, 0, 1\)/);
assert.match(app, /name === 'front'\) setCameraPose\(\[0, -d, 0\], \[0, 0, 1\]\)/);
assert.match(app, /name === 'right'\) setCameraPose\(\[d, 0, 0\], \[0, 0, 1\]\)/);
assert.match(app, /name === 'top'\) setCameraPose\(\[0, 0, d\], \[0, 1, 0\]\)/);
assert.match(app, /name === 'paper1'/);
assert.match(app, /name === 'paper2'/);
assert.match(app, /name === 'paper3'/);
assert.match(app, /'#d98232'/);
assert.match(app, /'#69b78b'/);
assert.match(app, /depthWrite: initialOpacity >= 0\.999/);
assert.match(app, /mesh\.material\.depthWrite = effectiveOpacity >= 0\.999/);

console.log('PASS: CAD Z-up presentation contract.');
console.log('PASS: Front=X-Z, Right=Y-Z, Top=X-Y preset definitions.');
console.log('PASS: Paper 1/2/3 reference controls present.');
console.log('PASS: opaque default, vertices-off default, transparent depth handling.');
console.log('PASS: F1 orange / F3 green paper-source color anchors present.');
