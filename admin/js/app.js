/* HDX 재구성 v2 — 화면 로직. 해시 라우팅, 빌드 없음, 파일을 더블클릭해도 동작. */
(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const e=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const store={get(k,d){try{const v=localStorage.getItem("hdxv2."+k);return v?JSON.parse(v):d}catch(_){return d}},set(k,v){try{localStorage.setItem("hdxv2."+k,JSON.stringify(v))}catch(_){}}};
const GN={A:"실제 화면",B:"공식 논문·홈페이지",C:"보도·발표·구축사 공개",D:"지원자 재구성"};
const grade=(g,t)=>`<span class="grade ${g}" title="${GN[g]}"><b><span>${g}</span></b>${e(t||GN[g])}</span>`;
const fn=id=>{const r=BENCH.refs.find(x=>x[0]===id);return r?`<sup class="fn" title="${e(r[1])}">[${id}]</sup>`:""};
const lv=n=>`<span class="lv">${[0,1,2].map(i=>`<i class="${i<n?"f":""}"></i>`).join("")}</span>`;

/* ── 데이터 정리 ── */
const TASKS=HDP.tasks.map(t=>({disc:t[0],ph:t[1],id:t[2],name:t[3],role:t[4],gate:t[5],outs:t[6],checks:t[7],forms:t[8],refs:t[9],tools:t[10],tags:t[11],ideas:t[12]}));
const PJ=HDB.projects.map(p=>({id:p[0],name:p[1],type:p[2],year:p[3],region:p[4],area:p[5],floors:p[6],plant:p[7],disc:p[8],stage:p[9],spec:p[10],cert:p[11],kw:p[12]}));
const DOCS=[];PJ.forEach(p=>HDB.docTemplate.forEach((d,i)=>{if(!p.disc.includes(d[1]))return;const st=["계획설계","중간설계","실시설계","납품","시공","준공"],cur={"계획설계":0,"중간설계":1,"실시설계":2,"시공":4,"준공":5}[p.stage];
  if(st.indexOf(d[2])>cur)return;DOCS.push({id:`${p.id}-${String(i+1).padStart(2,"0")}`,pj:p,type:d[0],disc:d[1],stage:d[2],wbs:d[3],rev:"R"+((p.year+i)%3),ext:/도$/.test(d[0])?"DWG":/계산|일람|내역|집계/.test(d[0])?"XLSX":"HWP"})}));
const ALLTOOLS=[...HDT.tools,...HDT.proposed];
const toolName=id=>{const t=ALLTOOLS.find(x=>x.id===id);if(t)return t.pub==="미공개"||t.pub==="제안"?t.mine:t.pub;const x=HDT.ext.find(x=>x.id===id);return x?x.name:id};
let cur=store.get("pj","PJ-2603");
const curPj=()=>PJ.find(p=>p.id===cur)||PJ[0];

/* ── 유사 프로젝트: 왜 비슷한지를 항목별로 계산 ── */
function similar(base,tags){const words=s=>s.split(/[+·()\s,]+/).filter(x=>x.length>1);
  return PJ.filter(p=>p.id!==base.id).map(p=>{const why=[];let s=0;
    const add=(ok,pt,label)=>{why.push([ok,label]);if(ok)s+=pt};
    add(p.type===base.type,40,"시설 유형");
    const pw=words(base.plant),ov=words(p.plant).filter(w=>pw.includes(w));add(ov.length>0,22,"열원 방식"+(ov.length?`(${ov.slice(0,2).join(", ")})`:""));
    const r=p.area/base.area;add(r>0.5&&r<2,15,"규모");
    const kw=p.kw.filter(k=>base.kw.includes(k));add(kw.length>0,13,"설계 특징"+(kw.length?`(${kw.join(", ")})`:""));
    add(p.region===base.region,5,"지역");add(p.cert.some(c=>base.cert.some(b=>b.slice(0,3)===c.slice(0,3))),5,"인증");
    return{p,s,why}}).sort((a,b)=>b.s-a.s)}

/* ── 메뉴 ── */
const MODS=[["hub","HUB","허브"],["hdp","HDP","디지털 프로세스"],["hdb","HDB","Data Platform"],["hdt","HDT","디지털 툴킷"],null,["bench","벤치마킹",""],["insight","함의·제언",""],["evidence","근거",""],["source","출처",""]];
const SIDE={
 hub:[["",[["hub","HDX 허브"]]]],
 hdp:[["HDP · Engineering Process",[["hdp/process","Process 관리","단위 업무"],["hdp/map","Workflow Map 관리","분야별 흐름"],["hdp/biz","Workflow Biz 관리","Biz-Code"]]]],
 hdb:[["HDB · 전사",[["hdb/dash","Dashboard"],["hdb/maplist","Workflow Map List 관리"],["hdb/projects","프로젝트 관리"],["hdb/search","통합문서/DB검색"],["hdb/toolkits","Toolkit List 관리"],["hdb/docs","통합문서 관리"],["hdb/forms","양식 표준"],["hdb/wbs","WBS 표준"],["hdb/std","기준 표준 정보","디지털 도서관"],["hdb/org","인사/조직정보"]]],
      ["HDB · 프로젝트",[["hdb/project","프로젝트 개요 정보"],["hdb/pwbs","프로젝트 WBS"],["hdb/work","업무/산출물관리","HEAD Kits"],["hdb/pdocs","프로젝트 문서"]]],
      ["논문 그림 밖",[["hdb/equip","장비 DB","재구성"],["hdb/link","산출물 데이터 연동","재구성"]]]],
 hdt:[["HDT · Engineering Toolkits",[["hdt/excel","Excel Toolkit"],["hdt/ext","외부 프로그램","도구 MAP"],["hdt/list","자체 개발 프로그램"],["hdt/extdb","외부 시스템 및 외부 DB"]]],
      ["외부 프로그램 유사 화면",[["hdt/view/dxf","도면 뷰어(DXF)","재구성"],["hdt/view/ifc","모델 뷰어(IFC)","재구성"],["hdt/twin","디지털 트윈 커미셔닝","제안"]]]],
 bench:[["벤치마킹",[["bench","국내외 플랫폼"],["bench/try","직접 가입해 볼 곳"],["bench/compare","HDX와 비교"],["bench/arch","플랫폼 구성도","5개 비교"]]]],
 insight:[["함의",[["insight","문제의식 → 제언"]]]],
 evidence:[["근거",[["evidence","근거 등급과 출처"]]]],
 source:[["출처",[["source","요약"],["source/hdp","업무 프로세스"],["source/hdb","데이터베이스"],["source/hdt","설계 도구"],["source/etc","뷰어·화면·기타"]]]]
};
function shell(route){const m=route.split("/")[0];
  $("#mods").innerHTML=MODS.map(x=>x?`<a href="#/${x[0]}" class="${x[0]===m?"on":""}">${x[1]}${x[2]?` <i>${x[2]}</i>`:""}</a>`:`<span class="sep"></span>`).join("");
  $("#subnav").innerHTML=(SIDE[m]||[]).flatMap(g=>g[1]).filter((x,i,arr)=>arr.length>1).map(x=>`<a href="#/${x[0]}" class="${route===x[0]||(route.startsWith(x[0]+"/")&&x[0].includes("/"))?"on":""}">${x[1]}</a>`).join("");
  $("#side").innerHTML=(SIDE[m]||[]).map(g=>(g[0]?`<h5>${g[0]}</h5>`:"")+g[1].map(a=>`<a href="#/${a[0]}" class="${route===a[0]||(route.startsWith(a[0]+"/")&&a[0].includes("/"))?"on":""}">${a[1]}${a[2]?`<em>${a[2]}</em>`:""}</a>`).join("")).join("");
  ["#mods a.on","#subnav a.on"].forEach(q=>{const n=$(q),b=n&&n.parentNode;if(b&&b.scrollWidth>b.clientWidth)b.scrollLeft=n.offsetLeft-b.offsetLeft-(b.clientWidth-n.offsetWidth)/2})}
const head=(t,p,g,gt)=>`<div class="crumb">${crumb()}</div><div class="ph"><div><h1>${t}</h1>${p?`<p>${p}</p>`:""}</div><span style="display:flex;gap:10px;align-items:center">${srcLink()}${g?grade(g,gt):""}</span></div>`;
function srcLink(){const m=(location.hash||"#/hub").slice(2).split("/")[0],t={hdp:"source/hdp",hdb:"source/hdb",hdt:"source/hdt",hub:"source",bench:"source/etc",insight:"source",evidence:"source"}[m];return t?`<a class="btn" style="padding:2px 9px;font-size:12px" data-go="${t}">출처</a>`:""}
function crumb(){const r=(location.hash||"#/hub").slice(2),m=r.split("/")[0],M=MODS.find(x=>x&&x[0]===m),it=(SIDE[m]||[]).flatMap(g=>g[1]).filter(x=>r===x[0]||r.startsWith(x[0]+"/")).sort((x,y)=>y[0].length-x[0].length)[0];return ["HOME",M?M[1]:"",it&&it[0]!==m?it[1]:""].filter(Boolean).join(" > ")}

/* ══════════ HUB ══════════ */
function vHub(){const p=curPj(),my=TASKS.filter(t=>t.gate).slice(0,5);
 return `<div class="hero"><div class="ring"></div><h1>HDX Hub</h1><p>표준 프로세스 / Database / Tool / 기타 환경(CAD 등)을 연결한 통합 설계 환경 ${fn("W1")}</p></div>
 ${figMap()}
 <div class="tri">
  <div class="mod" data-go="hdp/map"><div class="hd"><b>HDP</b><span>( Engineering Process ) 디지털 프로세스</span></div><div class="bd"><ul class="c"><li>기계·전기·통신·소방 표준 프로세스 ${fn("P2")}</li><li>PM·CM, 커미셔닝으로 확장 ${fn("N2")}</li><li>업무 ${TASKS.length}개, 체크사항 ${TASKS.reduce((a,t)=>a+t.checks.length,0)}개(재구성)</li></ul></div></div>
  <div class="mod" data-go="hdb/search"><div class="hd"><b>HDB</b><span>( Engineering Database ) Data Platform</span></div><div class="bd"><ul class="c"><li>기술·경험·산출물의 DB화 ${fn("W1")}</li><li>누적 4,300건+ 프로젝트 자료 ${fn("N1")}</li><li>조건 검색과 유사 프로젝트 참고 ${fn("R1")}</li></ul></div></div>
  <div class="mod" data-go="hdb/toolkits"><div class="hd"><b>HDT</b><span>( Engineering Toolkits ) 디지털 툴킷</span></div><div class="bd"><ul class="c"><li>디지털 설계지원도구 14종 ${fn("N1")}</li><li>자체 개발, Excel Toolkit, 외부 프로그램 ${fn("P2")}</li><li>이 사이트에서 실행되는 계산기 ${Object.keys(TOOLS).length}종</li></ul></div></div>
 </div>
 <div class="grid g2 mt">
  <div class="card"><h3>내 업무 <small>${e(p.name)} · ${e(p.stage)}</small></h3>
   ${my.map(t=>`<div class="li"><div><a data-go="hdp/map/${t.disc}/${t.id}"><b>${t.id}</b> ${e(t.name)}</a><small>${HDP.disciplines.find(d=>d.id===t.disc).name} · ${e(t.role)}</small></div><span class="tag ${t.gate?"r":"k"}">${t.gate?"승인 게이트":"진행"}</span></div>`).join("")}
   <p class="small muted" style="margin:8px 0 0">시연용 목록. 상단의 작업 프로젝트를 바꾸면 유사 프로젝트 추천이 달라집니다.</p>
   <h3 class="mt">처리할 문서 <small>화면 형태는 같은 구축사의 다른 고객 화면에서 유추 ${fn("R2")}</small></h3><div class="tw"><table class="t"><tr><th>양식명</th><th>문서 제목</th><th>상태</th><th>기한</th></tr>
   ${[["설계 검토서","M-401 성과품 자체 검토","검토 요청","D-3"],["부하계산서 표지·요약","M-201 부하계산서 R2","승인 대기","D-5"],["IST 진입 체크리스트","X-403 IST 진입 판정","작성 중","D-9"]].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td><span class="tag o">${r[2]}</span></td><td class="num">${r[3]}</td></tr>`).join("")}</table></div></div>
  <div class="card"><h3>회사가 밝힌 기대효과 ${grade("C","목표값, 실측 아님")}</h3>
   <div class="grid g4">${[["40%","설계 시간 단축"],["70%","휴먼 에러 감소"],["80%","검색 시간 단축"],["50%","1인 처리 건수 향상"]].map(k=>`<div class="kpi"><b class="num">${k[0]}</b><span>${k[1]}</span></div>`).join("")}</div>
   <div class="note o mt">공개된 수치는 도입 기대효과입니다 ${fn("N1")}. 실제 사용 기록으로 바꿔 보여 주는 것이 첫 번째 제언입니다. <a data-go="insight">함의·제언 보기</a></div></div>
 </div>
 <div class="card mt"><h3>연혁 ${grade("C")}</h3><div class="lin">
  ${[["2018","DC 공조 설계 지원 DB 연구","P3"],["2024-12","DX 구축 방안 논문, 플랫폼 구축 착수","P1"],["2025-01","DX추진실 신설",""],["2025-10","플랫폼 구축 완료",""],["2026-01","HDX Hub 공식 론칭",""],["2026","RAG·전사 AI 도입, Cx·PM 확장","N2"],["2027","전사 내재화, AI 인프라","N1"],["2028~30","AI 어시스턴트·지식그래프·디지털트윈","N1"]].map(x=>`<div class="n"><b>${x[0]}</b>${x[1]} ${x[2]?fn(x[2]):""}</div>`).join("")}</div></div>`}

/* ══════════ HDP ══════════ */
function phasesOf(d){return d==="pmcm"?HDP.pmPhases:d==="cx"?HDP.cxPhases:HDP.designPhases}
function vMap(disc,tid){disc=disc||"mech";const D=HDP.disciplines.find(d=>d.id===disc),ts=TASKS.filter(t=>t.disc===disc),sel=ts.find(t=>t.id===tid)||ts[0];
 return head("Workflow Map 관리",`분야별 표준 업무 흐름. 업무 선택 시 체크사항·양식·기준·도구·유사 프로젝트 표시. 체크사항은 직접 추가 가능`,D.grade,D.note)+
 `<div class="disc">${HDP.disciplines.map(d=>`<button class="${d.id===disc?"on":""}" data-go="hdp/map/${d.id}">${d.name} <span class="small" style="opacity:.7">${d.sub}</span></button>`).join("")}</div>
 <div class="card"><div class="flow">${phasesOf(disc).map(p=>`<div class="phase"><div class="ph2">${p.name}<small>${p.sub}</small></div>${ts.filter(t=>t.ph===p.id).map(t=>`<div class="task ${t.gate?"gate":""} ${t.id===sel.id?"on":""}" data-go="hdp/map/${disc}/${t.id}"><b>${e(t.name)}</b><div class="m"><i>${t.id}</i><i>체크 ${t.checks.length}</i><i>도구 ${t.tools.length}</i>${t.gate?`<i style="color:#b3225a">승인 게이트</i>`:""}</div></div>`).join("")}</div>`).join("")}</div>
 <p class="small muted" style="margin:8px 0 0">분야와 단계 구분은 논문·보도에 근거(${D.grade}등급). 각 업무의 이름과 내용은 공개 기준과 일반 실무로 채운 재구성(D등급)이며 하이멕 내부 표준이 아닙니다.</p></div>
 <div class="mt" id="taskDetail">${taskDetail(sel)}</div>`}
function taskDetail(t){const done=store.get("chk."+t.id,[]),p=curPj(),sims=similar(p,t.tags).slice(0,3),pct=t.checks.length?Math.round(done.length/t.checks.length*100):0;
 const docs=DOCS.filter(d=>d.wbs===t.id&&d.pj.id!==p.id&&sims.some(s=>s.p.id===d.pj.id)).slice(0,4);
 return `<div class="card" style="border-left:4px solid var(--blue)"><h3>${t.id} ${e(t.name)} <small>${e(t.role)} · 산출물 ${t.outs.map(o=>`<span class="tag">${e(o)}</span>`).join("")}</small></h3>
 <div class="detail">
  <div><h4 class="small" style="margin-bottom:6px">체크사항 <span class="muted">${done.length}/${t.checks.length}</span></h4><div class="prog"><i style="width:${pct}%"></i></div>
   ${t.checks.map((c,i)=>`<label class="chk ${done.includes(i)?"done":""}"><input type="checkbox" data-chk="${t.id}" data-i="${i}" ${done.includes(i)?"checked":""}><span>${e(c)}${i>=t.nb?` <a class="small" data-act="delchk" data-id="${t.id}" data-i="${i}">삭제</a>`:""}</span></label>`).join("")}
   <div class="filters" style="margin-top:6px">${inp("xchkIn","체크사항 추가",210)}<button class="btn" data-act="addchk" data-id="${t.id}">추가</button></div>
   ${SRC.task&&SRC.task[t.id]?`<div class="mt small"><b>근거 문헌</b> <span class="tag ${SRC.task[t.id][2]==="확인"?"g":"o"}">${SRC.task[t.id][2]==="확인"?"확인":SRC.task[t.id][2]==="일부"?"일부 근거":"근거 없음"}</span><br>${e(SRC.task[t.id][0])} <a data-go="source/hdp">자세히</a></div>`:""}
   ${t.gate?`<div class="note mt small">승인 게이트: 체크사항을 모두 마치고 검토자 승인을 받아야 다음 단계 산출물을 등록할 수 있다는 가정.</div>`:""}
   ${t.ideas.length?`<div class="mt small"><b>AI 공모전 수상작 중 이 업무와 닿는 것</b> ${fn("N3")}<br>${t.ideas.map(x=>`<span class="tag v">${e(x)}</span>`).join("")}</div>`:""}</div>
  <div><h4 class="small" style="margin-bottom:6px">참고 양식 <span class="muted">HDB 양식 표준</span></h4>
   ${t.forms.map(x=>`<div class="li"><div>${e(x)}<small>${/시트|표|집계|대장/.test(x)?"Excel 양식":"한글 양식"} · DB 연계</small></div><a data-go="hdb/forms">열기</a></div>`).join("")||`<p class="muted small">등록된 양식 없음</p>`}
   <h4 class="small" style="margin:12px 0 6px">기준·참고 자료 <span class="muted">HDB 기준 표준정보</span></h4>
   ${t.refs.map(x=>`<div class="li"><div>${e(x)}</div><a data-go="hdb/std">보기</a></div>`).join("")||`<p class="muted small">–</p>`}
   <h4 class="small" style="margin:12px 0 6px">연결 도구 <span class="muted">HDT</span></h4>
   ${t.tools.map(id=>{const tt=ALLTOOLS.find(x=>x.id===id);return `<div class="li"><div>${e(toolName(id))}<small>${id.startsWith("T-")?(tt&&tt.run?"이 화면에서 실행":"이름만 공개"):"외부 프로그램"}</small></div><a data-go="${tt&&tt.run?"hdt/run/"+tt.run:id.startsWith("X-")?"hdt/ext":"hdt/list"}">${tt&&tt.run?"실행":"보기"}</a></div>`}).join("")}</div>
  <div><h4 class="small" style="margin-bottom:6px">유사 프로젝트 <span class="muted">기준: ${e(p.name)}</span></h4>
   ${sims.map(s=>`<div class="li" style="display:block"><a data-go="hdb/project/${s.p.id}"><b>${e(s.p.name)}</b></a> <span class="muted small">${s.p.year} · ${e(s.p.plant)}</span>
     <div class="sim"><div class="bar"><i style="width:${s.s}%"></i></div><b class="num small">${s.s}</b></div>
     <div class="why">${s.why.map(w=>`<i class="${w[0]?"":"x"}">${e(w[1])}</i>`).join("")}</div></div>`).join("")}
   <h4 class="small" style="margin:12px 0 6px">그 프로젝트의 같은 업무 산출물</h4>
   ${docs.map(d=>`<div class="li"><div>${e(d.type)} <span class="tag k">${d.ext}</span><small>${e(d.pj.name)} · ${d.rev}</small></div><a data-go="hdb/project/${d.pj.id}">열기</a></div>`).join("")||`<p class="muted small">유사 프로젝트에 이 업무(${t.id})로 등록된 산출물이 없습니다.</p>`}</div>
 </div></div>`}
let pq={text:"",disc:"",kind:""};
function vProcess(){const hit=TASKS.filter(t=>{const d=HDP.disciplines.find(x=>x.id===t.disc),p=phasesOf(t.disc).find(x=>x.id===t.ph);return(!pq.disc||t.disc===pq.disc)&&(!pq.kind||(pq.kind==="추가")===!!t.user||(pq.kind==="게이트"&&t.gate))&&(pq.kind!=="게이트"||t.gate)&&(!pq.text||[t.id,t.name,t.role,d.name,p?p.name:"",t.outs.join(" "),t.tools.map(toolName).join(" "),t.checks.join(" ")].join(" ").toLowerCase().includes(pq.text.toLowerCase()))});
 const so=(k,arr,ph)=>`<select data-pq="${k}"><option value="">${ph}</option>${arr.map(x=>`<option value="${x[0]}" ${pq[k]===x[0]?"selected":""}>${x[1]}</option>`).join("")}</select>`;
 return head("Process 관리","단위 업무(Process) 전체 목록. Workflow Map과 WBS 표준이 이 목록에서 만들어진다","B","이름은 논문 Fig.1, 업무 내용은 재구성")+
 `<div class="card"><div class="filters"><input type="search" id="pqtext" placeholder="WBS 번호, 업무 이름, 담당, 산출물, 도구, 체크사항 (예: 부하, TAB, M-201)" value="${e(pq.text)}">${so("disc",HDP.disciplines.map(d=>[d.id,d.name]),"분야 전체")}${so("kind",[["표준","표준"],["추가","직접 추가"],["게이트","승인 게이트"]],"구분 전체")}<button class="btn" data-act="pqreset">초기화</button><span class="sp"></span><button class="btn p" data-go="hdp/process/new">Process 추가</button></div>
  <p class="small muted" style="margin:10px 0 0">${hit.length}건 / 전체 ${TASKS.length}건</p></div>
 <div class="card mt tw"><table class="t"><tr><th>WBS</th><th>분야</th><th>단계</th><th>업무</th><th>담당</th><th>산출물</th><th>체크</th><th>도구</th><th>구분</th></tr>
 ${hit.map(t=>{const d=HDP.disciplines.find(x=>x.id===t.disc),p=phasesOf(t.disc).find(x=>x.id===t.ph);return `<tr class="click" data-go="hdp/map/${t.disc}/${t.id}"><td><b>${t.id}</b></td><td>${d.name}</td><td>${p?p.name:"–"}</td><td>${e(t.name)} ${t.gate?`<span class="tag r">게이트</span>`:""}</td><td>${e(t.role)}</td><td>${t.outs.map(e).join(", ")}</td><td class="num">${t.checks.length}</td><td>${t.tools.map(x=>`<span class="tag">${e(toolName(x))}</span>`).join("")}</td><td>${t.user?`<button class="btn" data-act="deltask" data-id="${t.id}">삭제</button>`:`<span class="small muted">표준</span>`}</td></tr>`}).join("")||`<tr><td colspan="9" class="muted" style="text-align:center;padding:18px">조건에 맞는 Process가 없습니다.</td></tr>`}</table></div>`}
function vProcessNew(){const ph=phasesOf(pf.disc),us=TASKS.filter(t=>t.user);
 return head("Process 추가","새 단위 업무를 등록. 등록하면 Process 목록, Workflow Map, WBS 표준에 함께 나타난다","D","편집 기능은 재구성")+
 `<div class="card form1"><h3>입력</h3>
  <div class="fl"><label>분야</label><select id="ptDisc" data-act="pfdisc">${HDP.disciplines.map(d=>`<option value="${d.id}" ${d.id===pf.disc?"selected":""}>${d.name}</option>`).join("")}</select></div>
  <div class="fl"><label>단계</label>${selOpt("ptPh",ph.map(x=>[x.id,x.name]),ph[0].id)}</div>
  <div class="fl"><label>업무 이름</label><input id="ptName" placeholder="예: 냉각탑 보급수량 검토"></div>
  <div class="fl"><label>담당 역할</label><input id="ptRole" placeholder="예: 설계 담당"></div>
  <div class="fl"><label>산출물</label><input id="ptOut" placeholder="쉼표로 구분 (예: 검토서, 계산서)"></div>
  <div class="fl"><label></label><span><button class="btn p" data-act="addtask">등록</button> <button class="btn" data-go="hdp/process">목록으로</button></span></div>${edNote}</div>
 <div class="card mt tw"><h3>직접 추가한 Process <small>${us.length}건</small></h3>${us.length?`<table class="t"><tr><th>WBS</th><th>분야</th><th>업무</th><th>담당</th><th>산출물</th><th></th></tr>${us.map(t=>`<tr><td><a data-go="hdp/map/${t.disc}/${t.id}"><b>${t.id}</b></a></td><td>${HDP.disciplines.find(x=>x.id===t.disc).name}</td><td>${e(t.name)}</td><td>${e(t.role)}</td><td>${t.outs.map(e).join(", ")}</td><td><button class="btn" data-act="deltask" data-id="${t.id}">삭제</button></td></tr>`).join("")}</table>`:`<p class="muted small">아직 없습니다.</p>`}
  <p style="margin:10px 0 0"><button class="btn" data-act="resetedit">편집 내용 전체 초기화</button> <span class="small muted">Process, 체크사항, Toolkit, 문서, Biz에 직접 추가한 내용을 모두 지웁니다.</span></p></div>`}
function vBiz(){const rows=[["MDS · EDS · CDS · FDS","설계","기계·전기·통신·소방","계획설계 → 중간설계 → 실시설계 → 납품 → 사후설계관리","B","논문에 4개 분야 TFT 표준화 명시","mech"],["PCM","PM·CM","사업관리, 감리","착수 → 설계단계 관리 → 발주 → 시공 관리 → 준공","C","2026년 확장 계획으로 보도","pmcm"],["CXT","커미셔닝·TAB","Cx, TAB, IST","계획 → 설계 검토 → 설치 검증 → 성능 시험 → 인계","C","2026년 확장 계획으로 보도. 공모전 수상작 다수가 이 영역","cx"],["ECO","에너지·친환경 컨설팅","인증, 에너지 해석","예비 검토 → 해석 → 인증 서류 → 사후 검증","D","사업 분야는 공개, HDX 적용 여부 미확인",""]],ub=store.get("u.biz",[]);
 return head("Workflow Biz 관리","비즈니스(Biz-Code)별로 Workflow Map을 묶는 단위","B","Biz-Code 개념은 2024 논문 Fig.1")+
 `<div class="note b">2024년 논문 그림은 HDP 아래에 <b>Biz-Code</b>(MDS, MCN …)를 두고 코드마다 Process 1~4를 달았습니다. MDS·MCN의 뜻은 논문에 없습니다. 아래 코드는 같은 형식을 본떠 지원자가 붙인 가칭이며, M을 기계, DS를 설계로 읽은 것도 추정입니다.</div>
 <div class="grid g2 mt">${rows.map(r=>`<div class="card"><h3>${r[1]} <small>${r[2]}</small> ${grade(r[4],r[5])}</h3><p class="small" style="margin:0 0 8px">Biz-Code(가칭) <b>${r[0]}</b></p><div class="lin">${r[3].split(" → ").map(x=>`<div class="n"><b>${x}</b></div>`).join("")}</div>${r[6]?`<button class="btn mt" data-go="hdp/map/${r[6]}">Workflow Map 열기</button>`:`<p class="small muted">이 재구성본에서는 다루지 않음</p>`}</div>`).join("")}
 ${ub.map((b,i)=>`<div class="card"><h3>${e(b.name)} <span class="tag o">직접 추가</span></h3><p class="small" style="margin:0 0 8px">Biz-Code <b>${e(b.code)}</b></p><div class="lin">${(b.flow||"단계 미지정").split(/→|>|,/).map(x=>`<div class="n"><b>${e(x.trim())}</b></div>`).join("")}</div><button class="btn mt" data-act="delbiz" data-i="${i}">삭제</button></div>`).join("")}</div>
 <div class="card mt"><h3>Biz 추가</h3><div class="filters">${inp("bzCode","Biz-Code",90)}${inp("bzName","비즈니스 이름",170)}${inp("bzFlow","단계(쉼표로 구분)",260)}<button class="btn p" data-act="addbiz">추가</button></div>${edNote}</div>
 <div class="note b mt">설계에서 PM·CM, 커미셔닝으로 프로세스를 넓힌다는 것은 사업 범위를 설계 뒤 단계로 넓힌다는 뜻으로 읽힙니다. 그러면 설계값과 시험 실측값이 같은 플랫폼에 쌓이고, 그 위에서 '설계값으로 시험을 미리 돌려 보는' 가상 커미셔닝이 가능해집니다. <a data-go="hdt/run/vcx">가상 IST 제안 도구 보기</a></div>`}

/* ══════════ HDB ══════════ */
function vDash(){const a=store.get("assume",HDB.scale.assume),per=a.drawings+a.calcs+a.specs+a.reviews+a.others,tot=a.projects*per;
 const byType={};PJ.forEach(p=>byType[p.type]=(byType[p.type]||0)+1);
 return head("Dashboard","보유 자료 현황(확인 수치와 추정 구분)","C")+
 `<div class="grid g4">${HDB.scale.facts.map(f=>`<div class="card kpi"><span>${f.k} ${grade(f.g,f.g)}</span><b class="num" style="font-size:${f.v.length>8?15:24}px">${f.v}</b><em>${f.s}</em></div>`).join("")}</div>
 <div class="grid g2 mt"><div class="card"><h3>규모 추정 ${grade("D","가정을 바꿔 볼 수 있음")}</h3>
  <p class="small muted" style="margin-top:0">프로젝트 1건에서 나오는 산출물 수를 가정해 전체 규모의 자릿수를 가늠합니다. 실제 값은 공개되지 않았습니다.</p>
  ${[["projects","누적 프로젝트","건"],["drawings","도면","장/건"],["calcs","계산서","종/건"],["specs","시방·설명서","종/건"],["reviews","검토·회신 문서","건/건"],["others","기타(사진·회의록 등)","건/건"]].map(x=>`<div class="fld"><label>${x[1]}</label><input type="number" data-as="${x[0]}" value="${a[x[0]]}"><span>${x[2]}</span></div>`).join("")}
  <div class="out mt"><div class="o"><span>프로젝트당 산출물</span><b>${per.toLocaleString()}</b><em>건</em></div><div class="o"><span>전체 추정</span><b>${(tot/10000).toFixed(0)}만</b><em>건</em></div><div class="o"><span>도면만</span><b>${(a.projects*a.drawings/10000).toFixed(0)}만</b><em>장</em></div></div>
  <div class="note o mt small">백만 건 안팎이면 폴더 탐색으로는 찾을 수 없고, 속성(시설·분야·단계·문서 종류)이 붙어 있어야 조건 검색과 유사 추천이 됩니다. 과거 자료는 CD·USB·외장하드에 있었으므로 ${fn("P2")} 속성을 뒤늦게 붙이는 일이 가장 큰 작업입니다.</div></div>
 <div class="card"><h3>들어 있는 것 ${grade("B")}</h3><table class="t"><tr><th>구분</th><th>내용</th><th>저장</th></tr>
  <tr><td>프로젝트 산출물</td><td>계산서, 설계설명서, 검토서, 도면 ${fn("P2")}</td><td>File Server</td></tr>
  <tr><td>프로젝트 정보</td><td>개요, WBS, 업무·산출물 상태, 투입 인력 ${fn("R1")}</td><td>DB Server</td></tr>
  <tr><td>표준 자료</td><td>표준 계산서·표준 도면, 양식(한글·Excel) ${fn("P2")}</td><td>File + DB</td></tr>
  <tr><td>디지털 도서관</td><td>전문 서적, 기술 표준 ${fn("P2")}</td><td>File Server</td></tr>
  <tr><td>파라미터</td><td>장비·시스템 성능값, 설계 조건 ${fn("P3")}</td><td>DB Server</td></tr>
  <tr><td>외부 DB</td><td>법규, 공공 데이터(계획) ${fn("P2")}</td><td>연계</td></tr></table>
  <h3 class="mt">시연용 프로젝트 ${PJ.length}건 <small>가상 데이터</small></h3>${Object.entries(byType).map(([k,v])=>`<span class="tag">${k} ${v}</span>`).join("")} <span class="tag g">산출물 ${DOCS.length}건</span></div></div>`}
let q={text:"",type:"",disc:"",doc:"",stage:""};
function vSearch(){const hit=DOCS.filter(d=>(!q.type||d.pj.type===q.type)&&(!q.disc||d.disc===q.disc)&&(!q.doc||d.type===q.doc)&&(!q.stage||d.stage===q.stage)&&(!q.text||(d.pj.name+d.type+d.pj.plant+d.pj.kw.join(" ")+d.wbs+d.pj.spec).toLowerCase().includes(q.text.toLowerCase())));
 const sel=(k,arr,ph)=>`<select data-q="${k}"><option value="">${ph}</option>${arr.map(x=>`<option ${q[k]===x?"selected":""}>${x}</option>`).join("")}</select>`;
 return head("통합문서/DB검색","문서 속성 / 프로젝트 정보 / 시설·현장 정보 조건 검색","C","검색 조건은 구축사 공개")+
 `<div class="card"><div class="filters"><input type="search" id="qtext" placeholder="프로젝트명, 열원 방식, 설계 특징, WBS 번호 (예: 프리쿨링, D2C, M-201)" value="${e(q.text)}">
  ${sel("type",HDB.facilityTypes,"시설 유형")}${sel("disc",["기계","전기","소방","통신","커미셔닝"],"분야")}${sel("doc",HDB.docTypes,"문서 종류")}${sel("stage",["계획설계","중간설계","실시설계","납품","시공","준공"],"단계")}<button class="btn" id="qreset">초기화</button></div>
  <p class="small muted" style="margin:10px 0 6px">${hit.length}건 / 전체 ${DOCS.length}건 · 시연용 가상 데이터</p>
  <div class="tw"><table class="t"><tr><th>문서</th><th>프로젝트</th><th>시설</th><th>분야</th><th>단계</th><th>WBS</th><th>개정</th><th>형식</th></tr>
  ${hit.slice(0,60).map(d=>`<tr class="click" data-go="hdb/project/${d.pj.id}"><td><b>${e(d.type)}</b></td><td>${e(d.pj.name)}<br><span class="small muted">${e(d.pj.plant)}</span></td><td>${d.pj.type}</td><td>${d.disc}</td><td>${d.stage}</td><td><a data-go="hdp/map/${TASKS.find(t=>t.id===d.wbs)?.disc}/${d.wbs}">${d.wbs}</a></td><td>${d.rev}</td><td><span class="tag k">${d.ext}</span></td></tr>`).join("")}</table></div></div>
 <div class="note b mt">지금 단계는 속성 검색입니다. 문서 본문을 읽고 출처와 함께 답하는 검색(RAG)은 2026년 구축 중으로 보도됐습니다. 속성이 먼저 정리돼 있어야 본문 검색 결과도 프로젝트·단계별로 걸러 볼 수 있습니다.</div>`}
function vProjects(){return head("프로젝트 관리","시설 유형별 프로젝트 현황","C")+`<div class="grid g3">${PJ.map(p=>`<div class="pc" data-go="hdb/project/${p.id}"><b>${e(p.name)}</b> <span class="tag ${p.stage==="준공"?"g":"o"}">${p.stage}</span><div class="s">${p.type} · ${p.year} · ${p.region} · ${p.area}천㎡ · ${p.floors}</div><div class="s">${e(p.plant)}</div><div style="margin-top:6px">${p.disc.map(d=>`<span class="tag">${d}</span>`).join("")}</div></div>`).join("")}</div><p class="small muted mt">전부 시연용 가상 프로젝트입니다.</p>`}
function vProject(id){const p=PJ.find(x=>x.id===id)||curPj(),docs=DOCS.filter(d=>d.pj.id===p.id),sims=similar(p,[]).slice(0,4);
 return head(`${e(p.name)} <span class="tag ${p.stage==="준공"?"g":"o"}">${p.stage}</span>`,`${p.id} · ${p.type} · ${p.year} · ${p.region} · 연면적 ${p.area}천㎡ · ${p.floors}`,"D","가상 프로젝트")+pjTabs(p,"project")+
 `<div class="grid g2"><div class="card"><h3>프로젝트 개요 정보</h3><table class="t"><tr><td class="muted">열원 방식</td><td>${e(p.plant)}</td></tr><tr><td class="muted">특기</td><td>${e(p.spec)||"–"}</td></tr><tr><td class="muted">인증</td><td>${p.cert.map(c=>`<span class="tag g">${c}</span>`).join("")||"–"}</td></tr><tr><td class="muted">설계 특징</td><td>${p.kw.map(k=>`<span class="tag">${k}</span>`).join("")}</td></tr><tr><td class="muted">참여 분야</td><td>${p.disc.join(", ")}</td></tr></table>
  <button class="btn p mt" data-setpj="${p.id}">이 프로젝트를 작업 프로젝트로</button></div>
 <div class="card"><h3>유사 프로젝트 <small>왜 비슷한지 표시</small></h3>${sims.map(s=>`<div class="li" style="display:block"><a data-go="hdb/project/${s.p.id}"><b>${e(s.p.name)}</b></a> <span class="muted small">${s.p.year}</span><div class="sim"><div class="bar"><i style="width:${s.s}%"></i></div><b class="num small">${s.s}</b></div><div class="why">${s.why.map(w=>`<i class="${w[0]?"":"x"}">${e(w[1])}</i>`).join("")}</div></div>`).join("")}</div></div>`}
function vForms(){const m={};TASKS.forEach(t=>t.forms.forEach(f=>(m[f]=m[f]||[]).push(t)));
 return head("양식 표준","한글·Excel 양식 등록, DB 항목 연계","C","양식 관리 기능은 구축사 공개")+
 `<div class="card tw"><table class="t"><tr><th>양식</th><th>형식</th><th>쓰이는 업무</th><th>DB 연계 항목(예)</th></tr>${Object.entries(m).map(([f,ts])=>`<tr><td><b>${e(f)}</b></td><td><span class="tag k">${/시트|표|집계|대장/.test(f)?"Excel":"한글"}</span></td><td>${ts.map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id}</a>`).join("")}</td><td class="small muted">프로젝트명, 개정, 작성·검토자${/계산|산정|집계/.test(f)?", 입력 조건, 결과값":""}</td></tr>`).join("")}</table></div><p class="small muted mt">양식 이름은 재구성입니다. 하이멕의 실제 양식 목록은 공개되지 않았습니다.</p>
 <div class="card mt"><h3>양식이 데이터가 되는 길 ${grade("C","구축사 공개 자료")}</h3><div class="lin"><div class="n"><b>기존 한글·엑셀 양식</b>현업이 쓰던 그대로</div><div class="n"><b>양식 등록</b>양식의 칸을 DB 항목에 연결</div><div class="n"><b>웹 편집</b>브라우저에서 한글·엑셀 작성</div><div class="n"><b>나눠 저장</b>항목값 → DB Server<br>원본 → File Server</div><div class="n"><b>활용</b>대시보드, 조건 검색, 보고서, AI 검색</div></div><p class="small muted" style="margin:8px 0 0">구축사가 공개한 문서 데이터화 방식입니다 ${fn("R2")}. 논문 구조도의 'DB Server(Parameters) / File Server(Documents)' 구분과 맞아떨어집니다 ${fn("P2")}. 하이멕에 그대로 적용됐는지는 확인하지 못했습니다.</p></div>`}
