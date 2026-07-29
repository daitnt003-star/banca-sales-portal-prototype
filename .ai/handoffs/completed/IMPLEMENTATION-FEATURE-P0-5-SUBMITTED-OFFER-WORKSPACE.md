# Implementation report — P0.5 Submitted Offer Workspace

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Attempt: 1
Handoff: `.ai/handoffs/ready/FEATURE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`

## Business outcome

- Submitted Application Workspace now renders five ordered zones:
  identity → command bar → lifecycle → navigation → active content.
- The compact identity header is the only sticky submitted surface. It contains
  case/customer/product/version/permission identity, current status and premium,
  but no lifecycle or action controls.
- The P0.4 command bar remains the presentation source for canonical submitted
  actions. It now sits outside the identity header and adds existing SLA context;
  one-primary and native `Khác` behavior remain unchanged.
- The canonical lifecycle strip is rendered once on its own surface.
- Top navigation now uses shared `BANCA.ui.tabBar`; Snapshot sub-navigation uses its
  pill variant. Existing tab IDs, URLs, aliases, active mapping and conditional
  Supplement visibility remain unchanged.
- Active content receives a stable Vietnamese title and concise operational
  description for every top/sub tab.
- Overview no longer repeats the current status/next-action card or detailed
  timeline. It retains request/insurance summary, insured object/member context,
  business/integration checks, health/operational checks and participant/source
  information. Detailed events remain in History.
- Existing tab-specific content renderers, empty/error/permission states and deep
  links remain intact.
- No draft behavior, resolver, permission, payment, underwriting, seed, product
  continuity, API or storage logic was changed.

## Files changed

- `modules/application-workspace/app-workspace.js`
- `modules/application-workspace/index.html`
- `shared/styles/components.css`
- `shared/js/head-loader.js`
- `scripts/test-p0-submitted-offer-layout.js`
- `scripts/test-p0-workspace-action-bar.js` — cache/layout compatibility assertions.
- `scripts/test-p0-page-header-next-action.js` — shared cache-version assertion only.
- `.ai/handoffs/completed/IMPLEMENTATION-FEATURE-P0-5-SUBMITTED-OFFER-WORKSPACE.md`

## Cache compatibility

- Application Workspace loader query: `v=45` → `v=46`.
- Application runtime query: `v=20260724k` → `v=20260724l`.
- Shared asset version: `v=20260728u` → `v=20260728v`.

## Deterministic validation

- P0.5 submitted-layout test: PASS, 48/48.
- P0.4 Workspace Action Bar regression: PASS, 29/29.
- P0.1 PageHeader/NextAction regression: PASS, 30/30.
- Product/package/quote continuity: PASS, 17/17.
- Underwriting routing: PASS, 42/42.
- Payment gate: PASS, 32/32.
- Privacy/consent: PASS, 29/29.
- Application Workspace JavaScript syntax: PASS.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- Duplicate-component validator: PASS.
- `git diff --check` for implementation files: PASS.
- Design-token report: 1,122 errors / 670 warnings, below the approved baseline of
  1,139 / 681.

## Browser and keyboard smoke status

- Browser smoke could not run in this implementation environment. The active
  environment blocks local ports, and serving the project root was previously
  rejected because it could expose unrelated files. No workaround was attempted.
- Codex QC should verify relevant Motor/Health submitted states, one manager/read-only
  view, desktop, <1280px and <960px layouts, horizontal tab scrolling, focus,
  `aria-current`, and native keyboard operation of `Khác`.
- No submitted PA fixture exists; PA compatibility is covered structurally by the
  product-agnostic layout and business regression suites.

## Next action

Codex should execute browser/accessibility QC and final reflection. No commit was
created.
