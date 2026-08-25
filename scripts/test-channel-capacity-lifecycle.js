// Channel split + legal capacity + cover note + renewal notice test suite.
// Chạy: node scripts/test-channel-capacity-lifecycle.js
// Nền nghiệp vụ:
//   CII IF1 3/9 tr.94 F3A/F3B — tư cách pháp lý ĐỔI THEO TỪNG THAO TÁC
//   CPCU 520 A3 tr.3.20      — broker vs agent khác quyền bind & sở hữu sổ khách
//   CII IF3 2/9–2/10 D2      — cover note; motor CẤM lùi ngày
//   CII IF3 4/2–4/3 A        — renewal notice
//   CII IF3 1/7 C3D          — tái tục phải rà lại khai báo kỳ trước
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/sellers.js');
require('../shared/mock/seed/channel-profiles.js');
require('../shared/mock/seed/quote-version.js');
require('../shared/mock/seed/lifecycle-documents.js');
const B = global.BANCA;
B.current = () => 'RM-01';
B.setChannel = function (id) { LS['bancaChannel'] = id; };

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* 1. Tách kênh -------------------------------------------------------- */
grp('1. Đại lý và Môi giới là HAI profile riêng (IF1 3/9 · CPCU tr.3.20)');
ok('CHANNEL_ENUM có cả AGENT và BROKER',
  B.CHANNEL_ENUM.indexOf('AGENT') >= 0 && B.CHANNEL_ENUM.indexOf('BROKER') >= 0, B.CHANNEL_ENUM.join(','));
ok('nhãn tiếng Việt phân biệt được',
  B.CHANNEL_PROFILES.AGENT.label === 'Đại lý' && B.CHANNEL_PROFILES.BROKER.label === 'Môi giới');
ok('tên kênh CŨ vẫn nhận (không vỡ link/demo cũ)',
  B.channelProfile('AGENT_BROKER').id === 'AGENT', B.channelProfile('AGENT_BROKER').id);
ok('banca KHÔNG mang nhãn trung gian',
  !B.CHANNEL_PROFILES.BANCA_INTEGRATED.intermediaryKind && !B.CHANNEL_PROFILES.BANCA_STANDALONE.intermediaryKind);

/* 2. Tư cách pháp lý theo HÀNH ĐỘNG ----------------------------------- */
grp('2. Tư cách gắn vào HÀNH ĐỘNG, không gắn vào tài khoản (IF1 3/9 tr.94)');
const advise = B.capacityFor('ADVISE_COVER', 'BROKER');
const collect = B.capacityFor('COLLECT_PREMIUM', 'BROKER');
ok('môi giới TƯ VẤN → đại diện KHÁCH HÀNG', advise.capacity === 'CUSTOMER', JSON.stringify(advise));
ok('môi giới THU PHÍ → đại diện DNBH', collect.capacity === 'INSURER', JSON.stringify(collect));
ok('  …cùng một kênh, HAI tư cách khác nhau → đúng điểm IF1 nhấn mạnh',
  advise.capacity !== collect.capacity);
ok('hỗ trợ bồi thường cũng là đại diện khách (IF1 3/9 F3A)',
  B.capacityFor('ASSIST_CLAIM', 'BROKER').capacity === 'CUSTOMER');
ok('có nhãn hiển thị cho người dùng, không lộ mã',
  /đại diện KHÁCH HÀNG/i.test(advise.label), advise.label);

const agentAdvise = B.capacityFor('ADVISE_COVER', 'AGENT');
ok('đại lý tư vấn → KHÔNG khẳng định bừa, đánh dấu cần đối chiếu luật VN',
  agentAdvise.capacity === 'UNDETERMINED' && agentAdvise.needsVietnamCheck === true, JSON.stringify(agentAdvise));
ok('  …ghi rõ nguồn là luật Anh, cần đối chiếu KDBH 2022',
  /Lu[âậ]t KDBH 2022/.test(agentAdvise.source || ''), agentAdvise.source);
ok('banca → không áp dụng trục tư cách trung gian',
  B.capacityFor('ADVISE_COVER', 'BANCA_INTEGRATED').capacity === 'NA');

/* 3. Cover note ------------------------------------------------------- */
grp('3. Cover note — bằng chứng bảo hiểm tạm thời (IF3 2/9–2/10 D2)');
const cn = B.issueCoverNote({ caseId:'APP-CN1', productId:'motor', reason:'AWAITING_SURVEY',
  subject:'51G-445.67', expiresAt:'2026-12-31T23:59:59.000Z' });
