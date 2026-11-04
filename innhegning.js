/* ==========================================================================
   Dinoparken – felles 3D-scene for innhegningene  (innhegning.js)
   --------------------------------------------------------------------------
   Hver innhegningsside (triceratops-enga.html, langhalsskogen.html …) er et
   lite HTML-skall som kaller  bygg({...})  med sine egne innstillinger:
     id      – samme nummer som i index.html (1–6)
     navn    – vises i toppen
     bakke   – farge på bakken i innhegningen
     gjerde  – 'tre' | 'fare' | 'metall'
     dino    – 'tri' | 'brachio' | 'trex' | 'raptor' | 'ptero' | 'stego'
     størrelse – størrelse på hver plass i innhegningen (som i index.html)
     tema    – 'eng' | 'skog' | 'kløft' | 'rede' | 'kuppel' | 'sump'  (pynt og fôr)
   Krever at oppgaver.js er lastet først.
   ========================================================================== */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function bygg(C){
const ENC_ID=C.id, DINO=C.dino, TEMA=C.tema;

/* ---------- Mynter i toppen (leses fra parkens lagring) ---------- */
const coinN=document.getElementById('coinN'), coinsBox=document.getElementById('coins');
let lastCoins=null;
window.DinoParkHUD = () => {
  const s=DinoOppgaver.lesPark(); coinN.textContent=s.coins;
  if(lastCoins!==null && s.coins!==lastCoins){ coinsBox.classList.remove('pop'); void coinsBox.offsetWidth; coinsBox.classList.add('pop'); }
  lastCoins=s.coins; refreshLabels();
};
document.getElementById('adult').onclick=()=>DinoOppgaver.voksen();

/* ---------- 3D-oppsett ---------- */
const canvas=document.getElementById('scene');
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }
catch(e){ document.getElementById('loading').textContent='Denne nettleseren støtter ikke 3D (WebGL).'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
camera.position.set(30,30,30);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true; controls.dampingFactor=.15; controls.enablePan=false;
controls.minZoom=.8; controls.maxZoom=2.4; controls.minPolarAngle=.55; controls.maxPolarAngle=1.1;
controls.target.set(0,0,1);
controls.enabled=true;    // snu og zoom (sett til false for å låse kameraet)
function resize(){
  const w=innerWidth,h=innerHeight,a=w/h, v=a<1?Math.max(30,36/a):Math.max(30,44/a);
  camera.left=-v*a/2; camera.right=v*a/2; camera.top=v/2; camera.bottom=-v/2; camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
}
addEventListener('resize',resize); resize();
scene.add(new THREE.HemisphereLight(0xffffff,0x8fae7a,1.25));
const sun=new THREE.DirectionalLight(0xfff1d6,2.4); sun.position.set(18,30,10); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:90});
sun.shadow.bias=-.0004; sun.shadow.normalBias=.03; scene.add(sun);

/* ---------- Hjelpere (samme som i index.html) ---------- */
let seed=7+ENC_ID*13;
const rand=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
const R=(a,b)=>a+rand()*(b-a), PI=Math.PI;
const mats={}; const M=c=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.85}));
const G={ ico:new THREE.IcosahedronGeometry(1,0), dod:new THREE.DodecahedronGeometry(1,0), box:new THREE.BoxGeometry(1,1,1),
  cone:new THREE.ConeGeometry(1,1,6), cone4:new THREE.ConeGeometry(1,1,4), cyl:new THREE.CylinderGeometry(1,1,1,6),
  cyl8:new THREE.CylinderGeometry(1,1,1,8), cyl24:new THREE.CylinderGeometry(1,1,1,24), neck:new THREE.CylinderGeometry(.72,1,1,6) };
