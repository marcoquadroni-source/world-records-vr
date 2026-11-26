import * as T from './three.module.js';
import {mergeGeometries} from './BufferGeometryUtils.js';
// Original schematic exhibition sculptures. No third-party geometry or likenesses.
// Profile rings are sampled along the centerline. The vertex colors follow the
// same surface, so markings stay in place without image files or extra meshes.
function animalSurface(profile, paint, rings = 36, sides = 24) {
 const path = new T.CatmullRomCurve3(profile.map(([x, y, z]) => new T.Vector3(x, y, z)), false, 'catmullrom');
 const radii = new T.CatmullRomCurve3(profile.map(([, , , a, b]) => new T.Vector3(a, b, 0)), false, 'catmullrom');
 const positions = [], colors = [], indices = [];
 const point = new T.Vector3(), tangent = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3();
 const up = new T.Vector3(0, 1, 0), right = new T.Vector3(0, 0, 1);
 const reference = Math.abs(path.getTangent(.5, tangent).y) > .65 ? right : up;
 for (let ring = 0; ring <= rings; ring++) {
  const t = ring / rings;
  const center = path.getPoint(t), radius = radii.getPoint(t);
  path.getTangent(t, tangent);
  a.copy(reference).addScaledVector(tangent, -reference.dot(tangent)).normalize();
  b.crossVectors(tangent, a);
  for (let side = 0; side < sides; side++) {
   const angle = side / sides * Math.PI * 2;
   point.copy(center)
    .addScaledVector(a, Math.cos(angle) * Math.max(.0005, radius.x))
    .addScaledVector(b, Math.sin(angle) * Math.max(.0005, radius.y));
   positions.push(point.x, point.y, point.z);
   const color = paint(point, center, radius, angle);
   colors.push(color.r, color.g, color.b);
   if (ring < rings) {
    const start = ring * sides + side, next = ring * sides + (side + 1) % sides;
    indices.push(start, next, start + sides, next, next + sides, start + sides);
   }
  }
 }
 const geometry = new T.BufferGeometry();
 geometry.setIndex(indices);
 geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
 geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
 geometry.computeVertexNormals();
 return geometry;
}

const oddPart = value => value - Math.floor(value);
const surfaceNoise = (x, y, z) => Math.sin(x * 37 + y * 29 + z * 73) * Math.sin(x * 47 - y * 71 + z * 13);

function animalPaint(top, belly, transition, pattern) {
 const a = new T.Color(top), b = new T.Color(belly), result = new T.Color();
 return (p, center, radius, angle) => {
  const height = Math.cos(angle);
  result.copy(a).lerp(b, T.MathUtils.smoothstep(-height, ...transition));
  const grain = surfaceNoise(p.x, p.y, p.z);
  result.multiplyScalar(1 + grain * .10 + Math.sin(p.x * 13 - p.z * 17) * .09);
  if (pattern) pattern(result, p, center, radius, angle, grain);
  return result;
 };
}

const giraffeHide = new T.Color('#955127');
function giraffePattern(color, p) {
 const x = (p.x + .47 * p.z) * 13, y = (p.y - .34 * p.z) * 13;
 const ix = Math.floor(x), iy = Math.floor(y);
 let nearest = Infinity, next = Infinity;
 for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
  const u = ix + dx, v = iy + dy;
  const px = u + .5 + .57 * (oddPart(Math.sin(u * 17.31 + v * 83.31) * 42508.85) - .5);
  const py = v + .5 + .57 * (oddPart(Math.sin(u * 38.12 + v * 63.19) * 51318.66) - .5);
  const d = (x - px) ** 2 + (y - py) ** 2;
  if (d < nearest) [nearest, next] = [d, nearest];
  else if (d < next) next = d;
 }
 color.lerp(giraffeHide, T.MathUtils.smoothstep(next - nearest, .12, .27) * T.MathUtils.smoothstep(p.y, .06, .42));
}

function buildAnimal(record, mesh, material) {
 const batches = new Map();
 const queue = (geometry, paint) => {
  if (!batches.has(paint)) batches.set(paint, []);
  batches.get(paint).push(geometry);
 };
 const ball = (x, y, z, a, b, c, paint) => {
  const geometry = new T.SphereGeometry(1, 14, 10);
  geometry.scale(a, b, c);
  geometry.translate(x, y, z);
  queue(geometry, paint);
 };
 sculptAnimal(record, queue, ball, material);
 for (const [paint, geometries] of batches) {
  if (geometries.length === 1) {
   mesh(geometries[0], paint);
   continue;
  }
  mesh(mergeGeometries(geometries), paint);
  for (const geometry of geometries) geometry.dispose();
 }
}

