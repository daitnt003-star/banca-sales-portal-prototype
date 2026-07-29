#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const LEDGER = path.join(ROOT, '.ai/learning/error-ledger.jsonl');
const lines = fs.readFileSync(LEDGER, 'utf8').split(/\r?\n/).filter(Boolean);
const groups = new Map();

for (const [index, line] of lines.entries()) {
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    process.stderr.write(`ERROR: invalid JSONL at line ${index + 1}\n`);
    process.exit(1);
  }
  const bucket = groups.get(row.fingerprint) || [];
  bucket.push(row);
  groups.set(row.fingerprint, bucket);
}

const recurring = [...groups.entries()]
  .filter(([, rows]) => rows.length >= 2)
  .map(([fingerprint, rows]) => ({
    fingerprint,
    count: rows.length,
    status: rows.length >= 3 ? 'RECURRING_BLOCKER' : 'CANDIDATE',
    category: rows[0].category,
    rule: rows[0].rule,
    module: rows[0].module,
    component: rows[0].component,
    lastSeenAt: rows.at(-1).occurredAt
  }));

process.stdout.write(`${JSON.stringify({ totalRecords: lines.length, recurring }, null, 2)}\n`);
