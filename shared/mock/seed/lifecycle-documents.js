// ============================================================
// HAI CHỨNG TỪ VÒNG ĐỜI CÒN THIẾU: COVER NOTE và RENEWAL NOTICE
// ============================================================
window.BANCA = window.BANCA || {};

/* ------------------------------------------------------------
 * 1. COVER NOTE — giấy chứng nhận bảo hiểm TẠM THỜI
 *
 * [CII IF3 2/9–2/10 mục D2]
 *   "A cover note is essentially a document issued as evidence that insurance
 *    has been granted, PENDING THE ISSUE OF A POLICY."
 *   Dùng khi: chờ khảo sát · chờ hoàn tất giấy yêu cầu · thêm lái xe mới.
 *   Nội dung: ngày (và GIỜ với xe cơ giới) bắt đầu · theo điều khoản chuẩn của
 *   DNBH cho nghiệp vụ đó · thông tin nhận dạng đối tượng · điều kiện đặc biệt ·
 *   ngày hết hiệu lực. Cover note là TẠM và bị thay thế khi đơn được cấp.
 *
 *   ⚠️ IF3 nói rõ với xe cơ giới: "the time and date must NEVER BE BACKDATED
 *      on a cover note as, under the Road Traffic Act 1988, THIS IS ILLEGAL."
 *      → chặn ở tầng code, không để người dùng tự giác.
 *
 * Ưu tiên theo kênh: banca bán tại quầy, phát hành ngay → ít cần.
 * ĐẠI LÝ bán tại showroom trả góp → cần bằng chứng bảo hiểm NGAY LẬP TỨC.
 *
 * [VN] Giấy chứng nhận bảo hiểm bắt buộc TNDS chủ xe cơ giới ở Việt Nam có quy
 *      định RIÊNG về nội dung — kho không có văn bản này. Tra Bộ Tài chính,
 *      KHÔNG suy từ Road Traffic Act 1988 của Anh.
 * ---------------------------------------------------------- */
BANCA.COVER_NOTE_REASONS = {
  AWAITING_SURVEY:   'Chờ khảo sát rủi ro',
  AWAITING_PROPOSAL: 'Chờ hoàn tất giấy yêu cầu bảo hiểm',
  MID_TERM_CHANGE:   'Thay đổi giữa kỳ, chờ cấp phụ lục',
  AWAITING_ISSUE:    'Chờ cấp đơn chính thức'
};
BANCA.coverNotes = BANCA.coverNotes || [];

BANCA.issueCoverNote = function (o) {
  o = o || {};
  var nowIso = new Date().toISOString();
  var from = o.effectiveFrom || nowIso;
  // Chặn lùi ngày/giờ (IF3 2/10 — với xe cơ giới là bất hợp pháp).
  if (from < nowIso.slice(0, 10)) throw new Error('Không được lùi ngày hiệu lực trên giấy chứng nhận tạm thời.');
  if (o.productId === 'motor' && from < nowIso)
    throw new Error('Xe cơ giới: không được lùi ngày/giờ hiệu lực trên giấy chứng nhận tạm thời (IF3 2/10).');
  if (!o.expiresAt) throw new Error('Giấy chứng nhận tạm thời phải có ngày hết hiệu lực.');

  var rec = {
    id: o.id || ('CN-' + (BANCA.coverNotes.length + 1001)),
    caseId: o.caseId || null,
    productId: o.productId || null,
    reason: o.reason || 'AWAITING_ISSUE',
    reasonLabel: BANCA.COVER_NOTE_REASONS[o.reason || 'AWAITING_ISSUE'],
    effectiveFrom: from,          // với motor phải có cả GIỜ
    expiresAt: o.expiresAt,
    subject: o.subject || null,   // biển số / mô tả đối tượng
    specialTerms: o.specialTerms || [],
    standardWordingRef: o.standardWordingRef || 'Điều khoản chuẩn của DNBH cho nghiệp vụ này',
    issuedBy: o.issuedBy || (BANCA.current && BANCA.current()),
    status: 'ACTIVE',             // ACTIVE | SUPERSEDED | EXPIRED
    supersededByPolicyId: null
  };
  BANCA.coverNotes.push(rec);
  return rec;
};

// Cấp đơn chính thức → cover note bị THAY THẾ (IF3: "is superseded once the
// policy and insurance certificate are issued").
BANCA.supersedeCoverNote = function (caseId, policyId) {
  var n = 0;
  (BANCA.coverNotes || []).forEach(function (c) {
    if (c.caseId === caseId && c.status === 'ACTIVE') {
      c.status = 'SUPERSEDED'; c.supersededByPolicyId = policyId || null; n++;
    }
  });
  return n;
};

