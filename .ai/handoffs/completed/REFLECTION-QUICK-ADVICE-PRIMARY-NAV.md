# Reflection report

Feature: Quick Advice Primary Navigation
Outcome: PASS

## Observed error

The Quick Advice record list remained implemented and routable, but navigation consolidation removed every visible path to the list while the global shortcut continued to create a new advice session.

## Fingerprint

- category: navigation-reachability
- rule: persisted business records require a visible list entry point
- phase: post-navigation-consolidation
- module: navigation-config
- component: primary-navigation

## Root cause and evidence

The prior five-item navigation treated “Tư vấn nhanh” only as an alias of Bản chào. The global header shortcut pointed directly to `advisory-workspace?new=1`, leaving `modules/quick-advisory/index.html` orphaned from visible navigation.

## Attempts

One implementation attempt added a first-class selling-only nav item and reassigned active-state ownership. Focused tests passed 13/13.

## Successful prevention

A deterministic regression test now asserts list reachability, menu order, selling-only visibility, active-state ownership and absence of a duplicate local start CTA.

## Lesson status

OBSERVED

The configured reflection scripts named by the skill (`scripts/record-error.js`, `scripts/detect-recurring-errors.js`) are not present in this workspace, so no ledger promotion was attempted.
