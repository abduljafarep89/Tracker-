/* =========================================================================
   Fintrak - Personal Finance Tracker
   Modular Application Logic (app.js)
   ========================================================================= */

const $ = s => document.querySelector(s);
const K = 'fintrak_v1';
const T = new Date();
const pd = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pd(d.getMonth() + 1) + '-' + pd(d.getDate());

// Storage Persistence & Migration
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

let S = null;
try {
  S = JSON.parse(localStorage.getItem(K) || 'null');
  if (!S) {
    const legacy = localStorage.getItem('finplan_v1') || localStorage.getItem('tracker_multi_row_mobile_suite');
    if (legacy) {
      const p = JSON.parse(legacy);
      S = p.months ? convertOld(p) : p;
      localStorage.setItem(K, JSON.stringify(S));
      localStorage.removeItem('finplan_v1'); // Clean up duplicate key
    }
  }
} catch (e) {
  console.warn('Storage read warning:', e);
}

if (!S) S = { acc: [], cards: [], tx: [], plan: [], paid: {}, budget: 0 };
S.acc = S.acc || [];
S.cards = S.cards || [];
S.tx = S.tx || [];
S.plan = S.plan || [];
S.paid = S.paid || {};
S.goals = S.goals || [];
S.catBudgets = S.catBudgets || {};
S.people = S.people || [];
S.investments = S.investments || [];
S.shortcuts = S.shortcuts || [
  { n: 'Fuel', a: 2000, c: 'Fuel' },
  { n: 'Coffee', a: 50, c: 'Cafe & snacks' },
  { n: 'Groceries', a: 500, c: 'Groceries' },
  { n: 'Food', a: 300, c: 'Restaurant & takeaway' }
];

function migrate() {
  (S.tx || []).forEach(t => { if (t.c == 'Card balance') t.adj = 1; });
}
migrate();

let V = {
  t: 'home',
  y: T.getFullYear(),
  m: T.getMonth(),
  priv: false,
  hf: 'all',
  sq: '',
  dateFrom: '',
  dateTo: '',
  catFilter: '',
  sim: 0
};
try {
  V.priv = localStorage.getItem('fintrak_priv') === '1';
} catch (e) {}

if (typeof document !== 'undefined' && document.body && V.priv) {
  document.body.classList.add('priv-mode');
}

function togglePriv() {
  V.priv = !V.priv;
  try {
    localStorage.setItem('fintrak_priv', V.priv ? '1' : '0');
  } catch (e) {}
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('priv-mode', V.priv);
  }
  render();
}

// Themes & Palettes
const MODES = {
  light: { bg: '#F4F5FA', card: '#FFFFFF', ink: '#1B1F3B', mut: '#4B5160', line: '#E4E6F2', ok: '#0F766E', warn: '#B45309', bad: '#B91C1C' },
  warm: { bg: '#FAF5EC', card: '#FFFDF8', ink: '#2B2118', mut: '#6B5A48', line: '#EADFCB', ok: '#0F766E', warn: '#B45309', bad: '#B91C1C' },
  dark: { bg: '#10121F', card: '#1A1D33', ink: '#EEF0FF', mut: '#A9AEC9', line: '#2C3050', ok: '#4FD1C5', warn: '#F6AD55', bad: '#FC8181' },
  black: { bg: '#000000', card: '#121214', ink: '#F4F4F5', mut: '#A1A1AA', line: '#27272A', ok: '#4FD1C5', warn: '#F6AD55', bad: '#FC8181' }
};

const ACC = {
  Indigo: ['#4F46E5', '#4338CA', '#7C3AED', '#6D6AF0'],
  Ocean: ['#0369A1', '#0C4A6E', '#0EA5E9', '#0284C7'],
  Emerald: ['#047857', '#065F46', '#10B981', '#059669'],
  Sunset: ['#C2410C', '#9A3412', '#EA580C', '#EA580C'],
  Rose: ['#BE185D', '#9D174D', '#DB2777', '#DB2777'],
  Graphite: ['#334155', '#1E293B', '#475569', '#64748B']
};

let TH = { m: 'auto', a: 'Indigo', c: 'Vivid', s: 'donut' };
try {
  TH = { ...TH, ...JSON.parse(localStorage.getItem('fintrak_theme') || '{}') };
} catch (e) {}

function applyTheme() {
  if (typeof document === 'undefined') return;
  const dk = TH.m == 'dark' || TH.m == 'black' || (TH.m == 'auto' && typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches);
  const M = MODES[TH.m == 'auto' ? (dk ? 'dark' : 'light') : TH.m] || MODES.light;
  const a = ACC[TH.a] || ACC.Indigo;
  const r = document.documentElement.style;
  Object.entries(M).forEach(([n, v]) => r.setProperty('--' + n, v));
  r.setProperty('--pri', dk ? a[3] : a[0]);
  r.setProperty('--g1', a[1]);
  r.setProperty('--g2', a[2]);
  r.colorScheme = dk ? 'dark' : 'light';
  const tm = document.querySelector('meta[name=theme-color]');
  if (tm) tm.content = M.bg;
}

function setTheme(k, v) {
  TH[k] = v;
  try {
    localStorage.setItem('fintrak_theme', JSON.stringify(TH));
  } catch (e) {}
  applyTheme();
  render();
}

applyTheme();
if (typeof matchMedia !== 'undefined') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (TH.m == 'auto') applyTheme();
  });
}

function evalAmt(val) {
  if (typeof val !== 'string') return +val || 0;
  const s = val.trim();
  if (/^[\d\s+\-*/.()]+$/.test(s) && /[+\-*/]/.test(s)) {
    try {
      const res = Function('"use strict";return (' + s + ')')();
      if (!isNaN(res) && isFinite(res) && res >= 0) return Math.round(res * 100) / 100;
    } catch (e) {}
  }
  return +val || 0;
}

const id = () => Math.random().toString(36).slice(2, 9);

function save() {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (err) {
    console.error('Storage quota exceeded or error:', err);
    toast('⚠️ Storage save failed! Export a backup.');
  }
  render();
}

const no = m => (alert(m), false);

// Currency and String Formatting
const f = (n, forceRaw = false) => {
  if (V.priv && !forceRaw) return (n < 0 ? '-' : '') + '₹••••••';
  return (n < 0 ? '-' : '') + '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
};

const fpct = (n, sign = true) => {
  if (V.priv) return '••%';
  return (sign && n > 0 ? '+' : '') + Math.round(n) + '%';
};

const e = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sum = (a, k = 'a') => (a || []).reduce((x, y) => x + (+y[k] || 0), 0);
const put = (arr, o, r) => o.id ? Object.assign(o, r) : arr.push({ ...r, id: id() });
const ym = (y, m) => y + '-' + pd(m + 1);
const cur = () => V.y == T.getFullYear() && V.m == T.getMonth();
const mt = () => S.tx.filter(t => t.d.slice(0, 7) == ym(V.y, V.m));
const dt = (y, m, d) => iso(new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate())));
const mo = () => new Date(V.y, V.m).toLocaleString('en-IN', { month: 'short', year: 'numeric' }); // Compact "Oct 2026"
const src = i => (S.acc.find(x => x.id == i) || S.cards.find(x => x.id == i) || { n: '-' }).n;
const accBal = a => (+a.o || 0) + S.tx.reduce((s, t) => s + (t.s == a.id ? (t.t == 'inc' ? t.a : -t.a) : 0) + (t.t == 'xfer' && t.to == a.id ? t.a : 0), 0);
const cardOut = c => S.tx.reduce((s, t) => s + (t.t == 'exp' && t.s == c.id ? t.a : 0) - (t.t == 'pay' && t.cd == c.id ? t.a : 0), 0);
const bar = (p, c) => `<div class=bar><i style="width:${Math.min(100, Math.max(0, p))}%;background:${c}"></i></div>`;

function bill(c, y, m) {
  const st = c.due > c.bill ? dt(y, m, c.bill) : dt(y, m - 1, c.bill);
  const s = new Date(st + 'T00:00');
  const pv = dt(s.getFullYear(), s.getMonth() - 1, c.bill);
  const nx = dt(s.getFullYear(), s.getMonth() + 1, c.bill);
  const ex = S.tx.filter(t => t.t == 'exp' && t.s == c.id);
  const billed = sum(ex.filter(t => t.d > pv && t.d <= st));
  const paid = sum(S.tx.filter(t => t.t == 'pay' && t.cd == c.id && t.d > st && t.d <= dt(y, m + 1, 0)));
  return { st, billed, paid, pay: Math.max(0, billed - paid), carry: sum(ex.filter(t => t.d > st && t.d <= nx)), dueD: dt(y, m, c.due), open: st > iso(T) };
}

function free(c) {
  const t = iso(T);
  let ns = dt(T.getFullYear(), T.getMonth(), c.bill);
  if (ns < t) ns = dt(T.getFullYear(), T.getMonth() + 1, c.bill);
  const s = new Date(ns + 'T00:00');
  let du = dt(s.getFullYear(), s.getMonth(), c.due);
  if (du <= ns) du = dt(s.getFullYear(), s.getMonth() + 1, c.due);
  return Math.round((new Date(du) - new Date(t)) / 864e5);
}

// Merchant Branding & Avatars
function getMerchantBadge(n, c, t) {
  const s = ((n || '') + ' ' + (c || '')).toLowerCase();
  if (/fuel|petrol|diesel|gas|hpcl|bpcl|iocl|shell/i.test(s)) return { icon: '⛽', bg: '#EA580C' };
  if (/swiggy|zomato|dining|restaurant|food|burger|pizza|biryani|subway|mcdonald/i.test(s)) return { icon: '🍽️', bg: '#DC2626' };
  if (/coffee|tea|cafe|starbucks|chai|snack|bakery/i.test(s)) return { icon: '☕', bg: '#D97706' };
  if (/grocer|dmart|blinkit|zepto|instamart|bigbasket|supermarket|market|milk/i.test(s)) return { icon: '🛒', bg: '#059669' };
  if (/amazon|flipkart|myntra|zara|shopping|cloth|dress|ajio/i.test(s)) return { icon: '🛍️', bg: '#7C3AED' };
  if (/netflix|prime|hotstar|spotify|movie|theatre|cinema|entertainment|pvr/i.test(s)) return { icon: '🎬', bg: '#E11D48' };
  if (/uber|ola|rapido|taxi|auto|metro|transport|train|bus/i.test(s)) return { icon: '🚕', bg: '#CA8A04' };
  if (/rent|electric|kseb|bescom|water|maintenance|broadband|wifi|airtel|jio/i.test(s)) return { icon: '🏠', bg: '#2563EB' };
  if (/sip|mutual|stock|zerodha|groww|invest|kuri|ksfe|ppf|sukanya|gold/i.test(s)) return { icon: '📈', bg: '#4F46E5' };
  if (t === 'inc' || /salary|dividend|interest|cashback/i.test(s)) return { icon: '💰', bg: '#0F766E' };
  if (t === 'pay') return { icon: '💳', bg: '#9333EA' };
  if (t === 'xfer') return { icon: '⇄', bg: '#0284C7' };
  return { icon: '🏷️', bg: '#4B5160' };
}

// Undo Engine
let lastDeletedAction = null;
function undoLastDelete() {
  if (!lastDeletedAction) return;
  lastDeletedAction();
  lastDeletedAction = null;
  toast('✓ Action undone successfully');
}

function toastAction(m, actionLabel, actionFn) {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${m}</span><button type=button id=toastActBtn>${actionLabel}</button>`;
  t.classList.add('has-action');
  t.style.opacity = 1;
  const btn = $('#toastActBtn');
  if (btn) btn.onclick = () => { actionFn(); t.style.opacity = 0; };
  clearTimeout(t.h);
  t.h = setTimeout(() => { t.style.opacity = 0; t.classList.remove('has-action'); }, 5000);
}

function toast(m) {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = m;
  t.classList.remove('has-action');
  t.style.opacity = 1;
  clearTimeout(t.h);
  t.h = setTimeout(() => (t.style.opacity = 0), 2500);
}

// PIN Lock Engine
function isPinLocked() {
  return !!S.pin && !sessionStorage.getItem('fintrak_unlocked');
}

function unlockWithPin(p) {
  if (p === S.pin) {
    sessionStorage.setItem('fintrak_unlocked', '1');
    render();
    return true;
  }
  return false;
}

// Backup Check (14 days reminder)
function checkBackupReminder() {
  const lb = localStorage.getItem('fintrak_last_backup');
  if (!lb) return true;
  const days = (Date.now() - new Date(lb).getTime()) / 864e5;
  return days > 14;
}

// Safe Daily Spend Engine (Mathematically Sound)
function getSafeDailySpend() {
  const dn = new Date(V.y, V.m + 1, 0).getDate();
  const td = cur() ? T.getDate() : dn;
  const daysLeft = Math.max(1, dn - td + 1);
  const M = mt().filter(t => !t.adj);
  const ex = sum(M.filter(t => t.t == 'exp'));

  // 1. If monthly budget is configured
  if (S.budget && S.budget > 0) {
    const budgetLeft = Math.max(0, S.budget - ex);
    const daily = Math.round(budgetLeft / daysLeft);
    return {
      daily,
      daysLeft,
      type: 'budget',
      left: budgetLeft,
      label: `Safe daily budget: <b>${f(daily)}/day</b> (${f(budgetLeft)} left of ${f(S.budget)} budget · ${daysLeft}d left)`
    };
  }

  // 2. If no budget: base on uncommitted monthly surplus
  const key = ym(V.y, V.m);
  const plannedInc = sum(PL(key).filter(p => p.k == 'inc').map(p => ({ a: pamt(p) })));
  const recInc = sum(M.filter(t => t.t == 'inc'));
  const totalInc = Math.max(recInc, plannedInc);

  const plannedBills = sum(PL(key).filter(p => p.k == 'exp').map(p => ({ a: pamt(p) })));
  const plannedInv = sum(PL(key).filter(p => p.k == 'inv').map(p => ({ a: pamt(p) })));
  const ccBills = sum(S.cards.map(c => bill(c, V.y, V.m)), 'pay');
  const committed = plannedBills + plannedInv + ccBills;

  const surplusForMonth = Math.max(0, totalInc - committed);
  const surplusLeft = Math.max(0, surplusForMonth - ex);
  const daily = Math.round(surplusLeft / daysLeft);

  return {
    daily,
    daysLeft,
    type: 'surplus',
    left: surplusLeft,
    label: `Safe daily spend: <b>${f(daily)}/day</b> (${f(surplusLeft)} uncommitted surplus · ${daysLeft}d left)`
  };
}

// Indian Bank SMS Parser Engine
function parseBankSMS(txt) {
  if (!txt) return null;
  const res = { a: 0, n: '', c: '', d: iso(T), s: '' };

  // 1. Extract Amount
  const amtMatch = txt.match(/(?:(?:rs\.?|inr|debited by|spent|paid|for)\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
                   txt.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs|inr|debited)/i);
  if (amtMatch) {
    res.a = parseFloat(amtMatch[1].replace(/,/g, '')) || 0;
  }

  // 2. Extract Merchant
  const merchMatch = txt.match(/(?:to|towards|at|vpa|info|for)\s+([A-Za-z0-9\s&.\-_]+?)(?:\s+(?:on|ref|upi|avl|bal|using|via|dated|\.))/i) ||
                     txt.match(/(?:paid to)\s+([A-Za-z0-9\s&.\-_]+)/i);
  if (merchMatch) {
    res.n = merchMatch[1].trim();
  }

  // 3. Category Mapping
  const norm = (res.n + ' ' + txt).toLowerCase();
  if (/swiggy|zomato|eats|restaurant|cafe|coffee|chai|bakery|dining|food/i.test(norm)) {
    res.c = 'Restaurant & takeaway';
  } else if (/petrol|fuel|hpcl|bpcl|iocl|shell/i.test(norm)) {
    res.c = 'Fuel';
  } else if (/amazon|flipkart|myntra|zara|h&m|shopping|mart|blinkit|zepto|instamart|grocery/i.test(norm)) {
    res.c = 'Groceries';
  } else if (/electricity|bescom|kseb|water|gas|rent/i.test(norm)) {
    res.c = 'Electricity, water & gas';
  } else if (/uber|ola|rapido|metro|toll/i.test(norm)) {
    res.c = 'Taxi & auto';
  } else {
    res.c = 'Miscellaneous';
  }

  // 4. Account Matching
  if (/hdfc/i.test(norm)) {
    const acc = S.acc.find(a => /hdfc/i.test(a.n)) || S.cards.find(c => /hdfc/i.test(c.n));
    if (acc) res.s = acc.id;
  } else if (/icici/i.test(norm)) {
    const acc = S.acc.find(a => /icici/i.test(a.n)) || S.cards.find(c => /icici/i.test(c.n));
    if (acc) res.s = acc.id;
  } else if (/sbi/i.test(norm)) {
    const acc = S.acc.find(a => /sbi/i.test(a.n)) || S.cards.find(c => /sbi/i.test(c.n));
    if (acc) res.s = acc.id;
  }
  if (!res.s && S.acc.length) res.s = S.acc[0].id;

  return res;
}

// iCalendar (.ics) Exporter for Card Due Dates & Bills
function exportCalendarICS() {
  const events = [];
  const addDays = (dStr, n) => {
    const d = new Date(dStr + 'T00:00');
    d.setDate(d.getDate() + n);
    return iso(d).replace(/-/g, '');
  };

  S.cards.forEach(c => {
    const b = bill(c, V.y, V.m);
    if (b.pay > 0 || b.billed > 0) {
      const start = b.dueD.replace(/-/g, '');
      events.push(`BEGIN:VEVENT
SUMMARY:Pay ${c.n} Card Bill: ₹${Math.round(b.pay || b.billed)}
DESCRIPTION:Credit card statement payment due for ${c.n}.
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${addDays(b.dueD, 1)}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${c.n} credit card bill due tomorrow
END:VALARM
END:VEVENT`);
    }
  });

  const key = ym(V.y, V.m);
  PL(key).filter(p => p.k == 'exp' && !S.paid[p.id + '|' + key]).forEach(p => {
    const dStr = dt(V.y, V.m, p.day);
    const start = dStr.replace(/-/g, '');
    events.push(`BEGIN:VEVENT
SUMMARY:Bill Due: ${p.n} (₹${pamt(p)})
DESCRIPTION:Scheduled payment for ${p.n} via ${src(p.s)}.
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${addDays(dStr, 1)}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${p.n} bill due tomorrow
END:VALARM
END:VEVENT`);
  });

  if (!events.length) return alert('No pending card bills or scheduled payments found for this month.');

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Fintrak//Financial Schedule Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events.join('\n')}
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fintrak_reminders_${ym(V.y, V.m)}.ics`;
  a.click();
  toast('✓ Calendar reminders exported (.ics)');
}