function add(parent,geo,color,x=0,y=0,z=0,sx=1,sy=1,sz=1,cast=true){
  const m=new THREE.Mesh(geo,color instanceof THREE.Material?color:M(color));
  m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m;
}
function slab(pts,y0,depth,mat){
  const sh=new THREE.Shape(); pts.forEach((p,i)=>i?sh.lineTo(p.x,-p.z):sh.moveTo(p.x,-p.z));
  const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false}); geo.rotateX(-PI/2);
  const m=new THREE.Mesh(geo,mat instanceof THREE.Material?mat:M(mat)); m.position.y=y0; m.receiveShadow=true; scene.add(m); return m;
}
function inPoly(P,x,z){ let c=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const a=P[i],b=P[j]; if(((a.z>z)!==(b.z>z))&&(x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)) c=!c; } return c; }
function blob(rx,rz,n,wob,cx=0,cz=0,s=3){ const P=[]; for(let i=0;i<n;i++){ const a=i/n*PI*2, k=1+Math.sin(a*2+s)*wob+Math.sin(a*3+s*2)*wob*.6; P.push({x:cx+Math.cos(a)*rx*k,z:cz+Math.sin(a)*rz*k,a}); } return P; }
function clockTexture(){
  const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  x.fillStyle='#fffdf6'; x.beginPath(); x.arc(128,128,124,0,7); x.fill(); x.lineWidth=10; x.strokeStyle='#1f3b2c'; x.stroke();
  x.fillStyle='#1f3b2c'; x.font='700 34px Fredoka, sans-serif'; x.textAlign='center'; x.textBaseline='middle';
  for(let i=1;i<=12;i++){ const a=i/12*PI*2; x.fillText(i,128+Math.sin(a)*92,128-Math.cos(a)*92); }
  x.lineCap='round'; x.strokeStyle='#3f86c9'; x.lineWidth=9; x.beginPath(); x.moveTo(128,128); x.lineTo(128,40); x.stroke();
  x.strokeStyle='#c2453a'; x.lineWidth=14; x.beginPath(); x.moveTo(128,128); x.lineTo(178,128); x.stroke();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

/* ---------- Landskap ---------- */
const ISL=blob(19,17,40,.07,0,1,5);
slab(ISL,-1.2,1.2,TEMA==='kløft'?0xb9a57a:0x7cc35a);
add(scene,G.cyl8,0x3fa9d6,0,-1.4,1,60,.2,60,false);
const ENC=blob(13,11,16,.1,0,1,2+ENC_ID);
slab(ENC,0,.12,new THREE.MeshStandardMaterial({color:C.bakke,flatShading:true,roughness:.9}));
const WALK=blob(10.5,8.5,16,.1,0,1,2+ENC_ID);
/* Gjerde */
const GJERDE={ tre:{post:0x8a5a3a,rail:0xc08a55,h:1.1,rails:[.45,.9],r:.11}, fare:{post:0x4a4a4a,rail:0xf2c230,h:2.0,rails:[.6,1.2,1.8],r:.13}, metall:{post:0x6e7b86,rail:0xb8c3cc,h:1.6,rails:[.5,1.0,1.45],r:.1} }[C.gjerde||'tre'];
{ const P=ENC, n=P.length, gateI=Math.round(n*.2);
  for(let i=0;i<n;i++){ const a=P[i],b=P[(i+1)%n], len=Math.hypot(b.x-a.x,b.z-a.z), segs=Math.max(1,Math.round(len/1.3)), yaw=Math.atan2(b.x-a.x,b.z-a.z);
    for(let k=0;k<segs;k++){ const t0=k/segs, tm=(k+.5)/segs;
      if(i===gateI && Math.abs(tm-.5)<.35) continue;
      add(scene,G.cyl,GJERDE.post,a.x+(b.x-a.x)*t0,GJERDE.h/2,a.z+(b.z-a.z)*t0,GJERDE.r,GJERDE.h,GJERDE.r);
      for(const ry of GJERDE.rails){ const r=add(scene,G.box,GJERDE.rail,a.x+(b.x-a.x)*tm,ry,a.z+(b.z-a.z)*tm,.07,.09,len/segs+.02); r.rotation.y=yaw; } } } }
/* Planter og steiner */
function pine(x,z,s=1){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=R(0,6); scene.add(g);
  add(g,G.cyl,0x7a4a2a,0,.5*s,0,.18*s,s,.18*s); for(let i=0;i<3;i++){ const r=(1.1-i*.28)*s; add(g,G.cone,0x4f9a4a,0,(1.2+i*.75)*s,0,r,1.3*s,r); } }
function roundTree(x,z,s=1){ const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  add(g,G.cyl,0x7a4a2a,0,.9*s,0,.2*s,1.8*s,.2*s); add(g,G.ico,0x6cbf4f,0,2.3*s,0,1.2*s,1.05*s,1.2*s); add(g,G.ico,0x5fb046,.7*s,2*s,.3*s,.75*s,.7*s,.75*s); }
function tallTree(x,z,s=1){ const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  add(g,G.cyl,0x7a4a2a,0,2*s,0,.25*s,4*s,.25*s); add(g,G.ico,0x5fb046,0,4.6*s,0,1.5*s,1.1*s,1.5*s); add(g,G.ico,0x6cbf4f,.8*s,4.1*s,.3*s,.9*s,.7*s,.9*s); }
function deadTree(x,z,s=1){ const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=R(0,6); scene.add(g);
  add(g,G.cyl,0x6b5a48,0,1*s,0,.16*s,2*s,.16*s); const a=add(g,G.cyl,0x6b5a48,.35*s,1.6*s,0,.08*s,1*s,.08*s); a.rotation.z=-.8; }
function fern(x,z,s=1,c=0x4f9a4a){ for(let j=0;j<5;j++){ const f=add(scene,G.cone4,c,x+R(-.2,.2),.35*s,z+R(-.2,.2),.1*s,R(.7,1)*s,.1*s); f.rotation.z=R(-.7,.7); f.rotation.x=R(-.5,.5); } }
function reed(x,z){ for(let j=0;j<4;j++){ const r=add(scene,G.cyl,0x7a9a4a,x+R(-.2,.2),.6,z+R(-.2,.2),.04,R(1,1.5),.04); r.rotation.z=R(-.2,.2); add(scene,G.cyl,0x7a4a2a,r.position.x,r.position.y+.6,r.position.z,.07,.3,.07); } }
const rock=(x,z,s=1,c=0x9a948c)=>add(scene,G.dod,c,x,.3*s,z,s,.7*s,s*R(.8,1.2));
const flower=(x,z)=>add(scene,G.ico,[0xffd34d,0xff8fb1,0xffffff,0xb79cff][Math.floor(rand()*4)],x,.16,z,.13,.13,.13,false);
function pond(cx,cz,rx,rz,s=1){ const P=blob(rx,rz,14,.12,cx,cz,s); slab(P,.1,.06,new THREE.MeshStandardMaterial({color:0x56bce6,roughness:.3}));
  for(let i=0;i<9;i++){ const a=i/9*PI*2; add(scene,G.dod,0x8f877f,cx+Math.cos(a)*(rx+.3),.2,cz+Math.sin(a)*(rz+.3),R(.3,.5),R(.2,.35),R(.3,.5)); } }

/* ---------- Stasjonene ---------- */
const STATION_POS={ klokke:{x:-6.5,z:-4.5}, penger:{x:6.8,z:-4.2}, tier:{x:1,z:-7}, lyder:{x:6,z:5.5}, stavelser:{x:-1.5,z:8.5} };
const anchors={};
function station(id,y){ const p=STATION_POS[id], g=new THREE.Group(); g.position.set(p.x,0,p.z); scene.add(g); anchors[id]=new THREE.Vector3(p.x,y,p.z); return g; }
/* Fôret i krybba passer til dinoen */
const FÔR = { eng:[0x4f9a4a,'blad'], skog:[0x3f8a3a,'blad'], sump:[0x6a9a3a,'blad'], kløft:[0xa8463a,'kjøtt'], rede:[0xa8463a,'kjøtt'], kuppel:[0x9fb6c9,'fisk'] }[TEMA];
{ const g=station('klokke',4.6);
  for(const sx of [-1,1]) add(g,G.cyl,0x7a4a2a,sx*1.1,1.6,0,.14,3.2,.14);
  add(g,G.box,0x8a5a3a,0,2.5,0,2.8,1.9,.18);
  const face=new THREE.Mesh(new THREE.CircleGeometry(.85,32),new THREE.MeshStandardMaterial({map:clockTexture(),roughness:.6}));
  face.position.set(0,2.5,.11); g.add(face); g.rotation.y=.6;
  add(g,G.box,0x9a6a3e,.2,.35,1.6,2.4,.5,.9); add(g,G.box,0x6b9a3e,.2,.62,1.6,2.1,.08,.65,false);
  for(let i=0;i<5;i++){
    if(FÔR[1]==='blad'){ const c=add(g,G.cone4,FÔR[0],-.7+i*.45,.8,1.6,.09,.6,.09); c.rotation.z=R(-.5,.5); }
    else if(FÔR[1]==='kjøtt'){ add(g,G.dod,FÔR[0],-.7+i*.45,.75,1.6+R(-.15,.15),.18,.14,.22); add(g,G.cyl,0xfff3dc,-.7+i*.45,.75,1.85,.04,.25,.04).rotation.x=PI/2; }
    else { const f=add(g,G.ico,FÔR[0],-.7+i*.45,.75,1.6,.12,.1,.3); add(g,G.cone4,FÔR[0],-.7+i*.45,.75,1.95,.1,.15,.06).rotation.x=PI/2; f.rotation.y=R(-.4,.4); }
  } }
{ const g=station('penger',4.2);
  add(g,G.box,0xf6ecd0,0,1,0,2.4,2,1.8); add(g,G.box,0x9a6a3e,0,1.05,.98,2.4,.18,.5);
  add(g,G.box,0x1f3b2c,0,1.55,.91,1.8,.8,.02,false);
  for(let i=0;i<6;i++) add(g,G.box,i%2?0xffffff:0xe0a21f,-1.25+i*.5,2.25,.25,.5,.14,2.3).rotation.x=-.25;
  add(g,G.cone4,0xe0a21f,0,2.8,0,1.9,.7,1.6).rotation.y=PI/4;
  add(g,G.cyl24,0xf2c230,-.6,1.24,1.05,.16,.04,.16); add(g,G.cyl24,0xe7e9ec,.5,1.24,1.08,.13,.04,.13); g.rotation.y=-.5; }
{ const g=station('tier',3.4);
  add(g,G.box,0x9a6a3e,0,.3,0,2.6,.6,1.4); add(g,G.box,0xe9c46a,0,.62,0,2.4,.06,1.2,false);
  const eggGeo=new THREE.IcosahedronGeometry(1,1);
  for(let i=0;i<5;i++) for(let j=0;j<2;j++){ if(i===4&&j===1) continue; const e=new THREE.Mesh(eggGeo,new THREE.MeshStandardMaterial({color:0xf6ecd0,flatShading:true}));
    e.scale.set(.17,.22,.17); e.position.set(-.9+i*.45,.85,-.25+j*.5); e.castShadow=true; g.add(e); }
  add(g,G.cyl,0x6e7b86,1.4,1.2,0,.06,2.4,.06); add(g,G.box,0x6e7b86,.9,2.35,0,1.1,.06,.06);
  const lamp=add(g,G.cone,0xc2453a,.4,2.15,0,.35,.4,.35); lamp.rotation.x=PI;
  add(g,G.ico,new THREE.MeshStandardMaterial({color:0xffd27a,emissive:0xff9a2a,emissiveIntensity:.8}),.4,1.92,0,.14,.14,.14,false); }
{ const g=station('lyder',4.4);
  add(g,G.cyl,0x4a4a4a,0,1.5,0,.12,3,.12);
  for(const [y,ry] of [[3,.6],[2.6,-1.2]]){ const h=new THREE.Group(); h.position.y=y; h.rotation.y=ry; g.add(h);
    const c=add(h,G.cone,0xc2453a,0,0,.45,.45,.9,.45); c.rotation.x=-PI/2; add(h,G.cyl,0x1f3b2c,0,0,.9,.38,.04,.38).rotation.x=PI/2; }
  add(g,G.dod,0x9a948c,0,.35,0,.8,.5,.8); }
{ const g=station('stavelser',3.6);
  for(let i=0;i<5;i++) add(g,G.cyl8,0xd9c79a,-2+i*1,.07,R(-.2,.2),.45,.06,.45,false);
  const cols=[0x7d64c4,0x3f86c9,0xe0782f];
  for(let i=0;i<3;i++){ const x=-1.6+i*1.6; add(g,G.cyl,0x7a4a2a,x,.8,-.7,.08,1.6,.08); const b=add(g,G.box,cols[i],x,1.5,-.7,1.1,.5,.08); b.rotation.z=(i-1)*.08; } }

/* ---------- Pynt etter tema ---------- */
const PONDS=[];
const near=(x,z,r)=>Object.values(STATION_POS).some(p=>Math.hypot(p.x-x,p.z-z)<r) || PONDS.some(p=>Math.hypot(x-p[0],z-p[1])<p[2]);
if(TEMA==='eng'){ pond(-4.5,4.2,2.6,1.8,1); PONDS.push([-4.5,4.2,3.6]); }
if(TEMA==='skog'){ pond(-4.5,3.8,2.2,1.5,2); PONDS.push([-4.5,3.8,3.2]); }
if(TEMA==='sump'){ for(const [x,z,rx,rz] of [[-4.5,3.8,3,2],[3,1,2.2,1.6],[-2,-2,1.6,1.2]]){ pond(x,z,rx,rz,x); PONDS.push([x,z,Math.max(rx,rz)+1.2]);
    for(let i=0;i<4;i++) add(scene,G.cyl8,0x5aa04a,x+R(-rx,rx)*.6,.18,z+R(-rz,rz)*.6,.35,.03,.35,false); } }
if(TEMA==='kløft'){ PONDS.push([0,1,2.8]); for(let i=0;i<5;i++){ const a=i/5*PI*2+.3; rock(Math.cos(a)*1.6,1+Math.sin(a)*1.3,R(.9,1.5),0x8f8478); }
  add(scene,G.cyl,0xfff3dc,.4,.12,.6,.08,1.4,.08,false).rotation.z=PI/2; add(scene,G.ico,0xfff3dc,-.3,.15,.6,.18,.15,.18,false); add(scene,G.ico,0xfff3dc,1.1,.15,.6,.18,.15,.18,false); }
if(TEMA==='rede'){ PONDS.push([0,1,2.6]);
  for(let i=0;i<40;i++){ const a=R(0,PI*2), r=R(1.2,1.9); const s=add(scene,G.cyl,0x8a6a3a,Math.cos(a)*r,.25,1+Math.sin(a)*r,.05,1.1,.05); s.rotation.z=PI/2; s.rotation.y=a+R(-.6,.6); }
  for(let i=0;i<3;i++){ const e=add(scene,G.ico,0xf6ecd0,R(-.5,.5),.3,1+R(-.5,.5),.22,.28,.22); } }
if(TEMA==='kuppel'){ PONDS.push([0,1,3]);
  add(scene,G.dod,0x9a948c,0,1.2,1,2,2.4,2); add(scene,G.dod,0xa8a29a,.4,3.2,1.2,1.3,1.5,1.3); add(scene,G.cyl,0x7cc35a,.4,4.35,1.2,1,.15,1);
  const dome=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.35}));
  dome.scale.set(13.5,9,11.5); dome.position.set(0,0,1); scene.add(dome); }
