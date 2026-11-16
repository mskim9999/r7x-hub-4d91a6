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
const MODS=[["hub","HUB","허브"],["hdp","HDP","업무 프로세스"],["hdb","HDB","데이터베이스"],["hdt","HDT","설계 도구"],null,["bench","벤치마킹",""],["insight","함의·제언",""],["evidence","근거",""],["source","출처",""]];
const SIDE={
 hub:[["",[["hub","HDX 허브"]]]],
 hdp:[["HDP · 디지털 프로세스",[["hdp/map","Workflow Map 관리","분야별 흐름"],["hdp/process","Process 관리","WBS 표준"],["hdp/biz","Workflow Biz 관리","비즈니스별"]]]],
 hdb:[["HDB · 전사",[["hdb/dash","Dashboard"],["hdb/search","통합문서/DB 검색"],["hdb/projects","프로젝트 관리"],["hdb/forms","양식 표준"],["hdb/std","기준 표준정보","디지털 도서관"],["hdb/equip","장비 DB"]]],
      ["HDB · 프로젝트",[["hdb/project","프로젝트 개요·WBS·산출물"],["hdb/link","산출물 데이터 연동","변경 영향"]]]],
 hdt:[["HDT · 디지털 툴킷",[["hdt/list","Toolkit List","14종"],["hdt/ext","도구 MAP","영상 판독"],["hdt/view/dxf","도면 뷰어(DXF)","2D CAD"],["hdt/view/ifc","모델 뷰어(IFC)","BIM"],["hdt/how","연결 방식","API·자체 개발"]]]],
 bench:[["벤치마킹",[["bench","국내외 플랫폼"],["bench/try","직접 가입해 볼 곳"],["bench/compare","HDX와 비교"],["bench/arch","플랫폼 구성도","5개 비교"]]]],
 insight:[["함의",[["insight","문제의식 → 제언"]]]],
 evidence:[["근거",[["evidence","근거 등급과 출처"]]]],
 source:[["출처",[["source","요약"],["source/hdp","업무 프로세스"],["source/hdb","데이터베이스"],["source/hdt","설계 도구"],["source/etc","뷰어·화면·기타"]]]]
};
function shell(route){const m=route.split("/")[0];
  $("#mods").innerHTML=MODS.map(x=>x?`<a href="#/${x[0]}" class="${x[0]===m?"on":""}">${x[1]}${x[2]?` <i>${x[2]}</i>`:""}</a>`:`<span class="sep"></span>`).join("");
  $("#subnav").innerHTML=(SIDE[m]||[]).flatMap(g=>g[1]).filter((x,i,arr)=>arr.length>1).map(x=>`<a href="#/${x[0]}" class="${route===x[0]||(route.startsWith(x[0]+"/")&&x[0].includes("/"))?"on":""}">${x[1]}</a>`).join("");
  $("#side").innerHTML=(SIDE[m]||[]).map(g=>(g[0]?`<h5>${g[0]}</h5>`:"")+g[1].map(a=>`<a href="#/${a[0]}" class="${route===a[0]||(route.startsWith(a[0]+"/")&&a[0].includes("/"))?"on":""}">${a[1]}${a[2]?`<em>${a[2]}</em>`:""}</a>`).join("")).join("");}
const head=(t,p,g,gt)=>`<div class="crumb">${crumb()}</div><div class="ph"><div><h1>${t}</h1>${p?`<p>${p}</p>`:""}</div><span style="display:flex;gap:10px;align-items:center">${srcLink()}${g?grade(g,gt):""}</span></div>`;
function srcLink(){const m=(location.hash||"#/hub").slice(2).split("/")[0],t={hdp:"source/hdp",hdb:"source/hdb",hdt:"source/hdt",hub:"source",bench:"source/etc",insight:"source",evidence:"source"}[m];return t?`<a class="btn" style="padding:2px 9px;font-size:12px" data-go="${t}">출처</a>`:""}
function crumb(){const r=(location.hash||"#/hub").slice(2),m=r.split("/")[0],M=MODS.find(x=>x&&x[0]===m),it=(SIDE[m]||[]).flatMap(g=>g[1]).filter(x=>r===x[0]||r.startsWith(x[0]+"/")).sort((x,y)=>y[0].length-x[0].length)[0];return ["HOME",M?M[1]:"",it&&it[0]!==m?it[1]:""].filter(Boolean).join(" > ")}

