// Head loader — nạp toàn bộ seed/scenario/handler + shell theo đúng thứ tự.
// Dùng: <script src="../../shared/js/head-loader.js"></script> rồi gọi BANCA_READY(fn) trong body.
(function(){
 const r = location.pathname.includes('/modules/') ? '../../' : location.pathname.includes('/dev/') ? '../' : '';
 const files = [
  'shared/js/terminology.js',
  'shared/mock/seed/sellers.js',
  'shared/mock/seed/products.js',
  'shared/mock/seed/status-model.js',
  'shared/mock/seed/journey-registry.js',
  'shared/mock/seed/channel-profiles.js',
  'shared/mock/seed/customer-data-access.js',
  'shared/mock/seed/status-mappings.js',
  'shared/mock/seed/quote-version.js',
  'shared/mock/seed/payment-method-config.js',
  'shared/mock/seed/offer-filters.js',
  'shared/mock/seed/vehicle-master.js',
  'shared/mock/seed/product-schemas.js',
  'shared/mock/seed/insured-units.js',
  'shared/mock/seed/case-state-resolver.js',
  'shared/mock/seed/customers.js',
  'shared/mock/seed/applications.js',
  'shared/mock/seed/policies.js',
  'shared/mock/seed/referrals.js',
  'shared/mock/seed/commission.js',
  'shared/mock/seed/certifications.js',
  'shared/mock/seed/submitted-enrichment.js',
  'shared/mock/seed/advice-sessions.js',
  'shared/mock/seed/ocr-policy.js',
  'shared/mock/seed/sales-entry.js',
  'shared/mock/seed/case-meta.js',
  'shared/mock/seed/manager-profiles.js',
  'shared/mock/seed/org-units.js',
  'shared/mock/seed/handoffs.js',
  'shared/mock/seed/post-sale.js',
  'shared/mock/scenarios/rm-01-ready.js',
  'shared/mock/scenarios/rm-02-conditional.js',
  'shared/mock/scenarios/ts-01-conditional.js',
  'shared/mock/scenarios/tl-01-manager.js',
  'shared/mock/scenarios/bm-01-manager.js',
  'shared/mock/scenarios/rm-in-inactive.js',
  'shared/mock/scenarios/sup-01-delegated.js',
  'shared/mock/scenarios/service-unverified.js',
  'shared/mock/handlers/identity-service.js',
  'shared/mock/handlers/readiness-service.js',
  'shared/mock/handlers/authorization-service.js',
  'shared/js/navigation-config.js',
  'shared/js/app-manifest.js',
  'shared/js/mock-store.js',
  'shared/js/app-shell.js',
  'shared/components/foundation-components.js',
  'shared/components/confirm-payment.js',
  'shared/components/policy-cockpit.js',
  'shared/components/sales-context-offer.js',
  'shared/components/quote-list-shell.js'
 ];
 const V = 'v=20260728r'; // cache-bust: tăng khi sửa shared files
 files.forEach(f => document.write('<script src="'+r+f+'?'+V+'"><\/script>'));
 document.write('<link rel="stylesheet" href="'+r+'shared/styles/tokens.css?'+V+'">');
 document.write('<link rel="stylesheet" href="'+r+'shared/styles/components.css?'+V+'">');
})();
function BANCA_READY(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded',fn); }
