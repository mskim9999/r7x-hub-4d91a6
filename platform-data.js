const HDX_DATA={
 projects:[
  {id:'DC-2407',name:'수도권 데이터센터 A',type:'데이터센터',stage:'실시설계',progress:68,artifacts:'8,420',issues:36},
  {id:'RND-2203',name:'연구시설 B',type:'연구시설',stage:'CA',progress:91,artifacts:'12,680',issues:14},
  {id:'AIR-2308',name:'공항시설 C',type:'공항시설',stage:'기본설계',progress:42,artifacts:'5,106',issues:29},
  {id:'TWR-2105',name:'초고층 복합시설 D',type:'초고층',stage:'준공·운영',progress:100,artifacts:'18,904',issues:3}
 ],
 artifacts:[
  {type:'계산',code:'CALC-DC-0241',name:'전산실 냉방부하 계산서',project:'DC-2407',wbs:'2.4.10',rev:'R3',status:'검토중',links:28},
  {type:'모델',code:'BIM-MEP-0312',name:'기계설비 통합 모델',project:'DC-2407',wbs:'3.2.30',rev:'R12',status:'공유',links:8420},
  {type:'도면',code:'M-HVAC-B2-104',name:'B2층 공조배관 평면도',project:'DC-2407',wbs:'3.3.20',rev:'R7',status:'승인',links:146},
  {type:'시방',code:'SPEC-23-7313',name:'냉동기 및 냉수계통 시방서',project:'DC-2407',wbs:'3.5.20',rev:'R4',status:'검토중',links:34},
  {type:'물량',code:'BOQ-M-2026-08',name:'기계설비 물량 산출서',project:'DC-2407',wbs:'3.6.10',rev:'R2',status:'작업',links:2108},
  {type:'조달',code:'SUB-CH-0084',name:'냉동기 제작사 승인자료',project:'RND-2203',wbs:'4.2.10',rev:'R1',status:'승인',links:17},
  {type:'검토',code:'ISSUE-BIM-0192',name:'배관·케이블트레이 간섭 검토',project:'AIR-2308',wbs:'3.4.50',rev:'R5',status:'Open',links:12},
  {type:'운영',code:'BEMS-TREND-032',name:'냉수 공급온도 운영 트렌드',project:'TWR-2105',wbs:'6.1.20',rev:'Live',status:'동기화',links:64}
 ],
 connectors:[
  {key:'ACAD',name:'AutoCAD / DWG',mode:'Desktop Add-in + APS',scope:'Layer · Block · Xref · Object ID',status:'연결됨',sync:'12분 전'},
  {key:'RVT',name:'Autodesk Revit',mode:'Add-in + Data Exchange',scope:'Element · Family · Sheet · Parameter',status:'연결됨',sync:'8분 전'},
  {key:'IFC',name:'IFC / openBIM',mode:'IFC API + BCF + IDS',scope:'GUID · Property Set · Issue',status:'검증중',sync:'1시간 전'},
  {key:'NWC',name:'Navisworks',mode:'Export + Coordination API',scope:'Federation · Clash · Viewpoint',status:'주의',sync:'오류 3건'}
 ]
};
