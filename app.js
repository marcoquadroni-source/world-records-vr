import * as T from './three.module.js';
const $=s=>document.querySelector(s), status=$('#status');
import {records,categories} from './catalogue.js?v=2026.11.26.5';
import {buildModel} from './models.js?v=2026.11.26.5';
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){status.textContent='3D-grafiken kunde inte starta. Aktivera WebGL och ladda om.';throw e;}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');$('#scene').append(renderer.domElement);
const scene = new T.Scene();
scene.background = new T.Color('#354e51');
scene.fog = new T.Fog('#354e51', 35, 76);
const camera = new T.PerspectiveCamera(58, innerWidth / innerHeight, .05, 100);
const rig = new T.Group();
scene.add(rig);
rig.add(camera);
camera.position.set(0, 1.65, 8.7);

const mat = (color, roughness = .6, metalness = 0) => new T.MeshStandardMaterial({color, roughness, metalness});
const stone = mat('#b3a68e', .82);
const dark = mat('#193732', .83);
const gold = mat('#c3a376', .36, .68);
const black = mat('#152523', .46);
function mesh(geometry, material, x, y, z, parent = scene) {
 const object = new T.Mesh(geometry, material);
 object.position.set(x, y, z);
 object.receiveShadow = true;
 object.castShadow = true;
 parent.add(object);
 return object;
}

// A handful of shared meshes supplies all repeated architectural details.
function fixtures(geometry, material, placements, receiveShadow = false) {
 const batch = new T.InstancedMesh(geometry, material, placements.length);
 const matrix = new T.Matrix4();
 placements.forEach(([x, y, z], index) => batch.setMatrixAt(index, matrix.makeTranslation(x, y, z)));
 batch.receiveShadow = receiveShadow;
 scene.add(batch);
 return batch;
}
function architectureBox(width, height, depth, material, x, y, z, receiveShadow) {
 return fixtures(new T.BoxGeometry(width, height, depth), material, [[x, y, z]], receiveShadow);
}

function travertineMap() {
 const size = 512;
 const canvas = document.createElement('canvas');
 canvas.width = canvas.height = size;
 const context = canvas.getContext('2d');
 const image = context.createImageData(size, size);
 let seed = 993;
 function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
 }
 const field = Array.from({length: 32 * 32}, random);
 function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const at = (dx, dy) => field[((iy + dy) & 31) * 32 + ((ix + dx) & 31)];
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return T.MathUtils.lerp(T.MathUtils.lerp(at(0, 0), at(1, 0), u), T.MathUtils.lerp(at(0, 1), at(1, 1), u), v);
 }
 for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
   const broad = noise(x / 32, y / 32);
   const grain = noise(x / 2, y / 2);
   const bands = Math.sin(y * .088 + broad * 3 + x * .009);
   const pores = random() < .012 ? 14 : 0;
   const tone = 165 + 26 * broad + grain * 10 + bands * 5 - pores;
   const offset = (y * size + x) * 4;
   image.data[offset] = tone + 16;
   image.data[offset + 1] = tone + 8;
   image.data[offset + 2] = tone - 2;
   image.data[offset + 3] = 255;
  }
 }
 context.putImageData(image, 0, 0);
 context.strokeStyle = '#817767';
 context.lineWidth = 2;
 context.strokeRect(0, 0, size, size);
 const texture = new T.CanvasTexture(canvas);
 texture.colorSpace = T.SRGBColorSpace;
 texture.wrapS = texture.wrapT = T.RepeatWrapping;
 texture.repeat.set(12, 15);
 texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
 return texture;
}

const floor = new T.MeshStandardMaterial({map: travertineMap(), color: '#dbd3c6', roughness: .39});
const ivory = mat('#e8dac0', .68);
const bronze = mat('#6f5437', .48, .64);
const recess = mat('#102724', .78);
const glow = new T.MeshBasicMaterial({color: '#ffdc9c', toneMapped: false});
const paleLight = new T.MeshBasicMaterial({color: '#cbdbd7'});
const bayZ = [-14.4, -10.4, -6.4, -2.4, 1.6, 5.6, 9.6];
const sides = [-1, 1];
const sideBays = (x, y) => sides.flatMap(sign => bayZ.map(z => [sign * x, y, z]));

architectureBox(28.6, .18, 40, floor, 0, -.104, -2.8, true);
fixtures(new T.BoxGeometry(.035, .006, 37), bronze, [-10.64, -10.50, 10.50, 10.64].map(x => [x, -.01, -2]));
fixtures(new T.BoxGeometry(.05, .008, 37), dark, [-10.80, 10.80].map(x => [x, -.009, -2]));
architectureBox(28.6, 8.8, .45, dark, 0, 4.4, -17);
architectureBox(28.6, 8.8, .45, dark, 0, 4.4, 15.5);
fixtures(new T.BoxGeometry(.4, 8.6, 34), dark, [[-14, 4.3, -.75], [14, 4.3, -.75]]);
fixtures(new T.BoxGeometry(.20, .19, 34), bronze, [[-13.73, .15, -.7], [13.73, .15, -.7]]);
fixtures(new T.BoxGeometry(.2, .12, 34), gold, [[-13.72, 4.82, -.7], [13.72, 4.82, -.7]]);

// Deep rear-wall piers create a layered background behind the exhibits and signs.
const rearPanels = [-11.5, -5.75, 0, 5.75, 11.5];
fixtures(new T.BoxGeometry(5.62, 7.3, .06), bronze, rearPanels.map(x => [x, 4.05, -16.70]));
fixtures(new T.BoxGeometry(5.46, 7.12, .05), recess, rearPanels.map(x => [x, 4.05, -16.66]));
fixtures(new T.BoxGeometry(5.1, .027, .018), glow, rearPanels.map(x => [x, 7.46, -16.626]));
fixtures(new T.BoxGeometry(.018, 1.86, .03), gold, rearPanels.flatMap(x => [-2.62, 2.62].map(offset => [x + offset, 1.54, -16.61])));
architectureBox(28, .08, .08, gold, 0, .44, -16.60);
architectureBox(28, .18, .16, ivory, 0, .28, -16.60);

