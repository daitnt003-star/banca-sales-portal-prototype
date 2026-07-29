#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const learning = path.join(ROOT, '.ai/learning');
const required = [
  'error-ledger.jsonl',
  'lessons-candidate.md',
  'lessons-approved.md',
  'pattern-registry.json',
  'improvement-metrics.json'
];
let failed = false;

for (const name of required) {
  const file = path.join(learning, name);
  if (!fs.existsSync(file)) {
    process.stderr.write(`MISSING ${name}\n`);
    failed = true;
  }
}

for (const name of ['pattern-registry.json', 'improvement-metrics.json']) {
  try {
    JSON.parse(fs.readFileSync(path.join(learning, name), 'utf8'));
  } catch {
    process.stderr.write(`INVALID_JSON ${name}\n`);
    failed = true;
  }
}

const ledger = fs.readFileSync(path.join(learning, 'error-ledger.jsonl'), 'utf8');
for (const [index, line] of ledger.split(/\r?\n/).entries()) {
  if (!line) continue;
  try {
    const row = JSON.parse(line);
    if (!row.fingerprint || !row.category || !row.rule) throw new Error('missing fields');
  } catch {
    process.stderr.write(`INVALID_LEDGER_LINE ${index + 1}\n`);
    failed = true;
  }
}

if (failed) process.exit(1);
process.stdout.write('LEARNING_STORE_VALID\n');