function vStd(){return head("기준 표준 정보 · 디지털 도서관","법규·설계기준·시방·편람(공개 기준 목록)","B","도서관 구축은 논문, 목록은 재구성")+
 `<div class="card tw"><table class="t"><tr><th>구분</th><th>자료</th><th>발행</th><th>연결된 업무</th></tr>${HDB.library.map(l=>{const ts=TASKS.filter(t=>t.refs.some(r=>r.includes(l[1].slice(0,6))));return `<tr><td><span class="tag">${l[0]}</span></td><td><b>${e(l[1])}</b></td><td>${e(l[2])}</td><td>${ts.slice(0,6).map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id}</a>`).join("")}</td></tr>`}).join("")}</table></div>
 <div class="note b mt">기준이 개정되면 그 기준을 참조한 업무와 산출물을 거꾸로 찾을 수 있어야 합니다. 공모전 수상작 'RETRACE', '법규가 바뀌면 다시 볼 설계도서를 당일 찾아주는 AI'가 가리키는 기능이고, 논문도 법규·공공 데이터 연계를 다음 계획으로 적었습니다 ${fn("P2")}.</div>`}
function vEquip(){return head("장비 DB","데이터센터 냉방 장비 분류코드, 파라미터 구분(2018 논문 표). 2025 논문 구성도에는 없는 화면","B","2018 논문 Table 2·3")+
 `<div class="grid g2"><div class="card tw"><h3>분류코드 ${fn("P3")}</h3><table class="t"><tr><th>대분류</th><th>장비</th><th>분류코드</th></tr>${HDB.equip.map(x=>`<tr><td>${x[0]}</td><td>${e(x[1])}</td><td><code>${x[2]}</code></td></tr>`).join("")}</table></div>
 <div class="card"><h3>파라미터 3구분 <small>터보 냉동기(C_Chiller_04) 예</small></h3>${Object.entries(HDB.equipParams).map(([k,v])=>`<h4 class="small" style="margin:10px 0 4px">${k}</h4>${v.map(x=>`<span class="tag">${x}</span>`).join("")}`).join("")}
 <div class="note mt small">에너지 성능 정보와 비용 정보는 설계 지원 프로그램의 입력으로, 기타 설계 정보는 결과 보고서에 함께 적어 건축·전력 설계와 장비 선정에 쓴다고 논문은 설명합니다. HDB의 'DB Server(Parameters)'가 이런 값을 담는 자리로 보입니다.</div>
 <h4 class="small" style="margin:12px 0 4px">냉방 시스템 6유형</h4>${["공랭식 DX","글리콜 냉각 DX","수랭식 DX","공랭식 냉수","글리콜 냉각 냉수","수랭식 냉수"].map(x=>`<span class="tag g">${x}</span>`).join("")}</div></div>`}
function vLink(){const L=HDB.lineage,oat=store.get("oat",L.base.oat),k=1+(oat-L.base.oat)*0.021,ch=Math.abs(oat-L.base.oat)>0.01;
 const val=key=>key==="oat"?oat:Math.round(L.base[key]*(key==="pump"?Math.pow(k,1):k)*10)/10;
 return head("산출물 데이터 연동 · 변경 영향","설계조건 변경 시 연관 산출물 반영·재검토 대상 표시","D","논문 구성도에 없는 화면. 기능은 구축사 공개, 수치 모형은 가상")+
 `<div class="card"><div class="fld" style="grid-template-columns:auto 240px 60px;max-width:520px"><label>설계기준서의 외기 건구온도</label><input type="range" min="29" max="36" step="0.1" value="${oat}" id="oat"><span><b class="num">${oat.toFixed(1)}</b> ℃</span></div>
 <div class="lin mt">${L.nodes.map(n=>`<div class="n ${ch&&n[0]!=="bod"?"hit":""}"><b>${n[1]}</b>${n[2]}<div class="v">${n[4]?`${val(n[4]).toLocaleString()} ${n[3]}${ch&&n[4]!=="oat"?` <span class="small">(기존 ${L.base[n[4]].toLocaleString()})</span>`:""}`:ch?"다시 검토 필요":"최신"}</div></div>`).join("")}</div>
 <div class="note ${ch?"o":"b"} mt">${ch?`외기 조건이 ${L.base.oat}℃에서 ${oat.toFixed(1)}℃로 바뀌어 산출물 7건이 '다시 검토'로 표시됐습니다. 숫자가 있는 산출물은 값이 따라 바뀌고, 도면과 시방서는 담당자에게 검토 요청이 갑니다.`:"기준값과 같습니다. 슬라이더를 움직이면 이어진 산출물이 표시됩니다."} 기준 외기 31.2℃는 건축물의 에너지절약설계기준 별표7의 서울 냉방 설계 건구온도입니다. 부하 변화는 온도 1K당 2.1%의 단순 비례로 가정한 시연용 모형입니다.</div></div>
 <div class="grid g2 mt"><div class="card"><h3>왜 중요한가</h3><ul class="c"><li>같은 숫자가 계산서, 장비일람표, 도면, 시방서, 전기 부하표에 따로 적힌다. 하나만 고치면 불일치가 납품까지 간다.</li><li>성과품 검토(M-401)의 첫 체크사항이 '같은 수치가 서로 일치하는가'다.</li><li>공모전 수상작 RippleTrace(설계조건 변경 파급영향 추적), '우리 회사는 그 숫자를 몇 가지로 쓰고 있습니까'가 같은 문제를 가리킨다 ${fn("N3")}.</li></ul></div>
 <div class="card"><h3>구현하려면</h3><ul class="c"><li>양식의 칸을 DB 항목(파라미터)과 연결한다. 양식 표준이 먼저다.</li><li>값마다 출처 산출물과 개정을 기록한다.</li><li>자동 반영은 숫자까지. 도면과 시방서는 '검토 요청'으로 사람에게 넘긴다.</li></ul></div></div>`}

/* ══════════ 논문 Fig.1 구조에 맞춘 화면(2026-11-17) ══════════
   메뉴 이름과 배치: 김응진 외(2025) Fig.1. Biz-Code·정형/비정형 구분: 오채미 외(2024) Fig.1.
   화면 안의 내용과 편집 기능은 지원자 재구성. 편집분은 이 브라우저(localStorage)에만 저장된다. */
const DN={mech:"기계",elec:"전기",comm:"통신",fire:"소방",cx:"커미셔닝"};
const pjTasks=p=>TASKS.filter(t=>DN[t.disc]&&p.disc.includes(DN[t.disc]));
const extOf=s=>/도$/.test(s)?"DWG":/계산|일람|내역|집계|표$/.test(s)?"XLSX":"HWP";
function pushDoc(u,i){const p=PJ.find(x=>x.id===u.pj),t=TASKS.find(x=>x.id===u.wbs);if(!p||!t)return;DOCS.push({id:"U-"+(i+1),pj:p,type:u.type,disc:DN[t.disc]||"기계",stage:p.stage,wbs:u.wbs,rev:"R0",ext:u.ext,user:true,ui:i})}
function loadUser(){TASKS.forEach(t=>{t.nb=t.checks.length;t.checks=t.checks.concat(store.get("xchk."+t.id,[]))});
  store.get("u.tasks",[]).forEach(t=>{t.nb=t.checks.length;t.user=true;TASKS.push(t)});
  store.get("u.docs",[]).forEach(pushDoc)}
loadUser();
const edNote=`<p class="small muted" style="margin:8px 0 0">추가·수정한 내용은 이 브라우저에만 저장됩니다. 논문은 '엔지니어가 코딩 없이 프로세스와 도구를 고친다'고 했고, 이 편집 기능은 그 점을 최소한으로 옮긴 것입니다.</p>`;
const inp=(id,ph,w)=>`<input id="${id}" placeholder="${ph}" style="width:${w||160}px">`;
const selOpt=(id,arr,cur)=>`<select id="${id}">${arr.map(x=>`<option value="${e(x[0])}" ${x[0]===cur?"selected":""}>${e(x[1])}</option>`).join("")}</select>`;
let pf={disc:"mech"};

/* 허브: Fig.1 배치 그대로 */
function figMap(){const b=(go,t,c)=>`<a class="fb ${c||""}" data-go="${go}">${t}</a>`;
 return `<div class="card mt fig1"><h3>HDX Platform 구성도 <small>배치와 상자 이름은 김응진 외(2025) Fig. 1. 상자를 누르면 해당 화면</small> ${grade("B","논문 그림")}</h3>
 <div class="fgtop"><b>HDX Platform</b><span>구축 범위</span></div>
 <div class="fgbody">
  <div class="fgleft">
   <div class="fgmod"><div class="fgh"><b>HDP</b><small>( Engineering Process )</small></div>${b("hdp/process","Process 관리")}${b("hdp/map","Workflow Map 관리")}${b("hdp/biz","Workflow Biz 관리")}</div>
   <div class="fgmod"><div class="fgh"><b>HDT</b><small>( Engineering Toolkits )</small></div>${b("hdt/excel","Excel Toolkit")}${b("hdt/ext","외부 프로그램")}${b("hdt/list","자체 개발 프로그램")}${b("hdt/extdb","외부 시스템 및 외부 DB")}</div>
  </div>
  <div class="fgdb"><div class="fgh big"><b>Data Platform – HDB</b><small>( Engineering Database )</small></div>
   <div class="fgin">
    <div class="fgarea"><em>[ 전사 ]</em>
     <div class="fgrow">${b("hdb/dash","Dashboard","w")}</div>
     <div class="fgrow">${b("hdb/maplist","Workflow Map List 관리")}${b("hdb/projects","프로젝트 관리")}${b("hdb/search","통합문서/DB검색")}</div>
     <div class="fgrow">${b("hdb/toolkits","Toolkit List 관리")}<span></span>${b("hdb/docs","통합문서 관리")}</div>
     <div class="fgrow f4">${b("hdb/forms","양식 표준")}${b("hdb/wbs","WBS 표준")}${b("hdb/std","기준 표준 정보")}${b("hdb/org","인사/ 조직정보")}</div>
     <em>[ 프로젝트 ]</em>
     <div class="fgrow">${b("hdb/project","프로젝트 개요 정보")}${b("hdb/pwbs","프로젝트 WBS")}<span></span></div>
     <div class="fgrow"><span></span>${b("hdb/work","업무/산출물관리<i>HEAD Kits</i>")}${b("hdb/pdocs","프로젝트 문서")}</div>
    </div>
    <div class="fgsrv"><div class="srv"><b>DB Server</b><small>Parameters</small></div><div class="srv"><b>File Server</b><small>Documents</small></div></div>
   </div></div>
 </div>
 <p class="small muted" style="margin:8px 0 0">HDP와 HDT는 HDB의 'Workflow Map List 관리', 'Toolkit List 관리'를 거쳐 프로젝트 업무에 연결됩니다. 그림의 화살표는 생략했습니다. 장비 DB, 산출물 데이터 연동, 도면·모델 뷰어, 디지털 트윈은 논문 그림에 없는 화면이며 메뉴에 '재구성'으로 표시했습니다.</p></div>`}

/* HDB 전사 */
function vMapList(){const off=store.get("mapoff",[]);
 return head("Workflow Map List 관리","HDP에서 만든 Workflow Map을 전사 목록으로 등록·관리. 프로젝트 WBS가 이 목록에서 내려온다","B","이름·위치는 논문 Fig.1, 내용은 재구성")+
 `<div class="card tw"><table class="t"><tr><th>Workflow Map</th><th>Biz</th><th>단계</th><th>Process</th><th>승인 게이트</th><th>연결 Toolkit</th><th>적용 프로젝트</th><th>상태</th><th></th></tr>
 ${HDP.disciplines.map(d=>{const ts=TASKS.filter(t=>t.disc===d.id),on=!off.includes(d.id);return `<tr><td><b>${d.name}</b><br><span class="small muted">${d.sub}</span></td><td>${d.id==="pmcm"?"PM·CM":d.id==="cx"?"커미셔닝·TAB":"설계"}</td><td class="num">${phasesOf(d.id).length}</td><td class="num">${ts.length}</td><td class="num">${ts.filter(t=>t.gate).length}</td><td class="num">${new Set(ts.flatMap(t=>t.tools)).size}</td><td class="num">${DN[d.id]?PJ.filter(p=>p.disc.includes(DN[d.id])).length:"–"}</td><td><span class="tag ${on?"g":"k"}">${on?"사용":"중지"}</span></td><td style="white-space:nowrap"><button class="btn" data-go="hdp/map/${d.id}">열기</button> <button class="btn" data-act="maptoggle" data-id="${d.id}">${on?"중지":"사용"}</button></td></tr>`}).join("")}</table>
 <p class="small muted" style="margin:8px 0 0">적용 프로젝트 수는 시연용 가상 프로젝트 기준입니다.</p></div>
 <div class="note b mt">논문 그림에서 HDP의 Process·Workflow Map·Workflow Biz는 이 목록을 통해 HDB 안으로 들어옵니다. 즉 프로세스를 만드는 곳(HDP)과 프로젝트에 적용하는 곳(HDB)이 나뉘어 있고, 이 목록이 둘 사이의 접점입니다.</div>`}
function tkRows(){const lk=id=>TASKS.filter(t=>t.tools.includes(id)).length;
 return [...ALLTOOLS.map(t=>({id:t.id,name:t.pub==="미공개"||t.pub==="제안"?(t.mine||"미공개"):t.pub,cls:t.cls,field:t.field,stage:t.stage,n:lk(t.id),st:t.run?"실행 가능":t.pub==="미공개"&&!t.mine?"미공개":"이름만 공개",go:t.run?"hdt/run/"+t.run:""})),
  ...HDT.ext.map(x=>({id:x.id,name:x.name,cls:"외부 프로그램",field:x.field,stage:x.stage,n:lk(x.id),st:x.img?"영상 확인":"일반 실무",go:"hdt/ext"})),
  ...store.get("u.tools",[]).map((u,i)=>({id:"U-T"+(i+1),name:u.name,cls:u.cls,field:u.field,stage:"",n:0,st:"직접 추가",go:"",ui:i}))]}
function vToolkits(){const off=store.get("tkoff",[]),rows=tkRows(),C=["Excel Toolkit(노코드)","외부 프로그램","자체 개발 프로그램","외부 시스템·외부 DB"];
 return head("Toolkit List 관리","HDT의 도구를 전사 목록으로 등록·관리. 업무(Process)에 붙여 프로젝트에서 실행","B","이름·위치는 논문 Fig.1, 목록은 재구성")+
 `<div class="card"><h3>Toolkit 등록</h3><div class="filters">${inp("tkName","도구 이름",200)}${selOpt("tkCls",C.map(x=>[x,x]),C[0])}${inp("tkField","분야",110)}<button class="btn p" data-act="addtool">등록</button></div>${edNote}</div>
 <div class="card mt tw"><table class="t"><tr><th>ID</th><th>도구</th><th>구분</th><th>분야</th><th>단계</th><th>연결 Process</th><th>상태</th><th>사용</th><th></th></tr>
 ${rows.map(r=>{const on=!off.includes(r.id);return `<tr><td><b>${r.id}</b></td><td>${r.go?`<a data-go="${r.go}">${e(r.name)}</a>`:e(r.name)}</td><td>${e(r.cls)}</td><td>${e(r.field||"–")}</td><td>${e(r.stage||"–")}</td><td class="num">${r.n}</td><td><span class="tag ${r.st==="실행 가능"?"g":r.st==="미공개"?"k":"o"}">${r.st}</span></td><td><span class="tag ${on?"g":"k"}">${on?"사용":"중지"}</span></td><td style="white-space:nowrap"><button class="btn" data-act="tktoggle" data-id="${r.id}">${on?"중지":"사용"}</button>${r.ui!=null?` <button class="btn" data-act="deltool" data-i="${r.ui}">삭제</button>`:""}</td></tr>`}).join("")}</table></div>
 <div class="note mt">'디지털 설계지원도구 14종'은 보도에 나온 수치이고 전체 이름은 공개되지 않았습니다. T-로 시작하는 14칸 중 이름이 공개된 것만 채웠고, 제안 3종과 외부 프로그램은 따로 구분했습니다.</div>`}
function vDocs(){const p=curPj(),ts=pjTasks(p),ud=DOCS.filter(d=>d.user),by={};DOCS.forEach(d=>by[d.type]=(by[d.type]||0)+1);
 return head("통합문서 관리","프로젝트 문서를 전사 통합문서로 등록. 항목값은 DB Server, 원본은 File Server","B","이름·위치·저장 구분은 논문 Fig.1, 화면은 재구성")+
 `<div class="card"><h3>문서 등록 <small>작업 프로젝트: ${e(p.name)}</small></h3><div class="filters">${selOpt("dcWbs",ts.map(t=>[t.id,t.id+" "+t.name]),ts[0]&&ts[0].id)}${selOpt("dcType",HDB.docTypes.map(x=>[x,x]),HDB.docTypes[0])}${selOpt("dcExt",["HWP","XLSX","DWG","PDF"].map(x=>[x,x]),"HWP")}<button class="btn p" data-act="adddoc">등록</button></div>
  <div class="lin mt"><div class="n"><b>프로젝트 문서</b>업무 산출물(OUTPUT)</div><div class="n"><b>통합문서 관리</b>속성 부여: 프로젝트·WBS·문서 종류·개정</div><div class="n"><b>DB Server</b>Parameters(항목값·속성)</div><div class="n"><b>File Server</b>Documents(원본 파일)</div><div class="n"><b>통합문서/DB검색</b>조건 검색, 유사 프로젝트</div></div>${edNote}</div>
 <div class="grid g2 mt"><div class="card tw"><h3>직접 등록한 문서 <small>${ud.length}건</small></h3>${ud.length?`<table class="t"><tr><th>문서</th><th>프로젝트</th><th>WBS</th><th>형식</th><th></th></tr>${ud.map(d=>`<tr><td><b>${e(d.type)}</b></td><td>${e(d.pj.name)}</td><td>${d.wbs}</td><td><span class="tag k">${d.ext}</span></td><td><button class="btn" data-act="deldoc" data-i="${d.ui}">삭제</button></td></tr>`).join("")}</table>`:`<p class="muted small">아직 없습니다. 위에서 등록하거나 '업무/산출물관리'에서 산출물을 등록하면 여기에 쌓입니다.</p>`}</div>
 <div class="card"><h3>문서 종류별 보유 <small>시연용 가상 데이터 ${DOCS.length}건</small></h3>${Object.entries(by).map(([k,v])=>`<span class="tag">${e(k)} ${v}</span>`).join("")}
  <table class="t mt"><tr><th>논문 2024 Fig.1의 구분</th><th>예</th></tr><tr><td>정형 · numerical data</td><td>부하, 용량, 유량 등 수치 항목</td></tr><tr><td>정형 · categorical data</td><td>시설 유형, 열원 방식, 분야, 단계</td></tr><tr><td>비정형 · Design resource</td><td>도면, 모델</td></tr><tr><td>비정형 · Report(pptx, hwp, docx)</td><td>설계설명서, 검토서, 보고서</td></tr></table><p class="small muted" style="margin:8px 0 0">구분은 오채미 외(2024) Fig. 1, 예시는 지원자가 붙였습니다.</p></div></div>`}
function vWbs(){return head("WBS 표준","전사 표준 WBS. 프로젝트를 만들면 참여 분야의 WBS가 '프로젝트 WBS'로 내려간다","B","이름·위치는 논문 Fig.1, WBS 내용은 재구성")+
 HDP.disciplines.map(d=>`<div class="card mt tw"><h3>${d.name} <small>${d.sub} · Process ${TASKS.filter(t=>t.disc===d.id).length}개</small></h3><table class="t"><tr>${phasesOf(d.id).map(p=>`<th>${p.name}</th>`).join("")}</tr><tr>${phasesOf(d.id).map(p=>`<td style="vertical-align:top">${TASKS.filter(t=>t.disc===d.id&&t.ph===p.id).map(t=>`<div><a data-go="hdp/map/${d.id}/${t.id}"><b>${t.id}</b></a> ${e(t.name)}</div>`).join("")||"–"}</td>`).join("")}</tr></table></div>`).join("")+
 `<div class="note b mt">WBS 번호가 Process(HDP), 산출물(HDB), 도구(HDT)를 잇는 열쇠입니다. 번호 체계(분야 글자 + 단계 + 순번)는 지원자가 정한 것이며 하이멕의 실제 WBS 코드는 공개되지 않았습니다. Process를 추가·수정하는 곳은 <a data-go="hdp/process">HDP의 Process 관리</a>입니다.</div>`}
function vOrg(){const m={};TASKS.forEach(t=>{(m[t.role]=m[t.role]||[]).push(t)});
 return head("인사/조직정보","업무 담당·검토·승인자를 조직 정보에서 가져오는 자리","B","이름·위치는 논문 Fig.1, 내용은 재구성")+
 `<div class="grid g2"><div class="card"><h3>공개된 조직 사실 ${grade("C","보도·홈페이지")}</h3><table class="t"><tr><td class="muted" style="width:120px">임직원</td><td>250명 이상 ${fn("N1")}</td></tr><tr><td class="muted">DX 전담 조직</td><td>DX추진실(2025-01 신설)</td></tr><tr><td class="muted">표준화 참여</td><td>기계·전기·통신·소방 현업 엔지니어 TFT ${fn("P2")}</td></tr></table>
  <div class="note mt small">실제 인명·직급·연락처는 싣지 않았습니다. 이 화면은 역할 단위까지만 보여 줍니다.</div></div>
 <div class="card"><h3>이 정보가 쓰이는 곳</h3><ul class="c"><li>Process의 담당 역할 → 프로젝트 WBS에서 실제 담당자 지정</li><li>승인 게이트의 검토자·승인자 지정</li><li>통합문서의 작성자·검토자 속성</li><li>프로젝트 투입 인력 현황(Dashboard)</li></ul></div></div>
 <div class="card mt tw"><h3>역할별 담당 Process <small>표준 프로세스에서 집계</small></h3><table class="t"><tr><th>역할</th><th>Process 수</th><th>승인 게이트</th><th>Process</th></tr>${Object.entries(m).sort((a,b)=>b[1].length-a[1].length).map(([r,ts])=>`<tr><td><b>${e(r)}</b></td><td class="num">${ts.length}</td><td class="num">${ts.filter(t=>t.gate).length}</td><td>${ts.slice(0,10).map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id}</a>`).join("")}${ts.length>10?` <span class="small muted">외 ${ts.length-10}</span>`:""}</td></tr>`).join("")}</table></div>`}

