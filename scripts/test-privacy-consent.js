// Privacy / consent test suite (Checkpoint 1).
// Chạy: node scripts/test-privacy-consent.js
// Bao phủ: PII ẩn trước consent · fetchCustomerPII FAIL-CLOSED khi mã không khớp
// (tuyệt đối không trả PII khách khác / không fallback pool[0]) · consent audit contract đầy đủ
// · ensureIdentifiedPrefill/grantConsent không chuyển IDENTIFIED khi mã sai.
global.window = global;
global.location = { search: '', pathname: '/', reload: function () {} };
global.localStorage = { _s: {}, getItem: function (k) { return this._s[k] || null; }, setItem: function (k, v) { this._s[k] = v; } };

require('../shared/mock/seed/channel-profiles.js');
require('../shared/mock/seed/customers.js');
require('../shared/mock/seed/customer-data-access.js');
require('../shared/components/foundation-components.js');
const B = global.BANCA;

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? ('  → ' + extra) : '')); }
}
function grp(t) { console.log('\n' + t); }

/* 1. PII ẩn ở ANONYMOUS_CONTEXT ------------------------------------- */
grp('1. Data-access stage gating');
ok('PII KHÔNG hiện ở ANONYMOUS_CONTEXT', B.PII_FIELDS.every(f => !B.dataAccess.isFieldVisible(f, 'ANONYMOUS_CONTEXT')));
ok('PII KHÔNG hiện ở CONSENT_PENDING', B.PII_FIELDS.every(f => !B.dataAccess.isFieldVisible(f, 'CONSENT_PENDING')));
ok('PII hiện ở IDENTIFIED_CONTEXT', B.PII_FIELDS.every(f => B.dataAccess.isFieldVisible(f, 'IDENTIFIED_CONTEXT')));
ok('Field context ẩn danh (ageBand) luôn hiện', B.dataAccess.isFieldVisible('ageBand', 'ANONYMOUS_CONTEXT'));
ok('canShowPII đúng bậc (VERIFIED>=IDENTIFIED>CONSENT_PENDING)',
  B.dataAccess.canShowPII('VERIFIED_CUSTOMER') && B.dataAccess.canShowPII('IDENTIFIED_CONTEXT') &&
  !B.dataAccess.canShowPII('CONSENT_PENDING') && !B.dataAccess.canShowPII('ANONYMOUS_CONTEXT'));

/* 2. fetchCustomerPII FAIL-CLOSED ----------------------------------- */
grp('2. fetchCustomerPII fail-closed');
const known = B.fetchCustomerPII('CUS-001');
ok('mã khớp → matched=true + có fields', known.matched === true && !!known.fields && !!known.fields.fullName);
ok('mã khớp → trả đúng khách (không phải khách khác)', known.fields.fullName.value === 'Lê Hoàng Nam', known.fields.fullName.value);

const unknown = B.fetchCustomerPII('KH-DOES-NOT-EXIST');
ok('mã KHÔNG khớp → matched=false', unknown.matched === false);
ok('mã KHÔNG khớp → KHÔNG có fields (không lộ PII)', unknown.fields === null);
ok('mã KHÔNG khớp → có error CUSTOMER_REF_NOT_FOUND', unknown.error && unknown.error.code === 'CUSTOMER_REF_NOT_FOUND');
const firstName = (B.customers[0] || {}).name;
ok('mã KHÔNG khớp → KHÔNG fallback pool[0] (không trả tên khách đầu tiên)',
  !(unknown.fields) && JSON.stringify(unknown).indexOf(firstName) < 0);

const empty = B.fetchCustomerPII(null);
ok('mã rỗng/null → cũng fail-closed', empty.matched === false && empty.fields === null);

/* 3. Consent audit contract ----------------------------------------- */
grp('3. Consent audit contract');
const consent = B.makeConsentRecord({ externalCustomerRef: 'CUS-001', customerRef: 'CUS-001', dataRetrievedAt: '2026-07-27T00:00:00Z' });
const required = ['consentId', 'consentType', 'consentVersion', 'consentStatus', 'consentTimestamp',
  'consentChannel', 'externalCustomerRef', 'customerRef', 'dataRetrievedAt', 'sourceSystem'];
required.forEach(f => ok('consent contract có trường ' + f, consent[f] !== undefined, JSON.stringify(consent[f])));
ok('consentStatus mặc định GRANTED', consent.consentStatus === 'GRANTED');
ok('consent giữ alias version/grantedAt cho UI cũ', consent.version === consent.consentVersion && consent.grantedAt === consent.consentTimestamp);
const ctx = B.dataAccess.recordConsent({ externalCustomerRef: 'CUS-001', customerRef: 'CUS-001' }, 'CONSENT_BANCA_v2');
ok('recordConsent chuyển stage IDENTIFIED_CONTEXT', ctx.dataAccessStage === 'IDENTIFIED_CONTEXT');
ok('recordConsent gắn đủ consent contract', required.every(f => ctx.consent[f] !== undefined));

/* 4. ensureIdentifiedPrefill fail-closed ----------------------------- */
grp('4. ensureIdentifiedPrefill / recovery state');
const good = B.ensureIdentifiedPrefill({ id: 'APP-G', customerId: 'CUS-002', dataSharingGrantStatus: 'GRANTED_BY_SOURCE' });
ok('mã khớp → có piiFields, không error', !!good.piiFields && !good.piiFetchError);
const bad = B.ensureIdentifiedPrefill({ id: 'APP-B', customerId: 'KH-UNKNOWN', dataSharingGrantStatus: 'GRANTED_BY_SOURCE' });
ok('mã sai → KHÔNG có piiFields', !bad.piiFields);
ok('mã sai → set cờ recovery piiFetchError', bad.piiFetchError && bad.piiFetchError.code === 'CUSTOMER_REF_NOT_FOUND');

console.log('\n===================================');
console.log('  PASS: ' + pass + '   FAIL: ' + fail);
console.log('===================================');
process.exit(fail ? 1 : 0);
