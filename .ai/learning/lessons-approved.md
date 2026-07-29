# Approved lessons

Only validated technical safety lessons may be promoted automatically. Business, legal, permission, state-model, terminology, and UX-architecture lessons require Codex review and user approval when material.

## VALIDATED — Manifest validators must derive active modules

- Evidence: legacy validators hard-coded `seller-profile`, `seller-readiness`, and `product-access` after the manifest declared them removed.
- Prevention: derive required routes and module metadata from `app-manifest.json`; assert that `removedModules` are not active.
- Verification: `validate-manifest.js` and `validate-modules.js` pass after the validator correction.