/* HDB 프로젝트 */
function pjTabs(p,on){return `<div class="disc">${[["project","프로젝트 개요 정보"],["pwbs","프로젝트 WBS"],["work","업무/산출물관리 · HEAD Kits"],["pdocs","프로젝트 문서"]].map(x=>`<button class="${x[0]===on?"on":""}" data-go="hdb/${x[0]}/${p.id}">${x[1]}</button>`).join("")}</div>`}
const pjHead=(p,t,sub)=>head(`${t} <span class="tag ${p.stage==="준공"?"g":"o"}">${p.stage}</span>`,`${e(p.name)} · ${p.id} · ${p.type} · ${p.year} · ${sub}`,"B","이름은 논문 Fig.1, 가상 프로젝트");
function vPwbs(id){const p=PJ.find(x=>x.id===id)||curPj(),ts=pjTasks(p);
 return pjHead(p,"프로젝트 WBS","WBS 표준에서 참여 분야만 내려받은 목록")+pjTabs(p,"pwbs")+
 `<div class="card tw"><table class="t"><tr><th>WBS</th><th>분야</th><th>단계</th><th>업무</th><th>담당 역할</th><th>체크</th><th>산출물</th><th>상태</th></tr>${ts.map(t=>{const d=HDP.disciplines.find(x=>x.id===t.disc),ph=phasesOf(t.disc).find(x=>x.id===t.ph),n=DOCS.filter(x=>x.pj.id===p.id&&x.wbs===t.id).length,c=store.get("chk."+t.id,[]).length;return `<tr class="click" data-go="hdp/map/${t.disc}/${t.id}"><td><b>${t.id}</b></td><td>${d.name}</td><td>${ph?ph.name:"–"}</td><td>${e(t.name)} ${t.gate?`<span class="tag r">게이트</span>`:""}</td><td>${e(t.role)}</td><td class="num">${c}/${t.checks.length}</td><td class="num">${n}</td><td><span class="tag ${n?"g":"k"}">${n?"산출물 등록":"미등록"}</span></td></tr>`}).join("")}</table>
 <p class="small muted" style="margin:8px 0 0">참여 분야: ${p.disc.join(", ")}. PM·CM 프로세스는 이 가상 프로젝트들에 배정하지 않았습니다.</p></div>`}
