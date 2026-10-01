import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const data = await fetch('./data.json').then((response) => {
  if (!response.ok) throw new Error(`Failed to load data.json: ${response.status}`);
  return response.json();
});

const viewport = document.getElementById('viewport');
const selectionPanel = document.getElementById('selectionPanel');
const faceLegend = document.getElementById('faceLegend');
const matrixEl = document.getElementById('matrix');
const hoverStatus = document.getElementById('hoverStatus');
const fpsStatus = document.getElementById('fpsStatus');

const ui = {
  resetCamera: document.getElementById('resetCamera'),
  symmetryStep: document.getElementById('symmetryStep'),
  autoRotate: document.getElementById('autoRotate'),
  showFaces: document.getElementById('showFaces'),
  showEdges: document.getElementById('showEdges'),
  showVertices: document.getElementById('showVertices'),
  showLabels: document.getElementById('showLabels'),
  isolateFace: document.getElementById('isolateFace'),
  opacity: document.getElementById('opacity'),
  opacityValue: document.getElementById('opacityValue'),
  showAllFaces: document.getElementById('showAllFaces'),
  zoomIn: document.getElementById('zoomIn'),
  zoomOut: document.getElementById('zoomOut'),
  fitModel: document.getElementById('fitModel')
};

const faceColors = [
  '#2dd4bf', '#60a5fa', '#f97316', '#c084fc',
  '#22c55e', '#f43f5e', '#eab308', '#38bdf8'
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07131d);
scene.fog = new THREE.FogExp2(0x07131d, 0.025);

const EXTENDED_ZOOM = {
  minDistance: 0.035,
  maxDistance: 100000,
  minNear: 0.0001,
  farFloor: 500
};

