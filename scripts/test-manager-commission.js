// Manager workspace / hoa hồng test suite (§13.2 / §13.3).
// Chạy: node scripts/test-manager-commission.js
// Bao phủ: hoa hồng trực tiếp vs thứ cấp KHÔNG được gộp; phạm vi override đúng
// theo managerScope; seller thường không có override; portal chỉ đọc scheme.
global.window = global;
global.location = { search: '', pathname: '/' };
global.localStorage = { getItem: function () { return null; }, setItem: function () { } };

require('../shared/mock/seed/status-model.js');
require('../shared/mock/seed/journey-registry.js');
require('../shared/mock/seed/vehicle-master.js');
require('../shared/mock/seed/product-schemas.js');
require('../shared/mock/seed/sellers.js');
require('../shared/mock/seed/customers.js');
require('../shared/mock/seed/applications.js');
require('../shared/mock/seed/policies.js');
require('../shared/mock/seed/referrals.js'); // BANCA.kpi
require('../shared/mock/seed/manager-profiles.js');
require('../shared/mock/seed/commission.js');
const B = global.BANCA;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* 1. Tách hoa hồng (§13.3) ------------------------------------------ */
grp('1. Hoa hồng trực tiếp vs thứ cấp phải TÁCH RIÊNG');
const tl = B.commissionSplit('TL-01');   // Team Leader — quản lý TEAM-A
const rm = B.commissionSplit('RM-01');   // Seller thuần

ok('commissionSplit trả 2 khối direct/override riêng',
  tl.direct && tl.override && typeof tl.direct.amount === 'number' && typeof tl.override.amount === 'number');
ok('KHÔNG có field tổng gộp direct+override',
  tl.total === undefined && tl.amount === undefined,
  JSON.stringify(Object.keys(tl)));
ok('Manager TEAM có hoa hồng thứ cấp > 0', tl.override.amount > 0,
  'override=' + tl.override.amount + ' count=' + tl.override.count);
ok('Seller thuần KHÔNG có hoa hồng thứ cấp', rm.override.amount === 0 && rm.override.count === 0,
  JSON.stringify(rm.override));
ok('Seller thuần có hoa hồng trực tiếp > 0', rm.direct.amount > 0, 'direct=' + rm.direct.amount);

/* 2. Phạm vi override đúng theo managerScope ------------------------ */
grp('2. Phạm vi override theo managerScope');
ok('Manager không nhận override từ chính mình',
  tl.override.rows.every(r => r.owner !== 'TL-01'));
ok('Override của TL-01 chỉ từ nhân viên cùng TEAM-A',
  tl.override.rows.every(r => (B.personas[r.owner] || {}).team === 'TEAM-A'),
  JSON.stringify(tl.override.rows.map(r => r.owner)));

const bm = B.commissionSplit('BM-01');   // Branch Manager — HCM01
ok('Override của BM-01 chỉ từ nhân viên cùng chi nhánh HCM01',
  bm.override.rows.every(r => (B.personas[r.owner] || {}).branch === 'HCM01'),
  JSON.stringify(bm.override.rows.map(r => r.owner)));
ok('TEAM và BRANCH dùng tỷ lệ override khác nhau',
  B.overrideRates.TEAM !== B.overrideRates.BRANCH);

/* 3. Helper cho bảng thành viên (§13.2) ------------------------------ */
grp('3. Helper cho bảng nhân viên');
ok('directCommissionOf(RM-01) khớp direct trong split',
  B.directCommissionOf('RM-01') === rm.direct.amount,
  B.directCommissionOf('RM-01') + ' vs ' + rm.direct.amount);
ok('overrideCommissionFrom(TL-01, RM-01) > 0', B.overrideCommissionFrom('TL-01', 'RM-01') > 0);
ok('overrideCommissionFrom(RM-01, RM-02) = 0 (không phải quản lý)',
  B.overrideCommissionFrom('RM-01', 'RM-02') === 0);
ok('overrideCommissionFrom(TL-01, TL-01) = 0 (không tự override)',
  B.overrideCommissionFrom('TL-01', 'TL-01') === 0);
ok('Tổng override của TL-01 = cộng override từng nhân viên',
  tl.override.amount === Object.keys(B.personas)
    .reduce((s, id) => s + B.overrideCommissionFrom('TL-01', id), 0));

/* 4. KPI không gộp 2 loại ------------------------------------------- */
grp('4. KPI tách 2 loại hoa hồng');
const kTL = (B.kpi || {})['TL-01'] || {};
ok('kpi.commission = hoa hồng TRỰC TIẾP', kTL.commission === tl.direct.amount,
  kTL.commission + ' vs ' + tl.direct.amount);
ok('kpi.commissionOverride = hoa hồng THỨ CẤP', kTL.commissionOverride === tl.override.amount,
  kTL.commissionOverride + ' vs ' + tl.override.amount);
ok('2 số KPI khác nhau (không phải cùng 1 giá trị gộp)',
  kTL.commission !== kTL.commissionOverride);

/* 5. Persona có đủ trường tổ chức cho bảng §13.2 --------------------- */
grp('5. Persona đủ trường cho bảng nhân viên (§13.2)');
['rm', 'role', 'branch', 'department', 'team'].forEach(f => {
  ok('persona RM-01 có "' + f + '"', !!B.personas['RM-01'][f]);
});
ok('regionOf(branch) hoạt động', !!B.regionOf(B.personas['RM-01'].branch));

/* 6. Portal chỉ ĐỌC scheme ------------------------------------------ */
grp('6. Portal chỉ đọc dữ liệu hoa hồng');
ok('Không expose hàm cấu hình scheme',
  typeof B.setCommissionRate !== 'function' && typeof B.saveCommissionScheme !== 'function');
ok('Hợp đồng CANCELLED bị thu hồi (clawback), không tính vào accrued',
  B.commissionRows().filter(x => x.state === 'CLAWED_BACK').every(x => x.amount === 0));

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