function vWork(id){const p=PJ.find(x=>x.id===id)||curPj(),ts=pjTasks(p);
 return pjHead(p,"업무/산출물관리","업무별 체크 진행, 연결 Kit 실행, 산출물(OUTPUT) 등록")+pjTabs(p,"work")+
 `<div class="note b">논문 그림의 '업무/산출물관리' 상자 안에 <b>HEAD Kits</b>라는 표기가 있습니다. 본문에는 설명이 없어 뜻은 확인하지 못했습니다. 이 화면에서는 '업무에 붙어 있는 도구 묶음'으로 해석해, 업무 줄에서 바로 실행하도록 했습니다(지원자 해석).</div>
 <div class="card mt tw"><table class="t"><tr><th>WBS</th><th>업무</th><th>체크</th><th>HEAD Kits(연결 도구)</th><th>OUTPUT</th><th></th></tr>${ts.map(t=>{const ds=DOCS.filter(x=>x.pj.id===p.id&&x.wbs===t.id),c=store.get("chk."+t.id,[]).length;return `<tr><td><a data-go="hdp/map/${t.disc}/${t.id}"><b>${t.id}</b></a></td><td>${e(t.name)}</td><td class="num">${c}/${t.checks.length}</td><td>${t.tools.map(x=>{const tt=ALLTOOLS.find(a=>a.id===x);return tt&&tt.run?`<a class="tag g" data-go="hdt/run/${tt.run}">${e(toolName(x))} 실행</a>`:`<span class="tag">${e(toolName(x))}</span>`}).join("")||`<span class="muted small">–</span>`}</td><td>${ds.map(d=>`<span class="tag k">${e(d.type)}</span>`).join("")||`<span class="muted small">없음</span>`}</td><td><button class="btn" data-act="regout" data-id="${t.id}" data-pj="${p.id}">산출물 등록</button></td></tr>`}).join("")}</table>${edNote}</div>`}
