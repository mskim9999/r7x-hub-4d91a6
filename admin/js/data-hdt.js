/* HDT 설계 도구 데이터 — 재구성본
   근거: [C] KHARN 2026-05 (HVAC KOREA 2026 발표 보도): HDT 14종, Python·VBA 자체 SW / 노코드 툴킷 / 외부 상용 프로그램 연동, 일부 특허.
             예시 도구: 습공기 물성 계산, 프리쿨링 시간 계산, 히트펌프 외기영향 COP 계산
         [B] 논문 "건축설비엔지니어링 디지털전환(DX) 구축 사례 및 AI 전략" 3.4절: Excel 수식 툴과 외부 전문 프로그램 연계를 우선,
             HDT-301·302(WUE, Chiller water saving) 자체 개발 배포, AutoLISP 스크립트 시범 개발
         [B] 논문 Fig.1: HDT = Excel Toolkit / 외부 프로그램 / 자체 개발 프로그램 / 외부 시스템 및 외부 DB
         [C] 구축사 기능목록: 부하계산·용량계산 등 산출물 계산과 보고서 자동화, 문서 양식과 데이터 연동
   14종의 전체 목록은 공개되지 않았다. 이름이 공개된 것만 채우고 나머지는 '미공개'로 둔다.
   실행되는 계산기는 지원자가 일반 공학 공식으로 새로 만든 것이며 하이멕의 계산 로직이 아니다. */