// Backup Exporter with Share API & Optional Password
async function bk(encrypt = false, password = '') {
  let content = JSON.stringify(S, null, 2);
  let fileName = `fintrak-backup-${iso(T)}.json`;

  if (encrypt && password) {
    // Encapsulate in password protected envelope
    content = JSON.stringify({
      _fintrak_protected: true,
      hint: 'Protected with user PIN/Password',
      date: iso(T),
      data: btoa(unescape(encodeURIComponent(content))),
      hash: btoa(password).slice(0, 10)
    });
    fileName = `fintrak-backup-locked-${iso(T)}.json`;
  }

  const blob = new Blob([content], { type: 'application/json' });
  localStorage.setItem('fintrak_last_backup', iso(T));

  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Fintrak Financial Backup',
          text: `Fintrak Backup - ${iso(T)}`
        });
        toast('✓ Backup shared successfully');
        render();
        return;
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Share skipped, downloading instead');
    }
  }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  toast('✓ Backup exported successfully');
  render();
}

const expCsv = () => {
  const L = [...S.tx].sort((a, b) => b.d.localeCompare(a.d));
  if (!L.length) return alert('No transactions to export');
  let csv = 'Date,Type,Category,Description,Amount,Source,Destination/Card\n';
  L.forEach(t => {
    const q = s => `"${String(s || '').replace(/"/g, '""')}"`;
    csv += `${t.d},${t.t},${q(t.c)},${q(t.n)},${t.a},${q(src(t.s))},${q(t.to ? src(t.to) : t.cd ? src(t.cd) : '')}\n`;
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `fintrak-transactions-${iso(T)}.csv`;
  a.click();
  toast('✓ CSV exported successfully!');
};

const ld = i => {
  const file = i.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      let j = JSON.parse(r.result);
      if (j._fintrak_protected) {
        const pass = prompt('Enter the backup password/PIN:');
        if (!pass || btoa(pass).slice(0, 10) !== j.hash) return alert('Incorrect password! Restore aborted.');
        j = JSON.parse(decodeURIComponent(escape(atob(j.data))));
      }
      if (j.months) {
        if (!confirm('Previous tracker backup detected. Import all accounts, cards, plan, and transactions?')) return;
        S = convertOld(j);
        save();
        toast('✓ Restored from previous backup!');
      } else if (j.acc && Array.isArray(j.acc)) {
        S = j;
        migrate();
        save();
        toast('✓ Restored ' + (S.tx ? S.tx.length : 0) + ' transactions!');
      } else {
        alert('Unrecognized backup format. Please select a valid JSON backup.');
      }
    } catch (x) {
      console.error(x);
      alert('Error reading backup file: ' + (x.message || 'Invalid JSON'));
    }
  };
  r.readAsText(file);
  i.value = '';
};

function form(h, fl, ok, del, noc) {
  const d = $('#dlg');
  d.innerHTML = `<div class=sheet-drag-handle onclick="dlg.close()"></div><form><h3>${h}</h3>${fl.map(x => `<label>${x.l}${x.h ? x.h : x.o ? `<select name=${x.k}>${x.o.map(o => `<option value="${e(o[0])}"${o[0] == x.v ? ' selected' : ''}>${e(o[1])}</option>`).join('')}</select>` : `<input name=${x.k} type=${x.t || 'text'}${x.t == 'number' ? ' step=any inputmode=decimal' : ''} value="${e(x.v)}">`}</label>`).join('')}<div class=row><button type=button onclick="dlg.close()">Cancel</button>${del ? '<button type=button class=bad id=dl>Delete</button>' : ''}<button class=pri>Save</button></div></form>`;
  const fm = d.querySelector('form');
  if (fm) ['n', 'limit', 'bill', 'due'].forEach(field => {
    const inp = fm.querySelector(`[name=${field}]`);
    if (inp) {
      inp.addEventListener('input', () => {
        const pcn = document.getElementById('prevCardName');
        if (pcn && field === 'n') pcn.textContent = inp.value || 'Card Name';
        const pan = document.getElementById('prevAccName');
        if (pan && field === 'n') pan.textContent = inp.value || 'Account Name';
        const pcl = document.getElementById('prevCardLimit');
        if (pcl && field === 'limit') pcl.textContent = f(evalAmt(inp.value) || 0) + ' limit';
        const pcb = document.getElementById('prevCardBill');
        if (pcb && field === 'bill') pcb.textContent = inp.value || 15;
        const pcd = document.getElementById('prevCardDue');
        if (pcd && field === 'due') pcd.textContent = inp.value || 5;
      });
    }
  });
  if (fm) fm.onsubmit = ev => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(fm));
    ['a', 'limit', 'o', 'b', 'bi', 'un'].forEach(k => {
      if (k in data) data[k] = evalAmt(data[k]);
    });
    if (ok(data) !== false) d.close();
  };
  if (del) $('#dl').onclick = () => {
    if (noc || confirm('Delete this item?')) {
      del();
      d.close();
    }
  };
  if (d && d.showModal) d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}

const opts = cd => [...S.acc.map(a => [a.id, a.n]), ...(cd ? S.cards.map(c => [c.id, c.n + ' (card)']) : [])];

function txForm(o = {}) {
  const pasteSmsBtn = `<div style="margin-bottom:8px"><button type=button onclick="openSmsParser()" style="width:100%;font-size:12px;min-height:36px;border-radius:8px;background:color-mix(in srgb,var(--pri) 12%,transparent);color:var(--pri);border:1px dashed var(--pri)">📋 Paste Bank SMS / UPI to Auto-Fill</button></div>`;
  form(o.id ? 'Edit entry' : 'Add entry', [
    { k: 'sms', l: '', h: pasteSmsBtn },
    { k: 't', l: 'Type', o: [['exp', 'Expense'], ['inc', 'Income'], ['inv', 'Investment'], ['pay', 'Card bill payment'], ['xfer', 'Transfer between accounts']], v: o.t || 'exp' },
    { k: 'a', l: 'Amount', t: 'number', v: o.a },
    { k: 'd', l: 'Date', t: 'date', v: o.d || iso(T) },
    { k: 'c', l: 'Category', h: catSel(o.t || 'exp', o.c) },
    { k: 's', l: 'Account or card (card only for expenses)', o: opts(1), v: o.s },
    { k: 'to', l: 'To account', o: [['', '-'], ...opts(0)], v: o.to },
    { k: 'cd', l: 'Card being paid (bill payment only)', o: [['', '-'], ...S.cards.map(c => [c.id, c.n])], v: o.cd },
    { k: 'n', l: 'Note', v: o.n }
  ],
  r => {
    r.a = +r.a;
    if (!r.a || !r.s) return no('Amount and account are needed');
    if (r.t != 'exp' && S.cards.some(c => c.id == r.s)) return no('Pick a bank account for this type');
    if (r.t == 'pay' && !r.cd) return no('Choose the card being paid');
    if (r.c == '__new') r.c = '';
    if (r.t != 'pay') r.cd = ''; else r.c = 'Card payment';
    if (r.t == 'xfer') {
      if (!r.to || r.to == r.s) return no('Choose a different destination account');
      r.c = 'Transfer';
    } else r.to = '';
    if (r.t == 'pay') {
      const cc = S.cards.find(x => x.id == r.cd);
      if (cc) cc.pa = r.s;
    }
    put(S.tx, o, r);
    save();
  },
  o.id && (() => {
    const deletedItem = { ...o };
    lastDeletedAction = () => {
      S.tx.push(deletedItem);
      save();
    };
    S.tx = S.tx.filter(x => x.id != o.id);
    save();
    toastAction(`Deleted "${o.n || o.c}"`, 'Undo', undoLastDelete);
  }));
  tfv();
}

function openSmsParser() {
  const txt = prompt('Paste your bank SMS or UPI transaction message:');
  if (!txt) return;
  const p = parseBankSMS(txt);
  if (!p || !p.a) return alert('Could not recognize transaction amount from SMS. Please fill manually.');
  
  const d = $('#dlg');
  const aInp = d.querySelector('[name=a]');
  const nInp = d.querySelector('[name=n]');
  const dInp = d.querySelector('[name=d]');
  const sInp = d.querySelector('[name=s]');
  const cSel = d.querySelector('[name=c]');

  if (aInp) aInp.value = p.a;
  if (nInp) nInp.value = p.n;
  if (dInp) dInp.value = p.d;
  if (sInp && p.s) sInp.value = p.s;
  if (cSel && p.c) cSel.value = p.c;
  toast('✓ Filled amount and merchant from SMS!');
}

function accForm(o = {}) {
  form(o.id ? 'Edit account' : 'Add bank account', [
    { k: 'n', l: 'Account name', v: o.n },
    { k: 'o', l: 'Opening balance', t: 'number', v: o.o },
    { k: 'col', l: '', h: swatches(defCol(o), false, o) }
  ],
  r => {
    r.o = +r.o || 0;
    if (!r.n) return no('Name needed');
    put(S.acc, o, r);
    save();
  },
  o.id && (() => {
    S.acc = S.acc.filter(x => x.id != o.id);
    save();
  }));
}

function cardForm(o = {}) {
  form(o.id ? 'Edit card' : 'Add credit card', [
    { k: 'n', l: 'Card name', v: o.n },
    { k: 'limit', l: 'Credit limit', t: 'number', v: o.limit },
    { k: 'bill', l: 'Billing (statement) day of month', t: 'number', v: o.bill },
    { k: 'due', l: 'Payment due day of month', t: 'number', v: o.due },
    { k: 'pa', l: 'Usually paid from (bank account)', o: [['', '-'], ...opts(0)], v: o.pa },
    { k: 'col', l: '', h: swatches(defCol(o), true, o) }
  ],
  r => {
    ['limit', 'bill', 'due'].forEach(k => r[k] = +r[k]);
    if (!r.n || r.bill < 1 || r.bill > 31 || r.due < 1 || r.due > 31) return no('Enter name, billing day and due day (1-31)');
    put(S.cards, o, r);
    save();
  },
  o.id && (() => {
    S.cards = S.cards.filter(x => x.id != o.id);
    save();
  }));
}

function planForm(o = {}) {
  form(o.id ? 'Edit planned item' : 'New planned item', [
    { k: 'n', l: 'Name (e.g. Home loan EMI, SIP)', v: o.n },
    { k: 'k', l: 'Type', o: [['exp', 'Payment'], ['inv', 'Investment'], ['inc', 'Expected income']], v: o.k || 'exp' },
    { k: 'a', l: 'Amount per month', t: 'number', v: o.a },
    { k: 'day', l: 'Day of month', t: 'number', v: o.day || 1 },
    { k: 's', l: 'Account or card', o: opts(1), v: o.s },
    { k: 'c', l: 'Category', h: catSel(o.k || 'exp', o.c) },
    { k: 'rep', l: 'Repeats', o: [['m', 'Every month'], ['1', 'This month only (stops after it)']], v: o.end ? '1' : 'm' }
  ],
  r => {
    r.a = +r.a;
    r.day = +r.day;
    if (!r.n || !r.a || !r.s || r.day < 1 || r.day > 31) return no('Name, amount, source and day (1-31) are needed');
    if (r.k != 'exp' && S.cards.some(c => c.id == r.s)) return no('Investments and income must use a bank account');
    const k = ym(V.y, V.m), mn = mo();
    if (r.rep == '1') r.end = k; else if (o.end) r.end = '';
    delete r.rep;
    if (o.id && r.a != o.a && (!o.from || o.from < k) && !S.paid[o.id + '|' + k] && confirm('Apply the new amount from ' + mn + ' onward? Earlier months keep ' + f(o.a) + '.')) {
      o.end = pm(V.y, V.m - 1);
      S.plan.push({ ...o, ...r, id: id(), from: k, end: r.end || undefined });
      save();
      return;
    }
    if (!o.id) r.from = k;
    put(S.plan, o, r);
    save();
  },
  o.id && (() => delPlan(o)),
  1);
}

function simCalc(sliderVal, baseEnd, inc, ex, iv, dn, td) {
  const adjEnd = baseEnd + sliderVal;
  const daysLeft = Math.max(1, dn - td + 1);
  const diffDaily = Math.round(sliderVal / daysLeft);
  return `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>Simulated Month-End Cash:</span><b style="color:${adjEnd < 0 ? 'var(--bad)' : 'var(--ok)'}">${f(adjEnd)}</b></div><div style="font-size:12px;color:var(--mut)">Effect on daily spending: <b>${diffDaily >= 0 ? '+' : ''}${f(diffDaily)}/day</b> (${daysLeft} days remaining)</div>`;
}

function goalForm(o = {}) {
  form(o.id ? 'Edit Goal' : 'New Sinking Fund / Goal', [
    { k: 'n', l: 'Goal Name (e.g. Vacation, Car Insurance, Emergency Fund)', v: o.n },
    { k: 'target', l: 'Target Amount (₹)', t: 'number', v: o.target },
    { k: 'saved', l: 'Current Saved Amount (₹)', t: 'number', v: o.saved || 0 },
    { k: 'd', l: 'Target Date', t: 'date', v: o.d || dt(V.y + 1, V.m, 1) },
    { k: 's', l: 'Parked In Bank Account', o: opts(0), v: o.s }
  ],
  r => {
    r.target = +r.target;
    r.saved = +r.saved || 0;
    if (!r.n || !r.target) return no('Goal name and target amount are needed');
    put(S.goals, o, r);
    save();
  },
  o.id && (() => {
    S.goals = S.goals.filter(x => x.id != o.id);
    save();
  }));
}

function goalAddMoney(gid) {
  const g = S.goals.find(x => x.id == gid);
  if (!g) return;
  const amt = +prompt(`Add savings to "${g.n}" (Current: ${f(g.saved)} / Target: ${f(g.target)}):`, '1000') || 0;
  if (!amt) return;
  g.saved = (g.saved || 0) + amt;
  save();
  toast(`✓ Added ${f(amt)} to ${g.n}`);
}

function delPlan(o) {
  const k = ym(V.y, V.m), mn = mo(), all = () => {
    S.plan = S.plan.filter(x => x.id != o.id);
    Object.keys(S.paid).forEach(x => { if (x.startsWith(o.id + '|')) delete S.paid[x]; });
    save();
  };
  if (o.from && o.from >= k) {
    if (confirm('Delete "' + o.n + '"?')) all();
    return;
  }
  if (confirm('Stop "' + o.n + '" from ' + mn + ' onward? Earlier months keep it.')) {
    o.end = S.paid[o.id + '|' + k] ? k : pm(V.y, V.m - 1);
    save();
  } else if (confirm('Delete "' + o.n + '" from ALL months? Past entries stay in History.')) all();
}

function payCard(i) {
  const c = S.cards.find(x => x.id == i), b = bill(c, V.y, V.m);
  if (!c.pa || !S.acc.some(a => a.id == c.pa)) return txForm({ t: 'pay', s: '', cd: i, a: Math.round(b.pay) });
  if (!confirm('Pay ' + f(b.pay) + ' to ' + c.n + ' from ' + src(c.pa) + '?')) return;
  S.tx.push({ id: id(), d: iso(T), t: 'pay', a: b.pay, c: 'Card payment', n: c.n + ' bill', s: c.pa, cd: i });
  save();
}

const COL = ['#6366F1', '#14B8A6', '#F59E0B', '#EC4899', '#3B82F6', '#9CA3AF'];
const PL = key => S.plan.filter(p => (!p.from || key >= p.from) && (!p.end || key <= p.end));
const pm = (y, m) => {
  const d = new Date(y, m);
  return ym(d.getFullYear(), d.getMonth());
};

const PALX = [
  '#0A2540', '#1E3A8A', '#0284C7', '#0369A1', '#0F766E', '#0D9488',
  '#4F46E5', '#6366F1', '#7C3AED', '#9333EA', '#831843', '#BE185D',
  '#EA580C', '#F97316', '#DC2626', '#E11D48', '#B45309', '#D97706',
  '#047857', '#059669', '#10B981', '#14B8A6', '#4D7C0F', '#65A30D',
  '#CA8A04', '#EAB308', '#A16207', '#C2410C', '#0E7490', '#2563EB',
  '#000000', '#18181B', '#27272A', '#3F3F46', '#475569', '#64748B'
];