// Limestone piers support the curved transverse ribs and frame the side-wall bays.
fixtures(new T.BoxGeometry(.67, 4.82, .83), stone, sideBays(11.68, 2.41));
fixtures(new T.BoxGeometry(.025, 4.36, .86), ivory, sideBays(11.33, 2.45));
fixtures(new T.BoxGeometry(.91, .3, 1.04), dark, sideBays(11.68, .15));
fixtures(new T.BoxGeometry(.94, .035, 1.07), gold, sideBays(11.68, .32));
fixtures(new T.BoxGeometry(.95, .24, 1.06), ivory, sideBays(11.68, 4.79));
fixtures(new T.BoxGeometry(.033, 2.70, .055), glow, sideBays(11.29, 2.65));
fixtures(new T.BoxGeometry(.12, 3.64, 3.33), bronze, sideBays(13.77, 2.36));
fixtures(new T.BoxGeometry(.11, 3.46, 3.14), recess, sideBays(13.70, 2.36));
fixtures(new T.BoxGeometry(.014, .028, 2.94), glow, sideBays(13.63, 3.99));

// The curve and its trim are single geometry shapes repeated at each bay.
function archGeometry(depth, inset, thickness) {
 const span = 11.7, spring = 4.80, rise = 3.52;
 const arch = new T.Shape();
 arch.moveTo(-span, spring + inset);
 arch.bezierCurveTo(-11.1, spring + rise * .42 + inset, -5.7, spring + rise + inset, 0, spring + rise + inset);
 arch.bezierCurveTo(5.7, spring + rise + inset, 11.1, spring + rise * .42 + inset, span, spring + inset);
 arch.lineTo(span, spring + inset + thickness);
 arch.bezierCurveTo(11.1, spring + rise * .42 + inset + thickness, 5.7, spring + rise + inset + thickness, 0, spring + rise + inset + thickness);
 arch.bezierCurveTo(-5.7, spring + rise + inset + thickness, -11.1, spring + rise * .42 + inset + thickness, -span, spring + inset + thickness);
 arch.closePath();
 const geometry = new T.ExtrudeGeometry(arch, {depth, bevelEnabled: false, curveSegments: 12});
 return geometry.translate(0, 0, -depth / 2);
}
fixtures(archGeometry(.38, 0, .29), ivory, bayZ.map(z => [0, 0, z]));
fixtures(archGeometry(.016, .045, .045), gold, bayZ.map(z => [0, 0, z + .2]));
architectureBox(27.8, .13, 33, stone, 0, 9.08, -1.8);
architectureBox(8.2, .12, 33, paleLight, 0, 8.96, -1.8);
fixtures(new T.BoxGeometry(.19, .12, 33), bronze, [[-4.2, 8.87, -1.8], [4.2, 8.87, -1.8]]);
fixtures(new T.BoxGeometry(.052, .04, 33), glow, [[-4.07, 8.85, -1.8], [4.07, 8.85, -1.8]]);
fixtures(new T.BoxGeometry(8.30, .12, .10), bronze, bayZ.map(z => [0, 8.86, z + 2]));
fixtures(new T.BoxGeometry(4.8, .25, 33), dark, [[-10.6, 7.06, -1.8], [10.6, 7.06, -1.8]]);

scene.add(new T.HemisphereLight('#d1e0dd', '#a0805d', 1.02));
const key = new T.DirectionalLight('#fff1da', 2.62);
key.position.set(-8, 16, 4);
key.target.position.set(0, 0, -5.5);
key.castShadow = true;
key.shadow.radius = 3;
key.shadow.mapSize.set(1536, 1536);
Object.assign(key.shadow.camera, {left: -12, right: 12, top: 11, bottom: -11, near: .5, far: 38});
key.shadow.normalBias = .025;
key.shadow.bias = -.00012;
scene.add(key, key.target);
const rim = new T.DirectionalLight('#aacee2', .83);
rim.position.set(10, 7, -12);
scene.add(rim);

// Baked soft light cards add broad reflections without a runtime environment download.
const envScene = new T.Scene();
envScene.background = new T.Color('#45645e');
for (const [color, x, y, z, angle] of [
 ['#fff1d8', -5, 7, -9, 0],
 ['#a9c9d1', 8, 4, 4, -Math.PI / 2],
]) {
 const card = new T.Mesh(new T.PlaneGeometry(14, 9), new T.MeshBasicMaterial({color, side: T.DoubleSide}));
 card.position.set(x, y, z);
 card.rotation.y = angle;
 envScene.add(card);
}
const pmrem = new T.PMREMGenerator(renderer);
const environment = pmrem.fromScene(envScene, .032);
scene.environment = environment.texture;
scene.environmentIntensity = .68;
envScene.traverse(object => {
 if (object.isMesh) {
  object.geometry.dispose();
  object.material.dispose();
 }
});
pmrem.dispose();
const loader = new T.TextureLoader();
const polyHavenBase = new URL('./assets/poly-haven/',import.meta.url);

async function installMarble() {
 const files = ['marble_01_diff_1k.jpg','marble_01_nor_gl_1k.jpg','marble_01_rough_1k.jpg'];
 const maps = await Promise.allSettled(files.map(file => loader.loadAsync(new URL(file,polyHavenBase).href)));
 const [color,normal,roughness] = maps.map(result => result.status === 'fulfilled' ? result.value : null);
 if (!color) {
  normal?.dispose();
  roughness?.dispose();
  throw maps[0].reason;
 }
 for (const texture of [color,normal,roughness].filter(Boolean)) {
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(28.6 / 2.4,40 / 2.4);
  texture.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy());
 }
 color.name = 'Poly Haven Marble 01';
 color.colorSpace = T.SRGBColorSpace;
 floor.map.dispose();
 floor.map = color;
 floor.color.set('#f1e8d9');
 floor.normalMap = normal;
 floor.normalScale.set(.48,.48);
 floor.roughnessMap = roughness;
 floor.roughness = roughness ? .84 : .47;
 floor.needsUpdate = true;
}