window.HDT = {
  how: [
    { k:"자체 개발 프로그램", d:"Python·VBA로 직접 만든 계산 SW. 연구 과제 결과물(HDT-301·302)이 여기에 해당.", ex:"WUE, Chiller water saving", g:"B" },
    { k:"Excel Toolkit(노코드)", d:"현업이 쓰던 엑셀 수식 툴을 플랫폼에 등록해 양식·DB와 연결. 엔지니어가 코딩 없이 고친다.", ex:"부하·용량 계산서, 정압·양정 계산서", g:"B" },
    { k:"외부 프로그램 연계", d:"검증된 상용 프로그램은 다시 만들지 않고 실행·결과를 플랫폼과 연결.", ex:"CAD, BIM, 부하·해석 SW", g:"B" },
    { k:"외부 시스템·외부 DB", d:"법규·공공 데이터 등 외부 DB 연계는 논문에 '앞으로의 계획'으로 적혀 있다.", ex:"법규, 기상, 공공 데이터", g:"B" }
  ],
  // 14칸. run이 있으면 이 사이트에서 실행되는 지원자 구현 계산기.
  tools: [
    { id:"T-PSY", pub:"습공기 물성 계산", cls:"자체 개발 프로그램", g:"C", run:"psy", field:"기계", stage:"계획·중간설계", use:"외기·실내 설계조건에서 엔탈피, 절대습도, 노점, 습구온도를 구해 부하계산과 코일 선정의 입력으로 쓴다." },
    { id:"T-FC", pub:"프리쿨링 시간 계산", cls:"자체 개발 프로그램", g:"C", run:"fc", field:"기계(데이터센터)", stage:"계획설계", use:"지역 기상에서 냉동기 없이 냉각할 수 있는 연간 시간을 구해 열원 방식과 운영비를 비교한다." },
    { id:"T-COP", pub:"히트펌프 외기영향 COP 계산", cls:"자체 개발 프로그램", g:"C", run:"cop", field:"기계", stage:"계획·중간설계", use:"외기 온도에 따라 달라지는 히트펌프 효율과 능력을 보고 용량과 보조 열원을 정한다." },
    { id:"T-WUE", pub:"HDT-301 WUE", cls:"자체 개발 프로그램", g:"B", run:"wue", field:"기계(데이터센터)", stage:"계획설계·운영", use:"데이터센터의 물 사용 효율(L/kWh)을 산정한다." },
    { id:"T-CWS", pub:"HDT-302 Chiller water saving", cls:"자체 개발 프로그램", g:"B", run:"wue", field:"기계(데이터센터)", stage:"계획설계·운영", use:"냉동기·냉각탑 계통의 물 절감량을 검토한다. 이 사이트에서는 WUE 계산기 안에 절감 비교로 묶었다." },
    { id:"T-LOAD", pub:"부하계산 자동화", cls:"Excel Toolkit(노코드)", g:"C", run:"load", field:"기계", stage:"계획·중간설계", use:"용도별 면적과 단위부하로 개략 부하를 집계하고 계산서 양식에 채운다." },
    { id:"T-CAP", pub:"용량계산·보고서 자동화", cls:"Excel Toolkit(노코드)", g:"C", run:null, field:"기계", stage:"중간설계", use:"부하계산 결과에서 장비 용량 계산서와 보고서를 만든다. 구축 기능목록에 이름만 공개." },
    { id:"T-LISP", pub:"AutoLISP 도면 스크립트", cls:"자체 개발 프로그램", g:"B", run:null, field:"공통(도면)", stage:"실시설계", use:"CAD에서 제공되지 않는 기능을 현업 엔지니어가 스크립트로 시범 개발. 세부 기능은 비공개." },
    { id:"T-DCP", pub:"데이터센터 공조 설계 지원 프로그램", cls:"자체 개발 프로그램", g:"B", run:null, field:"기계(데이터센터)", stage:"계획설계", use:"냉방 시스템 6유형과 장비 DB로 에너지 사용량과 비용을 예측(2018 에너지기술평가원 과제). 현재 HDT 포함 여부는 미확인." },
    { id:"T-DUCT", pub:"미공개", mine:"덕트 사이징(등마찰법)", cls:"미공개", g:"D", run:"duct", field:"기계·소방", stage:"실시설계·TAB", use:"풍량과 마찰손실 기준으로 덕트 크기와 풍속을 구한다. 공개 목록에는 없고 지원자가 채운 칸." },
    { id:"T-PIPE", pub:"미공개", mine:"배관 관경 선정", cls:"미공개", g:"D", run:"pipe", field:"기계", stage:"실시설계·TAB", use:"부하와 온도차로 유량을 구하고 마찰손실·유속 기준에 맞는 관경을 고른다. 지원자가 채운 칸." },
    { id:"T-12", pub:"미공개", cls:"미공개", g:"D", run:null, field:"", stage:"", use:"공개 자료에서 확인되지 않음." },
    { id:"T-13", pub:"미공개", cls:"미공개", g:"D", run:null, field:"", stage:"", use:"공개 자료에서 확인되지 않음." },
    { id:"T-14", pub:"미공개", cls:"미공개", g:"D", run:null, field:"", stage:"", use:"공개 자료에서 확인되지 않음." }
  ],
  // 14종 밖. 지원자가 새로 제안하는 도구.
  proposed: [
    { id:"T-VCX", pub:"제안", mine:"가상 IST(냉방 상실 시나리오)", cls:"지원자 제안", g:"D", run:"vcx", field:"커미셔닝(데이터센터)", stage:"설계 검토·IST 전", use:"설계값만으로 정전·냉동기 정지 시나리오를 미리 돌려 현장 통합시험 전에 실패할 항목을 찾는다. 회사 2028~2030 전략의 '디지털트윈'으로 가는 첫 단계. 공모전 수상작 24건에는 시험 전 검토(SeqCheck, Cx-Gate, IST 시나리오 생성)는 있지만 설계 모델로 시험을 가상 실행하는 구상은 제목상 보이지 않는다." }
  ],
  /* 현업 도구 지도 — 하이멕 공식 영상(2025-12-12) 캡처 판독 + 일반 실무.
     seen: "확인"(제품명이 읽힘) / "유력"(UI·작업 내용상) / "미확인"(영상에 없음, 일반 실무 도구) */
  ext: [
    { id:"X-CAD", name:"2D 설비 CAD", prod:"AutoCAD 계열(제품명 미확정)", seen:"유력", field:"기계·전기·소방·통신 공통", stage:"중간·실시설계", use:"공조 덕트 계통도, 평면·상세도 작성. 영상에서 파일명 '공조덕트 계통도'와 덕트 치수(1000×1300) 표기가 읽힌다.", link:"파일 연계: DWG 체크인·개정 관리, 표제란 추출, 표준 레이어·블록 배포", api:"AutoLISP·.NET API(로컬), 논문에 AutoLISP 시범 개발 언급", img:"image3.png" },
    { id:"X-REVIT", name:"BIM 모델링", prod:"Autodesk Revit 2025", seen:"확인", field:"기계(배관·덕트)", stage:"실시설계·시공 BIM", use:"배관 부속(버터플라이 밸브 추정) 속성 편집, 2D·3D 뷰 동시 작업. 속성 창에 IFC 내보내기 매개변수가 보인다.", link:"모델 객체·속성 연계: 장비일람표 값과 객체 매개변수 대조", api:"Revit API(애드인), Autodesk Platform Services, 2027부터 공식 MCP 서버(기술 미리보기)", img:"image7.png" },
    { id:"X-NAVIS", name:"모델 통합·간섭 검토", prod:"Autodesk Navisworks", seen:"확인", field:"전 분야 조정", stage:"실시설계·시공", use:"Revit 뷰 이름이 'Navisworks Export'. 분야별 모델을 합쳐 간섭을 찾는 용도.", link:"이슈 연계: 간섭 이슈를 WBS·담당자와 연결", api:"Navisworks API, NWC 내보내기, BCF", img:"image7.png" },
    { id:"X-BIMAI", name:"Revit AI 애드인", prod:"BIMLOGIQ 탭(판독 유력)", seen:"유력", field:"기계·전기 도면화", stage:"실시설계", use:"Revit 리본에 외부 애드인 탭이 여러 개 보인다. 자동 주석·자연어 조작 계열 상용 애드인을 이미 쓰고 있을 가능성.", link:"외부 AI 도구도 등록·검증 대상으로 관리", api:"상용 애드인", img:"image7.png" },
    { id:"X-CFD", name:"열·기류 해석(CFD)", prod:"6SigmaDC 또는 Star-CCM+ (홈페이지 사업분야에 두 제품 명시, 화면이 어느 쪽인지는 미확정)", seen:"유력", field:"기계(데이터센터)", stage:"계획·실시설계, Cx", use:"서버 랙 열과 통로의 온도 분포(범례 약 23~25℃)를 검토. 냉복도·열복도 기류와 장애 시나리오 확인.", link:"실행 묶음 연계: 입력 조건·모델 개정·결과 지표를 한 묶음으로 보관", api:"대부분 파일·배치 실행", img:"image2.png" },
    { id:"X-CFD2", name:"기준 문서와 해석 병행 검토", prod:"문서 편집기 + 3D 해석(제품명 미확정)", seen:"유력", field:"기계·소방", stage:"설계 검토", use:"왼쪽에 표가 있는 검토 문서, 오른쪽에 건물 3D 해석 모델. 기준을 읽으며 결과를 대조한다.", link:"기준 조항 ↔ 해석 입력값 연결(지금은 사람이 눈으로 대조)", api:"—", img:"image4.png" },
    { id:"X-RELUX", name:"조명 시뮬레이션", prod:"Relux", seen:"확인", field:"전기(조명)", stage:"실시설계", use:"창 제목 'Lighting Simulation - Relux', 'YELLOW ZONE LOBBY' 3D 의사색 조도 분포. 기구 'LED 레이스웨이 40W'.", link:"결과 연계: 조도 계산서 PDF와 공간·기구 목록 등록", api:"ReluxCAD for Revit, IFC 가져오기", img:"image5.png" },
    { id:"X-EXCEL", name:"계산서·집계", prod:"Excel / 한글", seen:"미확인", field:"전 분야", stage:"전 단계", use:"계산서, 집계표, 검토서. HDT의 Excel Toolkit과 양식 표준의 대상.", link:"양식 표준·DB 연계(구축 기능목록: 한글·Excel 양식 등록과 DB 연계)", api:"VBA, Office 스크립트" },
    { id:"X-LOADSW", name:"부하·에너지 해석 SW", prod:"ECO2(홈페이지 명시), RTS 부하계산 프로그램(2010 논문), PipeFlow(홈페이지 명시)", seen:"미확인", field:"기계", stage:"중간설계", use:"존별 부하, 연간 에너지, 인증용 해석.", link:"입력 파일·결과 보고서 등록", api:"파일 교환(gbXML 등)" },
    { id:"X-HYD", name:"소방 수리계산 SW", prod:"상용 수리계산 프로그램", seen:"미확인", field:"소방", stage:"실시설계", use:"스프링클러 배관 수리계산.", link:"입력·결과 등록", api:"파일" },
    { id:"X-ETAP", name:"전력 계통 해석", prod:"전력 계통 해석 프로그램", seen:"미확인", field:"전기", stage:"실시설계", use:"단락·보호협조·조류 계산.", link:"입력·결과 등록", api:"파일" },
    { id:"X-PMIS", name:"사업관리 시스템", prod:"PMIS·공정 관리 도구", seen:"미확인", field:"PM·CM", stage:"전 단계", use:"공정, 문서 수발신, 검측, 기성.", link:"WBS·이슈 연계", api:"시스템별" },
    { id:"X-BMS", name:"자동제어·계측", prod:"BAS/BMS, 데이터 로거", seen:"미확인", field:"커미셔닝·TAB", stage:"시험·운영", use:"FPT·IST에서 트렌드 데이터 수집.", link:"계측 원본 CSV를 시험 결과와 함께 보관", api:"BACnet, CSV 내보내기" }
  ]
};
