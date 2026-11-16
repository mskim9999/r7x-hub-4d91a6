/* 도면·모델 뷰어 — 오픈소스 라이브러리를 인터넷에서 불러와 쓴다(계정·키 불필요).
   DXF: dxf-parser (MIT)  https://github.com/gdsestimating/dxf-parser
   IFC: web-ifc (MPL-2.0, That Open Company)  https://github.com/ThatOpen/engine_web-ifc
        three.js (MIT)  https://threejs.org
   샘플 모델: BSI (2020) "Duplex Apartment Test Files," buildingSMART International, CC BY 4.0, 원본 그대로
   인터넷이 없으면 라이브러리를 받지 못해 뷰어가 열리지 않는다. */
(function(){
const LIB={
  dxf:"https://esm.sh/dxf-parser@1.1.2",
  three:"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  ifc:"https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/web-ifc-api.js",
  ifcWasm:"https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/"
};
const SAMPLE_IFC="sample/Duplex_M_20111024_ROOMS_AND_SPACES.ifc";
let cleanup=null;
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ACI={1:"#ff3b30",2:"#ffe14d",3:"#35d04a",4:"#3ad6e8",5:"#4f7dff",6:"#e85bd8",7:"#f2f2f2",8:"#8a8f98",9:"#c3c7ce",30:"#ff9f2e",140:"#6fb7ff"};

/* ───────── DXF ───────── */
// 덕트 계산기(TOOLS.duct) 결과로 공조 덕트 계통도를 DXF(R12 ASCII)로 만든다.
function makeDxf(o){
  const E=[],L=[["M-DUCT-SA",4],["M-DUCT-RA",6],["M-EQUIP",1],["M-DIFF",3],["M-TEXT",2],["M-DIM",8],["A-GRID",9]];
  const line=(l,x1,y1,x2,y2)=>E.push(`0\nLINE\n8\n${l}\n10\n${x1}\n20\n${y1}\n11\n${x2}\n21\n${y2}`);
  const text=(l,x,y,h,t)=>E.push(`0\nTEXT\n8\n${l}\n10\n${x}\n20\n${y}\n40\n${h}\n1\n${t}`);
  const circ=(l,x,y,r)=>E.push(`0\nCIRCLE\n8\n${l}\n10\n${x}\n20\n${y}\n40\n${r}`);
  const rect=(l,x,y,w,h)=>{line(l,x,y,x+w,y);line(l,x+w,y,x+w,y+h);line(l,x+w,y+h,x,y+h);line(l,x,y+h,x,y)};
  const size=q=>{const r=TOOLS.duct.run({q,dp:o.dp,vmax:o.vmax,ar:2});return {wh:r.out[1][1],v:r.out[2][1]}};
  const n=o.n,fl=o.floors,qd=o.q,pitch=3600,fh=9000,x0=6000,rows=[];
  const total=qd*n*fl;
  // 공조기와 수직 주덕트
  rect("M-EQUIP",0,-2600,3600,2000);text("M-TEXT",300,-1500,420,"AHU-01");text("M-TEXT",300,-2200,300,`${total.toLocaleString()} CMH`);
  const riserX=4600;line("M-DUCT-SA",3600,-1300,riserX,-1300);line("M-DUCT-SA",3600,-1900,riserX+600,-1900);
  line("M-DUCT-SA",riserX,-1300,riserX,(fl-1)*fh+2100);line("M-DUCT-SA",riserX+600,-1900,riserX+600,(fl-1)*fh+1500);
  for(let f=0;f<fl;f++){
    const y=f*fh+1500,qf=qd*n,s0=size(qd*n*(fl-f));
    text("M-TEXT",riserX+800,y-900,300,`${s0.wh} (${(qd*n*(fl-f)).toLocaleString()} CMH)`);
    text("A-GRID",-200,y+2600,420,`${f+1}F`);line("A-GRID",-400,y-1200,x0+n*pitch+1500,y-1200);
    for(let i=0;i<n;i++){
      const xa=(i===0?riserX+600:x0+(i-1)*pitch),xb=x0+i*pitch,q=qd*(n-i),s=size(q);
      line("M-DUCT-SA",xa,y+600,xb,y+600);line("M-DUCT-SA",xa,y,xb,y);
      text("M-TEXT",(xa+xb)/2-900,y+800,260,s.wh);text("M-DIM",(xa+xb)/2-900,y-420,200,`${q.toLocaleString()} CMH  ${s.v} m/s`);
      // 분기와 디퓨저
      line("M-DUCT-SA",xb-150,y,xb-150,y-2200);line("M-DUCT-SA",xb+150,y,xb+150,y-2200);
      rect("M-DIFF",xb-450,y-3100,900,900);line("M-DIFF",xb-450,y-3100,xb+450,y-2200);line("M-DIFF",xb+450,y-3100,xb-450,y-2200);
      text("M-DIM",xb-520,y-3500,200,`SD ${qd.toLocaleString()}`);
      rows.push({f:f+1,i:i+1,q,size:s.wh,v:s.v});
    }
    line("M-DUCT-SA",x0+(n-1)*pitch,y+600,x0+(n-1)*pitch+300,y+600);line("M-DUCT-SA",x0+(n-1)*pitch+300,y+600,x0+(n-1)*pitch+300,y);line("M-DUCT-SA",x0+(n-1)*pitch+300,y,x0+(n-1)*pitch,y);
    // 환기
    line("M-DUCT-RA",riserX-900,y+2600,x0+n*pitch,y+2600);circ("M-DUCT-RA",x0+n*pitch+300,y+2600,300);text("M-DIM",riserX-800,y+2800,220,`RA ${qf.toLocaleString()} CMH`);
  }
  text("M-TEXT",0,(fl-1)*fh+6200,560,"공조 덕트 계통도 (시연용 자동 생성)");text("M-DIM",0,(fl-1)*fh+5500,300,`마찰손실 ${o.dp} Pa/m, 허용 풍속 ${o.vmax} m/s, 종횡비 2:1`);
  const dxf=`0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n${L.length}\n${L.map(l=>`0\nLAYER\n2\n${l[0]}\n70\n0\n62\n${l[1]}\n6\nCONTINUOUS`).join("\n")}\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n${E.join("\n")}\n0\nENDSEC\n0\nEOF\n`;
  return {dxf,rows,total};
}
function drawDxf(cv,doc,view,hidden){
  const ctx=cv.getContext("2d"),dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
  if(cv.width!==W*dpr||cv.height!==H*dpr){cv.width=W*dpr;cv.height=H*dpr}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle="#111418";ctx.fillRect(0,0,W,H);
  const X=x=>(x-view.x)*view.s+W/2,Y=y=>H/2-(y-view.y)*view.s,layers=(doc.tables&&doc.tables.layer&&doc.tables.layer.layers)||{};
  const col=e=>{const l=layers[e.layer]||{},ci=e.colorIndex&&e.colorIndex!==256?e.colorIndex:l.colorIndex;return ACI[ci]||"#d9dde3"};
  ctx.lineWidth=1;
  for(const e of doc.entities){ if(hidden[e.layer])continue; ctx.strokeStyle=ctx.fillStyle=col(e);
    if(e.type==="LINE"&&e.vertices){ctx.beginPath();ctx.moveTo(X(e.vertices[0].x),Y(e.vertices[0].y));ctx.lineTo(X(e.vertices[1].x),Y(e.vertices[1].y));ctx.stroke()}
    else if((e.type==="LWPOLYLINE"||e.type==="POLYLINE")&&e.vertices&&e.vertices.length){ctx.beginPath();e.vertices.forEach((v,i)=>i?ctx.lineTo(X(v.x),Y(v.y)):ctx.moveTo(X(v.x),Y(v.y)));if(e.shape)ctx.closePath();ctx.stroke()}
    else if(e.type==="CIRCLE"){ctx.beginPath();ctx.arc(X(e.center.x),Y(e.center.y),e.radius*view.s,0,Math.PI*2);ctx.stroke()}
    else if(e.type==="ARC"){ctx.beginPath();ctx.arc(X(e.center.x),Y(e.center.y),e.radius*view.s,-e.startAngle,-e.endAngle,true);ctx.stroke()}
    else if(e.type==="TEXT"||e.type==="MTEXT"){const p=e.startPoint||e.position,h=(e.textHeight||e.height||200)*view.s;if(p&&h>3){ctx.font=`${h}px "Malgun Gothic",sans-serif`;ctx.fillText(String(e.text||"").replace(/\\P/g," ").replace(/\{[^;]*;|\}/g,""),X(p.x),Y(p.y))}}
  }
}
function fit(doc,cv){let a=1e30,b=1e30,c=-1e30,d=-1e30;const add=(x,y)=>{if(isFinite(x)&&isFinite(y)){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}};
  for(const e of doc.entities){(e.vertices||[]).forEach(v=>add(v.x,v.y));if(e.center){add(e.center.x-e.radius,e.center.y-e.radius);add(e.center.x+e.radius,e.center.y+e.radius)}const p=e.startPoint||e.position;if(p)add(p.x,p.y)}
  if(a>c)return{x:0,y:0,s:1};return{x:(a+c)/2,y:(b+d)/2,s:Math.min(cv.clientWidth/(c-a||1),cv.clientHeight/(d-b||1))*0.9}}
async function mountDxf(root){
  const st={floors:2,n:5,q:1200,dp:1.0,vmax:10};
  root.innerHTML=`<div class="vw"><div class="vbar"><b>공조 덕트 계통도</b>
    <label>층수 <input type="number" id="vfl" min="1" max="4" value="${st.floors}"></label><label>층당 디퓨저 <input type="number" id="vn" min="2" max="8" value="${st.n}"></label><label>디퓨저 풍량 <input type="number" id="vq" step="100" value="${st.q}"> CMH</label>
    <span class="sp"></span><button class="btn" id="vfit">전체 보기</button><button class="btn" id="vdl">DXF 내려받기</button><label class="btn">DXF 열기<input type="file" id="vfile" accept=".dxf" hidden></label></div>
    <div class="vbody"><canvas id="vcv"></canvas><div class="vside"><h4>도면층</h4><div id="vlay"></div><h4>구간별 사이징</h4><div id="vrows" class="small"></div><p class="small muted" id="vmsg">라이브러리 불러오는 중…</p></div></div></div>`;
  const cv=root.querySelector("#vcv"),msg=root.querySelector("#vmsg");let doc=null,view={x:0,y:0,s:1},hidden={},cur=null,Parser=null;
  try{const m=await import(LIB.dxf);Parser=m.default||m.DxfParser||m}catch(e){msg.textContent="DXF 라이브러리를 불러오지 못했습니다. 인터넷 연결이 필요합니다.";return}
  const redraw=()=>doc&&drawDxf(cv,doc,view,hidden);
  const load=(txt,rows)=>{try{doc=new Parser().parseSync(txt)}catch(e){msg.textContent="DXF를 읽지 못했습니다: "+e.message;return}
    hidden={};view=fit(doc,cv);const ls=(doc.tables&&doc.tables.layer&&doc.tables.layer.layers)||{};
    root.querySelector("#vlay").innerHTML=Object.keys(ls).map(k=>`<label class="vl"><input type="checkbox" data-layer="${esc(k)}" checked><i style="background:${ACI[ls[k].colorIndex]||"#d9dde3"}"></i>${esc(k)}</label>`).join("")||`<span class="muted small">도면층 정보 없음</span>`;
    root.querySelector("#vrows").innerHTML=rows?`<table class="t"><tr><th>층</th><th>구간</th><th>풍량</th><th>크기</th><th>풍속</th></tr>${rows.map(r=>`<tr><td>${r.f}F</td><td>${r.i}</td><td class="num">${r.q.toLocaleString()}</td><td>${r.size}</td><td class="num">${r.v}</td></tr>`).join("")}</table>`:`<span class="muted">불러온 파일입니다.</span>`;
    msg.textContent=`개체 ${doc.entities.length}개 · 끌어서 이동, 휠로 확대`;redraw()};
  const gen=()=>{cur=makeDxf(st);load(cur.dxf,cur.rows)};
  gen();
  let drag=null;
  cv.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)});
  cv.addEventListener("pointermove",e=>{if(!drag)return;view.x-=(e.clientX-drag.x)/view.s;view.y+=(e.clientY-drag.y)/view.s;drag={x:e.clientX,y:e.clientY};redraw()});
  cv.addEventListener("pointerup",()=>drag=null);
  cv.addEventListener("wheel",e=>{e.preventDefault();const r=cv.getBoundingClientRect(),mx=e.clientX-r.left-r.width/2,my=r.height/2-(e.clientY-r.top),k=e.deltaY<0?1.2:1/1.2,wx=view.x+mx/view.s,wy=view.y+my/view.s;view.s*=k;view.x=wx-mx/view.s;view.y=wy-my/view.s;redraw()},{passive:false});
  root.addEventListener("change",e=>{const t=e.target;if(t.dataset.layer){hidden[t.dataset.layer]=!t.checked;redraw();e.stopPropagation()}
    else if(t.id==="vfl"||t.id==="vn"||t.id==="vq"){st.floors=Math.min(4,Math.max(1,+root.querySelector("#vfl").value||1));st.n=Math.min(8,Math.max(2,+root.querySelector("#vn").value||2));st.q=Math.max(100,+root.querySelector("#vq").value||100);gen();e.stopPropagation()}
    else if(t.id==="vfile"&&t.files[0]){t.files[0].text().then(x=>load(x,null));e.stopPropagation()}});
  root.querySelector("#vfit").onclick=()=>{view=fit(doc,cv);redraw()};
  root.querySelector("#vdl").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([cur.dxf],{type:"application/dxf"}));a.download="duct_schematic.dxf";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
  const ro=new ResizeObserver(redraw);ro.observe(cv);cleanup=()=>ro.disconnect();
}