async function installGalleryBenches() {
 const {GLTFLoader} = await import('./GLTFLoader.js');
 const {scene:bench} = await new GLTFLoader().loadAsync(new URL('painted-wooden-bench.glb',polyHavenBase).href);
 const bounds = new T.Box3().setFromObject(bench);
 const center = bounds.getCenter(new T.Vector3());
 bench.position.set(-center.x,-bounds.min.y,-center.z);
 bench.traverse(object => {
  if (object.isMesh) object.castShadow = object.receiveShadow = true;
 });
 for (const side of [-1,1]) {
  const furniture = new T.Group();
  furniture.name = 'Poly Haven Painted Wooden Bench';
  furniture.add(bench.clone());
  furniture.position.set(side * 8.7,0,1.25);
  furniture.rotation.y = -side * Math.PI / 2;
  scene.add(furniture);
 }
 renderer.shadowMap.needsUpdate = true;
}
async function installStudioLighting() {
 const {RGBELoader} = await import('./RGBELoader.js');
 const hdr = await new RGBELoader().loadAsync(new URL('studio_small_03_512.hdr',polyHavenBase).href);
 const generator = new T.PMREMGenerator(renderer);
 try {
  const studio = generator.fromEquirectangular(hdr);
  studio.texture.name = 'Poly Haven Studio Small 03';
  scene.environment = studio.texture;
  scene.environmentIntensity = .2;
  environment.dispose();
 } finally {
  generator.dispose();
  hdr.dispose();
 }
}

for (const [name,install] of [
 ['Marble 01',installMarble], ['Studio Small 03',installStudioLighting],
 ['Painted Wooden Bench',installGalleryBenches]
]) {
 install().catch(error => console.warn('Optional gallery asset unavailable:',name,error));
}

let assetFailures=0;
const mapFiles=[...new Set(records.filter(r=>r.image).map(r=>r.image)),'2k_earth_clouds.jpg','2k_saturn_ring_alpha.png'];
const maps={};await Promise.all(mapFiles.map(async name=>{try{const t=await loader.loadAsync('./'+name);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());maps[name]=t;}catch(e){assetFailures++;console.warn('Asset unavailable:',name);}}));
const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=256;const cg=contactCanvas.getContext('2d'),gradient=cg.createRadialGradient(128,128,15,128,128,128);gradient.addColorStop(0,'rgba(0,0,0,.48)');gradient.addColorStop(.45,'rgba(0,0,0,.24)');gradient.addColorStop(1,'rgba(0,0,0,0)');cg.fillStyle=gradient;cg.fillRect(0,0,256,256);const contactTexture=new T.CanvasTexture(contactCanvas);
const interactive=[],labels=[],spots=[[-5,0,-3],[0,0,-5],[5,0,-7]],exhibits=new T.Group();scene.add(exhibits);
function plaque(text, sub, width = 2.6, wallSign = false) {
 const canvas = document.createElement('canvas');
 canvas.width = 1024;
 canvas.height = 256;
 const ctx = canvas.getContext('2d');
 const gradient = ctx.createLinearGradient(0, 0, 1024, 256);
 gradient.addColorStop(0, '#252b28');
 gradient.addColorStop(1, '#111a18');
 ctx.fillStyle = gradient;
 ctx.fillRect(0, 0, 1024, 256);
 ctx.strokeStyle = '#98794b';
 ctx.lineWidth = 3;
 ctx.strokeRect(9, 9, 1006, 238);
 ctx.fillStyle = '#bfa16c';
 ctx.fillRect(45, 123, 46, 3);
 ctx.font = '30px system-ui, sans-serif';
 ctx.fillText(sub, 45, 191, 934);
 ctx.fillStyle = '#f3e8d1';
 let fontSize = wallSign ? 87 : 72;
 do {
  ctx.font = fontSize + 'px Georgia, serif';
  fontSize -= 2;
 } while (ctx.measureText(text).width > 934 && fontSize > 28);
 ctx.fillText(text, 45, 106, 934);
 const map = new T.CanvasTexture(canvas);
 map.colorSpace = T.SRGBColorSpace;
 map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
 map.userData.generated = true;
 const material = new T.MeshBasicMaterial({map, toneMapped: false});
 return new T.Mesh(new T.PlaneGeometry(width, width / 4), material);
}

const platformTop = new T.MeshStandardMaterial({color:'#43463f', roughness:.49, metalness:.15});
const platformTrim = new T.MeshStandardMaterial({
 color:'#907042', roughness:.37, metalness:.66, emissive:'#75431c', emissiveIntensity:.29
});
const platformProfile = new T.LatheGeometry([
 [0,0],[2.17,0],[2.21,.03],[2.21,.13],[2.18,.17],
 [2.13,.19],[2.13,.28],[2.09,.32],[0,.32]
].map(([radius,height]) => new T.Vector2(radius,height)), 64);
const platformSurface = new T.CylinderGeometry(2.085,2.085,.022,64);
const trimGeometry = new T.TorusGeometry(2.16,.014,7,72);
const platformShadow = new T.PlaneGeometry(5.6,5.6);
const platformShadowMaterial = new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false});
for (const [x,,z] of spots) {
 const shadow = mesh(platformShadow,platformShadowMaterial,x,.006,z);
 shadow.rotation.x = -Math.PI / 2;
 shadow.castShadow = false;
 mesh(platformProfile,black,x,0,z);
 mesh(platformSurface,platformTop,x,.332,z);
 const trim = mesh(trimGeometry,platformTrim,x,.165,z);
 trim.rotation.x = Math.PI / 2;
 trim.castShadow = false;
}
const title = plaque('World Records Gallery','43 UTSTÄLLNINGAR   /   6 AVDELNINGAR',5.18,true);
title.position.set(0,5.45,-16.52);
scene.add(title);
const credit = plaque('Solar System Scope / INOVE','PLANETKARTOR   /   CC BY 4.0',4.35);
credit.position.set(-5.75,2.22,-16.52);
scene.add(credit);
const overviewSpot = {x: 0, z: 7};
const heightKey = 'world-records-viewer-height';
const limits = {min:70, max:275, default:175};
let personalHeight = null;
try {
 const saved = Number(localStorage.getItem(heightKey));
 if (Number.isInteger(saved) && saved >= limits.min && saved <= limits.max) personalHeight = saved;
} catch {}
function heightRatio(record) {
 return personalHeight === null ? null : record.value / (personalHeight / 100);
}
function ratioLabel(record) {
 const ratio = heightRatio(record);
 return ratio === null ? '' : ratio.toLocaleString('sv-SE',{maximumSignificantDigits:3}) + ' × din längd';
}
function changeHeight(value) {
 personalHeight = value === null ? null : T.MathUtils.clamp(value,limits.min,limits.max);
 try {
  if (personalHeight === null) localStorage.removeItem(heightKey);
  else localStorage.setItem(heightKey,String(personalHeight));
 } catch {}
 applyScale();
 updateDetail();
 focusSelectedInVR();
}
const teleportMaterial = new T.MeshBasicMaterial({color:'#e2bd7d', side:T.DoubleSide, toneMapped:false});
const teleportGeometry = new T.RingGeometry(.27,.32,36);
const teleport = Array.from({length:spots.length + 1}, (_, slot) => {
 const marker = mesh(teleportGeometry, teleportMaterial, 0, .014, 0);
 marker.rotation.x = -Math.PI / 2;
 marker.castShadow = marker.receiveShadow = false;
 marker.userData = {type:'teleport', slot};
 interactive.push(marker);
 return marker;
});
teleport.at(-1).position.set(overviewSpot.x,.014,overviewSpot.z);