/* ══════════ HUB ══════════ */
function vHub(){const p=curPj(),my=TASKS.filter(t=>t.gate).slice(0,5);
 return `<div class="hero"><div class="ring"></div><h1>HDX Hub</h1><p>표준 프로세스 / Database / Tool / 기타 환경(CAD 등)을 연결한 통합 설계 환경 ${fn("W1")}</p></div>
 <div class="tri">
  <div class="mod" data-go="hdp/map"><div class="hd"><b>HDP</b><span>( Process ) 업무 프로세스</span></div><div class="bd"><ul class="c"><li>기계·전기·통신·소방 표준 프로세스 ${fn("P2")}</li><li>PM·CM, 커미셔닝으로 확장 ${fn("N2")}</li><li>업무 ${TASKS.length}개, 체크사항 ${TASKS.reduce((a,t)=>a+t.checks.length,0)}개(재구성)</li></ul></div></div>
  <div class="mod" data-go="hdb/search"><div class="hd"><b>HDB</b><span>( Database ) 데이터베이스</span></div><div class="bd"><ul class="c"><li>기술·경험·산출물의 DB화 ${fn("W1")}</li><li>누적 4,300건+ 프로젝트 자료 ${fn("N1")}</li><li>조건 검색과 유사 프로젝트 참고 ${fn("R1")}</li></ul></div></div>
  <div class="mod" data-go="hdt/list"><div class="hd"><b>HDT</b><span>( Tool ) 설계 도구</span></div><div class="bd"><ul class="c"><li>디지털 설계지원도구 14종 ${fn("N1")}</li><li>자체 개발, Excel Toolkit, 외부 프로그램 ${fn("P2")}</li><li>이 사이트에서 실행되는 계산기 ${Object.keys(TOOLS).length}종</li></ul></div></div>
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
 return head("Workflow Map 관리",`분야별 표준 업무 흐름. 업무 선택 시 체크사항·양식·기준·도구·유사 프로젝트 표시`,D.grade,D.note)+
 `<div class="disc">${HDP.disciplines.map(d=>`<button class="${d.id===disc?"on":""}" data-go="hdp/map/${d.id}">${d.name} <span class="small" style="opacity:.7">${d.sub}</span></button>`).join("")}</div>
 <div class="card"><div class="flow">${phasesOf(disc).map(p=>`<div class="phase"><div class="ph2">${p.name}<small>${p.sub}</small></div>${ts.filter(t=>t.ph===p.id).map(t=>`<div class="task ${t.gate?"gate":""} ${t.id===sel.id?"on":""}" data-go="hdp/map/${disc}/${t.id}"><b>${e(t.name)}</b><div class="m"><i>${t.id}</i><i>체크 ${t.checks.length}</i><i>도구 ${t.tools.length}</i>${t.gate?`<i style="color:#b3225a">승인 게이트</i>`:""}</div></div>`).join("")}</div>`).join("")}</div>
 <p class="small muted" style="margin:8px 0 0">분야와 단계 구분은 논문·보도에 근거(${D.grade}등급). 각 업무의 이름과 내용은 공개 기준과 일반 실무로 채운 재구성(D등급)이며 하이멕 내부 표준이 아닙니다.</p></div>
 <div class="mt" id="taskDetail">${taskDetail(sel)}</div>`}
function taskDetail(t){const done=store.get("chk."+t.id,[]),p=curPj(),sims=similar(p,t.tags).slice(0,3),pct=Math.round(done.length/t.checks.length*100);
 const docs=DOCS.filter(d=>d.wbs===t.id&&d.pj.id!==p.id&&sims.some(s=>s.p.id===d.pj.id)).slice(0,4);
 return `<div class="card" style="border-left:4px solid var(--blue)"><h3>${t.id} ${e(t.name)} <small>${e(t.role)} · 산출물 ${t.outs.map(o=>`<span class="tag">${e(o)}</span>`).join("")}</small></h3>
 <div class="detail">
  <div><h4 class="small" style="margin-bottom:6px">체크사항 <span class="muted">${done.length}/${t.checks.length}</span></h4><div class="prog"><i style="width:${pct}%"></i></div>
   ${t.checks.map((c,i)=>`<label class="chk ${done.includes(i)?"done":""}"><input type="checkbox" data-chk="${t.id}" data-i="${i}" ${done.includes(i)?"checked":""}><span>${e(c)}</span></label>`).join("")}
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
function vProcess(){return head("Process 관리 · WBS 표준","전 분야 표준 업무 목록. WBS 번호로 HDB 산출물, HDT 도구와 연결","D","업무 내용은 재구성")+
 `<div class="card tw"><table class="t"><tr><th>WBS</th><th>분야</th><th>단계</th><th>업무</th><th>담당</th><th>산출물</th><th>체크</th><th>도구</th></tr>
 ${TASKS.map(t=>{const d=HDP.disciplines.find(x=>x.id===t.disc),p=phasesOf(t.disc).find(x=>x.id===t.ph);return `<tr class="click" data-go="hdp/map/${t.disc}/${t.id}"><td><b>${t.id}</b></td><td>${d.name}</td><td>${p.name}</td><td>${e(t.name)} ${t.gate?`<span class="tag r">게이트</span>`:""}</td><td>${e(t.role)}</td><td>${t.outs.map(e).join(", ")}</td><td class="num">${t.checks.length}</td><td>${t.tools.map(x=>`<span class="tag">${e(toolName(x))}</span>`).join("")}</td></tr>`}).join("")}</table></div>`}
function vBiz(){const rows=[["설계","기계·전기·통신·소방","계획설계 → 중간설계 → 실시설계 → 납품 → 사후설계관리","B","논문에 4개 분야 TFT 표준화 명시","mech"],["PM·CM","사업관리, 감리","착수 → 설계단계 관리 → 발주 → 시공 관리 → 준공","C","2026년 확장 계획으로 보도","pmcm"],["커미셔닝·TAB","Cx, TAB, IST","계획 → 설계 검토 → 설치 검증 → 성능 시험 → 인계","C","2026년 확장 계획으로 보도. 공모전 수상작 다수가 이 영역","cx"],["에너지·친환경 컨설팅","인증, 에너지 해석","예비 검토 → 해석 → 인증 서류 → 사후 검증","D","사업 분야는 공개, HDX 적용 여부 미확인",""]];
 return head("Workflow Biz 관리","비즈니스(사업 유형)별 프로세스","B")+
 `<div class="grid g2">${rows.map(r=>`<div class="card"><h3>${r[0]} <small>${r[1]}</small> ${grade(r[3],r[4])}</h3><div class="lin">${r[2].split(" → ").map(x=>`<div class="n"><b>${x}</b></div>`).join("")}</div>${r[5]?`<button class="btn mt" data-go="hdp/map/${r[5]}">Workflow Map 열기</button>`:`<p class="small muted">이 재구성본에서는 다루지 않음</p>`}</div>`).join("")}</div>
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
 return head("통합문서/DB 검색","문서 속성 / 프로젝트 정보 / 시설·현장 정보 조건 검색","C","검색 조건은 구축사 공개")+
 `<div class="card"><div class="filters"><input type="search" id="qtext" placeholder="프로젝트명, 열원 방식, 설계 특징, WBS 번호 (예: 프리쿨링, D2C, M-201)" value="${e(q.text)}">
  ${sel("type",HDB.facilityTypes,"시설 유형")}${sel("disc",["기계","전기","소방","통신","커미셔닝"],"분야")}${sel("doc",HDB.docTypes,"문서 종류")}${sel("stage",["계획설계","중간설계","실시설계","납품","시공","준공"],"단계")}<button class="btn" id="qreset">초기화</button></div>
  <p class="small muted" style="margin:10px 0 6px">${hit.length}건 / 전체 ${DOCS.length}건 · 시연용 가상 데이터</p>
  <div class="tw"><table class="t"><tr><th>문서</th><th>프로젝트</th><th>시설</th><th>분야</th><th>단계</th><th>WBS</th><th>개정</th><th>형식</th></tr>
  ${hit.slice(0,60).map(d=>`<tr class="click" data-go="hdb/project/${d.pj.id}"><td><b>${e(d.type)}</b></td><td>${e(d.pj.name)}<br><span class="small muted">${e(d.pj.plant)}</span></td><td>${d.pj.type}</td><td>${d.disc}</td><td>${d.stage}</td><td><a data-go="hdp/map/${TASKS.find(t=>t.id===d.wbs)?.disc}/${d.wbs}">${d.wbs}</a></td><td>${d.rev}</td><td><span class="tag k">${d.ext}</span></td></tr>`).join("")}</table></div></div>
 <div class="note b mt">지금 단계는 속성 검색입니다. 문서 본문을 읽고 출처와 함께 답하는 검색(RAG)은 2026년 구축 중으로 보도됐습니다. 속성이 먼저 정리돼 있어야 본문 검색 결과도 프로젝트·단계별로 걸러 볼 수 있습니다.</div>`}
function vProjects(){return head("프로젝트 관리","시설 유형별 프로젝트 현황","C")+`<div class="grid g3">${PJ.map(p=>`<div class="pc" data-go="hdb/project/${p.id}"><b>${e(p.name)}</b> <span class="tag ${p.stage==="준공"?"g":"o"}">${p.stage}</span><div class="s">${p.type} · ${p.year} · ${p.region} · ${p.area}천㎡ · ${p.floors}</div><div class="s">${e(p.plant)}</div><div style="margin-top:6px">${p.disc.map(d=>`<span class="tag">${d}</span>`).join("")}</div></div>`).join("")}</div><p class="small muted mt">전부 시연용 가상 프로젝트입니다.</p>`}
function vProject(id){const p=PJ.find(x=>x.id===id)||curPj(),docs=DOCS.filter(d=>d.pj.id===p.id),sims=similar(p,[]).slice(0,4);
 return head(`${e(p.name)} <span class="tag ${p.stage==="준공"?"g":"o"}">${p.stage}</span>`,`${p.id} · ${p.type} · ${p.year} · ${p.region} · 연면적 ${p.area}천㎡ · ${p.floors}`,"D","가상 프로젝트")+
 `<div class="grid g2"><div class="card"><h3>프로젝트 개요정보</h3><table class="t"><tr><td class="muted">열원 방식</td><td>${e(p.plant)}</td></tr><tr><td class="muted">특기</td><td>${e(p.spec)||"–"}</td></tr><tr><td class="muted">인증</td><td>${p.cert.map(c=>`<span class="tag g">${c}</span>`).join("")||"–"}</td></tr><tr><td class="muted">설계 특징</td><td>${p.kw.map(k=>`<span class="tag">${k}</span>`).join("")}</td></tr><tr><td class="muted">참여 분야</td><td>${p.disc.join(", ")}</td></tr></table>
  <button class="btn p mt" data-setpj="${p.id}">이 프로젝트를 작업 프로젝트로</button></div>
 <div class="card"><h3>유사 프로젝트 <small>왜 비슷한지 표시</small></h3>${sims.map(s=>`<div class="li" style="display:block"><a data-go="hdb/project/${s.p.id}"><b>${e(s.p.name)}</b></a> <span class="muted small">${s.p.year}</span><div class="sim"><div class="bar"><i style="width:${s.s}%"></i></div><b class="num small">${s.s}</b></div><div class="why">${s.why.map(w=>`<i class="${w[0]?"":"x"}">${e(w[1])}</i>`).join("")}</div></div>`).join("")}</div></div>
 <div class="card mt"><h3>프로젝트 WBS · 업무/산출물 관리 · 프로젝트 문서</h3><div class="tw"><table class="t"><tr><th>WBS</th><th>업무</th><th>산출물</th><th>분야</th><th>단계</th><th>개정</th><th>형식</th></tr>
 ${docs.map(d=>{const t=TASKS.find(t=>t.id===d.wbs);return `<tr class="click" data-go="hdp/map/${t.disc}/${t.id}"><td><b>${d.wbs}</b></td><td>${e(t.name)}</td><td>${e(d.type)}</td><td>${d.disc}</td><td>${d.stage}</td><td>${d.rev}</td><td><span class="tag k">${d.ext}</span></td></tr>`}).join("")}</table></div></div>`}
function vForms(){const m={};TASKS.forEach(t=>t.forms.forEach(f=>(m[f]=m[f]||[]).push(t)));
 return head("양식 표준","한글·Excel 양식 등록, DB 항목 연계","C","양식 관리 기능은 구축사 공개")+
 `<div class="card tw"><table class="t"><tr><th>양식</th><th>형식</th><th>쓰이는 업무</th><th>DB 연계 항목(예)</th></tr>${Object.entries(m).map(([f,ts])=>`<tr><td><b>${e(f)}</b></td><td><span class="tag k">${/시트|표|집계|대장/.test(f)?"Excel":"한글"}</span></td><td>${ts.map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id}</a>`).join("")}</td><td class="small muted">프로젝트명, 개정, 작성·검토자${/계산|산정|집계/.test(f)?", 입력 조건, 결과값":""}</td></tr>`).join("")}</table></div><p class="small muted mt">양식 이름은 재구성입니다. 하이멕의 실제 양식 목록은 공개되지 않았습니다.</p>
 <div class="card mt"><h3>양식이 데이터가 되는 길 ${grade("C","구축사 공개 자료")}</h3><div class="lin"><div class="n"><b>기존 한글·엑셀 양식</b>현업이 쓰던 그대로</div><div class="n"><b>양식 등록</b>양식의 칸을 DB 항목에 연결</div><div class="n"><b>웹 편집</b>브라우저에서 한글·엑셀 작성</div><div class="n"><b>나눠 저장</b>항목값 → DB Server<br>원본 → File Server</div><div class="n"><b>활용</b>대시보드, 조건 검색, 보고서, AI 검색</div></div><p class="small muted" style="margin:8px 0 0">구축사가 공개한 문서 데이터화 방식입니다 ${fn("R2")}. 논문 구조도의 'DB Server(Parameters) / File Server(Documents)' 구분과 맞아떨어집니다 ${fn("P2")}. 하이멕에 그대로 적용됐는지는 확인하지 못했습니다.</p></div>`}
function vStd(){return head("기준 표준정보 · 디지털 도서관","법규·설계기준·시방·편람(공개 기준 목록)","B","도서관 구축은 논문, 목록은 재구성")+
 `<div class="card tw"><table class="t"><tr><th>구분</th><th>자료</th><th>발행</th><th>연결된 업무</th></tr>${HDB.library.map(l=>{const ts=TASKS.filter(t=>t.refs.some(r=>r.includes(l[1].slice(0,6))));return `<tr><td><span class="tag">${l[0]}</span></td><td><b>${e(l[1])}</b></td><td>${e(l[2])}</td><td>${ts.slice(0,6).map(t=>`<a class="tag" data-go="hdp/map/${t.disc}/${t.id}">${t.id}</a>`).join("")}</td></tr>`}).join("")}</table></div>
 <div class="note b mt">기준이 개정되면 그 기준을 참조한 업무와 산출물을 거꾸로 찾을 수 있어야 합니다. 공모전 수상작 'RETRACE', '법규가 바뀌면 다시 볼 설계도서를 당일 찾아주는 AI'가 가리키는 기능이고, 논문도 법규·공공 데이터 연계를 다음 계획으로 적었습니다 ${fn("P2")}.</div>`}
function vEquip(){return head("장비 DB","데이터센터 냉방 장비 분류코드, 파라미터 구분(2018 논문 표)","B","논문 Table 2·3")+
 `<div class="grid g2"><div class="card tw"><h3>분류코드 ${fn("P3")}</h3><table class="t"><tr><th>대분류</th><th>장비</th><th>분류코드</th></tr>${HDB.equip.map(x=>`<tr><td>${x[0]}</td><td>${e(x[1])}</td><td><code>${x[2]}</code></td></tr>`).join("")}</table></div>
 <div class="card"><h3>파라미터 3구분 <small>터보 냉동기(C_Chiller_04) 예</small></h3>${Object.entries(HDB.equipParams).map(([k,v])=>`<h4 class="small" style="margin:10px 0 4px">${k}</h4>${v.map(x=>`<span class="tag">${x}</span>`).join("")}`).join("")}
 <div class="note mt small">에너지 성능 정보와 비용 정보는 설계 지원 프로그램의 입력으로, 기타 설계 정보는 결과 보고서에 함께 적어 건축·전력 설계와 장비 선정에 쓴다고 논문은 설명합니다. HDB의 'DB Server(Parameters)'가 이런 값을 담는 자리로 보입니다.</div>
 <h4 class="small" style="margin:12px 0 4px">냉방 시스템 6유형</h4>${["공랭식 DX","글리콜 냉각 DX","수랭식 DX","공랭식 냉수","글리콜 냉각 냉수","수랭식 냉수"].map(x=>`<span class="tag g">${x}</span>`).join("")}</div></div>`}
function vLink(){const L=HDB.lineage,oat=store.get("oat",L.base.oat),k=1+(oat-L.base.oat)*0.021,ch=Math.abs(oat-L.base.oat)>0.01;
 const val=key=>key==="oat"?oat:Math.round(L.base[key]*(key==="pump"?Math.pow(k,1):k)*10)/10;
 return head("산출물 데이터 연동 · 변경 영향","설계조건 변경 시 연관 산출물 반영·재검토 대상 표시","C","기능은 구축사 공개, 수치 모형은 가상")+
 `<div class="card"><div class="fld" style="grid-template-columns:auto 240px 60px;max-width:520px"><label>설계기준서의 외기 건구온도</label><input type="range" min="31" max="38" step="0.1" value="${oat}" id="oat"><span><b class="num">${oat.toFixed(1)}</b> ℃</span></div>
 <div class="lin mt">${L.nodes.map(n=>`<div class="n ${ch&&n[0]!=="bod"?"hit":""}"><b>${n[1]}</b>${n[2]}<div class="v">${n[4]?`${val(n[4]).toLocaleString()} ${n[3]}${ch&&n[4]!=="oat"?` <span class="small">(기존 ${L.base[n[4]].toLocaleString()})</span>`:""}`:ch?"다시 검토 필요":"최신"}</div></div>`).join("")}</div>
 <div class="note ${ch?"o":"b"} mt">${ch?`외기 조건이 ${L.base.oat}℃에서 ${oat.toFixed(1)}℃로 바뀌어 산출물 7건이 '다시 검토'로 표시됐습니다. 숫자가 있는 산출물은 값이 따라 바뀌고, 도면과 시방서는 담당자에게 검토 요청이 갑니다.`:"기준값과 같습니다. 슬라이더를 움직이면 이어진 산출물이 표시됩니다."} 부하 변화는 온도 1K당 2.1%의 단순 비례로 가정한 시연용 모형입니다.</div></div>
 <div class="grid g2 mt"><div class="card"><h3>왜 중요한가</h3><ul class="c"><li>같은 숫자가 계산서, 장비일람표, 도면, 시방서, 전기 부하표에 따로 적힌다. 하나만 고치면 불일치가 납품까지 간다.</li><li>성과품 검토(M-401)의 첫 체크사항이 '같은 수치가 서로 일치하는가'다.</li><li>공모전 수상작 RippleTrace(설계조건 변경 파급영향 추적), '우리 회사는 그 숫자를 몇 가지로 쓰고 있습니까'가 같은 문제를 가리킨다 ${fn("N3")}.</li></ul></div>
 <div class="card"><h3>구현하려면</h3><ul class="c"><li>양식의 칸을 DB 항목(파라미터)과 연결한다. 양식 표준이 먼저다.</li><li>값마다 출처 산출물과 개정을 기록한다.</li><li>자동 반영은 숫자까지. 도면과 시방서는 '검토 요청'으로 사람에게 넘긴다.</li></ul></div></div>`}

/* ══════════ HDT ══════════ */
function tcard(t){const nm=t.pub==="미공개"||t.pub==="제안"?(t.mine||"미공개"):t.pub,unk=!t.mine&&t.pub==="미공개";
 return `<div class="tc ${t.run?"run":""} ${unk?"unk":""}" ${t.run?`data-go="hdt/run/${t.run}"`:""}><div class="id">${t.id} · ${e(t.cls)} ${grade(t.g,t.g)}</div><b>${e(nm)}</b><p>${e(t.use)}</p><div>${t.field?`<span class="tag">${e(t.field)}</span><span class="tag k">${e(t.stage)}</span>`:""}${t.run?`<span class="tag g">실행 가능</span>`:unk?"":`<span class="tag o">이름만 공개</span>`}</div></div>`}
function vTools(){return head("Toolkit List","디지털 설계지원도구 14종(명칭 공개분). 실행 가능 표시 도구는 화면에서 계산","C","14종·예시 3종은 보도, 301·302는 논문")+
 `<div class="grid g4">${HDT.tools.map(tcard).join("")}</div>
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
function vExt(){return head("도구 MAP","공식 영상(2025-12-12) 작업 화면 판독. 확인: 제품명 식별 / 유력: 화면 구성으로 판단","A","영상 캡처 판독")+
 `<div class="grid g2">${HDT.ext.filter(x=>x.img).map(x=>`<div class="card"><h3>${e(x.name)} <span class="tag ${x.seen==="확인"?"g":"o"}">${x.seen}</span></h3><img src="img/${x.img}" alt="${e(x.name)} 화면 캡처" style="width:100%;border-radius:8px;border:1px solid var(--line);max-height:230px;object-fit:cover" onerror="this.style.display='none'">
  <table class="t mt"><tr><td class="muted" style="width:84px">제품</td><td><b>${e(x.prod)}</b></td></tr><tr><td class="muted">분야</td><td>${e(x.field)}</td></tr><tr><td class="muted">단계</td><td>${e(x.stage)}</td></tr><tr><td class="muted">용도</td><td>${e(x.use)}</td></tr><tr><td class="muted">HDX 연결</td><td>${e(x.link)}</td></tr><tr><td class="muted">연결 수단</td><td>${e(x.api)}</td></tr></table>${x.id==="X-CAD"?`<button class="btn p mt" data-go="hdt/view/dxf">유사 화면 열기: 도면 뷰어(DXF)</button>`:x.id==="X-REVIT"||x.id==="X-NAVIS"?`<button class="btn p mt" data-go="hdt/view/ifc">유사 화면 열기: 모델 뷰어(IFC)</button>`:""}</div>`).join("")}</div>
 <div class="card mt tw"><h3>영상에는 없지만 같은 업무에 쓰는 도구 <small>일반 실무, 하이멕 사용 여부 미확인</small></h3><table class="t"><tr><th>도구</th><th>분야</th><th>단계</th><th>용도</th><th>HDX 연결</th></tr>${HDT.ext.filter(x=>!x.img).map(x=>`<tr><td><b>${e(x.name)}</b><br><span class="small muted">${e(x.prod)}</span></td><td>${e(x.field)}</td><td>${e(x.stage)}</td><td>${e(x.use)}</td><td>${e(x.link)}</td></tr>`).join("")}</table></div>
 <div class="card mt"><h3>디지털 트윈 커미셔닝 <span class="tag">제안</span></h3><p style="margin:0">설계값으로 만든 냉수 계통을 3D로 운전시키고 냉동기 고장·정전·밸브 미조정 시나리오를 넣어 설비 반응을 확인하는 화면. <a data-go="hdt/twin"><b>디지털 트윈 열기</b></a></p></div>
 <div class="note b mt">영상에서 읽히는 것은 '한 프로그램에서 끝나지 않는다'는 사실입니다. CAD, BIM, 해석, 조명 도구가 각자 파일을 만들고 사람이 그 사이를 잇습니다. HDX는 이 도구들을 대신하는 것이 아니라 입력 조건, 개정, 결과, 승인을 이어 주는 자리입니다. 홈페이지 문구도 '표준 프로세스 / Database / Tool / 기타 환경(CAD 등)을 연결'입니다 ${fn("W1")}.</div>`}
function vView(k){const ifc=k==="ifc";
 return head(ifc?"모델 뷰어(IFC)":"도면 뷰어(DXF)",ifc?"영상의 Revit·Navisworks 화면에 대응. 오픈소스 web-ifc로 IFC 모델을 브라우저에서 직접 읽어 3D 표시, 객체 선택 시 속성 조회":"영상의 2D 설비 CAD 화면에 대응. 덕트 사이징 계산 결과로 계통도를 DXF로 생성하고 오픈소스 dxf-parser로 읽어 표시","D","오픈소스 연계")+
 `<div class="card"><div id="vmount"></div></div>
 <div class="grid g2 mt"><div class="card"><h3>연결 방식</h3><table class="t"><tr><td class="muted" style="width:96px">대응 도구</td><td>${ifc?"Autodesk Revit 2025, Navisworks(영상에서 제품명 확인)":"AutoCAD 계열 2D CAD(영상에서 유력)"}</td></tr><tr><td class="muted">사용 라이브러리</td><td>${ifc?"web-ifc(That Open Company, MPL-2.0), three.js(MIT)":"dxf-parser(MIT)"}</td></tr><tr><td class="muted">계정·키</td><td>불필요. 브라우저에서 직접 처리하며 파일을 외부로 보내지 않음</td></tr><tr><td class="muted">제약</td><td>라이브러리를 인터넷에서 불러오므로 오프라인에서는 열리지 않음${ifc?". RVT 원본은 읽지 못하고 IFC로 내보낸 파일만 가능":". DWG 원본은 읽지 못하고 DXF만 가능. 선·원·호·문자 등 기본 도형 표시"}</td></tr></table></div>
 <div class="card"><h3>HDX에서의 쓰임</h3><ul class="c">${ifc?"<li>모델 객체의 속성(이름, 유형, 태그)을 장비일람표 값과 대조</li><li>객체 고유 ID(GlobalId)를 HDB 산출물·이슈와 잇는 열쇠로 사용</li><li>분야별 모델을 겹쳐 간섭 검토 결과를 WBS 업무에 연결(이 화면은 단일 모델 표시까지)</li>":"<li>계산서(HDT 덕트 사이징)의 값이 도면 치수로 넘어가는 흐름 시연</li><li>도면층·표제 정보를 추출해 HDB 문서 속성으로 등록</li><li>입력값을 바꾸면 도면이 다시 그려지고 DXF로 내려받아 CAD에서 열 수 있음</li>"}</ul><p class="small" style="margin:8px 0 0"><a data-go="hdt/view/${ifc?"dxf":"ifc"}">${ifc?"도면 뷰어(DXF) 보기":"모델 뷰어(IFC) 보기"}</a> · <a data-go="hdt/ext">도구 MAP</a></p></div></div>`}
function vHow(){return head("연결 방식","자체 개발 / Excel Toolkit / 외부 프로그램 연계 / 외부 DB","B","논문 3.4절, Fig.1")+
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
  <div class="note mt">${e(SRC.hdp.lawNote)}</div>`;
 if(sub==="hdb")return head("출처 · 데이터베이스","규모 수치, 산출물·프로젝트 정보, 디지털 도서관, 표준 자료의 출처","A")+legend+`<div class="card mt"><h3>항목별</h3>${srcTable(SRC.hdb)}</div>`;
 if(sub==="hdt")return head("출처 · 설계 도구","도구 이름과, 실행되는 도구의 입력값·예시 조건·결과·계산 근거의 출처","A")+legend+
  `<div class="card mt"><h3>도구 이름</h3>${srcTable(SRC.hdtNames)}</div>
  <div class="card mt tw"><h3>실행되는 도구 ${Object.keys(TOOLS).length}종</h3><table class="t"><tr><th style="min-width:130px">도구</th><th>입력 항목</th><th>기본값·예시 조건</th><th>결과 항목</th><th style="min-width:260px">계산 근거</th><th>검증 상태</th></tr>
  ${Object.keys(TOOLS).map(k=>{const s=SRC.tools[k]||{},T=TOOLS[k];return `<tr><td><a data-go="hdt/run/${k}"><b>${e(T.title)}</b></a></td><td>${e(s.in||"")}<br>${kindTag("다")}</td><td>${e(s.def||"")}<br>${kindTag("다")}<div class="small muted">현재 기본값: ${T.fields.map(f=>`${f[1]} ${f[2]}${String(f[3]).startsWith("sel:")?"":f[3]}`).join(", ")}</div></td><td>${e(s.out||"")}</td><td>${e(s.calc||"")}<br>${kindTag(s.kind||((s.refs||[]).length?"나":"다"))}<div class="small">${srcLinks(s.refs)}</div></td><td class="small">${e(s.chk||"")}</td></tr>`}).join("")}</table></div>
  <div class="note mt">입력 기본값과 예시 조건은 전부 화면을 보여 주려고 넣은 값입니다. 하이멕의 설계 기준이나 실제 프로젝트 값이 아니며, 실제로는 HDB의 설계기준서와 과거 실적에서 가져와야 합니다. 계산식은 공개된 교재와 기본 공학식이고 하이멕 도구의 로직은 공개되지 않아 알 수 없습니다.</div>`;
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
  case"hdp":if(s[1]==="process"){html=vProcess()}else if(s[1]==="biz"){html=vBiz()}else{html=vMap(s[2],s[3]);side="hdp/map"}break;
  case"hdb":({dash:()=>html=vDash(),search:()=>html=vSearch(),projects:()=>html=vProjects(),project:()=>html=vProject(s[2]),forms:()=>html=vForms(),std:()=>html=vStd(),equip:()=>html=vEquip(),link:()=>html=vLink()}[s[1]]||(()=>{html=vDash();side="hdb/dash"}))();if(s[1]==="project")side="hdb/project";break;
  case"hdt":if(s[1]==="twin"){html=vTwin();side="hdt/ext"}else if(s[1]==="view"){html=vView(s[2]);side="hdt/view/"+(s[2]==="ifc"?"ifc":"dxf")}else if(s[1]==="run"){html=vRun(s[2]);side="hdt/list"}else if(s[1]==="ext")html=vExt();else if(s[1]==="how")html=vHow();else{html=vTools();side="hdt/list"}break;
  case"bench":html=vBench(s[1]);break;
  case"insight":html=vInsight();break;
  case"evidence":html=vEvidence();break;
  case"source":html=vSource(s[1]);break;
  default:html=vHub();side="hub"}
 shell(side);const keep=s[0]==="hdp"&&s[3]||s[1]==="link"||s[1]==="run"||s[1]==="search"||s[1]==="dash";const sc=$(".main").scrollTop;$("#view").innerHTML=html+`<div class="foot">공개 자료 기반 재구성본 · 프로젝트·문서 데이터는 가상 · 근거 등급은 [근거] 메뉴 참조</div>`;$(".main").scrollTop=keep&&render.last===s.slice(0,3).join("/")?sc:0;render.last=s.slice(0,3).join("/");if(window.TWIN){TWIN.unmount();if(s[0]==="hdt"&&s[1]==="twin")TWIN.mount(document.querySelector("#twmount"))}if(window.VIEWERS){VIEWERS.unmount();if(s[0]==="hdt"&&s[1]==="view")VIEWERS.mount(s[2]==="ifc"?"ifc":"dxf",document.querySelector("#vmount"))}}