function vPdocs(id){const p=PJ.find(x=>x.id===id)||curPj(),docs=DOCS.filter(d=>d.pj.id===p.id);
 return pjHead(p,"프로젝트 문서","업무에서 나온 산출물. 통합문서 관리로 넘어가 전사 검색 대상이 된다")+pjTabs(p,"pdocs")+
 `<div class="card tw"><table class="t"><tr><th>WBS</th><th>업무</th><th>문서</th><th>분야</th><th>단계</th><th>개정</th><th>형식</th><th>저장</th></tr>${docs.map(d=>{const t=TASKS.find(t=>t.id===d.wbs);return `<tr class="click" data-go="hdp/map/${t.disc}/${t.id}"><td><b>${d.wbs}</b></td><td>${e(t.name)}</td><td>${e(d.type)}${d.user?` <span class="tag o">직접 등록</span>`:""}</td><td>${d.disc}</td><td>${d.stage}</td><td>${d.rev}</td><td><span class="tag k">${d.ext}</span></td><td class="small muted">원본 File Server · 속성 DB Server</td></tr>`}).join("")}</table></div>`}

/* HDT 4분류 */
const tkNav=on=>`<div class="disc">${[["excel","Excel Toolkit"],["ext","외부 프로그램"],["list","자체 개발 프로그램"],["extdb","외부 시스템 및 외부 DB"]].map(x=>`<button class="${x[0]===on?"on":""}" data-go="hdt/${x[0]}">${x[1]}</button>`).join("")}<button data-go="hdt/how">논문이 밝힌 도입 순서</button></div>`;
function vExcel(){const ts=HDT.tools.filter(t=>/Excel/.test(t.cls)),fm={};TASKS.forEach(t=>t.forms.forEach(f=>{if(/시트|표|집계|대장|계산/.test(f))(fm[f]=fm[f]||[]).push(t)}));
 return head("Excel Toolkit","현업이 쓰던 엑셀 수식 툴을 플랫폼에 등록해 양식·DB와 연결","B","논문 3.4절·Fig.1, 목록은 재구성")+tkNav("excel")+
 `<div class="grid g4">${ts.map(tcard).join("")}</div>
 <div class="card mt tw"><h3>Excel 양식으로 쓰이는 계산 시트 <small>양식 표준에서 집계 · 이름은 재구성</small></h3><table class="t"><tr><th>시트</th><th>쓰이는 Process</th></tr>${Object.entries(fm).map(([f,a])=>`<tr><td><b>${e(f)}</b></td><td>${a.map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id}</a>`).join("")}</td></tr>`).join("")}</table></div>
 <div class="note b mt">논문은 '기존에 활용 중인 엑셀 기반의 수식 툴'과 외부 전문 프로그램의 연계를 가장 먼저 추진했다고 적었습니다. 익숙한 업무 환경을 유지해 진입 장벽을 낮추려는 것입니다 ${fn("P2")}. 2024년 논문 그림의 표현으로는 Offline solver(문서 양식과 함께 쓰는 계산)에 가깝습니다.</div>`}
function vExtDb(){const R=[["설계용 외기 조건","건축물의 에너지절약설계기준 별표7","국토교통부 고시","습공기 물성 계산의 기본값·예시 조건","hdt/run/psy"],["기후평년값(1991~2020)","기상자료개방포털","기상청","프리쿨링 시간 계산의 지역 기상","hdt/run/fc"],["법령·고시 조문","국가법령정보센터","법제처","업무별 근거 조문, 기준 표준 정보","hdb/std"],["건설기준(KDS·KCS)","국가건설기준센터","국토교통부·한국건설기술연구원","TAB·커미셔닝 업무의 근거 시방","source/hdp"],["물성값","NIST Chemistry WebBook","NIST","배관 관경 선정의 물 밀도·점도","hdt/run/pipe"]];
 return head("외부 시스템 및 외부 DB","법규·공공 데이터 등 외부 DB와의 연계","B","논문 3.3절·Fig.1, 연계 대상은 재구성")+tkNav("extdb")+
 `<div class="note b">논문은 외부 DB 연계를 '앞으로의 계획'으로 적었습니다: 법규 및 공공 데이터와 연계해 최신 규제 준수와 환경 요소를 설계에 반영한다는 것입니다 ${fn("P2")}. 2024년 논문 그림에서도 HDB의 parameters에 'Public data'가 점선으로 연결돼 있습니다. 하이멕이 실제로 무엇을 연계했는지는 공개되지 않았습니다.</div>
 <div class="card mt tw"><h3>이 사이트가 실제로 가져다 쓴 외부 자료 <small>연계 후보로 볼 수 있는 것</small></h3><table class="t"><tr><th>자료</th><th>출처</th><th>발행</th><th>이 사이트에서 쓰인 곳</th><th></th></tr>${R.map(r=>`<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td><button class="btn" data-go="${r[4]}">보기</button></td></tr>`).join("")}</table>
 <p class="small muted" style="margin:8px 0 0">이 사이트는 값을 한 번 옮겨 적은 것이고 실시간 연계는 아닙니다. 자료별 조문·주소는 <a data-go="source/hdt">출처</a>에 있습니다.</p></div>
 <div class="grid g2 mt"><div class="card"><h3>외부 DB가 들어오는 자리</h3><ul class="c"><li>HDB의 Parameters: 설계 외기 조건, 기상, 물성처럼 계산 입력이 되는 값</li><li>기준 표준 정보: 법령·고시·시방의 개정 이력</li><li>HDT 계산 도구: 입력 기본값을 사람이 적지 않고 DB에서 가져옴</li></ul></div>
 <div class="card"><h3>외부 시스템</h3><p style="margin:0">그림은 '외부 시스템 및 외부 DB'를 한 상자로 묶었지만 어떤 시스템인지는 본문에 없습니다. CAD·BIM처럼 파일을 만드는 프로그램은 '외부 프로그램'으로 따로 있으므로, 여기서의 외부 시스템은 사내외의 다른 업무 시스템을 뜻하는 것으로 읽힙니다(지원자 해석).</p></div></div>`}

/* 편집 동작 */
function act(a,el){const v=id=>{const n=$("#"+id);return n?n.value.trim():""};
 if(a==="pfdisc"){pf.disc=el.value;return true}
 if(a==="pqreset"){pq={text:"",disc:"",kind:""};return true}
 if(a==="addtask"){const name=v("ptName");if(!name)return true;const us=store.get("u.tasks",[]),d=v("ptDisc"),pre=(TASKS.find(t=>t.disc===d&&!t.user)||{id:"U-"}).id.split("-")[0];let n=1;while(TASKS.some(t=>t.id===`${pre}-U${String(n).padStart(2,"0")}`))n++;
   const t={disc:d,ph:v("ptPh"),id:`${pre}-U${String(n).padStart(2,"0")}`,name,role:v("ptRole")||"담당 미지정",gate:false,outs:(v("ptOut")||"산출물 미지정").split(",").map(s=>s.trim()).filter(Boolean),checks:["체크사항을 Workflow Map 관리에서 추가"],forms:[],refs:[],tools:[],tags:[],ideas:[]};
   us.push(t);store.set("u.tasks",us);TASKS.push(Object.assign({},t,{nb:1,user:true}));pq={text:"",disc:"",kind:"추가"};location.hash="#/hdp/process";return true}
 if(a==="deltask"){const id=el.dataset.id;store.set("u.tasks",store.get("u.tasks",[]).filter(t=>t.id!==id));const i=TASKS.findIndex(t=>t.id===id);if(i>=0)TASKS.splice(i,1);for(let k=DOCS.length-1;k>=0;k--)if(DOCS[k].wbs===id)DOCS.splice(k,1);store.set("u.docs",store.get("u.docs",[]).filter(d=>d.wbs!==id));return true}
 if(a==="addchk"){const s=v("xchkIn"),t=TASKS.find(x=>x.id===el.dataset.id);if(!s||!t)return true;t.checks.push(s);if(t.user){const us=store.get("u.tasks",[]),u=us.find(x=>x.id===t.id);if(u){u.checks.push(s);store.set("u.tasks",us)}t.nb=t.checks.length}else store.set("xchk."+t.id,t.checks.slice(t.nb));return true}
 if(a==="delchk"){const t=TASKS.find(x=>x.id===el.dataset.id),i=+el.dataset.i;if(!t||i<t.nb)return true;t.checks.splice(i,1);store.set("xchk."+t.id,t.checks.slice(t.nb));store.set("chk."+t.id,store.get("chk."+t.id,[]).filter(x=>x!==i).map(x=>x>i?x-1:x));return true}
 if(a==="maptoggle"||a==="tktoggle"){const k=a==="maptoggle"?"mapoff":"tkoff",o=store.get(k,[]),id=el.dataset.id;store.set(k,o.includes(id)?o.filter(x=>x!==id):[...o,id]);return true}
 if(a==="addtool"){const name=v("tkName");if(!name)return true;const u=store.get("u.tools",[]);u.push({name,cls:v("tkCls"),field:v("tkField")});store.set("u.tools",u);return true}
 if(a==="deltool"){const u=store.get("u.tools",[]);u.splice(+el.dataset.i,1);store.set("u.tools",u);return true}
 if(a==="adddoc"||a==="regout"){const u=store.get("u.docs",[]);let d;if(a==="adddoc"){if(!v("dcWbs"))return true;d={pj:curPj().id,wbs:v("dcWbs"),type:v("dcType"),ext:v("dcExt")}}else{const t=TASKS.find(x=>x.id===el.dataset.id);d={pj:el.dataset.pj,wbs:t.id,type:t.outs[0],ext:extOf(t.outs[0])}}
   u.push(d);store.set("u.docs",u);pushDoc(d,u.length-1);return true}
 if(a==="deldoc"){const u=store.get("u.docs",[]);u.splice(+el.dataset.i,1);store.set("u.docs",u);for(let k=DOCS.length-1;k>=0;k--)if(DOCS[k].user)DOCS.splice(k,1);u.forEach(pushDoc);return true}
 if(a==="addbiz"){const name=v("bzName");if(!name)return true;const u=store.get("u.biz",[]);u.push({code:v("bzCode")||"–",name,flow:v("bzFlow")});store.set("u.biz",u);return true}
 if(a==="delbiz"){const u=store.get("u.biz",[]);u.splice(+el.dataset.i,1);store.set("u.biz",u);return true}
 if(a==="resetedit"){try{Object.keys(localStorage).filter(k=>/^hdxv2\.(u\.|xchk\.|mapoff|tkoff)/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(_){}location.reload();return true}
 return false}

/* ══════════ HDT ══════════ */
function tcard(t){const nm=t.pub==="미공개"||t.pub==="제안"?(t.mine||"미공개"):t.pub,unk=!t.mine&&t.pub==="미공개";
 return `<div class="tc ${t.run?"run":""} ${unk?"unk":""}" ${t.run?`data-go="hdt/run/${t.run}"`:""}><div class="id">${t.id} · ${e(t.cls)} ${grade(t.g,t.g)}</div><b>${e(nm)}</b><p>${e(t.use)}</p><div>${t.field?`<span class="tag">${e(t.field)}</span><span class="tag k">${e(t.stage)}</span>`:""}${t.run?`<span class="tag g">실행 가능</span>`:unk?"":`<span class="tag o">이름만 공개</span>`}</div></div>`}
function vTools(){return head("자체 개발 프로그램","Python·VBA 자체 SW와 연구 과제 결과물(HDT-301·302 등). 실행 가능 표시 도구는 화면에서 계산","C","분류는 논문 Fig.1, 도구 이름은 보도·논문")+tkNav("list")+
 `<div class="grid g4">${HDT.tools.filter(t=>/자체/.test(t.cls)||(t.cls==="미공개"&&t.mine)).map(tcard).join("")}</div>
 <p class="small muted" style="margin:8px 0 0">14종 전체 목록과 사용 설정은 <a data-go="hdb/toolkits">HDB의 Toolkit List 관리</a>에 있습니다. 2024년 논문 그림의 표현으로는 Online solver에 해당합니다.</p>
 <h3 class="mt2" style="font-size:15px">14종 밖 · 지원자 제안</h3><div class="grid g4 mt">${HDT.proposed.map(tcard).join("")}</div>
 <div class="note mt">실행되는 계산기는 지원자가 일반 공학 공식으로 새로 구현한 것입니다. 이름은 공개된 도구명을 따랐지만 하이멕의 계산 로직과는 무관합니다. 모든 결과에 줄 단위 계산 근거가 함께 나옵니다.</div>`}
function vRun(key){const T=TOOLS[key];if(!T)return vTools();const st=store.get("in."+key,{});const vals={};T.fields.forEach(f=>vals[f[0]]=st[f[0]]??f[2]);
 const num={};T.fields.forEach(f=>num[f[0]]=String(f[3]).startsWith("sel:")?vals[f[0]]:Number(vals[f[0]]));let r;try{r=T.run(num)}catch(x){r={out:[["오류","입력 확인",""]],trace:String(x)}}
 const uses=TASKS.filter(t=>t.tools.some(id=>ALLTOOLS.find(x=>x.id===id&&x.run===key)));
 return head(T.title,e(T.basis),"D","자체 구현")+
 `<div class="calc"><div class="card"><h3>입력</h3>${T.fields.map(f=>String(f[3]).startsWith("sel:")?`<div class="fld"><label>${f[1]}</label><select data-in="${f[0]}">${f[3].slice(4).split(",").map(o=>`<option ${vals[f[0]]===o?"selected":""}>${o}</option>`).join("")}</select></div>`:`<div class="fld"><label>${f[1]}</label><input type="number" step="any" data-in="${f[0]}" value="${vals[f[0]]}"><span>${f[3]}</span></div>`).join("")}
  <h4 class="small" style="margin:14px 0 6px">예시 조건</h4>${T.presets.map((p,i)=>`<button class="btn" style="margin:0 6px 6px 0" data-preset="${i}">${p[0]}</button>`).join("")}
  <h4 class="small" style="margin:14px 0 6px">이 도구를 쓰는 업무</h4>${uses.map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id} ${e(t.name)}</a>`).join("")||`<span class="muted small">–</span>`}</div>
 <div><div class="card"><h3>결과</h3><div class="out">${r.out.map(o=>`<div class="o"><span>${o[0]}</span><b>${o[1]}</b><em>${o[2]}</em></div>`).join("")}</div>${r.chart?`<div class="mt">${r.chart}</div>`:""}</div>
  <div class="card mt"><h3>계산 근거 <small>줄 단위로 추적</small></h3><div class="trace">${e(r.trace)}</div><p class="small muted" style="margin:8px 0 0">AI가 값을 만들어 내지 않습니다. 정해진 식으로 계산하고 과정을 남깁니다. 범용 LLM에 같은 부하 문제를 주면 결과가 약 6배까지 벌어진다는 보고가 있어 ${fn("S4")}, 계산은 검증된 식이 맡고 AI는 입력 준비와 결과 정리를 돕는 구조가 맞습니다.</p></div></div></div>`}
