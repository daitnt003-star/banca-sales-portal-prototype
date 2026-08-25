// ============================================================
// ĐỒNG HỒ DEMO — MỘT nguồn thời gian duy nhất cho toàn hệ.
//
// Vì sao cần: dữ liệu mẫu được dựng quanh 20–26/07/2026 (báo giá hết hạn
// 10–15/08, hồ sơ hết hạn 18–22/08). Nhưng hạn báo giá lại đo bằng GIỜ MÁY
// THẬT. Đến 25/08/2026 thì MỌI báo giá trong demo đều EXPIRED và không hồ sơ
// nào nộp được — cả bản demo tự hỏng theo thời gian.
//
// Repo vốn đã có mốc demo ngầm (SLA dùng cứng '2026-07-20T15:30', nhiều chỗ
// ghi cứng tiền tố '2026-07-23 '), nhưng ba bốn nơi mỗi nơi một kiểu. Gom về
// một chỗ để không còn hai loại "hiện tại" chạy song song.
//
// Đổi mốc: đặt localStorage 'bancaDemoNow' = 'YYYY-MM-DDTHH:MM:SS'.
// Chạy theo giờ thật: đặt 'bancaDemoNow' = 'REAL'.
// ============================================================
window.BANCA = window.BANCA || {};

// Chọn 2026-07-23 10:00 vì trùng mốc các bản ghi seed đã ghi cứng
// ('2026-07-23 ' trong luồng nộp/thẩm định/thanh toán) và nằm trong hạn của
// gần hết báo giá mẫu — vẫn giữ nguyên hai kịch bản cố ý:
//   · validUntil 2026-07-14 → EXPIRED (demo báo giá hết hạn)
//   · validUntil 2026-07-25 → EXPIRING_SOON (còn 2 ngày)
BANCA.DEMO_NOW = '2026-07-23T10:00:00';

BANCA.now = function () {
  var override = null;
  try { override = localStorage.getItem('bancaDemoNow'); } catch (e) {}
  if (override === 'REAL') return new Date();
  var iso = override || BANCA.DEMO_NOW;
  var d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
};
BANCA.nowISODate = function () {
  var d = BANCA.now(), p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
};
// Nhãn 'YYYY-MM-DD HH:MM' cho bản ghi tạo tại portal.
BANCA.nowLabel = function () {
  var d = BANCA.now(), p = function (n) { return String(n).padStart(2, '0'); };
  return BANCA.nowISODate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
};