BANCA.coverNoteFor = function (caseId) {
  return (BANCA.coverNotes || []).find(function (c) { return c.caseId === caseId && c.status === 'ACTIVE'; }) || null;
};

/* ------------------------------------------------------------
 * 2. RENEWAL NOTICE — thông báo tái tục
 *
 * [CII IF3 4/2–4/3 mục A · CII IF1 3/5–3/6 tr.89–90 mục D]
 *   Renewal notice "will bring to the insured's attention that the period of
 *   insurance is coming to an end; it will also contain the renewal premium,
 *   and any proposed changes in the terms and conditions."
 *
 * [CII IF3 1/7 mục C3D] tại tái tục phải kéo lại câu trả lời cũ và hỏi khách
 *   "còn đúng không" → nối thẳng vào BANCA.declaration.markNeedsReconfirm.
 *
 * [VN] ⚠️ Các yêu cầu ĐỊNH LƯỢNG của Anh (nêu phí năm trước · khuyến khích so
 *      sánh thị trường · cảnh báo riêng cho khách đã tái tục 4 LẦN LIÊN TIẾP)
 *      là quy định FCA. KHÔNG áp thẳng cho Việt Nam. Ở đây lấy CẤU TRÚC DỮ LIỆU,
 *      không lấy NGHĨA VỤ — bật/tắt từng mục bằng cấu hình bên dưới.
 * ---------------------------------------------------------- */
BANCA.renewalNoticeConfig = {
  showPreviousPremium: true,      // cấu hình, không phải nghĩa vụ mặc định
  encourageShopAround: false,     // [VN] chỉ bật khi luật VN yêu cầu
  loyaltyWarnAfterRenewals: null, // Anh dùng 4; VN chưa xác định → null = tắt
  noticeDaysBefore: 30
};

BANCA.buildRenewalNotice = function (policy, opts) {
  opts = opts || {};
  policy = policy || {};
  var cfg = BANCA.renewalNoticeConfig;
  var prev = Number(policy.premium || 0);
  var next = Number(opts.renewalPremium || 0);
  var delta = (prev && next) ? next - prev : null;

  return {
    id: 'RN-' + (policy.id || 'X'),
    policyId: policy.id || null,
    customerId: policy.customerId || null,
    expiryDate: policy.expiryDate || policy.endDate || null,
    noticeDaysBefore: cfg.noticeDaysBefore,
    // Phí kỳ trước để khách so sánh — hiện theo cấu hình.
    previousPremium: cfg.showPreviousPremium ? prev : null,
    renewalPremium: next || null,
    premiumDelta: cfg.showPreviousPremium ? delta : null,
    premiumDeltaPct: (cfg.showPreviousPremium && prev && delta !== null) ? Math.round(delta / prev * 100) : null,
    proposedChanges: opts.proposedChanges || [],
    autoRenewal: !!opts.autoRenewal,
    // Auto-renewal PHẢI nói rõ với khách (IF3 4/2: "The FCA specifies that this
    // process must be communicated clearly to the customer").
    autoRenewalNotice: opts.autoRenewal
      ? 'Hợp đồng sẽ tự động tái tục và trừ phí theo uỷ nhiệm chi đã đăng ký. Khách có thể dừng bất cứ lúc nào.'
      : null,
    shopAroundNote: cfg.encourageShopAround ? 'Quý khách nên so sánh các lựa chọn trước khi tái tục.' : null,
    loyaltyNote: (cfg.loyaltyWarnAfterRenewals && (opts.consecutiveRenewals || 0) >= cfg.loyaltyWarnAfterRenewals)
      ? 'Quý khách đã tái tục ' + opts.consecutiveRenewals + ' kỳ liên tiếp.' : null,
    // IF3 1/7 C3D — bản khai kỳ trước phải được rà lại, không kế thừa mù.
    declarationReconfirmRequired: true,
    declarationNote: 'Tái tục là hợp đồng mới — cần rà lại và xác nhận các câu trả lời khai báo kỳ trước.',
    configSource: 'BANCA.renewalNoticeConfig',
    vietnamCheck: 'Nội dung bắt buộc của thông báo tái tục phải đối chiếu Luật KDBH 2022'
  };
};

// Bắt đầu tái tục: sinh hồ sơ mới + BẬT cờ rà lại khai báo (IF3 1/7 C3D).
BANCA.startRenewal = function (policy, newApp) {
  newApp = newApp || {};
  newApp.source = 'RENEWAL';
  newApp.parentPolicyId = policy && policy.id;
  if (BANCA.declaration) {
    BANCA.declaration.markNeedsReconfirm(newApp,
      'Tái tục — hợp đồng mới, cần rà lại câu trả lời khai báo kỳ trước (IF3 1/7 C3D)');
  }
  return newApp;
};