function twinCard(){return `<div class="card"><h3>디지털 트윈 커미셔닝 <span class="tag">제안</span></h3>
  <table class="t"><tr><td class="muted" style="width:84px">제품</td><td><b>냉수 계통 디지털 트윈(직접 구현)</b><div class="small muted">참고: Hysopt, Jacobs 데이터센터 디지털 트윈, NVIDIA Omniverse DSX, Ramboll의 가상 시운전 사례</div></td></tr><tr><td class="muted">분야</td><td>커미셔닝·TAB(데이터센터 냉수 계통)</td></tr><tr><td class="muted">단계</td><td>설계 검토, TAB·성능확인시험·IST 전</td></tr><tr><td class="muted">용도</td><td>설계값으로 만든 설비 모형을 3D로 운전시키고 냉동기 고장, 정전, 밸브 미조정 시나리오를 넣어 설비 상태·수온·유량 변화를 확인. 현장 시험의 기대 동작과 비교 기준으로 사용</td></tr><tr><td class="muted">HDX 연결</td><td>설계값 연계: HDB의 장비 용량·유량·제어 순서를 입력으로, 시험 실측값과 대조해 차이를 기록</td></tr><tr><td class="muted">연결 수단</td><td>외부 API 없음. 화면은 three.js(오픈소스), 계산은 가상 TAB·제어 시퀀스 검증·가상 IST</td></tr></table>
  <button class="btn p mt" data-go="hdt/twin">유사 화면 열기: 디지털 트윈(3D)</button></div>`}
function vExt(){return head("외부 프로그램 · 도구 MAP","공식 영상(2025-12-12) 작업 화면 판독. 확인: 제품명 식별 / 유력: 화면 구성으로 판단","A","영상 캡처 판독")+tkNav("ext")+
 `<div class="grid g2">${HDT.ext.filter(x=>x.img).map((x,ix)=>(ix===2?twinCard():"")+`<div class="card"><h3>${e(x.name)} <span class="tag ${x.seen==="확인"?"g":"o"}">${x.seen}</span></h3><img src="img/${x.img}" alt="${e(x.name)} 화면 캡처" style="width:100%;border-radius:8px;border:1px solid var(--line);max-height:230px;object-fit:cover" onerror="this.style.display='none'">
  <table class="t mt"><tr><td class="muted" style="width:84px">제품</td><td><b>${e(x.prod)}</b></td></tr><tr><td class="muted">분야</td><td>${e(x.field)}</td></tr><tr><td class="muted">단계</td><td>${e(x.stage)}</td></tr><tr><td class="muted">용도</td><td>${e(x.use)}</td></tr><tr><td class="muted">HDX 연결</td><td>${e(x.link)}</td></tr><tr><td class="muted">연결 수단</td><td>${e(x.api)}</td></tr></table>${x.id==="X-CAD"?`<button class="btn p mt" data-go="hdt/view/dxf">유사 화면 열기: 도면 뷰어(DXF)</button>`:x.id==="X-REVIT"?`<button class="btn p mt" data-go="hdt/view/ifc">유사 화면 열기: 모델 뷰어(IFC)</button>`:x.id==="X-NAVIS"?`<p class="small muted" style="margin:10px 0 0">유사 화면은 BIM 모델링과 같은 모델 뷰어(IFC)</p>`:""}</div>`).join("")}</div>
 <div class="card mt tw"><h3>영상에는 없지만 같은 업무에 쓰는 도구 <small>일반 실무, 하이멕 사용 여부 미확인</small></h3><table class="t"><tr><th>도구</th><th>분야</th><th>단계</th><th>용도</th><th>HDX 연결</th></tr>${HDT.ext.filter(x=>!x.img).map(x=>`<tr><td><b>${e(x.name)}</b><br><span class="small muted">${e(x.prod)}</span></td><td>${e(x.field)}</td><td>${e(x.stage)}</td><td>${e(x.use)}</td><td>${e(x.link)}</td></tr>`).join("")}</table></div>
 <div class="note b mt">영상에서 읽히는 것은 '한 프로그램에서 끝나지 않는다'는 사실입니다. CAD, BIM, 해석, 조명 도구가 각자 파일을 만들고 사람이 그 사이를 잇습니다. HDX는 이 도구들을 대신하는 것이 아니라 입력 조건, 개정, 결과, 승인을 이어 주는 자리입니다. 홈페이지 문구도 '표준 프로세스 / Database / Tool / 기타 환경(CAD 등)을 연결'입니다 ${fn("W1")}.</div>`}
function vView(k){const ifc=k==="ifc";
 return head(ifc?"모델 뷰어(IFC)":"도면 뷰어(DXF)",ifc?"영상의 Revit·Navisworks 화면에 대응. 오픈소스 web-ifc로 IFC 모델을 브라우저에서 직접 읽어 3D 표시, 객체 선택 시 속성 조회":"영상의 2D 설비 CAD 화면에 대응. 덕트 사이징 계산 결과로 계통도를 DXF로 생성하고 오픈소스 dxf-parser로 읽어 표시","D","오픈소스 연계")+
 `<div class="card"><div id="vmount"></div></div>
 <div class="grid g2 mt"><div class="card"><h3>연결 방식</h3><table class="t"><tr><td class="muted" style="width:96px">대응 도구</td><td>${ifc?"Autodesk Revit 2025, Navisworks(영상에서 제품명 확인)":"AutoCAD 계열 2D CAD(영상에서 유력)"}</td></tr><tr><td class="muted">사용 라이브러리</td><td>${ifc?"web-ifc(That Open Company, MPL-2.0), three.js(MIT)":"dxf-parser(MIT)"}</td></tr><tr><td class="muted">계정·키</td><td>불필요. 브라우저에서 직접 처리하며 파일을 외부로 보내지 않음</td></tr><tr><td class="muted">제약</td><td>라이브러리를 인터넷에서 불러오므로 오프라인에서는 열리지 않음${ifc?". RVT 원본은 읽지 못하고 IFC로 내보낸 파일만 가능":". DWG 원본은 읽지 못하고 DXF만 가능. 선·원·호·문자 등 기본 도형 표시"}</td></tr></table></div>
 <div class="card"><h3>HDX에서의 쓰임</h3><ul class="c">${ifc?"<li>모델 객체의 속성(이름, 유형, 태그)을 장비일람표 값과 대조</li><li>객체 고유 ID(GlobalId)를 HDB 산출물·이슈와 잇는 열쇠로 사용</li><li>분야별 모델을 겹쳐 간섭 검토 결과를 WBS 업무에 연결(이 화면은 단일 모델 표시까지)</li>":"<li>계산서(HDT 덕트 사이징)의 값이 도면 치수로 넘어가는 흐름 시연</li><li>도면층·표제 정보를 추출해 HDB 문서 속성으로 등록</li><li>입력값을 바꾸면 도면이 다시 그려지고 DXF로 내려받아 CAD에서 열 수 있음</li>"}</ul><p class="small" style="margin:8px 0 0"><a data-go="hdt/view/${ifc?"dxf":"ifc"}">${ifc?"도면 뷰어(DXF) 보기":"모델 뷰어(IFC) 보기"}</a> · <a data-go="hdt/ext">도구 MAP</a></p></div></div>`}
function vHow(){return head("논문이 밝힌 도입 순서","Excel Toolkit / 외부 프로그램 / 자체 개발 프로그램 / 외부 시스템 및 외부 DB","B","논문 3.4절, Fig.1")+tkNav("")+
 `<div class="grid g2">${HDT.how.map(h=>`<div class="card"><h3>${h.k} ${grade(h.g,h.g)}</h3><p style="margin:0">${h.d}</p><p class="small muted" style="margin:6px 0 0">예: ${h.ex}</p></div>`).join("")}</div>
 <div class="card mt"><h3>논문이 밝힌 순서 ${fn("P2")}</h3><div class="lin"><div class="n"><b>1. 기존 엑셀 수식 툴</b>현업이 쓰던 그대로 등록</div><div class="n"><b>2. 외부 전문 프로그램 연계</b>검증된 도구는 다시 만들지 않음</div><div class="n"><b>3. 자체 프로그램 개발</b>HDT-301·302 등 연구 과제 결과</div><div class="n"><b>4. 현업 스크립트</b>AutoLISP 시범 개발</div><div class="n"><b>5. 외부 DB 연계</b>법규·공공 데이터(계획)</div></div>
 <p style="margin:10px 0 0">이유도 논문에 있습니다. 작은 오류가 큰 위험으로 이어지는 업무라 엔지니어는 검증된 기존 방법을 선호하고, 프로그래머에게 의존하면 수정이 느려진다는 것입니다. 그래서 '현업 엔지니어가 직접 고칠 수 있는 구조'가 설계 원칙입니다.</p></div>
 <div class="card mt"><h3>도구 개발은 2010년부터 이어져 왔다 ${fn("P4")}</h3><div class="lin">${[["2010","RTS 부하계산 프로그램"],["2015","리트로핏 지원 툴"],["2018","DC 공조 설계 지원 DB"],["2019","의사결정 지원 툴"],["2020","DC 공조·전력 설계지원 프로그램"],["2023","설비 기술정보 공유 시스템(특허)"],["2025","HDT-301·302, HDX 플랫폼"]].map(x=>`<div class="n"><b>${x[0]}</b>${x[1]}</div>`).join("")}</div><p class="small muted" style="margin:8px 0 0">하이멕 기술자료의 논문 제목으로 본 흐름입니다. HDT 14종은 갑자기 나온 것이 아니라 15년 동안 과제마다 만든 도구를 한 플랫폼에 모은 결과로 읽힙니다(해석은 지원자 의견).</p></div>
 <div class="card mt tw"><h3>도구별 연결 수단 <small>지원자 정리</small></h3><table class="t"><tr><th>방식</th><th>대상</th><th>장점</th><th>주의</th></tr>
 <tr><td><b>공식 API·애드인</b></td><td>Revit, AutoCAD, Navisworks</td><td>객체·속성 단위로 주고받음</td><td>버전마다 유지 보수</td></tr>
 <tr><td><b>중립 파일</b></td><td>IFC, BCF, gbXML, CSV</td><td>특정 제품에 묶이지 않음</td><td>속성 누락 검증 필요</td></tr>
 <tr><td><b>실행 묶음 등록</b></td><td>CFD, Relux, 수리계산 SW</td><td>API가 없어도 입력·결과·개정을 함께 보관</td><td>사람이 올려야 함</td></tr>
 <tr><td><b>자체 계산 엔진</b></td><td>습공기, 프리쿨링, COP, WUE</td><td>근거 추적, 양식 자동 채움</td><td>검증 책임이 회사에 있음</td></tr>
 <tr><td><b>MCP(에이전트 연결)</b></td><td>Revit 2027 공식 MCP 서버, 사내 도구</td><td>AI가 검증된 도구를 호출</td><td>기술 미리보기 단계</td></tr></table></div>`}

/* ══════════ 벤치마킹 ══════════ */
function vBench(sub){if(sub==="try")return vTry();if(sub==="compare")return vCompare();if(sub==="arch")return vArch();
 return head("국내외 설비 설계 AX 플랫폼","HDP·HDB·HDT 대응 기준 비교. 성과 수치는 실측과 벤더 주장 구분","D","조사일 2026-11-16")+
 `<div class="grid g4">${BENCH.level.map(l=>`<div class="card kpi"><b class="num">${l[0]}</b><span>${l[1]} ${fn(l[3])}</span><em>${l[2]}</em></div>`).join("")}</div>
 <div class="card mt tw"><table class="t"><tr><th>플랫폼</th><th>무엇을 하는가</th><th>AI</th><th>체험</th><th>HDX 대응</th><th>배울 점</th><th>한계</th></tr>
 ${BENCH.platforms.map(p=>`<tr><td><a href="${p[10]}" target="_blank" rel="noopener"><b>${e(p[0])}</b></a><br><span class="small muted">${e(p[1])}</span></td><td>${e(p[2])}<br><span class="tag k">${e(p[3])}</span></td><td>${lv(p[4])}</td><td class="small">${e(p[5])}${p[6]&&p[6]!=="–"?`<br><span class="muted">${e(p[6])}</span>`:""}</td><td>${p[7].split("+").map(x=>`<span class="tag">${x}</span>`).join("")}</td><td>${e(p[8])}</td><td class="small muted">${e(p[9])}</td></tr>`).join("")}</table>
 <p class="small muted" style="margin:8px 0 0">AI 칸: 0 물리·규칙 엔진, 1 자동화, 2 ML·부분 에이전트, 3 LLM 에이전트. 한국에서 가입되는지는 어느 제품도 공개 페이지로 확인하지 못했습니다. 한국의 기계설비 설계 자동화 전용 SaaS는 이번 조사에서 찾지 못했습니다.</p></div>`}
