import * as T from './three.module.js';
// Original schematic exhibition sculptures. No third-party geometry or likenesses.
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
 const eye=(x,y,z)=>ball(x,y,z,.016,.016,.016,rubber);
 const kind=record.kind;
 if(kind==='person'){
  const suit=material('#344c49',.1,.75);ball(0,.91,0,.068,.09,.063,stone);cyl(0,.8,0,.03,.07,stone);ball(0,.65,0,.14,.17,.075,suit);ball(0,.48,0,.115,.07,.07,suit);
  for(const side of [-1,1]){line([side*.065,.47,0],[side*.065,.08,0],.042,suit);ball(side*.065,.035,.028,.05,.035,.095,rubber);line([side*.12,.75,0],[side*.18,.52,0],.035,suit);line([side*.18,.52,0],[side*.17,.39,0],.025,stone);ball(side*.17,.38,0,.028,.045,.023,stone);}
  // A simple metric ruler accompanies every person without implying facial similarity.
  line([.28,0,0],[.28,1,0],.004,metal);for(let j=0;j<=10;j++)line([.26,j/10,0],[.30,j/10,0],.003,metal);
 }else if(kind==='hand'){
  ball(0,.36,0,.16,.23,.055);for(let i=0;i<4;i++){const x=-.13+i*.085,top=.96-Math.abs(i-1)*.07;line([x,.51,0],[x,top,0],.035);ball(x,top,0,.035,.04,.035);}
  line([-.14,.32,0],[-.30,.57,0],.045);cyl(0,.08,0,.08,.16,stone);
 }else if(kind==='foot'){
  ball(0,.15,0,.44,.12,.17);ball(-.29,.27,0,.14,.22,.12);for(let i=0;i<5;i++)ball(.36,.12,-.13+i*.06,.13-i*.012,.055,.035);
 }else if(['whale','fish'].includes(kind)){
  const shark=record.name==='Valhaj'||record.name==='Megalodon';ball(-.1,.32,0,.76,.23,.23,blue);ball(.67,.32,0,.43,.085,.095,blue);ball(-.65,.3,0,.25,.19,.22,blue);
  const tail=fin([[.88,.32],[1.22,.62],[1.08,.32],[1.22,.04]],blue);if(!shark)tail.rotation.x=Math.PI/2;
  for(const q of [-1,1]){const p=fin([[-.2,.28],[.18,-.02],[-.1,.19]],blue);p.rotation.x=q*1.1;eye(-.73,.37,q*.18);}
  fin([[.14,.49],[.37,.76],[.45,.45]],blue);
  if(!shark)for(let k=0;k<10;k++)curve([[-.79,.22,-.15+k*.033],[-.35,.12,-.15+k*.033],[.15,.16,-.09+k*.02]],.003,cream);
  if(record.name==='Valhaj')for(let i=0;i<70;i++){const x=-.7+(i%14)*.1,a=(Math.floor(i/14)/5)*Math.PI;ball(x,.32+Math.sin(a)*.215,Math.cos(a)*.225,.009,.009,.009,cream);}
 }else if(['elephant','giraffe','dino','croc'].includes(kind)){
  const elephant=kind==='elephant',giraffe=kind==='giraffe',croc=kind==='croc',dino=kind==='dino';const color=elephant?material('#8e9489',.03,.9):giraffe?material('#b69b66',.03,.8):green;
  const bodyY=giraffe?.67:elephant?.58:croc?.17:.55;ball(0,bodyY,0,.47,giraffe?.20:elephant?.30:.18,.22,color);
  for(const x of [-.3,.3])for(const z of [-.15,.15]){if(dino&&x<0)continue;line([x,bodyY-.1,z],[x+(x>0?.06:-.06),.08,z],elephant?.075:.045,color);ball(x,.055,z,.07,.05,.09,color);}
  if(elephant){ball(-.46,.65,0,.24,.25,.20,color);for(const q of [-1,1]){ball(-.35,.69,q*.23,.18,.25,.035,color);curve([[-.58,.54,q*.1],[-.78,.48,q*.13],[-.9,.56,q*.14]],.018,cream);eye(-.59,.72,q*.17);}curve([[-.65,.65,0],[-.76,.36,0],[-.83,.12,0],[-.99,.20,0]],.055,color);}
  else if(giraffe){line([-.28,.74,0],[-.46,1.48,0],.075,color);ball(-.51,1.5,0,.17,.085,.08,color);for(const q of [-1,1]){line([-.48,1.55,q*.045],[-.48,1.68,q*.045],.012,color);eye(-.58,1.53,q*.07);}for(let i=0;i<28;i++)ball(-.3+(i%7)*.1,.58+Math.floor(i/7)*.055,i%2?.205:-.205,.035,.03,.009,stone);}
  else{const long=record.name==='Argentinosaurus';curve([[-.3,bodyY,0],[-.62,bodyY+.13,0],[-.9,bodyY+(long?.7:.12),0]],long?.07:.1,color);ball(-.93,bodyY+(long?.7:.12),0,.18,.08,.09,color);curve([[.32,bodyY,0],[.7,bodyY-.08,0],[1.12,.15,0]],.045,color);eye(-1.03,bodyY+(long?.72:.14),.07);if(record.name==='Spinosaurus'){const sail=fin([[-.4,.65],[-.3,1.0],[.05,1.13],[.37,.65]],stone);sail.position.z=-.009;}if(croc){ball(-.83,.23,0,.38,.07,.10,color);for(let j=0;j<10;j++)ball(-.5+j*.12,.35,0,.03,.035,.03,stone);} }
 }else if(kind==='bird'){
  ball(0,.55,0,.32,.25,.22,rubber);for(const q of [-1,1]){line([0,.4,q*.13],[.06,.05,q*.13],.025,stone);line([.06,.05,q*.13],[-.15,.02,q*.13],.02,stone);}curve([[-.15,.65,0],[-.26,1.02,0],[-.35,1.25,0]],.035,stone);ball(-.38,1.28,0,.08,.06,.055,stone);eye(-.42,1.30,.04);box(-.47,1.26,0,.08,.025,.04,cream);
 }else if(kind==='snake'){
  const pts=Array.from({length:70},(_,i)=>[i/35-1,.09+Math.sin(i*.25)*.02,Math.sin(i*.21)*.21]);curve(pts,.055,green);ball(-1,.10,0,.10,.06,.065,green);eye(-1.06,.13,.045);
 }else if(kind==='squid'){
  ball(-.48,.4,0,.45,.17,.17,material('#aa7669',.03,.7));for(let i=0;i<10;i++){const z=(i-4.5)*.035;curve([[-.1,.4,z],[.35,.32,z*4],[.75,.11,z*3],[1.0,.13,z*4]],.018,stone);}eye(-.13,.43,.15);
 }else if(kind==='tower'){
  if(record.name==='Eiffeltornet'){
   for(const q of [-1,1])for(const z of [-1,1]){line([q*.32,0,z*.32],[q*.12,.63,z*.12],.025,metal);line([q*.12,.63,z*.12],[0,1.28,0],.014,metal);for(let j=0;j<6;j++){const a=.30*(1-j/8),h=j*.1;line([q*a,h,z*a],[-q*(a-.025),h+.10,z*(a-.025)],.008,metal);}}
   box(0,.35,0,.48,.025,.48,metal);box(0,.68,0,.25,.02,.25,metal);cyl(0,1.28,0,.007,.22,metal);
  }else{for(let j=0;j<22;j++){const w=.30*(1-j/25);cyl(0,(j+.5)*.055,0,w,.055,steel);for(let k=0;k<3;k++){const a=k*Math.PI*2/3;box(Math.cos(a)*w*.65,(j+.5)*.055,Math.sin(a)*w*.65,w,.05,w*.7,steel);}}cyl(0,1.35,0,.009,.3,steel);}
 }else if(kind==='statue'){
  box(0,.2,0,.42,.4,.42,stone);mesh(new T.ConeGeometry(.19,.52,12),material('#548d7b',.25,.7),0,.65,0);ball(0,.98,0,.07,.085,.065,green);line([-.10,.85,0],[-.26,1.25,0],.035,green);ball(-.26,1.29,0,.055,.07,.055,metal);box(.12,.74,.07,.10,.18,.035,green);for(let i=0;i<7;i++){const a=i/6*Math.PI;line([Math.cos(a)*.06,1+Math.sin(a)*.04,0],[Math.cos(a)*.13,1+Math.sin(a)*.14,0],.008,green);}
 }else if(kind==='tree'){
  const sequoia=record.name==='General Sherman',bark=material('#71604a',.03,.95);cyl(0,.55,0,sequoia?.16:.065,1.1,bark,sequoia?.10:.035);for(let j=0;j<14;j++){const y=.35+j*.055;for(let k=0;k<3;k++){const a=k*2.1+j*1.7,r=(1-y/1.5)*.32;line([0,y,0],[Math.cos(a)*r,y+.04,Math.sin(a)*r],.009,bark);ball(Math.cos(a)*r*.8,y+.05,Math.sin(a)*r*.8,r*.6,.08,r*.6,green);}}ball(0,1.17,0,.06,.12,.06,green);
 }else if(kind==='mountain'){
  const geo=new T.ConeGeometry(.8,1.1,48,16);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),n=Math.sin(x*19+z*31)*.06+Math.sin(z*43-x*13)*.03;pos.setXYZ(i,x*(1+n),y+(y<.50?n:0),z*(1+n));}geo.computeVertexNormals();mesh(geo,stone,0,.55,0);mesh(new T.ConeGeometry(.20,.29,16),cream,0,.97,0);
 }else if(kind==='truck'){
  box(0,.30,0,1.7,.15,.75,metal);box(-.6,.53,0,.4,.42,.65,metal);box(-.64,.6,-.34,.29,.14,.018,blue);box(.30,.64,0,1.1,.42,.9,metal);for(const x of [-.58,.47])for(const q of [-1,1]){const w=cyl(x,.22,q*.43,.22,.13,rubber);w.rotation.x=Math.PI/2;const hub=cyl(x,.22,q*.51,.11,.015,steel);hub.rotation.x=Math.PI/2;}
 }else if(kind==='machine'){
  for(const q of [-1,1]){box(0,.08,q*.18,.75,.16,.17,rubber);for(let k=0;k<8;k++)box(-.34+k*.1,.17,q*.18,.04,.025,.18,steel);}box(0,.3,0,.5,.3,.4,metal);line([-.15,.4,0],[.35,.95,0],.045,metal);line([.35,.95,0],[.95,.48,0],.035,metal);line([.1,.4,0],[.95,.48,0],.018,steel);const wheel=mesh(new T.TorusGeometry(.24,.03,10,32),metal,.99,.46,0);for(let j=0;j<12;j++){const a=j*Math.PI/6;box(.99+Math.cos(a)*.25,.46+Math.sin(a)*.25,0,.07,.07,.11,metal);}line([-.15,.4,.1],[.35,.95,.1],.01,steel);
 }else if(kind==='plane'){
  const prehistoric=record.name==='Quetzalcoatlus',roc=record.name==='Stratolaunch Roc',color=prehistoric?stone:cream;
  if(prehistoric){ball(0,.3,0,.11,.12,.3,color);line([0,.35,-.15],[0,.58,-.48],.04,color);ball(0,.60,-.58,.035,.04,.18,color);for(const q of [-1,1]){const w=fin([[0,.3],[q*.45,.55],[q*1.2,.15],[q*.4,.25]],color);w.rotation.x=-Math.PI/2+.4;w.position.y=.37;line([0,.38,0],[q*1.15,.48,-.15],.015,color);}root.rotation.y=-.28;}
  else{const fuselages=roc?[-.40,.40]:[0];for(const x of fuselages){ball(x,.28,0,.085,.09,.72,color);box(x,.46,.50,.025,.33,.25,color);const tail=box(x,.29,.55,.52,.025,.17,color);for(let j=0;j<12;j++)ball(x-.081,.31,-.42+j*.07,.004,.013,.016,blue);}const wings=box(0,.27,0,2.3,.027,.27,color);for(const q of [-1,1])for(let j=1;j<=3;j++){const engine=cyl(q*(.18+j*.19),.16,-.05,.06,.24,steel);engine.rotation.x=Math.PI/2;}}
 }else if(kind==='ship'){
  const tanker=record.name==='Seawise Giant';const points=[new T.Vector2(.02,-1),new T.Vector2(.10,-.95),new T.Vector2(.18,-.7),new T.Vector2(.18,.7),new T.Vector2(.13,1)];const hull=mesh(new T.LatheGeometry(points,32),rubber);hull.rotation.z=Math.PI/2;hull.scale.set(.9,1,1);box(0,.14,0,1.8,.11,.31,cream);if(tanker){box(.68,.32,0,.25,.28,.25,cream);for(let j=0;j<12;j++)box(-.7+j*.1,.23,0,.04,.04,.20,metal);}else{box(0,.27,0,1.3,.16,.25,cream);for(let i=0;i<4;i++)cyl(-.42+i*.27,.47,0,.048,.28,metal);for(let i=0;i<30;i++)ball(-.85+i*.055,.28,.13,.01,.01,.004,rubber);}
 }else if(kind==='rocket'){
  cyl(0,.50,0,.09,1,cream);mesh(new T.ConeGeometry(.09,.14,24),cream,0,1.07,0);for(const y of [.15,.45,.8])cyl(0,y,0,.092,.045,rubber);for(const q of [-1,1]){box(q*.10,.10,0,.12,.18,.02,cream);mesh(new T.ConeGeometry(.04,.08,16),steel,q*.045,-.03,0);}cyl(0,1.18,0,.008,.12,steel);
 }
 root.userData.kind=kind;return root;
}
