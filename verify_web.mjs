import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');
const html = read('index.html');
const app = read('app.js');
const readme = read('README.md');

const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(here, p))).digest('hex');

const expectedVendorHashes = new Map([
  ['vendor/three.module.min.js', '4498b9db844df8f97cebe3ebca69ec45b285bda1cd125a8350d372220d8391da'],
  ['vendor/three.core.min.js', '34cf3ab6cff3de9fb78105990282c2916f5c099d1028193d9eb5abbf4c410265'],
  ['vendor/addons/controls/OrbitControls.js', '2a2a5e362bda2577da4b8d04be3f55988dfd044a0d96a36e7da85ed5589ea28f'],
  ['vendor/addons/renderers/CSS2DRenderer.js', '7fb6747b2839afb8cd648050a4d9f4b84ab3fcae5443fa76d2a908358b0e3aa6'],
  ['vendor/THREE-LICENSE.txt', 'df2a91696186fe58c92518a25d48bc59c8ee2edc7cac9ca6d19a5a0d599a2a05']
]);

for (const [file, expected] of expectedVendorHashes) {
  assert.equal(sha256(file), expected, `${file} hash changed`);
}
console.log('PASS: vendored Three.js r181 runtime files match the audited SHA-256 fingerprints.');

assert.match(html, /Content-Security-Policy/);
assert.match(html, /default-src 'self'/);
assert.match(html, /object-src 'none'/);
assert.match(html, /base-uri 'none'/);
assert.match(html, /form-action 'none'/);
assert.match(html, /<meta name="referrer" content="no-referrer"/);
console.log('PASS: CSP/referrer hardening remains present.');

assert.match(html, /"three": "\.\/vendor\/three\.module\.min\.js"/);
assert.match(html, /"three\/addons\/": "\.\/vendor\/addons\/"/);
assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="https?:\/\//i);
console.log('PASS: scripts/styles/import-map runtime dependencies are local, not CDN-hosted.');

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, 'duplicate HTML id detected');

for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
  const attrs = match[1];
  if (/target="_blank"/i.test(attrs)) {
    assert.match(attrs, /rel="[^"]*noopener[^"]*"/i, 'target=_blank link missing noopener');
    assert.match(attrs, /rel="[^"]*noreferrer[^"]*"/i, 'target=_blank link missing noreferrer');
  }
}
console.log('PASS: HTML ids are unique and external new-tab links use noopener+noreferrer.');

for (const control of ['resetCamera','fitModel','zoomIn','zoomOut','symmetryStep','showAllFaces','opacity']) {
  assert.ok(ids.includes(control), `missing required control #${control}`);
}
assert.match(html, /role="toolbar" aria-label="View controls"/);
assert.match(html, /aria-live="polite"/);
assert.match(app, /renderer\.domElement\.setAttribute\('aria-label'/);
console.log('PASS: required interactive controls and baseline accessibility hooks are present.');

assert.match(html, /24 vertices/);
assert.match(html, /36 edges/);
assert.match(html, /8 planar nonagons/);
assert.match(html, /Source discrepancy:/);
assert.match(html, /Popular Science article says 26/);
assert.match(readme, /primary arXiv preprint states \*\*36 edges\*\*/);
assert.match(readme, /Popular Science headline\/body currently says \*\*26 edges\*\*/);
console.log('PASS: the primary-source 36-edge count and secondary-source 26-edge discrepancy are explicit.');

assert.doesNotMatch(app, /fetch\(\s*['"]https?:\/\//i);
assert.doesNotMatch(app, /new WebSocket\(\s*['"]wss?:\/\//i);
console.log('PASS: application code contains no hard-coded external fetch/WebSocket endpoint.');

console.log('All web/runtime-integrity source checks passed.');
