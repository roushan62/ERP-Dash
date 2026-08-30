'use strict';
// Lightweight CI / smoke check: verifies required files exist and JS parses.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const files = [
  'website/index.html',
  'src/main.js',
  'src/preload.js',
  'src/database/schema.sql',
  'src/database/db.js',
  'src/database/migrations.js',
  'src/database/services.js',
  'src/index.html',
  'src/renderer/app.js',
  'src/renderer/voucher-form.js',
  'src/renderer/report-form.js',
  'src/styles/global.css',
  'src/components/sidebar.js',
  'src/components/table.js',
  'src/modules/dashboard/dashboard.js',
  'src/modules/masters/chart-of-accounts.js',
  'src/modules/vouchers/sales-invoice.js',
  'src/modules/reports/trial-balance.js',
  'src/modules/gst/gstr1-report.js',
  'src/modules/settings/backup-restore.js',
];

let failed = 0;
for (const f of files) {
  if (!fs.existsSync(path.join(root, f))) {
    console.error('MISSING', f);
    failed++;
  }
}
if (failed) { console.error(`${failed} required file(s) missing.`); process.exit(1); }

const jsFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.js')) jsFiles.push(p);
  }
})(path.join(root, 'src'));

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    console.error('SYNTAX ERROR', file, '\n', e.stderr && e.stderr.toString());
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} issue(s) found.`);
  process.exit(1);
}
console.log(`OK - ${files.length} required files present, ${jsFiles.length} JS files parsed.`);
