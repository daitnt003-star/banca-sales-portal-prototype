// ============================================================
// Submitted Case meta — Revision Management, Integration status, Sức khỏe yêu cầu.
// Bổ sung metadata cho Không gian theo dõi yêu cầu đã nộp (Sprint 2.5). Không đụng Core.
// ============================================================
window.BANCA = window.BANCA || {};

// Vòng đời revision + so sánh V1↔V2 (demo cho yêu cầu có bổ sung)
BANCA.CASE_META = {
  'APP-2026-104': {
    currentVersion:2,
    versions:[
      {v:1, label:'V1 · Đã nộp', at:'2026-07-16 09:40', status:'SUBMITTED'},
      {v:2, label:'V2 · Supplement', at:'2026-07-18 16:45', status:'NEED_MORE_INFORMATION'}
    ],
    lifecycle:['Draft','Đã nộp V1','Cần bổ sung','Đã nộp V2','Thẩm định'],
    compare:[
      {field:'Số máy', v1:'EG7788X', v2:'EG7788X92'},
      {field:'Ảnh đăng ký xe', v1:'Chỉ mặt trước', v2:'Đủ hai mặt'},
      {field:'Ảnh hiện trạng xe', v1:'Thiếu', v2:'Đã tải'}
    ]
  }
};
BANCA.caseMeta = id => BANCA.CASE_META[id] || {currentVersion:1, versions:[{v:1,label:'V1 · Đã nộp',at:'—',status:'SUBMITTED'}], lifecycle:['Draft','Đã nộp V1'], compare:[]};

// Integration status (tách khỏi business status)
BANCA.integrationStatus = function(app){
  const st=app.status;
  const sent = !['DRAFT','IN_PROGRESS','READY_TO_SUBMIT'].includes(st);
  const paid = app.payment&&app.payment.status==='SUCCESS' || ['PAID','PENDING_ISSUE','ISSUED'].includes(st);
  return [
    ['Quote', 'Đồng bộ', 'ok'],
    ['UW', sent?'Thành công':'Chưa gửi', sent?'ok':'idle'],
    ['Payment', paid?'Thành công':(st==='PENDING_PAYMENT'?'Chờ callback':'Chưa tới'), paid?'ok':(st==='PENDING_PAYMENT'?'wait':'idle')],
    ['Policy', st==='ISSUED'?'Thành công':'Chưa tới', st==='ISSUED'?'ok':'idle']
  ];
};

// Sức khỏe yêu cầu — widget quản lý
BANCA.caseHealth = function(app){
  const st=app.status;
  const missingDoc = st==='NEED_MORE_INFO';
  const waitingCustomer = st==='PENDING_CUSTOMER_CONFIRM';
  const paymentIssue = app.payment&&['FAILED','TIMEOUT','EXPIRED'].includes(app.payment.status);
  const slaBad = (app.sla && new Date(app.sla.replace(' ','T')) < new Date('2026-07-20T15:30:00'));
  const items=[
    ['SLA', slaBad?'Quá hạn':'Trong hạn', slaBad?'bad':'ok'],
    ['Thiếu tài liệu', missingDoc?'Có':'Không', missingDoc?'bad':'ok'],
    ['Chờ khách', waitingCustomer?'Có':'Không', waitingCustomer?'warn':'ok'],
    ['Thanh toán', paymentIssue?'Có lỗi':'Bình thường', paymentIssue?'bad':'ok'],
    ['Tích hợp', 'OK', 'ok']
  ];
  const overall = items.some(i=>i[2]==='bad')?'bad':items.some(i=>i[2]==='warn')?'warn':'ok';
  return {items, overall};
};