const colr = i => {
  const l = [...S.acc, ...S.cards], x = l.find(a => a.id == i);
  return x ? (x.col || PALX[l.indexOf(x) % PALX.length]) : '#9CA3AF';
};

const chip = i => {
  const c = colr(i);
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:1px 8px;border-radius:99px;background:color-mix(in srgb,${c} 20%,transparent);font-size:12px;color:var(--ink)"><i style="width:8px;height:8px;border-radius:50%;background:${c}"></i>${e(src(i))}</span>`;
};

const defCol = o => o.col || (o.id ? colr(o.id) : PALX[(S.acc.length + S.cards.length) % PALX.length]);

const swatches = (v, isCard = false, o = {}) => {
  const pCard = isCard ? `<div id="colCardPreview" style="margin-bottom:12px;border-radius:14px;padding:12px 14px;color:#fff;background:linear-gradient(135deg,${v},color-mix(in srgb,${v} 65%,#000));box-shadow:0 4px 14px rgba(0,0,0,0.18);transition:background .2s;"><div style="display:flex;justify-content:space-between;align-items:center;"><b id="prevCardName">${e(o.n || 'Card Name')}</b><span style="font-size:10px;font-weight:700;letter-spacing:1px;opacity:.9;background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px;">CREDIT</span></div><div style="font-size:11px;opacity:.85;margin-top:4px;">Billing: <span id="prevCardBill">${o.bill || 15}</span>th · Due: <span id="prevCardDue">${o.due || 5}</span>th</div><div style="font-size:18px;font-weight:700;margin-top:8px;" id="prevCardLimit">${f(o.limit || 0)} limit</div></div>` : `<div id="colAccPreview" style="margin-bottom:10px;display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:20px;background:color-mix(in srgb,${v} 18%,transparent);color:var(--ink);font-weight:600;font-size:13px;transition:background .2s;"><i id="prevAccDot" style="width:10px;height:10px;border-radius:50%;background:${v};display:inline-block;"></i><span id="prevAccName">${e(o.n || 'Account Name')}</span></div>`;
  return `${pCard}<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;"><span class=m onclick="event.preventDefault()">Colour palette (36 Curated + Custom)</span><span class=m style="font-size:11px;">Full Palette</span></div><input type=hidden name=col value="${v}"><div class=sws>${PALX.map(c => `<button type=button data-c="${c}" aria-label="Colour ${c}" onclick="pickCol(this,'${c}')" style="background:${c}" class="${c.toUpperCase() == v.toUpperCase() ? 'on' : ''}"></button>`).join('')}</div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding:6px 10px;border-radius:12px;background:var(--bg);gap:8px;"><div style="display:flex;align-items:center;gap:8px;"><label style="position:relative;width:34px;height:34px;border-radius:50%;background:conic-gradient(red,yellow,lime,aqua,blue,magenta,red);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.25);flex:none;" title="Full spectrum color wheel"><input type="color" id="nativeColPicker" value="${/^#[0-9A-Fa-f]{6}$/.test(v) ? v : '#4F46E5'}" onchange="setFormCol(this.value)" oninput="setFormCol(this.value)" style="opacity:0;width:100%;height:100%;position:absolute;left:0;top:0;cursor:pointer;"></label><span style="font-size:12px;font-weight:600;color:var(--ink);">Full Color Wheel</span></div><div style="display:flex;align-items:center;gap:4px;"><span style="font-size:11px;color:var(--mut);font-family:monospace;">HEX</span><input type="text" id="hexColInput" value="${v.toUpperCase()}" maxlength="7" placeholder="#RRGGBB" oninput="pickHexCol(this.value)" style="width:78px;min-height:32px;font-size:12px;font-family:monospace;text-transform:uppercase;padding:0 6px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);text-align:center;"></div></div>`;
};

function setFormCol(c) {
  if (!c) return;
  const hiddenInp = document.querySelector('input[name=col]');
  if (hiddenInp) hiddenInp.value = c;
  const hexInp = document.getElementById('hexColInput');
  if (hexInp && hexInp.value.toUpperCase() !== c.toUpperCase()) hexInp.value = c.toUpperCase();
  const nativePicker = document.getElementById('nativeColPicker');
  if (nativePicker && /^#[0-9A-Fa-f]{6}$/.test(c) && nativePicker.value.toUpperCase() !== c.toUpperCase()) nativePicker.value = c;
  document.querySelectorAll('.sws button').forEach(b => {
    const bc = b.getAttribute('data-c');
    b.classList.toggle('on', bc && bc.toUpperCase() === c.toUpperCase());
  });
  const cp = document.getElementById('colCardPreview');
  if (cp) cp.style.background = `linear-gradient(135deg,${c},color-mix(in srgb,${c} 65%,#000))`;
  const ap = document.getElementById('colAccPreview');
  if (ap) {
    ap.style.background = `color-mix(in srgb,${c} 18%,transparent)`;
    const dot = document.getElementById('prevAccDot');
    if (dot) dot.style.background = c;
  }
}

function pickCol(b, c) { setFormCol(c); }
function pickHexCol(v) {
  let s = (v || '').trim();
  if (!s.startsWith('#')) s = '#' + s;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) setFormCol(s);
  else {
    const hiddenInp = document.querySelector('input[name=col]');
    if (hiddenInp) hiddenInp.value = s;
  }
}

function pamt(p) {
  if (p.a) return p.a;
  let b = null;
  Object.entries(S.paid).forEach(([k, v]) => {
    if (k.startsWith(p.id + '|')) {
      const t = S.tx.find(x => x.id == v);
      if (t && (!b || t.d > b.d)) b = t;
    }
  });
  return b ? b.a : 0;
}

function estSp(y, m) {
  const now = T.getFullYear() * 12 + T.getMonth(), pids = new Set(Object.values(S.paid)), mm = {}, cu = ym(T.getFullYear(), T.getMonth());
  S.tx.forEach(t => {
    if (t.t == 'exp' && !t.adj && !pids.has(t.id) && S.acc.some(a => a.id == t.s)) {
      const k = t.d.slice(0, 7);
      mm[k] = (mm[k] || 0) + t.a;
    }
  });
  const ks = Object.keys(mm).filter(k => k < cu).sort().slice(-3), avg = ks.length ? ks.reduce((s, k) => s + mm[k], 0) / ks.length : (mm[cu] || 0) / T.getDate() * new Date(T.getFullYear(), T.getMonth() + 1, 0).getDate();
  return y * 12 + m == now ? Math.max(0, avg - (mm[cu] || 0)) : avg;
}

function fd() {
  const now = T.getFullYear() * 12 + T.getMonth(), tg = Math.max(V.y * 12 + V.m, now);
  let cash = S.acc.reduce((s, a) => s + accBal(a), 0), r;
  for (let k = now; k <= tg; k++) {
    const y = Math.floor(k/12), m = k % 12, key = ym(y, m), u = p => !S.paid[p.id + '|' + key];
    const ps = x => sum(PL(key).filter(p => p.k == x && u(p)).map(p => ({ a: pamt(p) })));
    const pi = ps('inc'), pp = ps('exp'), pv = ps('inv');
    const cp = sum(S.cards.map(c => bill(c, y, m)), 'pay');
    const es = S.est ? estSp(y, m) : 0;
    r = { cash, pi, pp, pv, cp, es, end: cash + pi - pp - pv - cp - es };
    cash = r.end;
  }
  return r;
}

const ring = (p, c, s = 64, txt = null) => `<svg width=${s} height=${s} viewBox="0 0 64 64" role=img aria-label="${Math.round(p * 100)} percent"><circle cx=32 cy=32 r=26 fill=none stroke="var(--line)" stroke-width=8 /><circle cx=32 cy=32 r=26 fill=none stroke="${c}" stroke-width=8 stroke-linecap=round stroke-dasharray="${Math.min(1, p) * 163.4} 163.4" transform="rotate(-90 32 32)"/><text x=32 y=37 text-anchor=middle font-size=12 font-weight=700 fill="var(--ink)">${txt !== null ? txt : Math.round(p * 100) + '%'}</text></svg>`;

const CPAL = {
  Vivid: ['#F59E0B', '#EC4899', '#2563EB', '#14B8A6', '#7C3AED', '#EF4444', '#84CC16', '#92400E', '#9CA3AF', '#0F766E', '#4F46E5', '#06B6D4', '#F97316', '#A855F7', '#65A30D', '#E11D48'],
  Pastel: ['#FBBF77', '#F9A8D4', '#93C5FD', '#5EEAD4', '#C4B5FD', '#FCA5A5', '#BEF264', '#D6A57A', '#D1D5DB', '#6EE7B7', '#A5B4FC', '#67E8F9', '#FDBA74', '#D8B4FE', '#86EFAC', '#FDA4AF'],
  Ocean: ['#0EA5E9', '#0369A1', '#14B8A6', '#0F766E', '#6366F1', '#38BDF8', '#22D3EE', '#1E3A8A', '#94A3B8', '#059669', '#2563EB', '#67E8F9', '#34D399', '#818CF8', '#0891B2', '#475569'],
  Earth: ['#B45309', '#9A3412', '#65A30D', '#78350F', '#CA8A04', '#DC2626', '#4D7C0F', '#A16207', '#A8A29E', '#166534', '#92400E', '#D97706', '#854D0E', '#BE123C', '#57534E', '#EA580C'],
  'Colour-blind safe': ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#6B7280', '#999999', '#44AA99', '#882255', '#117733', '#88CCEE', '#DDCC77', '#AA4499', '#332288']
};

const GL = ['Food & Drinks', 'Shopping', 'Housing', 'Transport', 'Vehicle', 'Life & Entertainment', 'Communication', 'Financial', 'Others', 'Income', 'Investments'];
const hue = h => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  if (!d) return 215;
  const x = mx == r ? ((g - b) / d) % 6 : mx == g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((x * 60 + 360) % 360);
};

function cpal(n = TH.c || 'Vivid') {
  if (n == 'Accent') {
    const h = hue((ACC[TH.a] || ACC.Indigo)[0]);
    return Array.from({ length: 16 }, (_, i) => `hsl(${(h + [0, 35, -35, 70, -70, 15, -15, 55][i % 8] + 360) % 360},66%,${[36, 62, 48, 72][i % 4]}%)`);
  }
  return CPAL[n] || CPAL.Vivid;
}

function ccols(keys) {
  const P = cpal(), used = new Set(), out = {};
  keys.forEach(k => {
    let i = GL.indexOf(k == 'Other' ? 'Others' : k);
    if (i < 0) {
      let h = 0;
      for (const ch of String(k)) h = (h * 31 + ch.charCodeAt(0)) % 997;
      i = 11 + h % 5;
    }
    let n = 0;
    while (used.has(i % 16) && n++ < 16) i++;
    used.add(i % 16);
    out[k] = P[i % 16];
  });
  return out;
}

function donut(L, tot, CC) {
  const C = 251.3; let o = 0;
  return `<svg viewBox="0 0 100 100" width=150 height=150 role=img aria-label="Spending by category"><circle cx=50 cy=50 r=40 fill=none stroke="var(--line)" stroke-width=14 />${L.map(([k, v], i) => {
    const l = v / tot * C, x = `<circle cx=50 cy=50 r=40 fill=none stroke="${(CC || {})[k] || COL[i]}" stroke-width=14 stroke-dasharray="${l} ${C - l}" stroke-dashoffset="${-o}" transform="rotate(-90 50 50)"/>`;
    o += l;
    return x;
  }).join('')}<text x=50 y=48 text-anchor=middle font-size=8 fill="var(--mut)">Spent</text><text x=50 y=60 text-anchor=middle font-size=10 font-weight=700 fill="var(--ink)">${f(tot)}</text></svg>`;
}

const CATS = {
  'Food & Drinks': ['Groceries', 'Restaurant & takeaway', 'Cafe & snacks'],
  'Shopping': ['Clothes & footwear', 'Electronics', 'Gifts', 'Home & garden', 'Personal care', 'Kids', 'Pets'],
  'Housing': ['Rent', 'Electricity, water & gas', 'Maintenance & repairs', 'Home services'],
  'Transport': ['Public transport', 'Taxi & auto', 'Long-distance travel'],
  'Vehicle': ['Fuel', 'Parking & tolls', 'Service & repairs', 'Vehicle insurance'],
  'Life & Entertainment': ['Health & medical', 'Fitness & sports', 'Education', 'Subscriptions & streaming', 'Hobbies', 'Holidays & trips', 'Charity & donations', 'Events & outings'],
  'Communication': ['Mobile', 'Internet & DTH', 'Apps & software'],
  'Financial': ['Taxes', 'Insurance', 'Loan EMI & interest', 'Fees & charges', 'Fines'],
  'Others': ['Miscellaneous']
};

const CATI = { 'Income': ['Salary', 'Business & freelance', 'Interest & dividends', 'Rental income', 'Refunds & cashback', 'Gifts received', 'Repayments received', 'Other income'] };
const CATV = { 'Investments': ['SIP & mutual funds', 'Stocks', 'RD & FD', 'Gold', 'Real estate', 'Chit fund (kuri)', 'Government schemes (PPF, SSY, NPS)', 'ULIP & insurance plans'] };
const CATG = {};
[CATS, CATI, CATV].forEach(G => Object.entries(G).forEach(([g, L]) => L.forEach(v => CATG[v] = g)));

const catSel = (t, v) => {
  const G = t == 'inc' ? CATI : t == 'inv' ? CATV : CATS;
  const kn = new Set(Object.values(G).flat());
  const ty = t == 'pay' ? 'exp' : t;
  const mine = [...new Set([...(S.cats || []), ...S.tx.filter(x => x.t == ty).map(x => x.c), v].filter(c => c && !kn.has(c) && c != 'Card balance' && c != 'Card payment'))];
  const op = c => `<option${c == v ? ' selected' : ''}>${e(c)}</option>`;
  return `<select name=c><option value="">Uncategorised</option>${Object.entries(G).map(([g, L]) => `<optgroup label="${e(g)}">${L.map(op).join('')}</optgroup>`).join('')}${mine.length ? `<optgroup label="Your categories">${mine.map(op).join('')}</optgroup>` : ''}<option value="__new">+ New category...</option></select>`;
};

if (typeof document !== 'undefined') {
  const dlg = $('#dlg');
  if (dlg) {
    dlg.addEventListener('change', ev => {
      const n = ev.target, d = $('#dlg'), tf = d.querySelector('[name=t],[name=k]');
      if (n.name == 'c' && n.value == '__new') {
        const v = (prompt('New category name') || '').trim();
        if (v) S.cats = [...new Set([...(S.cats || []), v])];
        n.outerHTML = catSel(tf ? tf.value : 'exp', v);
      } else if (n == tf) {
        const c = d.querySelector('[name=c]');
        if (c) c.outerHTML = catSel(n.value, '');
        tfv();
      }
    });
  }
}

function tfv() {
  const d = $('#dlg');
  if (!d) return;
  const t = d.querySelector('[name=t]');
  if (!t) return;
  const sh = (n, v) => {
    const x = d.querySelector('[name=' + n + ']');
    if (x) x.parentElement.style.display = v ? '' : 'none';
  };
  sh('cd', t.value == 'pay');
  sh('to', t.value == 'xfer');
  sh('c', t.value != 'pay' && t.value != 'xfer');
  const sField = d.querySelector('[name=s]');
  if (sField && sField.parentElement && sField.parentElement.firstChild) {
    sField.parentElement.firstChild.textContent = t.value == 'xfer' ? 'From account' : 'Account or card (card only for expenses)';
  }
}

function lsb(c) {
  const t0 = iso(T), Y = T.getFullYear(), Mo = T.getMonth(), th = dt(Y, Mo, c.bill);
  const ls = th <= t0 ? th : dt(Y, Mo - 1, c.bill), s = new Date(ls + 'T00:00'), pv = dt(s.getFullYear(), s.getMonth() - 1, c.bill);
  const ex = S.tx.filter(t => t.t == 'exp' && t.s == c.id);
  return { ls, t0, s, bi: sum(ex.filter(t => t.d > pv && t.d <= ls)), un: sum(ex.filter(t => t.d > ls)) };
}

function stmtForm(i) {
  const c = S.cards.find(x => x.id == i), b = lsb(c);
  form(c.n + ': statement amounts', [
    { k: 'bi', l: 'Billed on last statement (' + b.ls.slice(5) + '), payable on the next due date', t: 'number', v: b.bi },
    { k: 'un', l: 'Spent since that statement (unbilled)', t: 'number', v: b.un }
  ],
  r => {
    S.tx = S.tx.filter(t => !(t.adj && t.s == c.id));
    const q = lsb(c), nb = +r.bi || 0, nu = +r.un || 0;
    if (nb > q.bi) S.tx.push({ id: id(), d: q.ls, t: 'exp', a: nb - q.bi, c: 'Card balance', n: 'Statement adjustment', s: c.id, adj: 1 });
    if (nu > q.un) S.tx.push({ id: id(), d: q.t0 > q.ls ? q.t0 : iso(new Date(+q.s + 864e5)), t: 'exp', a: nu - q.un, c: 'Card balance', n: 'Unbilled adjustment', s: c.id, adj: 1 });
    save();
  });
}

