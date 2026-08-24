// ============================================================
// STATEMENT OF FACT — bản khai khách hàng XÁC NHẬN trước khi nộp.
//
// Nền nghiệp vụ  [CII IF3 ch.2 mục A, B · ch.1 mục D1]
//   2/3 B  "For consumers, proposal forms also contain a declaration. The
//           declaration states that the information supplied by the proposer is
//           true and correct… and MUST BE SIGNED BY THE PROPOSER."
//   2/2 A  quotation pack BAO GỒM statement of fact; "For consumers,
//           documentation goes as far as CONFIRMING ALL QUESTIONS ASKED AND
//           ANSWERS PROVIDED."
//   2/4    bán qua điện thoại/internet: câu trả lời "are then captured by the
//           insurer and REPEATED BACK to the proposer"; CẤM câu trả lời giả định.
//
// Vì sao phải ghi AI TRẢ LỜI từng câu:
//   IF3 1/8–1/9 D1 phân nhánh hậu quả theo TRẠNG THÁI TINH THẦN của người khai —
//     cố ý / liều lĩnh → huỷ đơn coi như chưa từng tồn tại, từ chối mọi bồi thường
//     sơ suất          → chỉ được sửa điều khoản hoặc GIẢM BỒI THƯỜNG THEO TỶ LỆ
//     trung thực+hợp lý→ DNBH VẪN PHẢI TRẢ
//   Không biết ai trả lời thì KHÔNG PHÂN NHÁNH ĐƯỢC. `answeredBy` là trường rẻ
//   nhất ở đây nhưng là thứ duy nhất phân biệt "khách khai sai" với "nhân viên gõ sai".
//
// Quan hệ với các khối đã có — TÁI DÙNG, không đẻ khái niệm mới:
//   · makeConsentRecord()  → cùng khuôn bản ghi, chỉ khác consentType
//   · declarationSchemaId  → đã đánh version sẵn (motorDeclaration@1)
//   · declaration.*        → cờ khai báo sống lại (IF3 1/7 C3C/C3D)
//   · paymentEnableRule    → cùng cổng chặn, lý do phát ra thành chữ (§15.3)
// ============================================================
window.BANCA = window.BANCA || {};

// Ai đã đưa ra câu trả lời. KHÔNG có giá trị mặc định "coi như khách trả lời" —
// đó chính là "assumptive answer" mà IF3 2/4 cấm.
BANCA.ANSWER_SOURCE = {
  CUSTOMER:                 {code:'CUSTOMER',                 label:'Khách tự trả lời',            attributable:true},
  SELLER_ON_BEHALF:         {code:'SELLER_ON_BEHALF',         label:'Nhân viên nhập hộ',           attributable:true},
  PREFILLED_FROM_BANK:      {code:'PREFILLED_FROM_BANK',      label:'Lấy sẵn từ dữ liệu ngân hàng',attributable:false},
  PREFILLED_FROM_PREVIOUS:  {code:'PREFILLED_FROM_PREVIOUS',  label:'Kế thừa kỳ trước',            attributable:false}
};