const camera = new THREE.PerspectiveCamera(42, 1, EXTENDED_ZOOM.minNear, EXTENDED_ZOOM.farFloor);
camera.position.set(7.8, 5.6, 8.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Interactive 3D polyhedron canvas');
renderer.domElement.tabIndex = 0;
viewport.prepend(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.zIndex = '4';
viewport.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 1.15;
controls.minDistance = EXTENDED_ZOOM.minDistance;
controls.maxDistance = EXTENDED_ZOOM.maxDistance;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 1.15;

function updateCameraClipping() {
  const distance = Math.max(EXTENDED_ZOOM.minDistance, camera.position.distanceTo(controls.target));
  const near = Math.max(EXTENDED_ZOOM.minNear, distance * 0.0001);
  const far = Math.max(EXTENDED_ZOOM.farFloor, distance * 100);

  // Keep the shape visible across the extended zoom range instead of letting
  // the decorative fog completely swallow it at very large camera distances.
  scene.fog.density = Math.min(0.025, 0.6 / distance);

  // Publish camera metrics to the DOM for reproducible browser-level audits.
  viewport.dataset.cameraDistance = String(distance);
  viewport.dataset.cameraNear = String(near);
  viewport.dataset.cameraFar = String(far);

  if (Math.abs(camera.near - near) > near * 0.001 || Math.abs(camera.far - far) > far * 0.001) {
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }
}

function setCameraDistance(distance) {
  const clamped = THREE.MathUtils.clamp(distance, controls.minDistance, controls.maxDistance);
  const offset = camera.position.clone().sub(controls.target);
  if (offset.lengthSq() < 1e-12) offset.set(1, 0.65, 1);
  offset.setLength(clamped);
  camera.position.copy(controls.target).add(offset);
  updateCameraClipping();
  controls.update();
}

function zoomByFactor(factor) {
  const currentDistance = camera.position.distanceTo(controls.target);
  setCameraDistance(currentDistance * factor);
}

controls.addEventListener('change', updateCameraClipping);
updateCameraClipping();

scene.add(new THREE.HemisphereLight(0xcff3ff, 0x132333, 1.65));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(5, 8, 7);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x8ad9ff, 1.05);
fillLight.position.set(-6, 2, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xc084fc, 0.85);
rimLight.position.set(2, -5, -6);
scene.add(rimLight);

const modelGroup = new THREE.Group();
modelGroup.matrixAutoUpdate = false;
scene.add(modelGroup);

const faceGroup = new THREE.Group();
const edgeGroup = new THREE.Group();
const vertexGroup = new THREE.Group();
const labelGroup = new THREE.Group();
modelGroup.add(faceGroup, edgeGroup, vertexGroup, labelGroup);

const scale = data.scale ?? 0.012;
const vec = (id) => new THREE.Vector3(...data.vertices[String(id)]).multiplyScalar(scale);

function dominantProjection(points, plane) {
  const coeff = [Math.abs(plane.a), Math.abs(plane.b), Math.abs(plane.c)];
  const dominant = coeff.indexOf(Math.max(...coeff));
  return points.map((p) => {
    if (dominant === 0) return new THREE.Vector2(p.y, p.z);
    if (dominant === 1) return new THREE.Vector2(p.x, p.z);
    return new THREE.Vector2(p.x, p.y);
  });
}

function geometryForFace(face) {
  const points = face.walk.map(vec);
  const projected = dominantProjection(points, face.plane);
  const triangles = THREE.ShapeUtils.triangulateShape(projected, []);
  const positions = [];

  for (const tri of triangles) {
    for (const index of tri) {
      const p = points[index];
      positions.push(p.x, p.y, p.z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const faceMeshes = new Map();
const baseOpacity = () => Number(ui.opacity.value);

data.faces.forEach((face, index) => {
  const material = new THREE.MeshStandardMaterial({
    color: faceColors[index],
    side: THREE.DoubleSide,
    transparent: true,
    opacity: baseOpacity(),
    roughness: 0.62,
    metalness: 0.025,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });

  const mesh = new THREE.Mesh(geometryForFace(face), material);
  mesh.userData = { type: 'face', id: face.id, faceIndex: index };
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  faceGroup.add(mesh);
  faceMeshes.set(face.id, mesh);
});

const edgeMap = new Map();
for (const face of data.faces) {
  for (let i = 0; i < face.walk.length; i++) {
    const a = face.walk[i];
    const b = face.walk[(i + 1) % face.walk.length];
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!edgeMap.has(key)) edgeMap.set(key, [a, b]);
  }
}

const edgePositions = [];
for (const [a, b] of edgeMap.values()) {
  edgePositions.push(...vec(a).toArray(), ...vec(b).toArray());
}
const edgeGeometry = new THREE.BufferGeometry();
edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
const edges = new THREE.LineSegments(
  edgeGeometry,
  new THREE.LineBasicMaterial({ color: 0x02070b, transparent: true, opacity: 0.96 })
);
edges.renderOrder = 8;
edgeGroup.add(edges);

const incidentFaces = new Map();
for (let id = 1; id <= 24; id++) incidentFaces.set(id, []);
for (const face of data.faces) {
  for (const id of face.walk) incidentFaces.get(id).push(face.id);
}

const vertexMeshes = new Map();
const labelObjects = new Map();
const sphereGeometry = new THREE.SphereGeometry(0.07, 18, 14);

for (let id = 1; id <= 24; id++) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xf2f8fc,
    emissive: 0x101820,
    roughness: 0.35,
    metalness: 0.08
  });
  const sphere = new THREE.Mesh(sphereGeometry, material);
  sphere.position.copy(vec(id));
  sphere.userData = { type: 'vertex', id };
  sphere.castShadow = true;
  sphere.renderOrder = 12;
  vertexGroup.add(sphere);
  vertexMeshes.set(id, sphere);

  const label = document.createElement('div');
  label.className = 'vertex-label';
  label.textContent = `v${id}`;
  const labelObject = new CSS2DObject(label);
  labelObject.position.copy(vec(id));
  labelObject.position.y += 0.13;
  labelGroup.add(labelObject);
  labelObjects.set(id, labelObject);
}
labelGroup.visible = false;

const symmetryMatrices = [new THREE.Matrix4().identity()];
const T = new THREE.Matrix4().set(
  0,  1,  0, 0,
 -1,  0,  0, 0,
  0,  0, -1, 0,
  0,  0,  0, 1
);
for (let i = 1; i < 4; i++) {
  symmetryMatrices.push(symmetryMatrices[i - 1].clone().multiply(T));
}
let symmetryStep = 0;

function applySymmetryStep(step) {
  symmetryStep = ((step % 4) + 4) % 4;
  modelGroup.matrix.copy(symmetryMatrices[symmetryStep]);
  modelGroup.matrixWorldNeedsUpdate = true;
  ui.symmetryStep.textContent = `T step · ${symmetryStep}/4`;
}

function cameraPreset(name) {
  camera.up.set(0, 1, 0);
  const distance = 10.5;
  if (name === 'front') camera.position.set(0, 0.4, distance);
  else if (name === 'top') camera.position.set(0.001, distance, 0.001);
  else if (name === 'side') camera.position.set(distance, 0.4, 0);
  else camera.position.set(7.8, 5.6, 8.2);
  controls.target.set(0, 0, 0);
  controls.update();
}

function resetCamera() {
  symmetryStep = 0;
  applySymmetryStep(0);
  cameraPreset('iso');
}

let selected = null;
let selectedFaceId = null;

function resetVertexAppearance() {
  for (const sphere of vertexMeshes.values()) {
    sphere.scale.setScalar(1);
    sphere.material.color.set(0xf2f8fc);
    sphere.material.emissive.set(0x101820);
  }
}

function updateFaceAppearance() {
  const opacity = baseOpacity();
  const isolate = ui.isolateFace.checked && selectedFaceId;

  data.faces.forEach((face, index) => {
    const mesh = faceMeshes.get(face.id);
    const isSelected = face.id === selectedFaceId;
    mesh.visible = ui.showFaces.checked && (!isolate || isSelected);
    mesh.material.opacity = isSelected ? Math.min(1, opacity + 0.18) : (selectedFaceId ? opacity * 0.72 : opacity);
    mesh.material.emissive.set(isSelected ? faceColors[index] : 0x000000);
    mesh.material.emissiveIntensity = isSelected ? 0.12 : 0;
  });

  document.querySelectorAll('.face-chip').forEach((button) => {
    button.classList.toggle('active', button.dataset.face === selectedFaceId);
  });
}

function showFaceInfo(faceId) {
  const face = data.faces.find((item) => item.id === faceId);
  const colorIndex = data.faces.indexOf(face);
  selectionPanel.innerHTML = `
    <p class="eyebrow">Face</p>
    <h2><span class="face-swatch" style="display:inline-block;background:${faceColors[colorIndex]};margin-right:8px"></span>${face.id}</h2>
    <div class="meta-list">
      <div class="meta-row"><strong>Plane</strong><span><code>${face.plane.text}</code></span></div>
      <div class="meta-row"><strong>Walk</strong><span><code>${face.walk.join(' → ')} → ${face.walk[0]}</code></span></div>
      <div class="meta-row"><strong>Vertices</strong><span>9 · simple nonagon</span></div>
      <div class="meta-row"><strong>Adjacency</strong><span>Touches all 7 other faces</span></div>
    </div>
  `;
}

function showVertexInfo(id) {
  const coords = data.vertices[String(id)];
  selectionPanel.innerHTML = `
    <p class="eyebrow">Vertex</p>
    <h2>v${id}</h2>
    <div class="meta-list">
      <div class="meta-row"><strong>Exact xyz</strong><span><code>(${coords.join(', ')})</code></span></div>
      <div class="meta-row"><strong>Incident faces</strong><span>${incidentFaces.get(id).join(', ')}</span></div>
      <div class="meta-row"><strong>Valence</strong><span>3 edges · 3 faces</span></div>
    </div>
  `;
}

function selectFace(faceId) {
  selected = { type: 'face', id: faceId };
  selectedFaceId = faceId;
  resetVertexAppearance();
  updateFaceAppearance();
  showFaceInfo(faceId);
  hoverStatus.textContent = `Selected ${faceId}`;
}

function selectVertex(id) {
  selected = { type: 'vertex', id };
  selectedFaceId = null;
  updateFaceAppearance();
  resetVertexAppearance();
  const sphere = vertexMeshes.get(id);
  sphere.scale.setScalar(1.55);
  sphere.material.color.set(0xffffff);
  sphere.material.emissive.set(0x38bdf8);
  showVertexInfo(id);
  hoverStatus.textContent = `Selected v${id}`;
}

function clearSelection() {
  selected = null;
  selectedFaceId = null;
  resetVertexAppearance();
  updateFaceAppearance();
  selectionPanel.innerHTML = `
    <h2>Explore the surface</h2>
    <p>Select a colored face or a white vertex in the 3D view. Exact coordinates, face walks, and plane equations appear here.</p>
  `;
  hoverStatus.textContent = 'Ready';
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDown = null;

function raycastFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (ui.showVertices.checked) {
    const vertexHits = raycaster.intersectObjects([...vertexMeshes.values()], false);
    if (vertexHits.length) return vertexHits[0].object.userData;
  }

  if (ui.showFaces.checked) {
    const faceHits = raycaster.intersectObjects([...faceMeshes.values()].filter((mesh) => mesh.visible), false);
    if (faceHits.length) return faceHits[0].object.userData;
  }

  return null;
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!pointerDown) return;
  const distance = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (distance > 5) return;
  const hit = raycastFromEvent(event);
  if (!hit) return;
  if (hit.type === 'vertex') selectVertex(hit.id);
  else if (hit.type === 'face') selectFace(hit.id);
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (event.buttons) return;
  const hit = raycastFromEvent(event);
  if (!hit) {
    renderer.domElement.style.cursor = 'grab';
    if (!selected) hoverStatus.textContent = 'Ready';
    return;
  }
  renderer.domElement.style.cursor = 'pointer';
  hoverStatus.textContent = hit.type === 'face' ? `Hover ${hit.id}` : `Hover v${hit.id}`;
});