const go=r=>{if(location.hash==="#/"+r)render();else location.hash="#/"+r};
document.addEventListener("click",ev=>{const g=ev.target.closest("[data-go]");if(g){ev.preventDefault();ev.stopPropagation();go(g.dataset.go);return}
 const sp=ev.target.closest("[data-setpj]");if(sp){cur=sp.dataset.setpj;store.set("pj",cur);$("#curPj").value=cur;render();return}
 const pr=ev.target.closest("[data-preset]");if(pr){const key=location.hash.split("/")[3],T=TOOLS[key];store.set("in."+key,Object.assign(store.get("in."+key,{}),T.presets[pr.dataset.preset][1]));render();return}
 if(ev.target.id==="qreset"){q={text:"",type:"",disc:"",doc:"",stage:""};render()}});
document.addEventListener("change",ev=>{const t=ev.target;
 if(t.dataset.chk){const k="chk."+t.dataset.chk,a=store.get(k,[]),i=+t.dataset.i;store.set(k,t.checked?[...new Set([...a,i])]:a.filter(x=>x!==i));render()}
 else if(t.dataset.q){q[t.dataset.q]=t.value;render()}
 else if(t.dataset.in){const key=location.hash.split("/")[3],o=store.get("in."+key,{});o[t.dataset.in]=t.type==="number"?Number(t.value):t.value;store.set("in."+key,o);render()}
 else if(t.dataset.as){const a=store.get("assume",HDB.scale.assume);a[t.dataset.as]=Math.max(0,Number(t.value)||0);store.set("assume",a);render()}
 else if(t.id==="curPj"){cur=t.value;store.set("pj",cur);render()}});
document.addEventListener("input",ev=>{const t=ev.target;
 if(t.id==="oat"){store.set("oat",Number(t.value));render();const n=$("#oat");if(n)n.focus()}
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