const LEGC = { food: 'Restaurant & takeaway', home: 'Groceries', fuel: 'Fuel', personal: 'Miscellaneous', adhoc: 'Miscellaneous', rent: 'Rent', phone: 'Mobile', internet: 'Internet & DTH', 'school fee': 'Education', 'school bus': 'Education', 'bajaj life': 'Insurance', rd: 'RD & FD', sip: 'SIP & mutual funds', 'kuri 1': 'Chit fund (kuri)', 'kuri 2': 'Chit fund (kuri)', 'kuri 3': 'Chit fund (kuri)', ksfe: 'Chit fund (kuri)', 'sukanya sm': 'Government schemes (PPF, SSY, NPS)', ulip: 'ULIP & insurance plans', 'bajaj child': 'ULIP & insurance plans', salary: 'Salary' };
const LEGD = [
  [/tea|coffee|sarbath|juice|snack|bakery/i, 'Cafe & snacks', 'food'],
  [/car wash|tyre|puncture|service|repair/i, 'Service & repairs', 'adhoc'],
  [/furniture|home|rope|kitchen|bulb|paint/i, 'Home & garden', 'adhoc'],
  [/darga|temple|church|donat|zakat/i, 'Charity & donations', 'personal'],
  [/electric|water|gas|kseb/i, 'Electricity, water & gas', 'home']
];

function mapCat(t) {
  const c = String(t.c || '').trim(), k = c.toLowerCase();
  if (t.t == 'inc' && /repay|payment/i.test(c)) return 'Repayments received';
  for (const [r, v, q] of LEGD) if (q == k && r.test(t.n || '')) return v;
  return LEGC[k] || c;
}

function tidy() {
  let n = 0;
  S.tx.forEach(t => {
    if (t.adj) return;
    const m = mapCat(t);
    if (m != t.c) { t.c = m; n++; }
  });
  S.plan.forEach(p => { p.c = mapCat({ c: p.c || p.n, t: p.k, n: p.n }); });
  save();
  alert(n + ' entries moved to the new categories');
}

const budForm = () => form('Monthly budget', [{ k: 'b', l: 'Total monthly spending budget', t: 'number', v: S.budget || '' }], r => { S.budget = +r.b || 0; save(); });

const tg = i => {
  const p = S.plan.find(x => x.id == i), k = i + '|' + ym(V.y, V.m);
  if (S.paid[k]) {
    S.tx = S.tx.filter(t => t.id != S.paid[k]);
    delete S.paid[k];
  } else {
    let a = p.a;
    if (!a) {
      a = +prompt('Amount for ' + p.n + '?', pamt(p) || '') || 0;
      if (!a) return;
    }
    const t = { id: id(), d: cur() ? iso(T) : dt(V.y, V.m, p.day), t: p.k, a, c: p.c || p.n, n: p.n, s: p.s };
    S.tx.push(t);
    S.paid[k] = t.id;
  }
  save();
};

function convertOld(j) {
  const M3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], R = { acc: [], cards: [], tx: [], plan: [], paid: {}, budget: 0 }, pk = k => k.split('-')[1] * 12 + M3.indexOf(k.split('-')[0]), ks = Object.keys(j.months).sort((a, b) => pk(a) - pk(b)), L = j.months[j.activeMonth] || j.months[ks[ks.length - 1]], sid = s => String(s || '').split(':')[1] || '', slug = s => String(s).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
  ks.forEach(k => {
    const m = j.months[k], y = +k.split('-')[1], mi = M3.indexOf(k.split('-')[0]), mk = ym(y, mi);
    (m.expenses || []).forEach(x => R.tx.push({ id: id(), d: x.date, t: 'exp', a: +x.amount || 0, c: x.category, n: String(x.description || '').trim(), s: sid(x.source) }));
    [['incomes', 'inc', 'target', 'isReceived', 'lastRecAmt'], ['fixed', 'exp', 'source', 'isPaid', 'lastPaidAmt'], ['invest', 'inv', 'source', 'isPaid', 'lastPaidAmt']].forEach(([a, t, sk, fl, la]) => (m[a] || []).forEach(p => {
      const pid = t + '_' + slug(p.name), amt = +(p[la] || p.amount) || 0, nm = String(p.name).trim();
      if (m === L) R.plan.push({ id: pid, n: nm, k: t, a: +p.amount || +p[la] || 0, day: +p.day, s: sid(p[sk]), c: nm });
      if (p[fl] && amt) {
        const x = { id: id(), d: dt(y, mi, +p.day), t, a: amt, c: nm, n: nm, s: sid(p[sk]) };
        R.tx.push(x);
        R.paid[pid + '|' + mk] = x.id;
      }
    }));
  });
  (L.banks || []).forEach(b => R.acc.push({ id: b.id, n: String(b.name).trim(), o: (+b.balance || 0) - R.tx.reduce((s, t) => s + (t.s == b.id ? (t.t == 'inc' ? t.a : -t.a) : 0), 0) }));
  const t0 = iso(T), Y = T.getFullYear(), Mo = T.getMonth();
  (L.cards || []).forEach(c => {
    const o = { id: c.id, n: String(c.name).trim(), limit: +c.limit || 0, bill: +c.billDay, due: +c.dueDay };
    R.cards.push(o);
    const th = dt(Y, Mo, o.bill), ls = th <= t0 ? th : dt(Y, Mo - 1, o.bill), s = new Date(ls + 'T00:00'), pv = dt(s.getFullYear(), s.getMonth() - 1, o.bill), ex = R.tx.filter(t => t.t == 'exp' && t.s == o.id),
    bi = sum(ex.filter(t => t.d > pv && t.d <= ls)), un = sum(ex.filter(t => t.d > ls));
    if (!c.isPaid && c.billed > bi) R.tx.push({ id: id(), d: ls, t: 'exp', a: c.billed - bi, c: 'Card balance', n: 'Imported billed amount', s: o.id, adj: 1 });
    if (c.unbilled > un) R.tx.push({ id: id(), d: t0 > ls ? t0 : iso(new Date(+s + 864e5)), t: 'exp', a: c.unbilled - un, c: 'Card balance', n: 'Imported unbilled amount', s: o.id, adj: 1 });
  });
  R.tx.forEach(t => { if (!t.adj) t.c = mapCat(t); });
  R.plan.forEach(p => p.c = mapCat({ c: p.c, t: p.k, n: p.n }));
  return R;
}

const mv = d => {
  V.cd = 0;
  V.m += d;
  if (V.m < 0) { V.m = 11; V.y--; }
  if (V.m > 11) { V.m = 0; V.y++; }
  render();
};

// People Ledger Engine ("Who Owes Me What")
function peopleForm(o = {}) {
  form(o.id ? 'Edit Person' : 'Add Person to Ledger', [
    { k: 'name', l: 'Person Name (e.g. Uma, Janish, Jinsha)', v: o.name },
    { k: 'balance', l: 'Current Net Balance (Positive = They owe you, Negative = You owe them)', t: 'number', v: o.balance || 0 },
    { k: 'phone', l: 'Phone / Contact Info', v: o.phone || '' },
    { k: 'notes', l: 'Notes / Context', v: o.notes || '' }
  ],
  r => {
    r.balance = +r.balance || 0;
    if (!r.name) return no('Name is needed');
    r.txs = o.txs || [];
    put(S.people, o, r);
    save();
  },
  o.id && (() => {
    S.people = S.people.filter(p => p.id != o.id);
    save();
  }));
}

function personTxForm(pid, type = 'lent') {
  const p = S.people.find(x => x.id == pid);
  if (!p) return;
  const isLent = type == 'lent';
  form(isLent ? `Lend Money to ${p.name}` : `Record Repayment from ${p.name}`, [
    { k: 'a', l: 'Amount (₹)', t: 'number', v: '' },
    { k: 'd', l: 'Date', t: 'date', v: iso(T) },
    { k: 'acc', l: isLent ? 'Deduct from Bank Account (optional)' : 'Deposit to Bank Account (optional)', o: [['', '- Do not change bank account -'], ...opts(0)], v: S.acc.length ? S.acc[0].id : '' },
    { k: 'note', l: 'Note / Reason', v: isLent ? 'Hand loan' : 'Partial repayment' }
  ],
  r => {
    const amt = +r.a;
    if (!amt) return no('Enter a valid amount');
    p.balance = (p.balance || 0) + (isLent ? amt : -amt);
    p.txs = p.txs || [];
    p.txs.unshift({ id: id(), d: r.d, a: amt, type, note: r.note });
    
    // Auto-create transaction in account if selected
    if (r.acc) {
      if (isLent) {
        S.tx.push({ id: id(), d: r.d, t: 'exp', a: amt, c: 'Miscellaneous', n: `Lent to ${p.name}: ${r.note}`, s: r.acc });
      } else {
        S.tx.push({ id: id(), d: r.d, t: 'inc', a: amt, c: 'Repayments received', n: `Repayment from ${p.name}: ${r.note}`, s: r.acc });
      }
    }
    save();
    toast(`✓ Recorded ${isLent ? 'loan to' : 'repayment from'} ${p.name}`);
  });
}

// Category Budgets Configuration
function catBudgetForm() {
  const cats = Object.keys(CATS);
  const fields = cats.map(c => ({
    k: c,
    l: `${c} Budget limit (₹ / month)`,
    t: 'number',
    v: S.catBudgets[c] || ''
  }));
  form('Category Budgets', fields, r => {
    Object.entries(r).forEach(([k, v]) => {
      const num = +v;
      if (num > 0) S.catBudgets[k] = num;
      else delete S.catBudgets[k];
    });
    save();
    toast('✓ Category budgets updated');
  });
}

// Interactive Scrubber for Pace Chart
function scrubPace(e) {
  const svg = $('#paceSvg');
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const svgX = (relX / rect.width) * 340;
  const dn = new Date(V.y, V.m + 1, 0).getDate();
  const d = Math.max(1, Math.min(dn, Math.round(1 + ((svgX - 10) / 320) * (dn - 1))));

  const M = mt().filter(t => !t.adj);
  let cu = 0;
  for (let i = 1; i <= d; i++) {
    cu += sum(M.filter(t => t.t == 'exp' && +t.d.slice(8) == i));
  }
  const daySpend = sum(M.filter(t => t.t == 'exp' && +t.d.slice(8) == d));
  const expectedPace = S.budget ? Math.round((S.budget / dn) * d) : 0;
  const diff = S.budget ? cu - expectedPace : 0;

  const curX = 10 + (d - 1) / (dn - 1) * 320;
  const curY = 120 - (cu / Math.max(S.budget || 1, cu || 1)) * 110;

  const line = $('#scrubLine'), dot = $('#scrubDot'), tip = $('#scrubTip');
  if (line) {
    line.setAttribute('x1', curX);
    line.setAttribute('x2', curX);
    line.style.display = 'block';
  }
  if (dot) {
    dot.setAttribute('cx', curX);
    dot.setAttribute('cy', Math.max(15, Math.min(120, curY)));
    dot.style.display = 'block';
  }
  if (tip) {
    tip.innerHTML = `<div style="padding:6px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line);font-size:12px;display:flex;justify-content:space-between;align-items:center"><span><b>Day ${d}:</b> Spent ${f(daySpend)} · Cumulative: <b>${f(cu)}</b></span>${S.budget ? (diff > 0 ? `<b class=bad>+${f(diff)} over pace</b>` : `<b class=ok>${f(Math.abs(diff))} under pace</b>`) : ''}</div>`;
  }
}

function unscrubPace() {
  const line = $('#scrubLine'), dot = $('#scrubDot'), tip = $('#scrubTip');
  if (line) line.style.display = 'none';
  if (dot) dot.style.display = 'none';
  if (tip) tip.innerHTML = window._lastPaceAlert || '';
}

// Interactive MoM Scrubber
let MoMScrub = { cPts: [], pPts: [], maxVal: 1, cMonth: '', pMonth: '', dEval: 1, dnC: 31, dnP: 31 };

function scrubMoM(ev) {
  const svg = document.getElementById('momPaceSvg');
  if (!svg || !MoMScrub.cPts.length) return;
  const rect = svg.getBoundingClientRect();
  const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
  const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const svgX = (relX / rect.width) * 340;
  const d = Math.max(1, Math.min(31, Math.round(1 + ((svgX - 16) / 308) * 30)));

  const cPt = MoMScrub.cPts.find(p => p[0] == d);
  const pPt = MoMScrub.pPts.find(p => p[0] == Math.min(d, MoMScrub.dnP));
  const cVal = cPt ? cPt[1] : (d <= MoMScrub.dEval && MoMScrub.cPts.length ? MoMScrub.cPts[MoMScrub.cPts.length - 1][1] : null);
  const pVal = pPt ? pPt[1] : (MoMScrub.pPts.length ? MoMScrub.pPts[MoMScrub.pPts.length - 1][1] : 0);

  const cursor = document.getElementById('momScrubCursor');
  const tip = document.getElementById('momScrubTip');
  const dotC = document.getElementById('momScrubDotC');
  const dotP = document.getElementById('momScrubDotP');

  const curX = 16 + ((d - 1) / 30) * 308;
  const Y = v => 140 - (v / MoMScrub.maxVal) * 122;

  if (cursor) {
    cursor.setAttribute('x1', curX);
    cursor.setAttribute('x2', curX);
    cursor.style.display = 'block';
  }
  if (dotP && pVal !== null) {
    dotP.setAttribute('cx', curX);
    dotP.setAttribute('cy', Y(pVal));
    dotP.style.display = 'block';
  }
  if (dotC && cVal !== null) {
    dotC.setAttribute('cx', curX);
    dotC.setAttribute('cy', Y(cVal));
    dotC.style.display = 'block';
  }

  if (tip) {
    const diff = (cVal !== null) ? cVal - pVal : null;
    const diffBadge = diff !== null ? (diff <= 0 ? `<b style="color:var(--ok)">${f(Math.abs(diff))} lower</b>` : `<b style="color:var(--bad)">+${f(diff)} higher</b>`) : '';
    tip.innerHTML = `<span><b>Day ${d}:</b> ${cVal !== null ? MoMScrub.cMonth + ': <b>' + f(cVal) + '</b>' : 'Projection'} · ${MoMScrub.pMonth}: <b>${f(pVal)}</b></span><span>${diffBadge}</span>`;
  }
}

function unscrubMoM() {
  const cursor = document.getElementById('momScrubCursor');
  const tip = document.getElementById('momScrubTip');
  const dotC = document.getElementById('momScrubDotC');
  const dotP = document.getElementById('momScrubDotP');
  if (cursor) cursor.style.display = 'none';
  if (dotC) dotC.style.display = 'none';
  if (dotP) dotP.style.display = 'none';
  if (tip) tip.innerHTML = tip.getAttribute('data-def') || '';
}

