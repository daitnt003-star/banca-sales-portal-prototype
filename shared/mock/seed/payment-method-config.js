// ============================================================
// Payment method config (§9.3 + §16) — NGUỒN DUY NHẤT khai báo phương thức thanh toán.
// Motor và Health KHÔNG có card riêng: cùng 3 method, chỉ khác việc method nào
// được bật theo product/channel. Page không hard-code method (§16).
// ============================================================
window.BANCA = window.BANCA || {};

BANCA.PAYMENT_METHODS = [
  {
    id: 'QR',
    experience: 'CUSTOMER_PRESENT_QR',
    label: 'Quét mã QR',
    icon: '▦',
    desc: 'Hiển thị mã QR kèm số tiền, mã tham chiếu và hạn thanh toán để khách quét.',
    bestFor: 'Khách đang có mặt tại quầy',
    actor: 'CUSTOMER'
  },
  {
    id: 'PAYMENT_LINK',
    experience: 'CUSTOMER_REMOTE',
    label: 'Gửi link thanh toán',
    icon: '✉',
    desc: 'Gửi liên kết thanh toán qua SMS/Email hoặc sao chép liên kết cho khách.',
    bestFor: 'Khách không có mặt / thanh toán sau',
    actor: 'CUSTOMER'
  },
  {
    id: 'SELLER_ASSISTED',
    experience: 'SELLER_DEVICE_ASSISTED',
    label: 'RM/Đại lý thu hộ',
    icon: '⌁',
    desc: 'Thực hiện trên thiết bị của RM. Khách tự nhập dữ liệu nhạy cảm và OTP trên cổng thanh toán.',
    bestFor: 'Khách có mặt nhưng không quét QR',
    actor: 'SELLER',
    // §17 — thu hộ cần quyền riêng, không chỉ ẩn nút.
    requiresCap: 'can_collect_payment'
  }
];

// Method khả dụng cho 1 case: theo product journey definition (nếu có khai báo),
// nếu không khai báo thì dùng cả 3. Trả kèm lý do khi method bị chặn (§15.3).
BANCA.paymentMethodsFor = function (app, opts) {
  app = app || {}; opts = opts || {};
  var journey = BANCA.journeyFor ? BANCA.journeyFor(app.productId) : null;
  var allowed = (journey && journey.paymentMethods) || null;
  var me = opts.me || (BANCA.current && BANCA.current());
  var rd = (opts.readiness !== undefined) ? opts.readiness
    : (BANCA.readinessFor ? BANCA.readinessFor(app.productId, me) : null);

  return BANCA.PAYMENT_METHODS.filter(function (m) {
    return !allowed || allowed.indexOf(m.id) >= 0 || allowed.indexOf(m.experience) >= 0;
  }).map(function (m) {
    var blocked = null;
    if (m.requiresCap && rd && rd.caps && rd.caps.indexOf(m.requiresCap) < 0) {
      blocked = 'Bạn không có quyền thu hộ cho sản phẩm này';
    }
    return Object.assign({}, m, { blockedReason: blocked });
  });
};