function buildLegend() {
  faceLegend.innerHTML = '';
  data.faces.forEach((face, index) => {
    const button = document.createElement('button');
    button.className = 'face-chip';
    button.type = 'button';
    button.dataset.face = face.id;
    button.innerHTML = `
      <span class="face-swatch" style="background:${faceColors[index]}"></span>
      <strong>${face.id}</strong>
      <small>9-gon</small>
    `;
    button.addEventListener('click', () => selectFace(face.id));
    faceLegend.appendChild(button);
  });
}

function buildMatrix() {
  const table = document.createElement('table');
  table.className = 'matrix-table';
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th></th>' + data.faces.map((face) => `<th scope="col">${face.id}</th>`).join('');
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement('tbody');
  data.adjacencyMultiplicity.forEach((row, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<th scope="row">${data.faces[i].id}</th>` +
      row.map((value, j) => `<td data-value="${value}" title="${data.faces[i].id} ↔ ${data.faces[j].id}: ${value} shared edge${value === 1 ? '' : 's'}">${value}</td>`).join('');
    body.appendChild(tr);
  });
  table.appendChild(body);
  matrixEl.replaceChildren(table);
}

ui.opacity.addEventListener('input', () => {
  ui.opacityValue.value = `${Math.round(baseOpacity() * 100)}%`;
  updateFaceAppearance();
});
ui.showFaces.addEventListener('change', updateFaceAppearance);
ui.showEdges.addEventListener('change', () => { edgeGroup.visible = ui.showEdges.checked; });
ui.showVertices.addEventListener('change', () => { vertexGroup.visible = ui.showVertices.checked; });
ui.showLabels.addEventListener('change', () => { labelGroup.visible = ui.showLabels.checked; });
ui.isolateFace.addEventListener('change', updateFaceAppearance);
ui.autoRotate.addEventListener('change', () => { controls.autoRotate = ui.autoRotate.checked; });
ui.resetCamera.addEventListener('click', resetCamera);
ui.zoomIn.addEventListener('click', () => zoomByFactor(0.55));
ui.zoomOut.addEventListener('click', () => zoomByFactor(1.8));
ui.fitModel.addEventListener('click', () => cameraPreset('iso'));
ui.symmetryStep.addEventListener('click', () => applySymmetryStep(symmetryStep + 1));
ui.showAllFaces.addEventListener('click', () => {
  ui.isolateFace.checked = false;
  clearSelection();
});

document.querySelectorAll('.preset').forEach((button) => {
  button.addEventListener('click', () => cameraPreset(button.dataset.view));
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') resetCamera();
  if (event.key.toLowerCase() === 't') applySymmetryStep(symmetryStep + 1);
  if (event.key === 'Escape') clearSelection();
});

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  labelRenderer.setSize(width, height);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(viewport);
resize();

buildLegend();
buildMatrix();
updateFaceAppearance();
edgeGroup.visible = ui.showEdges.checked;
vertexGroup.visible = ui.showVertices.checked;
labelGroup.visible = ui.showLabels.checked;
applySymmetryStep(0);
controls.update();

let frames = 0;
let fpsStart = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  controls.update();
  updateCameraClipping();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  frames += 1;
  if (now - fpsStart >= 1500) {
    const fps = Math.round(frames * 1000 / (now - fpsStart));
    fpsStatus.textContent = `${fps} fps · 24V / 36E / 8F`;
    frames = 0;
    fpsStart = now;
  }
}

requestAnimationFrame(animate);
