// ============================================================
// Canonical Case State Model + Resolver (spec §II/§III)
// - Tách 5 trường trạng thái: applicationStatus / underwritingStatus /
//   underwritingDecision / paymentStatus / policyStatus.
// - deriveCaseViewState(app): resolver DUY NHẤT — mọi component (list/header/
//   badge/stepper/CTA/uw tab/payment tab/timeline/work queue) đều gọi hàm này.
//   KHÔNG component nào tự suy luận trạng thái.
// ============================================================
window.BANCA = window.BANCA || {};

/* ---- Enums (§II) ---- */
BANCA.APPLICATION_STATUS = {
  DRAFT:{label:'Nháp'}, READY_TO_SUBMIT:{label:'Sẵn sàng gửi'}, SUBMITTED:{label:'Đã gửi'},
  PROCESSING:{label:'Đang xử lý'}, COMPLETED:{label:'Hoàn tất'}, CANCELLED:{label:'Đã hủy'}
};
BANCA.UNDERWRITING_STATUS = {
  NOT_STARTED:{label:'Chưa thẩm định'}, PROCESSING:{label:'Đang xử lý thẩm định'},
  PENDING:{label:'Chờ thẩm định'}, IN_REVIEW:{label:'Đang thẩm định'},
  NEED_MORE_INFORMATION:{label:'Cần bổ sung'}, DECIDED:{label:'Đã có quyết định'}
};
BANCA.UNDERWRITING_DECISION_ENUM = {
  APPROVED_STP:{label:'Chấp thuận tự động'}, APPROVED:{label:'Chấp thuận'},
  APPROVED_WITH_CONDITION:{label:'Chấp thuận có điều kiện'},
  APPROVED_WITH_LOADING:{label:'Chấp thuận có phụ phí'},
  APPROVED_WITH_EXCLUSION:{label:'Chấp thuận có loại trừ'},
  DECLINED:{label:'Từ chối'}, NONE:{label:'—'}
};
// Nhóm quyết định — NGUỒN DUY NHẤT để gating không rải rác từng chuỗi.
// Quyết định "có điều kiện/phụ phí/loại trừ" đều cần khách xác nhận trước khi thanh toán.
BANCA.UW_APPROVED_WITH_TERMS = ['APPROVED_WITH_CONDITION','APPROVED_WITH_LOADING','APPROVED_WITH_EXCLUSION'];
BANCA.UW_APPROVED_CLEAN     = ['APPROVED_STP','APPROVED'];
BANCA.UW_APPROVED_ALL       = BANCA.UW_APPROVED_CLEAN.concat(BANCA.UW_APPROVED_WITH_TERMS);
BANCA.isApprovedDecision      = function(d){ return BANCA.UW_APPROVED_ALL.indexOf(d) >= 0; };
BANCA.isApprovedWithTerms     = function(d){ return BANCA.UW_APPROVED_WITH_TERMS.indexOf(d) >= 0; };
BANCA.POLICY_LIFECYCLE = {
  NOT_STARTED:{label:'Chưa phát hành'}, ISSUING:{label:'Đang phát hành'},
  ISSUED:{label:'Đã phát hành'}, ISSUE_FAILED:{label:'Phát hành lỗi'}
};

/* ---- Map legacy app.uw.decision → underwritingDecision enum ---- */
function _mapUwDecision(d){
  if(!d) return 'NONE';
  if(d==='APPROVED'||d==='APPROVED_STP') return d;
  if(d==='REJECTED'||d==='DECLINED') return 'DECLINED';
  if(/LOADING/.test(d)) return 'APPROVED_WITH_LOADING';
  if(/EXCLUSION/.test(d)) return 'APPROVED_WITH_EXCLUSION';
  if(/CONDITION/.test(d)) return 'APPROVED_WITH_CONDITION';
  return 'APPROVED';
}

/* ---------------------------------------------------------------
 * caseStates(app) — derive 5 trường từ dữ liệu app.
 * Ưu tiên trường tường minh (mock case mới), fallback derive từ legacy status.
 * ------------------------------------------------------------- */