/* ───────── IFC ───────── */
const CLS=[["IFCFLOWSEGMENT","덕트·배관","#3aa0e8"],["IFCFLOWFITTING","부속","#35c2a0"],["IFCFLOWTERMINAL","말단 기구","#f0a030"],["IFCFLOWCONTROLLER","밸브·댐퍼","#b56be0"],["IFCFLOWMOVINGDEVICE","팬·펌프","#e05050"],["IFCENERGYCONVERSIONDEVICE","열원·공조 장비","#e8704a"],["IFCDISTRIBUTIONCONTROLELEMENT","제어","#d0c040"]];
async function mountIfc(root){
  root.innerHTML=`<div class="vw"><div class="vbar"><b>기계설비 BIM 모델</b><span class="small muted">Duplex Apartment 기계설비(IFC 2x3, Revit MEP에서 내보낸 공개 샘플)</span><span class="sp"></span>
    <button class="btn" id="i3fit">전체 보기</button><label class="btn">IFC 열기<input type="file" id="i3file" accept=".ifc" hidden></label></div>
    <div class="vbody"><canvas id="i3cv"></canvas><div class="vside"><h4>분류</h4><div id="i3leg"></div><h4>선택한 객체</h4><div id="i3prop" class="small muted">모델에서 객체를 누르면 속성이 표시됩니다.</div><p class="small muted" id="i3msg">라이브러리 불러오는 중…</p></div></div>
    <p class="small muted" style="margin:6px 0 0">샘플 출처: BSI (2020) "Duplex Apartment Test Files," buildingSMART International, CC BY 4.0, 원본 그대로 · <a href="https://github.com/buildingsmart-community/Community-Sample-Test-Files" target="_blank" rel="noopener">저장소</a></p></div>`;
  const cv=root.querySelector("#i3cv"),msg=root.querySelector("#i3msg"),prop=root.querySelector("#i3prop");let THREE,WEBIFC,dead=false;
  try{[THREE,WEBIFC]=await Promise.all([import(LIB.three),import(LIB.ifc)])}catch(e){msg.textContent="3D 라이브러리를 불러오지 못했습니다. 인터넷 연결이 필요합니다.";return}
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x1b1f26);
  const cam=new THREE.PerspectiveCamera(45,1,0.05,2000);scene.add(new THREE.HemisphereLight(0xffffff,0x334455,1.1));const dl=new THREE.DirectionalLight(0xffffff,1.2);dl.position.set(5,10,7);scene.add(dl);
  let group=new THREE.Group();scene.add(group);
  const orb={t:new THREE.Vector3(),r:30,th:0.8,ph:1.0};
  const place=()=>{cam.position.set(orb.t.x+orb.r*Math.sin(orb.ph)*Math.sin(orb.th),orb.t.y+orb.r*Math.cos(orb.ph),orb.t.z+orb.r*Math.sin(orb.ph)*Math.cos(orb.th));cam.lookAt(orb.t)};
  const size=()=>{const w=cv.clientWidth,h=cv.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
  const fitAll=()=>{const b=new THREE.Box3().setFromObject(group);if(b.isEmpty())return;b.getCenter(orb.t);orb.r=b.getSize(new THREE.Vector3()).length()*0.75;place()};
  let raf;const loop=()=>{if(dead)return;renderer.render(scene,cam);raf=requestAnimationFrame(loop)};
  const api=new WEBIFC.IfcAPI();api.SetWasmPath(LIB.ifcWasm,true);
  try{await api.Init()}catch(e){msg.textContent="IFC 엔진을 초기화하지 못했습니다: "+e.message;return}
  let modelID=null,hidden={},sel=null;
  const typeName=id=>{try{return api.GetNameFromTypeCode(api.GetLineType(modelID,id))}catch(e){return""}};
  function loadModel(bytes){
    if(modelID!==null){try{api.CloseModel(modelID)}catch(e){}}
    scene.remove(group);group=new THREE.Group();scene.add(group);sel=null;
    modelID=api.OpenModel(bytes,{COORDINATE_TO_ORIGIN:true});const count={};let n=0;
    api.StreamAllMeshes(modelID,m=>{const id=m.expressID,tn=String(typeName(id)).toUpperCase();if(tn==="IFCSPACE"||tn==="IFCOPENINGELEMENT")return;
      const c=CLS.find(x=>x[0]===tn),key=c?c[0]:"기타";count[key]=(count[key]||0)+1;
      for(let i=0;i<m.geometries.size();i++){const pg=m.geometries.get(i),g=api.GetGeometry(modelID,pg.geometryExpressID),v=api.GetVertexArray(g.GetVertexData(),g.GetVertexDataSize()),ix=api.GetIndexArray(g.GetIndexData(),g.GetIndexDataSize());
        const pos=new Float32Array(v.length/2),nor=new Float32Array(v.length/2);for(let k=0,j=0;k<v.length;k+=6,j+=3){pos[j]=v[k];pos[j+1]=v[k+1];pos[j+2]=v[k+2];nor[j]=v[k+3];nor[j+1]=v[k+4];nor[j+2]=v[k+5]}
        const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("normal",new THREE.BufferAttribute(nor,3));geo.setIndex(new THREE.BufferAttribute(new Uint32Array(ix),1));
        const mat=new THREE.MeshLambertMaterial({color:c?c[2]:"#8d96a3",side:THREE.DoubleSide,transparent:!c,opacity:c?1:0.35});
        const mesh=new THREE.Mesh(geo,mat);mesh.matrixAutoUpdate=false;mesh.matrix.fromArray(pg.flatTransformation);mesh.userData={id,key,base:mat.color.getHex()};group.add(mesh);g.delete&&g.delete()}
      n++});
    root.querySelector("#i3leg").innerHTML=[...CLS.map(c=>[c[0],c[1],c[2]]),["기타","건축·기타","#8d96a3"]].filter(c=>count[c[0]]).map(c=>`<label class="vl"><input type="checkbox" data-cls="${c[0]}" checked><i style="background:${c[2]}"></i>${c[1]} <span class="muted">${count[c[0]]}</span></label>`).join("");
    hidden={};fitAll();msg.textContent=`객체 ${n}개 · 끌어서 회전, 오른쪽 끌기로 이동, 휠로 확대`;root.dataset.ifcObjects=n}
  async function showProps(id){const L=api.GetLine(modelID,id),val=x=>x&&x.value!==undefined?x.value:"";let rows=[["분류",typeName(id)],["이름",val(L.Name)],["유형",val(L.ObjectType)],["태그",val(L.Tag)],["GlobalId",val(L.GlobalId)],["Express ID",id]];
    try{const ps=await api.properties.getPropertySets(modelID,id,true);for(const p of ps||[]){for(const h of (p.HasProperties||[]).slice(0,12)){if(h&&h.Name&&h.NominalValue)rows.push([h.Name.value,h.NominalValue.value])}if(rows.length>26)break}}catch(e){}
    prop.classList.remove("muted");prop.innerHTML=`<table class="t">${rows.filter(r=>r[1]!==""&&r[1]!==undefined).map(r=>`<tr><td class="muted" style="width:96px">${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</table>`;root.dataset.ifcPicked=id}
  size();place();loop();
  try{msg.textContent="샘플 모델 불러오는 중…(약 9MB)";const res=await fetch(SAMPLE_IFC);if(!res.ok)throw new Error(res.status);loadModel(new Uint8Array(await res.arrayBuffer()))}
  catch(e){msg.textContent="샘플 모델을 자동으로 불러오지 못했습니다(파일을 더블클릭해 연 경우). 'IFC 열기'로 sample 폴더의 파일을 선택하세요."}
  let drag=null,moved=0;const ray=new THREE.Raycaster();
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,b:e.button};moved=0;cv.setPointerCapture(e.pointerId)});
  cv.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;
    if(drag.b===2||e.shiftKey){const right=new THREE.Vector3().setFromMatrixColumn(cam.matrix,0),up=new THREE.Vector3().setFromMatrixColumn(cam.matrix,1),k=orb.r*0.0015;orb.t.addScaledVector(right,-dx*k).addScaledVector(up,dy*k)}
    else{orb.th-=dx*0.006;orb.ph=Math.min(3.05,Math.max(0.08,orb.ph-dy*0.006))}place()});
  cv.addEventListener("pointerup",e=>{if(drag&&moved<4&&modelID!==null){const r=cv.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)),cam);
      const hit=ray.intersectObjects(group.children.filter(m=>m.visible),false)[0];if(sel)sel.material.color.setHex(sel.userData.base);sel=null;if(hit){sel=hit.object;sel.material.color.setHex(0xffe14d);showProps(sel.userData.id)}}drag=null});
  cv.addEventListener("wheel",e=>{e.preventDefault();orb.r*=e.deltaY<0?0.87:1.15;place()},{passive:false});
  root.addEventListener("change",e=>{const t=e.target;if(t.dataset.cls){hidden[t.dataset.cls]=!t.checked;group.children.forEach(m=>m.visible=!hidden[m.userData.key]);e.stopPropagation()}
    else if(t.id==="i3file"&&t.files[0]){msg.textContent="모델 읽는 중…";t.files[0].arrayBuffer().then(b=>loadModel(new Uint8Array(b)));e.stopPropagation()}});
  root.querySelector("#i3fit").onclick=fitAll;
  const ro=new ResizeObserver(size);ro.observe(cv);
  cleanup=()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();try{if(modelID!==null)api.CloseModel(modelID)}catch(e){}renderer.dispose()};
}
window.VIEWERS={mount(kind,root){this.unmount();(kind==="ifc"?mountIfc:mountDxf)(root).catch(e=>{root.insertAdjacentHTML("beforeend",`<p class="small" style="color:#a3322a">뷰어 오류: ${esc(e.message)}</p>`)})},unmount(){if(cleanup){try{cleanup()}catch(e){}cleanup=null}}};
})();
