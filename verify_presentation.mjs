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
assert.match(app, /'#d37e3e'/); // F1 orange, direct Figure 2
assert.match(app, /'#69b885'/); // F3 green, direct Figure 2
assert.match(app, /'#4b8f8f'/); // F4 teal, recovered Figure 1
assert.match(app, /'#6a7cb8'/); // F5 blue, recovered Figure 1
assert.match(app, /'#ba4f6f'/); // F7 magenta, recovered Figure 1
assert.match(app, /'#aa8f52'/); // F8 gold, recovered Figure 1
assert.match(app, /paperMirrorX = name === 'paper2' \|\| name === 'paper3'/);
assert.match(app, /name === 'paper1'\) setCameraPose\(\[0, 0, 60\], \[0, 1, 0\]\)/);
assert.match(app, /name === 'paper2'\) setCameraPose\(\[42\.4264, 42\.4264, 0\], \[0, 0, 1\]\)/);
assert.match(app, /name === 'paper3'\) setCameraPose\(\[0, 60, 0\], \[0, 0, 1\]\)/);
assert.match(app, /scene\.background\.set\(enabled \? 0xffffff : 0x07131d\)/);
assert.match(app, /camera\.fov = enabled \? 12 : 42/);
assert.match(app, /camera\.projectionMatrix\.elements\[0\] \*= -1/);
assert.match(app, /depthWrite: initialOpacity >= 0\.999/);
assert.match(app, /mesh\.material\.depthWrite = effectiveOpacity >= 0\.999/);

console.log('PASS: CAD Z-up presentation contract.');
console.log('PASS: Front=X-Z, Right=Y-Z, Top=X-Y preset definitions.');
console.log('PASS: Paper 1/2/3 reference controls present.');
console.log('PASS: opaque default, vertices-off default, transparent depth handling.');
console.log('PASS: source-audited paper palette anchors for F1/F3/F4/F5/F7/F8.');
console.log('PASS: Paper 1 = +Z, Paper 3 = +Y mirrored, Paper 2 = calibrated 45° oblique.');
console.log('PASS: reference mode uses white background, narrow FOV and mirrored projection where required.');