BANCA.caseStates = function(app){
  app = app || {};
  const legacy = app.status || (app.submissionState==='NOT_SUBMITTED' ? 'DRAFT' : 'SUBMITTED');

  // underwritingStatus
  let uwStatus = app.underwritingStatus;
  if(!uwStatus){
    if(app.stpDecision || app.uw) uwStatus='DECIDED';
    else if(legacy==='NEED_MORE_INFO') uwStatus='NEED_MORE_INFORMATION';
    else if(legacy==='IN_UW') uwStatus='IN_REVIEW';
    else if(['PENDING_UW','PENDING_RECEIPT'].includes(legacy)) uwStatus='PENDING';
    else if(['DRAFT'].includes(legacy)||app.submissionState==='NOT_SUBMITTED') uwStatus='NOT_STARTED';
    else uwStatus='NOT_STARTED';
  }

  // underwritingDecision
  let uwDecision = app.underwritingDecision
    || (app.stpDecision && app.stpDecision.decision)
    || (app.uw && _mapUwDecision(app.uw.decision))
    || 'NONE';

  // paymentStatus
  let payStatus = app.paymentStatus;
  if(!payStatus){
    if(app.payment && app.payment.status){
      payStatus = app.payment.status; // METHOD_REQUIRED/PENDING/PROCESSING/SUCCESS/FAILED/EXPIRED/CANCELLED
    } else if(legacy==='PAYMENT_METHOD_REQUIRED'){
      payStatus='METHOD_REQUIRED';
    } else if(['PAID','ISSUED','PENDING_ISSUE'].includes(legacy)){
      payStatus='SUCCESS';
    } else if(legacy==='PENDING_PAYMENT'){
      payStatus='PENDING';
    } else {
      // Chưa được duyệt → payment chưa khả dụng.
      const approved = BANCA.UW_APPROVED_CLEAN.includes(uwDecision)
        || (BANCA.isApprovedWithTerms(uwDecision) && app.confirm);
      payStatus = approved ? 'METHOD_REQUIRED' : 'NOT_AVAILABLE';
    }
  }

  // policyStatus
  let polStatus = app.policyStatus;
  if(!polStatus){
    if(legacy==='ISSUED') polStatus='ISSUED';
    else if(legacy==='PENDING_ISSUE') polStatus='ISSUING';
    else polStatus='NOT_STARTED';
  }

  // applicationStatus
  let appStatus = app.applicationStatus;
  if(!appStatus){
    if(app.submissionState==='NOT_SUBMITTED') appStatus= (legacy==='READY_TO_SUBMIT'?'READY_TO_SUBMIT':'DRAFT');
    else if(legacy==='CANCELLED') appStatus='CANCELLED';
    else if(polStatus==='ISSUED') appStatus='COMPLETED';
    else appStatus='PROCESSING';
  }

  return {
    applicationStatus: appStatus,
    underwritingStatus: uwStatus,
    underwritingDecision: uwDecision,
    paymentStatus: payStatus,
    policyStatus: polStatus,
    underwritingMode: (BANCA.journeyFor(app.productId).underwritingMode)||'RULE_BASED'
  };
};

/* ---------------------------------------------------------------
 * Gating helpers dùng chung (business gating cho thanh toán).
 * ------------------------------------------------------------- */
// Số tiền cần thanh toán — ưu tiên phí điều chỉnh sau thẩm định, rồi quote, rồi premium.
BANCA._payAmount = function(app){
  app = app || {};
  const q = app.quote || {};
  return (app.uw && app.uw.newPremium)
    || q.premium || q.totalPremium || q.adjustedPremium
    || (q.premiumBreakdown && q.premiumBreakdown.totalPremium)
    || app.premium || 0;
};
// Xác nhận khách hàng đã hoàn tất chưa.
//  - Health (multi-insured có theo dõi per-member): TẤT CẢ thành viên bắt buộc phải CONFIRMED.
//  - MỌI quyết định chấp thuận khác (kể cả STP sạch APPROVED_STP/APPROVED của Motor/Health/PA
//    và chấp thuận-có-điều-kiện/phụ phí/loại trừ): bắt buộc có xác nhận khách hàng
//    (OTP VERIFIED / confirmedAt) trước khi thanh toán.
//  Nguyên tắc (§corrective §4): STP KHÔNG miễn OTP —
//    APPROVED_STP → CUSTOMER_CONFIRMATION_PENDING → OTP_VERIFIED/CUSTOMER_CONFIRMED → PAYMENT.
BANCA.confirmationComplete = function(app){
  app = app || {};
  const s = BANCA.caseStates(app);
  const otpOk = !!(app.confirm && (app.confirm.otp==='VERIFIED' || app.confirm.confirmedAt));
  if(app.productId==='health' && Array.isArray(app.insuredMembers)
     && app.insuredMembers.some(function(m){ return m.confirmation || m.underwriting; })){
    const active = app.insuredMembers.filter(function(m){ return m.active!==false; });
    if(!active.length) return false;
    return active.every(function(m){ return (m.confirmation||{}).status==='CONFIRMED'; });
  }
  // Chưa được chấp thuận thì không có gì để xác nhận; đã chấp thuận thì phải có OTP/confirmation.
  if(BANCA.isApprovedDecision(s.underwritingDecision)) return otpOk;
  return false;
};