for(let i=0;i<260;i++){
  const a=R(0,PI*2), d=R(0,20), x=Math.cos(a)*d, z=1+Math.sin(a)*d*.9;
  if(!inPoly(ISL,x,z)) continue;
  if(inPoly(ENC,x,z)){
    if(near(x,z,3) || inPoly(WALK,x,z)&&rand()<(TEMA==='skog'?.7:.85)) continue;
    const k=rand();
    if(TEMA==='skog'){ if(k<.35) tallTree(x,z,R(.8,1.1)); else if(k<.7) fern(x,z,R(.9,1.3),0x3f8a3a); else add(scene,G.ico,0x4f9a4a,x,.3,z,.5,.4,.5); }
    else if(TEMA==='kløft'){ if(k<.5) rock(x,z,R(.4,1),0x8f8478); else if(k<.7) deadTree(x,z,R(.8,1.2)); else add(scene,G.cone4,0xb5b45e,x,.3,z,.08,.7,.08); }
    else if(TEMA==='rede'){ if(k<.6){ for(let j=0;j<3;j++) add(scene,G.cone4,0xb5b45e,x+R(-.3,.3),.4,z+R(-.3,.3),.08,R(.7,1.1),.08).rotation.z=R(-.3,.3); } else rock(x,z,R(.4,.8)); }
    else if(TEMA==='sump'){ if(k<.5) reed(x,z); else if(k<.8) fern(x,z,R(.8,1.2),0x5a8a3a); else add(scene,G.ico,0x4f8a46,x,.3,z,.5,.4,.5); }
    else { if(k<.45) fern(x,z,R(.8,1.2)); else if(k<.7) flower(x,z); else add(scene,G.ico,0x5fb046,x,.3,z,.5,.4,.5); }
  } else {
    if(inPoly(blob(14,12,16,.1,0,1,2+ENC_ID),x,z)) continue;
    const k=rand();
    if(TEMA==='kløft'){ if(k<.5) rock(x,z,R(.6,1.4),0x8f8478); else if(k<.7) pine(x,z,R(.8,1.1)); else deadTree(x,z); }
    else { if(k<.45) pine(x,z,R(.8,1.2)); else if(k<.75) roundTree(x,z,R(.7,1)); else flower(x,z); }
  }
}