function sculptAnimal(record, mesh, ball, material) {
 const {kind, name} = record;
 const surfaceMaterial = new T.MeshStandardMaterial({vertexColors: true, roughness: .76});
 const dark = material('#1c1c1d', .02, .29), ivory = material('#e1cda7', .02, .59);
 const mouth = material('#302123', .02, .85), amber = material('#a98045', .06, .45);
 const coat = (profile, paint, rings, sides) => mesh(animalSurface(profile, paint, rings, sides), surfaceMaterial);
 const eye = (x, y, z, r, color = dark, side = Math.sign(z)) => {
  ball(x, y, z, r, r * .78, r * .51, color);
  ball(x - r * .12, y + r * .03, z + side * r * .37, r * .56, r * .57, r * .34, dark);
 };
 const pair = [-1, 1];
 const creamPaint = animalPaint('#c4a887', '#f7e4c2', [.15, .85]);
 if (kind === 'whale' || kind === 'fish') {
  const whale = kind === 'whale', spotted = name === 'Valhaj';
  const spot = new T.Color('#d4dace'), mottle = new T.Color('#a1b4b3');
  const mark = (color, p, center, radius, angle, grain) => {
   if (spotted) {
    const rows = angle * 2.23;
    const columns = p.x * 16 + (Math.floor(rows) % 2) * .45;
    const d = Math.hypot(oddPart(columns) - .5, oddPart(rows) - .5);
    color.lerp(spot, (1 - T.MathUtils.smoothstep(d, .11, .31)) * T.MathUtils.smoothstep(p.y - center.y, -.16, .08));
   } else if (whale) color.lerp(mottle, Math.max(0, surfaceNoise(p.x * .36, p.y * .4, p.z * .4)) * .32);
  };
  const paint = animalPaint(whale ? '#385d73' : spotted ? '#37555c' : '#4e6868', whale ? '#9aadb0' : '#d4cbac', [.16, .94], mark);
  const finPaint = animalPaint(whale ? '#385d73' : '#405a5d', '#8c9995', [.36, .96]);
  const nose = whale || spotted ? .10 : .035;
  coat([[-1.12,.37,0,.005,nose],[-1.06,.40,0,.07,spotted?.23:.17],[-.86,.43,0,.13,.27],[-.63,.46,0,.22,.29],[-.25,.46,0,.25,.27],[.20,.45,0,.20,.22],[.58,.45,0,.135,.13],[.92,.47,0,.063,.068],[1.11,.51,0,.038,.043]], paint, spotted ? 108 : 64, spotted ? 44 : 32);
  for (const side of pair) {
   const z = side;
   coat([[-.39,.33,z*.20,.13,.065],[-.21,.29,z*.34,.12,.047],[.02,.23,z*.48,.09,.028],[.22,.18,z*(whale?.69:.58),.045,.014],[.25,.19,z*(whale?.73:.61),.001,.001]], finPaint, 16, 12);
   eye(whale ? -.82 : -.92, .47, z * (spotted ? .254 : .225), spotted ? .019 : .024);
   if (whale) {
    coat([[-1.08,.368,z*.085,.003,.003],[-.88,.332,z*.202,.006,.006],[-.64,.302,z*.221,.005,.005],[-.55,.287,z*.208,.001,.001]], animalPaint('#365460','#465e65',[.2,.8]), 22, 8);
    for (let groove = 1; groove <= 4; groove++) {
     const spread = groove * .037 * z;
     coat([[-.94,.338,spread*.65,.001,.001],[-.74,.28,spread,.003,.003],[-.49,.241+groove*.010,spread*1.16,.003,.003],[-.27,.241+groove*.008,spread*.86,.001,.001]], animalPaint('#617984','#537584',[.1,.9]), 16, 6);
    }
    coat([[1.06,.52,0,.13,.05],[1.12,.51,z*.26,.16,.035],[1.24,.50,z*.46,.10,.02],[1.41,.50,z*.59,.001,.001]], finPaint, 19, 12);
   } else {
    const gills = animalPaint('#253b40','#3c4b46',[.2,.8]);
    for (let i = 0; i < 5; i++) {
     const x = -.57 + i * .053;
     coat([[x,.568,z*.24,.001,.001],[x-.018,.47,z*.29,.005,.005],[x+.022,.35,z*.241,.001,.001]], gills, 11, 7);
    }
    coat([[1.08,.51,0,.13,.035],[1.14,.51+z*.17,0,.114,.032],[1.23,.51+z*(z>0?.37:.31),0,.065,.021],[1.43,.51+z*(z>0?.50:.39),0,.001,.001]], finPaint, 20, 12);
   }
  }
  const dorsal = whale ? .10 : spotted ? .29 : .39;
  coat([[.15,.626,0,whale?.113:.20,.067],[.22,.665+dorsal*.3,0,.115,.042],[.36,.67+dorsal*.75,0,.079,.018],[.43,.64+dorsal,0,.001,.001]], finPaint, 20, 12);
  return;
 }

 if (kind === 'elephant' || kind === 'giraffe' || kind === 'bird') {
  const elephant = kind === 'elephant', giraffe = kind === 'giraffe';
  const skin = elephant ? animalPaint('#747570','#a49b8c',[.1,.85],(color,p)=>color.multiplyScalar(1 + .11*Math.sin(p.y*105 + p.x*15)))
   : giraffe ? animalPaint('#d9a768','#e4c89a',[.16,.8],giraffePattern)
   : animalPaint('#bda195','#d9b9a4',[.1,.85]);
  const feathers = animalPaint('#302c2c','#4b3c35',[.2,.84],(color,p)=>color.multiplyScalar(1 + .15*Math.sin(p.x*56 + Math.sin(p.z*47))));
  const torso = elephant
   ? [[-.49,.64,0,.05,.06],[-.35,.65,0,.22,.25],[-.13,.67,0,.29,.30],[.15,.65,0,.27,.29],[.39,.63,0,.21,.23],[.52,.62,0,.008,.008]]
   : giraffe ? [[-.45,.83,0,.005,.005],[-.34,.82,0,.17,.15],[-.10,.79,0,.20,.20],[.16,.75,0,.17,.18],[.35,.72,0,.139,.123],[.47,.73,0,.008,.009]]
   : [[-.34,.66,0,.006,.006],[-.24,.62,0,.19,.13],[0,.60,0,.24,.22],[.23,.63,0,.21,.19],[.42,.72,0,.061,.09]];
  coat(torso, elephant || giraffe ? skin : feathers, giraffe ? 48 : 30, giraffe ? 38 : 26);
  for (const side of pair) {
   const z = .17 * side;
   for (const x of elephant || giraffe ? [-.29, .33] : [.035]) {
    const thick = elephant ? .12 : giraffe ? .068 : .051;
    const stance = x + (elephant ? -.015 : x * .2) + side * .023;
    coat([[x,elephant?.69:giraffe?.78:.54,z,thick,thick],[x+.025,elephant?.48:.49,z,thick*.8,thick*.81],[stance+.053,.28,z,thick*.48,thick*.58],[stance,.098,z,thick*.43,thick*.52],[stance-.023,.034,z,thick*.70,thick*.70],[stance-.025,.008,z,.001,.001]], skin, 25, 16);
    if (!elephant) ball(stance-.03,.026,z,giraffe?.053:.067,.028,giraffe?.037:.027,giraffe?dark:ivory);
    if (!giraffe && !elephant) ball(stance-.085,.020,z+.026*side,.041,.015,.011,ivory);
   }
  }
  if (elephant) {
   coat([[-.67,.65,0,.011,.019],[-.60,.74,0,.17,.15],[-.48,.78,0,.21,.18],[-.32,.75,0,.15,.15],[-.25,.73,0,.01,.01]],skin);
   coat([[-.60,.72,0,.095,.105],[-.68,.58,0,.075,.083],[-.76,.34,0,.061,.060],[-.87,.16,.014,.050,.045],[-.97,.20,.039,.034,.034],[-1.00,.28,.055,.026,.025]], skin, 35, 24);
   const ears = animalPaint('#83766d','#9c8179',[.17,.86]);
   for (const side of pair) {
    coat([[-.47,.77,side*.135,.17,.14],[-.39,.79,side*.23,.21,.095],[-.27,.76,side*.32,.176,.054],[-.22,.72,side*.39,.09,.027],[-.21,.68,side*.43,.002,.002]],ears,24,20);
    coat([[-.59,.57,side*.111,.043,.044],[-.69,.51,side*.137,.034,.032],[-.87,.48,side*.145,.022,.022],[-1.01,.50,side*.154,.012,.011],[-1.08,.54,side*.17,.001,.001]],creamPaint);
    eye(-.596,.764,side*.139,.020);
   }
   coat([[.46,.67,0,.039,.040],[.56,.57,.021,.024,.023],[.57,.38,.037,.017,.016],[.62,.29,.061,.008,.009]],skin,18,10);
  } else if (giraffe) {
   coat([[-.26,.77,0,.16,.143],[-.38,.93,0,.121,.117],[-.46,1.17,0,.09,.086],[-.56,1.39,0,.068,.068],[-.62,1.58,0,.062,.060]],skin,58,32);
   coat([[-.81,1.535,0,.036,.044],[-.73,1.55,0,.058,.060],[-.63,1.586,0,.070,.061],[-.50,1.581,0,.012,.015]],skin,25,24);
   for (const side of pair) {
    coat([[-.57,1.59,side*.042,.034,.024],[-.49,1.63,side*.128,.023,.013],[-.43,1.645,side*.158,.001,.001]],skin,18,12);
    coat([[-.61,1.625,side*.034,.013,.014],[-.594,1.69,side*.035,.013,.014],[-.590,1.712,side*.035,.018,.019],[-.59,1.725,side*.035,.001,.001]],skin,15,10);
    eye(-.661,1.601,side*.055,.020);
   }
   coat([[.39,.75,0,.029,.03],[.49,.65,.01,.017,.018],[.49,.47,.035,.013,.013],[.54,.39,.04,.028,.025],[.53,.35,.04,.002,.002]],skin);
  } else {
   coat([[-.20,.66,0,.11,.09],[-.29,.83,0,.065,.057],[-.36,.99,0,.044,.04],[-.39,1.17,0,.04,.038],[-.41,1.33,0,.05,.047]],skin);
   coat([[-.44,1.332,0,.035,.04],[-.401,1.346,0,.064,.064],[-.34,1.33,0,.038,.043],[-.31,1.32,0,.001,.001]], skin);
   coat([[-.561,1.31,0,.005,.005],[-.50,1.313,0,.016,.036],[-.437,1.32,0,.026,.049]],creamPaint,20,16);
   const plume = animalPaint('#e2dacc','#a69d8d',[.2,.8],(color,p)=>color.multiplyScalar(1+.11*Math.cos(p.z*75)));
   for (const side of pair) {
    eye(-.433,1.36,side*.048,.025,amber);
    coat([[-.05,.668,side*.102,.132,.086],[.12,.627,side*.173,.129,.073],[.29,.649,side*.152,.090,.048],[.44,.748,side*.076,.002,.003]],plume,30,20);
   }
  }
  return;
 }

 if (kind === 'croc' || kind === 'dino') {
  const croc = kind === 'croc', sauropod = name === 'Argentinosaurus', sail = name === 'Spinosaurus';
  const skin = animalPaint(croc?'#52604a':sauropod?'#7a8777':sail?'#57756c':'#937251',croc?'#a89b70':sauropod?'#bcaa85':'#d4ba85',[.17,.95],(color,p)=>{
   color.multiplyScalar(1 + .16*Math.cos(p.x*27 + p.z*8)*Math.sin(p.y*29 + p.z*10));
  });
  const upper = croc ? .24 : sauropod ? .65 : sail ? .59 : .72;
  const width = croc ? .18 : sauropod ? .28 : .21;
  const rump = .28;
  coat([[-.53,upper,0,.012,.012],[-.39,upper,0,width*.75,width*.83],[-.11,upper,0,width,width],[rump,upper,0,width*.87,width*.81],[.53,upper-.035,0,width*.39,width*.41],[.73,upper-.062,.026,width*.25,width*.22],[1.02,upper-.110,.083,width*.14,width*.12],[1.25,upper-.14,.135,width*.058,width*.061],[1.49,upper-.104,.19,.001,.001]],skin,57,32);
  const snout = croc ? -1.06 : sauropod ? -1.00 : sail ? -.96 : -1.10;
  const headY = croc ? .22 : sauropod ? 1.40 : sail ? .82 : 1.04;
  const headH = croc?.08:sauropod?.084:sail?.082:.159;
  coat([[-.32,upper,0,width*.74,width*.70],[-.52,upper+.02,0,width*.59,width*.64],[-.64,T.MathUtils.lerp(upper,headY,.40),0,width*.49,width*.46],[-.76,T.MathUtils.lerp(upper,headY,.81),0,width*.34,width*.35],[-.80,headY,0,headH*.89,headH*.79]], skin,38,25);
  coat([[snout,headY,0,.009,.018],[snout+.046,headY+.011,0,headH*.48,headH*.65],[snout+.13,headY+.036,0,headH*.72,headH*.66],[-.80,headY+.038,0,headH,headH*.84],[-.71,headY+.029,0,headH*.84,headH*.71],[-.67,headY+.015,0,.006,.007]], skin,32,26);
  if (!sauropod) {
   const drop = croc ? .048 : sail ? .081 : .115;
   coat([[snout,headY-drop,0,.013,.020],[snout+.062,headY-drop*1.15,0,headH*.27,headH*.64],[-.83,headY-drop*1.02,0,headH*.41,headH*.66],[-.73,headY-.024,0,headH*.44,headH*.61]], skin,26,20);
   ball(-.87,headY-drop*.43,0,.113,drop*.33,headH*.51,mouth);
  }
  for (const side of pair) {
   const legPositions = croc || sauropod ? [-.31,.29] : [.21];
   for (const x of legPositions) {
    const z = side * (width * .66);
    const thick = croc ? .054 : sauropod ? .087 : .114;
    coat([[x,upper,z,thick,thick],[x-.079,upper*.72,z+side*.067,thick*.91,thick*.91],[x+.057,upper*.47,z+side*.080,thick*.66,thick*.63],[x+.01,.092,z+side*.103,thick*.42,thick*.42],[x-.056,.035,z+side*.107,thick*.60,thick*.70],[x-.13,.021,z+side*.111,.001,.001]],skin,30,18);
    for (let claw = -1; claw <= 1; claw++) ball(x-.126,.022,z+side*.107+claw*thick*.46,.024,.013,.011,croc?dark:ivory);
   }
   if (!croc && !sauropod) {
    const z = side * .11;
    coat([[-.45,upper,z,.043,.043],[-.42,upper-.13,z*1.46,.026,.026],[-.51,upper-.18,z*1.60,.020,.022],[-.59,upper-.16,z*1.69,.008,.009]],skin,21,14);
    ball(-.61,upper-.159,z*1.69,.022,.008,.008,ivory);
   }
   eye(-.805,headY+headH*.71,side*headH*.67,croc?.022:sauropod?.017:.025,amber);
  }
  if (sail) {
   const membrane = animalPaint('#9e563c','#684636',[.28,.96],(color,p)=>color.multiplyScalar(1+.23*Math.cos(p.x*43 + p.y*12)));
   coat([[-.39,upper+.08,0,.016,.008],[-.34,upper+.195,0,.102,.029],[-.19,upper+.264,0,.197,.035],[0,upper+.270,0,.226,.038],[.21,upper+.230,0,.159,.024],[.36,upper+.13,0,.071,.017],[.49,upper+.035,0,.001,.001]],membrane,46,18);
  }
  if (croc) {
   const ridge = animalPaint('#455744','#65725a',[.35,.95]);
   for(const side of pair) {
    const z = side;
    coat([[-.37,.355,z*.071,.012,.012],[-.19,.41,z*.087,.033,.031],[.10,.42,z*.092,.023,.021],[.45,.346,z*.078,.018,.017],[.78,.286,z*.069,.011,.012],[1.04,.221,.118+z*.018,.001,.001]],ridge,35,10);
   }
  }
  return;
 }

 if (kind === 'snake') {
  const spot = new T.Color('#423c25');
  const skin = animalPaint('#8a8150','#c0a874',[.19,.8],(color,p,center,radius,angle)=>{
   const row = angle * .80;
   const d = Math.hypot((oddPart(p.x * 9 + Math.floor(row) * .36) - .5) * .94,(oddPart(row) - .5)*1.35);
   color.lerp(spot, (1 - T.MathUtils.smoothstep(d,.22,.44)) * T.MathUtils.smoothstep(Math.cos(angle),-.62,.05));
  });
  const curve = [
   [-1.07,.19,.087,.005,.019],[-.99,.195,.081,.045,.059],[-.86,.18,.065,.054,.064],
   [-.74,.122,-.077,.053,.061],[-.57,.112,-.25,.074,.085],[-.35,.112,-.29,.098,.108],
   [-.16,.111,-.17,.101,.106],[.012,.103,.089,.091,.094],[.21,.093,.262,.078,.079],
   [.43,.077,.247,.059,.067],[.63,.064,.072,.051,.055],[.81,.057,-.105,.044,.044],
   [1.01,.050,-.14,.029,.031],[1.20,.034,-.036,.014,.015],[1.29,.029,.049,.001,.001]
  ];
  coat(curve,skin,105,32);
  for (const side of pair) eye(-.985,.222,.080+side*.052,.014,amber,side);
  return;
 }

 if (kind === 'squid') {
  const skin = animalPaint('#a3564a','#edac91',[.11,.85],(color,p)=>color.multiplyScalar(1+.18*Math.sin(p.x*45+p.z*70)*Math.cos(p.y*75)));
  const mantle = animalPaint('#ab6255','#eeb595',[.18,.89]);
  coat([[-1.03,.52,0,.002,.003],[-.87,.51,0,.063,.068],[-.67,.48,0,.134,.120],[-.43,.43,0,.160,.147],[-.23,.39,0,.122,.12],[-.13,.385,0,.073,.082],[-.05,.385,0,.089,.097],[.02,.385,0,.056,.061]],skin,52,32);
  for (const side of pair) {
   coat([[-.84,.50,side*.056,.120,.040],[-.70,.49,side*.148,.151,.028],[-.58,.46,side*.218,.091,.014],[-.60,.458,side*.265,.001,.001]],mantle,24,16);
   eye(-.074,.414,side*.091,.037,amber);
  }
  for (let arm = 0; arm < 10; arm++) {
   const theta = arm * Math.PI * .2;
   const reach = arm % 5 === 0 ? 1.38 : .53 + Math.sin(theta + .3)*.15;
   const spreadY = Math.sin(theta), spreadZ = Math.cos(theta);
   coat([[0,.385+spreadY*.06,spreadZ*.063,.023,.024],[reach*.23,.35+spreadY*.104,spreadZ*.158,.020,.025],[reach*.50,.26+spreadY*.152,spreadZ*.244,.013,.016],[reach*.80,.29+spreadY*.181,spreadZ*.258,.008,.009],[reach,.34+spreadY*.145,spreadZ*.27,.001,.001]],mantle,28,12);
  }
 }
}

