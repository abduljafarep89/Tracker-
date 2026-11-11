/**
 * Fintrak Unit & Smoke Test Runner
 * Validates financial calculations, auto-backup after 10 tx, Drive sync, relative recurrence, and deduplication
 */

const fs = require('fs');
const vm = require('vm');

const ctx = {
  console, setTimeout, clearTimeout, Date, Math, String, Object, Array, Set, Map, JSON,
  parseFloat, parseInt, isNaN, isFinite, RegExp,
  alert: () => {}, confirm: () => true, prompt: () => '',
  btoa: s => Buffer.from(s).toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString('utf8'),
  document: {
    querySelector: () => ({ innerHTML: '', style: { setProperty: function(k, v) { this[k] = v; } }, addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], appendChild: () => {}, showModal: () => {}, close: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
    querySelectorAll: () => [],
    getElementById: () => null,
    documentElement: { style: { setProperty(k, v) { this[k] = v; } } },
    body: { classList: { add: () => {}, remove: () => {}, toggle: () => {} }, appendChild: () => {}, removeChild: () => {} },
    createElement: () => ({ href: '', download: '', click: () => {}, setAttribute: () => {} })
  },
  URL: { createObjectURL: () => 'blob:mock-url' },
  Blob: class { constructor(parts) { this.parts = parts; } },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; }
  },
  sessionStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); },
    removeItem(k) { delete this._d[k]; }
  },
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  navigator: { standalone: false, storage: { persist: async () => true } },
  history: { state: {}, pushState: () => {}, replaceState: () => {}, back: () => {} },
  location: { href: '', hash: '' },
  addEventListener: () => {}
};
ctx.window = ctx;

vm.createContext(ctx);
const code = fs.readFileSync('artifacts/file_generation/ttl=63d/output/app.js', 'utf8');
vm.runInContext(code, ctx);

const api = vm.runInContext('({ K, S, getSafeDailySpend, analytics, parseBankSMS, peopleForm, f, fpct, home, cards, plan, hist, more, V, iso, T, togglePriv, cardOut, accBal, tg, markPlannedPaymentForm, setTheme, cpal, TH, MODES, ACC, FONTS, pDay, pDayLabel, parseBankStatementText, deduplicateTransactions, openStatementImportDialog, checkAndTriggerAutoBackup, getDriveSyncConfig, setDriveSyncConfig })', ctx);

console.log('✓ PASS: app.js loaded and evaluated with zero syntax errors.');

// 1. Storage Key Unification & Migration
console.log('\n--- 1. Testing Storage Key & Migration ---');
if (api.K === 'fintrak_v1') {
  console.log('✓ PASS: Unified storage key is "fintrak_v1".');
} else {
  console.error('FAIL: Incorrect storage key', api.K);
  process.exit(1);
}

// 2. Safe Daily Spend
console.log('\n--- 2. Testing Safe Daily Spend Calculation ---');
api.S.budget = 50000;
api.S.tx = [
  { id: '1', d: api.iso(api.T), t: 'exp', a: 20000, c: 'Groceries', s: 'bank1' }
];
const s1 = api.getSafeDailySpend();
if (s1.left === 30000 && s1.type === 'budget') {
  console.log('✓ PASS: Safe daily spend uses remaining budget (₹30,000 / daysLeft).');
} else {
  console.error('FAIL: Safe daily spend calculation incorrect', s1);
  process.exit(1);
}

// 3. Optional Automated Backup After 10 Transactions
console.log('\n--- 3. Testing Auto-Backup After 10 Transactions ---');
// Step A: When disabled (default), no auto backup triggered
api.setDriveSyncConfig({ autoBackupEnabled: false, enabled: false });
ctx.localStorage.removeItem('fintrak_auto_backup_latest');
for (let i = 1; i <= 10; i++) {
  api.S.tx.push({ id: 'tx_auto_' + i, d: '2026-11-10', t: 'exp', a: 100 * i, c: 'Food', s: 'bank1' });
  api.checkAndTriggerAutoBackup();
}
if (!ctx.localStorage.getItem('fintrak_auto_backup_latest')) {
  console.log('✓ PASS: When optional setting is disabled (default), zero automated backups run.');
} else {
  console.error('FAIL: Auto backup ran while disabled');
  process.exit(1);
}

// Step B: When explicitly enabled by user, runs after 10 transactions
api.setDriveSyncConfig({ autoBackupEnabled: true, enabled: false });
for (let i = 11; i <= 20; i++) {
  api.S.tx.push({ id: 'tx_auto_' + i, d: '2026-11-10', t: 'exp', a: 100 * i, c: 'Food', s: 'bank1' });
  api.checkAndTriggerAutoBackup();
}
const autoBackupSnap = ctx.localStorage.getItem('fintrak_auto_backup_latest');
if (autoBackupSnap && JSON.parse(autoBackupSnap).tx.length >= 20) {
  console.log('✓ PASS: When user enables optional auto-backup, snapshot triggers reliably.');
} else {
  console.error('FAIL: Enabled auto-backup failed to save', autoBackupSnap);
  process.exit(1);
}

// 4. Google Drive Sync Configuration
console.log('\n--- 4. Testing Google Drive Sync Configuration ---');
api.setDriveSyncConfig({ enabled: true, webhookUrl: 'https://script.google.com/macros/s/test/exec' });
const cfg = api.getDriveSyncConfig();
if (cfg.enabled && cfg.webhookUrl.includes('test')) {
  console.log('✓ PASS: Google Drive sync settings saved and verified.');
} else {
  console.error('FAIL: Drive sync config mismatch', cfg);
  process.exit(1);
}

// 5. Relative Weekday Recurrence
console.log('\n--- 5. Testing Relative Weekday Recurrence ---');
const fri2 = api.pDay({ rule: '2-fri' }, 2026, 10); // Nov 2026
if (fri2 === 13) {
  console.log('✓ PASS: 2nd Friday in Nov 2026 correctly resolves to Day 13.');
} else {
  console.error('FAIL: Relative weekday recurrence calculation mismatch', fri2);
  process.exit(1);
}

// 6. Bank Statement Deduplication
console.log('\n--- 6. Testing Statement Deduplication ---');
const sampleCSV = `Date,Narration,Withdrawal,Deposit
10/11/2026,RESTAURANT FOOD,500.00,
10/11/2026,NEW GROCERY,750.00,`;
api.S.tx = [{ id: 'tx_dup', d: '2026-11-10', a: 500, t: 'exp', n: 'RESTAURANT FOOD', s: 'acc_main' }];
const rows = api.parseBankStatementText(sampleCSV);
const dedup = api.deduplicateTransactions(rows, 'acc_main');
if (dedup.duplicateItems.length === 1 && dedup.newItems.length === 1) {
  console.log('✓ PASS: Statement deduplication identified existing item and only queued 1 new item.');
} else {
  console.error('FAIL: Deduplication test failed', dedup);
  process.exit(1);
}

console.log('\n=========================================');
console.log('ALL TESTS PASSED FLAWLESSLY! 100%');
console.log('=========================================\n');