// The menu follows the current viewing spot, to the side of the exhibit.
const spatialMenu = new T.Group();
scene.add(spatialMenu);
categories.forEach((name,i) => {
 const button = plaque(name,'AVDELNING',.94);
 button.position.set((i % 3 - 1) * 1.02,1.52-Math.floor(i / 3)*.32,0);
 button.userData = {type:'category',cat:i};
 spatialMenu.add(button);
});
for (const [name,type,x,y,sub] of [['Föregående','previous',-1.02,.88,'UTSTÄLLNINGAR'],['Nästa','next',1.02,.88,'UTSTÄLLNINGAR'],['Jämför','compare',0,.88,'UTSTÄLLNINGAR'],['−5 cm','shorter',-1.02,.56,'MIN LÄNGD'],['+5 cm','taller',1.02,.56,'MIN LÄNGD']]) {
 const button = plaque(name,sub,.94);
 button.position.set(x,y,0);
 button.userData = {type};
 spatialMenu.add(button);
}
spatialMenu.visible = false;
let selected=records.findIndex(r=>r.id==='mercury'),category=5,page=0,compare=false,targetX=innerWidth<760?-5:0,targetZ=innerWidth<760?3.8:8.7,displayed=[],slotModels=[],scales=[],measureSpans=[];
camera.position.set(targetX,1.65,targetZ);
let viewerHeight = 1.65, pendingView = null, heightPlaque, heightPlaqueLabel;
function updateHeightPlaque(record) {
 const label = personalHeight === null ? 'Min längd' : personalHeight + ' cm';
 const sub = ratioLabel(record) || 'ANPASSA VISNING';
 const key = label + sub;
 if (key === heightPlaqueLabel) return;
 if (heightPlaque) {
  heightPlaque.geometry.dispose();
  heightPlaque.material.map.dispose();
  heightPlaque.material.dispose();
  spatialMenu.remove(heightPlaque);
 }
 heightPlaqueLabel = key;
 heightPlaque = plaque(label,sub,.94);
 heightPlaque.position.set(0,.56,0);
 spatialMenu.add(heightPlaque);
}
const closeSpots = [];

function updateViewingSpots() {
 const bounds = new T.Box3();
 const size = new T.Vector3();
 spots.forEach(([x,,z], slot) => {
  const model = slotModels[slot];
  teleport[slot].visible = Boolean(model);
  if (!model) return;
  model.updateMatrixWorld(true);
  bounds.setFromObject(model).getSize(size);
  const eyeHeight = personalHeight === null ? viewerHeight : Math.min(viewerHeight,personalHeight * .0094);
  const height = Math.max(Math.abs(bounds.max.y - eyeHeight), Math.abs(bounds.min.y - eyeHeight));
  const distance = Math.max(2.35, size.x * .94, size.z / 2 + 1.02, height * 1.32);
  const view = {x, z:z + distance};
  closeSpots[slot] = view;
  teleport[slot].position.set(view.x,.014,view.z);
 });
}

function positionSpatialMenu({x,z}) {
 const side = x > 0 ? -1 : 1;
 spatialMenu.position.set(x + side * 2.25, Math.min(.30, viewerHeight - 1.65), z - 1.85);
 spatialMenu.rotation.y = Math.atan2(x - spatialMenu.position.x, z - spatialMenu.position.z);
}

function focusSelectedInVR() {
 if (renderer.xr.isPresenting) pendingView = displayed.indexOf(selected);
}

const up = new T.Vector3(0,1,0);
const headOffset = new T.Vector3();
const headForward = new T.Vector3();
const headRotation = new T.Quaternion();
function moveVRViewer(view, pose, angle) {
 rig.rotation.y = angle;
 const {x,y,z} = pose.transform.position;
 headOffset.set(x,y,z).applyAxisAngle(up,angle);
 rig.position.set(view.x-headOffset.x,0,view.z-headOffset.z);
 rig.updateMatrixWorld(true);
}

