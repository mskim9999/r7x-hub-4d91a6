/* 디지털 트윈 커미셔닝 — 냉수 계통이 시간에 따라 움직이는 화면.
   설계값으로 만든 단순 열·유량 모형을 1초 단위로 진행시키고, 고장 시나리오를 넣어 설비 상태와 온도 변화를 보여 준다.
   지원자가 직접 구현한 시연용 모형이며 실제 제어반·계측과 연결되지 않는다. 외부 라이브러리 없음. */
(function(){
let stop=null;
const f=(x,d=1)=>Number(x).toLocaleString("ko-KR",{minimumFractionDigits:d,maximumFractionDigits:d});
const lerp=(a,b,t)=>Math.round(a+(b-a)*Math.max(0,Math.min(1,t)));
const tcol=(T,lo,hi)=>{const t=(T-lo)/(hi-lo);return `rgb(${lerp(40,235,t)},${lerp(130,120,t)},${lerp(230,60,t)})`};
const SC=[["normal","정상 운전"],["fail1","냉동기 1대 고장"],["fail2","냉동기 2대 동시 고장"],["black","정전 후 복전"],["unbal","1번 분기 밸브 미조정"]];
const ST={run:["운전","#1f9d55"],stby:["대기","#8a94a3"],start:["기동 중","#d99a1c"],fail:["고장","#d04437"],off:["정지","#5b6470"]};

function mount(root){
  const P={load:5400,cap:3000,n:3,tank:60,loop:40,ts:18,lim:6,dly:180,stg:60,gen:10,ups:true,qb:600};
  let view=null,mode3=false,S,speed=20,playing=true,raf=null,last=null,phase=0,trend=[];
  const ys=[90,230,370],by=[70,155,240,325,410];
  root.innerHTML=`<div class="tw2">
   <div class="vbar"><b>냉수 계통 디지털 트윈</b><span class="small muted">냉동기 3대(N+1) · CRAH 5분기 · 시연용 모형</span><span class="sp"></span>
     <button class="btn" id="tMode" style="display:none">계통도로 보기</button><button class="btn" id="tPlay">일시정지</button><label>배속 <select id="tSpd"><option>1</option><option>5</option><option selected>20</option><option>60</option></select>×</label><button class="btn" id="tReset">초기화</button></div>
   <div class="vbar">${SC.map(s=>`<button class="btn ${s[0]==="normal"?"p":""}" data-sc="${s[0]}">${s[1]}</button>`).join("")}
     <span class="sp"></span><label>IT 부하 <input type="number" id="tLoad" value="${P.load}" step="300"> kW</label><label>축열 탱크 <input type="number" id="tTank" value="${P.tank}" step="20"> ㎥</label><label class="small"><input type="checkbox" id="tUps" checked> 펌프 UPS</label></div>
   <div class="tbody">
    <div class="tview"><div id="t3d" style="display:none"></div><svg id="tSvg" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
     <rect width="1000" height="500" fill="#10151c"/>
     <rect x="680" y="40" width="130" height="400" fill="none" stroke="#3a4656" stroke-dasharray="4 4"/><text x="745" y="32" fill="#8fa0b5" font-size="12" text-anchor="middle">전산실</text>
     <g id="tPipes" fill="none" stroke-width="5" stroke-linecap="round"></g>
     <g id="tEq" font-size="11"></g>
     <g id="tTxt" font-size="11" fill="#dfe6ee"></g>
    </svg></div>
    <div class="vside">
     <h4>현재 상태 <span class="muted" id="tClock"></span></h4><div id="tRead"></div>
     <h4>판정</h4><div id="tVerdict" class="tv"></div>
     <h4>냉수 공급온도 추이</h4><svg id="tTrend" viewBox="0 0 280 110" style="width:100%;background:#fafbfc;border:1px solid var(--line)"></svg>
     <h4>이벤트</h4><div id="tLog" class="small tlog"></div>
    </div>
   </div>
   <p class="small muted" style="margin:6px 0 0" id="tHint">3D 화면: 끌어서 회전, 오른쪽 끌기로 이동, 휠로 확대. 관을 따라 흐르는 입자의 속도는 유량, 색은 수온(파랑 = 차가움, 주황 = 따뜻함)을 뜻합니다. 장비 색: 초록 운전, 회색 대기, 노랑 기동 중, 빨강 고장.</p></div>`;
  const svg=root.querySelector("#tSvg"),gP=svg.querySelector("#tPipes"),gE=svg.querySelector("#tEq"),gT=svg.querySelector("#tTxt"),NS="http://www.w3.org/2000/svg";
  const el=(g,tag,at)=>{const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);g.appendChild(e);return e};
  const pipes={};const pipe=(id,d)=>{el(gP,"path",{d,stroke:"#26303c","stroke-width":9});pipes[id]=el(gP,"path",{d,"stroke-dasharray":"10 9"})};
  // 배관
  ys.forEach((y,i)=>{pipe("cw"+i,`M110 ${y-22} H170`);pipe("ret"+i,`M140 ${y+18} H170`);pipe("out"+i,`M280 ${y} H312`);pipe("dis"+i,`M348 ${y} H400`)});
  pipe("hs","M400 90 V370");pipe("m1","M400 230 H470");pipe("m2","M540 230 H600");pipe("ds","M600 70 V410");
  by.forEach((y,i)=>{pipe("b"+i,`M600 ${y} H700`);pipe("r"+i,`M790 ${y} H860`)});
  pipe("dr","M860 70 V470");pipe("rm","M860 470 H140");pipe("rv","M140 470 V108");
  // 장비
  const eq={ct:[],ch:[],pp:[],fan:[],imp:[],crah:[],bv:[]};
  ys.forEach((y,i)=>{eq.ct.push(el(gE,"rect",{x:40,y:y-52,width:70,height:60,rx:3,stroke:"#0b0f14"}));eq.fan.push(el(gE,"path",{d:"M-16 0 H16 M0 -16 V16",stroke:"#10151c","stroke-width":4,transform:`translate(75 ${y-22})`}));
    el(gT,"text",{x:75,y:y+24,"text-anchor":"middle"}).textContent="CT-"+(i+1);
    eq.ch.push(el(gE,"rect",{x:170,y:y-40,width:110,height:80,rx:3,stroke:"#0b0f14"}));el(gT,"text",{x:225,y:y-18,"text-anchor":"middle","font-weight":700,fill:"#fff"}).textContent="CH-"+(i+1);
    eq["chs"+i]=el(gT,"text",{x:225,y:y+2,"text-anchor":"middle",fill:"#fff"});eq["chk"+i]=el(gT,"text",{x:225,y:y+20,"text-anchor":"middle",fill:"#fff"});
    eq.pp.push(el(gE,"circle",{cx:330,cy:y,r:18,stroke:"#0b0f14"}));eq.imp.push(el(gE,"path",{d:"M-12 0 H12 M0 -12 V12",stroke:"#10151c","stroke-width":3,transform:`translate(330 ${y})`}));
    el(gT,"text",{x:330,y:y+34,"text-anchor":"middle"}).textContent="P-"+(i+1)});
  el(gE,"rect",{x:470,y:190,width:70,height:80,rx:6,fill:"#1d2a3a",stroke:"#5d7ea6"});eq.tankFill=el(gE,"rect",{x:474,y:194,width:62,height:72,rx:4});
  el(gT,"text",{x:505,y:184,"text-anchor":"middle"}).textContent="축열 탱크";eq.tankT=el(gT,"text",{x:505,y:236,"text-anchor":"middle","font-weight":700,fill:"#fff","font-size":13});
  by.forEach((y,i)=>{eq.bv.push(el(gE,"path",{d:`M640 ${y-8} L660 ${y+8} V${y-8} L640 ${y+8} Z`,stroke:"#0b0f14"}));eq.crah.push(el(gE,"rect",{x:700,y:y-22,width:90,height:44,rx:3,stroke:"#0b0f14"}));
    el(gT,"text",{x:745,y:y-6,"text-anchor":"middle","font-weight":700,fill:"#fff"}).textContent="CRAH-"+(i+1);eq["cf"+i]=el(gT,"text",{x:745,y:y+12,"text-anchor":"middle",fill:"#fff"});eq["ca"+i]=el(gT,"text",{x:826,y:y-10,"text-anchor":"middle",fill:"#b8c4d2","font-size":10})});
  eq.tsup=el(gT,"text",{x:435,y:220,"text-anchor":"middle",fill:"#9cc8ff"});eq.tret=el(gT,"text",{x:500,y:462,"text-anchor":"middle",fill:"#ffc49a"});eq.pwr=el(gT,"text",{x:40,y:488,"font-size":12});

  function reset(){P.qb=Math.round(P.load/(4.19*8)*60/5/10)*10;const need=Math.min(P.n,Math.ceil(P.load/P.cap));
    S={t:0,T:P.ts,Trk:P.ts+6,power:true,gen:false,genAt:null,ch:[],sc:"normal",ev:[],fired:false,at:null,peak:P.ts,short:0,unbal:false,failTime:null};
    for(let i=0;i<P.n;i++)S.ch.push({s:i<need?"run":"stby",on:null});S.pumps=S.ch.map(u=>u.s==="run");S.flow=1;S.cap=need*P.cap;S.q=P.load;trend=[];log("정상 운전 시작: "+need+"대 운전, "+(P.n-need)+"대 대기");ui()}
  function log(m){S.ev.unshift([S.t,m]);if(S.ev.length>40)S.ev.pop()}
  function trigger(sc){S.sc=sc;S.at=S.t+5;S.fired=false;S.unbal=false;root.querySelectorAll("[data-sc]").forEach(b=>b.classList.toggle("p",b.dataset.sc===sc));
    if(sc==="normal"){reset();return}log("시나리오 선택: "+SC.find(x=>x[0]===sc)[1]+" (5초 뒤 발생)")}
  function step(){S.t++;
    if(S.at!==null&&!S.fired&&S.t>=S.at){S.fired=true;S.failTime=S.t;
      if(S.sc==="fail1"||S.sc==="fail2"){let k=S.sc==="fail2"?2:1,c=0;S.ch.forEach((u,i)=>{if(u.s==="run"&&c<k){u.s="fail";c++;log(`CH-${i+1} 고장`)}});S.detect=S.t+10}
      else if(S.sc==="black"){S.power=false;S.genAt=S.t+P.gen;S.ch.forEach(u=>{if(u.s==="run"||u.s==="start"){u.s="off";u.was=true}});log("상용 전원 상실, 냉동기 전부 정지"+(P.ups?", 펌프는 UPS로 운전":", 펌프도 정지"))}
      else if(S.sc==="unbal"){S.unbal=true;log("1번 분기 밸런싱 밸브 미조정 상태로 운전")}}
    if(S.detect&&S.t>=S.detect){S.detect=null;let j=0;S.ch.forEach((u,i)=>{if(u.s==="stby"){u.s="start";u.on=S.t+P.dly+j*P.stg;j++;log(`CH-${i+1} 예비기 기동 지령`)}});if(!j)log("기동할 예비기 없음")}
    if(S.genAt&&S.t>=S.genAt){S.genAt=null;S.power=true;S.gen=true;log("발전기 절체 완료, 순차 재기동 지령");let j=0;S.ch.forEach(u=>{if(u.was){u.was=false;u.s="start";u.on=S.t+P.dly+j*P.stg;j++}})}
    S.ch.forEach((u,i)=>{if(u.s==="start"&&S.t>=u.on){u.s="run";log(`CH-${i+1} 운전 진입`)}});
    const run=S.ch.filter(u=>u.s==="run").length,need=Math.min(P.n,Math.ceil(P.load/P.cap));
    const pumps=S.ch.map(u=>u.s==="run"||u.s==="start"||((u.s==="off"||u.was)&&P.ups&&!S.power)||(u.s==="off"&&P.ups));
    S.pumps=S.power?S.ch.map(u=>u.s==="run"||u.s==="start"):pumps.map((p,i)=>P.ups&&(S.ch[i].s==="off"||S.ch[i].was));
    const np=S.pumps.filter(Boolean).length;S.flow=Math.min(1,np/need);
    const cap=run*P.cap,C=(P.tank+P.loop)*1000*4.19;
    let q=cap>=P.load?(S.T>P.ts?cap:P.load):cap;if(S.T<=P.ts&&q>P.load)q=P.load;
    if(S.flow>0){S.T+=(P.load-q)/C;if(S.T<P.ts)S.T=P.ts;S.Trk+=((S.T+6)-S.Trk)*0.05}else{S.Trk+=P.load/60000}
    S.cap=cap;S.q=q;if(cap<P.load&&S.fired)S.short++;S.peak=Math.max(S.peak,S.T);
    if(S.t%5===0){trend.push([S.t,S.T]);if(trend.length>360)trend.shift()}}
  function branch(i){const base=P.qb*S.flow;return S.unbal?(i===0?base*1.15:base*(0.96-0.01*i)):base*(1+[0.03,-0.02,0.04,-0.05,0.01][i]*(S.flow>0?1:0))}
  function ui(){const dT=P.load/(Math.max(0.05,S.flow)*P.qb*5/60*4.19),Tr=S.flow>0?S.T+dT:S.Trk,lim=P.ts+P.lim;
    ys.forEach((y,i)=>{const u=S.ch[i],st=ST[u.s],on=u.s==="run";eq.ch[i].setAttribute("fill",st[1]);eq["chs"+i].textContent=st[0]+(u.s==="start"?` ${Math.max(0,u.on-S.t)}초`:"");eq["chk"+i].textContent=on?f(Math.min(P.cap,S.q/Math.max(1,S.ch.filter(x=>x.s==="run").length)),0)+" kW":"0 kW";
      eq.ct[i].setAttribute("fill",on?"#2b7a4b":"#3b4450");eq.pp[i].setAttribute("fill",S.pumps[i]?"#1f9d55":"#3b4450");
      eq.fan[i].setAttribute("transform",`translate(75 ${y-22}) rotate(${on?phase*9:0})`);eq.imp[i].setAttribute("transform",`translate(330 ${y}) rotate(${S.pumps[i]?phase*14:0})`);
      const pf=S.pumps[i]?1:0;[["cw"+i,on?1:0,"#3fae7a"],["ret"+i,pf,tcol(Tr,P.ts,lim+8)],["out"+i,pf,tcol(S.T,P.ts,lim+8)],["dis"+i,pf,tcol(S.T,P.ts,lim+8)]].forEach(p=>{pipes[p[0]].setAttribute("stroke",p[1]?p[2]:"#3b4450");pipes[p[0]].setAttribute("stroke-dashoffset",p[1]?-phase*3:0)})});
    const cs=tcol(S.T,P.ts,lim+8),cr=tcol(Tr,P.ts,lim+8);
    ["hs","m1","m2","ds"].forEach(k=>{pipes[k].setAttribute("stroke",S.flow?cs:"#3b4450");pipes[k].setAttribute("stroke-dashoffset",-phase*3*S.flow)});
    ["dr","rm","rv"].forEach(k=>{pipes[k].setAttribute("stroke",S.flow?cr:"#3b4450");pipes[k].setAttribute("stroke-dashoffset",-phase*3*S.flow)});
    const bq=[],ba=[];by.forEach((y,i)=>{const q=branch(i),e=(q/P.qb-1)*100,bad=S.flow>0&&Math.abs(e)>10,ta=S.flow>0?S.T+6+(S.unbal&&i>0?0.3*i:0)+(bad&&e<0?1.5:0):S.Trk;bq.push(q/P.qb);ba.push(ta);
      pipes["b"+i].setAttribute("stroke",S.flow?cs:"#3b4450");pipes["b"+i].setAttribute("stroke-dashoffset",-phase*3*q/P.qb);pipes["r"+i].setAttribute("stroke",S.flow?cr:"#3b4450");pipes["r"+i].setAttribute("stroke-dashoffset",-phase*3*q/P.qb);
      eq.bv[i].setAttribute("fill",bad?"#d04437":"#c9d3de");eq.crah[i].setAttribute("fill",ta>lim+6?"#d04437":ta>lim+3?"#d99a1c":"#2d6fb5");eq["cf"+i].textContent=f(q,0)+" LPM";eq["ca"+i].textContent="급기 "+f(ta,1)+"℃"});
    eq.tankFill.setAttribute("fill",cs);eq.tankT.textContent=f(S.T,1)+"℃";eq.tsup.textContent="공급 "+f(S.T,1)+"℃";eq.tret.textContent="환수 "+f(Tr,1)+"℃";
    eq.pwr.textContent=S.power?(S.gen?"전원: 발전기":"전원: 상용"):"전원: 상실";eq.pwr.setAttribute("fill",S.power?(S.gen?"#d99a1c":"#7fd3a0"):"#ff7b6e");
    const mm=Math.floor(S.t/60),ss=String(S.t%60).padStart(2,"0");root.querySelector("#tClock").textContent=`${mm}:${ss}`;
    root.querySelector("#tRead").innerHTML=`<table class="t"><tr><td class="muted">냉수 공급온도</td><td class="num"><b>${f(S.T,2)}</b> ℃ <span class="muted">(설정 ${P.ts}, 상한 ${lim})</span></td></tr><tr><td class="muted">운전 용량 / 부하</td><td class="num"><b>${f(S.cap||0,0)}</b> / ${f(P.load,0)} kW</td></tr><tr><td class="muted">냉수 유량</td><td class="num">${f(S.flow*100,0)} %</td></tr><tr><td class="muted">용량 부족 누적</td><td class="num">${S.short} 초</td></tr><tr><td class="muted">최고 온도</td><td class="num">${f(S.peak,2)} ℃</td></tr></table>`;
    const over=S.T>=lim||S.Trk>lim+10,rising=(S.cap||0)<P.load&&S.fired,unb=S.unbal,v=root.querySelector("#tVerdict");
    v.className="tv "+(over?"bad":rising||unb?"warn":"ok");
    v.textContent=over?"실패: 허용 상한 초과. 축열 용량, 예비 대수, 기동 시간 재검토":unb?"TAB 불합격: 1번 분기 과유량, 나머지 분기 유량 부족. 밸브 조정 후 재측정":rising?"진행 중: 용량 부족, 냉수 열용량으로 버티는 중":S.fired&&S.sc!=="normal"?`통과: 최고 ${f(S.peak,2)}℃, 상한 ${lim}℃ 이내로 회복`:"정상";
    const tr=root.querySelector("#tTrend");if(trend.length>1){const t0=trend[0][0],t1=trend[trend.length-1][0],X=t=>30+240*(t-t0)/Math.max(60,t1-t0),Y=T=>100-90*(T-(P.ts-0.5))/(P.lim+2);
      tr.innerHTML=`<line x1="30" x2="275" y1="${Y(lim)}" y2="${Y(lim)}" stroke="#d04437" stroke-dasharray="4 3"/><text x="2" y="${Y(lim)+3}" font-size="9" fill="#d04437">${lim}℃</text><text x="2" y="${Y(P.ts)+3}" font-size="9" fill="#56667c">${P.ts}℃</text><line x1="30" x2="275" y1="${Y(P.ts)}" y2="${Y(P.ts)}" stroke="#c5ccd6"/><polyline fill="none" stroke="#1f6fd0" stroke-width="1.8" points="${trend.map(p=>X(p[0])+","+Math.max(4,Y(p[1]))).join(" ")}"/>`}
    root.querySelector("#tLog").innerHTML=S.ev.slice(0,12).map(x=>`<div><span class="muted">${Math.floor(x[0]/60)}:${String(x[0]%60).padStart(2,"0")}</span> ${x[1]}</div>`).join("");
    root.dataset.twinT=S.t;root.dataset.twinTemp=S.T.toFixed(3);root.dataset.twinRun=S.ch.filter(u=>u.s==="run").length;if(view&&mode3)view.update({ch:S.ch,pumps:S.pumps,T:S.T,Tr,flow:S.flow,bq,ba,qb:P.qb,power:S.power,gen:S.gen,phase,ts:P.ts,lim,t:S.t,st:ST})}
  let acc=0;
  function frame(ts){if(last===null)last=ts;const dt=Math.min(0.1,(ts-last)/1000);last=ts;
    if(playing){acc+=dt*speed;let n=0;while(acc>=1&&n<400){step();acc-=1;n++}phase+=dt*Math.min(6,1+speed/12)*6}
    ui();raf=requestAnimationFrame(frame)}
  root.addEventListener("click",e=>{const b=e.target.closest("[data-sc]");if(b){trigger(b.dataset.sc);e.stopPropagation();return}
    if(e.target.id==="tMode"){setMode(!mode3);return}
    if(e.target.id==="tPlay"){playing=!playing;e.target.textContent=playing?"일시정지":"재생"}else if(e.target.id==="tReset"){root.querySelectorAll("[data-sc]").forEach(x=>x.classList.toggle("p",x.dataset.sc==="normal"));reset()}});
  root.addEventListener("change",e=>{const t=e.target;if(t.id==="tSpd")speed=+t.value;else if(t.id==="tLoad"){P.load=Math.max(300,+t.value||300);reset()}else if(t.id==="tTank"){P.tank=Math.max(0,+t.value||0)}else if(t.id==="tUps"){P.ups=t.checked}else return;e.stopPropagation()});
  function setMode(on){mode3=on&&!!view;root.querySelector("#t3d").style.display=mode3?"":"none";svg.style.display=mode3?"none":"";root.querySelector("#tMode").textContent=mode3?"계통도로 보기":"3D로 보기";root.dataset.mode=mode3?"3d":"2d"}
  root.__twin={view:()=>view,fast(sec){for(let i=0;i<sec;i++)step();ui()},trigger,state:()=>S};
  reset();raf=requestAnimationFrame(frame);let dead=false;stop=()=>{dead=true;cancelAnimationFrame(raf);if(view)view.dispose()};
  const wait=document.createElement("div");wait.id="tWait";wait.textContent="3D 화면을 불러오는 중입니다";
  if(window.TWIN3D){svg.style.display="none";svg.parentNode.insertBefore(wait,svg);root.dataset.mode="wait"}
  if(window.TWIN3D)TWIN3D.create(root.querySelector("#t3d")).then(v=>{wait.remove();if(dead){v.dispose();return}view=v;root.querySelector("#tMode").style.display="";root.querySelector("#t3d").style.display="";setMode(true)}).catch(()=>{wait.remove();svg.style.display="";root.dataset.mode="2d";root.querySelector("#tHint").textContent="3D 라이브러리를 불러오지 못해 계통도로 표시합니다(인터넷 연결 필요). 관의 점선이 흐르는 속도는 유량, 색은 수온을 뜻합니다."});
}
window.TWIN={mount(root){this.unmount();mount(root)},unmount(){if(stop){stop();stop=null}}};
})();