function vTry(){return head("직접 가입해 볼 곳","계정 생성 후 실제 화면 확인이 가능한 곳. 가격·기간은 2026-11-16 공개 페이지 기준","D")+
 `<div class="grid g2">${BENCH.tryOrder.map(t=>{const p=BENCH.platforms.find(p=>t[1].startsWith(p[0].split(" ")[0]));return `<div class="prop"><div class="hd"><b>${t[0]}</b><h3>${e(t[1])}</h3></div><div class="bd"><p style="margin:0 0 8px"><b>볼 것</b> ${e(t[2])}</p>${p?`<p class="small" style="margin:0"><b>하이멕이 배울 점</b> ${e(p[8])}</p><p class="small muted" style="margin:4px 0 0"><b>약점</b> ${e(p[9])}</p><p style="margin:8px 0 0"><a href="${p[10]}" target="_blank" rel="noopener">${p[10]}</a></p>`:""}</div></div>`}).join("")}</div>
 <div class="note o mt">결제 정보 입력이나 약관 동의가 필요한 가입은 본인이 직접 진행해야 합니다. Endra, Augmenta는 데모 예약만 받고, Arup·Mott MacDonald·AECOM·Jacobs·다카사고열학의 플랫폼은 사내용이라 외부에서 볼 수 없습니다.</div>`}
function vCompare(){return head("HDX와 글로벌 기준 비교","공개 근거 기준 판단. '확인 필요'는 외부에서 확인 불가라는 뜻","D")+
 `<div class="card tw"><table class="t"><tr><th>기준</th><th>글로벌 기준점</th><th>HDX(공개 근거)</th><th>판단</th></tr>${BENCH.compare.map(c=>`<tr><td><b>${e(c[0])}</b></td><td>${e(c[1])}</td><td>${e(c[2]).replace(/\((P\d|N\d|R\d|W\d)[^)]*\)/g,(m,id)=>fn(id))}</td><td><span class="tag ${c[4]}">${c[3]}</span></td></tr>`).join("")}</table></div>
 <div class="grid g3 mt"><div class="card"><h3>이미 같은 방향</h3><p style="margin:0">표준 프로세스, 중앙 DB, 검증된 계산 도구라는 뼈대는 Arup·Mott MacDonald와 같습니다. 규모가 수백 배 큰 회사들과 구조가 같다는 점이 강점입니다.</p></div>
 <div class="card"><h3>밖에서 안 보이는 것</h3><p style="margin:0">얼마나 쓰이는지, 얼마나 줄었는지의 실측값. 그리고 BIM 모델을 직접 만들거나 고치는 기능.</p></div>
 <div class="card"><h3>하이멕만 가질 수 있는 것</h3><p style="margin:0">설계값과 커미셔닝·TAB 실측값을 한곳에 묶은 자료. 설계만 하는 글로벌 회사는 갖기 어렵습니다.</p></div></div>`}

function vArch(){const A=window.ARCH,cols=[A.hdx,...A.platforms];
 return head("플랫폼 구성도 비교","공식 구성요소를 같은 6개 층으로 재배열해 HDX와 비교","D","조사일 "+A.date)+
 `<div class="card tw"><table class="t stack"><tr><th style="min-width:92px">층</th>${cols.map((c,i)=>`<th class="${i?"":"me"}">${e(c.name)}<br><span class="small muted" style="font-weight:500">${e(c.kind)}</span></th>`).join("")}</tr>
 ${A.layers.map((L,r)=>`<tr><td><b>${L[0]}</b><br><span class="small muted">${L[1]}</span></td>${cols.map((c,i)=>{const v=c.stack[r];return `<td class="${i?"":"me"} ${v&&v[0]?"":"none"}">${v&&v[0]?`<b>${e(v[0])}</b>${v[1]?`<br><span class="small">${e(v[1])}</span>`:""}`:`<span class="small muted">${e(v&&v[1]||"해당 층 없음")}</span>`}</td>`}).join("")}</tr>`).join("")}
 <tr><td><b>데이터 단위</b></td>${cols.map((c,i)=>`<td class="${i?"":"me"}">${e(c.unit)}</td>`).join("")}</tr>
 <tr><td><b>범위</b><br><span class="small muted">설계→시공→운영</span></td>${cols.map((c,i)=>`<td class="${i?"":"me"}">${e(c.scope)}</td>`).join("")}</tr></table>
 <p class="small muted" style="margin:8px 0 0">층은 아래에서 위로 쌓입니다(표는 위가 사용자 쪽). 회색 칸은 공식 자료에서 해당 층을 찾지 못한 곳입니다.</p></div>
 <div class="grid g2 mt">${A.platforms.map(p=>`<div class="card"><h3>${e(p.name)} <small>${e(p.kind)}</small></h3><p style="margin:0 0 8px">${e(p.sum)}</p>
  <div class="lin">${p.flow.map(x=>`<div class="n"><b>${e(x[0])}</b>${e(x[1])}</div>`).join("")}</div>
  <table class="t mt"><tr><td class="muted" style="width:84px">도구 연결</td><td>${e(p.connect)}</td></tr><tr><td class="muted">AI</td><td>${e(p.ai)}</td></tr><tr><td class="muted">배울 점</td><td>${p.learn.map(x=>`<div>· ${e(x)}</div>`).join("")}</td></tr><tr><td class="muted">한계</td><td class="muted">${p.limit.map(x=>`<div>· ${e(x)}</div>`).join("")}</td></tr><tr><td class="muted">공식 그림</td><td class="small">${p.src.map(s=>`<a href="${s[1]}" target="_blank" rel="noopener">${e(s[0])}</a>`).join("<br>")}</td></tr></table></div>`).join("")}</div>
 <div class="card mt"><h3>다섯 구성도에서 읽은 것</h3><ul class="c big">${A.takeaways.map(x=>`<li>${e(x)}</li>`).join("")}</ul></div>`}

/* ══════════ 함의·제언 ══════════ */
function vInsight(){const I=BENCH.insights;
 return head("함의와 제언","문제의식 / 실제 구현 / 벤치마킹 / 시사점 / 제언","D","지원자 의견")+
 `<div class="card sec"><h3><span class="tag v">1 문제의식</span> 설비 설계 엔지니어링의 DX·AX는 지금 어느 수준인가</h3><ul class="c big">${I.problem.map(x=>`<li>${e(x)}</li>`).join("")}</ul><p class="small muted">근거 ${fn("S1")}${fn("S2")}${fn("S3")}${fn("S4")} · <a data-go="bench">플랫폼 표 보기</a></p></div>
 <div class="card sec mt"><h3><span class="tag v">2 실제 구현</span> 논문과 발표, 영상으로 HDX를 직접 만들어 봄</h3><ul class="c big">${I.build.map(x=>`<li>${e(x)}</li>`).join("")}</ul><p class="small muted">근거 논문 ${fn("P1")}${fn("P2")}${fn("P3")}, 영상 ${fn("V1")}, 보도 ${fn("N1")}${fn("R1")} · <a data-go="evidence">근거 등급 보기</a></p></div>
 <div class="card sec mt"><h3><span class="tag v">3 벤치마킹</span> 현업과 이어지는 부분을 더 만들고 다른 플랫폼에서 배울 점을 담음</h3><ul class="c big">${I.bench.map(x=>`<li>${e(x)}</li>`).join("")}</ul><p class="small"><a data-go="hdp/map/cx/X-403">업무 화면 예</a> · <a data-go="hdb/link">변경 영향 시연</a> · <a data-go="bench/try">직접 가입해 볼 곳</a></p></div>
 <div class="mt2"><h3 style="font-size:15px;margin-bottom:10px"><span class="tag v">4 시사점</span> 만들어 보니 알게 된 것</h3><div class="grid g2">${I.lessons.map(l=>`<div class="card"><h3>${e(l[0])}</h3><p style="margin:0" class="big">${e(l[1])}</p></div>`).join("")}</div></div>
 <div class="mt2"><h3 style="font-size:15px;margin-bottom:10px"><span class="tag v">5 제언</span> 하이멕의 AX가 갈 방향</h3><div class="grid g3">${I.proposals.map((p,i)=>`<div class="prop"><div class="hd"><b>${i+1}</b><h3>${e(p[0])}</h3></div><div class="bd"><p style="margin:0 0 8px" class="big">${e(p[1])}</p><ul class="c">${p[2].map(x=>`<li>${e(x)}</li>`).join("")}</ul><p class="small muted" style="margin:8px 0 0">${e(p[3])}</p></div></div>`).join("")}</div></div>
 <div class="card mt2"><h3>각주</h3><ol class="fnl" style="padding-left:0;list-style:none">${BENCH.refs.map(r=>`<li><b>[${r[0]}]</b> ${e(r[1])}</li>`).join("")}</ol></div>`}
function vEvidence(){return head("근거 등급과 출처","항목별 근거 등급, 출처, 미확인 사항","A")+
 `<div class="grid g4">${Object.entries(GN).map(([g,n])=>`<div class="card">${grade(g,n)}<p class="small" style="margin:8px 0 0">${{A:"영상에서 화면이 직접 식별됨",B:"회사가 쓴 논문과 홈페이지",C:"기사, 행사 발표 보도, 구축사 공개 글",D:"공개 기준과 일반 실무로 지원자가 채움"}[g]}</p></div>`).join("")}</div>
 <div class="card mt tw"><table class="t"><tr><th>항목</th><th>등급</th><th>출처</th><th>이 사이트의 어디</th></tr>${BENCH.evidence.map(x=>`<tr><td>${e(x[0])}</td><td>${grade(x[1],x[1])}</td><td>${e(x[2])}</td><td class="small">${e(x[3])}</td></tr>`).join("")}</table></div>
 <div class="card mt"><h3>확인하지 못한 것</h3><ul class="c"><li>로그인 이후의 실제 화면(대시보드, 메뉴 배치, 색, 글꼴)</li><li>HDT 14종의 전체 이름과 각 도구의 계산 방식</li><li>HDB의 실제 문서 수와 데이터 구조, 기술 스택</li><li>CAD·BIM과의 현재 연결 수준, RAG 구성</li><li>영상 속 CFD와 2D CAD의 정확한 제품명</li></ul><p class="small muted">면접에서 물어볼 수 있다면 가장 먼저 확인하고 싶은 항목입니다.</p></div>
 <div class="card mt"><h3>출처</h3><ol class="fnl" style="padding-left:0;list-style:none">${BENCH.refs.map(r=>`<li><b>[${r[0]}]</b> ${e(r[1])} ${r[2].length===1?grade(r[2],r[2]):""}</li>`).join("")}</ol></div>`}

/* ══════════ 디지털 트윈 커미셔닝 ══════════ */
function vTwin(){const steps=[["설계 모델","부하, 장비 용량, 배관 저항, 제어 순서(HDB의 설계값)"],["가상 TAB","분기 유량·밸브 설정 사전 계산"],["제어 시퀀스 검증","고장 시 예비기 투입 시간표"],["가상 IST","정전·냉방 상실 시 버티는 시간"],["현장 시험","같은 시나리오로 실측"],["대조·환류","예측과 실측 차이를 HDB에 기록, 다음 설계 보정"]];
 return head("디지털 트윈 커미셔닝","설계값으로 만든 냉수 계통 모형을 시간에 따라 운전시키고 고장 시나리오를 넣어 설비 반응을 확인. 14종 밖의 제안","D","제안")+
 `<div class="card"><div id="twmount"></div></div>
 <div class="card mt"><h3>흐름</h3><div class="lin">${steps.map(x=>`<div class="n"><b>${x[0]}</b>${x[1]}</div>`).join("")}</div></div>
 <h3 class="mt2" style="font-size:13.5px">같은 설계값으로 돌리는 계산 도구</h3><div class="grid g3 mt">${HDT.proposed.map(tcard).join("")}</div>
 <div class="card mt tw"><h3>벤치마킹 대상과의 대응</h3><table class="t"><tr><th>참고한 플랫폼</th><th>그 플랫폼이 하는 일</th><th>여기서 만든 것</th><th>차이</th></tr>
 <tr><td><b>Hysopt</b><br><span class="small muted">설비(배관) 설계 특화</span></td><td>배관 계통 모델로 유량·밸브 설정을 계산해 시운전까지 연결</td><td><a data-go="hdt/run/vtab">가상 TAB</a></td><td>분기 간 상호 영향을 단순화한 근사. 그 제품의 계산 엔진을 쓰지 않음</td></tr>
 <tr><td><b>Jacobs 데이터센터 디지털 트윈</b><br><span class="small muted">엔지니어링사 솔루션</span></td><td>제어·시스템 검증 모듈: 운전 시퀀스를 설치 전 가상 시험</td><td><a data-go="hdt/run/vseq">제어 시퀀스 검증</a></td><td>상태 전이만 흉내 낸 단순 모형. 실제 제어반 로직과 연결되지 않음</td></tr>
 <tr><td><b>NVIDIA Omniverse DSX</b><br><span class="small muted">디지털 트윈 참조 구성</span></td><td>전력·냉각 해석을 하나의 모델에 연결, 대리모델로 가정 시나리오 응답</td><td><a data-go="hdt/run/vcx">가상 IST</a></td><td>에너지 수지 한 줄 계산. 3D·해석 연동 없음</td></tr></table>
 <p class="small muted" style="margin:8px 0 0">세 플랫폼 모두 외부에서 불러 쓸 수 있는 무료 API가 없어 방식만 참고해 직접 구현했습니다. HVAKR은 설계 전용이라 커미셔닝 기능은 확인되지 않았습니다.</p></div>
 <div class="note mt">디지털 트윈이라고 부르려면 설계 모델과 현장 실측이 같은 장비·계통 단위로 묶여 서로 갱신돼야 합니다. 여기서는 설계값으로 시험을 미리 계산하고 측정값과 대조하는 단계까지만 구현했습니다. 계측 데이터 자동 수집과 제어 로직 에뮬레이션은 다음 단계입니다.</div>`}

