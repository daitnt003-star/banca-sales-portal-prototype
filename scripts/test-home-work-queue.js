#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const home = fs.readFileSync(path.join(__dirname, '..', 'modules', 'seller-workspace', 'index.html'), 'utf8');
let pass = 0, fail = 0;
function ok(name, condition) {
  if (condition) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name); }
}
function group(title) { console.log('\n' + title); }
function occurrences(text, value) { return text.split(value).length - 1; }

group('1. Work item contract, dedupe and order');
['HANDOFF:', 'SUPPLEMENT:', 'QUOTE:', 'SUBMIT:'].forEach(function (prefix) {
  ok('Stable key ' + prefix, home.includes("key:'" + prefix));
});
['HANDOFF', 'SUPPLEMENT', 'QUOTE', 'SUBMIT'].forEach(function (category) {
  ok('Category ' + category, home.includes("category:'" + category + "'"));
});
ok('Dedupe theo stable key trước render', home.includes('new Map(items.map(it=>[it.key,it]))'));
ok('Sort overdue trước', home.includes('const ao=a.rt.overdue?0:1,bo=b.rt.overdue?0:1'));
ok('Sort severity sau overdue', home.includes('rank[a.severity]') && home.indexOf('rank[a.severity]') > home.indexOf('const ao=a.rt.overdue'));
ok('Sort due sau severity', home.includes('return a.rt.order-b.rt.order'));

group('2. Unified queue, filter and expansion');
ok('Chỉ còn một Work Queue', occurrences(home, '<h2>Việc cần làm ngay</h2>') === 1);
ok('Không còn section Bàn giao mới', !home.includes('<h2>Bàn giao mới</h2>') && !home.includes('handoffInbox()'));
ok('ALL và bốn category filter có mặt', home.includes("['ALL','Tất cả']") && ['HANDOFF', 'SUPPLEMENT', 'QUOTE', 'SUBMIT'].every(function (c) {
  return home.includes("['" + c + "',");
}));
ok('Filter active có text và aria-pressed', home.includes("active?'Đang lọc: ':'") && home.includes('aria-pressed="${active}"'));
ok('Filter ALL khôi phục hàng chờ', home.includes("workQueueSetFilter('ALL')"));
ok('Giới hạn mặc định tám', home.includes('filtered.slice(0,8)'));
ok('Mở rộng và thu gọn tại chỗ', home.includes('workQueueToggleExpanded') && home.includes("'Thu gọn':'Xem tất cả ("));

group('3. Actions and states');
ok('Primary label bàn giao theo type', ['Tiếp nhận & bán hàng', 'Tiếp nhận & xử lý', 'Bắt đầu công việc'].every(function (label) {
  return home.includes(label);
}));
ok('Mỗi contract chỉ có một primaryActionHtml', occurrences(home, 'primaryActionHtml:') === 4);
ok('Secondary trigger mở dialog hiện hữu', home.includes('aria-haspopup="dialog"') && home.includes("onclick=\"hoMore('"));
ok('Secondary actions gọi handler hiện hữu', ['hoReview', 'hoNeedInfo', 'hoDecline'].every(function (handler) {
  return home.includes("onclick=\"" + handler + "('${id}')");
}));
ok('Loading state có status text', home.includes("workQueueStatus==='loading'") && home.includes('role="status"'));
ok('Error state có retry', home.includes('role="alert"') && home.includes('workQueueRetry()'));
ok('Empty toàn hàng chờ có thông báo', home.includes('Không có việc cần làm. Bạn đã xử lý hết hàng chờ hôm nay.'));
ok('Filter-empty có recovery về ALL', home.includes('Không có việc trong nhóm này.') && home.includes('Xem tất cả việc'));

group('4. Privacy and lower-home safety');
ok('Banca handoff dùng tham chiếu khóa', home.includes("'🔒 '+anonHandoffRef(h)"));
ok('Agent/Broker vẫn có tên và CIF bàn giao', home.includes("h.customerName+(h.cif?' · CIF '+h.cif:'')"));
['Bản chào chưa nộp gần đây', 'Trạng thái xử lý bản chào đã nộp', 'Hiệu suất cá nhân', '<h2>Hợp đồng</h2>', '<h2>Thông báo</h2>'].forEach(function (section) {
  ok('Giữ section: ' + section.replace(/<[^>]+>/g, ''), home.includes(section));
});

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