export function buildModel(record){
 const root=new T.Group(),cache=new Map();
 const material=(color,metal=.05,rough=.58)=>{const key=[color,metal,rough].join();if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return cache.get(key);};
 const stone=material('#aa9674',.18,.5),metal=material('#bca171',.65,.3),steel=material('#a4b1b3',.6,.3),rubber=material('#222c2b',.05,.9),blue=material('#4b6978',.15,.62),cream=material('#e1d9c7',.05,.65),green=material('#456151',.05,.85);
 const mesh=(g,m,x=0,y=0,z=0)=>{const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;root.add(a);return a;};
 const ball=(x,y,z,a,b,c,m=stone)=>{const o=mesh(new T.SphereGeometry(1,28,18),m,x,y,z);o.scale.set(a,b,c);return o;};
 const box=(x,y,z,a,b,c,m=metal)=>mesh(new T.BoxGeometry(a,b,c),m,x,y,z);
 const cyl=(x,y,z,r,h,m=metal,r2=r)=>mesh(new T.CylinderGeometry(r2,r,h,24),m,x,y,z);
 const line=(a,b,r,m=stone)=>{const v=new T.Vector3(...b).sub(new T.Vector3(...a));const o=mesh(new T.CylinderGeometry(r,r,v.length(),12),m,...new T.Vector3(...a).addScaledVector(v,.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
 const curve=(points,r,m=stone)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),48,r,8,false),m);
 const fin=(points,m=blue)=>{const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return mesh(new T.ExtrudeGeometry(shape,{depth:.018,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.015,bevelThickness:.012}),m);};
 const kind=record.kind;
 if(kind==='person'){
  const fabric=material('#37504e',.03,.89),seam=material('#1d3030',.04,.85);
  const skin=material('#ad8970',.08,.68);
  const portrait=ball(0,.922,0,.061,.078,.061,skin);
  portrait.rotation.x=-.06;
  ball(0,.955,-.018,.058,.044,.051,seam);
  cyl(0,.825,0,.030,.069,skin);
  const jacket=mesh(new T.LatheGeometry([
   [.07,.43],[.103,.46],[.095,.56],[.103,.67],[.132,.743],
   [.112,.773],[.064,.793],[.032,.813],[0,.815]
  ].map(([r,y])=>new T.Vector2(r,y)),32),fabric);
  jacket.scale.z=.54;
  line([0,.478,.056],[0,.764,.067],.003,seam);
  for(const side of [-1,1]){
   const hip=[side*.056,.466,0],knee=[side*.066,.247,.009],ankle=[side*.069,.069,-.015];
   line(hip,knee,.046,fabric);ball(...knee,.034,.052,.037,fabric);
   line(knee,ankle,.030,fabric);ball(side*.069,.034,.018,.038,.034,.075,rubber);
   const shoulder=[side*.118,.744,0],elbow=[side*.163,.588,-.006],wrist=[side*.171,.475,.026];
   ball(...shoulder,.038,.057,.037,fabric);line(shoulder,elbow,.033,fabric);
   ball(...elbow,.027,.037,.025,fabric);line(elbow,wrist,.023,fabric);
   ball(side*.171,.443,.029,.021,.040,.019,skin);
  }
  line([.30,0,0],[.30,1,0],.003,metal);
  for(let tick=0;tick<=10;tick++){
   const width=tick%5===0?.052:.028;
   line([.30-width,tick/10,0],[.30,tick/10,0],.0025,metal);
  }
 }else if(kind==='hand'){
  const bronze=material('#b78450',.67,.38),low=material('#80583b',.50,.5);
  ball(.009,.359,0,.164,.238,.072,bronze);
  ball(-.064,.325,.035,.085,.158,.051,bronze);
  ball(.054,.332,.031,.087,.138,.040,bronze);
  line([0,.04,0],[.002,.27,0],.084,bronze);
  const fingers=[
   {base:[-.116,.496,0],tip:[-.168,.847,.037],radius:.041},
   {base:[-.040,.527,0],tip:[-.066,.957,.023],radius:.043},
   {base:[.046,.518,0],tip:[.057,.898,.014],radius:.040},
   {base:[.119,.460,0],tip:[.166,.758,.020],radius:.032},
   {base:[-.093,.290,.017],tip:[-.284,.518,.087],radius:.053}
  ];
  for(const {base,tip,radius} of fingers){
   const near=base.map((value,index)=>T.MathUtils.lerp(value,tip[index],.56));
   const far=base.map((value,index)=>T.MathUtils.lerp(value,tip[index],.83));
   line(base,near,radius,bronze);ball(...near,radius,radius*.93,radius*.94,bronze);
   line(near,far,radius*.86,bronze);line(far,tip,radius*.72,bronze);
   ball(...tip,radius*.73,radius*.85,radius*.73,bronze);
   ball(tip[0],tip[1]-.025,tip[2]-.020,radius*.53,radius*.66,.012,low);
  }
  curve([[-.105,.31,.086],[-.027,.395,.076],[.084,.413,.064]],.0035,low);
 }else if(kind==='foot'){
  const bronze=material('#b78450',.67,.38),low=material('#80583b',.50,.5);
  ball(-.28,.145,0,.167,.145,.110,bronze);
  ball(-.245,.266,0,.121,.169,.093,bronze);
  const instep=ball(-.10,.135,-.009,.265,.118,.118,bronze);
  instep.rotation.z=-.17;
  ball(.153,.097,-.001,.223,.092,.144,bronze);
  for(let toe=0;toe<5;toe++){
   const x=.338-toe*.028,z=-.110+toe*.055,width=.043-toe*.004,length=.116-toe*.014;
   ball(x,.070,z,length,.056-toe*.005,width,bronze);
   ball(x+length*.43,.113-toe*.006,z,length*.43,.012,width*.70,low);
  }
 }else if(['whale','fish','elephant','giraffe','dino','croc','bird','snake','squid'].includes(kind)){
  buildAnimal(record, mesh, material);
 }else{
  buildBuiltExhibit(record,{root,material,stone,steel,rubber,blue,cream,mesh,ball,box,cyl,line,curve,fin});
 }
 root.userData.kind=kind;return root;
}