function updateVRViewer(frame) {
 const space = renderer.xr.getReferenceSpace();
 const pose = frame && space && frame.getViewerPose(space);
 if (!pose) return;
 if (pendingView !== null) {
  viewerHeight = Math.max(.8, pose.transform.position.y);
  updateViewingSpots();
  const view = closeSpots[pendingView] ?? overviewSpot;
  const {x,y,z,w} = pose.transform.orientation;
  headForward.set(0,0,-1).applyQuaternion(headRotation.set(x,y,z,w));
  const heading = Math.atan2(-headForward.x,-headForward.z);
  moveVRViewer(view,pose,-heading);
  positionSpatialMenu(view);
  pendingView = null;
 }
}
const fmt=n=>n.toLocaleString('sv-SE',{maximumFractionDigits:3});const measurement=r=>r.kind==='planet'?fmt(r.value/1000)+' km':fmt(r.value)+' m';
function sphereModel(record) {
 const root = new T.Group();
 const body = new T.Group();
 root.add(body);

 const appearances = {
  mercury: {color: '#a49a8e', relief: .018},
  venus_atmosphere: {color: '#e4c292', haze: '#efbd72', hazeDepth: .025, hazeStrength: .46},
  earth_daymap: {color: '#527aaa', haze: '#5fb7fa', hazeDepth: .037, hazeStrength: .8, tilt: .30, spin: -.28},
  mars: {color: '#bc7250', haze: '#d99c72', hazeDepth: .013, hazeStrength: .30, relief: .014, tilt: .23},
  jupiter: {color: '#dbb39a', haze: '#edc6a3', hazeDepth: .012, hazeStrength: .31, spin: .27},
  saturn: {color: '#d9c09b', haze: '#f0d7a2', hazeDepth: .014, hazeStrength: .35, tilt: -.28},
  uranus: {color: '#9fd1d9', haze: '#8de0ee', hazeDepth: .019, hazeStrength: .42, tilt: 1.7},
  neptune: {color: '#739bcc', haze: '#77b3ee', hazeDepth: .023, hazeStrength: .45, tilt: .35},
  moon: {color: '#b4aea5', relief: .025, spin: -.15},
  sun: {color: '#fda54f', haze: '#ff963b', hazeDepth: .075, hazeStrength: 1.2}
 };
 const look = appearances[record.id] ?? {color: '#a4a39a'};
 const isSun = record.id === 'sun';
 const isSaturn = record.id === 'saturn';
 const globeMap = maps[record.image];
 const cloudMap = record.id === 'earth_daymap' && maps['2k_earth_clouds.jpg'];
 const ringMap = isSaturn && maps['2k_saturn_ring_alpha.png'];
 const hazeColor = new T.Color(look.haze ?? '#000000');
 const light = new T.Vector3(-.62, .56, .57).normalize();
 const ringRange = new T.Vector2(1.18, 2.15);
 body.rotation.set(isSaturn ? .45 : 0, 0, look.tilt ?? 0);
 const localLight = light.clone().applyQuaternion(body.quaternion.clone().invert());
 const vertexShader = /* glsl */ `
  varying vec2 planetUV;
  varying vec3 localPoint;
  varying vec3 viewPoint;
  varying vec3 viewNormal;
  varying float viewRadius;
  void main() {
   planetUV = uv;
   localPoint = position;
   viewNormal = normalize(normalMatrix * normal);
   viewRadius = length(modelViewMatrix[0].xyz);
   vec4 point = modelViewMatrix * vec4(position, 1.0);
   viewPoint = point.xyz;
   gl_Position = projectionMatrix * point;
  }
 `;

 const surface = new T.ShaderMaterial({
  defines: {
   ...(globeMap ? {SURFACE_MAP: 1} : {}),
   ...(cloudMap ? {EARTH_CLOUDS: 1} : {}),
   ...(look.relief && globeMap ? {ROCK_RELIEF: 1} : {}),
   ...(ringMap ? {RING_SHADOW: 1} : {}),
   ...(isSun ? {SOLAR_EMISSION: 1} : {})
  },
  uniforms: {
   surfaceMap: {value: globeMap || null},
   cloudMap: {value: cloudMap || null},
   ringMap: {value: ringMap || null},
   baseColor: {value: new T.Color(look.color)},
   hazeColor: {value: hazeColor},
   hazeStrength: {value: look.hazeStrength ?? 0},
   spin: {value: look.spin ?? 0},
   relief: {value: look.relief ?? 0},
   lightDirection: {value: light},
   localLight: {value: localLight},
   ringRange: {value: ringRange}
  },
  vertexShader,
  fragmentShader: /* glsl */ `
   uniform sampler2D surfaceMap;
   uniform sampler2D cloudMap;
   uniform sampler2D ringMap;
   uniform vec3 baseColor;
   uniform vec3 hazeColor;
   uniform float hazeStrength;
   uniform float spin;
   uniform float relief;
   uniform vec3 lightDirection;
   uniform vec3 localLight;
   uniform vec2 ringRange;
   varying vec2 planetUV;
   varying vec3 localPoint;
   varying vec3 viewPoint;
   varying vec3 viewNormal;
   varying float viewRadius;

   void main() {
    vec2 mapUV = vec2(planetUV.x + spin, planetUV.y);
    vec3 surfaceColor = baseColor;
    #ifdef SURFACE_MAP
     // Shift the texture horizontally without rotating the ring's shadow coordinates.
     vec2 sampleUV = vec2(fract(mapUV.x), mapUV.y);
     surfaceColor = textureGrad(surfaceMap, sampleUV, dFdx(mapUV), dFdy(mapUV)).rgb;
    #endif
    vec3 eye = normalize(-viewPoint);
    vec3 normal = normalize(viewNormal);
    float facing = max(0.0, dot(normal, eye));
    #ifdef SOLAR_EMISSION
     // Emissive photosphere with limb darkening, independent of the gallery lamps.
     vec3 lighted = (surfaceColor * 2.0 + vec3(.10, .013, .001)) * (.62 + .68 * sqrt(facing));
    #else
     vec3 incident = normalize(mat3(viewMatrix) * lightDirection);
     #ifdef ROCK_RELIEF
      // Estimate small-scale relief from the supplied color map. It is illustrative.
      float height = sqrt(dot(surfaceColor, vec3(.2126, .7152, .0722)));
      vec3 dx = dFdx(viewPoint);
      vec3 dy = dFdy(viewPoint);
      vec3 sx = cross(dy, normal);
      vec3 sy = cross(normal, dx);
      float area = dot(dx, sx);
      vec3 gradient = (dFdx(height) * sx + dFdy(height) * sy) * sign(area);
      vec3 perturbation = gradient * (relief * viewRadius / max(abs(area), 1e-7));
      if (dot(perturbation, perturbation) < .32) normal = normalize(normal - perturbation);
     #endif

     float lightDot = dot(normal, incident);
     float day = max(0.0, lightDot);
     float eclipse = 1.0;
     #ifdef RING_SHADOW
      float planeDistance = -localPoint.y / localLight.y;
      vec3 ringPoint = localPoint + planeDistance * localLight;
      float ringU = (length(ringPoint.xz) - ringRange.x) / (ringRange.y - ringRange.x);
      if (planeDistance > 0.0 && ringU > 0.0 && ringU < 1.0) {
       eclipse -= .67 * texture(ringMap, vec2(ringU, .5)).a;
      }
     #endif

     vec3 lighted = surfaceColor * (.21 + 1.7 * day * eclipse);
     #ifdef EARTH_CLOUDS
      float sea = smoothstep(.06, .15, surfaceColor.b - surfaceColor.r);
      vec3 halfway = normalize(incident + eye);
      float gleam = pow(max(0.0, dot(normal, halfway)), 32.0) * sea * day;
      vec2 cloudUV = mapUV + vec2(.018, .0);
      float cloud = textureGrad(cloudMap, vec2(fract(cloudUV.x), cloudUV.y), dFdx(mapUV), dFdy(mapUV)).g;
      vec2 shadowUV = cloudUV + vec2(-.006, -.008);
      float cloudShadow = textureGrad(cloudMap, vec2(fract(shadowUV.x), shadowUV.y), dFdx(mapUV), dFdy(mapUV)).g;
      lighted *= 1.0 - .22 * cloudShadow * day;
      lighted += vec3(.52, .71, .93) * gleam * .38;
      vec3 cloudColor = vec3(.88, .93, 1.0) * (.24 + 1.3 * day);
      lighted = mix(lighted, cloudColor, min(.86, sqrt(cloud) * .9));
     #endif
     float rim = pow(1.0 - facing, 3.6) * hazeStrength;
     lighted += hazeColor * rim * (.16 + .50 * smoothstep(-.26, .45, lightDot));
    #endif
    gl_FragColor = vec4(lighted, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }
  `
 });
 const globe = mesh(new T.SphereGeometry(1, 64, 40), surface, 0, 0, 0, body);
 globe.receiveShadow = false;

 if (look.hazeDepth) {
  const atmosphere = new T.ShaderMaterial({
   transparent: true,
   depthWrite: false,
   side: T.BackSide,
   blending: T.AdditiveBlending,
   uniforms: {
    hazeColor: {value: hazeColor},
    hazeStrength: {value: look.hazeStrength},
    lightDirection: {value: light},
    emissiveStar: {value: isSun ? 1 : 0}
   },
   vertexShader,
   fragmentShader: /* glsl */ `
    uniform vec3 hazeColor;
    uniform vec3 lightDirection;
    uniform float hazeStrength;
    uniform float emissiveStar;
    varying vec3 viewPoint;
    varying vec3 viewNormal;
    void main() {
     vec3 normal = normalize(viewNormal);
     vec3 eye = normalize(-viewPoint);
     vec3 tangent = normalize(normal - eye * dot(normal, eye));
     vec3 incident = normalize(mat3(viewMatrix) * lightDirection);
     // Peak just past the solid limb and fade to zero at the outer silhouette.
     float depth = abs(dot(normal, eye));
     float density = smoothstep(0.0, .24, depth) * (1.0 - smoothstep(.22, .51, depth));
     float lit = mix(.18 + .82 * smoothstep(-.30, .46, dot(tangent, incident)), 1.0, emissiveStar);
     gl_FragColor = vec4(hazeColor, density * lit * hazeStrength * .52);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }
   `
  });
  const shell = mesh(new T.SphereGeometry(1 + look.hazeDepth, 48, 32), atmosphere, 0, 0, 0, body);
  shell.castShadow = false;
  shell.receiveShadow = false;
 }

 if (isSaturn) {
  const ringGeometry = new T.RingGeometry(ringRange.x, ringRange.y, 96);
  ringGeometry.rotateX(-Math.PI / 2);
  const ringMaterial = new T.ShaderMaterial({
   defines: ringMap ? {RING_MAP: 1} : {},
   uniforms: {
    ringMap: {value: ringMap || null},
    ringRange: {value: ringRange},
    localLight: {value: localLight}
   },
   side: T.DoubleSide,
   transparent: true,
   depthWrite: false,
   forceSinglePass: true,
   vertexShader,
   fragmentShader: /* glsl */ `
    uniform sampler2D ringMap;
    uniform vec2 ringRange;
    uniform vec3 localLight;
    varying vec3 localPoint;
    void main() {
     float ringU = (length(localPoint.xz) - ringRange.x) / (ringRange.y - ringRange.x);
     vec4 grains = vec4(.56, .43, .29, .48);
     #ifdef RING_MAP
      grains = texture(ringMap, vec2(ringU, .5));
     #endif
     float rayTravel = -dot(localPoint, localLight);
     float clearance = length(localPoint + max(0.0, rayTravel) * localLight);
     float illumination = mix(.22, 1.65, smoothstep(.97, 1.035, clearance));
     gl_FragColor = vec4(grains.rgb * illumination, grains.a);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }
   `
  });
  const ring = mesh(ringGeometry, ringMaterial, 0, 0, 0, body);
  ring.castShadow = false;
  ring.receiveShadow = false;
 }
 return root;
}
const saturnVId = 'record-27';
let saturnVScene, saturnVLoad, saturnVFailed = false;