/* ---------- Dinosaurene (bare de som har klekket i parken) ---------- */
function legPivot(parent,x,y,z,len,thick,color){ const p=new THREE.Group(); p.position.set(x,y,z); parent.add(p);
  add(p,G.cyl,color,0,-len/2,0,thick,len,thick); add(p,G.box,color,0,-len+.08,thick*.5,thick*2.2,.16,thick*2.8); return p; }
function tail(parent,x,y,z,len,r,color,tilt=0){ const p=new THREE.Group(); p.position.set(x,y,z); parent.add(p);
  const s=new THREE.Group(); s.rotation.x=tilt; p.add(s); const c=add(s,G.cone,color,0,0,-len/2,r,len,r); c.rotation.x=-PI/2; p.userData.seg=s; return p; }
function neck(parent,x,y,z,len,r,tilt,color){ const p=new THREE.Group(); p.position.set(x,y,z); p.rotation.x=tilt; parent.add(p);
  add(p,G.neck,color,0,len/2,0,r,len*1.05,r); const top=new THREE.Group(); top.position.y=len; top.rotation.x=-tilt; p.add(top); return {pivot:p,top}; }
function eyes(head,x,y,z,s){ for(const sx of [-1,1]){ add(head,G.ico,0xffffff,sx*x,y,z,s,s,s,false); add(head,G.ico,0x1b1b1b,sx*(x+s*.55),y+s*.1,z+s*.25,s*.55,s*.6,s*.55,false); } }
function buildTri(){
  const g=new THREE.Group(), C=0xe0782f, F=0xf4c95d, H=0xfff3dc, legs=[];
  for(const [x,z,o] of [[.62,.85,0],[-.62,.85,PI],[.62,-.85,PI],[-.62,-.85,0]]) legs.push([legPivot(g,x,.95,z,.95,.25,C),o]);
  add(g,G.ico,C,0,1.55,0,1.1,.9,1.55); add(g,G.ico,F,0,1.3,.3,.8,.55,1.1);
  const t=tail(g,0,1.5,-1.3,1.5,.38,C,-.15); const n=neck(g,0,1.65,1.25,.45,.38,1.25,C);
  add(n.top,G.ico,C,0,0,.35,.62,.55,.8); const fr=add(n.top,G.cyl,F,0,.4,-.05,.95,.12,.95); fr.rotation.x=1.15;
  for(const sx of [-1,1]){ const h=add(n.top,G.cone,H,sx*.25,.5,.5,.09,.75,.09); h.rotation.x=1.0; }
  add(n.top,G.cone,H,0,.25,1.0,.08,.35,.08).rotation.x=.5; add(n.top,G.cone4,0xc9a06a,0,-.15,1.05,.18,.35,.18).rotation.x=PI/2;
  eyes(n.top,.38,.2,.55,.13);
  return { g, legs, tail:t, neck:n.pivot, speed:1.2, stride:3.0, amp:.45 };
}
function buildBrachio(){
  const g=new THREE.Group(), C=0x5b9bd5, B=0xb7d8f2, legs=[];
  for(const [x,z,h,o] of [[.6,.8,1.75,0],[-.6,.8,1.75,PI],[.6,-.9,1.45,PI],[-.6,-.9,1.45,0]]) legs.push([legPivot(g,x,h,z,h,.3,C),o]);
  const b=add(g,G.ico,C,0,2.05,0,1.05,.95,1.7); b.rotation.x=-.12;
  add(g,G.ico,B,0,1.75,.2,.8,.6,1.3).rotation.x=-.12;
  for(const [x,y,z] of [[.55,2.6,.3],[-.5,2.55,-.4],[.3,2.85,-.9]]) add(g,G.ico,0x3f7fbd,x,y,z,.22,.1,.28,false);
  const t=tail(g,0,1.95,-1.5,2.8,.45,C,-.25); const n=neck(g,0,2.5,1.25,3.3,.32,.38,C);
  add(n.top,G.ico,C,0,.05,.25,.38,.32,.58); eyes(n.top,.27,.17,.3,.11);
  return { g, legs, tail:t, neck:n.pivot, speed:.7, stride:2.2, amp:.35 };
}
function buildStego(){
  const g=new THREE.Group(), C=0x9b84d6, P=0xf08a4b, legs=[];
  for(const [x,z,h,o] of [[.6,.8,.85,0],[-.6,.8,.85,PI],[.6,-.8,1.15,PI],[-.6,-.8,1.15,0]]) legs.push([legPivot(g,x,h,z,h,.26,C),o]);
  const b=add(g,G.ico,C,0,1.55,0,1.0,.95,1.6); b.rotation.x=.15;
  for(let i=0;i<6;i++){ const z=1.0-i*.42, y=1.55+.95*Math.sqrt(Math.max(0,1-(z/1.7)**2))-z*.15, h=.6-Math.abs(z+.1)*.18; add(g,G.cone4,P,(i%2?.13:-.13),y+h*.3,z,.07,h,.36); }
  const t=tail(g,0,1.75,-1.4,1.7,.33,C,.05);
  for(const [sx,zz] of [[1,-1.25],[-1,-1.25],[1,-1.55],[-1,-1.55]]){ const s=add(t,G.cone,0xfff3dc,sx*.2,.12,zz,.06,.55,.06); s.rotation.z=-sx*1.0; }
  const n=neck(g,0,1.45,1.35,.5,.3,1.7,C); add(n.top,G.ico,C,0,0,.3,.33,.28,.5); eyes(n.top,.22,.1,.35,.1);
  return { g, legs, tail:t, neck:n.pivot, speed:.9, stride:3.0, amp:.45 };
}
function buildTrex(){
  const g=new THREE.Group(), C=0xc2543d, B=0xf0c99a, legs=[];
  for(const [x,o] of [[.45,0],[-.45,PI]]) legs.push([legPivot(g,x,1.45,0,1.45,.32,C),o]);
  for(const sx of [-1,1]) add(g,G.ico,C,sx*.45,1.45,0,.38,.55,.55);
  const b=add(g,G.ico,C,0,2.05,.1,.9,.95,1.45); b.rotation.x=-.3; add(g,G.ico,B,0,1.85,.45,.65,.6,.9).rotation.x=-.3;
  const t=tail(g,0,1.95,-1.0,2.6,.55,C,.05); const n=neck(g,0,2.55,1.0,.55,.42,.9,C);
  add(n.top,G.ico,C,0,.12,.45,.62,.5,.95);
  for(let i=0;i<4;i++) for(const sx of [-1,1]) add(n.top,G.cone,0xffffff,sx*.3,-.25,.6+i*.18,.04,.14,.04,false).rotation.x=PI;
  const jaw=new THREE.Group(); jaw.position.set(0,-.1,0); n.top.add(jaw); add(jaw,G.ico,B,0,-.15,.5,.5,.2,.82);
  eyes(n.top,.42,.32,.6,.13);
  for(const sx of [-1,1]){ const a=add(g,G.box,C,sx*.55,1.95,.95,.14,.14,.45); a.rotation.x=.6; }
  return { g, legs, tail:t, neck:n.pivot, jaw, speed:1.5, stride:2.4, amp:.6 };
}
function buildRaptor(){
  const g=new THREE.Group(), C=0x2f8f7a, B=0xe8e0b0, S=0x1f6656, legs=[];
  for(const [x,o] of [[.22,0],[-.22,PI]]) legs.push([legPivot(g,x,.8,0,.8,.14,C),o]);
  const b=add(g,G.ico,C,0,1.05,.05,.38,.4,.85); b.rotation.x=-.2; add(g,G.ico,B,0,.92,.25,.28,.25,.55).rotation.x=-.2;
  for(const z of [.3,-.1,-.45]) add(g,G.box,S,0,1.38,z,.3,.06,.12,false);
  const t=tail(g,0,1.05,-.65,1.7,.26,C,.08); const n=neck(g,0,1.3,.65,.45,.16,.7,C);
  add(n.top,G.ico,C,0,.05,.25,.25,.22,.5);
  for(let i=0;i<3;i++) add(n.top,G.cone,0xf2c230,0,.25,-.05-i*.15,.06,.35,.06).rotation.x=-.6;
  eyes(n.top,.18,.12,.3,.08);
  for(const sx of [-1,1]){ const a=add(g,G.box,C,sx*.3,1.0,.55,.07,.07,.35); a.rotation.x=.7; }
  return { g, legs, tail:t, neck:n.pivot, speed:3.0, stride:3.4, amp:.7 };
}
function buildPtero(){
  const g=new THREE.Group(), C=0xd9714e, Wc=0xeaa36c;
  add(g,G.ico,C,0,0,0,.28,.25,.75);
  const head=new THREE.Group(); head.position.set(0,.15,.75); g.add(head);
  add(head,G.ico,C,0,0,0,.2,.2,.28); add(head,G.cone4,0xf2c230,0,-.02,.55,.08,.8,.08).rotation.x=PI/2;
  add(head,G.cone4,C,0,.12,-.45,.06,.7,.12).rotation.x=-PI/2-.3; eyes(head,.15,.06,.08,.07);
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.45, 2.4,0,-.1, 0,0,-.35],3)); geo.computeVertexNormals();
  const wm=new THREE.MeshStandardMaterial({color:Wc,flatShading:true,side:THREE.DoubleSide}), wings=[];
  for(const sx of [1,-1]){ const w=new THREE.Group(); w.position.set(sx*.15,.05,0); g.add(w); const m=new THREE.Mesh(geo,wm); m.scale.x=sx; m.castShadow=true; w.add(m); wings.push(w); }
  return { g, wings, flyer:true };
}
const BUILD={ tri:buildTri, brachio:buildBrachio, stego:buildStego, trex:buildTrex, raptor:buildRaptor, ptero:buildPtero };
const STAGE_K=[.45,.72,1], SIZE=C.størrelse||[1,.7];
const walkers=[], flyers=[];
function pickTarget(u){ for(let i=0;i<40;i++){ const x=R(-10,10), z=1+R(-8,8); if(inPoly(WALK,x,z) && !near(x,z,2.4)){ u.target={x,z}; return; } } u.target={x:0,z:1}; }
function spawnDinos(){
  for(const d of [...walkers,...flyers]) scene.remove(d); walkers.length=0; flyers.length=0;
  const list=(DinoOppgaver.lesPark().dinos||{})[ENC_ID]||[];
  list.forEach((info,i)=>{ const b=BUILD[DINO](), d=b.g, s=(SIZE[i]||SIZE[SIZE.length-1])*STAGE_K[info.stage||0]; d.scale.setScalar(s); scene.add(d);
    d.userData={...b, scale:s, phase:0, wait:R(0,2), yaw:R(0,6), seed:R(0,10)}; delete d.userData.g;
    if(b.flyer){ Object.assign(d.userData,{ ang:R(0,6.28), r:R(4.5,8), h:R(4,6.5), dir:i%2?-1:1, angSpeed:R(.35,.55) }); flyers.push(d); }
    else { pickTarget(d.userData); d.position.set(d.userData.target.x,0,d.userData.target.z); d.userData.neckBase=b.neck?b.neck.rotation.x:0; pickTarget(d.userData); walkers.push(d); } });
}
spawnDinos();
const wrapA=a=>Math.atan2(Math.sin(a),Math.cos(a));
function updateWalker(d,dt,t){
  const u=d.userData; let walking=false;
  if(u.wait>0){ u.wait-=dt; for(const [p] of u.legs) p.rotation.x*=.85; if(u.wait<=0) pickTarget(u); }
  else { const dx=u.target.x-d.position.x, dz=u.target.z-d.position.z, dist=Math.hypot(dx,dz);
    if(dist<.35){ u.wait=R(1.5,5); if(u.jaw && rand()<.6) u.roar=1.2; }
    else { walking=true; const diff=wrapA(Math.atan2(dx,dz)-u.yaw); u.yaw+=THREE.MathUtils.clamp(diff,-2.2*dt,2.2*dt);
      const v=u.speed*(.6+.4*u.scale)*Math.max(0,Math.cos(diff)); d.position.x+=Math.sin(u.yaw)*v*dt; d.position.z+=Math.cos(u.yaw)*v*dt;
      u.phase+=dt*Math.max(v,.4)*u.stride/u.scale; for(const [p,o] of u.legs) p.rotation.x=Math.sin(u.phase+o)*u.amp; } }
  if(u.jaw){ u.roar=Math.max(0,(u.roar||0)-dt); u.jaw.rotation.x=u.roar>0?Math.sin((1.2-u.roar)/1.2*PI)*.55:0; }
  d.rotation.y=u.yaw; d.position.y=walking?Math.abs(Math.sin(u.phase))*.06*u.scale:0;
  if(u.tail) u.tail.rotation.y=Math.sin(t*(walking?3:1.1)+u.seed)*(walking?.25:.12);
  if(u.neck) u.neck.rotation.x=u.neckBase+Math.sin(t*1.3+u.seed)*(walking?.04:.1);
}
function updateFlyer(d,dt,t){
  const u=d.userData; u.ang+=dt*u.angSpeed*u.dir;
  d.position.set(Math.cos(u.ang)*u.r, u.h+Math.sin(t*.8+u.seed)*.6, 1+Math.sin(u.ang)*u.r*.85);
  const vx=-Math.sin(u.ang)*u.dir, vz=Math.cos(u.ang)*u.dir; d.rotation.set(0,Math.atan2(vx,vz),-.3*u.dir);
  const flap=Math.sin(t*5+u.seed)*.5*(.35+.65*Math.max(0,Math.sin(t*.6+u.seed))); u.wings[0].rotation.z=flap; u.wings[1].rotation.z=-flap;
}

