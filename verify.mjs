import fs from 'node:fs';
import assert from 'node:assert/strict';

const data = JSON.parse(fs.readFileSync(new URL('./data.json', import.meta.url), 'utf8'));
const vertices = data.vertices;
const faces = data.faces;

assert.equal(Object.keys(vertices).length, 24, 'expected 24 vertices');
assert.equal(faces.length, 8, 'expected 8 faces');
for (const face of faces) assert.equal(face.walk.length, 9, `${face.id} must be a nonagon`);

const edgeIncidence = new Map();
const vertexNeighbors = new Map();
const vertexFaceIncidence = new Map();

for (let id = 1; id <= 24; id++) {
  vertexNeighbors.set(id, new Set());
  vertexFaceIncidence.set(id, new Set());
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

for (const face of faces) {
  const { a, b, c, d } = face.plane;

  for (const id of face.walk) {
    const [x, y, z] = vertices[String(id)];
    assert.equal(a * x + b * y + c * z, d, `${face.id}: vertex ${id} is not exactly planar`);
    vertexFaceIncidence.get(id).add(face.id);
  }

  for (let i = 0; i < face.walk.length; i++) {
    const u = face.walk[i];
    const v = face.walk[(i + 1) % face.walk.length];
    const key = edgeKey(u, v);
    if (!edgeIncidence.has(key)) edgeIncidence.set(key, []);
    edgeIncidence.get(key).push(face.id);
    vertexNeighbors.get(u).add(v);
    vertexNeighbors.get(v).add(u);
  }
}

assert.equal(edgeIncidence.size, 36, 'expected 36 unique undirected edges');

for (const [edge, incident] of edgeIncidence) {
  assert.equal(incident.length, 2, `edge ${edge} must belong to exactly 2 faces`);
}

for (let id = 1; id <= 24; id++) {
  assert.equal(vertexNeighbors.get(id).size, 3, `vertex ${id} must have degree 3`);
  assert.equal(vertexFaceIncidence.get(id).size, 3, `vertex ${id} must be incident with 3 faces`);
}

const V = Object.keys(vertices).length;
const E = edgeIncidence.size;
const F = faces.length;
const chi = V - E + F;
assert.equal(chi, -4, 'Euler characteristic must be -4');
const genus = (2 - chi) / 2;
assert.equal(genus, 3, 'genus must be 3');

const adjacency = Array.from({ length: F }, () => Array(F).fill(0));
const faceIndex = new Map(faces.map((face, i) => [face.id, i]));

for (const incident of edgeIncidence.values()) {
  const [f1, f2] = incident;
  const i = faceIndex.get(f1);
  const j = faceIndex.get(f2);
  adjacency[i][j] += 1;
  adjacency[j][i] += 1;
}

assert.deepEqual(adjacency, data.adjacencyMultiplicity, 'adjacency multiplicity matrix differs from the paper');

let onePairs = 0;
let twoPairs = 0;
for (let i = 0; i < F; i++) {
  for (let j = i + 1; j < F; j++) {
    assert.ok(adjacency[i][j] >= 1, `${faces[i].id} and ${faces[j].id} must share at least one edge`);
    if (adjacency[i][j] === 1) onePairs++;
    if (adjacency[i][j] === 2) twoPairs++;
  }
}
assert.equal(onePairs, 20, 'expected 20 face pairs sharing one edge');
assert.equal(twoPairs, 8, 'expected 8 face pairs sharing two edges');

// Verify the compatible face orientation assignment published in the preprint:
// (F1,...,F8) = (+,+,-,-,-,-,+,+).
const orientationSigns = new Map([
  ['F1', 1], ['F2', 1], ['F3', -1], ['F4', -1],
  ['F5', -1], ['F6', -1], ['F7', 1], ['F8', 1]
]);
const orientedEdges = new Map();

for (const face of faces) {
  const sign = orientationSigns.get(face.id);
  assert.ok(sign === 1 || sign === -1, `missing orientation sign for ${face.id}`);
  const walk = sign === 1 ? face.walk : [...face.walk].reverse();

  for (let i = 0; i < walk.length; i++) {
    const u = walk[i];
    const v = walk[(i + 1) % walk.length];
    const key = edgeKey(u, v);
    if (!orientedEdges.has(key)) orientedEdges.set(key, []);
    orientedEdges.get(key).push([u, v, face.id]);
  }
}

for (const [edge, occurrences] of orientedEdges) {
  assert.equal(occurrences.length, 2, `${edge} must have two oriented occurrences`);
  const [first, second] = occurrences;
  assert.equal(first[0], second[1], `${edge}: compatible orientation must reverse shared edge`);
  assert.equal(first[1], second[0], `${edge}: compatible orientation must reverse shared edge`);
}

function T([x, y, z]) {
  return [y, -x, -z];
}

const coordToId = new Map(
  Object.entries(vertices).map(([id, xyz]) => [xyz.join(','), Number(id)])
);

for (const [id, xyz] of Object.entries(vertices)) {
  let p = xyz;
  for (let k = 0; k < 4; k++) p = T(p);
  assert.deepEqual(p, xyz, `T^4 must fix vertex ${id}`);
  const image = T(xyz);
  assert.ok(coordToId.has(image.join(',')), `T must map vertex ${id} into the vertex set`);
}

function cyclicEquivalent(a, b) {
  if (a.length !== b.length) return false;
  for (const candidate of [b, [...b].reverse()]) {
    for (let shift = 0; shift < candidate.length; shift++) {
      if (a.every((value, i) => value === candidate[(i + shift) % candidate.length])) return true;
    }
  }
  return false;
}

const expectedFaceImage = new Map([
  ['F1', 'F7'], ['F7', 'F2'], ['F2', 'F8'], ['F8', 'F1'],
  ['F3', 'F6'], ['F6', 'F4'], ['F4', 'F5'], ['F5', 'F3']
]);
const faceById = new Map(faces.map((face) => [face.id, face]));

for (const face of faces) {
  const transformedWalk = face.walk.map((id) => {
    const image = T(vertices[String(id)]);
    const imageId = coordToId.get(image.join(','));
    assert.ok(imageId, `T image of vertex ${id} missing`);
    return imageId;
  });

  const targetId = expectedFaceImage.get(face.id);
  assert.ok(targetId, `missing expected face image for ${face.id}`);
  const target = faceById.get(targetId);
  assert.ok(
    cyclicEquivalent(transformedWalk, target.walk),
    `T must send ${face.id} boundary walk to ${targetId}`
  );
}

console.log('✓ exact planarity: 72/72 face-vertex incidences');
console.log('✓ topology: 24 vertices, 36 edges, 8 nonagonal faces');
console.log('✓ manifold incidence: 2 faces per edge, degree 3 at every vertex');
console.log('✓ orientability: published (+,+,-,-,-,-,+,+) orientation reverses every shared edge');
console.log('✓ Euler characteristic χ = -4, hence genus g = 3');
console.log('✓ complete face adjacency: 20 single-edge pairs + 8 double-edge pairs');
console.log('✓ C4 generator T preserves vertices, maps faces through the published cycles, and satisfies T^4 = identity');
console.log('All exact combinatorial/algebraic checks passed.');