function loadSaturnV() {
 if (saturnVLoad) return;
 saturnVLoad = import('./GLTFLoader.js')
  .then(({GLTFLoader}) => new GLTFLoader().loadAsync(new URL('./saturn-v.glb', import.meta.url).href))
  .then(({scene: model}) => {
   model.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.sharedExhibitAssets = true;
   });
   saturnVScene = model;
   if (displayed.some(index => records[index].id === saturnVId)) renderGallery();
  })
  .catch(error => {
   saturnVFailed = true;
   console.warn('Saturn V model unavailable:', error);
   if (records[selected].id === saturnVId) updateDetail();
  });
}

function disposeExhibits(){const mats=new Set(),geos=new Set();exhibits.traverse(o=>{if(o.isMesh&&!o.userData.sharedExhibitAssets){if(o.isInstancedMesh)o.dispose();geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});geos.forEach(g=>g.dispose());mats.forEach(m=>{if(m.map?.userData.generated)m.map.dispose();m.dispose();});exhibits.clear();for(let i=interactive.length-1;i>=0;i--)if(interactive[i].userData.type==='exhibit')interactive.splice(i,1);labels.length=0;slotModels=[];}
function applyScale(){const viewerScale=personalHeight===null?1:Math.sqrt(personalHeight/limits.default);const worldPerMeter=Math.min(...displayed.map((i,j)=>scales[j]*measureSpans[j]/records[i].value));slotModels.forEach((m,j)=>{const r=records[displayed[j]],actualScale=viewerScale*(compare?worldPerMeter*r.value/measureSpans[j]:scales[j]);m.scale.setScalar(actualScale);m.position.set(0,0,0);const [x,,z]=spots[j];const b=new T.Box3().setFromObject(m),center=b.getCenter(new T.Vector3());m.position.set(x-center.x,(r.kind==='planet'?.35:1.15)-b.min.y,z-center.z);if(r.kind==='planet'){// Body diameter is scaled; Saturn ring span is deliberately larger.
 const body=actualScale;m.position.y=Math.max(.35+body,1.65+viewerScale);}});renderer.shadowMap.needsUpdate=true;updateViewingSpots();$('#compare').textContent=compare?'Återställ skala':'Jämför storlek';$('#compare').setAttribute('aria-pressed',String(compare));}
function renderGallery(){disposeExhibits();const group=records.map((r,i)=>({r,i})).filter(x=>x.r.cat===category);const pages=Math.ceil(group.length/3);page=((page%pages)+pages)%pages;displayed=group.slice(page*3,page*3+3).map(x=>x.i);scales=[];measureSpans=[];
displayed.forEach((idx,j)=>{const r=records[idx],[x,,z]=spots[j],model=r.kind==='planet'?sphereModel(r):r.id===saturnVId&&saturnVScene?saturnVScene.clone():buildModel(r);if(r.id===saturnVId)loadSaturnV();exhibits.add(model);model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());model.position.set(x-center.x,.35-b.min.y,z-center.z);const maxSize=Math.max(size.x,size.y,size.z),scale=r.kind==='planet'?(r.id==='saturn'?.75:1.22):Math.min(3.2/maxSize,3.7/Math.max(.01,size.y));scales.push(scale);measureSpans.push(r.kind==='planet'?2:size[r.axis]);slotModels.push(model);
if(r.kind!=='planet'){mesh(new T.CylinderGeometry(.72,.82,.8,48),black.clone(),x,.75,z,exhibits);mesh(new T.CylinderGeometry(.74,.74,.025,48),gold.clone(),x,1.16,z,exhibits);}
const l=plaque(r.name,measurement(r)+' · '+(r.kind==='planet'?'DIAMETER':r.dimension.toUpperCase())+(r.id===saturnVId&&saturnVScene?' · NASA / M. D. CARBAJAL':''));l.position.set(x,.84,z+2.1);l.userData={type:'exhibit',index:idx};exhibits.add(l);labels.push(l);interactive.push(l);});
// Normalize first, then recenter each model in its podium footprint.
slotModels.forEach((m,j)=>{m.scale.setScalar(scales[j]);m.position.set(0,0,0);const b=new T.Box3().setFromObject(m),center=b.getCenter(new T.Vector3());m.position.set(spots[j][0]-center.x,.35-b.min.y,spots[j][2]-center.z);});applyScale();
$('#gallery-page').textContent=`${categories[category]} · ${page+1} / ${pages}`;$('#category').value=String(category);$('#exhibits').replaceChildren(...displayed.map((idx,j)=>{const b=document.createElement('button');b.dataset.exhibit=String(idx);b.textContent=records[idx].name;b.onclick=()=>choose(idx);return b;}));if(!displayed.includes(selected))selected=displayed[0];updateDetail();}
function updateDetail(){const r=records[selected];updateHeightPlaque(r);
$('#height-open').textContent=personalHeight===null?'Min längd':personalHeight+' cm';
$('#height-summary').textContent=personalHeight===null?'Längden sparas på den här enheten.':r.name+' · '+r.dimension+' · '+ratioLabel(r)+'.';$('#number').textContent=`${String(selected+1).padStart(2,'0')} / ${categories[r.cat].toUpperCase()}`;$('#title').textContent=r.name;$('#description').textContent=r.description;$('#diameter').textContent=r.kind==='planet'?fmt(r.value/1000):fmt(r.value);$('#dimension').textContent=r.kind==='planet'?r.dimension:r.dimension+' · m';$('#visual').textContent=r.id===saturnVId
 ? saturnVScene?'Texturerad 3D-modell av NASA / Michael D. Carbajal.'
 : saturnVFailed?'Förenklad reservmodell visas.':'NASA:s 3D-modell laddas.'
 : r.visual;$('#evidence').textContent=r.verified?'Källbelagt mått · se källa':'Planeringsmått / storleksexempel · ej källverifierat';$('#source').hidden=!r.source;if(r.source){$('#source').href=r.source;$('#source').textContent='Öppna faktakälla';}
$('#scale').textContent=(compare?'Gemensam skala för visade mått; höjd, längd och spännvidd kan skilja.':'Individuell visningsskala.')+(personalHeight===null?'':' '+ratioLabel(r)+'.');
document.querySelectorAll('[data-exhibit]').forEach(b=>{const active=+b.dataset.exhibit===selected;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});labels.forEach((l,j)=>l.material.color.set(displayed[j]===selected?'#ffffff':'#94a69a'));status.textContent=assetFailures?'Bildkartor saknas: '+assetFailures+' · reservytor används':`${r.name} vald · ${records.length} utställningar`;
}
function choose(idx,move=true){document.body.classList.add('exploring');const r=records[idx];if(!r)return;selected=idx;if(r.cat!==category||!displayed.includes(idx)){category=r.cat;page=Math.floor(records.filter((a,i)=>a.cat===category&&i<idx).length/3);renderGallery();}else updateDetail();focusSelectedInVR();if(move&&!renderer.xr.isPresenting){const j=displayed.indexOf(idx);targetX=spots[j][0]*(innerWidth<760?1:.25);targetZ=innerWidth<760?spots[j][2]+6.8:8.7-j*.7;}}
function changeCategory(cat){document.body.classList.add('exploring');category=cat;page=0;compare=false;renderGallery();focusSelectedInVR();targetX=innerWidth<760?spots[0][0]:0;targetZ=innerWidth<760?spots[0][2]+6.8:8.7;}
function stepPage(delta){document.body.classList.add('exploring');page+=delta;renderGallery();focusSelectedInVR();if(innerWidth<760){targetX=spots[0][0];targetZ=spots[0][2]+6.8;}}
function toggleCompare(){compare=!compare;applyScale();updateDetail();}
$('#category').replaceChildren(...categories.map((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c+' · '+records.filter(r=>r.cat===i).length;return o;}));$('#category').onchange=e=>changeCategory(+e.target.value);$('#previous').onclick=()=>stepPage(-1);$('#next').onclick=()=>stepPage(1);$('#compare').onclick=toggleCompare;
$('#catalogue-list').replaceChildren(...categories.map((name,cat)=>{const section=document.createElement('section'),h=document.createElement('h3');h.textContent=name;section.append(h);records.forEach((r,i)=>{if(r.cat!==cat)return;const b=document.createElement('button');b.className='catalogue-item';b.textContent=r.name+' · '+measurement(r);b.onclick=()=>{choose(i);$('#catalogue').close();};section.append(b);});return section;}));$('#browse').onclick=()=>$('#catalogue').showModal();$('#catalogue-close').onclick=()=>$('#catalogue').close();
$('#help').onclick=()=>$('#guide').showModal();$('#close').onclick=$('#start').onclick=()=>$('#guide').close();$('.brand').onclick=e=>{e.preventDefault();changeCategory(5);};
const heightDialog = $('#height-dialog'), heightInput = $('#height-cm');
$('#height-open').onclick = () => {
 heightInput.value = personalHeight ?? '';
 heightDialog.showModal();
};
$('#height-close').onclick = () => heightDialog.close();
$('#height-reset').onclick = () => {
 changeHeight(null);
 heightDialog.close();
};
$('#height-form').onsubmit = event => {
 event.preventDefault();
 changeHeight(heightInput.valueAsNumber);
 heightDialog.close();
};
renderGallery();
let yaw=0,pitch=0,drag=null;renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener('pointermove',e=>{if(drag&&!renderer.xr.isPresenting){yaw-=(e.clientX-drag.x)*.003;pitch=T.MathUtils.clamp(pitch-(e.clientY-drag.y)*.002,-.45,.45);drag={x:e.clientX,y:e.clientY};}});const ray=new T.Raycaster();function activate(hit){if(!hit)return;const d=hit.object.userData;if(d.type==='exhibit')choose(d.index,false);if(d.type==='category')changeCategory(d.cat);if(d.type==='previous')stepPage(-1);if(d.type==='next')stepPage(1);if(d.type==='compare')toggleCompare();if(d.type==='shorter'||d.type==='taller')changeHeight((personalHeight??limits.default)+(d.type==='shorter'?-5:5));if(d.type==='teleport'){
 if(d.slot < slotModels.length) choose(displayed[d.slot],false);
 else pendingView = -1;
}}
renderer.domElement.addEventListener('pointerup',e=>{drag=null;if(!renderer.xr.isPresenting){ray.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);const h=ray.intersectObjects(labels,false)[0];activate(h);}});renderer.domElement.addEventListener('pointercancel',()=>drag=null);addEventListener('keydown',e=>{if($('#guide').open||$('#catalogue').open||$('#height-dialog').open||e.target.matches('select,button,a,input'))return;if(e.key==='ArrowRight')stepPage(1);if(e.key==='ArrowLeft')stepPage(-1);});
const controllers = [];
function controllerHit(controller) {
 ray.setFromXRController(controller);
 const objects = interactive.filter(object => object.visible);
 if (spatialMenu.visible) objects.push(...spatialMenu.children);
 return ray.intersectObjects(objects,false)[0];
}
for (let index = 0; index < 2; index++) {
 const controller = renderer.xr.getController(index);
 rig.add(controller);
 const geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]);
 const line = new T.Line(geometry,new T.LineBasicMaterial({color:'#e2bd7d'}));
 line.scale.z = 10;
 controller.add(line);
 controller.addEventListener('select',() => activate(controllerHit(controller)));
 controllers.push(controller);
}

