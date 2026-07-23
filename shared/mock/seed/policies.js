// Policies — đọc từ Core (read-only). Status tối giản theo OQ-05: ACTIVE/EXPIRED/CANCELLED.
window.BANCA = window.BANCA || {};
BANCA.policies = [
  {id:'JB-POL-2026-0207', certificate:'CERT-2026-0207', owner:'RM-01', customerId:'CUS-010', productName:'Motor Comprehensive', package:'Premium',
   premium:11200000, issueDate:'2026-07-15', effectiveFrom:'2026-07-15', effectiveTo:'2027-07-14', status:'ACTIVE', renewalStatus:null, isNew:true, appId:'APP-2026-110',
   vehicle:{brand:'Honda', model:'Civic', year:2024, plate:'51G-445.67', vin:'RLHFC2660PY123456', engineNo:'EG44567X', seats:5, usage:'Cá nhân'},
   idv:890000000, deductible:500000, addOns:['HYDRO_LOCK','GLASS','FLOOD'], ntx:{perSeat:10000000, seats:5},
   garage:'Chính hãng', territory:'Việt Nam', ncdTier:{percent:15, yearsNoClaim:3},
   mortgage:null,
   exclusions:['Lái xe không có GPLX hợp lệ / nồng độ cồn','Xe dùng sai mục đích kê khai (kinh doanh vận tải)','Hao mòn tự nhiên, hỏng hóc kỹ thuật không do tai nạn','Chiến tranh, khủng bố, phóng xạ'],
   wordingRef:'QT-BH-VCX-2025 v3.1',
   endorsements:[], claims:[], vatInvoice:'INV-2026-08812',
   audit:[{at:'2026-07-12 10:05',by:'Nguyễn Văn An',action:'Tạo hồ sơ & thu phí'},{at:'2026-07-14 09:30',by:'UW Nguyễn Thị Thẩm',action:'Duyệt phát hành'},{at:'2026-07-15 09:00',by:'Core System',action:'Phát hành hợp đồng + GCN'}],
   billing:[{date:'2026-07-12', amount:11200000, method:'BANK_TRANSFER', ref:'TXN-87001', status:'SUCCESS'}]},
  {id:'JB-POL-2026-0184', certificate:'CERT-2026-0184', owner:'RM-01', customerId:'CUS-001', productName:'Motor Comprehensive', package:'Standard',
   premium:8100000, issueDate:'2026-06-20', effectiveFrom:'2026-06-20', effectiveTo:'2027-06-19', status:'ACTIVE', renewalStatus:null, isNew:false, appId:null,
   vehicle:{brand:'Mercedes', model:'GLC200', year:2023, plate:'51F-556.78'},
   billing:[{date:'2026-06-18', amount:8100000, method:'CARD', ref:'TXN-85520', status:'SUCCESS'}]},
  {id:'JB-POL-2025-0102', certificate:'CERT-2025-0102', owner:'RM-01', customerId:'CUS-010', productName:'Motor Comprehensive', package:'Premium',
   premium:10800000, issueDate:'2025-08-10', effectiveFrom:'2025-08-10', effectiveTo:'2026-08-09', status:'ACTIVE', renewalStatus:'RENEWAL_DUE', renewalDraftId:'DRAFT-2026-006', isNew:false, appId:null,
   vehicle:{brand:'Honda', model:'CR-V', year:2023, plate:'51G-888.66', vin:'RLHRE6660NY654321', engineNo:'EG88866X', seats:7, usage:'Cá nhân'},
   idv:980000000, deductible:500000, addOns:['HYDRO_LOCK','GLASS','FLOOD'], ntx:{perSeat:10000000, seats:7},
   garage:'Chính hãng', territory:'Việt Nam', ncdTier:{percent:0, yearsNoClaim:0},
   mortgage:null,
   exclusions:['Lái xe không có GPLX hợp lệ / nồng độ cồn','Hao mòn tự nhiên','Chiến tranh, khủng bố'],
   wordingRef:'QT-BH-VCX-2025 v3.0',
   endorsements:[{no:'END-2025-0102-01', date:'2026-01-10', type:'Đổi biển số', detail:'51G-777.99 → 51G-888.66', feeDelta:0}],
   claims:[{no:'CLM-2026-0345', date:'2026-03-18', type:'Va chạm — tổn thất bộ phận', amount:28500000, status:'Đã chi trả', note:'Trả garage chính hãng; ảnh hưởng bậc NCD kỳ tái tục'},{no:'CLM-2026-0521', date:'2026-06-02', type:'Vỡ kính chắn gió', amount:9200000, status:'Đã chi trả', note:'Add-on GLASS'}],
   vatInvoice:'INV-2025-71203',
   audit:[{at:'2025-08-08 14:20',by:'Nguyễn Văn An',action:'Tạo hồ sơ & thu phí'},{at:'2025-08-10 09:00',by:'Core System',action:'Phát hành'},{at:'2026-01-10 11:00',by:'Core System',action:'Endorsement END-2025-0102-01'}],
   billing:[{date:'2025-08-08', amount:10800000, method:'BANK_TRANSFER', ref:'TXN-71203', status:'SUCCESS'}]},
  {id:'JB-POL-2025-0088', certificate:'CERT-2025-0088', owner:'RM-01', customerId:'CUS-002', productName:'Motor Comprehensive', package:'Basic',
   premium:4200000, issueDate:'2025-08-01', effectiveFrom:'2025-08-01', effectiveTo:'2026-07-31', status:'ACTIVE', renewalStatus:'RENEWAL_DUE', isNew:false, appId:null,
   vehicle:{brand:'Toyota', model:'Raize', year:2022, plate:'51K-778.90'},
   billing:[{date:'2025-07-30', amount:4200000, method:'BANK_TRANSFER', ref:'TXN-70988', status:'SUCCESS'}]},
  {id:'JB-POL-2026-0155', certificate:'CERT-2026-0155', owner:'RM-02', customerId:'CUS-003', productName:'Motor Comprehensive', package:'Standard',
   premium:9350000, issueDate:'2026-05-12', effectiveFrom:'2026-05-12', effectiveTo:'2027-05-11', status:'ACTIVE', renewalStatus:null, isNew:false, appId:null,
   vehicle:{brand:'Ford', model:'Everest', year:2023, plate:'50E-321.54'},
   billing:[{date:'2026-05-10', amount:9350000, method:'CARD', ref:'TXN-83110', status:'SUCCESS'}]},
  {id:'JB-POL-2025-0034', certificate:'CERT-2025-0034', owner:'RM-02', customerId:'CUS-005', productName:'Motor TNDS', package:'TNDS bắt buộc',
   premium:480000, issueDate:'2025-06-15', effectiveFrom:'2025-06-15', effectiveTo:'2026-06-14', status:'EXPIRED', renewalStatus:'EXPIRED_NOT_RENEWED', isNew:false, appId:null,
   vehicle:{brand:'Toyota', model:'Wigo', year:2020, plate:'51C-990.12'},
   billing:[{date:'2025-06-14', amount:480000, method:'CASH', ref:'TXN-64001', status:'SUCCESS'}]},
  {id:'JB-POL-2025-0201', certificate:'CERT-2025-0201', owner:'TS-01', customerId:'CUS-008', productName:'Motor Comprehensive', package:'Basic',
   premium:3900000, issueDate:'2025-11-20', effectiveFrom:'2025-11-20', effectiveTo:'2026-11-19', status:'ACTIVE', renewalStatus:null, isNew:false, appId:null,
   vehicle:{brand:'Mitsubishi', model:'Xpander', year:2021, plate:'51B-445.99'},
   billing:[{date:'2025-11-18', amount:3900000, method:'BANK_TRANSFER', ref:'TXN-76002', status:'SUCCESS'}]},
  {id:'JB-POL-2024-0290', certificate:'CERT-2024-0290', owner:'RM-01', customerId:'CUS-007', productName:'Motor Comprehensive', package:'Standard',
   premium:6900000, issueDate:'2024-12-01', effectiveFrom:'2024-12-01', effectiveTo:'2025-11-30', status:'CANCELLED', cancelledAt:'2025-06-15', cancelReason:'Khách bán xe', renewalStatus:null, isNew:false, appId:null,
   vehicle:{brand:'Kia', model:'K3', year:2022, plate:'51L-101.20'},
   billing:[{date:'2024-11-28', amount:6900000, method:'CARD', ref:'TXN-59321', status:'SUCCESS'}]}
];
BANCA.policyById = id => BANCA.policies.find(p=>p.id===id);
BANCA.myPolicies = (p = BANCA.current()) => {
  const per = BANCA.personas[p];
  return BANCA.policies.filter(x => x.owner===p ||
    (per.managerScope==='TEAM'  && (BANCA.personas[x.owner]||{}).team===per.team) ||
    (per.managerScope==='BRANCH'&& (BANCA.personas[x.owner]||{}).branch===per.branch));
};
