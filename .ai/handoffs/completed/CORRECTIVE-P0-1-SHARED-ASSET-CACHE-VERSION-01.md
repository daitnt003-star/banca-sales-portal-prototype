# Corrective implementation handoff

Status: COMPLETED
Owner: Codex
Implementer: Claude
Attempt: 1

## Failure evidence

- Focused/static tests pass, but browser QC with a warm cache loaded old `app-shell.js`, `foundation-components.js` and component CSS.
- Pilot page source references new `BANCA.ui.pageHeader`, while cached shared assets do not define it, causing blank body after page cache-bust.
- Before cache-bust, browser continued to show the old three-action topbar and missing `h1`.
- Root cause: pilot pages still load `head-loader.js?v=44`; head-loader shared asset version remains `v=20260728r` even though shared files changed.

## Goal

Give the P0.1 shared assets a new deterministic cache key so upgraded pilot pages load a compatible shell, component implementation and CSS.

## Files allowed

- `shared/js/head-loader.js`
- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html`
- `modules/policies/index.html`
- Focused P0.1 test only if assertions must cover version consistency.
- Corrective implementation report.

## Files prohibited

- All other runtime files.
- Business state, permission, journey, seed and blocked continuity files.

## Required change

1. Increment the shared asset version constant in `head-loader.js` once.
2. Increment the `head-loader.js` query version in all three pilot pages so warm-cache users fetch the updated loader.
3. Do not use timestamps or random cache keys.
4. Add/extend a deterministic assertion that all three pilot pages use the same new loader version and the loader emits the new shared asset version.
5. Do not alter component behavior or UI.

## Acceptance

- Warm-cache/new-page mismatch is prevented.
- All three pilot pages load PageHeader and shell mode in browser.
- Quick Advice and Hợp đồng each render one `h1`; Bản chào renders one `h1`.
- Topbar modes match the approved contract.
- Non-pilot pages remain functional.
- P0.1 focused and baseline validators still pass.

## Validation

- `node scripts/test-p0-page-header-next-action.js`
- `node scripts/test-quick-advice-navigation.js`
- `node scripts/validate-modules.js`
- `node scripts/validate-terminology.js`
- `node scripts/validate-design-tokens.js`
- Browser smoke with fresh query and warm-cache navigation.