let activeSession = null, checking = false, snapReady = true;
$('#vr').onclick = async () => {
 if (checking) return;
 checking = true;
 try {
  if (!navigator.xr || !await navigator.xr.isSessionSupported('immersive-vr')) {
   throw Error('VR är inte tillgängligt här. Öppna appen via HTTPS i Quest Browser.');
  }
  activeSession = await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
  camera.position.set(0,0,0);
  camera.rotation.set(0,0,0);
  rig.position.set(0,0,7);
  rig.rotation.set(0,0,0);
  activeSession.addEventListener('end',() => {
   activeSession = null;
   pendingView = null;
   document.body.classList.remove('xr');
   spatialMenu.visible = false;
   rig.position.set(0,0,0);
   rig.rotation.set(0,0,0);
   camera.fov = 58;
   camera.aspect = innerWidth / innerHeight;
   camera.updateProjectionMatrix();
   camera.position.set(targetX,1.65,targetZ);
   status.textContent = 'VR avslutad. Välkommen tillbaka.';
  });
  await renderer.xr.setSession(activeSession);
  snapReady = true;
  focusSelectedInVR();
  document.body.classList.add('xr');
  spatialMenu.visible = true;
 } catch (error) {
  if (activeSession) {
   await activeSession.end().catch(() => {});
   activeSession = null;
  }
  status.textContent = error.message;
 } finally {
  checking = false;
 }
};

