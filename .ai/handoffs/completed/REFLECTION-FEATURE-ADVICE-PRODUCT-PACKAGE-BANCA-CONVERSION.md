# Reflection report

Feature: Advice Product → Package → Banca Conversion
Outcome: PASS

## Observed error

The prior recommendation view displayed package-level plans and package cards at the same time, obscuring the product/package hierarchy. Conversion also allowed Banca-integrated sessions to fall back to a customer-selection flow despite having a channel-owned customer context.

## Fingerprint

- category: progressive-disclosure-and-channel-context
- rule: choose product before package; preserve channel-owned customer context
- phase: quick-advice recommendation and conversion
- module: advisory-workspace
- component: recommendation renderer / conversion decision

## Root cause and evidence

Selection state was centered on `selectedOffer` (product plus package), so the renderer had no independent product-selection stage. Conversion branching depended on anonymous/customer fields rather than making channel profile plus customer context the first decision.

## Attempts

One implementation attempt introduced a pure selection contract, legacy normalization, a progressive renderer and channel-isolated conversion decision.

## Successful prevention

A 29-assertion focused regression suite now verifies hierarchy, reset, same-product comparison, legacy handling, Banca isolation, PII gating and recovery states. Existing advice outcome tests remain 21/21.

## Lesson status

OBSERVED

The reflection ledger scripts named by the skill are absent from this workspace, so no automated ledger promotion was performed.