BANCA.statementOfFact = {
  CONSENT_TYPE: 'DECLARATION_ACCURACY',

  // Băm nội dung bản khai. Đổi một câu trả lời là hash đổi → phát hiện được
  // việc sửa sau khi khách đã xác nhận. Cùng lối với inputHashOf của báo giá.
  hash: function (answers, schemaId) {
    var a = answers || {};
    var keys = Object.keys(a).sort();
    return JSON.stringify([schemaId || null, keys.map(function (k) { return [k, a[k]]; })]);
  },

  // Dựng bản khai để ĐỌC LẠI CHO KHÁCH NGHE (IF3 2/4 "repeated back").
  // Trả về từng câu + câu trả lời + AI đã trả lời, không phải một cục JSON.
  build: function (app) {
    app = app || {};
    var schemaId = (BANCA.journeyFor ? (BANCA.journeyFor(app.productId) || {}).declarationSchemaId : null) || null;
    var questions = BANCA.riskQuestionsFor ? BANCA.riskQuestionsFor(app.productId) : [];
    var answers = app.riskAnswers || {};
    var by = app.answeredBy || {};
    var lines = questions.map(function (q) {
      var src = by[q.code] || null;
      // Câu hỏi có điều kiện (branchOn): chỉ áp dụng khi câu cha được trả lời "có".
      // Không nhánh nào kích hoạt thì câu đó KHÔNG PHẢI câu chưa trả lời — nó
      // không thuộc bản khai này. Đếm nhầm ở đây là chặn oan toàn bộ hồ sơ.
      var applicable = !q.branchOn || answers[q.branchOn] === true;
      var hasVal = (q.code in answers) && answers[q.code] !== null && answers[q.code] !== undefined && answers[q.code] !== '';
      return {
        code: q.code,
        label: q.label,
        applicable: applicable,
        answer: hasVal ? answers[q.code] : null,
        answered: applicable ? hasVal : true,   // không áp dụng ⇒ coi như xong
        answeredBy: src,
        answeredByLabel: src ? (BANCA.ANSWER_SOURCE[src] || {}).label || src : null
      };
    });
    return {
      schemaId: schemaId,
      lines: lines,
      answersHash: BANCA.statementOfFact.hash(answers, schemaId),
      unanswered: lines.filter(function (l) { return l.applicable && !l.answered; }).map(function (l) { return l.code; }),
      // IF3 2/4: không được để câu nào không rõ ai trả lời.
      unattributed: lines.filter(function (l) { return l.applicable && l.answered && !l.answeredBy; }).map(function (l) { return l.code; })
    };
  },

  // Khách xác nhận nội dung bản khai. Dùng CHUNG khuôn makeConsentRecord.
  confirm: function (app, opts) {
    opts = opts || {};
    var sof = BANCA.statementOfFact.build(app);
    if (sof.unanswered.length) throw new Error('Còn câu chưa trả lời: ' + sof.unanswered.join(', '));
    if (sof.unattributed.length) throw new Error('Còn câu chưa ghi nhận ai trả lời: ' + sof.unattributed.join(', '));
    var rec = BANCA.makeConsentRecord({
      consentType: BANCA.statementOfFact.CONSENT_TYPE,
      consentVersion: sof.schemaId || 'declaration@?',
      consentChannel: opts.channel,
      customerRef: app.customerId || opts.customerRef,
      sourceSystem: opts.sourceSystem || 'PORTAL'
    });
    rec.declarationSchemaId = sof.schemaId;
    rec.answersHash = sof.answersHash;
    rec.confirmedBy = opts.by || 'CUSTOMER';   // ai bấm xác nhận
    rec.otp = opts.otp || null;
    app.statementOfFact = rec;
    return app;
  },

  // NOT_READY  — còn câu chưa trả lời / chưa ghi ai trả lời
  // PENDING    — đủ nội dung, chưa gửi khách xác nhận
  // CONFIRMED  — khách đã xác nhận, nội dung chưa đổi
  // STALE      — khách đã xác nhận NHƯNG câu trả lời đổi sau đó
  status: function (app) {
    app = app || {};
    var sof = BANCA.statementOfFact.build(app);
    if (sof.unanswered.length || sof.unattributed.length) return 'NOT_READY';
    var rec = app.statementOfFact;
    if (!rec) return 'PENDING';
    if (rec.answersHash !== sof.answersHash) return 'STALE';
    return 'CONFIRMED';
  },

  // Lý do chặn, dạng chữ — để cổng thanh toán/nộp dùng lại (§15.3).
  blockingReason: function (app) {
    var st = BANCA.statementOfFact.status(app);
    if (st === 'CONFIRMED') return null;
    var sof = BANCA.statementOfFact.build(app);
    if (st === 'NOT_READY') {
      if (sof.unanswered.length)   return 'Bản khai còn ' + sof.unanswered.length + ' câu chưa trả lời';
      return 'Bản khai còn ' + sof.unattributed.length + ' câu chưa ghi nhận ai trả lời (khách tự khai hay nhân viên nhập hộ)';
    }
    if (st === 'STALE') return 'Nội dung khai báo đã thay đổi sau khi khách xác nhận — cần khách xác nhận lại';
    return 'Khách chưa xác nhận nội dung bản khai';
  }
};