/* ---------- Skilt over stasjonene ---------- */
const labels=document.getElementById('labels'), tags={};
for(const st of DinoOppgaver.STASJONER){
  const b=document.createElement('button'); b.className='st'; b.style.setProperty('--c',st.farge);
  b.innerHTML=`<span class="ic">${st.ikon}</span><span class="tx">${st.navn} <span class="stars"></span><small>${st.tema}</small></span>`;
  b.onclick=()=>DinoOppgaver.open(st.id,{enc:ENC_ID,onClose:()=>{ refreshLabels(); spawnDinos(); window.DinoParkHUD(); }});
  labels.appendChild(b); tags[st.id]=b;
}
function refreshLabels(){
  for(const st of DinoOppgaver.STASJONER){
    const s=DinoOppgaver.status(st.id), b=tags[st.id]; if(!b) continue;
    b.querySelector('.stars').textContent='★'.repeat(s.stjerner);
    b.querySelector('small').textContent=`${st.tema} · nivå ${s.nivå}`;
    b.classList.toggle('due',s.forfall);
    b.setAttribute('aria-label',`${st.navn}: ${st.tema}, nivå ${s.nivå}${s.forfall?', trenger repetisjon':''}`);
  }
}
const tmp=new THREE.Vector3();
function placeLabels(){
  // left/top (ikke transform), så forstørrelsen ved hover ikke flytter skiltet sidelengs
  for(const id in anchors){ tmp.copy(anchors[id]).project(camera);
    tags[id].style.left=(tmp.x*.5+.5)*innerWidth+'px'; tags[id].style.top=(-tmp.y*.5+.5)*innerHeight+'px'; }
}
window.DinoParkHUD();

/* ---------- Animasjon ---------- */
const clock=new THREE.Clock();
document.getElementById('loading').remove();
renderer.setAnimationLoop(()=>{
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  for(const d of walkers) updateWalker(d,dt,t);
  for(const d of flyers) updateFlyer(d,dt,t);
  controls.update(); renderer.render(scene,camera); placeLabels();
});
}