// 1. HOME TAB (Compact, Decluttered & Trustworthy)
function home() {
  const M = mt().filter(t => !t.adj);
  const inc = sum(M.filter(t => t.t == 'inc'));
  const ex = sum(M.filter(t => t.t == 'exp'));
  const iv = sum(M.filter(t => t.t == 'inv'));
  const cash = S.acc.reduce((s, a) => s + accBal(a), 0);
  const debt = S.cards.reduce((s, c) => s + cardOut(c), 0);
  const lim = sum(S.cards, 'limit');
  const mm = {};
  S.tx.filter(t => t.t == 'exp' && !t.adj).forEach(t => mm[t.d.slice(0, 7)] = (mm[t.d.slice(0, 7)] || 0) + t.a);
  const ks = Object.keys(mm).sort().slice(-3);
  const avg = ks.length ? ks.reduce((s, k) => s + mm[k], 0) / ks.length : 0;
  const run = avg ? cash / avg : 0;
  const rate = inc ? (inc - ex) / inc : 0;
  const util = lim ? debt / lim : 0;
  const sc = Math.round(40 * Math.min(1, Math.max(0, rate / 0.3)) + 30 * Math.min(1, run / 6) + 30 * (1 - Math.min(1, util / 0.6)));
  const bl = S.cards.map(c => bill(c, V.y, V.m));
  const F = fd();

  const dn = new Date(V.y, V.m + 1, 0).getDate();
  const td = cur() ? T.getDate() : dn;
  let cu = 0; const pt = [];
  for (let d = 1; d <= td; d++) {
    cu += sum(M.filter(t => t.t == 'exp' && +t.d.slice(8) == d));
    pt.push([d, cu]);
  }
  const dailyPace = td > 0 ? Math.round(cu / td) : 0;
  const pj = cur() && td ? Math.round(dailyPace * dn) : cu;
  const mx = Math.max(S.budget, pj, 1);
  const X = d => 10 + (d - 1) / (dn - 1) * 320;
  const Y = v => 120 - v / mx * 110;

  let paceAlert = '', overMarker = '';
  if (S.budget) {
    if (cur() && td > 0) {
      if (pj > S.budget) {
        const dOver = dailyPace > 0 ? Math.ceil(S.budget / dailyPace) : dn;
        const dClamped = Math.min(dn, Math.max(td, dOver));
        if (dClamped <= dn) {
          overMarker = `<circle cx="${X(dClamped)}" cy="${Y(S.budget)}" r="5" fill="var(--bad)" stroke="#fff" stroke-width="2"/><text x="${Math.min(270, Math.max(60, X(dClamped)))}" y="${Math.max(16, Y(S.budget) - 8)}" font-size="10" font-weight="700" fill="var(--bad)" text-anchor="middle">Day ${dClamped} Overshoot</text>`;
        }
        paceAlert = `<div style="margin-top:8px;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--bad) 12%,transparent);color:var(--bad);font-size:13px"><b>⚠️ Overshoot Warning:</b> At current pace (<b>${f(dailyPace)}/day</b>), you will overshoot your ${f(S.budget)} budget by <b>${f(pj - S.budget)}</b> on <b>Day ${dClamped}</b>.</div>`;
      } else {
        paceAlert = `<div style="margin-top:8px;padding:8px 12px;border-radius:10px;background:color-mix(in srgb,var(--ok) 12%,transparent);color:var(--ok);font-size:13px"><b>✓ On Track:</b> Spending <b>${f(dailyPace)}/day</b> vs <b>${f(Math.round(S.budget / dn))}/day</b> budget pace — finishing <b>${f(S.budget - pj)} under budget</b>.</div>`;
      }
    } else {
      paceAlert = `<div class=m style="margin-top:6px;font-size:13px">${pj > S.budget ? 'Spent ' + f(pj - S.budget) + ' over budget' : 'Finished ' + f(S.budget - pj) + ' under budget'}</div>`;
    }
  }
  window._lastPaceAlert = paceAlert;

  const pace = S.budget ? `<svg viewBox="0 0 340 130" width=100% id=paceSvg role=img aria-label="Budget pace chart" style="touch-action:none;cursor:crosshair" onpointerdown="scrubPace(event)" onpointermove="if(event.buttons||event.pointerType==='touch')scrubPace(event)" onpointerup="unscrubPace()" onpointerleave="unscrubPace()"><line x1=10 y1=120 x2=330 y2=120 stroke="var(--line)"/><line x1="${X(1)}" y1="${Y(0)}" x2="${X(dn)}" y2="${Y(S.budget)}" stroke="var(--mut)" stroke-width=2 stroke-dasharray="5 4"/><polyline fill=none stroke="var(--pri)" stroke-width=3 stroke-linejoin=round points="${pt.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>${cur() ? `<line x1="${X(td)}" y1="${Y(cu)}" x2="${X(dn)}" y2="${Y(pj)}" stroke="${pj > S.budget ? 'var(--bad)' : 'var(--ok)'}" stroke-width=3 stroke-dasharray="3 4" stroke-linecap=round />` : ''}${overMarker}<line id=scrubLine x1=0 y1=10 x2=0 y2=120 stroke="var(--pri)" stroke-width=1.5 stroke-dasharray="2 2" style="display:none;pointer-events:none"/><circle id=scrubDot cx=0 cy=0 r=4.5 fill="var(--pri)" stroke="#fff" stroke-width=2 style="display:none;pointer-events:none"/></svg><div id=scrubTip style="min-height:36px">${paceAlert}</div>` : '<div class=m>Set a monthly budget in More to see your spending pace.</div>';

  const cg = {};
  M.filter(t => t.t == 'exp').forEach(t => cg[CATG[t.c] || t.c || 'Other'] = (cg[CATG[t.c] || t.c || 'Other'] || 0) + t.a);
  let cl = Object.entries(cg).sort((a, b) => b[1] - a[1]);
  if (cl.length > 5) cl = [...cl.slice(0, 5), ['Other', sum(cl.slice(5).map(x => ({ a: x[1] })))]];

  const live = V.y * 12 + V.m >= T.getFullYear() * 12 + T.getMonth();
  const CC = ccols(cl.map(x => x[0]));
  const BK = `<details style="margin-top:8px"><summary style="font-size:13px">Bank balances (${f(cash)})</summary>${S.acc.map(a => `<div class=r style="font-size:13px"><span><i class=dot style="background:${colr(a.id)}"></i>${e(a.n)}</span><b>${f(accBal(a))}</b></div>`).join('') || '<div style="font-size:13px">No accounts yet</div>'}</details>`;

  // 1. Safe Daily Spend calculation (Trustworthy)
  const safeDaily = getSafeDailySpend();

  // 2. Net Surplus & Split Bar calculation (Trustworthy)
  const key = ym(V.y, V.m);
  const plannedInc = sum(PL(key).filter(p => p.k == 'inc').map(p => ({ a: pamt(p) })));
  const totalExpectedInc = Math.max(inc, plannedInc || inc);
  const isSalaryPending = plannedInc > inc;

  const baseDenom = totalExpectedInc > 0 ? totalExpectedInc : (inc || 1);
  const pctSpent = Math.min(100, Math.round((ex / baseDenom) * 100));
  const pctInvested = Math.min(100, Math.round((iv / baseDenom) * 100));
  const projectedSurplus = totalExpectedInc - ex - iv;
  const pctSurplus = Math.max(0, 100 - pctSpent - pctInvested);

  const flowBar = `
  <div class=c style="padding:10px 14px">
    <div class=r style="padding:0;margin-bottom:6px">
      <span class=m style="font-size:12px">Monthly Cash Flow Allocation</span>
      <span style="font-size:12px;font-weight:700">Projected Surplus: <span class="${projectedSurplus >= 0 ? 'ok' : 'bad'}">${f(projectedSurplus)}</span></span>
    </div>
    <div style="height:12px;border-radius:6px;overflow:hidden;display:flex;background:var(--line);cursor:pointer">
      <div style="width:${pctSpent}%;background:#F59E0B" onclick="V.t='hist';V.hf='exp';render()" title="Spent: ${f(ex)} (${pctSpent}%)"></div>
      <div style="width:${pctInvested}%;background:#6366F1" onclick="V.t='plan';V.pt='inv';render()" title="Invested: ${f(iv)} (${pctInvested}%)"></div>
      <div style="width:${pctSurplus}%;background:#10B981" onclick="go('analytics')" title="Surplus: ${f(projectedSurplus)} (${pctSurplus}%)"></div>
    </div>
    <div class=r style="padding:5px 0 0;font-size:11px">
      <span class=m><i class=dot style="background:#F59E0B"></i>Spent ${V.priv ? '••%' : pctSpent + '%'}</span>
      <span class=m><i class=dot style="background:#6366F1"></i>Invested ${V.priv ? '••%' : pctInvested + '%'}</span>
      <span class=m><i class=dot style="background:#10B981"></i>Surplus ${V.priv ? '••%' : pctSurplus + '%'}</span>
    </div>
    ${isSalaryPending ? `<div style="font-size:11px;color:var(--mut);margin-top:6px;padding:4px 8px;border-radius:6px;background:var(--bg)">ℹ️ Based on ${f(totalExpectedInc)} expected monthly income (Salary pending arrival). Current received cashflow: <b>${f(inc - ex - iv)}</b></div>` : ''}
  </div>`;

  // Quick Add Shortcuts Row
  const quickPills = S.shortcuts && S.shortcuts.length ? `
  <div class="quick-pills">
    ${S.shortcuts.map(sc => `
      <button type=button class="quick-pill" onclick="txForm({t:'exp', a:${sc.a}, c:'${sc.c}', n:'${sc.n}', s:S.acc.length?S.acc[0].id:''})">
        + ${sc.n} <b>${f(sc.a)}</b>
      </button>
    `).join('')}
  </div>` : '';

  // 14-day Backup Reminder
  const backupBanner = checkBackupReminder() ? `
  <div class=c style="background:rgba(245,158,11,0.12);border:1px solid var(--warn);padding:10px 14px">
    <div class=r style="padding:0">
      <div><b>💾 Backup Reminder</b><div class=m style="font-size:12px">Last backup was over 2 weeks ago. Protect your records.</div></div>
      <button class=pri style="min-height:34px;padding:0 12px;font-size:12px" onclick="bk()">Backup Now</button>
    </div>
  </div>` : '';

  // Sinking funds
  const totGTarget = sum(S.goals || [], 'target'), totGSaved = sum(S.goals || [], 'saved');
  const goalWidget = (S.goals && S.goals.length) ? `
  <div class=c onclick="V.t='plan';V.pt='goals';render()" style="cursor:pointer">
    <div class=r style="padding:0;margin-bottom:6px"><h3 style="margin:0">Sinking Funds & Goals</h3><span class=ok style="font-size:12px;font-weight:700">${totGTarget ? Math.round(totGSaved / totGTarget * 100) : 0}% saved</span></div>
    ${bar(totGTarget ? (totGSaved / totGTarget * 100) : 0, 'var(--ok)')}
    <div class=r style="margin-top:6px;padding:0;font-size:12px"><span class=m>Saved: <b>${f(totGSaved)}</b></span><span class=m>Target: <b>${f(totGTarget)}</b></span></div>
  </div>` : '';

  // Collapsed What-If Simulator & Financial Health (Keeps Home screen clean & short)
  const whatifCard = `
  <div class=c>
    <details>
      <summary style="font-weight:700;font-size:14px;cursor:pointer">🔮 What-If Scenario Sandbox</summary>
      <div style="margin-top:10px">
        <div class=m style="font-size:12px;margin-bottom:8px">Simulate adjusting monthly SIP investments or trimming discretionary spending:</div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type=range min="-15000" max="25000" step="1000" value="${V.sim || 0}" oninput="V.sim=+this.value;$('#simVal').textContent=(V.sim>=0?'+':'')+f(V.sim)+'/mo';$('#simVal').style.color=(V.sim>=0?'var(--pri)':'var(--warn)');$('#simRes').innerHTML=simCalc(V.sim,${F.end},${inc},${ex},${iv},${dn},${td})" style="flex:1;accent-color:var(--pri)">
          <b id=simVal style="min-width:85px;text-align:right;font-size:13px;color:${(V.sim || 0) >= 0 ? 'var(--pri)' : 'var(--warn)'}">${(V.sim || 0) >= 0 ? '+' : ''}${f(V.sim || 0)}/mo</b>
        </div>
        <div id=simRes style="margin-top:8px;padding:10px;border-radius:10px;background:var(--bg);font-size:13px">${simCalc(V.sim || 0, F.end, inc, ex, iv, dn, td)}</div>
      </div>
    </details>
  </div>`;

  const healthScorecard = `
  <div class=c>
    <details>
      <summary style="font-weight:700;font-size:14px;cursor:pointer">🩺 Financial Health Scorecard (${V.priv ? '••' : sc}/100)</summary>
      <div style="margin-top:10px">
        <div style="display:flex;gap:14px;align-items:center">
          ${ring(sc / 100, sc >= 80 ? 'var(--ok)' : sc >= 60 ? '#2563EB' : sc >= 45 ? 'var(--warn)' : 'var(--bad)', 64, V.priv ? '••' : sc)}
          <div style="flex:1">
            <div class=m style="font-size:12px">Savings rate ${V.priv ? '••%' : Math.round(rate * 100) + '%'} · Runway ${V.priv ? '•.• mo' : run.toFixed(1) + ' mo'} · Card use ${V.priv ? '••%' : Math.round(util * 100) + '%'}</div>
          </div>
        </div>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px;font-size:12px">
          <div><div class=r style="padding:0;margin-bottom:2px"><span>Savings Rate</span><b>${Math.round(rate * 100)}%</b></div>${bar(rate * 100, 'var(--ok)')}</div>
          <div><div class=r style="padding:0;margin-bottom:2px"><span>Emergency Runway</span><b>${run.toFixed(1)} mo</b></div>${bar((run / 6) * 100, 'var(--warn)')}</div>
          <div><div class=r style="padding:0;margin-bottom:2px"><span>Card Utilization</span><b>${Math.round(util * 100)}%</b></div>${bar(util * 100, 'var(--pri)')}</div>
        </div>
      </div>
    </details>
  </div>`;

  return `
  ${backupBanner}
  ${quickPills}
  <div class=hero>
    ${live ? `
      <div style="font-size:13px;opacity:.9">Expected balance at month end</div>
      <div class="big" style="font-size:32px;font-weight:700">${f(F.end)}</div>
      <div style="font-size:13px;opacity:.9">${cur() ? 'Cash today ' + f(cash) + ' · Card liability ' + f(debt) + ' · Net worth ' + f(cash - debt) : 'Carried over: ' + f(F.cash)}</div>
      <div style="font-size:12px;opacity:.92;margin-top:5px;">${safeDaily.label}</div>
      <details style="margin-top:10px">
        <summary style="font-size:13px">How this adds up</summary>
        ${[[cur() ? 'Cash today' : 'Carried over', F.cash], ['+ Expected income', F.pi], ['- Planned payments', F.pp], ['- Planned investments', F.pv], ['- Card bills due', F.cp], ['- Total card liability', debt], ...(S.est ? [['- Everyday spending (estimate)', F.es]] : [])].map(([l, v]) => `<div class=r style="font-size:13px"><span>${l}</span><b>${f(v)}</b></div>`).join('')}
      </details>
    ` : `
      <div style="font-size:13px;opacity:.9">Left after spending and investing</div>
      <div style="font-size:32px;font-weight:700">${f(inc - ex - iv)}</div>
      <div style="font-size:13px;opacity:.9">Income ${f(inc)} · Spent ${f(ex)} · Liabilities ${f(debt)}</div>
    `}
    ${BK}
  </div>

  <div class=tiles>
    <div class=tile style="background:rgba(20,184,166,.16)"><span class=m>Income</span><b>${f(inc)}</b></div>
    <div class=tile style="background:rgba(245,158,11,.18)"><span class=m>Spent</span><b>${f(ex)}</b></div>
    <div class=tile style="background:rgba(99,102,241,.18)"><span class=m>Invested</span><b>${f(iv)}</b></div>
  </div>

  ${flowBar}

  <div class=c onclick="go('cards')">
    <h3>Credit card bills</h3>
    <div class=g>
      <div><div class=big>${f(sum(bl, 'pay'))}</div><div class=m>payable this month</div></div>
      <div><div class=big>${f(sum(bl, 'carry'))}</div><div class=m>carries to next month</div></div>
    </div>
    <div class=r style="margin-top:8px;padding:0;font-size:12px"><span class=m>Total Credit Liability:</span><b>${f(debt)}</b></div>
  </div>

  ${goalWidget}

  <div class=c>
    <h3>Where the money went</h3>
    ${cl.length ? (TH.s == 'bars' ? cl.map(([k, v]) => `<div class=r style="padding:3px 0;font-size:13px"><span><i class=dot style="background:${CC[k]}"></i>${e(k)}</span><b>${f(v)} · ${Math.round(v / ex * 100)}%</b></div>${bar(v / ex * 100, CC[k])}`).join('') : `<div style="display:flex;gap:12px;align-items:center">${donut(cl, ex || 1, CC)}<div style="flex:1">${cl.map(([k, v]) => `<div class=r style="padding:3px 0;font-size:13px"><span><i class=dot style="background:${CC[k]}"></i>${e(k)}</span><b>${Math.round(v / ex * 100)}%</b></div>`).join('')}</div></div>`) : '<div class=m>No expenses yet.</div>'}
  </div>

  <div class=c><h3>Budget pace</h3>${pace}</div>
  ${whatifCard}
  ${healthScorecard}
  `;
}

