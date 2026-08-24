// Commission channel + validity test suite.
// Chạy: node scripts/test-commission-channel.js
// Bao phủ: biểu hoa hồng tra ĐỦ 4 CHIỀU (sản phẩm × gói × kênh × ngày hiệu lực),
// không tìm thấy thì PHÁT RA LÝ DO thay vì im lặng trả 0 (§15.3),
// và kênh lấy từ snapshot phân phối lúc BÁN chứ không phải kênh đang mở màn hình.
// Nền nghiệp vụ: CII IF1 3/12–3/13 [tr.96-97] mục G3 — TOBA phải ghi rõ thang tỷ lệ,
// thời hạn báo trước khi đổi, và ngày hoa hồng đến hạn trả.
global.window = global;
let LS = {};
global.localStorage = {
  getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); },
  removeItem: k => { delete LS[k]; }, get length() { return Object.keys(LS).length; },
  key: i => Object.keys(LS)[i]
};

require('../shared/mock/seed/sellers.js');
require('../shared/mock/seed/channel-profiles.js');
require('../shared/mock/seed/policies.js');
require('../shared/mock/seed/manager-profiles.js');
require('../shared/mock/seed/handoffs.js');
require('../shared/mock/seed/commission.js');
const B = global.BANCA;
B.setChannel = function (id) { LS['bancaChannel'] = id; };  // bỏ location.reload trong Node

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

const POL = { id:'UAT-POL-1', owner:'RM-01', productName:'Bảo hiểm vật chất xe',
  package:'Premium', premium:11200000, status:'ACTIVE' };
const ASOF = '2026-06-15';   // nằm trong 2026-01-01..2026-12-31 của seed

/* 1. Tra đúng 4 chiều ------------------------------------------------ */
grp('1. Biểu hoa hồng tra đủ 4 chiều');

const r1 = B.commissionRateFor(POL, { channel:'BANCA', asOf:ASOF });
ok('kênh BANCA + trong hạn → tìm thấy biểu', r1.found === true && r1.rate === 0.12, JSON.stringify(r1));

const r2 = B.commissionRateFor(POL, { channel:'AGENT_BROKER', asOf:ASOF });
ok('kênh chưa cấu hình → found=false (KHÔNG im lặng trả 0)', r2.found === false && r2.rate === null, JSON.stringify(r2));
ok('  …và nêu lý do thành chữ', /kênh AGENT_BROKER/.test(r2.reason || ''), r2.reason);

const r3 = B.commissionRateFor(POL, { channel:'BANCA', asOf:'2025-06-15' });
ok('ngày ngoài hiệu lực biểu → found=false', r3.found === false, JSON.stringify(r3));
ok('  …và lý do nói rõ là hết hiệu lực', /không còn hiệu lực/.test(r3.reason || ''), r3.reason);

const r4 = B.commissionRateFor({ productName:'Sản phẩm lạ', package:'X' }, { channel:'BANCA', asOf:ASOF });
ok('sản phẩm chưa có biểu → lý do nói về sản phẩm', /Chưa cấu hình biểu hoa hồng cho Sản phẩm lạ/.test(r4.reason || ''), r4.reason);

/* 2. Regression của lỗi D1 ------------------------------------------- */
grp('2. Trường `channel` trong biểu KHÔNG còn là trường chết (lỗi D1)');

B.commissionRates.push({ product:POL.productName, package:POL.package, channel:'AGENT_BROKER',
  rate:0.20, validFrom:'2026-01-01', validTo:'2026-12-31' });

const agent = B.commissionRateFor(POL, { channel:'AGENT_BROKER', asOf:ASOF });
ok('thêm dòng biểu cho kênh đại lý → ĐƯỢC CHỌN (trước đây bị bỏ qua)',
  agent.found === true && agent.rate === 0.20, JSON.stringify(agent));

const banca = B.commissionRateFor(POL, { channel:'BANCA', asOf:ASOF });
ok('…và không lẫn sang biểu kênh khác', banca.rate === 0.12, JSON.stringify(banca));

/* 3. Kênh lấy từ snapshot phân phối lúc BÁN -------------------------- */
grp('3. Kênh tính hoa hồng = kênh lúc BÁN, không phải kênh đang mở màn hình');

const seeded = (B.policies || []).find(p => B.POLICY_DISTRIBUTION && B.POLICY_DISTRIBUTION[p.id]);
if (seeded) {
  B.setChannel('AGENT_BROKER');            // đang mở màn hình ở kênh đại lý
  const ch = B.commissionChannelOf(seeded);
  ok('hợp đồng đã phát hành qua Bancassurance → vẫn tính theo BANCA',
    ch === 'BANCA', 'policy=' + seeded.id + ' · channel=' + ch);
  B.setChannel('BANCA_INTEGRATED');
} else console.log('  (bỏ qua — seed không có POLICY_DISTRIBUTION)');

const noSnap = { id:'KHONG-CO-SNAPSHOT', owner:'RM-01', productName:POL.productName, package:POL.package, premium:5000000 };
B.setChannel('AGENT_BROKER');
ok('chưa có snapshot (ước tính trước phát hành) → dùng kênh phiên hiện hành',
  B.commissionChannelOf(noSnap) === 'AGENT_BROKER', B.commissionChannelOf(noSnap));
B.setChannel('BANCA_INTEGRATED');

/* 4. commissionOfPolicy + summary phân biệt "0đ" với "chưa biết" ------ */
grp('4. Không lẫn "hoa hồng bằng 0" với "chưa biết hoa hồng"');

const noRatePol = { id:'P-NORATE', owner:'RM-01', productName:'Sản phẩm chưa có biểu', package:'Basic', premium:9000000, status:'ACTIVE' };
const c1 = B.commissionOfPolicy(noRatePol, { asOf:ASOF });
ok('không có biểu → amount=null, KHÔNG phải 0', c1.amount === null && c1.noRate === true, JSON.stringify({amount:c1.amount, noRate:c1.noRate}));
ok('  …state=NO_RATE, nhãn "Chưa có biểu"', c1.state === 'NO_RATE' && c1.stateLabel === 'Chưa có biểu', c1.state + '/' + c1.stateLabel);
ok('  …kèm lý do để UI hiện được', !!c1.noRateReason, c1.noRateReason);

const c2 = B.commissionOfPolicy(POL, { channel:'BANCA', asOf:ASOF });
ok('có biểu → tính bình thường', c2.noRate === false && c2.amount > 0, JSON.stringify({amount:c2.amount, rate:c2.rate}));

const cancelled = B.commissionOfPolicy(Object.assign({}, POL, { status:'CANCELLED' }), { channel:'BANCA', asOf:ASOF });
ok('hợp đồng hủy → amount=0 và clawback>0 (khác hẳn NO_RATE)',
  cancelled.amount === 0 && cancelled.clawback > 0 && cancelled.state === 'CLAWED_BACK',
  JSON.stringify({amount:cancelled.amount, clawback:cancelled.clawback, state:cancelled.state}));

const sum = B.commissionSummary('RM-01');
ok('summary có noRateCount để UI cảnh báo', typeof sum.noRateCount === 'number', JSON.stringify({amount:sum.amount, count:sum.count, noRateCount:sum.noRateCount}));
ok('summary.amount không NaN khi có dòng chưa có biểu', !isNaN(sum.amount), String(sum.amount));

console.log('\n' + (fail ? '✗ FAIL ' + fail + ' / PASS ' + pass : '✓ TẤT CẢ PASS (' + pass + ')'));
process.exit(fail ? 1 : 0);
