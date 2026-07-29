#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../../../..');
const LEDGER = path.join(ROOT, '.ai/learning/error-ledger.jsonl');
const allowed = new Set([
  'REQUIREMENT_GAP', 'BUSINESS_RULE', 'STATE_PERMISSION', 'UIUX_PATTERN',
  'UIUX_TOKEN', 'ACCESSIBILITY', 'IMPLEMENTATION', 'REGRESSION', 'TOOLING', 'PROCESS'
]);

function fail(message) {
  process.stderr.write(`ERROR: ${message}\n`);
  process.exit(1);
}

const input = process.argv[2];
if (!input) fail('Pass one JSON object as the first argument.');

let value;
try {
  value = JSON.parse(input);
} catch {
  fail('Input must be valid JSON.');
}

if (!allowed.has(value.category)) fail('Unknown category.');
if (!value.rule || !value.phase) fail('rule and phase are required.');

const norm = part => String(part || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
const fingerprintSource = [
  value.category, value.rule, value.module, value.component, value.cause
].map(norm).join('|');

const record = {
  id: crypto.randomUUID(),
  occurredAt: value.occurredAt || new Date().toISOString(),
  category: value.category,
  rule: String(value.rule),
  phase: String(value.phase),
  module: value.module ? String(value.module) : null,
  component: value.component ? String(value.component) : null,
  cause: value.cause ? String(value.cause) : 'UNCONFIRMED',
  evidence: value.evidence ? String(value.evidence).slice(0, 1000) : null,
  attempt: Number.isInteger(value.attempt) ? value.attempt : 1,
  outcome: value.outcome || 'OBSERVED',
  fingerprint: crypto.createHash('sha256').update(fingerprintSource).digest('hex').slice(0, 16)
};

fs.appendFileSync(LEDGER, `${JSON.stringify(record)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(record, null, 2)}\n`);