const clock = new T.Clock();
const headWorld = new T.Vector3();
renderer.setAnimationLoop((time,frame) => {
 const dt = Math.min(clock.getDelta(),.05);
 if (renderer.xr.isPresenting) {
  updateVRViewer(frame);
  let axis = 0;
  for (const source of renderer.xr.getSession()?.inputSources ?? []) {
   if (source.handedness === 'right' && source.gamepad) axis = source.gamepad.axes[2] || 0;
  }
  if (Math.abs(axis) < .25) snapReady = true;
  if (Math.abs(axis) > .7 && snapReady) {
   const space = renderer.xr.getReferenceSpace();
   const pose = frame && space && frame.getViewerPose(space);
   if (pose) {
    const {x,y,z} = pose.transform.position;
    headWorld.set(x,y,z).applyAxisAngle(up,rig.rotation.y).add(rig.position);
    moveVRViewer(headWorld,pose,rig.rotation.y - Math.sign(axis) * Math.PI / 6);
    snapReady = false;
   }
  }
  for (const controller of controllers) {
   const hit = controllerHit(controller);
   controller.children[0].scale.z = hit ? hit.distance : 10;
  }
 } else {
  camera.position.x = T.MathUtils.damp(camera.position.x,targetX,3,dt);
  camera.position.z = T.MathUtils.damp(camera.position.z,targetZ,3,dt);
  camera.rotation.order = 'YXZ';
  camera.rotation.set(pitch,yaw,0);
 }
 renderer.render(scene,camera);
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();status.textContent='Grafiken avbröts. Ladda om sidan för att starta om.';});window.__museum={renderer,scene,camera,records,choose,changeCategory,stepPage,get displayed(){return displayed;},get selected(){return selected;},get compare(){return compare;}};