ok('cấp được cover note', !!cn.id && cn.status === 'ACTIVE');
ok('  …có lý do cấp, dạng chữ', cn.reasonLabel === 'Chờ khảo sát rủi ro', cn.reasonLabel);
ok('  …buộc có ngày hết hiệu lực (cover note là TẠM)', !!cn.expiresAt);
ok('  …trỏ tới điều khoản chuẩn của nghiệp vụ', !!cn.standardWordingRef);

let noExpiry = false;
try { B.issueCoverNote({ caseId:'X', productId:'motor' }); } catch (e) { noExpiry = /ngày hết hiệu lực/.test(e.message); }
ok('không cho cấp cover note vô thời hạn', noExpiry);

let backdated = false;
try {
  B.issueCoverNote({ caseId:'X2', productId:'motor', effectiveFrom:'2020-01-01T00:00:00.000Z', expiresAt:'2026-12-31T23:59:59.000Z' });
} catch (e) { backdated = /lùi ngày/.test(e.message); }
ok('CHẶN lùi ngày với xe cơ giới (IF3: bất hợp pháp)', backdated);

ok('có cover note đang hiệu lực cho hồ sơ', !!B.coverNoteFor('APP-CN1'));
B.supersedeCoverNote('APP-CN1', 'JB-POL-9999');
ok('cấp đơn chính thức → cover note bị THAY THẾ',
  B.coverNoteFor('APP-CN1') === null && cn.status === 'SUPERSEDED' && cn.supersededByPolicyId === 'JB-POL-9999');

/* 4. Renewal notice --------------------------------------------------- */
grp('4. Thông báo tái tục (IF3 4/2–4/3 A)');
const pol = { id:'JB-POL-2025-0102', customerId:'CUS-001', premium:10000000, expiryDate:'2026-08-09' };
const rn = B.buildRenewalNotice(pol, { renewalPremium:11500000, proposedChanges:['Tăng mức khấu trừ lên 1.000.000đ'] });
ok('nêu phí kỳ trước để khách so sánh', rn.previousPremium === 10000000, String(rn.previousPremium));
ok('nêu phí tái tục và chênh lệch', rn.renewalPremium === 11500000 && rn.premiumDelta === 1500000);
ok('  …kèm % thay đổi', rn.premiumDeltaPct === 15, String(rn.premiumDeltaPct));
ok('liệt kê thay đổi điều khoản đề xuất', rn.proposedChanges.length === 1);
ok('BUỘC rà lại khai báo kỳ trước (IF3 1/7 C3D)', rn.declarationReconfirmRequired === true);

const auto = B.buildRenewalNotice(pol, { renewalPremium:11500000, autoRenewal:true });
ok('auto-renewal → phải nói rõ với khách', !!auto.autoRenewalNotice && /tự động tái tục/.test(auto.autoRenewalNotice));

ok('yêu cầu ĐỊNH LƯỢNG của Anh mặc định TẮT (chờ đối chiếu luật VN)',
  B.renewalNoticeConfig.encourageShopAround === false && B.renewalNoticeConfig.loyaltyWarnAfterRenewals === null,
  JSON.stringify(B.renewalNoticeConfig));
ok('  …và ghi rõ phải đối chiếu Luật KDBH 2022', /KDBH 2022/.test(rn.vietnamCheck || ''), rn.vietnamCheck);

/* 5. Tái tục bật cờ rà lại khai báo ----------------------------------- */
grp('5. Bắt đầu tái tục → tự bật cờ rà lại khai báo');
const newApp = B.startRenewal(pol, { id:'APP-RENEW-1', productId:'motor' });
ok('hồ sơ tái tục gắn về đơn gốc', newApp.parentPolicyId === pol.id && newApp.source === 'RENEWAL');
ok('  …và bị đánh dấu cần xác nhận lại khai báo',
  B.declaration.needsReconfirm(newApp) === true, JSON.stringify(newApp.warningFlags));
ok('  …lý do trích đúng điều khoản sách',
  /C3D/.test((newApp.declarationReconfirm || {}).reason || ''), (newApp.declarationReconfirm || {}).reason);

console.log('\n' + (fail ? '✗ FAIL ' + fail + ' / PASS ' + pass : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