/* ---------------------------------------------------------------
 * deriveCaseViewState(app) — CANONICAL resolver (§III).
 * Trả về view-state duy nhất cho mọi component.
 * ------------------------------------------------------------- */
BANCA.deriveCaseViewState = function(app){
  const s = BANCA.caseStates(app);
  // ---- Business gating: canInitiatePayment ----
  // Chỉ true khi: đã chấp thuận + xác nhận đủ + quote còn hiệu lực + amount>0
  // + không có blocker + chưa có payment đang chạy/đã thành công.
  const _approved  = BANCA.isApprovedDecision(s.underwritingDecision);
  const _confirmed = BANCA.confirmationComplete(app);
  const _amount    = BANCA._payAmount(app);
  // §9.2 — GATE DUY NHẤT: paymentEnableRule. Resolver không tự suy luận điều kiện thanh toán
  // song song nữa; nó chỉ mang theo lý do để UI hiển thị khi CTA bị disabled (§15.3).
  // Fail-safe: thiếu config → KHOÁ thanh toán kèm lý do, không mở nhầm (fail closed).
  const _payGate = BANCA.paymentEnableRule
    ? BANCA.paymentEnableRule(app)
    : {enabled:false, reasons:['Chưa nạp cấu hình điều kiện thanh toán']};
  const canInitiatePayment = _payGate.enabled;
  const owner = (app && app.owner===((BANCA.current&&BANCA.current())));
  const A = {
    trackUw:   {key:'trackUw',   label:'Theo dõi thẩm định', tab:'uw'},
    supplement:{key:'supplement',label:'Bổ sung thông tin',  tab:'supplement'},
    confirm:   {key:'confirm',   label:'Xác nhận điều kiện',  tab:'confirm'},
    chooseMethod:{key:'chooseMethod',label:'Khởi tạo thanh toán', tab:'payment'},
    trackPay:  {key:'trackPay',  label:'Theo dõi thanh toán', tab:'payment'},
    retryPay:  {key:'retryPay',  label:'Thử lại thanh toán',  tab:'payment'},
    trackIssue:{key:'trackIssue',label:'Theo dõi phát hành',  tab:'overview'},
    retryIssue:{key:'retryIssue',label:'Thử phát hành lại',   tab:'policy'},
    viewPolicy:{key:'viewPolicy',label:'Xem hợp đồng',        tab:'policy'},
    viewReason:{key:'viewReason',label:'Xem lý do',           tab:'uw'},
    viewHist:  {key:'viewHist',  label:'Xem lịch sử',         tab:'history'}
  };
  const base = {
    states:s, phase:null, displayStatus:'', statusTone:'wait',
    primaryAction:null, secondaryActions:[], currentStep:null, nextActionLabel:'',
    paymentAccessible:false, underwritingAccessible:true,
    canCreatePaymentIntent:canInitiatePayment, canInitiatePayment:canInitiatePayment,
    paymentBlockReasons:_payGate.reasons, workQueueType:null
  };
  const R = o => Object.assign(base, o);

  // 1. Cancelled
  if(s.applicationStatus==='CANCELLED')
    return R({phase:'CANCELLED', displayStatus:'Đã hủy', statusTone:'danger', primaryAction:A.viewHist, nextActionLabel:'Yêu cầu đã hủy'});

  // 2. Declined
  if(s.underwritingDecision==='DECLINED')
    return R({phase:'DECLINED', displayStatus:'Bị từ chối', statusTone:'danger', primaryAction:A.viewReason, nextActionLabel:'Yêu cầu bị từ chối', workQueueType:null});

  // 3. Need more information
  if(s.underwritingStatus==='NEED_MORE_INFORMATION')
    return R({phase:'NEED_MORE_INFORMATION', displayStatus:'Cần bổ sung', statusTone:'danger',
      primaryAction:A.supplement, secondaryActions:[A.trackUw], nextActionLabel:'Cần bổ sung thông tin/tài liệu',
      paymentAccessible:false, workQueueType:'SUPPLEMENT'});

  // 4. Thẩm định pending/processing/in-review (chưa có decision)
  if(['PROCESSING','PENDING','IN_REVIEW'].includes(s.underwritingStatus) && s.underwritingDecision==='NONE')
    return R({phase:'UNDERWRITING_PENDING', displayStatus:'Chờ thẩm định', statusTone:'wait',
      primaryAction:A.trackUw, nextActionLabel: s.underwritingMode==='STP'?'Đang chấp thuận tự động':'Đang chờ thẩm định',
      paymentAccessible:false, workQueueType: s.underwritingMode==='STP'?null:'UW'});

  // 5. Đã chấp thuận nhưng chưa hoàn tất xác nhận khách hàng
  //    (Motor chấp thuận-có-điều-kiện HOẶC Health per-member chưa đủ CONFIRMED).
  if(_approved && s.paymentStatus!=='SUCCESS' && !['PENDING','PROCESSING'].includes(s.paymentStatus) && !_confirmed)
    return R({phase:'CUSTOMER_CONFIRMATION_REQUIRED', displayStatus:'Chờ khách xác nhận', statusTone:'info',
      primaryAction:A.confirm, secondaryActions:[A.trackUw], nextActionLabel:'Khách cần xác nhận trước khi thanh toán',
      paymentAccessible:false, workQueueType:'CONFIRM'});

  // 6. Đã xác nhận đủ, chưa khởi tạo thanh toán (payment method required)
  if(s.paymentStatus==='METHOD_REQUIRED')
    return R({phase:'PAYMENT_METHOD_REQUIRED', displayStatus:'Chờ thanh toán', statusTone:'info',
      primaryAction:A.chooseMethod, nextActionLabel:'Khởi tạo thanh toán cho khách',
      paymentAccessible:true, canCreatePaymentIntent:canInitiatePayment, workQueueType:'CHOOSE_PAYMENT'});

  // 7. Payment pending / failed / expired
  if(s.paymentStatus==='PENDING')
    return R({phase:'PAYMENT_PENDING', displayStatus:'Chờ thanh toán', statusTone:'wait',
      primaryAction:A.trackPay, nextActionLabel:'Khách hoàn tất thanh toán', paymentAccessible:true, workQueueType:'TRACK_PAYMENT'});
  if(['FAILED','EXPIRED'].includes(s.paymentStatus))
    return R({phase:'PAYMENT_FAILED', displayStatus:(s.paymentStatus==='EXPIRED'?'Thanh toán hết hạn':'Thanh toán thất bại'), statusTone:'danger',
      primaryAction:A.retryPay, nextActionLabel:'Thử lại thanh toán', paymentAccessible:true, workQueueType:'TRACK_PAYMENT'});

  // 8. Payment processing
  if(s.paymentStatus==='PROCESSING')
    return R({phase:'PAYMENT_PROCESSING', displayStatus:'Đang xử lý thanh toán', statusTone:'wait',
      primaryAction:A.trackPay, nextActionLabel:'Đang xử lý thanh toán', paymentAccessible:true});

  // 9-10. Payment success → policy issue
  if(s.paymentStatus==='SUCCESS'){
    if(s.policyStatus==='ISSUING')
      return R({phase:'POLICY_ISSUING', displayStatus:'Đang phát hành hợp đồng', statusTone:'wait',
        primaryAction:A.trackIssue, nextActionLabel:'Core đang phát hành hợp đồng', paymentAccessible:true});
    if(s.policyStatus==='ISSUE_FAILED')
      return R({phase:'POLICY_ISSUE_FAILED', displayStatus:'Phát hành lỗi', statusTone:'danger',
        primaryAction:A.retryIssue, secondaryActions:[A.viewHist], nextActionLabel:'Phát hành lỗi — thử lại hoặc chuyển hỗ trợ (đã thanh toán, không thu lại)', paymentAccessible:true});
    if(s.policyStatus==='ISSUED')
      return R({phase:'POLICY_ISSUED', displayStatus:'Đã phát hành', statusTone:'ok',
        primaryAction:A.viewPolicy, nextActionLabel:'Hợp đồng đã phát hành', paymentAccessible:true});
    // SUCCESS nhưng chưa bắt đầu issue
    return R({phase:'READY_TO_ISSUE', displayStatus:'Đã thanh toán — chờ phát hành', statusTone:'wait',
      primaryAction:A.trackIssue, nextActionLabel:'Chuẩn bị phát hành hợp đồng', paymentAccessible:true});
  }

  // Fallback: chưa đủ điều kiện (pre-approval)
  return R({phase:'PROCESSING', displayStatus:'Đang xử lý', statusTone:'wait',
    primaryAction:A.trackUw, nextActionLabel:'Đang xử lý hồ sơ', paymentAccessible:false});
};

// Badge helper theo view-state.
BANCA.caseStatusBadge = function(app){
  const v = BANCA.deriveCaseViewState(app);
  const cls = {ok:'badge-ready', wait:'badge-pending', info:'badge-conditional', danger:'badge-blocked'}[v.statusTone]||'badge-pending';
  return '<span class="badge '+cls+'">'+v.displayStatus+'</span>';
};