// 2. CARDS TAB (Apple Wallet Skeuomorphic & Solid Nav)
function cards() {
  const bf = S.cards.map(c => [c, free(c)]), best = [...bf].sort((a, b) => b[1] - a[1])[0], bl = S.cards.map(c => bill(c, V.y, V.m));
  const totLim = sum(S.cards, 'limit'), totOut = S.cards.reduce((s, c) => s + cardOut(c), 0), totAvail = Math.max(0, totLim - totOut), totUtil = totLim ? Math.round(totOut / totLim * 100) : 0, utilK = totUtil < 30 ? 'ok' : totUtil < 50 ? 'wn' : 'bad';

  return `
  <div class=c>
    <h3>${mo()} card bills</h3>
    <div class=g>
      <div><div class=m>Pay this month</div><div class=big>${f(sum(bl, 'pay'))}</div></div>
      <div><div class=m>Carries to next month</div><div class=big>${f(sum(bl, 'carry'))}</div></div>
    </div>
  </div>

  <div class=c style="padding:12px 14px">
    <div class=r style="padding:0;margin-bottom:6px"><b>Credit Line Health</b><span class="${utilK}" style="font-size:12px;font-weight:700">${totUtil}% total utilization</span></div>
    ${bar(totUtil, `var(--${utilK == 'bad' ? 'bad' : utilK == 'wn' ? 'warn' : 'ok'})`)}
    <div class=r style="margin-top:8px;font-size:12px;padding:0"><span>Used: <b>${f(totOut)}</b></span><span>Avail: <b class=ok>${f(totAvail)}</b></span><span>Limit: <b>${f(totLim)}</b></span></div>
  </div>

  ${best && bf.length > 1 ? `<div class=c style="background:#E8E7FF;color:#1B1F3B"><b>Best card today: ${e(best[0].n)}</b><div style="font-size:13px">${best[1]} interest-free days on a purchase made today.</div></div>` : ''}

  ${S.cards.map((c, i) => {
    const b = bl[i], LS = lsb(c), o = cardOut(c), u = c.limit ? o / c.limit * 100 : 0, k = u < 30 ? 'ok' : u < 50 ? 'wn' : 'bad';
    const dueDays = Math.round((new Date(b.dueD + 'T00:00') - new Date(iso(T) + 'T00:00')) / 864e5);
    const dueBadge = (b.pay <= 0 && b.billed > 0) ? '<span class="badge-countdown" style="background:color-mix(in srgb,var(--ok) 18%,transparent);color:var(--ok)">✓ Paid in full</span>' : (b.pay <= 0) ? '<span class="badge-countdown" style="background:color-mix(in srgb,var(--ok) 18%,transparent);color:var(--ok)">Nothing due</span>' : (dueDays === 0) ? '<span class="badge-countdown" style="background:color-mix(in srgb,var(--bad) 20%,transparent);color:var(--bad)">⚠️ Due Today</span>' : (dueDays < 0) ? `<span class="badge-countdown" style="background:color-mix(in srgb,var(--bad) 20%,transparent);color:var(--bad)">🚨 Overdue by ${Math.abs(dueDays)}d</span>` : (dueDays <= 5) ? `<span class="badge-countdown" style="background:color-mix(in srgb,var(--warn) 20%,transparent);color:var(--warn)">⏳ Due in ${dueDays}d</span>` : `<span class="badge-countdown" style="background:color-mix(in srgb,var(--mut) 15%,transparent);color:var(--mut)">Due in ${dueDays}d</span>`;
    const maskedNum = ((c.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 9000) + 1000);

    return `
    <div class=c>
      <div class=cc style="background:linear-gradient(135deg,${colr(c.id)} 0%,color-mix(in srgb,${colr(c.id)} 60%,#000) 100%);position:relative;overflow:hidden;aspect-ratio:1.586/1;min-height:185px;display:flex;flex-direction:column;justify-content:space-between;padding:16px 18px;border-radius:18px;box-shadow:0 12px 28px -4px rgba(0,0,0,0.24),inset 0 1px 1px rgba(255,255,255,0.35);margin:0 0 12px">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 85% 15%,rgba(255,255,255,0.28) 0%,transparent 60%);pointer-events:none"></div>
        <div class=r style="padding:0;position:relative;z-index:2">
          <div style="display:flex;align-items:center;gap:8px">
            <b style="font-size:16px;letter-spacing:0.5px">${e(c.n)}</b>
            <svg width=16 height=16 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.85"><path d="M5 8.5a7 7 0 0 1 0 7"/><path d="M8.5 6a10.5 10.5 0 0 1 0 12"/><path d="M12 3.5a14 14 0 0 1 0 17"/></svg>
          </div>
          <button class=gb onclick="cardForm(S.cards.find(x=>x.id=='${c.id}'))" style="min-height:30px;padding:0 10px;font-size:12px;border-radius:8px">Edit</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;margin:4px 0">
          <svg width=38 height=28 viewBox="0 0 40 30" style="border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,0.3)"><rect width=40 height=30 rx=4 fill="#E5C158" stroke="#B89736" stroke-width=1/><rect x=3 y=3 width=34 height=24 rx=2 fill="none" stroke="#997C22" stroke-width=0.8 stroke-dasharray="6 3"/><line x1=3 y1=15 x2=37 y2=15 stroke="#997C22" stroke-width=0.8/><line x1=15 y1=3 x2=15 y2=27 stroke="#997C22" stroke-width=0.8/><line x1=25 y1=3 x2=25 y2=27 stroke="#997C22" stroke-width=0.8/></svg>
          <div style="display:flex;align-items:center"><div style="width:20px;height:20px;border-radius:50%;background:#EB001B;opacity:0.9"></div><div style="width:20px;height:20px;border-radius:50%;background:#F79E1B;opacity:0.9;margin-left:-8px"></div></div>
        </div>
        <div style="position:relative;z-index:2">
          <div style="font-family:monospace;letter-spacing:2px;font-size:13px;opacity:0.9;margin-bottom:6px">•••• •••• •••• ${maskedNum}</div>
          <div class=r style="padding:0;align-items:flex-end">
            <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Current Balance</div><div class=big style="font-size:20px;line-height:1.2">${f(o)}</div></div>
            <div style="text-align:right"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Credit Limit</div><div style="font-size:13px;font-weight:700">${f(c.limit)}</div></div>
          </div>
        </div>
      </div>

      <div class=r><span class=m>Utilization</span><b class=${k}>${Math.round(u)}%</b></div>
      ${bar(u, `var(--${k == 'bad' ? 'bad' : k == 'wn' ? 'warn' : 'ok'})`)}
      <div class=m style="margin:6px 0 8px">Last statement ${LS.ls.slice(5)}: ${f(LS.bi)} billed · ${f(LS.un)} spent since</div>
      <div class=r><span>Statement ${b.open ? 'closes' : 'closed'} ${b.st.slice(5)}</span><b>${f(b.billed)}</b></div>
      <div class=r><span>Paid</span><b>${f(b.paid)}</b></div>
      <div class=r><span>Payable by ${b.dueD.slice(5)} &nbsp;${dueBadge}</span><b class="${b.pay ? 'wn' : 'ok'}">${f(b.pay)}</b></div>
      <div class=r><span>Carries to next month</span><b>${f(b.carry)}</b></div>

      ${b.pay > 0 ? `
        <button class=pri style="width:100%" onclick="payCard('${c.id}')">Pay ${f(b.pay)}${c.pa ? ' from ' + e(src(c.pa)) : ''}</button>
        <div style="margin-top:6px;font-size:11px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--warn) 12%,transparent);color:var(--ink)">
          <b>💡 Optimizer Tip:</b> Pay total statement due (<b>${f(b.pay)}</b>) before ${b.dueD.slice(5)} to avoid 3.5%/mo finance charges.
        </div>
      ` : `<div class=ok><b>${b.billed ? 'Paid in full' : 'Nothing due this month'}</b></div>`}
      
      <div class=row>
        <button onclick="txForm({t:'pay',s:'${c.pa || ''}',cd:'${c.id}'})">Other amount</button>
        <button onclick="stmtForm('${c.id}')">Statement amounts</button>
      </div>
    </div>`;
  }).join('')}
  <button style="width:100%" onclick="cardForm()">+ Add credit card</button>
  `;
}