/* ══════════ 출처 ══════════ */
function srcLinks(ids){return (ids||[]).map(id=>{const l=SRC.links[id];return l?`<div><a href="${l[1]}" target="_blank" rel="noopener">${e(l[0])}</a></div>`:""}).join("")}
function kindTag(k){return k.split("·").map(x=>`<span class="tag ${x==="가"?"g":x==="나"?"":"o"}" title="${e(SRC.kinds[x]||"")}">${x}</span>`).join("")}
function srcTable(rows){return `<div class="tw"><table class="t"><tr><th style="min-width:210px">항목</th><th>구분</th><th>어디서 가져왔나</th><th style="min-width:230px">출처</th></tr>${rows.map(r=>`<tr><td><b>${e(r[0])}</b></td><td style="text-align:center;white-space:nowrap">${kindTag(r[1])}</td><td>${e(r[2])}</td><td class="small">${srcLinks(r[3])||`<span class="muted">–</span>`}</td></tr>`).join("")}</table></div>`}
function vSource(sub){const tabs=`<div class="disc">${[["","요약"],["hdp","업무 프로세스"],["hdb","데이터베이스"],["hdt","설계 도구"],["etc","뷰어·화면·기타"]].map(x=>`<button class="${(sub||"")===x[0]?"on":""}" data-go="source${x[0]?"/"+x[0]:""}">${x[1]}</button>`).join("")}</div>`;const legend=tabs+`<div class="card"><h3>구분</h3><div class="grid g3">${Object.entries(SRC.kinds).map(([k,v])=>`<div>${kindTag(k)} <b>${v}</b><div class="small muted">${{"가":"논문, 홈페이지, 공식 영상·블로그, 보도, 구축사 공개 글","나":"고시·기준 명칭, ASHRAE 등 교재의 식, 오픈소스 라이브러리와 공개 샘플","다":"특정 문헌에서 옮기지 않고 일반 실무 지식으로 쓴 것, 예시값, 가상 데이터"}[k]}</div></div>`).join("")}</div></div>`;
 if(sub==="hdp")return head("출처 · 업무 프로세스","분야별 프로세스, 설계조건·적용 법규, 양식, 유사 프로젝트의 출처","A")+legend+
  `<div class="card mt"><h3>전 분야 공통</h3>${srcTable(SRC.hdp.common)}</div>
  <div class="card mt tw"><h3>분야별</h3><table class="t"><tr><th>분야</th><th>단계 구분의 출처</th><th>업무 수 / 체크사항</th><th style="min-width:300px">업무에 인용한 법규·기준(명칭)</th><th>출처 링크</th></tr>
  ${HDP.disciplines.map(d=>{const ts=TASKS.filter(t=>t.disc===d.id),refs=[...new Set(ts.flatMap(t=>t.refs))],b=SRC.hdp.byDisc[d.id];return `<tr><td><b>${d.name}</b><br><span class="small muted">${d.sub}</span></td><td>${e(b[0])}</td><td class="num" style="text-align:center">${ts.length} / ${ts.reduce((x,t)=>x+t.checks.length,0)}<br>${kindTag("다")}</td><td class="small">${refs.map(r=>`<span class="tag">${e(r)}</span>`).join("")}</td><td class="small">${srcLinks(b[1])}</td></tr>`}).join("")}</table></div>
  <div class="card mt tw"><h3>업무별 근거 문헌 <small>${Object.keys(SRC.task).length}개 업무 · 확인 ${Object.values(SRC.task).filter(x=>x[2]==="확인").length}, 일부 근거 ${Object.values(SRC.task).filter(x=>x[2]==="일부").length}</small></h3><table class="t"><tr><th>업무</th><th style="min-width:250px">근거 문헌·조문</th><th>문헌에 적힌 내용(요지)과 한계</th><th>확인</th></tr>
  ${TASKS.map(t=>{const x=SRC.task[t.id];if(!x)return "";return `<tr><td style="white-space:nowrap"><a data-go="hdp/map/${t.disc}/${t.id}"><b>${t.id}</b></a><br><span class="small">${e(t.name)}</span></td><td>${e(x[0])}<div class="small">${x[3].map(d=>SRC.docs[d]&&SRC.docs[d][3]?`<a href="${SRC.docs[d][3]}" target="_blank" rel="noopener">${d}</a>`:d).join(" · ")}</div></td><td class="small">${e(x[1])}</td><td style="text-align:center"><span class="tag ${x[2]==="확인"?"g":"o"}">${x[2]==="일부"?"일부":x[2]}</span></td></tr>`}).join("")}</table></div>
  <div class="card mt tw"><h3>문헌 목록 <small>발행 기관, 명칭, 번호·시행일, 확인 범위</small></h3><table class="t"><tr><th>번호</th><th>발행 기관</th><th>명칭</th><th>번호·시행일</th><th>확인 범위</th></tr>
  ${Object.entries(SRC.docs).map(([k,d])=>`<tr><td><b>${k}</b></td><td>${e(d[0])}</td><td>${d[3]?`<a href="${d[3]}" target="_blank" rel="noopener">${e(d[1])}</a>`:e(d[1])}</td><td class="small">${e(d[2])}</td><td class="small">${e(d[4])}</td></tr>`).join("")}</table></div>
  <div class="card mt tw"><h3>양식: 공식 서식이 있는 것</h3><table class="t"><tr><th>이 사이트의 양식 이름</th><th>대응하는 공식 서식</th></tr>${SRC.forms.map(f=>`<tr><td><b>${e(f[0])}</b></td><td>${e(f[1])}</td></tr>`).join("")}</table><p class="small" style="margin:8px 0 0">${e(SRC.formsNone)}</p></div>
  <div class="card mt tw"><h3>조사로 바로잡은 것</h3><table class="t"><tr><th>처음 적은 내용</th><th>확인 결과</th><th>조치</th></tr>${SRC.fixes.map(f=>`<tr><td>${e(f[0])}</td><td>${e(f[1])}</td><td>${e(f[2])}</td></tr>`).join("")}</table></div>
  <div class="note mt">${e(SRC.hdp.lawNote)}</div>`;
 if(sub==="hdb")return head("출처 · 데이터베이스","규모 수치, 산출물·프로젝트 정보, 디지털 도서관, 표준 자료의 출처","A")+legend+`<div class="card mt"><h3>항목별</h3>${srcTable(SRC.hdb)}</div>`;
 if(sub==="hdt")return head("출처 · 설계 도구","도구 이름과, 실행되는 도구의 입력값·예시 조건·결과·계산 근거의 출처","A")+legend+
  `<div class="card mt"><h3>도구 이름</h3>${srcTable(SRC.hdtNames)}</div>
  <div class="card mt tw"><h3>실행되는 도구 ${Object.keys(TOOLS).length}종</h3><table class="t"><tr><th style="min-width:130px">도구</th><th>입력 항목</th><th>기본값·예시 조건</th><th>결과 항목</th><th style="min-width:260px">계산 근거</th><th>검증 상태</th></tr>
  ${Object.keys(TOOLS).map(k=>{const s=SRC.tools[k]||{},T=TOOLS[k];return `<tr><td><a data-go="hdt/run/${k}"><b>${e(T.title)}</b></a></td><td>${e(s.in||"")}</td><td>${e(s.def||"")}<div class="small muted">현재 기본값: ${T.fields.map(f=>`${f[1]} ${f[2]}${String(f[3]).startsWith("sel:")?"":f[3]}`).join(", ")}</div></td><td>${e(s.out||"")}</td><td>${e(s.calc||"")}<br>${kindTag(s.kind||((s.refs||[]).length?"나":"다"))}<div class="small">${srcLinks(s.refs)}</div></td><td class="small">${e(s.chk||"")}</td></tr>`}).join("")}</table></div>
  <div class="card mt"><h3>근거 문헌을 찾지 못한 것</h3><ul class="c">${(SRC.notFound||[]).map(x=>`<li>${e(x)}</li>`).join("")}</ul></div>
  <div class="note mt">기본값 가운데 고시·평년값·표준에서 가져온 것은 위 표에 문헌과 함께 적었고, 나머지는 "예시"라고 표시했습니다. 표의 [확인]은 페이지 본문을 직접 읽은 것, [요약]은 검색 요약으로만 본 것, [2차]는 2차 자료입니다. 하이멕 도구의 계산 로직은 공개되지 않아 알 수 없습니다.</div>`;
 if(sub==="etc")return head("출처 · 뷰어·화면·기타","","A")+legend+`<div class="card mt"><h3>항목별</h3>${srcTable(SRC.etc)}</div>
  <div class="card mt"><h3>전체 출처 목록</h3><ol class="fnl" style="padding-left:18px">${Object.values(SRC.links).map(l=>`<li><a href="${l[1]}" target="_blank" rel="noopener">${e(l[0])}</a></li>`).join("")}</ol></div>`;
 return head("출처","이 사이트의 각 내용을 어디서 가져왔는지 정리","A")+legend+
  `<div class="card mt tw"><h3>한눈에</h3><table class="t"><tr><th>내용</th><th>구분</th><th>설명</th></tr>${SRC.summary.map(r=>`<tr><td><b>${e(r[0])}</b></td><td style="text-align:center">${kindTag(r[1])}</td><td>${e(r[2])}</td></tr>`).join("")}</table></div>
  <div class="grid g4 mt">${[["hdp","업무 프로세스","분야별 단계, 법규, 양식, 유사 프로젝트"],["hdb","데이터베이스","4,300건, 산출물, 도서관, 표준 자료"],["hdt","설계 도구","도구 이름, 입력값, 예시, 계산 근거"],["etc","뷰어·화면·기타","뷰어, 샘플 모델, 화면 형태"]].map(x=>`<div class="pc" data-go="source/${x[0]}"><b>${x[1]}</b><div class="s">${x[2]}</div></div>`).join("")}</div>
  <div class="note mt">'가'는 하이멕이 스스로 공개한 내용이고, '다'는 제가 채운 내용입니다. 업무 이름·체크사항·양식·프로젝트 데이터·입력 예시값은 모두 '다'이므로 하이멕의 실제 내용과 다를 수 있습니다.</div>`}

/* ══════════ 라우터·이벤트 ══════════ */
function render(){let r=(location.hash||"#/hub").slice(2)||"hub";const s=r.split("/");let html,side=r;
 switch(s[0]){
  case"hub":html=vHub();break;
  case"hdp":if(s[1]==="process"){html=s[2]==="new"?vProcessNew():vProcess();side="hdp/process"}else if(s[1]==="biz"){html=vBiz()}else{html=vMap(s[2],s[3]);side="hdp/map"}break;
  case"hdb":({dash:()=>html=vDash(),search:()=>html=vSearch(),projects:()=>html=vProjects(),project:()=>html=vProject(s[2]),forms:()=>html=vForms(),std:()=>html=vStd(),equip:()=>html=vEquip(),link:()=>html=vLink(),maplist:()=>html=vMapList(),toolkits:()=>html=vToolkits(),docs:()=>html=vDocs(),wbs:()=>html=vWbs(),org:()=>html=vOrg(),pwbs:()=>html=vPwbs(s[2]),work:()=>html=vWork(s[2]),pdocs:()=>html=vPdocs(s[2])}[s[1]]||(()=>{html=vDash();side="hdb/dash"}))();if(["project","pwbs","work","pdocs"].includes(s[1]))side="hdb/"+s[1];break;
  case"hdt":if(s[1]==="twin"){html=vTwin();side="hdt/twin"}else if(s[1]==="excel")html=vExcel();else if(s[1]==="extdb")html=vExtDb();else if(s[1]==="view"){html=vView(s[2]);side="hdt/view/"+(s[2]==="ifc"?"ifc":"dxf")}else if(s[1]==="run"){html=vRun(s[2]);side="hdt/list"}else if(s[1]==="ext")html=vExt();else if(s[1]==="how")html=vHow();else{html=vTools();side="hdt/list"}break;
  case"bench":html=vBench(s[1]);break;
  case"insight":html=vInsight();break;
  case"evidence":html=vEvidence();break;
  case"source":html=vSource(s[1]);break;
  default:html=vHub();side="hub"}
 shell(side);const keep=(s[0]==="hdp"&&s[1]!=="process")||s[0]==="hdb"||s[1]==="link"||s[1]==="run"||s[1]==="search"||s[1]==="dash";const sc=$(".main").scrollTop;$("#view").innerHTML=html+`<div class="foot">공개 자료 기반 재구성본 · 프로젝트·문서 데이터는 가상 · 근거 등급은 [근거] 메뉴 참조</div>`;$(".main").scrollTop=keep&&render.last===s.slice(0,3).join("/")?sc:0;render.last=s.slice(0,3).join("/");if(window.TWIN){TWIN.unmount();if(s[0]==="hdt"&&s[1]==="twin")TWIN.mount(document.querySelector("#twmount"))}if(window.VIEWERS){VIEWERS.unmount();if(s[0]==="hdt"&&s[1]==="view")VIEWERS.mount(s[2]==="ifc"?"ifc":"dxf",document.querySelector("#vmount"))}}
const go=r=>{if(location.hash==="#/"+r)render();else location.hash="#/"+r};
document.addEventListener("click",ev=>{const ac=ev.target.closest("[data-act]");if(ac&&ac.tagName!=="SELECT"){ev.preventDefault();ev.stopPropagation();if(act(ac.dataset.act,ac))render();return}
 const g=ev.target.closest("[data-go]");if(g){ev.preventDefault();ev.stopPropagation();go(g.dataset.go);return}
 const sp=ev.target.closest("[data-setpj]");if(sp){cur=sp.dataset.setpj;store.set("pj",cur);$("#curPj").value=cur;render();return}
 const pr=ev.target.closest("[data-preset]");if(pr){const key=location.hash.split("/")[3],T=TOOLS[key];store.set("in."+key,Object.assign(store.get("in."+key,{}),T.presets[pr.dataset.preset][1]));render();return}
 if(ev.target.id==="qreset"){q={text:"",type:"",disc:"",doc:"",stage:""};render()}});
document.addEventListener("change",ev=>{const t=ev.target;
 if(t.dataset.act){if(act(t.dataset.act,t))render();return}
 if(t.dataset.chk){const k="chk."+t.dataset.chk,a=store.get(k,[]),i=+t.dataset.i;store.set(k,t.checked?[...new Set([...a,i])]:a.filter(x=>x!==i));render()}
 else if(t.dataset.q){q[t.dataset.q]=t.value;render()}
 else if(t.dataset.pq){pq[t.dataset.pq]=t.value;render()}
 else if(t.dataset.in){const key=location.hash.split("/")[3],o=store.get("in."+key,{});o[t.dataset.in]=t.type==="number"?Number(t.value):t.value;store.set("in."+key,o);render()}
 else if(t.dataset.as){const a=store.get("assume",HDB.scale.assume);a[t.dataset.as]=Math.max(0,Number(t.value)||0);store.set("assume",a);render()}
 else if(t.id==="curPj"){cur=t.value;store.set("pj",cur);render()}});
document.addEventListener("input",ev=>{const t=ev.target;
 if(t.id==="oat"){store.set("oat",Number(t.value));render();const n=$("#oat");if(n)n.focus()}
 else if(t.id==="pqtext"){pq.text=t.value;const pos=t.selectionStart;render();const n=$("#pqtext");if(n){n.focus();n.setSelectionRange(pos,pos)}}
 else if(t.id==="qtext"){q.text=t.value;const pos=t.selectionStart;render();const n=$("#qtext");if(n){n.focus();n.setSelectionRange(pos,pos)}}});
window.addEventListener("hashchange",render);

/* 로그인: 어떤 값이든 들어간다. 인증·전송 없음. */
function enter(){$("#login").classList.add("hide");$("#app").classList.remove("hide");try{sessionStorage.setItem("hdxv2.in","1")}catch(_){}render()}
(function boot(){const L=$("#login");for(let i=0;i<26;i++){const b=document.createElement("div"),s=40+Math.random()*150;b.className="bokeh";b.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${.25+Math.random()*.6}`;L.prepend(b)}
 $("#curPj").innerHTML=PJ.map(p=>`<option value="${p.id}" style="color:#16223a" ${p.id===cur?"selected":""}>${e(p.name)}</option>`).join("");
 $("#loginForm").addEventListener("submit",ev=>{ev.preventDefault();enter()});
 $("#logout").addEventListener("click",()=>{try{sessionStorage.removeItem("hdxv2.in")}catch(_){}$("#app").classList.add("hide");L.classList.remove("hide")});
 $("#brand").addEventListener("click",()=>go("hub"));
 let inn=false;try{inn=sessionStorage.getItem("hdxv2.in")==="1"}catch(_){}if(inn||/[?&]skip=1/.test(location.search))enter();})();
})();
