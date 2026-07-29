# Reflection — Corrective P0.9 shared progress stepper

Status: VALIDATED
Date: 2026-07-28

## What failed

P0.8 treated the Draft and Submitted journeys as separate screen designs and
introduced a page-specific Submitted progress component even though the Draft
journey already established the compact chip interaction.

## Root cause

- Trigger: redesign of the Submitted offer workspace.
- Proximate defect: a new large connected stepper was implemented.
- Enabling process gap: the component-registry and cross-screen pattern check did
  not block a second implementation of the same progress interaction.
- Supported root cause: UI review focused on local stage semantics before checking
  whether an existing system component should own the shared interaction anatomy.

## Corrective control

Before introducing a page-specific variant of a repeated interaction, review the
component registry and the nearest existing journey. If anatomy and interaction
are the same, extract or extend one shared presentation component; callers retain
their own labels, states, links and business tones.

## Validation

Corrective attempt 1 extracted `BANCA.ui.progressStepper`, migrated both callers,
removed the Submitted-specific implementation, and passed focused, regression and
browser checks. The learning record was stored as `VALIDATED`; the learning store
validator passed.

This is a technical UI consistency control only. It does not change product truth,
permissions, lifecycle states or business rules.