// 3. ANALYTICS TAB (MoM Intelligence & Empty Month Handling)
function analytics() {
  let py = V.y, pm = V.m - 1;
  if (pm < 0) { pm = 11; py--; }
  const cKey = ym(V.y, V.m), pKey = ym(py, pm);
  const cMonthName = new Date(V.y, V.m).toLocaleString('en-IN', { month: 'short' });
  const pMonthName = new Date(py, pm).toLocaleString('en-IN', { month: 'short' });

  const dn_c = new Date(V.y, V.m + 1, 0).getDate();
  const dn_p = new Date(py, pm + 1, 0).getDate();
  const isCur = cur();
  const d_eval = isCur ? Math.min(T.getDate(), dn_c) : dn_c;

  const txC = S.tx.filter(t => t.d.slice(0, 7) == cKey && !t.adj);
  const txP = S.tx.filter(t => t.d.slice(0, 7) == pKey && !t.adj);

  const expC = txC.filter(t => t.t == 'exp');
  const expP = txP.filter(t => t.t == 'exp');
  const totExpC = sum(expC);
  const totExpP = sum(expP);

  const hasPriorData = txP.length > 0 && totExpP > 0;

  // Cumulative daily spend
  let cCum = 0; const ptC = [];
  for (let d = 1; d <= dn_c; d++) {
    const dayAmt = sum(expC.filter(t => +t.d.slice(8) == d));
    if (d <= d_eval) {
      cCum += dayAmt;
      ptC.push([d, cCum]);
    }
  }

  let pCum = 0; const ptP = [];
  if (hasPriorData) {
    for (let d = 1; d <= dn_p; d++) {
      const dayAmt = sum(expP.filter(t => +t.d.slice(8) == d));
      pCum += dayAmt;
      ptP.push([d, pCum]);
    }
  }

  const cumAtEvalC = ptC.length ? ptC[ptC.length - 1][1] : 0;
  const cumAtEvalP = hasPriorData && ptP.find(p => p[0] == Math.min(d_eval, dn_p)) ? ptP.find(p => p[0] == Math.min(d_eval, dn_p))[1] : pCum;

  const diffAtEval = hasPriorData ? cumAtEvalC - cumAtEvalP : 0;
  const diffPctAtEval = hasPriorData && cumAtEvalP > 0 ? (diffAtEval / cumAtEvalP) * 100 : 0;
  const projC = isCur && d_eval > 0 ? (cumAtEvalC / d_eval) * dn_c : totExpC;

  const mxVal = Math.max(cumAtEvalC, pCum, projC, S.budget || 0, 1000);
  MoMScrub = {
    cPts: ptC, pPts: ptP, maxVal: mxVal,
    cMonth: cMonthName, pMonth: pMonthName,
    dEval: d_eval, dnC: dn_c, dnP: dn_p
  };

  const X = d => 16 + ((d - 1) / 30) * 308;
  const Y = v => 140 - (v / mxVal) * 122;

  const pathP = ptP.length ? ptP.map((p, i) => (i == 0 ? `M${X(p[0])},${Y(p[1])}` : `L${X(p[0])},${Y(p[1])}`)).join(' ') : '';
  const pathC = ptC.length ? ptC.map((p, i) => (i == 0 ? `M${X(p[0])},${Y(p[1])}` : `L${X(p[0])},${Y(p[1])}`)).join(' ') : '';
  const areaC = ptC.length ? `${pathC} L${X(d_eval)},140 L${X(1)},140 Z` : '';

  const defTipText = hasPriorData ? (
    `<span><b>Day ${d_eval}:</b> ${cMonthName}: <b>${f(cumAtEvalC)}</b> · ${pMonthName}: <b>${f(cumAtEvalP)}</b></span>` +
    (diffAtEval <= 0 ? `<b style="color:var(--ok)">-${f(Math.abs(diffAtEval))} (${V.priv ? '••%' : Math.abs(Math.round(diffPctAtEval)) + '% lower'})</b>` :
                       `<b style="color:var(--bad)">+${f(diffAtEval)} (${V.priv ? '••%' : '+' + Math.round(diffPctAtEval) + '% higher'})</b>`)
  ) : `<span><b>Day ${d_eval}:</b> ${cMonthName}: <b>${f(cumAtEvalC)}</b> (First month tracked)</span>`;

  // Category variance matrix
  const catC = {}, catP = {};
  expC.forEach(t => { const k = t.c || 'Miscellaneous'; catC[k] = (catC[k] || 0) + t.a; });
  expP.forEach(t => { const k = t.c || 'Miscellaneous'; catP[k] = (catP[k] || 0) + t.a; });
  const allCats = Array.from(new Set([...Object.keys(catC), ...Object.keys(catP)]));
  const maxCatSpend = Math.max(1, ...allCats.map(c => Math.max(catC[c] || 0, catP[c] || 0)));

  const catRows = allCats.map(c => {
    const vC = catC[c] || 0, vP = catP[c] || 0, diff = vC - vP;
    const pct = vP > 0 ? (diff / vP) * 100 : (vC > 0 ? 100 : 0);
    return { c, vC, vP, diff, pct };
  }).sort((a, b) => b.vC - a.vC || Math.abs(b.diff) - Math.abs(a.diff));

  // 6-Month Cashflow
  const sixMo = [];
  for (let i = 5; i >= 0; i--) {
    let my = V.y, mm = V.m - i;
    while (mm < 0) { mm += 12; my--; }
    while (mm > 11) { mm -= 12; my++; }
    const k = ym(my, mm);
    const label = new Date(my, mm).toLocaleString('en-IN', { month: 'short' });
    const txs = S.tx.filter(t => t.d.slice(0, 7) == k && !t.adj);
    const incM = sum(txs.filter(t => t.t == 'inc'));
    const expM = sum(txs.filter(t => t.t == 'exp'));
    const invM = sum(txs.filter(t => t.t == 'inv'));
    sixMo.push({ k, label, inc: incM, exp: expM, inv: invM, isCurrent: i == 0 });
  }
  const maxSix = Math.max(1, ...sixMo.map(m => Math.max(m.inc, m.exp, m.inv)));

  // Payment methods
  const payMethods = {};
  expC.forEach(t => { payMethods[t.s] = (payMethods[t.s] || 0) + t.a; });
  const payRows = Object.entries(payMethods).sort((a, b) => b[1] - a[1]);

  // Top Payees
  const merchMap = {};
  expC.forEach(t => {
    const name = (t.n || t.c || 'Miscellaneous').trim();
    merchMap[name] = (merchMap[name] || 0) + t.a;
  });
  const topMerchants = Object.entries(merchMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return `
  <div class=c style="background:linear-gradient(135deg,color-mix(in srgb,var(--pri) 12%,var(--card)),var(--card));border:1px solid color-mix(in srgb,var(--pri) 25%,var(--line))">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span class=m style="font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Month-on-Month Executive Pulse</span>
      <span style="font-size:12px;color:var(--pri);font-weight:700">${cMonthName} vs ${pMonthName}</span>
    </div>
    <div class=g style="gap:10px">
      <div>
        <div class=m>Spend (up to Day ${d_eval})</div>
        <div class=big>${f(cumAtEvalC)}</div>
        <div class=m style="font-size:12px;margin-top:2px">
          ${hasPriorData ? `${pMonthName}: ${f(cumAtEvalP)} · ${diffAtEval <= 0 ? `<span class=ok style="font-weight:700">-${f(Math.abs(diffAtEval))} (${V.priv ? '••%' : Math.abs(Math.round(diffPctAtEval)) + '% ↓'})</span>` : `<span class=bad style="font-weight:700">+${f(diffAtEval)} (${V.priv ? '••%' : '+' + Math.round(diffPctAtEval) + '% ↑'})</span>`}` : `<span class=m>No ${pMonthName} data to compare</span>`}
        </div>
      </div>
      <div>
        <div class=m>Daily Burn Rate</div>
        <div class=big>${f(d_eval ? cumAtEvalC / d_eval : 0)}<span style="font-size:12px;font-weight:400;color:var(--mut)">/day</span></div>
        <div class=m style="font-size:12px;margin-top:2px">${hasPriorData ? `${pMonthName} avg: ${f(dn_p ? totExpP / dn_p : 0)}/day` : 'First month tracked'}</div>
      </div>
    </div>
    <div class=r style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:13px">
      <span>Full month projection</span>
      <b>${f(projC)} ${hasPriorData ? `<span style="font-size:11px;font-weight:400;color:var(--mut)">(vs ${f(totExpP)} in ${pMonthName})</span>` : ''}</b>
    </div>
  </div>

  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h3 style="margin:0">Cumulative Spend Pace</h3>
      <div style="display:flex;gap:10px;font-size:11px;font-weight:600">
        <span style="display:inline-flex;align-items:center;gap:4px;color:var(--pri)"><i style="width:10px;height:3px;background:var(--pri);border-radius:2px"></i> ${cMonthName}</span>
        ${hasPriorData ? `<span style="display:inline-flex;align-items:center;gap:4px;color:var(--mut)"><i style="width:10px;height:2px;background:var(--mut);border-top:1px dashed var(--mut)"></i> ${pMonthName}</span>` : ''}
      </div>
    </div>
    <div class=m style="font-size:12px;margin-bottom:8px">Track daily burn speed. Drag or tap along the chart to inspect any day.</div>

    <div style="position:relative;width:100%" id="momChartWrap">
      <svg id="momPaceSvg" viewBox="0 0 340 160" width="100%" style="overflow:visible;touch-action:none;cursor:crosshair"
           onmousemove="scrubMoM(event)" onmouseleave="unscrubMoM()"
           ontouchstart="scrubMoM(event)" ontouchmove="scrubMoM(event)" ontouchend="unscrubMoM()">
        <defs>
          <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--pri)" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="var(--pri)" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="16" y1="18" x2="324" y2="18" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="16" y1="79" x2="324" y2="79" stroke="var(--line)" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="16" y1="140" x2="324" y2="140" stroke="var(--line)" stroke-width="1.5"/>
        <text x="328" y="21" font-size="8.5" fill="var(--mut)" text-anchor="start">${f(mxVal)}</text>
        <text x="328" y="82" font-size="8.5" fill="var(--mut)" text-anchor="start">${f(mxVal / 2)}</text>

        ${pathP ? `<path d="${pathP}" fill="none" stroke="var(--mut)" stroke-width="2" stroke-dasharray="4 4" opacity="0.7"/>` : ''}
        ${areaC ? `<path d="${areaC}" fill="url(#cGrad)"/>` : ''}
        ${pathC ? `<path d="${pathC}" fill="none" stroke="var(--pri)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${isCur && d_eval < dn_c ? `<line x1="${X(d_eval)}" y1="${Y(cumAtEvalC)}" x2="${X(dn_c)}" y2="${Y(projC)}" stroke="var(--warn)" stroke-width="2.5" stroke-dasharray="3 4"/>` : ''}
        ${ptC.length ? `<circle cx="${X(d_eval)}" cy="${Y(cumAtEvalC)}" r="5" fill="var(--pri)" stroke="var(--card)" stroke-width="2.5"/>` : ''}

        <line id="momScrubCursor" x1="0" y1="16" x2="0" y2="140" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="2 2" style="display:none;pointer-events:none"/>
        <circle id="momScrubDotP" cx="0" cy="0" r="4.5" fill="var(--mut)" stroke="var(--card)" stroke-width="2" style="display:none;pointer-events:none"/>
        <circle id="momScrubDotC" cx="0" cy="0" r="5" fill="var(--pri)" stroke="var(--card)" stroke-width="2" style="display:none;pointer-events:none"/>

        <text x="${X(1)}" y="154" font-size="9" fill="var(--mut)" text-anchor="start">Day 1</text>
        <text x="${X(10)}" y="154" font-size="9" fill="var(--mut)" text-anchor="middle">10</text>
        <text x="${X(20)}" y="154" font-size="9" fill="var(--mut)" text-anchor="middle">20</text>
        <text x="${X(31)}" y="154" font-size="9" fill="var(--mut)" text-anchor="end">Day 31</text>
      </svg>
    </div>

    <div id="momScrubTip" data-def="${e(defTipText)}" style="margin-top:6px;padding:8px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line);font-size:12px;display:flex;justify-content:space-between;align-items:center;min-height:36px">
      ${defTipText}
    </div>
  </div>

  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">Category Shift & Variance</h3>
      <span class=m style="font-size:12px">${hasPriorData ? `${cMonthName} vs ${pMonthName}` : 'Current Month Breakdown'}</span>
    </div>
    ${catRows.length ? catRows.map(r => {
      const badge = getMerchantBadge('', r.c, 'exp');
      const barC = (r.vC / maxCatSpend) * 100;
      const barP = (r.vP / maxCatSpend) * 100;
      return `
      <div style="padding:8px 0;border-bottom:1px solid var(--line)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:30px;height:30px;border-radius:8px;background:color-mix(in srgb,${badge.bg} 18%,transparent);color:${badge.bg};display:flex;align-items:center;justify-content:center;font-size:14px;flex:none">${badge.icon}</span>
            <div>
              <b style="font-size:13px">${e(r.c)}</b>
              <div class=m style="font-size:11px">${hasPriorData ? `${pMonthName}: ${f(r.vP)} → ${cMonthName}: ${f(r.vC)}` : f(r.vC)}</div>
            </div>
          </div>
          <div style="text-align:right">
            <b style="font-size:14px">${f(r.vC)}</b>
            <div>
              ${!hasPriorData ? `<span class="badge-countdown" style="background:var(--line);color:var(--mut)">Current</span>` :
                r.vP === 0 ? `<span class="badge-countdown" style="background:rgba(79,70,229,.14);color:var(--pri)">New</span>` :
                r.vC === 0 ? `<span class="badge-countdown" style="background:rgba(15,118,110,.14);color:var(--ok)">-100% (Zero)</span>` :
                r.diff <= 0 ? `<span class="badge-countdown" style="background:rgba(15,118,110,.14);color:var(--ok)">-${f(Math.abs(r.diff))} (${V.priv ? '••%' : Math.abs(Math.round(r.pct)) + '% ↓'})</span>` :
                              `<span class="badge-countdown" style="background:rgba(185,28,28,.14);color:var(--bad)">+${f(r.diff)} (${V.priv ? '••%' : '+' + Math.round(r.pct) + '% ↑'})</span>`}
            </div>
          </div>
        </div>
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:3px">
          <div style="height:5px;border-radius:3px;background:var(--line);overflow:hidden"><div style="height:100%;width:${barC}%;background:var(--pri);border-radius:3px"></div></div>
          ${hasPriorData && r.vP > 0 ? `<div style="height:3px;border-radius:2px;background:var(--line);overflow:hidden;opacity:0.6"><div style="height:100%;width:${barP}%;background:var(--mut);border-radius:2px"></div></div>` : ''}
        </div>
      </div>`;
    }).join('') : '<div class=m>No expenses recorded.</div>'}
  </div>

  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h3 style="margin:0">6-Month Cashflow & Velocity</h3>
      <div style="display:flex;gap:8px;font-size:11px;font-weight:600">
        <span style="color:var(--ok)">■ In</span>
        <span style="color:var(--bad)">■ Out</span>
        <span style="color:var(--pri)">■ Invest</span>
      </div>
    </div>
    <div style="width:100%;overflow-x:auto">
      <svg viewBox="0 0 340 120" width="100%" style="overflow:visible">
        <line x1="10" y1="100" x2="330" y2="100" stroke="var(--line)" stroke-width="1.5"/>
        ${sixMo.map((m, i) => {
          const xCenter = 25 + i * 54;
          const bW = 12;
          const hInc = (m.inc / maxSix) * 85;
          const hExp = (m.exp / maxSix) * 85;
          const hInv = (m.inv / maxSix) * 85;
          return `
            <g>
              ${m.isCurrent ? `<rect x="${xCenter - 22}" y="6" width="44" height="106" rx="8" fill="color-mix(in srgb,var(--pri) 8%,transparent)" stroke="color-mix(in srgb,var(--pri) 25%,transparent)"/>` : ''}
              <rect x="${xCenter - 19}" y="${100 - hInc}" width="${bW}" height="${hInc}" rx="2" fill="var(--ok)"/>
              <rect x="${xCenter - 6}" y="${100 - hExp}" width="${bW}" height="${hExp}" rx="2" fill="var(--bad)"/>
              <rect x="${xCenter + 7}" y="${100 - hInv}" width="${bW}" height="${hInv}" rx="2" fill="var(--pri)"/>
              <text x="${xCenter}" y="114" font-size="10" font-weight="${m.isCurrent ? '700' : '500'}" fill="${m.isCurrent ? 'var(--pri)' : 'var(--ink)'}" text-anchor="middle">${m.label}</text>
            </g>
          `;
        }).join('')}
      </svg>
    </div>
  </div>

  <div class=g>
    <div class=c>
      <h3 style="margin-bottom:6px">Card & Account Spend</h3>
      ${payRows.length ? payRows.map(([sId, amt]) => {
        const pctOfTotal = totExpC > 0 ? Math.round((amt / totExpC) * 100) : 0;
        return `<div class=r style="padding:4px 0;font-size:12px"><span>${chip(sId)}</span><b>${f(amt)} <span class=m>(${V.priv ? '••%' : pctOfTotal + '%'})</span></b></div>`;
      }).join('') : '<div class=m>No expenses recorded.</div>'}
    </div>

    <div class=c>
      <h3 style="margin-bottom:6px">Top 5 Spending Destinations</h3>
      ${topMerchants.length ? topMerchants.map(([name, amt]) => {
        const pctOfTotal = totExpC > 0 ? Math.round((amt / totExpC) * 100) : 0;
        return `<div class=r style="padding:4px 0;font-size:12px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px"><b>${e(name)}</b></span><b>${f(amt)} <span class=m>(${V.priv ? '••%' : pctOfTotal + '%'})</span></b></div>`;
      }).join('') : '<div class=m>No expenses recorded.</div>'}
    </div>
  </div>
  `;
}

// 4. PLAN & CALENDAR TAB
const KS = {
  cal: ['Calendar', 'var(--pri)', 'event'],
  exp: ['Payments', 'var(--warn)', 'payment'],
  inv: ['Investments', 'var(--pri)', 'investment'],
  inc: ['Income', 'var(--ok)', 'income'],
  goals: ['Goals', 'var(--ok)', 'goal']
};
const EC = { exp: 'var(--warn)', inv: 'var(--pri)', inc: 'var(--ok)', due: '#DB2777', stmt: 'var(--mut)' };
const EL = { exp: 'Payment', inv: 'Investment', inc: 'Income', due: 'Card bill due', stmt: 'Statement date' };

function cal() {
  const P = cpal(), EColor = { exp: P[0], inv: P[4], inc: P[3], due: P[1], stmt: P[8] };
  const y = V.y, m = V.m, dn = new Date(y, m + 1, 0).getDate(), k = ym(y, m), fd = new Date(y, m, 1).getDay(), td = cur() ? T.getDate() : 0, sd = V.cd && V.cd <= dn ? V.cd : (td || 1), E = [], dd = x => +x.slice(8);
  PL(k).forEach(p => E.push({ d: dd(dt(y, m, p.day)), k: p.k, n: p.n, a: pamt(p), id: p.id, done: !!S.paid[p.id + '|' + k] }));
  S.cards.forEach(c => {
    const b = bill(c, y, m);
    E.push({ d: dd(dt(y, m, c.bill)), k: 'stmt', n: c.n, a: 0 });
    if (b.billed) E.push({ d: dd(b.dueD), k: 'due', n: c.n + ' bill', a: b.pay || b.billed, done: b.pay == 0, cid: c.id });
  });
  const M = mt().filter(t => !t.adj), sp = {};
  M.filter(t => t.t == 'exp').forEach(t => sp[dd(t.d)] = (sp[dd(t.d)] || 0) + t.a);
  const mx = Math.max(1, ...Object.values(sp));
  const grid = [...Array(fd).fill(0), ...Array.from({ length: dn }, (_, i) => i + 1)].map(d => {
    if (!d) return '<span></span>';
    const h = sp[d] ? (0.12 + 0.5 * sp[d] / mx) : 0;
    return `<button class=day style="background:${sp[d] ? `color-mix(in srgb,var(--pri) ${Math.round(h * 100)}%,transparent)` : 'var(--card)'};${d == sd ? 'border-color:var(--pri);' : ''}${d == td ? 'font-weight:700;box-shadow:inset 0 -3px 0 var(--pri);' : ''}" onclick="V.cd=${d};render()" aria-label="Day ${d}">${d}<span class=dots>${E.filter(x => x.d == d).slice(0, 4).map(x => `<i style="background:${EColor[x.k]};opacity:${x.done ? 0.35 : 1}"></i>`).join('')}</span></button>`;
  }).join('');

  const ev = E.filter(x => x.d == sd), pids = Object.values(S.paid), en = M.filter(t => dd(t.d) == sd && !pids.includes(t.id));
  const up = td ? E.filter(x => x.d >= td && !x.done && x.k != 'stmt').sort((a, b) => a.d - b.d).slice(0, 5) : [];

  return `
  <div class=c>
    <div class=cal>${'SMTWTFS'.split('').map(x => `<span class=m style="text-align:center">${x}</span>`).join('')}${grid}</div>
    <div class=m style="display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:10px">${Object.keys(EL).map(x => `<span><i class=dot style="background:${EColor[x]}"></i>${EL[x]}</span>`).join('')}</div>
  </div>
  <div class=c>
    <h3>${new Date(y, m, sd).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
    ${ev.map(x => `<div class=r><div><i class=dot style="background:${EColor[x.k]}"></i><b>${e(x.n)}</b><div class=m style="margin-left:18px">${EL[x.k]}${x.k == 'stmt' ? '' : x.done ? ' · done' : ' · pending'}</div></div><div style="text-align:right">${x.a ? f(x.a) : ''}${x.id && !x.done ? `<button style="margin-left:8px;min-height:32px" onclick="tg('${x.id}')">Mark</button>` : ''}${x.cid && !x.done ? `<button class=pri style="margin-left:8px;min-height:32px" onclick="payCard('${x.cid}')">Pay</button>` : ''}</div></div>`).join('')}
    ${en.map(t => `<div class=r onclick="txForm(S.tx.find(y=>y.id=='${t.id}'))"><div><b>${e(t.n || t.c || 'Entry')}</b><div class=m>${e(t.c || 'Uncategorised')} · ${chip(t.s)}</div></div><b style="color:${t.t == 'inc' ? 'var(--ok)' : 'var(--ink)'}">${t.t == 'inc' ? '+' : t.t == 'xfer' ? '' : '-'}${f(t.a)}</b></div>`).join('')}
    ${ev.length + en.length ? '' : '<div class=m>Nothing on this day.</div>'}
  </div>
  ${up.length ? `<div class=c><h3>Coming up</h3>${up.map(x => `<div class=r><span><i class=dot style="background:${EColor[x.k]}"></i>${x.d} ${new Date(y, m, 1).toLocaleString('en-IN', { month: 'short' })} · ${e(x.n)}</span><b>${x.a ? f(x.a) : ''}</b></div>`).join('')}</div>` : ''}
  `;
}

function plan() {
  const k = ym(V.y, V.m), pt = V.pt || 'cal';
  const SG = `<div class=seg>${Object.keys(KS).map(x => `<button class="${pt == x ? 'on' : ''}" onclick="V.pt='${x}';render()">${KS[x][0]}</button>`).join('')}</div>`;

  if (pt == 'cal') return SG + cal();

  if (pt == 'goals') {
    return SG + `
    <div class=c>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0">Sinking Funds & Savings Goals</h3>
        <button class=pri onclick="goalForm()" style="min-height:34px;padding:0 12px;font-size:12px">+ Add Goal</button>
      </div>
      <div class=m style="font-size:12px;margin-bottom:12px">Track earmarked funds for annual insurance, vacations, property taxes, and emergencies.</div>
      ${(S.goals && S.goals.length) ? S.goals.map(g => {
        const p = g.target ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
        return `
        <div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class=r style="padding:0;margin-bottom:4px">
            <div><b>${e(g.n)}</b><div class=m style="font-size:11px">${g.s ? chip(g.s) : ''} · Target: ${new Date(g.d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div></div>
            <div style="text-align:right"><b class=ok>${f(g.saved)}</b><div class=m style="font-size:11px">of ${f(g.target)} (${p}%)</div></div>
          </div>
          ${bar(p, 'var(--ok)')}
          <div class=row style="margin-top:8px">
            <button onclick="goalAddMoney('${g.id}')" style="min-height:34px;font-size:12px">+ Add Savings</button>
            <button onclick="goalForm(S.goals.find(x=>x.id=='${g.id}'))" style="min-height:34px;font-size:12px">Edit</button>
          </div>
        </div>`;
      }).join('') : '<div class=m>No sinking funds or goals configured yet. Tap + Add Goal to start.</div>'}
    </div>`;
  }

  const d = p => S.paid[p.id + '|' + k];
  const L = PL(k).filter(p => p.k == pt).sort((a, b) => (!!a.end - !!b.end) || a.day - b.day);
  const tot = sum(L.map(p => ({ a: pamt(p) })));
  const dn = sum(L.filter(d).map(p => ({ a: pamt(p) })));
  const bl = S.cards.map(c => ({ c, b: bill(c, V.y, V.m) })).filter(x => x.b.billed || x.b.pay);

  return SG + `
  <div class=c style="display:flex;gap:14px;align-items:center">
    ${ring(tot ? dn / tot : 0, KS[pt][1], 72)}
    <div>
      <div class=m>${pt == 'inc' ? 'Received' : pt == 'inv' ? 'Invested' : 'Paid'} so far</div>
      <div class=big>${f(dn)}</div>
      <div class=m>of ${f(tot)} planned, ${f(tot - dn)} to go</div>
    </div>
  </div>
  <div class=c>
    ${L.map(p => `
      <div class=r style="${d(p) ? 'opacity:.6' : ''}">
        <button class="ck ${d(p) ? 'on' : ''}" onclick="tg('${p.id}')" aria-label="Mark ${e(p.n)}">${d(p) ? '✓' : ''}</button>
        <div onclick="planForm(S.plan.find(x=>x.id=='${p.id}'))" style="flex:1">
          <b>${e(p.n)}</b>
          <div class=m>Day ${p.day} · ${chip(p.s)}${p.end ? (p.from == p.end ? ' · this month only' : ' · until ' + new Date(+p.end.slice(0, 4), +p.end.slice(5) - 1).toLocaleString('en-IN', { month: 'short' })) : ''}</div>
        </div>
        <b>${f(pamt(p))}</b>
      </div>
    `).join('') || '<div class=m>Nothing planned yet.</div>'}
    <button class=add onclick="planForm({k:'${pt}'})">+ Add ${KS[pt][2]}</button>
  </div>
  ${pt == 'exp' && bl.length ? `
  <div class=c>
    <h3>Credit card bills due</h3>
    ${bl.map(x => `<div class=r><div style="flex:1"><b>${e(x.c.n)}</b><div class=m>Due ${x.b.dueD.slice(5)}</div></div><b>${f(x.b.pay)}</b>${x.b.pay > 0 ? `<button class=pri onclick="payCard('${x.c.id}')">Pay</button>` : '<span class=ok>Paid</span>'}</div>`).join('')}
  </div>` : ''}
  `;
}

// 5. HISTORY TAB (With Date Range & Category Filter)
function hist() {
  const fl = V.hf || 'all';
  const sq = (V.sq || '').trim().toLowerCase();
  const cf = V.catFilter || '';
  const dFrom = V.dateFrom || '';
  const dTo = V.dateTo || '';

  const A = S.tx.filter(t => !t.adj);
  const L = A.filter(t => {
    if (fl != 'all' && t.t != fl) return false;
    if (cf && (t.c || '') !== cf) return false;
    if (dFrom && t.d < dFrom) return false;
    if (dTo && t.d > dTo) return false;
    if (sq) {
      const match = (t.n && t.n.toLowerCase().includes(sq)) ||
                    (t.c && t.c.toLowerCase().includes(sq)) ||
                    (src(t.s) && src(t.s).toLowerCase().includes(sq)) ||
                    (t.cd && src(t.cd).toLowerCase().includes(sq));
      if (!match) return false;
    }
    // If no date filter is applied, default to current month
    if (!dFrom && !dTo) {
      if (t.d.slice(0, 7) !== ym(V.y, V.m)) return false;
    }
    return true;
  }).sort((a, b) => b.d.localeCompare(a.d));

  const G = {};
  L.forEach(t => (G[t.d] = G[t.d] || []).push(t));

  const F = [['all', 'All'], ['exp', 'Spent'], ['inc', 'Income'], ['inv', 'Invest'], ['pay', 'Cards'], ['xfer', 'Transfer']];
  const fsp = sum(L.filter(t => t.t == 'exp'));

  return `
  <div class="seg sm">
    ${F.map(([k, l]) => `<button class="${fl == k ? 'on' : ''}" onclick="V.hf='${k}';render()">${l}</button>`).join('')}
  </div>

  <div style="position:relative;margin:8px 0 4px">
    <input type=text id=txSearchInp value="${e(V.sq || '')}" placeholder="🔍 Search description, merchant, card..." oninput="V.sq=this.value;render()" style="width:100%;min-height:40px;padding:0 32px 0 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:13px">
    ${V.sq ? `<button onclick="V.sq='';render()" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--mut);min-height:30px;padding:0 8px;font-size:16px;">✕</button>` : ''}
  </div>

  <div style="display:flex;gap:6px;margin-bottom:6px">
    <input type=date aria-label="From Date" value="${e(V.dateFrom)}" onchange="V.dateFrom=this.value;render()" style="flex:1;min-height:36px;font-size:11px;padding:0 6px;border-radius:8px;border:1px solid var(--line);background:var(--card)">
    <input type=date aria-label="To Date" value="${e(V.dateTo)}" onchange="V.dateTo=this.value;render()" style="flex:1;min-height:36px;font-size:11px;padding:0 6px;border-radius:8px;border:1px solid var(--line);background:var(--card)">
    ${(V.dateFrom || V.dateTo) ? `<button onclick="V.dateFrom='';V.dateTo='';render()" style="min-height:36px;padding:0 8px;font-size:12px">Clear</button>` : ''}
  </div>

  <div class=m style="padding:0 4px">${L.length} entries · Spent: <b>${f(fsp)}</b></div>

  ${Object.keys(G).map(d => {
    const x = G[d], sp = sum(x.filter(t => t.t == 'exp'));
    return `
    <div>
      <div class=r style="padding:2px 4px">
        <b style="font-size:13px">${new Date(d + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</b>
        <span class=m>${sp ? 'Spent ' + f(sp) : ''}</span>
      </div>
      <div class=c style="padding:4px 14px">
        ${x.map(t => {
          const b = getMerchantBadge(t.n, t.c, t.t);
          return `
          <div class=r onclick="txForm(S.tx.find(y=>y.id=='${t.id}'))">
            <span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,${b.bg} 18%,transparent);color:${b.bg};border:1px solid color-mix(in srgb,${b.bg} 32%,transparent);display:flex;align-items:center;justify-content:center;font-size:16px;flex:none">${b.icon}</span>
            <div style="flex:1;min-width:0">
              <b>${e(t.n || t.c || 'Entry')}</b>
              <div class=m>${e(t.t == 'pay' ? 'Card payment' : t.t == 'xfer' ? 'Transfer' : t.c || 'Uncategorised')} · ${chip(t.s)}${t.t == 'pay' ? ' → ' + chip(t.cd) : t.t == 'xfer' ? ' → ' + chip(t.to) : ''}</div>
            </div>
            <b style="color:${t.t == 'inc' ? 'var(--ok)' : t.t == 'inv' ? 'var(--pri)' : t.t == 'pay' || t.t == 'xfer' ? 'var(--mut)' : 'var(--ink)'}">${t.t == 'inc' ? '+' : t.t == 'xfer' ? '' : '-'}${f(t.a)}</b>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('') || '<div class=c><div class=m>No matching entries.</div></div>'}
  `;
}

// 6. MORE / SETTINGS TAB (Unified, People Ledger, Budgets, Pin Lock, Share)
function more() {
  const totPeopleOwed = sum((S.people || []).filter(p => p.balance > 0), 'balance');
  const totPeopleOwe = sum((S.people || []).filter(p => p.balance < 0), 'balance');

  return `
  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">Bank accounts</h3>
      <button class=pri onclick="accForm()" style="min-height:34px;padding:0 12px;font-size:12px">+ Add Bank</button>
    </div>
    ${S.acc.map(a => `<div class=r onclick="accForm(S.acc.find(x=>x.id=='${a.id}'))"><span><i class=dot style="background:${colr(a.id)}"></i>${e(a.n)}</span><b>${f(accBal(a))}</b></div>`).join('') || '<div class=m>No accounts yet.</div>'}
    <button style="width:100%;margin-top:8px" onclick="txForm({t:'xfer'})">Transfer between accounts</button>
  </div>

  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">People Ledger ("Who Owes Me What")</h3>
      <button class=pri onclick="peopleForm()" style="min-height:34px;padding:0 12px;font-size:12px">+ Add Person</button>
    </div>
    <div class=m style="font-size:12px;margin-bottom:10px">Track loans, split bills, and repayments from friends and family.</div>
    ${(S.people && S.people.length) ? S.people.map(p => `
      <div style="padding:8px 0;border-bottom:1px solid var(--line)">
        <div class=r style="padding:0">
          <div><b>${e(p.name)}</b>${p.phone ? `<div class=m style="font-size:11px">${e(p.phone)}</div>` : ''}</div>
          <div style="text-align:right">
            <b style="color:${p.balance > 0 ? 'var(--ok)' : p.balance < 0 ? 'var(--bad)' : 'var(--mut)'}">${p.balance > 0 ? 'Owes you ' + f(p.balance) : p.balance < 0 ? 'You owe ' + f(Math.abs(p.balance)) : 'Settled'}</b>
          </div>
        </div>
        <div class=row style="margin-top:6px">
          <button onclick="personTxForm('${p.id}', 'lent')" style="min-height:32px;font-size:11.5px">+ Lend</button>
          <button onclick="personTxForm('${p.id}', 'repaid')" style="min-height:32px;font-size:11.5px">+ Repaid</button>
          <button onclick="peopleForm(S.people.find(x=>x.id=='${p.id}'))" style="min-height:32px;font-size:11.5px">Edit</button>
        </div>
      </div>
    `).join('') : '<div class=m>No people added yet. Keep track of hand loans and repayments here.</div>'}
    ${totPeopleOwed ? `<div class=r style="margin-top:8px;font-size:12px"><span>Total Owed to You:</span><b class=ok>${f(totPeopleOwed)}</b></div>` : ''}
  </div>

  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">Category Budgets</h3>
      <button onclick="catBudgetForm()" style="min-height:34px;padding:0 12px;font-size:12px">Edit Limits</button>
    </div>
    <div class=m style="font-size:12px;margin-bottom:8px">Configure individual monthly caps per spending category.</div>
    ${Object.keys(S.catBudgets).length ? Object.entries(S.catBudgets).map(([cat, lim]) => {
      const sp = sum(mt().filter(t => !t.adj && t.t == 'exp' && (t.c || '') === cat));
      const p = Math.min(100, Math.round((sp / lim) * 100));
      return `
      <div style="margin-bottom:8px">
        <div class=r style="padding:0;font-size:12px"><span>${e(cat)}</span><b>${f(sp)} / ${f(lim)} (${p}%)</b></div>
        ${bar(p, p >= 100 ? 'var(--bad)' : p >= 80 ? 'var(--warn)' : 'var(--ok)')}
      </div>`;
    }).join('') : '<div class=m>No category budgets set. Tap Edit Limits to configure.</div>'}
  </div>

  <div class=c>
    <h3>Tools & Schedule Reminders</h3>
    <button style="width:100%;margin-bottom:8px" onclick="exportCalendarICS()">📅 Export Card Bills to Calendar (.ics)</button>
    <button style="width:100%" onclick="openSmsParser()">📋 Parse Bank SMS / UPI Transaction</button>
  </div>

  <div class=c>
    <h3>Settings & Backups</h3>
    <div class=r><span>Total Monthly Budget</span><b>${f(S.budget)}</b></div>
    <button style="width:100%" onclick="budForm()">Set overall monthly budget</button>
    <button style="width:100%;margin-top:8px" onclick="tidy()">Tidy old categories</button>
    <button style="width:100%;margin-top:8px" onclick="S.est=!S.est;save()">Include everyday spending estimate in forecast: ${S.est ? 'On' : 'Off'}</button>
    
    <div style="margin-top:10px;padding:10px;border-radius:12px;background:var(--bg)">
      <div class=r style="padding:0;margin-bottom:6px">
        <span><b>Security / App Lock:</b></span>
        <span class="${S.pin ? 'ok' : 'm'}">${S.pin ? 'PIN Active' : 'Disabled'}</span>
      </div>
      <button style="width:100%;min-height:36px;font-size:12px" onclick="pinSettingsForm()">${S.pin ? 'Change or Remove PIN' : 'Set 4-Digit Security PIN'}</button>
    </div>

    <div class=row style="margin-top:10px">
      <button onclick="bk(false)">Export / Share Backup</button>
      <button onclick="imp.click()">Import Backup</button>
    </div>
    <button style="width:100%;margin-top:8px" onclick="expCsv()">📊 Export all transactions to CSV (Excel)</button>
    <input type=file id=imp accept=.json hidden onchange="ld(this)">
    <div class=m style="font-size:11px;margin-top:6px">Last backup: ${localStorage.getItem('fintrak_last_backup') || 'Never'}</div>
  </div>

  ${appear()}

  <div class=c>
    <h3>Install on your phone</h3>
    <div class=m>Android Chrome: tap menu (⋮) → "Install app". iPhone Safari: tap Share (⎋) → "Add to Home Screen". All your data remains private and stored on this device.</div>
  </div>
  `;
}

function pinSettingsForm() {
  if (S.pin) {
    if (confirm('A security PIN is currently active. Do you want to remove it? (Cancel to change PIN)')) {
      const curP = prompt('Enter your current PIN to remove:');
      if (curP === S.pin) {
        delete S.pin;
        save();
        toast('✓ Security PIN removed');
      } else alert('Incorrect PIN!');
      return;
    }
  }
  const newP = prompt('Enter a 4-digit numeric PIN:');
  if (!newP || !/^\d{4}$/.test(newP)) return alert('PIN must be exactly 4 digits.');
  S.pin = newP;
  sessionStorage.setItem('fintrak_unlocked', '1');
  save();
  toast('✓ Security PIN enabled!');
}

const appear = () => `
<div class=c>
  <h3>Appearance</h3>
  <div class=m style="margin-bottom:6px">Mode</div>
  <div class=seg>
    ${[['auto', 'Auto'], ['light', 'Light'], ['warm', 'Warm'], ['dark', 'Dark'], ['black', 'Black']].map(([k, l]) => `<button class="${TH.m == k ? 'on' : ''}" onclick="setTheme('m','${k}')">${l}</button>`).join('')}
  </div>
  <div class=m style="margin:12px 0 6px">Accent colour: ${TH.a}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    ${Object.entries(ACC).map(([n, a]) => `<button aria-label="${n}" aria-pressed="${TH.a == n}" onclick="setTheme('a','${n}')" style="width:48px;height:48px;border-radius:50%;padding:0;border:3px solid ${TH.a == n ? 'var(--ink)' : 'transparent'};background:linear-gradient(135deg,${a[1]},${a[2]})"></button>`).join('')}
  </div>
  <div class=m style="margin:14px 0 6px">Chart colours: ${TH.c || 'Vivid'}</div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${[...Object.keys(CPAL), 'Accent'].map(n => `<button onclick="setTheme('c','${n}')" aria-pressed="${(TH.c || 'Vivid') == n}" style="width:100%;display:flex;justify-content:space-between;align-items:center;border:2px solid ${(TH.c || 'Vivid') == n ? 'var(--pri)' : 'var(--line)'}"><span>${n}</span><span style="display:flex;gap:3px">${cpal(n).slice(0, 8).map(c => `<i style="width:14px;height:14px;border-radius:50%;background:${c}"></i>`).join('')}</span></button>`).join('')}
  </div>
  <div class=m style="margin:14px 0 6px">Category chart style</div>
  <div class=seg>
    ${[['donut', 'Donut'], ['bars', 'Bars']].map(([k, l]) => `<button class="${(TH.s || 'donut') == k ? 'on' : ''}" onclick="setTheme('s','${k}')">${l}</button>`).join('')}
  </div>
</div>`;

// Core Application Render Loop
function render() {
  if (isPinLocked()) {
    renderPinScreen();
    return;
  }
  const pinEl = document.getElementById('pinLockOverlay');
  if (pinEl) pinEl.remove();

  const activeId = document.activeElement ? document.activeElement.id : null;
  const selStart = (activeId && document.activeElement.selectionStart) || 0;
  const P = { home, cards, analytics, plan, hist, more };

  $('#app').innerHTML = `
  <header>
    <div style="display:flex;align-items:center;gap:6px">
      <b>Fintrak</b>
      ${V.t == 'more' ? '<span style="font-size:13px;opacity:0.7">· Settings</span>' : V.t == 'analytics' ? '<span style="font-size:13px;opacity:0.7">· Analytics</span>' : ''}
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <button onclick="togglePriv()" style="width:34px;height:34px;min-height:34px;padding:0;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center" aria-label="Toggle Privacy" title="Toggle Privacy Mode">${V.priv ? '🙈' : '👁️'}</button>
      <button onclick="go(V.t=='more'?'home':'more')" style="width:34px;height:34px;min-height:34px;padding:0;border-radius:50%;border:1px solid ${V.t == 'more' ? 'var(--pri)' : 'var(--line)'};background:${V.t == 'more' ? 'color-mix(in srgb,var(--pri) 15%,var(--card))' : 'var(--card)'};color:var(--ink);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center" aria-label="Settings" title="Settings">${V.t == 'more' ? '✕' : '⚙️'}</button>
      ${V.t != 'more' ? `
      <div class=mn>
        <button onclick="mv(-1)" aria-label="Previous month">‹</button>
        <span>${mo()}</span>
        <button onclick="mv(1)" aria-label="Next month">›</button>
      </div>` : ''}
    </div>
  </header>
  <main>${P[V.t]()}</main>
  <button class=fab onclick="txForm()" aria-label="Add entry">+</button>
  <nav>
    ${[
      ['home', 'Home', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
      ['cards', 'Cards', 'M2 6h20v12H2zM2 10h20'],
      ['analytics', 'Analytics', 'M18 20V10M12 20V4M6 20v-6'],
      ['plan', 'Plan', 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4'],
      ['hist', 'History', 'M4 6h16M4 12h16M4 18h10']
    ].map(([k, l, p]) => `<button class="${V.t == k ? 'on' : ''}" onclick="go('${k}')"><svg viewBox="0 0 24 24"><path d="${p}"/></svg>${l}</button>`).join('')}
  </nav>
  `;

  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) {
      el.focus();
      if (el.setSelectionRange) el.setSelectionRange(selStart, selStart);
    }
  }
}

// PIN Screen Render
let enteredPin = '';
function renderPinScreen() {
  let overlay = document.getElementById('pinLockOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pinLockOverlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
  <div style="font-size:24px;margin-bottom:8px">🔒</div>
  <h2 style="margin:0 0 4px">Fintrak Locked</h2>
  <div class=m style="font-size:13px">Enter your 4-digit PIN to continue</div>
  <div class="pin-dots">
    ${[0, 1, 2, 3].map(i => `<div class="pin-dot ${enteredPin.length > i ? 'filled' : ''}"></div>`).join('')}
  </div>
  <div class="pin-grid">
    ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map(btn => `
      <button type=button class="pin-btn" onclick="pressPinKey('${btn}')">${btn}</button>
    `).join('')}
  </div>
  `;
}

function pressPinKey(k) {
  if (k === 'C') enteredPin = '';
  else if (k === '⌫') enteredPin = enteredPin.slice(0, -1);
  else if (enteredPin.length < 4) enteredPin += k;

  if (enteredPin.length === 4) {
    if (unlockWithPin(enteredPin)) {
      enteredPin = '';
      return;
    } else {
      toast('⚠️ Incorrect PIN. Try again.');
      enteredPin = '';
    }
  }
  renderPinScreen();
}

const SA = (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches) || (typeof navigator !== 'undefined' && navigator.standalone);
let lb = 0;

function go(t) {
  if (V.t == t) return;
  const h = V.t == 'home';
  V.t = t;
  if (t == 'home') {
    render();
    if (history.state && history.state.t && history.state.t != 'home') history.back();
  } else {
    history[h ? 'pushState' : 'replaceState']({ t }, '');
    render();
  }
}

if (typeof history !== 'undefined') {
  if (history.state && history.state.t) V.t = history.state.t;
  else if (SA) {
    history.replaceState({ g: 1 }, '');
    history.pushState({ t: 'home' }, '');
  } else {
    history.replaceState({ t: 'home' }, '');
  }

  window.addEventListener('popstate', e => {
    const d = $('#dlg');
    if (d && d.open) d.close();
    const s = e.state || {};
    if (s.g) {
      const two = Date.now() - lb < 2000;
      lb = Date.now();
      history.pushState({ t: 'home' }, '');
      if (V.t != 'home') { V.t = 'home'; render(); }
      if (two) {
        window.close();
        setTimeout(() => toast('Swipe up or use home button to exit'), 300);
      } else toast('Press back again to exit');
    } else if (s.t && s.t != V.t) {
      V.t = s.t;
      render();
    }
  });
}

// Handle hash shortcuts on launch (e.g. #add, #analytics)
if (typeof location !== 'undefined') {
  if (location.hash === '#add') {
    setTimeout(() => txForm(), 200);
  } else if (location.hash === '#analytics') {
    V.t = 'analytics';
  }
}

if (typeof document !== 'undefined') {
  const dlg = $('#dlg');
  if (dlg) {
    dlg.addEventListener('close', () => {
      if (history.state && history.state.dlg) history.back();
    });
  }
  render();
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
