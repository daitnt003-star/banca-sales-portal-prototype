// Referral/Lead tối giản — tiêu thụ từ Bank CRM, KHÔNG xây full CRM.
window.BANCA = window.BANCA || {};
BANCA.referrals = [
  {id:'REF-2026-014', assignedTo:'TS-01', customerId:'CUS-008', customerName:'Hoàng Đức Long', source:'Bank CRM — Loan cross-sell', productInterest:'Bảo hiểm vật chất xe', sla:'2026-07-22', receivedAt:'2026-07-18', status:'IN_PROGRESS', draftId:'DRAFT-2026-009'},
  {id:'REF-2026-015', assignedTo:'TS-01', customerId:'CUS-007', customerName:'Trịnh Mỹ Linh', source:'Branch referral — HCM01', productInterest:'Bảo hiểm vật chất xe', sla:'2026-07-21', receivedAt:'2026-07-17', status:'IN_PROGRESS', draftId:'DRAFT-2026-010'},
  {id:'REF-2026-016', assignedTo:'TS-01', customerId:null, customerName:'Đinh Công Hùng', source:'Campaign Q3 — Motor renewal', productInterest:'Bảo hiểm vật chất xe', sla:'2026-07-25', receivedAt:'2026-07-20', status:'NEW', draftId:null},
  {id:'REF-2026-017', assignedTo:'RM-01', customerId:'CUS-004', customerName:'Đặng Kim Oanh', source:'Bank CRM — New car loan', productInterest:'Bảo hiểm vật chất xe', sla:'2026-07-23', receivedAt:'2026-07-19', status:'NEW', draftId:null}
];
BANCA.myReferrals = (p = BANCA.current()) => BANCA.referrals.filter(r=>r.assignedTo===p);

// Notifications
BANCA.notifications = {
  'RM-01':[
    {type:'UW', text:'APP-2026-105: Có kết quả thẩm định — Chấp thuận có tăng phí (+15%)', at:'2026-07-17 10:20', target:'APP-2026-105'},
    {type:'SUPPLEMENT', text:'APP-2026-104: UW yêu cầu bổ sung đăng kiểm + ảnh xe, hạn 22/07', at:'2026-07-18 16:45', target:'APP-2026-104'},
    {type:'POLICY', text:'JB-POL-2026-0207 đã phát hành — Honda Civic 51G-445.67', at:'2026-07-15 09:00', target:'JB-POL-2026-0207'},
    {type:'QUOTE', text:'DRAFT-2026-003: Báo giá hết hạn 25/07 — cân nhắc tính phí lại', at:'2026-07-20 08:00', target:'DRAFT-2026-003'},
    {type:'RENEWAL', text:'JB-POL-2025-0102 (CR-V) sắp hết hạn 09/08 — đã có yêu cầu tái tục nháp', at:'2026-07-19 07:30', target:'JB-POL-2025-0102'}
  ],
  'RM-02':[
    {type:'LICENSE', text:'License Motor còn 12 ngày — gia hạn để giữ quyền bind', at:'2026-07-19 08:00', target:null},
    {type:'QUOTE', text:'DRAFT-2026-007: Báo giá đã hết hạn — cần tính phí lại', at:'2026-07-15 09:00', target:'DRAFT-2026-007'},
    {type:'PAYMENT', text:'APP-2026-108: Thanh toán thành công 9.120.000 ₫', at:'2026-07-18 10:15', target:'APP-2026-108'}
  ],
  'TS-01':[
    {type:'REFERRAL', text:'REF-2026-016: Lead mới từ Campaign Q3, SLA 25/07', at:'2026-07-20 08:30', target:null},
    {type:'UW', text:'APP-2026-113: Chấp thuận có điều kiện — lắp camera hành trình', at:'2026-07-18 11:10', target:'APP-2026-113'}
  ],
  'TL-01':[
    {type:'SLA', text:'APP-2026-104 (RM-01) sắp quá hạn bổ sung — 22/07 17:00', at:'2026-07-20 08:00', target:'APP-2026-104'},
    {type:'TEAM', text:'RM-02: License Motor còn 12 ngày', at:'2026-07-19 08:05', target:null}
  ],
  'BM-01':[
    {type:'SLA', text:'2 yêu cầu trong chi nhánh sắp quá SLA bổ sung/thanh toán', at:'2026-07-20 08:00', target:null},
    {type:'PERF', text:'HCM01 đạt 82% target premium tháng 7', at:'2026-07-19 18:00', target:null}
  ]
};

// KPI hiệu suất nhanh
// prevPremium = kỳ trước (tháng 06/2026) · targetPremium = chỉ tiêu premium tháng (VND) · prevConversion để tính xu hướng.
// Demo data: dùng để hiển thị ngữ cảnh KPI (gap-to-target, so kỳ trước). Không phải số liệu thật.
BANCA.kpi = {
  'RM-01':{premium:36770000, policies:2, conversion:'38%', target:'73%', prevPremium:32900000, targetPremium:50000000, prevConversion:34, prevPolicies:2},
  'RM-02':{premium:13940000, policies:1, conversion:'25%', target:'46%', prevPremium:15600000, targetPremium:30000000, prevConversion:28, prevPolicies:1},
  'TS-01':{premium:3900000, policies:1, conversion:'18%', target:'31%', prevPremium:2600000, targetPremium:12000000, prevConversion:15, prevPolicies:0},
  'TL-01':{premium:54610000, policies:4, conversion:'31%', target:'61%', teamSize:3, prevPremium:48200000, targetPremium:90000000, prevConversion:29, prevPolicies:3},
  'BM-01':{premium:54610000, policies:4, conversion:'31%', target:'82%', teamSize:4, prevPremium:60100000, targetPremium:150000000, prevConversion:33, prevPolicies:5}
};
