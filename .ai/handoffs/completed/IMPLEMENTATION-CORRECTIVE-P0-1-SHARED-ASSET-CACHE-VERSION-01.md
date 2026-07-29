# Corrective implementation report — P0.1 shared asset cache version

Status: IMPLEMENTED_PENDING_QC
Implementer: Claude
Attempt: 1
Handoff: `.ai/handoffs/ready/CORRECTIVE-P0-1-SHARED-ASSET-CACHE-VERSION-01.md`

## Corrective outcome

- Incremented the deterministic shared-asset cache key once, from
  `v=20260728r` to `v=20260728s`.
- Incremented the three pilot pages' loader query once, from `v=44` to `v=45`.
- Extended the focused P0.1 test to assert that all three pilot pages use the same
  loader query and that the loader applies the new shared-asset version to scripts
  and component CSS.
- No component, shell, permission, state, journey or UI behavior was changed.

## Files changed

- `shared/js/head-loader.js`
- `modules/quick-advisory/index.html`
- `modules/unsubmitted-applications/index.html`
- `modules/policies/index.html`
- `scripts/test-p0-page-header-next-action.js`
- `.ai/handoffs/completed/IMPLEMENTATION-CORRECTIVE-P0-1-SHARED-ASSET-CACHE-VERSION-01.md`

## Validation evidence

- P0.1 focused test: PASS, 30/30.
- Quick Advice navigation regression: PASS, 13/13.
- Module validator: PASS (`VALID_MODULES`).
- Terminology validator: PASS, 93 files scanned.
- `head-loader.js` syntax check: PASS.
- `git diff --check` for corrective files: PASS.
- Design-token report: 1,153 errors / 685 warnings, unchanged from the approved
  baseline.
- Static version evidence: every pilot page references
  `head-loader.js?v=45`; the loader emits `v=20260728s`.

## Remaining QC

- Codex should repeat the original browser scenario with fresh-query and warm-cache
  navigation to confirm the three list pages each render one `h1` and the approved
  topbar mode. Browser smoke was not available in this implementation environment.

## Next action

Codex QC should rerun the failed warm-cache case. No commit was created.
