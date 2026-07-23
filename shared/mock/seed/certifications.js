// Chứng chỉ & đào tạo — hiển thị trong Employee Profile Tab 2 (read-only)
window.BANCA = window.BANCA || {};
BANCA.certifications = {
  'RM-01':[
    {name:'Chứng chỉ đại lý bảo hiểm phi nhân thọ', type:'LICENSE', lines:'Phi nhân thọ (tất cả)', issued:'2024-03-15', expires:'2027-03-15', status:'VALID', file:'cert-rm01-nonlife.pdf'},
    {name:'Đào tạo sản phẩm Motor Comprehensive', type:'TRAINING', lines:'Motor', issued:'2025-01-10', expires:null, status:'COMPLETED', file:'train-rm01-motor.pdf'},
    {name:'Đào tạo sản phẩm Personal Accident', type:'TRAINING', lines:'PA', issued:'2025-02-20', expires:null, status:'COMPLETED', file:'train-rm01-pa.pdf'}
  ],
  'RM-02':[
    {name:'Chứng chỉ đại lý bảo hiểm phi nhân thọ', type:'LICENSE', lines:'Phi nhân thọ (tất cả)', issued:'2024-08-01', expires:'2026-08-01', status:'EXPIRING', note:'Còn 12 ngày — gia hạn để giữ quyền bind', file:'cert-rm02-nonlife.pdf'},
    {name:'Đào tạo sản phẩm Motor Comprehensive', type:'TRAINING', lines:'Motor', issued:'2024-09-05', expires:null, status:'COMPLETED', file:'train-rm02-motor.pdf'},
    {name:'Đào tạo bắt buộc Health Individual', type:'TRAINING', lines:'Health', issued:null, expires:null, status:'MISSING', note:'Chưa hoàn thành — Health bị BLOCKED', file:null}
  ],
  'TS-01':[
    {name:'Chứng chỉ đại lý bảo hiểm phi nhân thọ', type:'LICENSE', lines:'Phi nhân thọ (tất cả)', issued:'2025-01-20', expires:'2028-01-20', status:'VALID', file:'cert-ts01-nonlife.pdf'},
    {name:'Đào tạo sản phẩm Motor Comprehensive', type:'TRAINING', lines:'Motor', issued:'2025-02-15', expires:null, status:'COMPLETED', file:'train-ts01-motor.pdf'},
    {name:'Đào tạo quy trình Telesales', type:'TRAINING', lines:'Chung', issued:'2025-01-25', expires:null, status:'COMPLETED', file:'train-ts01-tele.pdf'}
  ],
  'TL-01':[
    {name:'Chứng chỉ đại lý bảo hiểm phi nhân thọ', type:'LICENSE', lines:'Phi nhân thọ (tất cả)', issued:'2023-06-10', expires:'2026-12-10', status:'VALID', file:'cert-tl01-nonlife.pdf'},
    {name:'Đào tạo quản lý đội nhóm Banca', type:'TRAINING', lines:'Chung', issued:'2024-01-15', expires:null, status:'COMPLETED', file:'train-tl01-mgmt.pdf'}
  ],
  'BM-01':[
    {name:'Chứng chỉ đại lý bảo hiểm phi nhân thọ', type:'LICENSE', lines:'Phi nhân thọ (tất cả)', issued:'2022-02-01', expires:'2027-02-01', status:'VALID', file:'cert-bm01-nonlife.pdf'}
  ],
  'SUP-01':[], 'RM-IN':[], 'SVC-ERR':[]
};
BANCA.certStatusBadge = s => {
  const m={VALID:{l:'Còn hiệu lực',c:'badge-ready'},COMPLETED:{l:'Đã hoàn thành',c:'badge-ready'},EXPIRING:{l:'Sắp hết hạn',c:'badge-conditional'},MISSING:{l:'Chưa hoàn thành',c:'badge-blocked'},EXPIRED:{l:'Hết hạn',c:'badge-blocked'}}[s]||{l:s,c:'badge-pending'};
  return `<span class="badge ${m.c}">${m.l}</span>`;
};
