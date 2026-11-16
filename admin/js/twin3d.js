/* 디지털 트윈 3D 화면 — three.js(MIT)를 인터넷에서 불러와 냉수 계통 설비를 입체로 그린다.
   형상은 전부 코드로 만든 것(외부 3D 모델 없음). 상태·온도·유량은 twin.js의 모형 값을 받아 표시만 한다. */
(function(){
const URL3="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const STC={run:0x22b463,stby:0x8a94a3,start:0xe0a020,fail:0xe04a3a,off:0x596270};
async function create(host){
  const THREE=await import(URL3);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x17212d);scene.fog=new THREE.Fog(0x17212d,90,190);
  const cam=new THREE.PerspectiveCamera(38,2,0.5,400);
  scene.add(new THREE.HemisphereLight(0xe6f0ff,0x3a4655,1.55));
  const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(18,34,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-48,right:48,top:34,bottom:-34,near:1,far:120});scene.add(sun);
  const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,metalness:0.45,roughness:0.5},o));
  const steel=M(0xa9b4c0),dark=M(0x2a323c,{metalness:0.3}),white=M(0xe3e8ee,{metalness:0.1,roughness:0.7}),skid=M(0x3a4450),blue=M(0x4f7fb3),copper=M(0xb8734a);
  const add=(geo,mat,x,y,z,par)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(par||scene).add(m);return m};
  const box=(w,h,d,mat,x,y,z,par)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,par);
  const cylX=(r,l,mat,x,y,z,par)=>{const m=add(new THREE.CylinderGeometry(r,r,l,28),mat,x,y,z,par);m.rotation.z=Math.PI/2;return m};
  const cylY=(r,h,mat,x,y,z,par)=>add(new THREE.CylinderGeometry(r,r,h,28),mat,x,y,z,par);
  const lamp=(x,y,z,par)=>add(new THREE.SphereGeometry(0.2,16,12),new THREE.MeshStandardMaterial({color:0x222222,emissive:0x22b463,emissiveIntensity:1.6}),x,y,z,par);
  // 바닥
  const g0=add(new THREE.PlaneGeometry(160,110),new THREE.MeshStandardMaterial({color:0x1d2834,roughness:1}),0,0,0);g0.rotation.x=-Math.PI/2;g0.castShadow=false;
  const slab=(w,d,x,z,c)=>{const m=box(w,0.12,d,new THREE.MeshStandardMaterial({color:c,roughness:0.9}),x,0.06,z);m.castShadow=false;return m};
  slab(32,30,-19,0,0x35424f);slab(22,30,21,0,0x3d4a59);slab(10,30,2,0,0x303c49);
  const grid=new THREE.GridHelper(22,22,0x5a6f88,0x4a5c72);grid.position.set(21,0.13,0);scene.add(grid);
  const wall=M(0x6f8198,{transparent:true,opacity:0.16,metalness:0});box(22,3.2,0.15,wall,21,1.6,-15).castShadow=false;box(0.15,3.2,30,wall,32,1.6,0).castShadow=false;
  // 글자 라벨
  function label(x,y,z,w){const c=document.createElement("canvas");c.width=256;c.height=96;const tx=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));sp.position.set(x,y,z);sp.scale.set((w||4.2)*1.35,(w||4.2)*1.35*0.375,1);sp.renderOrder=5;scene.add(sp);let last="";
    return{set(a,b,col){const k=a+"|"+b+"|"+col;if(k===last)return;last=k;const g=c.getContext("2d");g.clearRect(0,0,256,96);g.fillStyle="rgba(10,16,24,.78)";g.beginPath();g.roundRect(4,8,248,80,10);g.fill();g.strokeStyle=col||"#5d7ea6";g.lineWidth=3;g.stroke();g.textAlign="center";g.fillStyle="#fff";g.font="700 30px 'Malgun Gothic',sans-serif";g.fillText(a,128,44);g.fillStyle=col||"#b8c8da";g.font="600 24px 'Malgun Gothic',sans-serif";g.fillText(b,128,76);tx.needsUpdate=true}}}
  const zs=[-9,0,9],zb=[-10,-5,0,5,10],hex=n=>"#"+n.toString(16).padStart(6,"0");
  const E={fan:[],chBody:[],chLamp:[],chLab:[],imp:[],ppLamp:[],crahFan:[],crahStrip:[],rackMat:[],crahLab:[]};
  zs.forEach((z,i)=>{
    // 냉각탑
    box(4.2,3.2,4.2,M(0x7f8b98,{metalness:0.2}),-31,1.6,z);for(let k=0;k<4;k++)box(4.3,0.18,3.6,dark,-31,0.7+k*0.5,z);
    cylY(1.7,0.9,M(0x56616e),-31,3.65,z);const fg=new THREE.Group();fg.position.set(-31,4.15,z);scene.add(fg);for(let k=0;k<4;k++){const b=box(2.9,0.07,0.5,white,0,0,0,fg);b.rotation.y=k*Math.PI/4;b.rotation.x=0.25}E.fan.push(fg);cylY(0.3,0.25,dark,-31,4.15,z);
    // 냉동기
    box(6.6,0.25,3,skid,-19,0.25,z);cylX(0.78,6.2,blue,-19,1.2,z-0.65);cylX(0.72,6.2,M(0x7c8894),-19,1.15,z+0.8);
    [-3.1,3.1].forEach(dx=>{cylX(0.86,0.18,steel,-19+dx,1.2,z-0.65);cylX(0.8,0.18,steel,-19+dx,1.15,z+0.8)});
    const cb=cylX(0.62,2.3,M(0x8a94a3),-19.6,2.45,z+0.05);E.chBody.push(cb);box(1.5,1.0,1.1,M(0x4a5562),-17.6,2.35,z+0.05);cylX(0.2,1.4,copper,-18.6,1.9,z-0.3);
    box(0.5,1.7,1.3,M(0x39424d),-15.5,1.25,z+0.05);box(0.05,0.5,0.8,new THREE.MeshStandardMaterial({color:0x0b1118,emissive:0x1a4a7a,emissiveIntensity:1.1}),-15.22,1.6,z+0.05);E.chLamp.push(lamp(-15.5,2.3,z+0.05));
    E.chLab.push(label(-19,4.6,z));
    // 펌프
    box(2.6,0.22,1.1,skid,-9,0.2,z);cylX(0.46,1.4,M(0x3f6f9f),-9.5,0.85,z);for(let k=0;k<5;k++)cylX(0.5,0.05,dark,-10+k*0.25,0.85,z);
    cylX(0.62,0.55,steel,-8.2,0.85,z);cylY(0.24,0.9,steel,-8.2,1.5,z);const sh=new THREE.Group();sh.position.set(-8.75,0.85,z);scene.add(sh);box(0.12,0.9,0.12,M(0xe6c34a),0,0,0,sh);box(0.12,0.12,0.9,M(0xe6c34a),0,0,0,sh);E.imp.push(sh);E.ppLamp.push(lamp(-9.5,1.5,z));
  });
  // 축열 탱크
  cylY(1.9,5,white,1.5,2.6,0);const dome=add(new THREE.SphereGeometry(1.9,28,14,0,Math.PI*2,0,Math.PI/2),white,1.5,5.1,0);dome.scale.y=0.45;
  const band=cylY(1.93,1.3,new THREE.MeshStandardMaterial({color:0x2f86e6,emissive:0x2f86e6,emissiveIntensity:0.55,roughness:0.4}),1.5,2.4,0);[1.2,3.9].forEach(y=>cylY(1.95,0.12,steel,1.5,y,0));
  const tankLab=label(1.5,6.9,0,4.6);
  // CRAH와 서버 랙
  zb.forEach((z,i)=>{box(1.4,2.5,2.8,white,13,1.25,z);box(0.06,1.6,2.2,dark,13.72,1.4,z);const st=box(0.07,0.18,2.6,new THREE.MeshStandardMaterial({color:0x111111,emissive:0x2d6fb5,emissiveIntensity:1.5}),13.73,2.35,z);E.crahStrip.push(st);
    const cf=new THREE.Group();cf.position.set(13,2.54,z);scene.add(cf);for(let k=0;k<3;k++){const b=box(1.0,0.04,0.22,dark,0,0,0,cf);b.rotation.y=k*Math.PI/3}E.crahFan.push(cf);
    const rm=new THREE.MeshStandardMaterial({color:0x0a0d11,emissive:0x2d6fb5,emissiveIntensity:1.4});E.rackMat.push(rm);
    for(let k=0;k<9;k++){const x=17+k*1.45;box(1.2,2.2,0.9,M(0x161b22,{metalness:0.5,roughness:0.6}),x,1.1,z-1.1);box(1.2,2.2,0.9,M(0x161b22,{metalness:0.5,roughness:0.6}),x,1.1,z+1.1);const a=box(0.5,1.7,0.04,rm,x,1.15,z-0.63);a.castShadow=false;const b2=box(0.5,1.7,0.04,rm,x,1.15,z+0.63);b2.castShadow=false}
    E.crahLab.push(label(13,3.9,z,3.6))});
  const supLab=label(-2.5,5.1,0,4),retLab=label(-8,5.9,13,4),pwrLab=label(-31,7,0,4.6);
  // 배관: 관 + 흐르는 입자
  const V=(x,y,z)=>new THREE.Vector3(x,y,z),pipes=[];
  function pipe(pts,kind,act,flow,r){const path=new THREE.CurvePath();for(let i=0;i<pts.length-1;i++)path.add(new THREE.LineCurve3(pts[i],pts[i+1]));const len=path.getLength(),rad=r||0.24;
    const mat=new THREE.MeshStandardMaterial({color:0x4b5866,metalness:0.5,roughness:0.45});const tube=add(new THREE.TubeGeometry(path,Math.max(8,Math.round(len*3)),rad,12,false),mat,0,0,0);
    pts.slice(1,-1).forEach(p=>add(new THREE.SphereGeometry(rad*1.12,12,10),mat,p.x,p.y,p.z));
    const n=Math.max(2,Math.round(len/1.5)),pm=new THREE.MeshBasicMaterial({color:0xffffff}),inst=new THREE.InstancedMesh(new THREE.SphereGeometry(rad*0.62,10,8),pm,n);inst.castShadow=false;scene.add(inst);
    pipes.push({path,len,mat,pm,inst,n,kind,act,flow,off:0})}
  zs.forEach((z,i)=>{
    pipe([V(-29,1.3,z+0.8),V(-22.2,1.3,z+0.8)],"c",d=>d.ch[i].s==="run",()=>1,0.2);pipe([V(-22.2,0.75,z+1.4),V(-29,0.75,z+1.4)],"c",d=>d.ch[i].s==="run",()=>1,0.2);
    pipe([V(-15.8,1.2,z-0.65),V(-13,1.2,z-0.65),V(-13,0.85,z),V(-10.3,0.85,z)],"s",d=>d.pumps[i],()=>1);
    pipe([V(-8.2,1.9,z),V(-8.2,3.4,z),V(-5,3.4,z)],"s",d=>d.pumps[i],()=>1);
    pipe([V(-24.5,4.4,z-0.65),V(-24.5,1.2,z-0.65),V(-22.2,1.2,z-0.65)],"r",d=>d.pumps[i],()=>1)});
  pipe([V(-5,3.4,-9),V(-5,3.4,9)],"s",d=>d.flow>0,d=>d.flow,0.3);pipe([V(-5,3.4,0),V(-0.4,3.4,0)],"s",d=>d.flow>0,d=>d.flow,0.3);
  pipe([V(3.4,3.4,0),V(8.5,3.4,0)],"s",d=>d.flow>0,d=>d.flow,0.3);pipe([V(8.5,3.4,-10),V(8.5,3.4,10)],"s",d=>d.flow>0,d=>d.flow,0.3);
  zb.forEach((z,i)=>{pipe([V(8.5,3.4,z),V(12.6,3.4,z),V(12.6,2.5,z)],"s",d=>d.flow>0,d=>d.bq[i],0.2);pipe([V(13.4,2.5,z),V(13.4,4.4,z),V(10.2,4.4,z)],"r",d=>d.flow>0,d=>d.bq[i],0.2)});
  pipe([V(10.2,4.4,-10),V(10.2,4.4,13),V(-24.5,4.4,13),V(-24.5,4.4,-9.65)],"r",d=>d.flow>0,d=>d.flow,0.3);
  // 카메라
  const orb={t:new THREE.Vector3(0,1,1),r:47,th:0.3,ph:0.9};
  const place=()=>{cam.position.set(orb.t.x+orb.r*Math.sin(orb.ph)*Math.sin(orb.th),orb.t.y+orb.r*Math.cos(orb.ph),orb.t.z+orb.r*Math.sin(orb.ph)*Math.cos(orb.th));cam.lookAt(orb.t)};
  const size=()=>{const w=host.clientWidth||800,h=Math.round(Math.min(640,Math.max(360,w*0.6)));renderer.setSize(w,h,false);renderer.domElement.style.width="100%";renderer.domElement.style.height=h+"px";cam.aspect=w/h;cam.updateProjectionMatrix()};
  const cv=renderer.domElement;cv.style.display="block";cv.style.touchAction="none";cv.style.cursor="grab";let drag=null;
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,b:e.button};cv.setPointerCapture(e.pointerId)});
  cv.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
    if(drag.b===2||e.shiftKey){const rt=new THREE.Vector3().setFromMatrixColumn(cam.matrix,0),fw=new THREE.Vector3(-Math.sin(orb.th),0,-Math.cos(orb.th)),k=orb.r*0.0016;orb.t.addScaledVector(rt,-dx*k).addScaledVector(fw,dy*k)}
    else{orb.th-=dx*0.005;orb.ph=Math.min(1.5,Math.max(0.25,orb.ph-dy*0.005))}place()});
  cv.addEventListener("pointerup",()=>drag=null);
  cv.addEventListener("wheel",e=>{e.preventDefault();orb.r=Math.min(140,Math.max(18,orb.r*(e.deltaY<0?0.9:1.11)));place()},{passive:false});
  const ro=new ResizeObserver(size);ro.observe(host);size();place();
  const col=new THREE.Color(),tc=(T,lo,hi)=>{const t=Math.max(0,Math.min(1,(T-lo)/(hi-lo)));return col.setRGB((40+195*t)/255,(140-20*t)/255,(235-175*t)/255)};
  const mtx=new THREE.Matrix4(),zero=new THREE.Matrix4().makeScale(0,0,0);let lastPhase=null,frames=0;
  function update(d){const dp=lastPhase===null?0:Math.max(0,d.phase-lastPhase);lastPhase=d.phase;const hi=d.lim+8;
    d.ch.forEach((u,i)=>{const on=u.s==="run",c=STC[u.s];E.chLamp[i].material.emissive.setHex(c);E.chBody[i].material.color.setHex(on?0x2f9b62:u.s==="fail"?0xb5483c:u.s==="start"?0xc79a2a:0x8a94a3);
      E.chLab[i].set("CH-"+(i+1),d.st[u.s][0]+(u.s==="start"?" "+Math.max(0,u.on-d.t)+"초":""),hex(c));
      if(on)E.fan[i].rotation.y+=dp*0.9;if(d.pumps[i])E.imp[i].rotation.x+=dp*1.4;E.ppLamp[i].material.emissive.setHex(d.pumps[i]?0x22b463:0x596270)});
    tc(d.T,d.ts,hi);band.material.color.copy(col);band.material.emissive.copy(col);tankLab.set("축열 탱크",d.T.toFixed(1)+"℃","#9cc8ff");
    supLab.set("공급",d.T.toFixed(1)+"℃","#9cc8ff");retLab.set("환수",d.Tr.toFixed(1)+"℃","#ffc49a");pwrLab.set("전원",d.power?(d.gen?"발전기":"상용"):"상실",d.power?(d.gen?"#e0a020":"#7fd3a0"):"#ff7b6e");
    d.ba.forEach((ta,i)=>{const bad=ta>d.lim+6,warn=ta>d.lim+3,c=bad?0xe04a3a:warn?0xe0a020:0x2d8fe6;E.crahStrip[i].material.emissive.setHex(c);tc(ta,d.ts+5,d.lim+12);E.rackMat[i].emissive.copy(col);
      if(d.flow>0)E.crahFan[i].rotation.y+=dp*1.1;E.crahLab[i].set(Math.round(d.bq[i]*d.qb).toLocaleString()+" LPM","급기 "+ta.toFixed(1)+"℃",hex(c))});
    for(const p of pipes){const a=p.act(d),fl=a?Math.max(0,p.flow(d)):0;
      if(p.kind==="c")p.mat.color.setHex(a?0x3fae7a:0x4b5866);else{tc(p.kind==="s"?d.T:d.Tr,d.ts,hi);p.mat.color.copy(a?col:col.setHex(0x4b5866))}
      p.pm.color.copy(p.mat.color).lerp(new THREE.Color(0xffffff),0.6);p.off=(p.off+dp*fl*0.9/p.len)%1;
      for(let k=0;k<p.n;k++){if(!a||fl<=0){p.inst.setMatrixAt(k,zero);continue}const pt=p.path.getPointAt((k/p.n+p.off)%1);mtx.makeTranslation(pt.x,pt.y,pt.z);p.inst.setMatrixAt(k,mtx)}p.inst.instanceMatrix.needsUpdate=true}
    renderer.render(scene,cam);frames++;host.dataset.frames=frames}
  return{update,dispose(){ro.disconnect();renderer.dispose();if(cv.parentNode)cv.parentNode.removeChild(cv)},view(th,ph,r){orb.th=th;orb.ph=ph;orb.r=r;place()}};
}
window.TWIN3D={create};
})();
