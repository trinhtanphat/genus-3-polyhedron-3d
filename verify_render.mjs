import fs from 'node:fs';
import * as THREE from './vendor/three.module.min.js';

const data = JSON.parse(fs.readFileSync(new URL('./data.json', import.meta.url), 'utf8'));
const scale = data.scale ?? 0.012;
const vec = (id) => new THREE.Vector3(...data.vertices[String(id)]).multiplyScalar(scale);

function projected(face) {
  const pts = face.walk.map(vec);
  const coeff = [Math.abs(face.plane.a), Math.abs(face.plane.b), Math.abs(face.plane.c)];
  const dominant = coeff.indexOf(Math.max(...coeff));
  const p2 = pts.map((p) => dominant === 0 ? new THREE.Vector2(p.y, p.z)
    : dominant === 1 ? new THREE.Vector2(p.x, p.z)
    : new THREE.Vector2(p.x, p.y));
  return p2;
}

function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

for (const face of data.faces) {
  const p2 = projected(face);
  const triangles = THREE.ShapeUtils.triangulateShape(p2, []);
  if (triangles.length !== 7) {
    throw new Error(`${face.id}: expected 7 triangles, got ${triangles.length}`);
  }

  const polygonArea = Math.abs(signedArea(p2));
  let triangleArea = 0;
  for (const [a, b, c] of triangles) {
    triangleArea += Math.abs(signedArea([p2[a], p2[b], p2[c]]));
  }

  const error = Math.abs(polygonArea - triangleArea);
  if (error > 1e-10) {
    throw new Error(`${face.id}: triangulation area mismatch ${error}`);
  }

  console.log(`${face.id}: triangles=7 area=${polygonArea.toFixed(8)} error=${error.toExponential(2)}`);
}

if (THREE.REVISION !== '181') {
  throw new Error(`Expected Three.js r181, found r${THREE.REVISION}`);
}

console.log('PASS: all eight nonagons triangulate to seven triangles with area preserved.');
console.log('PASS: viewer runtime is pinned to Three.js r181.');
