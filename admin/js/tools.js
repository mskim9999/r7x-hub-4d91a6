/* HDT 실행 계산기 — 지원자가 일반 공학 공식으로 구현(하이멕 로직 아님).
   모든 계산기는 값과 함께 '계산 근거'를 줄 단위로 돌려준다. LLM이 아니라 정해진 식으로 계산한다. */
(function(){
const f=(x,d=1)=>Number.isFinite(x)?x.toLocaleString("ko-KR",{minimumFractionDigits:d,maximumFractionDigits:d}):"–";

/* ── 습공기 (ASHRAE Fundamentals 2017, Ch.1 식) ── */
function pws(t){const T=t+273.15;
  if(t>=0)return Math.exp(-5.8002206e3/T+1.3914993-4.8640239e-2*T+4.1764768e-5*T*T-1.4452093e-8*T**3+6.5459673*Math.log(T));
  return Math.exp(-5.6745359e3/T+6.3925247-9.677843e-3*T+6.2215701e-7*T*T+2.0747825e-9*T**3-9.484024e-13*T**4+4.1635019*Math.log(T));}
const patm=z=>101325*Math.pow(1-2.25577e-5*z,5.2559);
function bis(fn,a,b){let fa=fn(a);for(let i=0;i<60;i++){const m=(a+b)/2,fm=fn(m);if((fa<0)===(fm<0)){a=m;fa=fm}else b=m}return (a+b)/2}
function psy(t,rh,z=0){const P=patm(z),pw=pws(t)*rh/100,W=0.621945*pw/(P-pw),h=1.006*t+W*(2501+1.86*t);
  const v=0.287042*(t+273.15)*(1+1.607858*W)/(P/1000);
  const tdp=bis(x=>pws(x)-pw,-60,t+0.001);
  const twb=bis(x=>{const ws=0.621945*pws(x)/(P-pws(x));return ((2501-2.326*x)*ws-1.006*(t-x))/(2501+1.86*t-4.186*x)-W},-40,t+0.001);
  return {P,pw,W,h,v,tdp,twb};}

/* ── 덕트(등마찰법): Darcy–Weisbach + Swamee–Jain ── */
function ductDp(D,q){const rho=1.2,nu=1.5e-5,e=0.00009,V=q/(Math.PI*D*D/4),Re=V*D/nu,fr=0.25/Math.pow(Math.log10(e/(3.7*D)+5.74/Math.pow(Re,0.9)),2);return {dp:fr/D*rho*V*V/2,V,Re,fr}}
/* ── 배관: 강관(SGP) 안지름 mm ── */
const SGP=[[25,27.6],[32,35.7],[40,41.6],[50,52.9],[65,67.9],[80,80.7],[100,105.3],[125,130.8],[150,155.2],[200,204.7],[250,254.2],[300,304.7],[350,339.8],[400,390.6]];
function pipeDp(dmm,qls){const D=dmm/1000,rho=999.65,mu=1.3056e-3,e=0.000045,V=(qls/1000)/(Math.PI*D*D/4),Re=rho*V*D/mu,fr=0.25/Math.pow(Math.log10(e/(3.7*D)+5.74/Math.pow(Re,0.9)),2);return {dp:fr/D*rho*V*V/2,V}}

/* ── 근사 기상 모형(시연용). 실제 표준기상데이터가 아님 ── */
/* 기상청 기후평년값(1991~2020): 연평균기온 m, 연진폭 a = (8월−1월 평균기온)/2, 일진폭 d = 연평균 일교차/2, 월평균 상대습도 rh */
const CLIM={서울:{m:12.8,a:14.0,d:4.25,rh:[56.2,54.6,54.6,54.8,59.7,65.7,76.2,73.5,66.4,61.8,60.4,57.8]},
            대전:{m:13.1,a:13.5,d:5.05,rh:[65.3,60.3,57.9,56.9,62.4,69.8,79.1,78.2,75.3,71.8,69.3,67.9]},
            부산:{m:15.0,a:11.25,d:3.75,rh:[46.8,49.4,56.0,61.1,68.3,76.8,83.4,78.5,72.6,62.7,56.3,48.1]}};
const MD=[31,28,31,30,31,30,31,31,30,31,30,31];
function hours(city){const c=CLIM[city],out=[];let day=0;
  for(let mo=0;mo<12;mo++)for(let d=0;d<MD[mo];d++,day++)for(let h=0;h<24;h++){
    const t=c.m+c.a*Math.cos(2*Math.PI*(day-205)/365)+c.d*Math.cos(2*Math.PI*(h-15)/24);
    const rh=Math.min(98,c.rh[mo]-12*Math.cos(2*Math.PI*(h-15)/24));out.push({mo,t,rh});}
  return out;}

/* ── SVG 도우미 ── */
function bars(vals,labels,colors,ymax,unit){const W=640,H=220,l=44,b=26,t=10,r=8,n=vals[0].length,bw=(W-l-r)/n;let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  for(let i=0;i<=4;i++){const y=t+(H-t-b)*i/4;s+=`<line x1="${l}" x2="${W-r}" y1="${y}" y2="${y}" stroke="#e6ecf5"/><text x="${l-6}" y="${y+4}" font-size="10" fill="#7d8aa0" text-anchor="end">${Math.round(ymax*(1-i/4))}</text>`}
  for(let i=0;i<n;i++){let y0=H-b;vals.forEach((v,k)=>{const hh=(H-t-b)*v[i]/ymax;y0-=hh;s+=`<rect x="${l+i*bw+4}" y="${y0}" width="${bw-8}" height="${Math.max(0,hh)}" fill="${colors[k]}"/>`});
    s+=`<text x="${l+i*bw+bw/2}" y="${H-9}" font-size="10" fill="#48566f" text-anchor="middle">${labels[i]}</text>`}
  return s+`<text x="4" y="12" font-size="10" fill="#7d8aa0">${unit}</text></svg>`}
function line(xs,ys,mark,xl,yl){const W=640,H=220,l=44,b=30,t=12,r=10,x0=Math.min(...xs),x1=Math.max(...xs),y1=Math.ceil(Math.max(...ys)),y0=0;
  const X=x=>l+(W-l-r)*(x-x0)/(x1-x0),Y=y=>H-b-(H-t-b)*(y-y0)/(y1-y0);let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img">`;
  for(let i=0;i<=y1;i++)s+=`<line x1="${l}" x2="${W-r}" y1="${Y(i)}" y2="${Y(i)}" stroke="#e6ecf5"/><text x="${l-6}" y="${Y(i)+4}" font-size="10" fill="#7d8aa0" text-anchor="end">${i}</text>`;
  for(let x=Math.ceil(x0/5)*5;x<=x1;x+=5)s+=`<text x="${X(x)}" y="${H-12}" font-size="10" fill="#48566f" text-anchor="middle">${x}</text>`;
  s+=`<polyline fill="none" stroke="#2f7df6" stroke-width="2.2" points="${xs.map((x,i)=>X(x)+","+Y(ys[i])).join(" ")}"/>`;
  if(mark)s+=`<circle cx="${X(mark[0])}" cy="${Y(mark[1])}" r="5" fill="#e0457b"/><text x="${X(mark[0])+8}" y="${Y(mark[1])-8}" font-size="11" fill="#b3225a" font-weight="700">${f(mark[1],2)}</text>`;
  return s+`<text x="${W/2}" y="${H-1}" font-size="10" fill="#7d8aa0" text-anchor="middle">${xl}</text><text x="4" y="10" font-size="10" fill="#7d8aa0">${yl}</text></svg>`}

window.TOOLS={
 psy:{title:"습공기 물성 계산",basis:"ASHRAE Handbook—Fundamentals(2017) 1장 식 3, 5·6, 20, 26, 30, 33·35. 습구온도와 노점은 이분법으로 수렴. 기본 조건은 건축물의 에너지절약설계기준 별표7(서울).",
  fields:[["t","건구온도",31.2,"℃"],["rh","상대습도",63.6,"%"],["z","해발고도",0,"m"]],
  presets:[["서울 냉방 설계(별표7)",{t:31.2,rh:63.6,z:0}],["대전 냉방 설계(별표7)",{t:32.3,rh:58.3,z:0}],["부산 냉방 설계(별표7)",{t:30.7,rh:70.4,z:0}],["서울 난방 설계(별표7)",{t:-11.3,rh:63,z:0}],["실내 냉방 26℃ 50%(별표8 범위)",{t:26,rh:50,z:0}],["데이터센터 급기 24℃ 45%(예시)",{t:24,rh:45,z:0}]],
  run(i){const r=psy(i.t,i.rh,i.z);return{out:[["절대습도",f(r.W*1000,2),"g/kg′"],["엔탈피",f(r.h,2),"kJ/kg′"],["노점온도",f(r.tdp,1),"℃"],["습구온도",f(r.twb,1),"℃"],["비체적",f(r.v,3),"㎥/kg′"],["수증기 분압",f(r.pw/1000,3),"kPa"]],
   trace:`대기압 P = 101,325 × (1 − 2.25577e-5 × ${i.z})^5.2559 = ${f(r.P,0)} Pa
포화수증기압 Pws(${i.t}℃) = ${f(pws(i.t),1)} Pa
수증기 분압 Pw = Pws × ${i.rh}/100 = ${f(r.pw,1)} Pa
절대습도 W = 0.621945 × Pw / (P − Pw) = ${f(r.W,5)} kg/kg′
엔탈피 h = 1.006·t + W·(2501 + 1.86·t) = ${f(r.h,2)} kJ/kg′
노점 = Pws(Tdp) = Pw 인 온도 → ${f(r.tdp,2)} ℃
습구 = 단열포화식을 만족하는 온도 → ${f(r.twb,2)} ℃`}}},

 fc:{title:"프리쿨링 시간 계산",basis:"시간별 외기(8,760시간)를 냉수 공급온도와 접근온도에 비교. 연평균기온·월평균 상대습도·일교차는 기상청 기후평년값(1991~2020)이고, 시간 분포는 코사인 곡선으로 편 근사(표준기상데이터 아님).",
  fields:[["city","지역","서울","sel:서울,대전,부산"],["mode","방식","수측(냉각탑+판형열교환기)","sel:수측(냉각탑+판형열교환기),공기측(직접 외기)"],["ts","냉수(급기) 공급온도",18,"℃"],["tr","환수(환기) 온도",26,"℃"],["ap","접근온도 합계",6,"K"]],
  presets:[["고온 냉수 18/26℃",{ts:18,tr:26,ap:6}],["일반 냉수 7/12℃",{ts:7,tr:12,ap:6}],["공기측 급기 24℃",{mode:"공기측(직접 외기)",ts:24,tr:36,ap:2}]],
  run(i){const hs=hours(i.city),air=i.mode.startsWith("공기측"),full=Array(12).fill(0),part=Array(12).fill(0),mech=Array(12).fill(0);
   hs.forEach(h=>{const ref=air?h.t:psy(h.t,h.rh).twb;if(ref+i.ap<=i.ts)full[h.mo]++;else if(ref+i.ap<i.tr)part[h.mo]++;else mech[h.mo]++});
   const s=a=>a.reduce((x,y)=>x+y,0),F=s(full),Pp=s(part),M=s(mech);
   return{out:[["완전 프리쿨링",f(F,0),"h/년"],["부분 프리쿨링",f(Pp,0),"h/년"],["냉동기 운전",f(M,0),"h/년"],["완전 프리쿨링 비율",f(F/87.6,1),"%"]],
    chart:bars([full,part,mech],["1","2","3","4","5","6","7","8","9","10","11","12"],["#2f7df6","#9cc3fb","#f0b8c9"],744,"시간/월  ■완전 ■부분 ■냉동기"),
    trace:`기준 온도 = ${air?"외기 건구":"외기 습구(건구·상대습도에서 계산)"}
완전 프리쿨링: 기준 온도 + 접근온도(${i.ap}K) ≤ 공급온도(${i.ts}℃)
부분 프리쿨링: 공급온도 < 기준 온도 + 접근온도 < 환수온도(${i.tr}℃)
${i.city} 근사 기상 8,760시간 판정 → 완전 ${F}h, 부분 ${Pp}h, 냉동기 ${M}h
주의: 평년값을 곡선으로 편 근사. 실제 설계는 표준기상데이터 시간값을 넣어야 함`}}},

 cop:{title:"히트펌프 외기영향 COP 계산",basis:"정격점(표준 시험점 A7/W35: 외기 건구 7℃, 공급수온 35℃)에서 카르노 효율 대비 비율(η)을 구하고, 외기 변화에 따른 증발·응축 온도로 COP를 다시 계산. −5~5℃ 구간에 제상 손실 가정.",
  fields:[["oat","외기온도",-5,"℃"],["tw","공급수온",45,"℃"],["cr","정격 COP(A7/W35)",4.2,""],["tr","정격 공급수온",35,"℃"],["df","제상 손실",10,"%"]],
  presets:[["난방 45℃, 외기 -5℃",{oat:-5,tw:45}],["저온수 35℃, 외기 -5℃",{oat:-5,tw:35}],["혹한 -12℃",{oat:-12,tw:45}]],
  run(i){const car=(o,w)=>{const Tc=w+3+273.15,Te=o-8+273.15;return Tc/(Tc-Te)},eta=i.cr/car(7,i.tr);
   const cop=o=>{let c=eta*car(o,i.tw);if(o>-5&&o<5)c*=1-i.df/100;return c};const xs=[],ys=[];for(let o=-15;o<=20;o++){xs.push(o);ys.push(cop(o))}
   const c=cop(i.oat);return{out:[["COP",f(c,2),"–"],["정격 대비",f(c/i.cr*100,0),"%"],["카르노 효율 비율 η",f(eta,3),"–"],["난방 100kW당 소비전력",f(100/c,1),"kW"]],
    chart:line(xs,ys,[i.oat,c],"외기온도(℃)","COP"),
    trace:`정격점: 외기 7℃, 공급 ${i.tr}℃, COP ${i.cr}
증발온도 = 외기 − 8K, 응축온도 = 공급수온 + 3K (가정)
카르노 COP(정격) = Tc/(Tc−Te) = ${f(car(7,i.tr),2)} → η = ${i.cr}/${f(car(7,i.tr),2)} = ${f(eta,3)}
외기 ${i.oat}℃: 카르노 COP = ${f(car(i.oat,i.tw),2)} → COP = η × 카르노${(i.oat>-5&&i.oat<5)?` × (1 − ${i.df}%)`:""} = ${f(c,2)}
주의: 단순 모형. 실제 선정은 제조사 성능표로 검증`}}},

 wue:{title:"WUE·냉각수 절감 계산",basis:"WUE = 연간 현장 물 사용량 ÷ 연간 IT 에너지(The Green Grid 백서 #35). 증발량은 방열량 ÷ 증발잠열(약 30℃ 물 2,430 kJ/kg), 블로다운은 농축배수로 계산(미국 에너지부 FEMP 냉각탑 지침의 물수지). 참고: 미국 평균 현장 WUE 약 0.36 L/kWh(LBNL 2024).",
  fields:[["it","IT 부하",40,"MW"],["pue","PUE",1.3,"–"],["evap","증발 냉각 운전 비율",70,"%"],["coc","농축배수(COC)",4,"–"],["dry","건식(프리쿨링) 전환 비율",0,"%"]],
  presets:[["기본안",{evap:70,coc:4,dry:0}],["농축배수 4→6",{coc:6}],["건식 30% 전환",{dry:30}]],
  run(i){const calc=(evapPct,coc)=>{const heat=i.it*1000*i.pue,E=heat*(evapPct/100)*8760*3600/2430/1000,B=E/(coc-1),D=E*0.0005/1;return{E,B,tot:E+B+D}};
   const a=calc(i.evap,i.coc),b=calc(i.evap*(1-i.dry/100),i.coc),itE=i.it*1000*8760,wue=b.tot*1000/itE,w0=calc(70,4).tot;
   return{out:[["WUE",f(wue,2),"L/kWh"],["연간 물 사용",f(b.tot/1000,0),"천㎥"],["증발량",f(b.E/1000,0),"천㎥"],["블로다운",f(b.B/1000,0),"천㎥"],["건식 전환 절감",f((a.tot-b.tot)/1000,0),"천㎥"]],
    trace:`방열량 = IT ${i.it}MW × PUE ${i.pue} = ${f(i.it*i.pue,1)} MW
증발량 = 방열량 × 증발 운전 ${f(i.evap*(1-i.dry/100),0)}% × 8,760h ÷ 증발잠열 2,430 kJ/kg = ${f(b.E,0)} ㎥/년
블로다운 = 증발량 ÷ (COC − 1) = ${f(b.B,0)} ㎥/년
WUE = (증발 + 블로다운 + 비산) ÷ IT 에너지 ${f(itE/1e6,1)} GWh = ${f(wue,2)} L/kWh
참고: 기본안(증발 70%, COC 4) 물 사용 ${f(w0/1000,0)} 천㎥`}}},

 duct:{title:"덕트 사이징(등마찰법)",basis:"Darcy–Weisbach 식과 Swamee–Jain 마찰계수(1976), 아연도 강판 조도 0.09mm(2017 ASHRAE Fundamentals Duct Design Table 1). 각형 환산은 상당지름 식. 허용 풍속은 저속덕트 상한 15 m/s 이하(KDS 31 25 30) 범위에서 입력.",
  fields:[["q","풍량",12000,"CMH"],["dp","단위 마찰손실",1.0,"Pa/m"],["vmax","허용 풍속",10,"m/s"],["ar","종횡비(폭:높이)",2,"–"]],
  presets:[["주 덕트 12,000CMH",{q:12000,dp:1.0,vmax:10}],["분기 3,000CMH",{q:3000,dp:1.0,vmax:7}],["저소음 실 1,200CMH",{q:1200,dp:0.8,vmax:5}]],
  run(i){const q=i.q/3600;let D=bis(d=>i.dp-ductDp(d,q).dp,0.05,4),r=ductDp(D,q),lim=false;
   if(r.V>i.vmax){D=Math.sqrt(q/i.vmax/(Math.PI/4));r=ductDp(D,q);lim=true}
   const hb=bis(b=>D-1.30*Math.pow(i.ar*b*b,0.625)/Math.pow((i.ar+1)*b,0.25),0.02,4);const W=Math.ceil(i.ar*hb*20)/20,H=Math.ceil(hb*20)/20;
   return{out:[["원형 지름",f(D*1000,0),"mm"],["각형(50mm 올림)",`${f(W*1000,0)}×${f(H*1000,0)}`,"mm"],["풍속",f(r.V,1),"m/s"],["마찰손실",f(r.dp,2),"Pa/m"],["동압",f(0.6*r.V*r.V,1),"Pa"]],
    trace:`풍량 ${f(i.q,0)} CMH = ${f(q,3)} ㎥/s
마찰손실 ${i.dp} Pa/m를 만족하는 원형 지름을 이분법으로 탐색 → ${f(D*1000,0)} mm
Re = ${f(r.Re,0)}, 마찰계수 f = ${f(r.fr,4)}
${lim?`풍속이 허용값 ${i.vmax} m/s를 넘어 풍속 기준으로 키움`:`풍속 ${f(r.V,1)} m/s ≤ 허용 ${i.vmax} m/s`}
각형 환산 De = 1.30·(a·b)^0.625 / (a+b)^0.25, 종횡비 ${i.ar}:1`}}},

 pipe:{title:"배관 관경 선정",basis:"유량 = 열량 ÷ (비열 × 밀도 × 온도차), 물 물성은 10℃ 값(NIST). 강관 호칭별 Darcy–Weisbach 마찰손실을 계산해 기준 이내의 최소 관경을 고름. 허용 마찰손실 기본값은 KDS 31 25 25 권장 범위 75~400 Pa/m의 상한. 관 안지름은 규격 원문과 대조하지 못한 값.",
  fields:[["kw","열량",1750,"kW"],["dt","온도차",5,"K"],["dp","허용 마찰손실",400,"Pa/m"],["vmax","허용 유속",3,"m/s"]],
  presets:[["냉수 500RT, ΔT 5K",{kw:1758,dt:5}],["고온 냉수 ΔT 8K",{kw:1758,dt:8}],["분기 200kW",{kw:200,dt:5,vmax:2}]],
  run(i){const qls=i.kw/(4.1955*i.dt)*1000/999.65,rows=SGP.map(([n,d])=>({n,...pipeDp(d,qls)})),pick=rows.find(r=>r.dp<=i.dp&&r.V<=i.vmax)||rows[rows.length-1];
   const near=rows.filter(r=>Math.abs(rows.indexOf(r)-rows.indexOf(pick))<=1);
   return{out:[["유량",f(qls*60,0),"LPM"],["선정 관경",pick.n+"A",""],["유속",f(pick.V,2),"m/s"],["마찰손실",f(pick.dp,0),"Pa/m"],["100m당 손실",f(pick.dp*100/9806.65,1),"mAq"]],
    trace:`유량 = ${f(i.kw,0)} kW ÷ (4.1955 kJ/kg·K × ${i.dt} K) ÷ 999.65 kg/㎥ = ${f(qls,1)} L/s
${near.map(r=>`${String(r.n).padStart(3)}A: 유속 ${f(r.V,2)} m/s, 마찰손실 ${f(r.dp,0)} Pa/m ${r===pick?"← 선정":""}`).join("\n")}
기준: 마찰손실 ≤ ${i.dp} Pa/m, 유속 ≤ ${i.vmax} m/s`}}},

 load:{title:"개략 부하 집계",basis:"면적 × 단위부하. 단위부하 기본값은 계획 단계에서 흔히 쓰는 범위의 가정값이며, 실제로는 HDB의 과거 실적으로 바꿔야 함.",
  fields:[["a1","업무 공간 면적",30000,"㎡"],["u1","업무 단위 냉방부하",120,"W/㎡"],["a2","로비·공용 면적",6000,"㎡"],["u2","공용 단위 냉방부하",90,"W/㎡"],["it","전산실 IT 부하",500,"kW"],["sf","여유율",10,"%"]],
  presets:[["업무시설 36,000㎡",{a1:30000,a2:6000,it:500}],["전산 비중 큰 사옥",{a1:20000,a2:4000,it:3000}]],
  run(i){const q1=i.a1*i.u1/1000,q2=i.a2*i.u2/1000,q=q1+q2+i.it,qs=q*(1+i.sf/100);
   return{out:[["냉방부하 합계",f(q,0),"kW"],["여유율 포함",f(qs,0),"kW"],["냉동톤 환산",f(qs/3.517,0),"USRT"],["면적당",f(q*1000/(i.a1+i.a2),0),"W/㎡"]],
    trace:`업무 ${f(i.a1,0)}㎡ × ${i.u1} W/㎡ = ${f(q1,0)} kW
공용 ${f(i.a2,0)}㎡ × ${i.u2} W/㎡ = ${f(q2,0)} kW
전산 IT ${f(i.it,0)} kW (발열 = 전력)
합계 ${f(q,0)} kW × (1 + ${i.sf}%) = ${f(qs,0)} kW = ${f(qs/3.517,0)} USRT
주의: 여유율은 이 단계에서 한 번만. 다음 단계에서 다시 넣으면 중복`}}},

 vcx:{title:"가상 IST — 냉방 상실 시나리오(제안)",basis:"현장 통합시험(IST) 전에 설계값만으로 '정전 → 냉동기 정지 → 재기동' 동안 전산실이 버티는지 미리 계산. 냉수 계통과 축열조의 열용량 ÷ IT 발열로 버티는 시간을 구하고 재기동 시간과 비교. 제어 로직까지 흉내 내는 본격 디지털 트윈의 첫 단계.",
  fields:[["it","IT 부하",8000,"kW"],["vol","냉수 계통 보유수량",120,"㎥"],["tank","축열(버퍼) 탱크",300,"㎥"],["dt","허용 냉수 온도 상승",6,"K"],["gen","발전기 기동·절체",10,"초"],["rst","냉동기 재기동",600,"초"],["pump","펌프·팬 UPS 연결","예","sel:예,아니오"]],
  presets:[["축열조 300㎥",{tank:300}],["축열조 없음",{tank:0}],["고밀도 16MW",{it:16000,tank:300}]],
  run(i){const cap=(i.vol+i.tank)*1000*4.19*i.dt,ride=cap/i.it,need=i.gen+i.rst,ups=i.pump==="예",ok=ups&&ride>=need,xs=[],ys=[];
   for(let s=0;s<=Math.max(need,ride)*1.2;s+=Math.max(10,Math.round(need/40))){xs.push(s/60);ys.push(Math.min(i.dt*1.6,ups?i.it*s/((i.vol+i.tank)*1000*4.19):i.dt*1.6*(s>30?1:s/30)))}
   const steps=[["0초","상용 전원 상실, 냉동기 정지",true],[`${i.gen}초`,"발전기 기동·절체 완료",true],["그 사이",ups?"펌프·팬은 UPS로 계속 운전, 냉수 보유 열용량으로 냉각":"펌프·팬 정지 → 냉수가 돌지 않아 열용량을 쓸 수 없음",ups],[`${need}초`,"냉동기 재기동 완료",ride>=need],[`${f(ride,0)}초`,"냉수 온도가 허용 상승값 도달",true]];
   return{out:[["버티는 시간",f(ride/60,1),"분"],["필요 시간",f(need/60,1),"분"],["여유",f((ride-need)/60,1),"분"],["사전 판정",ok?"통과 예상":"현장 시험 전 보완 필요",""]],
    chart:line(xs,ys,[need/60,Math.min(i.dt*1.6,ups?i.it*need/((i.vol+i.tank)*1000*4.19):i.dt*1.6)],"경과 시간(분)","냉수 온도 상승(K)"),
    trace:`열용량 = (${i.vol} + ${i.tank}) ㎥ × 1,000 kg/㎥ × 4.19 kJ/kg·K × ${i.dt} K = ${f(cap/1000,0)} MJ
버티는 시간 = 열용량 ÷ IT 발열 ${f(i.it,0)} kW = ${f(ride,0)} 초
필요 시간 = 발전기 ${i.gen}초 + 냉동기 재기동 ${i.rst}초 = ${need} 초
${steps.map(s=>`[${s[2]?"정상":"문제"}] ${s[0]}: ${s[1]}`).join("\n")}
판정: ${ok?"설계값 기준으로는 통과 예상. 현장 IST에서 같은 시나리오로 실측해 이 값과 비교":"이대로 현장 시험에 가면 실패 가능성. 축열 용량, 재기동 시간, UPS 연결을 설계 단계에서 다시 검토"}
주의: 실내 공기·랙의 열용량과 제어 지연은 빼고 계산한 보수적 근사`}}},

 vtab:{title:"가상 TAB — 냉수 분기 밸런싱(제안)",basis:"설계값으로 분기별 밸런싱 밸브가 맡아야 할 차압을 먼저 계산하고, 현장 측정 유량과 대조해 합격 여부를 미리 본다. 배관 저항은 유량의 제곱에 비례한다는 기본식 사용. 분기 사이 상호 영향은 단순화한 근사.",
  fields:[["n","분기 수",5,"개"],["q","분기당 설계 유량",600,"LPM"],["dt","말단(코일·밸브) 저항",45,"kPa"],["dm","주관 구간 저항(전 유량 기준)",8,"kPa"],["sc","측정 상태","조정 후","sel:조정 후,조정 전,가까운 분기 1개 미조정"],["tol","허용 오차",10,"%"]],
  presets:[["조정 후 측정",{sc:"조정 후"}],["조정 전 측정",{sc:"조정 전"}],["1개 미조정",{sc:"가까운 분기 1개 미조정"}]],
  run(i){const n=Math.max(2,Math.min(8,Math.round(i.n))),H=[];let acc=0;for(let k=1;k<=n;k++){acc+=2*i.dm*Math.pow((n-k+1)/n,2);H.push(i.dt+acc)}
   const Hp=H[n-1],bv=H.map(h=>Hp-h),raw=H.map(h=>i.q*Math.sqrt(Hp/h)),dev=[3,-2,4,-5,1,-3,2,-4];
   const meas=H.map((h,k)=>i.sc==="조정 전"?raw[k]:i.sc==="조정 후"?i.q*(1+dev[k]/100):k===0?raw[0]:i.q*(1-0.04-0.01*k));
   const rows=meas.map((m,k)=>({k:k+1,bv:bv[k],m,e:(m/i.q-1)*100})),bad=rows.filter(r=>Math.abs(r.e)>i.tol);
   return{out:[["펌프 필요 양정",f(Hp/9.80665,1),"mAq"],["가장 불리한 분기",n+"번",""],["허용 오차 초과",bad.length+" / "+n,"분기"],["사전 판정",bad.length?"재조정 필요":"합격 예상",""]],
    chart:bars([rows.map(r=>Math.min(r.m,i.q)),rows.map(r=>Math.max(0,r.m-i.q))],rows.map(r=>r.k+"번"),["#2f7df6","#e58a7f"],Math.ceil(Math.max(...meas,i.q)*1.15/100)*100,"측정 유량(LPM)  ■설계 유량까지 ■초과분"),
    trace:`분기 k의 필요 차압 = 말단 ${i.dt} kPa + 2 × Σ 주관 구간 저항(구간 유량비의 제곱)
펌프 필요 양정 = 가장 먼 ${n}번 분기 기준 ${f(Hp,1)} kPa
분기  필요차압  밸런싱 밸브 몫  측정 유량  편차
${rows.map(r=>`${String(r.k).padStart(2)}번   ${f(H[r.k-1],1).padStart(6)} kPa   ${f(r.bv,1).padStart(6)} kPa   ${f(r.m,0).padStart(5)} LPM   ${(r.e>=0?"+":"")+f(r.e,1)}% ${Math.abs(r.e)>i.tol?"← 초과":""}`).join("\n")}
조정 전 예상 유량 = 설계 유량 × √(펌프 양정 ÷ 분기 필요 차압)  (가까운 분기일수록 과유량)
판정: ${bad.length?`${bad.map(r=>r.k+"번").join(", ")} 분기가 ±${i.tol}% 밖. 밸런싱 밸브를 위 '밸브 몫'에 맞춰 조정 후 재측정`:`전 분기 ±${i.tol}% 이내`}
주의: 측정값은 시연용 가상 수치. 실제로는 TAB 기록지의 측정값을 넣어 대조`}}},

 vseq:{title:"제어 시퀀스 검증 — 냉동기 고장 대응(제안)",basis:"운전 순서를 상태 전이(대기, 기동 중, 운전, 고장)로 놓고 시간 단계별로 진행시켜, 설치 전에 '고장이 나면 예비기가 제때 들어오는가'를 확인. 현장 기능 성능 시험의 기대 동작표를 미리 만드는 용도.",
  fields:[["n","냉동기 대수",3,"대"],["cap","대당 용량",3000,"kW"],["load","냉방 부하",5400,"kW"],["sc","고장 시나리오","냉동기 1대 고장","sel:냉동기 1대 고장,냉동기 2대 동시 고장,정전 후 복전"],["dly","예비기 기동 소요",180,"초"],["stg","순차 기동 간격",60,"초"],["buf","냉수 열용량으로 버티는 시간",300,"초"]],
  presets:[["1대 고장(N+1)",{sc:"냉동기 1대 고장"}],["2대 동시 고장",{sc:"냉동기 2대 동시 고장"}],["정전 후 복전",{sc:"정전 후 복전"}],["기동 지연 420초",{sc:"냉동기 1대 고장",dly:420}]],
  run(i){const n=Math.max(1,Math.round(i.n)),need=Math.min(n,Math.ceil(i.load/i.cap)),st=[];for(let k=0;k<n;k++)st.push({s:k<need?"운전":"대기",on:0});
   const ev=[],T0=60,log=[],xs=[],ys=[];let short=0,rec=null;
   for(let t=0;t<=900;t+=10){
     if(t===T0){ if(i.sc==="정전 후 복전"){st.forEach(u=>{u.s="정지";u.on=0});ev.push([t,"정전: 전 냉동기 정지"]);let c=0;st.forEach((u,k)=>{if(k<need){u.s="기동 중";u.on=T0+40+i.dly+c*i.stg;c++}});ev.push([t+40,"발전기 절체 완료, 순차 재기동 지령"])}
       else{const kf=i.sc==="냉동기 2대 동시 고장"?2:1;let c=0;st.forEach(u=>{if(u.s==="운전"&&c<kf){u.s="고장";c++}});ev.push([t,`냉동기 ${kf}대 고장 발생`]);let j=0;st.forEach(u=>{if(u.s==="대기"){u.s="기동 중";u.on=T0+10+i.dly+j*i.stg;j++}});ev.push([t+10,j?`고장 감지, 예비기 ${j}대 기동 지령`:"고장 감지, 기동할 예비기 없음"])}}
     st.forEach((u,k)=>{if(u.s==="기동 중"&&t>=u.on){u.s="운전";ev.push([t,`${k+1}호기 운전 진입`])}});
     const capNow=st.filter(u=>u.s==="운전").length*i.cap;xs.push(t/60);ys.push(capNow/1000);
     if(t>=T0&&capNow<i.load)short+=10;else if(t>T0&&rec===null&&capNow>=i.load)rec=t}
   const fin=st.filter(u=>u.s==="운전").length*i.cap,ok=fin>=i.load&&short<=i.buf;
   return{out:[["필요 대수",need+" / "+n,"대"],["용량 부족 지속",f(short,0),"초"],["버티는 시간",f(i.buf,0),"초"],["사전 판정",fin<i.load?"용량 미회복":ok?"통과 예상":"회복이 늦음",""]],
    chart:line(xs,ys,rec?[rec/60,fin/1000]:null,"경과 시간(분)","운전 용량(MW)"),
    trace:`초기: ${n}대 중 ${need}대 운전(부하 ${f(i.load,0)} kW ÷ 대당 ${f(i.cap,0)} kW), 예비 ${n-need}대
${ev.sort((a,b)=>a[0]-b[0]).map(x=>`${String(x[0]).padStart(4)}초  ${x[1]}`).join("\n")}
용량 부족 구간 ${short}초, 냉수 열용량으로 버티는 시간 ${i.buf}초
판정: ${fin<i.load?"고장 후 남은 용량이 부하보다 작음. 예비 대수 또는 부하 차단 순서를 설계 단계에서 검토":ok?"부족 구간이 버티는 시간 안에 끝남. 현장 시험에서는 위 시간표를 기대 동작으로 사용":"예비기 투입이 늦어 버티는 시간을 넘김. 기동 소요 단축 또는 축열 용량 검토"}
주의: 단순 상태 전이 모형. 실제 제어반 로직, 최소 정지 시간, 부분 부하 특성은 반영하지 않음`}}}
};
})();