function buildBuiltExhibit(record,{root,material,stone,steel,rubber,blue,cream,mesh,ball,box,cyl,line,curve,fin}){
 const {kind,name}=record;
 const transform=new T.Object3D();
 // Repeated details share a draw call and still contribute to bounds and shadows.
 function instances(geometry,finish,parts,shadows=true){
  if(!parts.length){geometry.dispose();return;}
  const object=new T.InstancedMesh(geometry,finish,parts.length);
  parts.forEach(([x,y,z,sx,sy,sz,rx=0,ry=0,rz=0],index)=>{
   transform.position.set(x,y,z);
   transform.scale.set(sx,sy,sz);
   transform.rotation.set(rx,ry,rz);
   transform.updateMatrix();
   object.setMatrixAt(index,transform.matrix);
  });
  object.castShadow=shadows;
  object.receiveShadow=true;
  root.add(object);
  return object;
 }
 const boxes=(finish,parts,shadows=true)=>instances(new T.BoxGeometry(1,1,1),finish,parts,shadows);
 function beams(finish,segments){
  const axis=new T.Vector3(0,1,0);
  const parts=segments.map(([a,b,width])=>{
   const from=new T.Vector3(...a),to=new T.Vector3(...b);
   const direction=to.clone().sub(from);
   const midpoint=from.addScaledVector(direction,.5);
   const angles=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(axis,direction.clone().normalize()));
   return [...midpoint.toArray(),width,direction.length(),width*.72,...angles.toArray().slice(0,3)];
  });
  boxes(finish,parts);
 }

 // A closed section changes shape over its length, keeping silhouettes smooth without high subdivision.
 function sections(rows,segments,point,finish){
  const positions=[],indices=[];
  for(const row of rows)for(let side=0;side<segments;side++)positions.push(...point(row,side/segments*Math.PI*2));
  for(let row=0;row<rows.length-1;row++)for(let side=0;side<segments;side++){
   const a=row*segments+side,b=row*segments+(side+1)%segments;
   indices.push(a,b,a+segments,b,b+segments,a+segments);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry,finish);
 }
 function outline(points,finish,thickness=.016){
  const shape=new T.Shape();
  points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
  shape.closePath();
  const object=mesh(new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:false}),finish);
  object.rotation.x=-Math.PI/2;
  return object;
 }

 if(kind==='tower'&&name==='Eiffeltornet'){
  const iron=material('#5d4032',.54,.46),rail=material('#987351',.44,.45);
  const main=[],lattice=[];
  const profiles=[[0,.225],[.18,.166],[.36,.119],[.49,.090],[.72,.061],[.98,.039],[1.13,.022],[1.22,.021]];
  const footWidth=y=>T.MathUtils.lerp(.241,.028,Math.pow(y/1.22,.66));
  for(let side=0;side<4;side++){
   const angle=side*Math.PI/2;
   const at=(x,y,z)=>[x*Math.cos(angle)+z*Math.sin(angle),y,-x*Math.sin(angle)+z*Math.cos(angle)];
   const legPoint=(i,sign,offset=0)=>at(profiles[i][1]*sign+offset,profiles[i][0],profiles[i][1]);
   for(let i=0;i<profiles.length-1;i++){
    main.push([legPoint(i,1),legPoint(i+1,1),i<3?.021:.015]);
    lattice.push([legPoint(i,-1),legPoint(i+1,1),i<2?.005:.007]);
    lattice.push([legPoint(i,1),legPoint(i+1,-1),i<2?.005:.007]);
    if(i>0)lattice.push([legPoint(i,1),legPoint(i,-1),.006]);
    if(i<3){
     const a=legPoint(i,1,-footWidth(profiles[i][0])*.22);
     const b=legPoint(i+1,1,-footWidth(profiles[i+1][0])*.22);
     main.push([a,b,.012],[a,legPoint(i+1,1),.009],[legPoint(i,1),b,.008]);
    }
   }
   const arch=Array.from({length:13},(_,i)=>{
    const t=i/12;
    return at((t-.5)*.357,.084+Math.sin(t*Math.PI)*.159,.154);
   });
   for(let i=1;i<arch.length;i++)main.push([arch[i-1],arch[i],.013]);
   for(const [y,w] of [[.28,.345],[.48,.196],[1.16,.065]]){
    for(let i=0;i<=10;i++){
     const x=((i/10)-.5)*w;
     lattice.push([at(x,y,w/2),at(x,y+.020,w/2),.003]);
    }
    lattice.push([at(-w/2,y+.020,w/2),at(w/2,y+.020,w/2),.004]);
   }
  }
  beams(iron,main);beams(rail,lattice);
  for(const [y,w] of [[.28,.35],[.48,.20],[1.16,.069]])box(0,y,0,w,.017,w,iron);
  for(const x of [-.225,.225])for(const z of [-.225,.225])box(x,.01,z,.064,.02,.064,stone);
  cyl(0,1.242,0,.012,.09,iron,.005);
  cyl(0,1.308,0,.005,.047,rail,.001);
 }else if(kind==='tower'){
  const glass=material('#54788c',.65,.24),mullion=material('#cbdce0',.64,.29),plinth=material('#a1a8a1',.36,.5);
  const stack=[
   [0,1.25,.055,0,0], [0,.30,.072,.117,0], [0,.50,.065,-.105,0],
   [0,.70,.058,.055,.099], [0,.62,.059,-.055,-.099],
   [.30,.82,.055,.092,0], [.50,1.01,.052,-.079,0], [.70,1.09,.045,.042,.068],
   [.62,.98,.047,-.040,-.069], [.82,1.16,.034,.058,0], [1.05,1.27,.032,-.025,.034]
  ];
  const towers=[],floors=[];
  for(const [start,top,r,x,z] of stack){
   towers.push([x,(start+top)/2,z,r*2,top-start,r*2,0,Math.PI/4]);
   for(let y=start+.012;y<top;y+=.014){
    floors.push([x,y,z,r*2.025,.0018,r*2.025,0,Math.PI/4]);
   }
  }
  boxes(glass,towers);boxes(mullion,floors,false);
  cyl(0,.021,0,.218,.042,plinth);
  cyl(0,1.30,0,.032,.075,glass,.019);
  cyl(0,1.395,0,.02,.14,mullion,.009);
  cyl(0,1.515,0,.009,.115,mullion,.0025);
 }else if(kind==='statue'){
  const copper=material('#598978',.35,.58),fold=material('#407568',.31,.64);
  const granite=material('#a29078',.08,.85),ledge=material('#c1ad92',.09,.82),flame=material('#d3a149',.63,.35);
  for(const [y,width,height] of [[.025,.43,.05],[.07,.36,.043],[.116,.31,.054],[.392,.29,.018],[.42,.315,.035],[.446,.258,.018]]){
   box(0,y,0,width,height,width,ledge);
  }
  box(0,.27,0,.255,.24,.255,granite);
  const panels=[];
  for(let i=0;i<4;i++){
   const angle=i*Math.PI/2;
   panels.push([Math.sin(angle)*.129,.279,Math.cos(angle)*.129,.115,.176,.008,0,angle]);
   for(const side of [-1,1])panels.push([Math.sin(angle)*.126+Math.cos(angle)*side*.096,.27,Math.cos(angle)*.126-Math.sin(angle)*side*.096,.022,.208,.011,0,angle]);
  }
  boxes(ledge,panels);
  sections([[.447,.108,.004],[.48,.110,.005],[.565,.099,.01],[.665,.076,.006],[.738,.063,-.012],[.797,.064,-.016],[.858,.083,-.012],[.893,.059,-.005],[.909,.027,0]],32,
   ([y,r,x],angle)=>{
    const pleat=1+.10*Math.sin(angle*11+y*10)+.04*Math.cos(angle*16-y*11);
    return [x+r*Math.sin(angle)*pleat,y,r*.64*Math.cos(angle)*pleat];
   },copper);
  ball(0,.939,.002,.035,.044,.031,copper);
  ball(0,.944,.027,.010,.013,.008,copper);
  ball(0,.965,-.002,.038,.017,.033,fold);
  const crown=mesh(new T.TorusGeometry(.033,.006,6,20),copper,0,.969,0);
  crown.rotation.x=Math.PI/2;
  const rays=[];
  for(let i=0;i<7;i++){
   const a=(i-3)*Math.PI/7;
   rays.push([[Math.sin(a)*.029,.972+Math.cos(a)*.012,.012],[Math.sin(a)*.076,.973+Math.cos(a)*.042,.017],.007]);
  }
  beams(copper,rays);
  curve([[-.057,.872,0],[-.103,.925,0],[-.123,.990,0],[-.135,1.040,.003]],.024,copper);
  ball(-.138,1.048,.003,.016,.022,.015,copper);
  cyl(-.14,1.073,.005,.008,.055,copper,.018);
  cyl(-.14,1.101,.005,.023,.014,copper);
  ball(-.14,1.127,.005,.015,.031,.015,flame);
  const tablet=box(.059,.809,.044,.074,.108,.013,fold);
  tablet.rotation.z=-.22;
  curve([[.062,.852,.006],[.101,.815,.025],[.071,.788,.051]],.016,copper);
 }else if(kind==='tree'){
  const sequoia=name==='General Sherman';
  const bark=material(sequoia?'#78442b':'#61432d',.02,.92);
  const darkBark=material('#4a2e23',.02,.97);
  const needles=material(sequoia?'#355037':'#284737',.01,.88);
  const lighter=material(sequoia?'#567249':'#457050',.01,.88);
  const base=sequoia?.102:.056;
  const rows=Array.from({length:19},(_,i)=>{
   const t=i/18;
   const r=base*(.36+.64*Math.pow(1-t,1.5))*(1-.94*Math.pow(t,5))+.023*Math.exp(-t*31);
   return [t*1.34,r,Math.sin(t*5)*.021];
  });
  sections(rows,24,([y,r,x],a)=>[x+r*Math.sin(a)*(1+.11*Math.sin(a*8+y*5)),y,r*Math.cos(a)*(1+.12*Math.cos(a*7-y*4))],bark);
  const branches=[],foliage=[],tips=[],grooves=[];
  for(let i=0;i<11;i++){
   const a=i*2.40;
   const lower=[Math.sin(a)*base*1.11,.027,Math.cos(a)*base*1.11];
   const upper=[Math.sin(a+.12)*base*.82,.43,Math.cos(a+.12)*base*.82];
   grooves.push([lower,upper,.0045]);
  }
  for(let i=0;i<30;i++){
   const a=i*2.40;
   const y=(sequoia?.52:.59)+i*.025;
   const t=i/30;
   const reach=(sequoia?.164:.145)*Math.pow(Math.sin((.20+t*.78)*Math.PI),.78)*(.86+.14*Math.sin(i*5.1));
   const x=Math.sin(y/1.34*5)*.021;
   const tip=[x+Math.sin(a)*reach,y-.024+Math.sin(i)*.014,Math.cos(a)*reach];
   branches.push([[x,y,0],tip,Math.max(.0045,.011*(1-t))]);
   for(let k=0;k<4;k++){
    const angle=a+(k-1.5)*.28;
    const d=reach*(.52+k*.14);
    const scale=.026+.042*(1-t);
    const cluster=[x+Math.sin(angle)*d,y+(k-1.5)*.013,Math.cos(angle)*d,scale,.026+.024*(1-t),scale*.77,0,a];
    (k===3?tips:foliage).push(cluster);
   }
  }
  beams(darkBark,grooves);beams(bark,branches);
  instances(new T.IcosahedronGeometry(1,1),needles,foliage);
  instances(new T.IcosahedronGeometry(1,1),lighter,tips);
 }else if(kind==='mountain'){
  const terrain=new T.BufferGeometry(),positions=[],colors=[],indices=[];
  const passes=64,sectors=96;
  const rock=new T.Color('#626a6e'),snow=new T.Color('#e7edf0'),mixed=new T.Color();
  const crest=(radius,a)=>{
   const peak=Math.pow(1-radius,1.42);
   const ridge=(.074*Math.cos(a*5+radius*3)+.045*Math.cos(a*8-radius*3.5))*Math.sin(radius*Math.PI);
   const erosion=(.021*Math.sin(a*26+radius*43)+.010*Math.cos(a*47-radius*59))*Math.sin(radius*Math.PI);
   return Math.max(.015,peak+ridge+erosion);
  };
  for(let ring=0;ring<=passes;ring++)for(let sector=0;sector<sectors;sector++){
   const r=ring/passes,a=sector/sectors*Math.PI*2;
   const irregular=1+.16*Math.cos(a*4)+.08*Math.sin(a*7);
   const x=Math.cos(a)*r*.88*irregular+.11*(1-r);
   const z=Math.sin(a)*r*.71*irregular-.13*(1-r);
   const h=crest(r,a);
   positions.push(x,h,z);
   const slope=(crest(Math.max(0,r-.015),a)-crest(Math.min(1,r+.015),a))/.03;
   const drift=.66+.17*Math.sin(a*5-r*7)+.08*Math.cos(a*13+r*11);
   const cover=T.MathUtils.clamp((h-drift+.52-slope*.18)*3,0,1);
   mixed.copy(rock).lerp(snow,cover).multiplyScalar(.87+.12*Math.sin(a*8+r*31)**2);
   colors.push(mixed.r,mixed.g,mixed.b);
   if(ring<passes){
    const i=ring*sectors+sector,j=ring*sectors+(sector+1)%sectors;
    indices.push(i,j,i+sectors,j,j+sectors,i+sectors);
   }
  }
  terrain.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  terrain.setIndex(indices);
  terrain.computeVertexNormals();
  mesh(terrain,new T.MeshStandardMaterial({vertexColors:true,roughness:.92}));
  box(0,-.026,0,2.02,.075,1.65,material('#555954',.04,.83));
 }else if(kind==='truck'){
  const yellow=material('#d8a529',.16,.51),paintShade=material('#9c751c',.19,.62);
  const glass=material('#20313a',.40,.24),tread=material('#353737',.02,.88),hub=material('#b5aca0',.55,.50);
  const wheels=[],treads=[],hubs=[],trim=[];
  for(const x of [-.53,.54])for(const q of [-1,1])for(const z of [.35,.47]){
   wheels.push([x,.25,q*z,.251,.105,.251,Math.PI/2]);
   for(let k=0;k<30;k++){
    const a=k*Math.PI/15;
    treads.push([x+Math.cos(a)*.247,.25+Math.sin(a)*.247,q*z,.021,.024,.100,0,0,a]);
   }
   if(z>.4)hubs.push([x,.25,q*.527,.103,.022,.103,Math.PI/2]);
  }
  instances(new T.CylinderGeometry(1,1,1,24),rubber,wheels);
  instances(new T.CylinderGeometry(1,1,1,20),hub,hubs);
  boxes(tread,treads,false);
  box(0,.42,0,1.66,.18,.75,paintShade);
  box(-.684,.55,0,.30,.15,.86,yellow);
  box(-.68,.47,0,.22,.075,.75,rubber);
  box(-.58,.691,.24,.31,.23,.32,yellow);
  box(-.727,.721,.24,.012,.107,.279,glass);
  box(-.579,.721,.405,.220,.113,.017,glass);
  box(-.829,.574,0,.020,.075,.30,rubber);
  for(const q of [-1,1])box(-.837,.578,q*.28,.022,.040,.079,cream);
  const tray=outline([[-.44,-.47],[.77,-.43],[.84,.42],[-.44,.47]],yellow,.06);
  tray.position.y=.626;
  const sides=[];
  for(const q of [-1,1]){
   const side=fin([[-.44,.65],[.83,.65],[.83,.82],[-.13,.91],[-.36,.97]],yellow);
   side.position.z=q*.433;
   for(let k=0;k<6;k++){
    const x=-.25+k*.178;
    trim.push([x,.75,q*.448,.025,.19-(k*.01),.028,0,0,-.24]);
   }
   sides.push([[-.42,.915,q*.444],[.83,.83,q*.444],.033]);
  }
  box(-.431,.805,0,.030,.29,.86,yellow);
  box(.821,.724,0,.031,.171,.86,yellow);
  boxes(paintShade,trim);beams(yellow,sides);
  beams(hub,[
   [[-.78,.61,.43],[-.78,.78,.43],.009],[[-.78,.78,.43],[-.49,.78,.43],.009],
   [[-.71,.41,.43],[-.78,.62,.43],.011],[[-.65,.41,.43],[-.72,.62,.43],.011],
   [[-.70,.46,.43],[-.634,.46,.43],.009],[[-.73,.52,.43],[-.665,.52,.43],.009]
  ]);
 }else if(kind==='machine'){
  const industrial=material('#79554a',.38,.62),accent=material('#b98447',.35,.59);
  const track=[],treads=[],truss=[],deck=[];
  for(const z of [-.29,-.10,.10,.29])for(const x of [-.72,-.40]){
   track.push([x,.080,z,.31,.15,.122]);
   for(let i=0;i<7;i++)treads.push([x-.144+i*.048,.161,z,.022,.016,.133]);
  }
  boxes(rubber,track);boxes(steel,treads,false);
  box(-.54,.20,0,.77,.10,.68,industrial);
  box(-.50,.31,0,.54,.13,.45,industrial);
  box(-.67,.435,0,.30,.15,.37,cream);
  box(-.71,.456,.191,.15,.049,.014,blue);
  const booms=[
   [[-.95,.43],[-.28,.935],[.075,.96]],
   [[-.72,.29],[-.30,.88],[.92,.43]],
   [[-.97,.365],[-.34,.39],[.90,.38]]
  ];
  for(const [a,b,c] of booms)for(const z of [-.145,.145]){
   truss.push([[...a,z],[...b,z],.022],[[...b,z],[...c,z],.023]);
   truss.push([[b[0],b[1],z],[b[0],b[1],-z],.013]);
  }
  for(const z of [-.145,.145]){
   for(let i=0;i<9;i++){
    const a=i/9,b=(i+1)/9;
    const lower=t=>[-.25+t*1.16,.455-t*.035,z];
    const upper=t=>[-.25+t*1.16,.87-t*.44,z];
    truss.push([lower(a),upper(b),.012],[upper(a),lower(a),.010]);
    deck.push([-.22+a*1.16,.42,z,.085,.019,.18]);
   }
   truss.push([[-.96,.41,z],[-.29,.92,z],.027],[[-.28,.94,z],[.92,.43,z],.024]);
  }
  beams(industrial,truss);boxes(accent,deck);
  const buckets=[],spokes=[];
  for(const z of [-.059,.059])mesh(new T.TorusGeometry(.235,.016,8,32),industrial,.92,.456,z);
  for(let i=0;i<18;i++){
   const angle=i*Math.PI/9,c=Math.cos(angle),s=Math.sin(angle);
   buckets.push([.92+c*.244,.456+s*.244,0,.055,.055,.153,0,0,angle+.27]);
   if(i%2===0)for(const z of [-.059,.059])spokes.push([[.92,.456,z],[.92+c*.229,.456+s*.229,z],.016]);
  }
  boxes(accent,buckets);beams(steel,spokes);
  const spindle=cyl(.92,.456,0,.055,.17,industrial);spindle.rotation.x=Math.PI/2;
 }else if(kind==='plane'&&name==='Quetzalcoatlus'){
  const skin=material('#746251',.02,.79),membrane=material('#907054',.01,.84);
  membrane.side=T.DoubleSide;
  const underside=material('#a28561',.01,.82);
  underside.side=T.DoubleSide;
  ball(0,.37,.07,.091,.083,.193,skin);
  ball(0,.41,-.037,.072,.092,.102,underside);
  curve([[0,.415,-.066],[0,.502,-.147],[0,.648,-.281],[0,.677,-.373]],.030,skin);
  ball(0,.693,-.412,.043,.041,.070,skin);
  ball(0,.701,-.504,.022,.022,.125,underside);
  const bill=mesh(new T.ConeGeometry(.022,.19,12),underside,0,.698,-.565);
  bill.rotation.x=-Math.PI/2;
  for(const q of [-1,1]){
   const vertices=[
    [q*.04,.41,-.025],[q*.27,.49,-.14],[q*.48,.50,-.13],[q*.71,.465,-.015],
    [q*.98,.426,.075],[q*1.14,.405,.167],[q*.94,.40,.193],[q*.70,.42,.207],
    [q*.46,.414,.235],[q*.23,.359,.268],[q*.06,.348,.172],[q*.50,.466,.058]
   ];
   const wing=new T.BufferGeometry();
   wing.setFromPoints(vertices.map(v=>new T.Vector3(...v)));
   wing.setIndex(Array.from({length:11},(_,i)=>q>0?[i,(i+1)%11,11]:[(i+1)%11,i,11]).flat());
   wing.computeVertexNormals();
   mesh(wing,membrane);
   curve(vertices.slice(0,6),.009,skin);
   ball(q*.034,.707,-.429,.008,.008,.008,rubber);
   line([q*.047,.35,.14],[q*.106,.33,.295],.016,skin);
  }
 }else if(kind==='plane'){
  const roc=name==='Stratolaunch Roc',antonov=name==='Antonov An-225';
  const white=material('#dfded7',.24,.35),shade=material('#bac5c9',.4,.37);
  const stripe=material(antonov?'#226698':roc?'#333641':'#275d80',.22,.44);
  const windows=material('#263943',.39,.23),tailColor=material(antonov?'#e8bd39':roc?'#d25c36':'#537d97',.27,.40);
  const fuselages=roc?[-.36,.36]:[0],windowsList=[],stripes=[];
  const width=roc?.072:antonov?.098:.107,body=roc?.65:antonov?.94:.85;
  const y=.33;
  for(const x of fuselages){
   const rows=[[-1,0],[-.99,.23],[-.92,.62],[-.82,.86],[-.66,.98],[-.51,1],[.50,1],[.66,.95],[.82,.72],[.93,.39],[1,.02]];
   sections(rows,24,([z,r],a)=>[x-Math.sin(a)*width*r,y+Math.cos(a)*width*r*(roc?1.03:1.12),z*body],white);
   for(const q of [-1,1]){
    const windowsY=y+width*.40;
    if(!antonov)for(const level of (roc?[0]:[-.024,.023]))for(let i=0;i<25;i++){
     const z=(-.68+i*.052)*body;
     windowsList.push([x+q*width*.95,windowsY+level,z,.010,.012,.018]);
    }
    windowsList.push([x+q*width*.76,y+width*.62,-body*.83,.019,.019,.050,0,q*.37,0]);
    stripes.push([x+q*width,y+width*.010,-body*.025,.007,.013,body*1.53]);
   }
   if(!antonov){
    const tail=fin([[0,y], [.04,y+.31],[.18,y+.27],[.30,y] ],tailColor);
    tail.rotation.y=-Math.PI/2;tail.position.set(x,0,body*.63);
   }
   for(const q of [-1,1]){
    const stabilizer=outline([[x,body*.60],[x+q*.29,body*.74],[x+q*.33,body*.92],[x,body*.88]],shade);
    stabilizer.position.y=y+.025;
   }
  }
  if(antonov)for(const q of [-1,1]){
   const tail=fin([[0,y+.03],[.05,y+.27],[.16,y+.24],[.25,y+.03]],tailColor);
   tail.rotation.y=-Math.PI/2;tail.position.set(q*.265,0,.69);
  }
  for(const q of [-1,1]){
   const sweep=roc?.12:.39;
   const wing=outline([[0,-.20],[q*.25,-.16],[q*.63,-.12+sweep*.62],[q*1.14,-.08+sweep],[q*1.16,.01+sweep],[q*.57,.18+sweep*.47],[q*.27,.22],[0,.19]],white,.028);
   wing.position.y=y-.023;
   const flap=outline([[q*.22,.192],[q*.55,.155+sweep*.47],[q*.97,.039+sweep*.9],[q*.98,.066+sweep*.9],[q*.56,.181+sweep*.47],[q*.22,.215]],shade,.006);
   flap.position.y=y+.008;
   if(!roc){
    const tip=fin([[0,0],[.016,.064],[.040,.075],[.067,0]],tailColor);
    tip.rotation.y=-Math.PI/2;tip.position.set(q*1.14,y-.015,sweep-.077);
   }
   const engineCenters=roc?[.48,.64,.80]:antonov?[.26,.49,.71]:[.37,.66];
   for(const distance of engineCenters){
    const x=q*distance,z=-.115+distance*sweep*.53;
    box(x,y-.041,z,.026,.065,.104,shade);
    const nacelle=mesh(new T.CylinderGeometry(.042,.052,.17,20),shade,x,y-.096,z);
    nacelle.rotation.x=Math.PI/2;
    const rim=mesh(new T.TorusGeometry(.045,.006,8,20),white,x,y-.096,z-.083);
    const fan=mesh(new T.CircleGeometry(.041,20),windows,x,y-.096,z-.082);
    fan.rotation.y=Math.PI;
    ball(x,y-.096,z-.089,.013,.013,.013,steel);
    rim.castShadow=false;
   }
  }
  boxes(windows,windowsList,false);boxes(stripe,stripes,false);
 }else if(kind==='ship'){
  const tanker=name==='Seawise Giant';
  const basalt=material('#232b2f',.31,.52),red=material('#752f29',.32,.63);
  const white=material('#d5d0bf',.19,.52),deckFinish=material(tanker?'#547063':'#a68b68',.12,.70);
  const opening=material('#384948',.24,.44),pipeFinish=material('#a4b0a9',.47,.44);
  const width=tanker?.145:.134;
  const rows=[[-1,0],[-.98,.18],[-.94,.43],[-.87,.67],[-.72,.91],[-.58,1],[.56,1],[.74,.95],[.88,.76],[.97,.43],[1,0]];
  // Using two bands preserves the painted waterline on the curved hull.
  for(const [low,high,finish] of [[.006,.084,red],[.084,.183,basalt]]){
   const hull=new T.BufferGeometry(),positions=[],indices=[];
   for(const [x,w] of rows)for(const [y,z] of [[low,-width*w*(low<.01?.47:.91)],[high,-width*w*(high<.1?.91:1)],[high,width*w*(high<.1?.91:1)],[low,width*w*(low<.01?.47:.91)]]){
    positions.push(x,y+(tanker?.01:.042)*Math.abs(x)**5,z);
   }
   for(let i=0;i<rows.length-1;i++)for(let edge=0;edge<4;edge++){
    const a=i*4+edge,b=i*4+(edge+1)%4;
    indices.push(a,b,a+4,b,b+4,a+4);
   }
   hull.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   hull.setIndex(indices);
   hull.computeVertexNormals();
   mesh(hull,finish);
  }
  const deck=outline(rows.map(([x,r])=>[x,width*r*.99]).concat(rows.slice(1,-1).reverse().map(([x,r])=>[x,-width*r*.99])),deckFinish,.012);
  deck.position.y=.184;
  const guard=[],details=[],glass=[];
  for(const q of [-1,1]){
   for(let i=0;i<rows.length-1;i++){
    const [x,r]=rows[i],[nextX,nextR]=rows[i+1];
    const y=.196+(tanker?.01:.042)*Math.abs(x)**5;
    guard.push([[x,y,q*r*width],[nextX,.196+(tanker?.01:.042)*Math.abs(nextX)**5,q*nextR*width],.005]);
   }
  }
  if(tanker){
   for(const [y,len,h,w] of [[.231,.23,.073,.242],[.288,.208,.043,.226],[.323,.161,.027,.203],[.346,.134,.021,.181]])box(.712,y,0,len,h,w,white);
   for(let i=0;i<12;i++){
    const x=-.67+i*.092;
    details.push([x,.210,0,.050,.039,.117]);
    for(const q of [-1,1])details.push([x,.213,q*.090,.028,.039,.031]);
   }
   for(let i=0;i<9;i++)glass.push([.626,.324,(i-4)*.019,.008,.015,.010]);
   for(const z of [-.078,-.046,.046,.078])guard.push([[-.74,.239,z],[.564,.239,z],.006]);
   guard.push([[.73,.344,0],[.73,.444,0],.008],[[-.82,.192,0],[-.82,.267,0],.007]);
  }else{
   box(-.075,.227,0,1.50,.087,.214,white);
   box(-.155,.278,0,1.15,.048,.188,white);
   box(-.240,.313,0,.76,.042,.171,white);
   box(-.51,.34,0,.21,.047,.152,white);
   for(let i=0;i<4;i++){
    const x=-.464+i*.245;
    const funnel=cyl(x,.394,0,.028,.144,material('#bd893f',.21,.57),.024);
    funnel.rotation.z=-.13;
    const cap=cyl(x+.009,.471,0,.024,.024,basalt);cap.rotation.z=-.13;
   }
   for(const q of [-1,1]){
    for(let i=0;i<44;i++){
     const x=-.735+i*.031;
     glass.push([x,.232,q*.107,.010,.012,.006]);
     if(i<35)glass.push([x,.268,q*.096,.009,.010,.006]);
    }
    for(let i=0;i<8;i++)details.push([-.43+i*.102,.306,q*.088,.068,.016,.030,0,0,.06]);
   }
   for(const [x,h] of [[-.798,.497],[.655,.452]]){
    guard.push([[x,.192,0],[x+.025,h,0],.007],[[x+.018,h-.076,-.047],[x+.018,h-.076,.047],.005]);
   }
   guard.push([[-.774,.49,0],[-.04,.457,0],.0017],[[.68,.444,0],[.31,.419,0],.0017]);
  }
  beams(pipeFinish,guard);boxes(tanker?pipeFinish:cream,details);boxes(opening,glass,false);
 }else if(kind==='rocket'){
  const ceramic=material('#e7e2d4',.14,.45),dark=material('#343a3a',.31,.55);
  const stages=[[.135,.24,.086,.086],[.351,.19,.086,.086],[.48,.068,.086,.068],[.61,.197,.068,.068],[.739,.060,.068,.052],[.833,.127,.052,.052],[.920,.048,.052,.021],[.954,.029,.021,.007]];
  for(const [y,h,base,top] of stages)cyl(0,y,0,base,h,ceramic,top);
  for(const [y,r,h] of [[.08,.087,.042],[.43,.086,.038],[.685,.068,.028],[.86,.053,.021]])cyl(0,y,0,r,h,dark);
  for(const x of [-.033,.033])for(const z of [-.033,.033])cyl(x,.021,z,.023,.039,steel,.011);
  cyl(0,.022,0,.025,.041,steel,.011);
  cyl(0,1.009,0,.0065,.104,ceramic,.003);
  cyl(0,1.066,0,.003,.019,dark,.001);
 }
}
