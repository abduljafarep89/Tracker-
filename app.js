/* =========================================================================
   Fintrak - Personal Finance Tracker
   Modular Application Logic (app.js)
   ========================================================================= */

const $ = s => document.querySelector(s);
const K = 'fintrak_v1';
let T = new Date();
const pd = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pd(d.getMonth() + 1) + '-' + pd(d.getDate());

// Storage Persistence
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

let S = null;
try {
  S = JSON.parse(localStorage.getItem(K) || 'null');
  if (!S) {
    const legacy = localStorage.getItem('tracker_multi_row_mobile_suite');
    if (legacy) {
      const p = JSON.parse(legacy);
      S = p.months ? convertOld(p) : p;
      localStorage.setItem(K, JSON.stringify(S));
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
  if (!S) return;
  S.acc = S.acc || [];
  S.cards = S.cards || [];
  S.tx = S.tx || [];
  S.plan = S.plan || [];
  S.paid = S.paid || {};
  S.goals = S.goals || [];
  S.catBudgets = S.catBudgets || {};
  S.people = S.people || [];
  S.investments = S.investments || [];
  S.shortcuts = S.shortcuts || [];
}
migrate();

// Themes & Palettes (13 Curated Themes)
const MODES = {
  light: { bg: '#F5F7FB', card: '#FFFFFF', ink: '#111827', mut: '#4B5563', line: '#E2E8F0', ok: '#0D9488', warn: '#D97706', bad: '#E11D48' },
  dark: { bg: '#0F172A', card: '#1E293B', ink: '#F8FAFC', mut: '#94A3B8', line: '#334155', ok: '#34D399', warn: '#FBBF24', bad: '#F87171' },
  midnight: { bg: '#0B0F19', card: '#111827', ink: '#F9FAFB', mut: '#9CA3AF', line: '#1F2937', ok: '#10B981', warn: '#F59E0B', bad: '#EF4444' },
  warm: { bg: '#FAF5EC', card: '#FFFDF8', ink: '#2B2118', mut: '#6B5A48', line: '#EADFCB', ok: '#0F766E', warn: '#B45309', bad: '#B91C1C' },
  dracula: { bg: '#181622', card: '#221D30', ink: '#F8F8F2', mut: '#B3A1E6', line: '#352B4D', ok: '#50FA7B', warn: '#FFB86C', bad: '#FF5555' },
  matcha: { bg: '#F4F7F2', card: '#FFFFFF', ink: '#1C2B1E', mut: '#546B58', line: '#DEE7DC', ok: '#2E7D32', warn: '#E65100', bad: '#C62828' },
  champagne: { bg: '#FAF7F2', card: '#FFFFFF', ink: '#2A231C', mut: '#6E5F53', line: '#ECE3D7', ok: '#0F766E', warn: '#B45309', bad: '#9F1239' },
  nord: { bg: '#242933', card: '#2E3440', ink: '#ECEFF4', mut: '#D8DEE9', line: '#3B4252', ok: '#A3BE8C', warn: '#EBCB8B', bad: '#BF616A' },
  cyber: { bg: '#0A0814', card: '#141026', ink: '#F5F3FF', mut: '#A78BFA', line: '#27204A', ok: '#2DD4BF', warn: '#FBBF24', bad: '#F43F5E' },
  sunset: { bg: '#19131A', card: '#241A26', ink: '#FFF5F5', mut: '#C4A5C7', line: '#3C2B3E', ok: '#34D399', warn: '#FB923C', bad: '#F43F5E' },
  sage: { bg: '#F2F6F3', card: '#FFFFFF', ink: '#1A2E22', mut: '#526B5C', line: '#DCE6DF', ok: '#059669', warn: '#D97706', bad: '#DC2626' },
  black: { bg: '#000000', card: '#121214', ink: '#F4F4F5', mut: '#A1A1AA', line: '#27272A', ok: '#4FD1C5', warn: '#F6AD55', bad: '#FC8181' }
};

const ACC = {
  Indigo: ['#4F46E5', '#4338CA', '#7C3AED', '#6D6AF0'],
  Sapphire: ['#2563EB', '#1D4ED8', '#3B82F6', '#60A5FA'],
  Ocean: ['#0284C7', '#0369A1', '#0EA5E9', '#38BDF8'],
  Teal: ['#0D9488', '#0F766E', '#14B8A6', '#2DD4BF'],
  Emerald: ['#059669', '#047857', '#10B981', '#34D399'],
  Forest: ['#16A34A', '#15803D', '#22C55E', '#4ADE80'],
  Lime: ['#65A30D', '#4D7C0F', '#84CC16', '#A3E635'],
  Gold: ['#D97706', '#B45309', '#F59E0B', '#FBBF24'],
  Amber: ['#EA580C', '#C2410C', '#F97316', '#FB923C'],
  Sunset: ['#DC2626', '#B91C1C', '#EF4444', '#F87171'],
  Ruby: ['#E11D48', '#BE123C', '#9F1239', '#F43F5E'],
  Rose: ['#DB2777', '#BE185D', '#EC4899', '#F472B6'],
  Violet: ['#7C3AED', '#6D28D9', '#8B5CF6', '#A78BFA'],
  Amethyst: ['#9333EA', '#7E22CE', '#A855F7', '#C084FC'],
  Cyan: ['#0891B2', '#0E7490', '#06B6D4', '#22D3EE'],
  Graphite: ['#475569', '#334155', '#64748B', '#94A3B8']
};

const FONTS = {
  system: { n: 'System Native', desc: 'Apple / Android Default', f: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  jakarta: { n: 'Plus Jakarta Sans', desc: 'Fintech Modern & Clean', f: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" },
  inter: { n: 'Inter', desc: 'Swiss Neo-Grotesque', f: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  outfit: { n: 'Outfit', desc: 'Geometric Luxury', f: "'Outfit', 'Plus Jakarta Sans', sans-serif" },
  mono: { n: 'JetBrains Mono', desc: 'Tech & Quant Finance', f: "'JetBrains Mono', 'SF Mono', Consolas, monospace" },
  newsreader: { n: 'Newsreader', desc: 'Prestigious Editorial Serif', f: "'Newsreader', Georgia, 'Times New Roman', serif" }
};

let TH = { m: 'auto', a: 'Indigo', c: 'Vivid', s: 'donut', font: 'system' };
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
  const fontObj = FONTS[TH.font] || FONTS.system;
  r.setProperty('--font-family', fontObj.f);
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

// View State
let V = {
  t: 'home',
  y: T.getFullYear(),
  m: T.getMonth(),
  hf: 'all',
  sq: '',
  catFilter: '',
  dateFrom: '',
  dateTo: '',
  accFilter: '',
  pt: 'cal',
  hideSettled: localStorage.getItem('fintrak_hide_settled') === '1',
  priv: sessionStorage.getItem('fintrak_priv') === '1',
  sim: 0
};

// Automatic rollover to current month when app resumes or day changes past midnight
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const now = new Date();
      if (now.getMonth() !== T.getMonth() || now.getFullYear() !== T.getFullYear()) {
        T = now;
        V.y = now.getFullYear();
        V.m = now.getMonth();
        render();
      }
    }
  });
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('focus', () => {
    const now = new Date();
    if (now.getMonth() !== T.getMonth() || now.getFullYear() !== T.getFullYear()) {
      T = now;
      V.y = now.getFullYear();
      V.m = now.getMonth();
      render();
    }
  });
}

function save() {
  try {
    localStorage.setItem(K, JSON.stringify(S));
  } catch (err) {
    console.error('Storage quota exceeded or error:', err);
    toast('⚠️ Storage save failed! Export a backup.');
  }
  checkAndTriggerAutoBackup();
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
const mo = () => new Date(V.y, V.m).toLocaleString('en-IN', { month: 'short', year: 'numeric' });

// Relative Weekday Helpers
const WEEKDAYS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const WEEKDAY_NAMES = { sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' };

function pDay(p, y = V.y, m = V.m) {
  if (p && p.rule) {
    const parts = String(p.rule).toLowerCase().split('-');
    const nth = parts[0];
    const wdStr = parts[1];
    if (wdStr && wdStr in WEEKDAYS) {
      const targetWd = WEEKDAYS[wdStr];
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      if (nth === 'last') {
        const lastDayOfWeek = new Date(y, m, daysInMonth).getDay();
        return daysInMonth - ((lastDayOfWeek - targetWd + 7) % 7);
      }
      const n = parseInt(nth, 10) || 1;
      const firstDayOfWeek = new Date(y, m, 1).getDay();
      const firstDate = 1 + ((targetWd - firstDayOfWeek + 7) % 7);
      const targetDate = firstDate + (n - 1) * 7;
      return Math.min(daysInMonth, targetDate);
    }
  }
  return (p && +p.day) || 1;
}

function pDayLabel(p, y = V.y, m = V.m) {
  if (p && p.rule) {
    const parts = String(p.rule).toLowerCase().split('-');
    const nth = parts[0];
    const wdStr = parts[1];
    if (wdStr && wdStr in WEEKDAYS) {
      const nthLabel = nth === 'last' ? 'Last' : nth === '1' ? '1st' : nth === '2' ? '2nd' : nth === '3' ? '3rd' : nth === '4' ? '4th' : nth === '5' ? '5th' : nth;
      const actualDay = pDay(p, y, m);
      return `${nthLabel} ${WEEKDAY_NAMES[wdStr]} (Day ${actualDay})`;
    }
  }
  return `Day ${p && p.day ? p.day : 1}`;
}

const PL = key => S.plan.filter(p => (!p.from || key >= p.from) && (!p.end || key <= p.end));
const pm = (y, m) => {
  const d = new Date(y, m);
  return ym(d.getFullYear(), d.getMonth());
};

const PALX = ['#4F46E5', '#0F766E', '#B45309', '#B91C1C', '#7C3AED', '#2563EB', '#059669', '#D97706', '#475569', '#DB2777', '#0891B2', '#CA8A04', '#4B5563', '#16A34A', '#DC2626', '#9333EA'];
const colr = id => {
  const c = S.cards.find(x => x.id == id);
  if (c && c.col) return c.col;
  const a = S.acc.find(x => x.id == id);
  if (a && a.col) return a.col;
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return PALX[Math.abs(h) % PALX.length];
};

const src = id => {
  const a = S.acc.find(x => x.id == id);
  if (a) return a.n;
  const c = S.cards.find(x => x.id == id);
  return c ? c.n : id;
};

const chip = id => `<span class=dot style="background:${colr(id)}"></span>${e(src(id))}`;
const bar = (p, c) => `<div class=bar><i style="width:${Math.min(100, Math.max(0, p))}%;background:${c}"></i></div>`;
const ring = (p, c, s = 80) => {
  const r = (s - 12) / 2, C = 2 * Math.PI * r, o = C * (1 - Math.min(1, Math.max(0, p)));
  return `<svg width=${s} height=${s} viewBox="0 0 ${s} ${s}" style="transform:rotate(-90deg)"><circle cx=${s/2} cy=${s/2} r=${r} fill=none stroke="var(--line)" stroke-width=10/><circle cx=${s/2} cy=${s/2} r=${r} fill=none stroke="${c}" stroke-width=10 stroke-dasharray="${C}" stroke-dashoffset="${o}" stroke-linecap=round style="transition:stroke-dashoffset .4s"/></svg>`;
};

const CPAL = {
  Vivid: ['#F59E0B', '#EC4899', '#2563EB', '#14B8A6', '#7C3AED', '#EF4444', '#84CC16', '#92400E', '#9CA3AF', '#0F766E', '#4F46E5', '#06B6D4', '#F97316', '#A855F7', '#65A30D', '#E11D48'],
  Pastel: ['#FBBF77', '#F9A8D4', '#93C5FD', '#5EEAD4', '#C4B5FD', '#FCA5A5', '#BEF264', '#D6A57A', '#D1D5DB', '#6EE7B7', '#A5B4FC', '#67E8F9', '#FDBA74', '#D8B4FE', '#86EFAC', '#FDA4AF'],
  Ocean: ['#0EA5E9', '#0369A1', '#14B8A6', '#0F766E', '#6366F1', '#38BDF8', '#22D3EE', '#1E3A8A', '#94A3B8', '#059669', '#2563EB', '#67E8F9', '#34D399', '#818CF8', '#0891B2', '#475569'],
  Nordic: ['#88C0D0', '#81A1C1', '#5E81AC', '#8FBCBB', '#A3BE8C', '#EBCB8B', '#D08770', '#BF616A', '#B48EAD', '#4C566A', '#38BDF8', '#818CF8', '#34D399', '#F472B6', '#FBBF24', '#60A5FA'],
  Sunset: ['#EA580C', '#F97316', '#F59E0B', '#E11D48', '#BE123C', '#DB2777', '#7C3AED', '#9333EA', '#D97706', '#C2410C', '#FB7185', '#F43F5E', '#FB923C', '#FBBF24', '#A855F7', '#6D28D9'],
  Neon: ['#00F5D4', '#7B2CBF', '#F72585', '#4CC9F0', '#4361EE', '#3A0CA3', '#7209B7', '#06D6A0', '#FFD166', '#EF476F', '#118AB2', '#073B4C', '#10B981', '#6366F1', '#EC4899', '#F59E0B'],
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
    const a = ACC[TH.a] || ACC.Indigo;
    const h = hue(a[0]);
    return Array.from({ length: 16 }, (_, i) => `hsl(${(h + [0, 25, -25, 45, -45, 15, -15, 60][i % 8] + 360) % 360}, ${68 - (i % 3) * 6}%, ${[38, 54, 46, 62][i % 4]}%)`);
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
  'Shopping': ['Clothing & shoes', 'Electronics', 'Home & garden', 'Health & beauty', 'Kids & baby', 'Pets', 'Stationery & gifts'],
  'Housing': ['Electricity, water & gas', 'Housing & rent', 'Home maintenance', 'Domestic help'],
  'Transport': ['Public transit', 'Taxi & auto', 'Travel & holidays', 'Parking & tolls'],
  'Vehicle': ['Fuel', 'Vehicle maintenance', 'Vehicle insurance & tax', 'Vehicle repayments'],
  'Life & Entertainment': ['Cinema & events', 'Subscriptions', 'Hobbies', 'Sport & fitness', 'Education'],
  'Communication': ['Phone & mobile', 'Internet & cable'],
  'Financial': ['Bank fees & interest', 'Card repayments', 'Taxes', 'Loans & insurance'],
  'Others': ['Charity & gifts', 'Miscellaneous']
};

const CATG = {};
Object.entries(CATS).forEach(([g, l]) => l.forEach(c => CATG[c] = g));
const CAT_EXP = Object.values(CATS).flat();
const CAT_INC = ['Salary', 'Freelance & consulting', 'Business profit', 'Dividends & interest', 'Rental income', 'Repayments received', 'Other income'];
const CAT_INV = ['Mutual funds & SIP', 'Equities & stocks', 'Fixed & recurring deposits', 'Provident fund (PPF / EPF)', 'NPS & retirement', 'Real estate', 'Gold & commodities', 'Other investments'];

function catSel(type, sel = '') {
  const list = type == 'inc' ? CAT_INC : type == 'inv' ? CAT_INV : CAT_EXP;
  if (type != 'exp') return `<select name=c style="width:100%">${list.map(c => `<option value="${e(c)}"${c == sel ? ' selected' : ''}>${e(c)}</option>`).join('')}</select>`;
  return `<select name=c style="width:100%">${Object.entries(CATS).map(([g, l]) => `<optgroup label="${e(g)}">${l.map(c => `<option value="${e(c)}"${c == sel ? ' selected' : ''}>${e(c)}</option>`).join('')}</optgroup>`).join('')}</select>`;
}

const KS = { exp: ['Spent', 'var(--bad)'], inc: ['Income', 'var(--ok)'], inv: ['Invest', 'var(--pri)'], pay: ['Payment', 'var(--ink)'] };

function toast(msg, actionText, onAction) {
  const t = $('#toast');
  if (!t) return;
  t.innerHTML = `<span>${msg}</span>${actionText ? `<button id=toastActionBtn>${actionText}</button>` : ''}`;
  t.style.opacity = '1';
  t.style.transform = 'translate(-50%, -4px)';
  if (actionText && onAction) {
    t.classList.add('has-action');
    const btn = $('#toastActionBtn');
    if (btn) btn.onclick = () => { onAction(); hideToast(); };
  } else {
    t.classList.remove('has-action');
  }
  clearTimeout(window._toastT);
  window._toastT = setTimeout(hideToast, actionText ? 5000 : 2500);
}

function hideToast() {
  const t = $('#toast');
  if (!t) return;
  t.style.opacity = '0';
  t.style.transform = 'translate(-50%, 0)';
  t.classList.remove('has-action');
}



// PIN Security
function isPinLocked() {
  if (!S || !S.pin) return false;
  return sessionStorage.getItem('fintrak_unlocked') !== '1';
}

function unlockWithPin(p) {
  if (p === S.pin) {
    sessionStorage.setItem('fintrak_unlocked', '1');
    render();
    return true;
  }
  return false;
}

function renderPinScreen() {
  let entered = '';
  const root = $('#app');
  root.innerHTML = `
    <div id="pinLockOverlay">
      <div style="font-size:28px;margin-bottom:8px">🔒</div>
      <h2 style="margin:0 0 4px">Fintrak Locked</h2>
      <div class=m style="font-size:13px">Enter your 4-digit security PIN</div>
      <div class="pin-dots">
        <i class="pin-dot" id="pd0"></i>
        <i class="pin-dot" id="pd1"></i>
        <i class="pin-dot" id="pd2"></i>
        <i class="pin-dot" id="pd3"></i>
      </div>
      <div class="pin-grid">
        ${[1,2,3,4,5,6,7,8,9].map(n => `<button class="pin-btn" onclick="pressPin('${n}')">${n}</button>`).join('')}
        <button class="pin-btn" style="font-size:16px" onclick="clearPin()">C</button>
        <button class="pin-btn" onclick="pressPin('0')">0</button>
        <button class="pin-btn" style="font-size:16px" onclick="backPin()">⌫</button>
      </div>
    </div>
  `;

  window.pressPin = n => {
    if (entered.length < 4) {
      entered += n;
      updateDots();
      if (entered.length === 4) {
        setTimeout(() => {
          if (!unlockWithPin(entered)) {
            alert('Incorrect PIN!');
            entered = '';
            updateDots();
          }
        }, 80);
      }
    }
  };
  window.clearPin = () => { entered = ''; updateDots(); };
  window.backPin = () => { entered = entered.slice(0, -1); updateDots(); };

  function updateDots() {
    for (let i = 0; i < 4; i++) {
      const dot = $(`#pd${i}`);
      if (dot) dot.className = `pin-dot ${i < entered.length ? 'filled' : ''}`;
    }
  }
}

// Financial Math Helpers
const accBal = a => {
  const o = +a.o || 0;
  const inAmt = sum(S.tx.filter(t => (t.s == a.id && t.t == 'inc') || (t.to == a.id && t.t == 'xfer')));
  const outAmt = sum(S.tx.filter(t => (t.s == a.id && (t.t == 'exp' || t.t == 'inv' || t.t == 'pay' || t.t == 'xfer'))));
  return o + inAmt - outAmt;
};

const cardOut = c => {
  return sum(S.tx.filter(t => t.s == c.id && t.t == 'exp')) - sum(S.tx.filter(t => (t.s == c.id && t.t == 'inc') || (t.t == 'pay' && t.cd == c.id)));
};

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
  const ks = Object.keys(mm).filter(k => k < cu).sort().slice(-3), avg = ks.length ? ks.reduce((s, k) => s + mm[k], 0) / ks.length : 0;
  return Math.round(avg);
}

function fd(y = V.y, m = V.m) {
  const now = T.getFullYear() * 12 + T.getMonth(), tg = Math.max(y * 12 + m, now);
  let cash = S.acc.reduce((s, a) => s + accBal(a), 0), r;
  for (let k = now; k <= tg; k++) {
    const yr = Math.floor(k/12), mo = k % 12, key = ym(yr, mo), u = p => !S.paid[p.id + '|' + key];
    const ps = x => sum(PL(key).filter(p => p.k == x && u(p)).map(p => ({ a: pamt(p) })));
    const pi = ps('inc'), pp = ps('exp'), pv = ps('inv');
    const cp = sum(S.cards.map(c => bill(c, yr, mo)), 'pay');
    const sp = (S.est && k > now) ? estSp(yr, mo) : 0;
    cash += pi - pp - pv - cp - sp;
    if (k == y * 12 + m) r = { pi, pp, pv, cp, sp, end: Math.round(cash) };
  }
  return r;
}

function getSafeDailySpend() {
  const dn = new Date(V.y, V.m + 1, 0).getDate();
  const td = cur() ? T.getDate() : dn;
  const daysLeft = Math.max(1, dn - td + 1);
  const M = mt().filter(t => !t.adj);
  const ex = sum(M.filter(t => t.t == 'exp' && !t.reimb));

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

function togglePriv() {
  V.priv = !V.priv;
  sessionStorage.setItem('fintrak_priv', V.priv ? '1' : '0');
  const b = document.body;
  if (b) {
    b.classList.toggle('priv-mode', V.priv);
  }
  render();
}



// Home Screen Renderer
function home() {
  const M = mt().filter(t => !t.adj);
  const inc = sum(M.filter(t => t.t == 'inc'));
  const ex = sum(M.filter(t => t.t == 'exp' && !t.reimb));
  const iv = sum(M.filter(t => t.t == 'inv'));
  const cash = S.acc.reduce((s, a) => s + accBal(a), 0);
  const debt = S.cards.reduce((s, c) => s + cardOut(c), 0);
  const lim = sum(S.cards, 'limit');
  const mm = {};
  S.tx.filter(t => t.t == 'exp' && !t.adj && !t.reimb).forEach(t => mm[t.d.slice(0, 7)] = (mm[t.d.slice(0, 7)] || 0) + t.a);
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
  const kCur = ym(V.y, V.m);
  const paidPlanIds = new Set(Object.entries(S.paid || {}).filter(([k, txId]) => k.endsWith('|' + kCur)).map(([k, txId]) => txId));
  const paidPlanExp = sum(M.filter(t => t.t == 'exp' && !t.reimb && paidPlanIds.has(t.id)));
  const dailyPlanShare = dn > 0 ? (paidPlanExp / dn) : 0;

  let cu = 0; const pt = [];
  for (let d = 1; d <= td; d++) {
    const varDaySpend = sum(M.filter(t => t.t == 'exp' && !t.reimb && !paidPlanIds.has(t.id) && +t.d.slice(8) == d));
    cu += varDaySpend + dailyPlanShare;
    pt.push([d, Math.round(cu)]);
  }
  const dailyPace = td > 0 ? Math.round(cu / td) : 0;
  const pj = cur() && td ? Math.round(dailyPace * dn) : Math.round(cu);
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

  const pace = S.budget ? `<svg viewBox="0 0 340 130" width=100% id=paceSvg role=img aria-label="Budget pace chart" style="touch-action:none;cursor:crosshair;overflow:visible" onpointerdown="scrubPace(event)" onpointermove="if(event.buttons||event.pointerType==='touch')scrubPace(event)" onpointerup="unscrubPace()" onpointerleave="unscrubPace()">
    <defs>
      <linearGradient id="paceAreaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--pri)" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="var(--pri)" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
    <line x1=10 y1=120 x2=330 y2=120 stroke="var(--line)"/>
    <line x1="${X(1)}" y1="${Y(0)}" x2="${X(dn)}" y2="${Y(S.budget)}" stroke="var(--mut)" stroke-width=1.8 stroke-dasharray="4 4" opacity="0.55"/>
    ${pt.length > 1 ? `<polygon fill="url(#paceAreaGrad)" points="${X(1)},120 ${pt.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')} ${X(pt[pt.length - 1][0])},120"/>` : ''}
    <polyline fill=none stroke="var(--pri)" stroke-width=3 stroke-linejoin=round stroke-linecap=round points="${pt.map(p => X(p[0]) + ',' + Y(p[1])).join(' ')}"/>
    ${cur() && td > 0 ? `<circle cx="${X(td)}" cy="${Y(cu)}" r="9" fill="var(--pri)" opacity="0.25"/><circle cx="${X(td)}" cy="${Y(cu)}" r="4.5" fill="var(--pri)" stroke="#fff" stroke-width="2"/>` : ''}
    ${cur() ? `<line x1="${X(td)}" y1="${Y(cu)}" x2="${X(dn)}" y2="${Y(pj)}" stroke="${pj > S.budget ? 'var(--bad)' : 'var(--ok)'}" stroke-width=2.5 stroke-dasharray="3 4" stroke-linecap=round />` : ''}
    ${overMarker}
    <line id=scrubLine x1=0 y1=10 x2=0 y2=120 stroke="var(--pri)" stroke-width=1.5 stroke-dasharray="2 2" style="display:none;pointer-events:none"/>
    <circle id=scrubDot cx=0 cy=0 r=5 fill="var(--pri)" stroke="#fff" stroke-width=2 style="display:none;pointer-events:none"/>
  </svg><div id=scrubTip style="min-height:36px">${paceAlert}</div>` : '<div class=m>Set a monthly budget in More to see your spending pace.</div>';

  const cg = {};
  M.filter(t => t.t == 'exp' && !t.reimb).forEach(t => cg[CATG[t.c] || t.c || 'Other'] = (cg[CATG[t.c] || t.c || 'Other'] || 0) + t.a);
  let cl = Object.entries(cg).sort((a, b) => b[1] - a[1]);
  if (cl.length > 5) cl = [...cl.slice(0, 5), ['Other', sum(cl.slice(5).map(x => ({ a: x[1] })))]];
  const CC = ccols(cl.map(x => x[0]));

  const chart = (TH.s == 'bars') ?
    `<div style="display:flex;flex-direction:column;gap:8px;padding:6px 0">${cl.map(([k, v]) => `<div><div class=r style="padding:0"><span><i class=dot style="background:${CC[k]}"></i>${e(k)}</span><b>${f(v)}</b></div>${bar(ex ? v / ex * 100 : 0, CC[k])}</div>`).join('')}</div>` :
    `<div style="display:flex;align-items:center;justify-content:space-around;padding:6px 0">${donut(cl, ex, CC)}<div style="font-size:12px;line-height:1.7">${cl.slice(0, 4).map(([k, v]) => `<div><i class=dot style="background:${CC[k]}"></i>${e(k)}: <b>${f(v)}</b></div>`).join('')}</div></div>`;

  const safeSpend = getSafeDailySpend();
  const totOwedPeople = sum((S.people || []).filter(p => p.balance > 0), 'balance');
  const totOwePeople = sum((S.people || []).filter(p => p.balance < 0), 'balance');

  return `
  <!-- Hero Net Worth / Cash Balance Card -->
  <div class=hero style="position:relative;overflow:hidden">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:12px;opacity:0.85;text-transform:uppercase;letter-spacing:0.5px">Total Available Cash</div>
        <div style="font-size:32px;font-weight:700;line-height:1.2;margin:2px 0 6px">${f(cash)}</div>
      </div>
      <div style="text-align:right">
        <div class="badge-countdown" style="background:rgba(255,255,255,0.22);color:#fff">${cur() ? '● Live Month' : mo()}</div>
      </div>
    </div>
    
    <div style="display:flex;gap:16px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.2);font-size:13px">
      <div><span style="opacity:0.8">Expected balance:</span> <b>${f(F.end)}</b></div>
      <div><span style="opacity:0.8">Credit card bills:</span> <b>${f(debt)}</b></div>
    </div>
  </div>

  <!-- Safe Daily Spend Widget -->
  <div class=c style="background:linear-gradient(135deg, color-mix(in srgb, var(--pri) 8%, var(--card)), var(--card));border:1px solid color-mix(in srgb, var(--pri) 20%, var(--line))">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:18px">🛡️</span>
      <div style="font-size:13px;flex:1">${safeSpend.label}</div>
    </div>
  </div>

  <!-- Month Summary Tiles -->
  <div class=tiles>
    <div class=tile style="background:color-mix(in srgb,var(--ok) 14%,transparent)">
      <span class=m>Income</span>
      <b class=ok>+${f(inc)}</b>
    </div>
    <div class=tile style="background:color-mix(in srgb,var(--bad) 14%,transparent)">
      <span class=m>Spent</span>
      <b class=bad>-${f(ex)}</b>
    </div>
    <div class=tile style="background:color-mix(in srgb,var(--pri) 14%,transparent)">
      <span class=m>Invested</span>
      <b style="color:var(--pri)">${f(iv)}</b>
    </div>
  </div>

  <!-- Cumulative Budget Pace Curve -->
  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <h3 style="margin:0">Cumulative Spend Pace</h3>
      <span class=m style="font-size:11.5px">Drag across chart to inspect</span>
    </div>
    ${pace}
  </div>

  <!-- Category Breakdown -->
  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h3 style="margin:0">${mo()} Spending by Category</h3>
      <button onclick="V.t='hist';render()" style="min-height:28px;padding:0 8px;font-size:11.5px;border-radius:8px">View all</button>
    </div>
    ${ex ? chart : '<div class=m style="padding:14px 0;text-align:center">No expenses recorded for this month yet.</div>'}
  </div>

  <!-- People Ledger Glanceable Summary Widget -->
  ${(S.people && S.people.length) ? `
  <div class=c onclick="V.t='plan';V.pt='people';render()" style="cursor:pointer">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:18px">👥</span>
        <div>
          <b>People Ledger</b>
          <div class=m style="font-size:12px">${f(totOwedPeople)} owed to you ${totOwePeople < 0 ? '· ' + f(Math.abs(totOwePeople)) + ' you owe' : ''}</div>
        </div>
      </div>
      <button style="min-height:30px;padding:0 10px;font-size:12px">View</button>
    </div>
  </div>` : ''}
  `;
}

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
  const kCur = ym(V.y, V.m);
  const paidPlanIds = new Set(Object.entries(S.paid || {}).filter(([k, txId]) => k.endsWith('|' + kCur)).map(([k, txId]) => txId));
  const paidPlanExp = sum(M.filter(t => t.t == 'exp' && !t.reimb && paidPlanIds.has(t.id)));
  const dailyPlanShare = dn > 0 ? (paidPlanExp / dn) : 0;

  let cu = 0;
  for (let i = 1; i <= d; i++) {
    const varDay = sum(M.filter(t => t.t == 'exp' && !t.reimb && !paidPlanIds.has(t.id) && +t.d.slice(8) == i));
    cu += varDay + dailyPlanShare;
  }
  const dayVar = sum(M.filter(t => t.t == 'exp' && !t.reimb && !paidPlanIds.has(t.id) && +t.d.slice(8) == d));
  const daySpend = Math.round(dayVar + dailyPlanShare);
  cu = Math.round(cu);
  const expectedPace = S.budget ? Math.round((S.budget / dn) * d) : 0;
  const diff = S.budget ? Math.round(cu - expectedPace) : 0;

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



// Cards & Bank Hub Renderer
function cards() {
  const bf = S.cards.map(c => [c, free(c)]), best = [...bf].sort((a, b) => b[1] - a[1])[0], bl = S.cards.map(c => bill(c, V.y, V.m));
  const totLim = sum(S.cards, 'limit'), totOut = S.cards.reduce((s, c) => s + cardOut(c), 0), totAvail = Math.max(0, totLim - totOut), totUtil = totLim ? Math.round(totOut / totLim * 100) : 0, utilK = totUtil < 30 ? 'ok' : totUtil < 50 ? 'wn' : 'bad';

  const bankHub = `
  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 style="margin:0">Bank Accounts & Cash</h3>
      <div style="display:flex;gap:6px">
        <button onclick="accForm()" style="min-height:30px;padding:0 10px;font-size:12px;border-radius:8px">+ Bank</button>
        <button onclick="txForm({t:'xfer'})" style="min-height:30px;padding:0 10px;font-size:12px;border-radius:8px">⇄ Transfer</button>
      </div>
    </div>
    ${S.acc.map(a => `
      <div class="account-card" onclick="accForm(S.acc.find(x=>x.id=='${a.id}'))" style="gap:10px">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
          <div class="account-badge" style="background:linear-gradient(135deg, ${colr(a.id)}, color-mix(in srgb, ${colr(a.id)} 65%, #000))">
            ${(e(a.n || 'B').slice(0, 2)).toUpperCase()}
          </div>
          <div style="min-width:0">
            <b style="font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${e(a.n)}</b>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
              <button type=button onclick="event.stopPropagation();V.t='hist';V.accFilter='${a.id}';render()" style="min-height:24px;padding:0 8px;font-size:11px;border-radius:6px;background:var(--card);border:1px solid var(--line);color:var(--pri);font-weight:600;display:inline-flex;align-items:center;gap:3px" title="View account statement and transactions">
                📄 Statement
              </button>
              <button type=button onclick="event.stopPropagation();reconcileAccForm('${a.id}')" style="min-height:24px;padding:0 8px;font-size:11px;border-radius:6px;background:var(--card);border:1px solid var(--line);color:var(--mut);font-weight:600;display:inline-flex;align-items:center;gap:3px" title="Adjust to actual bank balance">
                ⚖️ Adjust
              </button>
            </div>
          </div>
        </div>
        <div style="text-align:right;flex:none;margin-left:8px">
          <div class="big" style="font-size:17px;font-weight:700;line-height:1.2">${f(accBal(a))}</div>
          <div class=m style="font-size:10.5px;margin-top:2px">Balance</div>
        </div>
      </div>`).join('') || '<div class=m>No bank accounts added yet.</div>'}
  </div>`;

  return `
  ${bankHub}
  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h3 style="margin:0">${mo()} card bills</h3>
      <button onclick="exportCalendarICS()" style="min-height:28px;padding:0 8px;font-size:11px;border-radius:8px">📅 Reminders (.ics)</button>
    </div>
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
    const b = bl[i], o = cardOut(c), u = c.limit ? o / c.limit * 100 : 0, k = u < 30 ? 'ok' : u < 50 ? 'wn' : 'bad';
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
          <div style="display:flex;gap:6px">
            <button class=gb onclick="V.t='hist';V.accFilter='${c.id}';render()" style="min-height:30px;padding:0 8px;font-size:11.5px;border-radius:8px" title="View card statement & check for mismatches">📄 Statement</button>
            <button class=gb onclick="reconcileCardForm('${c.id}')" style="min-height:30px;padding:0 8px;font-size:11.5px;border-radius:8px" title="Adjust live card balance">⚖️ Adjust</button>
            <button class=gb onclick="cardForm(S.cards.find(x=>x.id=='${c.id}'))" style="min-height:30px;padding:0 8px;font-size:11.5px;border-radius:8px">Edit</button>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2;margin:4px 0">
          <svg width=38 height=28 viewBox="0 0 40 30" style="border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,0.3)"><rect width=40 height=30 rx=4 fill="#E5C158" stroke="#B89736" stroke-width=1/><rect x=3 y=3 width=34 height=24 rx=2 fill="none" stroke="#997C22" stroke-width=0.8 stroke-dasharray="6 3"/><line x1=3 y1=15 x2=37 y2=15 stroke="#997C22" stroke-width=0.8/><line x1=15 y1=3 x2=15 y2=27 stroke="#997C22" stroke-width=0.8/><line x1=25 y1=3 x2=25 y2=27 stroke="#997C22" stroke-width=0.8/></svg>
          <div style="display:flex;align-items:center"><div style="width:20px;height:20px;border-radius:50%;background:#EB001B;opacity:0.9"></div><div style="width:20px;height:20px;border-radius:50%;background:#F79E1B;opacity:0.9;margin-left:-8px"></div></div>
        </div>
        <div style="position:relative;z-index:2">
          <div style="font-family:monospace;letter-spacing:2px;font-size:13px;opacity:0.9;margin-bottom:6px">•••• •••• •••• ${maskedNum}</div>
          <div class=r style="padding:0;align-items:flex-end">
            <div><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Current Balance</div><div class=big style="font-size:20px;line-height:1.2">${f(o)}</div></div>
            <div style="text-align:right"><div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:0.8">Credit Limit</div><div style="font-weight:700;font-size:14px">${f(c.limit || 0)}</div></div>
          </div>
        </div>
      </div>

      <div class=r style="padding:0;margin-bottom:4px"><span class=m>Utilization</span><b class="${k}">${Math.round(u)}%</b></div>
      ${bar(u, `var(--${k == 'bad' ? 'bad' : k == 'wn' ? 'warn' : 'ok'})`)}
      
      <div style="margin-top:10px;font-size:13px;display:flex;flex-direction:column;gap:6px">
        <div class=r style="padding:0"><span class=m>Last statement (${b.st.slice(5)}):</span><span>${f(b.billed)} billed · ${f(b.carry)} spent since</span></div>
        <div class=r style="padding:0"><span class=m>Payable by ${b.dueD.slice(5)}</span>${dueBadge}</div>
        <div class=r style="padding:0"><span class=m>Amount due now:</span><b style="font-size:15px;color:${b.pay > 0 ? 'var(--bad)' : 'var(--ok)'}">${f(b.pay)}</b></div>
      </div>

      <div class=row style="margin-top:12px">
        <button onclick="payCard('${c.id}')" class="pri" style="min-height:36px;font-size:12.5px" ${b.pay <= 0 ? 'disabled' : ''}>Pay Due (${f(b.pay)})</button>
        <button onclick="txForm({t:'exp',s:'${c.id}'})" style="min-height:36px;font-size:12.5px">+ Swipe Card</button>
      </div>
    </div>`;
  }).join('')}
  <button class=add onclick="cardForm()">+ Add credit card</button>
  `;
}



// Analytics Screen Renderer
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

  const expC = txC.filter(t => t.t == 'exp' && !t.reimb);
  const expP = txP.filter(t => t.t == 'exp' && !t.reimb);
  const totExpC = sum(expC);
  const totExpP = sum(expP);

  const hasPriorData = txP.length > 0 && totExpP > 0;

  const cPaidPlanIds = new Set(Object.entries(S.paid || {}).filter(([k, txId]) => k.endsWith('|' + cKey)).map(([k, txId]) => txId));
  const cPaidPlanExp = sum(expC.filter(t => cPaidPlanIds.has(t.id)));
  const cDailyPlanShare = dn_c > 0 ? (cPaidPlanExp / dn_c) : 0;

  const pPaidPlanIds = new Set(Object.entries(S.paid || {}).filter(([k, txId]) => k.endsWith('|' + pKey)).map(([k, txId]) => txId));
  const pPaidPlanExp = sum(expP.filter(t => pPaidPlanIds.has(t.id)));
  const pDailyPlanShare = dn_p > 0 ? (pPaidPlanExp / dn_p) : 0;

  // Cumulative daily spend with paid planned bills distributed evenly across month
  let cCum = 0; const ptC = [];
  for (let d = 1; d <= dn_c; d++) {
    const varDayAmt = sum(expC.filter(t => !cPaidPlanIds.has(t.id) && +t.d.slice(8) == d));
    const dayAmt = varDayAmt + cDailyPlanShare;
    if (d <= d_eval) {
      cCum += dayAmt;
      ptC.push([d, Math.round(cCum)]);
    }
  }

  let pCum = 0; const ptP = [];
  if (hasPriorData) {
    for (let d = 1; d <= dn_p; d++) {
      const varDayAmt = sum(expP.filter(t => !pPaidPlanIds.has(t.id) && +t.d.slice(8) == d));
      const dayAmt = varDayAmt + pDailyPlanShare;
      pCum += dayAmt;
      ptP.push([d, Math.round(pCum)]);
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
    (diffAtEval <= 0 ? `<b class=ok>${f(Math.abs(diffAtEval))} slower burn (${Math.abs(Math.round(diffPctAtEval))}%)</b>` :
                       `<b class=bad>+${f(diffAtEval)} faster burn (+${Math.round(diffPctAtEval)}%)</b>`)
  ) : `<span><b>Day ${d_eval}:</b> Cumulative spend: <b>${f(cumAtEvalC)}</b> (${cMonthName})</span>`;

  // 6-Month Trend Overview
  const sixMo = [];
  for (let i = 5; i >= 0; i--) {
    const dtMo = new Date(V.y, V.m - i, 1);
    const k = ym(dtMo.getFullYear(), dtMo.getMonth());
    const label = dtMo.toLocaleString('en-IN', { month: 'short' });
    const txs = S.tx.filter(t => t.d.slice(0, 7) == k && !t.adj);
    const incM = sum(txs.filter(t => t.t == 'inc'));
    const expM = sum(txs.filter(t => t.t == 'exp' && !t.reimb));
    const invM = sum(txs.filter(t => t.t == 'inv'));
    sixMo.push({ k, label, inc: incM, exp: expM, inv: invM, isCurrent: i == 0 });
  }
  const maxSix = Math.max(1, ...sixMo.map(m => Math.max(m.inc, m.exp, m.inv)));

  // Payment Methods
  const payMethods = {};
  expC.forEach(t => { const nm = src(t.s) || 'Other'; payMethods[nm] = (payMethods[nm] || 0) + t.a; });
  const payRows = Object.entries(payMethods).sort((a, b) => b[1] - a[1]);

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

        <line id="momScrubCursor" x1="0" y1="18" x2="0" y2="140" stroke="var(--pri)" stroke-width="1.5" stroke-dasharray="2 2" style="display:none;pointer-events:none"/>
        <circle id="momScrubDotC" cx="0" cy="0" r="4.5" fill="var(--pri)" stroke="#fff" stroke-width="2" style="display:none;pointer-events:none"/>
        <circle id="momScrubDotP" cx="0" cy="0" r="4" fill="var(--mut)" stroke="#fff" stroke-width="1.5" style="display:none;pointer-events:none"/>
      </svg>
    </div>
    <div id="momScrubTip" style="min-height:36px;margin-top:6px;display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line);font-size:12px">
      ${defTipText}
    </div>
  </div>

  <div class=c>
    <h3 style="margin:0 0 10px">6-Month Cash Flow Trend</h3>
    <div style="display:flex;justify-content:space-between;align-items:flex-end;height:120px;padding:10px 0 0;gap:8px">
      ${sixMo.map(m => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;gap:4px">
          <div style="display:flex;gap:2px;align-items:flex-end;height:80px;width:100%;justify-content:center">
            <div title="Income: ${f(m.inc)}" style="width:7px;height:${Math.max(3, Math.round((m.inc / maxSix) * 80))}px;background:var(--ok);border-radius:3px 3px 0 0"></div>
            <div title="Spent: ${f(m.exp)}" style="width:7px;height:${Math.max(3, Math.round((m.exp / maxSix) * 80))}px;background:var(--bad);border-radius:3px 3px 0 0"></div>
            <div title="Invest: ${f(m.inv)}" style="width:7px;height:${Math.max(3, Math.round((m.inv / maxSix) * 80))}px;background:var(--pri);border-radius:3px 3px 0 0"></div>
          </div>
          <span style="font-size:11px;font-weight:${m.isCurrent ? '700' : 'normal'};color:${m.isCurrent ? 'var(--pri)' : 'var(--mut)'}">${m.label}</span>
        </div>`).join('')}
    </div>
  </div>

  <div class=c>
    <h3 style="margin:0 0 8px">Top Spending Methods</h3>
    ${payRows.length ? payRows.slice(0, 5).map(([n, a]) => `
      <div style="margin-bottom:8px">
        <div class=r style="padding:0;font-size:12px"><span>${e(n)}</span><b>${f(a)}</b></div>
        ${bar(totExpC ? (a / totExpC) * 100 : 0, 'var(--pri)')}
      </div>`).join('') : '<div class=m>No expenses recorded.</div>'}
  </div>
  `;
}

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
  if (dotC && cVal !== null) {
    dotC.setAttribute('cx', curX);
    dotC.setAttribute('cy', Y(cVal));
    dotC.style.display = 'block';
  }
  if (dotP && pVal !== null && MoMScrub.pPts.length) {
    dotP.setAttribute('cx', curX);
    dotP.setAttribute('cy', Y(pVal));
    dotP.style.display = 'block';
  }

  if (tip) {
    const diff = cVal !== null ? cVal - pVal : 0;
    tip.innerHTML = `<span><b>Day ${d}:</b> ${MoMScrub.cMonth}: <b>${cVal !== null ? f(cVal) : '—'}</b> · ${MoMScrub.pMonth}: <b>${f(pVal)}</b></span>` +
                    (cVal !== null && MoMScrub.pPts.length ? (diff <= 0 ? `<b class=ok>${f(Math.abs(diff))} slower</b>` : `<b class=bad>+${f(diff)} faster</b>`) : '');
  }
}

function unscrubMoM() {
  const cursor = document.getElementById('momScrubCursor');
  const dotC = document.getElementById('momScrubDotC');
  const dotP = document.getElementById('momScrubDotP');
  if (cursor) cursor.style.display = 'none';
  if (dotC) dotC.style.display = 'none';
  if (dotP) dotP.style.display = 'none';
}



// Plan Tab (Calendar, Bills, Incomes, Goals, People)
function plan() {
  const k = ym(V.y, V.m), pt = V.pt || 'cal';
  const SG = `
  <div class="seg-grid">
    <div class="seg-row">
      <button class="${pt == 'cal' ? 'on' : ''}" onclick="V.pt='cal';render()">📅 Calendar</button>
      <button class="${pt == 'exp' ? 'on' : ''}" onclick="V.pt='exp';render()">💳 Bills</button>
      <button class="${pt == 'inv' ? 'on' : ''}" onclick="V.pt='inv';render()">📈 Invest</button>
    </div>
    <div class="seg-row">
      <button class="${pt == 'inc' ? 'on' : ''}" onclick="V.pt='inc';render()">💰 Income</button>
      <button class="${pt == 'goals' ? 'on' : ''}" onclick="V.pt='goals';render()">🎯 Goals</button>
      <button class="${pt == 'people' ? 'on' : ''}" onclick="V.pt='people';render()">👥 People</button>
    </div>
  </div>`;

  if (pt == 'cal') return SG + cal();

  if (pt == 'people') {
    const totOwed = sum((S.people || []).filter(p => p.balance > 0), 'balance');
    const totOwe = sum((S.people || []).filter(p => p.balance < 0), 'balance');
    const filteredPeople = (S.people || []).filter(p => !V.hideSettled || p.balance !== 0);

    return SG + `
    <div class=c>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0">People Ledger ("Who Owes Me What")</h3>
        <button class=pri onclick="peopleForm()" style="min-height:34px;padding:0 12px;font-size:12px">+ Add Person</button>
      </div>
      <div class=m style="font-size:12px;margin-bottom:10px">Track loans, split bills, and repayments from friends and family.</div>
      
      <div class=tiles style="margin-bottom:12px">
        <div class=tile style="background:rgba(15,118,110,.14)">
          <span class=m>Owed to You</span>
          <b class=ok>${f(totOwed)}</b>
        </div>
        <div class=tile style="background:rgba(185,28,28,.14)">
          <span class=m>You Owe</span>
          <b class=bad>${f(Math.abs(totOwe))}</b>
        </div>
        <div class=tile style="background:rgba(79,70,229,.14)">
          <span class=m>Net Balance</span>
          <b style="color:var(--pri)">${f(totOwed + totOwe)}</b>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding:4px 0">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;color:var(--mut)">
          <input type="checkbox" ${V.hideSettled ? 'checked' : ''} onchange="V.hideSettled=this.checked;localStorage.setItem('fintrak_hide_settled',this.checked?'1':'0');render()" style="width:16px;height:16px;min-height:0;margin:0">
          <span>Hide settled (₹0 balance)</span>
        </label>
        <div style="display:flex;align-items:center;gap:6px">
          ${(S.people||[]).some(p => p.balance === 0) ? `<button type=button onclick="clearAllSettledPeople()" style="min-height:26px;padding:0 8px;font-size:11px;border-radius:6px;background:var(--bg);border:1px solid var(--line);color:var(--mut)">Clear Settled</button>` : ''}
          <span class=m style="font-size:11px">${filteredPeople.length} of ${(S.people||[]).length} people</span>
        </div>
      </div>

      ${filteredPeople.length ? filteredPeople.map(p => `
        <div style="padding:10px 0;border-bottom:1px solid var(--line)">
          <div class=r style="padding:0">
            <div>
              <b>${e(p.name)}</b>
              ${p.phone ? `<span class=m style="font-size:11px"> · ${e(p.phone)}</span>` : ''}
              ${p.notes ? `<div class=m style="font-size:11px">${e(p.notes)}</div>` : ''}
            </div>
            <div style="text-align:right">
              <b style="color:${p.balance > 0 ? 'var(--ok)' : p.balance < 0 ? 'var(--bad)' : 'var(--mut)'}">${p.balance > 0 ? 'Owes you ' + f(p.balance) : p.balance < 0 ? 'You owe ' + f(Math.abs(p.balance)) : '✓ Settled'}</b>
            </div>
          </div>
          <div class=row style="margin-top:8px">
            <button onclick="personTxForm('${p.id}', 'lent')" style="min-height:34px;font-size:12px">+ Lend</button>
            <button onclick="personTxForm('${p.id}', 'repaid')" style="min-height:34px;font-size:12px">+ Repaid</button>
            <button onclick="peopleForm(S.people.find(x=>x.id=='${p.id}'))" style="min-height:34px;font-size:12px">Edit</button>
            ${p.balance === 0 ? `<button onclick="deletePerson('${p.id}')" style="min-height:34px;font-size:12px;color:var(--bad)">Remove</button>` : ''}
          </div>
        </div>
      `).join('') : '<div class=m style="padding:12px 0;text-align:center">No active people matching filter. Tap + Add Person to track someone.</div>'}
    </div>`;
  }

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

  const catBudgetsCard = `
  <div class=c>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <h3 style="margin:0">Category Monthly Budgets</h3>
      <button onclick="catBudgetForm()" style="min-height:30px;padding:0 10px;font-size:12px;border-radius:8px">Edit Limits</button>
    </div>
    <div class=m style="font-size:12px;margin-bottom:8px">Track actual monthly burn against category spending limits.</div>
    ${Object.keys(S.catBudgets).length ? Object.entries(S.catBudgets).map(([cat, lim]) => {
      const sp = sum(mt().filter(t => !t.adj && t.t == 'exp' && !t.reimb && (t.c || '') === cat));
      const p = Math.min(100, Math.round((sp / lim) * 100));
      return `
      <div style="margin-bottom:8px">
        <div class=r style="padding:0;font-size:12px"><span>${e(cat)}</span><b>${f(sp)} / ${f(lim)} (${p}%)</b></div>
        ${bar(p, p >= 100 ? 'var(--bad)' : p >= 80 ? 'var(--warn)' : 'var(--ok)')}
      </div>`;
    }).join('') : '<div class=m>No category budgets configured yet. Tap Edit Limits to set caps for Fuel, Food, Groceries, etc.</div>'}
  </div>`;

  const d = p => S.paid[p.id + '|' + k];
  const L = PL(k).filter(p => p.k == pt).sort((a, b) => (!!a.end - !!b.end) || pDay(a, V.y, V.m) - pDay(b, V.y, V.m));
  const tot = sum(L.map(p => ({ a: pamt(p) })));
  const dn = sum(L.filter(d).map(p => ({ a: pamt(p) })));

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
          <div class=m>${pDayLabel(p, V.y, V.m)} · ${chip(p.s)}${p.end ? (p.from == p.end ? ' · this month only' : ' · until ' + new Date(+p.end.slice(0, 4), +p.end.slice(5) - 1).toLocaleString('en-IN', { month: 'short' })) : ' · repeats'}</div>
        </div>
        <b style="color:${KS[p.k][1]}">${f(pamt(p))}</b>
      </div>`).join('') || '<div class=m>No items planned for this category. Tap below to add.</div>'}
    <button class=add onclick="planForm({k:'${pt}'})">+ Add ${KS[pt][0].toLowerCase()}</button>
  </div>
  ${pt === 'exp' ? catBudgetsCard : ''}
  `;
}

function cal() {
  const P = cpal(), EColor = { exp: P[0], inv: P[4], inc: P[3], due: P[1], stmt: P[8] };
  const y = V.y, m = V.m, dn = new Date(y, m + 1, 0).getDate(), k = ym(y, m), fd = new Date(y, m, 1).getDay(), td = cur() ? T.getDate() : 0, sd = V.cd && V.cd <= dn ? V.cd : (td || 1), E = [], dd = x => +x.slice(8);
  PL(k).forEach(p => E.push({ d: dd(dt(y, m, pDay(p, y, m))), k: p.k, n: p.n, a: pamt(p), id: p.id, done: !!S.paid[p.id + '|' + k] }));
  S.cards.forEach(c => {
    const b = bill(c, y, m);
    E.push({ d: dd(dt(y, m, c.bill)), k: 'stmt', n: c.n, a: 0 });
    if (b.billed) E.push({ d: dd(b.dueD), k: 'due', n: c.n + ' bill', a: b.pay || b.billed, done: b.pay == 0, cid: c.id });
  });
  const M = mt().filter(t => !t.adj), sp = {};
  M.filter(t => t.t == 'exp' && !t.reimb).forEach(t => sp[dd(t.d)] = (sp[dd(t.d)] || 0) + t.a);
  const mx = Math.max(1, ...Object.values(sp));
  const grid = [...Array(fd).fill(0), ...Array.from({ length: dn }, (_, i) => i + 1)].map(d => {
    if (!d) return '<span></span>';
    const h = sp[d] ? (0.12 + 0.5 * sp[d] / mx) : 0;
    return `<button class=day style="background:${sp[d] ? `color-mix(in srgb,var(--pri) ${Math.round(h * 100)}%,transparent)` : 'transparent'};${d == td ? 'border-color:var(--pri);font-weight:700;' : ''}${d == sd ? 'outline:2px solid var(--ink);' : ''}" onclick="V.cd=${d};render()"><span>${d}</span><span class=dots>${E.filter(x => x.d == d).slice(0, 3).map(x => `<i style="background:${EColor[x.k] || 'var(--mut)'}"></i>`).join('')}</span></button>`;
  }).join('');
  const ev = E.filter(x => x.d == sd), txs = M.filter(t => dd(t.d) == sd);
  return `
  <div class=c>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;color:var(--mut);margin-bottom:6px"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
    <div class=cal>${grid}</div>
  </div>
  <div class=c>
    <div class=r style="padding:0;margin-bottom:6px"><b style="font-size:14px">${sd} ${mo()}</b><span class=m>${ev.length} scheduled · ${f(sum(txs.filter(t => t.t == 'exp')))} spent</span></div>
    ${ev.map(x => `<div class=r style="padding:4px 0"><div>${x.done ? '✓ ' : ''}<b>${e(x.n)}</b></div><div style="display:flex;align-items:center"><b style="color:${EColor[x.k]}">${x.a ? f(x.a) : ''}</b>${x.id && !x.done ? `<button class=pri style="margin-left:8px;min-height:32px" onclick="tg('${x.id}')">Mark</button>` : ''}${x.cid && !x.done ? `<button class=pri style="margin-left:8px;min-height:32px" onclick="payCard('${x.cid}')">Pay</button>` : ''}</div></div>`).join('')}
    ${txs.map(t => `<div class=r style="padding:4px 0;opacity:.8"><div onclick="txForm(S.tx.find(x=>x.id=='${t.id}'))" style="cursor:pointer">${e(t.n || t.c)} <span class=m>· ${chip(t.s)}</span></div><b style="color:${KS[t.t][1]}">${t.t == 'exp' ? '-' : '+'}${f(t.a)}</b></div>`).join('')}
  </div>`;
}



// History Screen Renderer with Account Filter & Statement Import
function hist() {
  const fl = V.hf || 'all';
  const sq = (V.sq || '').trim().toLowerCase();
  const cf = V.catFilter || '';
  const af = V.accFilter || '';
  const dFrom = V.dateFrom || '';
  const dTo = V.dateTo || '';

  const A = S.tx.filter(t => t.c !== "Card balance");
  const L = A.filter(t => {
    if (fl != 'all' && t.t != fl) return false;
    if (cf && (t.c || '') !== cf) return false;
    if (af && t.s !== af && t.cd !== af && t.to !== af) return false;
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

  // Dynamic contextual summary header based on selected tab and filters
  let summaryText = '';
  const searchPrefix = sq ? ` matching "${e(V.sq)}"` : '';
  if (fl === 'all') {
    const totIn = sum(L.filter(t => t.t == 'inc'));
    const totExp = sum(L.filter(t => t.t == 'exp'));
    const totInv = sum(L.filter(t => t.t == 'inv'));
    summaryText = `<span style="white-space:nowrap">${L.length} entries${searchPrefix}</span> · <span style="white-space:nowrap">In: <b>${f(totIn)}</b></span> · <span style="white-space:nowrap">Spent: <b>${f(totExp)}</b></span> · <span style="white-space:nowrap">Invest: <b>${f(totInv)}</b></span>`;
  } else if (fl === 'exp') {
    summaryText = `<span style="white-space:nowrap">${L.length} entries${searchPrefix}</span> · <span style="white-space:nowrap">Total Spent: <b>${f(sum(L))}</b></span>`;
  } else if (fl === 'inc') {
    summaryText = `<span style="white-space:nowrap">${L.length} entries${searchPrefix}</span> · <span style="white-space:nowrap">Total Income: <b>${f(sum(L))}</b></span>`;
  } else if (fl === 'inv') {
    summaryText = `<span style="white-space:nowrap">${L.length} entries${searchPrefix}</span> · <span style="white-space:nowrap">Total Invested: <b>${f(sum(L))}</b></span>`;
  } else if (fl === 'pay') {
    summaryText = `<span style="white-space:nowrap">${L.length} entries${searchPrefix}</span> · <span style="white-space:nowrap">Total Card Payments: <b>${f(sum(L))}</b></span>`;
  } else if (fl === 'xfer') {
    summaryText = `<span style="white-space:nowrap">${L.length} entries${searchPrefix}</span> · <span style="white-space:nowrap">Total Transferred: <b>${f(sum(L))}</b></span>`;
  }

  return `
  <div class="seg-grid">
    <div class="seg-row">
      <button class="${fl == 'all' ? 'on' : ''}" onclick="V.hf='all';render()">📋 All</button>
      <button class="${fl == 'exp' ? 'on' : ''}" onclick="V.hf='exp';render()">💸 Spent</button>
      <button class="${fl == 'inc' ? 'on' : ''}" onclick="V.hf='inc';render()">💰 Income</button>
    </div>
    <div class="seg-row">
      <button class="${fl == 'inv' ? 'on' : ''}" onclick="V.hf='inv';render()">📈 Invest</button>
      <button class="${fl == 'pay' ? 'on' : ''}" onclick="V.hf='pay';render()">💳 Cards</button>
      <button class="${fl == 'xfer' ? 'on' : ''}" onclick="V.hf='xfer';render()">⇄ Transfer</button>
    </div>
  </div>

  <div style="position:relative;margin:8px 0 4px">
    <input type=text id=txSearchInp value="${e(V.sq || '')}" placeholder="🔍 Search description, merchant, card..." oninput="V.sq=this.value;render()" style="width:100%;min-height:40px;padding:0 32px 0 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:13px">
    ${V.sq ? `<button onclick="V.sq='';render()" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--mut);min-height:30px;padding:0 8px;font-size:16px;">✕</button>` : ''}
  </div>

  <!-- Account Filter & Statement Reconciliation Strip -->
  <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
    <div style="flex:1;min-width:140px;position:relative">
      <select onchange="V.accFilter=this.value;render()" style="width:100%;min-height:32px;font-size:12px;border-radius:8px;border:1px solid ${V.accFilter ? 'var(--pri)' : 'var(--line)'};background:${V.accFilter ? 'color-mix(in srgb,var(--pri) 10%,var(--card))' : 'var(--card)'};color:var(--ink);padding:0 8px;font-weight:${V.accFilter ? '600' : 'normal'}">
        <option value="">🏦 All Accounts & Cards</option>
        <optgroup label="Bank Accounts & Cash">
          ${S.acc.map(a => `<option value="${a.id}" ${V.accFilter == a.id ? 'selected' : ''}>${e(a.n)} (${f(accBal(a))})</option>`).join('')}
        </optgroup>
        <optgroup label="Credit Cards">
          ${S.cards.map(c => `<option value="${c.id}" ${V.accFilter == c.id ? 'selected' : ''}>${e(c.n)} (${f(cardOut(c))} used)</option>`).join('')}
        </optgroup>
      </select>
    </div>
    <button type=button onclick="openStatementImportDialog('${V.accFilter || ''}')" style="min-height:32px;padding:0 10px;font-size:11.5px;border-radius:8px;background:var(--card);border:1px dashed var(--pri);color:var(--pri);display:flex;align-items:center;gap:4px;white-space:nowrap;font-weight:600">
      📥 Import Statement
    </button>
    ${V.accFilter ? `<button type=button onclick="V.accFilter='';render()" style="min-height:32px;padding:0 8px;font-size:11.5px;border-radius:8px;background:var(--card);border:1px solid var(--line);color:var(--mut)" title="Clear account filter">✕ Reset</button>` : ''}
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;gap:8px">
    <div class=m style="padding:0 2px;font-size:12px;line-height:1.5;flex:1">${summaryText}</div>
    <button type=button onclick="V.showDateFilter=!V.showDateFilter;render()" style="min-height:28px;padding:0 8px;font-size:11px;border-radius:8px;background:${(V.dateFrom || V.dateTo) ? 'color-mix(in srgb,var(--pri) 15%,var(--card))' : 'var(--card)'};border:1px solid ${(V.dateFrom || V.dateTo) ? 'var(--pri)' : 'var(--line)'};color:${(V.dateFrom || V.dateTo) ? 'var(--pri)' : 'var(--ink)'};font-weight:${(V.dateFrom || V.dateTo) ? '700' : 'normal'};display:flex;align-items:center;gap:4px;white-space:nowrap">
      📅 Filter Date ${(V.dateFrom || V.dateTo) ? '●' : ''}
    </button>
  </div>

  ${V.showDateFilter ? `
  <div class=c style="padding:10px 12px;margin-bottom:8px;background:var(--bg);border:1px solid var(--line)">
    <div class=r style="padding:0;margin-bottom:6px"><b style="font-size:12.5px">Custom Date Range:</b><button type=button onclick="V.dateFrom='';V.dateTo='';V.showDateFilter=false;render()" style="min-height:22px;padding:0 6px;font-size:11px;border-radius:6px;border:0;background:none;color:var(--bad)">Clear</button></div>
    <div style="display:flex;gap:8px;align-items:center">
      <div style="flex:1"><label style="font-size:11px;color:var(--mut);display:block">From</label><input type=date value="${V.dateFrom || ''}" onchange="V.dateFrom=this.value;render()" style="width:100%;min-height:34px;font-size:12px;border-radius:8px;border:1px solid var(--line);padding:0 6px;background:var(--card);color:var(--ink)"></div>
      <div style="flex:1"><label style="font-size:11px;color:var(--mut);display:block">To</label><input type=date value="${V.dateTo || ''}" onchange="V.dateTo=this.value;render()" style="width:100%;min-height:34px;font-size:12px;border-radius:8px;border:1px solid var(--line);padding:0 6px;background:var(--card);color:var(--ink)"></div>
    </div>
  </div>` : ''}

  ${Object.keys(G).length ? Object.entries(G).map(([date, items]) => {
    const dayExp = sum(items.filter(t => t.t == 'exp'));
    const dayInc = sum(items.filter(t => t.t == 'inc'));
    const dObj = new Date(date + 'T00:00');
    const dayTitle = dObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return `
      <div style="margin-bottom:8px">
        <div class=r style="font-size:12px;color:var(--mut);padding:4px 2px">
          <span>${dayTitle}</span>
          <span>${dayExp ? 'Spent ' + f(dayExp) : ''} ${dayInc ? '· In +' + f(dayInc) : ''}</span>
        </div>
        <div class=c style="padding:4px 14px">
          ${items.map(t => `
            <div class=r onclick="txForm(S.tx.find(x=>x.id=='${t.id}'))" style="cursor:pointer;padding:10px 0;border-bottom:1px solid var(--line)">
              <div style="flex:1;min-width:0;padding-right:8px">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <b>${e(t.n || t.c || 'Entry')}</b>
                  ${t.reimb ? `<span class="badge-countdown" style="background:color-mix(in srgb,var(--pri) 15%,transparent);color:var(--pri)">🤝 For Friend${t.reimb_pid ? ' · ' + e(((S.people||[]).find(p=>p.id==t.reimb_pid)||{}).name || '') : ''}</span>` : ''}
                  ${(t.adj && !t.reimb) ? `<span class="badge-countdown" style="background:rgba(217,119,6,0.15);color:var(--warn)">⚖️ Outside App Adjustment</span>` : ''}
                </div>
                <div class=m style="font-size:11.5px;margin-top:2px">${e(t.c)} · ${chip(t.s)}${t.to ? ' ➔ ' + chip(t.to) : t.cd ? ' ➔ ' + chip(t.cd) : ''}</div>
              </div>
              <b style="color:${KS[t.t] ? KS[t.t][1] : 'var(--ink)'};font-size:15px;white-space:nowrap">${t.t == 'exp' ? '-' : t.t == 'inc' ? '+' : ''}${f(t.a)}</b>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('') : `
    <div class=c style="text-align:center;padding:24px 14px">
      <div style="font-size:28px;margin-bottom:6px">🔍</div>
      <b>No entries found</b>
      <div class=m style="font-size:12px;margin-top:4px">No transactions match your current filters. Tap + to add one.</div>
    </div>
  `}
  `;
}



// =========================================================================
// Automated Backup & Google Drive Sync Engine
// =========================================================================

let autoBackupCounter = 0;

function checkAndTriggerAutoBackup() {
  const cfg = getDriveSyncConfig();
  // Both settings are completely optional and off by default
  if (!cfg.autoBackupEnabled && !cfg.enabled) return;

  autoBackupCounter++;
  const txCount = S.tx ? S.tx.length : 0;
  if (autoBackupCounter >= 10 || (txCount > 0 && txCount % 10 === 0)) {
    autoBackupCounter = 0;
    if (cfg.autoBackupEnabled) {
      triggerLocalAutoArchive();
    }
    if (cfg.enabled) {
      triggerGoogleDriveSync(true);
    }
  }
}

// 1. Silent Local Storage & Device Download Archive
function triggerLocalAutoArchive() {
  try {
    const backupJson = JSON.stringify(S, null, 2);
    // Maintain rolling snapshot in persistent localStorage / sessionStorage
    localStorage.setItem('fintrak_auto_backup_latest', backupJson);
    localStorage.setItem('fintrak_auto_backup_time', new Date().toISOString());

    // Also download a rolling silent backup file to Downloads folder
    const blob = new Blob([backupJson], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fintrak-auto-backup-${iso(T)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('🛡️ Auto-backup saved (every 10 transactions)!');
  } catch (err) {
    console.warn('Auto-backup local archive notice:', err);
  }
}

// 2. Google Drive / Cloud Webhook Sync Engine
function getDriveSyncConfig() {
  try {
    return JSON.parse(localStorage.getItem('fintrak_drive_sync') || '{}');
  } catch (e) {
    return {};
  }
}

function setDriveSyncConfig(cfg) {
  try {
    localStorage.setItem('fintrak_drive_sync', JSON.stringify(cfg));
  } catch (e) {}
}

async function triggerGoogleDriveSync(isAuto = false) {
  const cfg = getDriveSyncConfig();
  if (!cfg.enabled) {
    if (!isAuto) toast('Google Drive Sync not enabled yet. Configure in Settings.');
    return;
  }

  // Method A: Google Apps Script Webhook (Zero API key / zero complex OAuth setup)
  if (cfg.webhookUrl) {
    try {
      if (!isAuto) toast('⏳ Syncing to Google Drive...');
      const payload = {
        action: 'save',
        filename: `fintrak-data-${iso(T)}.json`,
        data: S,
        timestamp: new Date().toISOString()
      };
      const res = await fetch(cfg.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        localStorage.setItem('fintrak_last_drive_sync', new Date().toISOString());
        if (!isAuto) toast('✓ Successfully synced to Google Drive!');
      } else {
        if (!isAuto) toast('⚠️ Google Drive sync endpoint returned error.');
      }
    } catch (e) {
      console.warn('Drive sync error:', e);
      if (!isAuto) toast('⚠️ Drive sync failed: check internet or webhook URL.');
    }
  } else if (cfg.googleToken) {
    // Method B: Google Drive API v3 (Direct file creation/update in Drive)
    try {
      if (!isAuto) toast('⏳ Syncing to Google Drive...');
      const fileContent = JSON.stringify(S, null, 2);
      const metadata = {
        name: 'fintrak_backup_sync.json',
        mimeType: 'application/json'
      };
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + cfg.googleToken },
        body: form
      });
      if (res.ok) {
        localStorage.setItem('fintrak_last_drive_sync', new Date().toISOString());
        if (!isAuto) toast('✓ Saved backup directly into your Google Drive!');
      } else {
        if (!isAuto) toast('⚠️ Google Drive Token expired. Please re-authenticate.');
      }
    } catch (e) {
      if (!isAuto) toast('⚠️ Google Drive API upload failed.');
    }
  }
}

// Drive Sync Settings Modal
function openDriveSyncSettings() {
  const cfg = getDriveSyncConfig();
  const lastSync = localStorage.getItem('fintrak_last_drive_sync');
  const d = $('#dlg');
  d.innerHTML = `
    <div class=sheet-drag-handle onclick="dlg.close()"></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">☁️ Google Drive & Auto-Backup Sync</h3>
        <span class="badge-countdown" style="background:color-mix(in srgb,var(--pri) 15%,transparent);color:var(--pri)">Realtime Protection</span>
      </div>
      <div class=m style="font-size:12.5px;line-height:1.4">
        Protect your financial records from browser cache clearing. Fintrak can automatically back up your data <b>after every 10 transactions</b> and sync to your personal Google Drive account.
      </div>

      <!-- Toggle 1: Auto-Backup after 10 transactions (Optional) -->
      <div style="padding:10px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line)">
        <label style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:13px;cursor:pointer;margin:0">
          <input type="checkbox" id="autoBackupToggle" ${cfg.autoBackupEnabled ? 'checked' : ''} style="width:18px;height:18px;min-height:0;accent-color:var(--pri);margin:0">
          <span>Auto-Backup After Every 10 Transactions (Optional)</span>
        </label>
        <div class=m style="font-size:11px;margin-top:4px;padding-left:28px">Saves an offline snapshot to device storage and Downloads folder every 10 transactions. Off by default.</div>
      </div>

      <!-- Toggle 2: Google Drive Sync (Optional) -->
      <div style="padding:10px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line)">
        <label style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:13px;cursor:pointer;margin:0">
          <input type="checkbox" id="driveSyncToggle" ${cfg.enabled ? 'checked' : ''} style="width:18px;height:18px;min-height:0;accent-color:var(--pri);margin:0">
          <span>Enable Google Drive Cloud Sync (Optional)</span>
        </label>
        <div class=m style="font-size:11px;margin-top:4px;padding-left:28px">Syncs backups directly to your personal Google Drive folder. Off by default.</div>
      </div>

      <div>
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Option A: Google Apps Script Webhook URL (Recommended - 100% Free & Private)</label>
        <input type="url" id="driveWebhookInp" value="${e(cfg.webhookUrl || '')}" placeholder="https://script.google.com/macros/s/.../exec" style="width:100%;min-height:38px;font-size:12px;border-radius:8px;border:1px solid var(--line);padding:0 8px;background:var(--card);color:var(--ink)">
        <div class=m style="font-size:11px;margin-top:3px">Deploy a 5-line Google Apps Script to save directly into a "Fintrak" folder in your Drive.</div>
      </div>

      <div>
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Option B: Google Drive OAuth Access Token (Direct API)</label>
        <input type="password" id="driveTokenInp" value="${e(cfg.googleToken || '')}" placeholder="ya29.a0..." style="width:100%;min-height:38px;font-size:12px;border-radius:8px;border:1px solid var(--line);padding:0 8px;background:var(--card);color:var(--ink)">
      </div>

      <div class=r style="padding:0;font-size:12px">
        <span class=m>Last Drive Sync:</span>
        <b>${lastSync ? new Date(lastSync).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never synced'}</b>
      </div>

      <div style="display:flex;gap:8px;margin-top:6px">
        <button type="button" class="pri" onclick="saveDriveSyncSettings()" style="flex:1;min-height:38px;font-size:13px">✓ Save & Sync Now</button>
        <button type="button" onclick="triggerLocalAutoArchive()" style="flex:1;min-height:38px;font-size:13px">📥 Download Backup Now</button>
      </div>
    </div>
  `;
  d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}

function saveDriveSyncSettings() {
  const autoBackupEnabled = $('#autoBackupToggle') ? $('#autoBackupToggle').checked : false;
  const enabled = $('#driveSyncToggle') ? $('#driveSyncToggle').checked : false;
  const webhookUrl = $('#driveWebhookInp') ? $('#driveWebhookInp').value.trim() : '';
  const googleToken = $('#driveTokenInp') ? $('#driveTokenInp').value.trim() : '';

  setDriveSyncConfig({ autoBackupEnabled, enabled, webhookUrl, googleToken });
  const d = $('#dlg');
  if (d) d.close();
  toast('✓ Backup & Sync preferences saved!');
  if (enabled) triggerGoogleDriveSync(false);
  render();
}

// =========================================================================
// Bank Statement Parser & Deduplication Engine
// =========================================================================

function parseCSVLine(text) {
  const p = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      p.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  p.push(cur);
  return p.map(s => s.trim());
}

function parseDateCell(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s)) {
    const parts = s.slice(0, 10).split(/[-/]/);
    return `${parts[0]}-${pd(+parts[1])}-${pd(+parts[2])}`;
  }
  const ddmmyyyy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (ddmmyyyy) {
    let d = +ddmmyyyy[1], m = +ddmmyyyy[2], y = +ddmmyyyy[3];
    if (y < 100) y += 2000;
    if (m > 12 && d <= 12) { const tmp = d; d = m; m = tmp; }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${pd(m)}-${pd(d)}`;
    }
  }
  const monMatch = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,4})[-/\s](\d{2,4})/);
  if (monMatch) {
    let d = +monMatch[1];
    let y = +monMatch[3];
    if (y < 100) y += 2000;
    const M3 = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const mi = M3.indexOf(monMatch[2].slice(0, 3).toLowerCase());
    if (mi >= 0) {
      return `${y}-${pd(mi + 1)}-${pd(d)}`;
    }
  }
  return null;
}

function parseAmountCell(raw) {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function categorizeDescription(narration) {
  const norm = String(narration || '').toLowerCase();
  if (/swiggy|zomato|eats|restaurant|cafe|coffee|chai|bakery|dining|food|mcdonald|starbucks|kfc|burger|pizza/i.test(norm)) {
    return 'Restaurant & takeaway';
  } else if (/petrol|fuel|hpcl|bpcl|iocl|shell|cng|gasoline/i.test(norm)) {
    return 'Fuel';
  } else if (/amazon|flipkart|myntra|zara|h&m|shopping|mart|blinkit|zepto|instamart|grocery|supermarket|dmart|nature/i.test(norm)) {
    return 'Groceries';
  } else if (/electricity|bescom|kseb|water|gas|utility|broadband|wifi|jio|airtel|vi|billdesk/i.test(norm)) {
    return 'Electricity, water & gas';
  } else if (/uber|ola|rapido|metro|toll|fastag|parking/i.test(norm)) {
    return 'Taxi & auto';
  } else if (/salary|bonus|interest|dividend|credit|refund|cashback/i.test(norm)) {
    return 'Other income';
  } else if (/rent|maintenance|society|housing/i.test(norm)) {
    return 'Housing & rent';
  } else if (/hospital|clinic|pharmacy|chemist|apollo|medplus|doctor/i.test(norm)) {
    return 'Health & medical';
  } else if (/flight|indigo|air india|irctc|train|hotel|booking|makemytrip/i.test(norm)) {
    return 'Travel & holidays';
  }
  return 'Miscellaneous';
}

function parseBankStatementText(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (!lines.length) return [];

  const sample = lines.slice(0, 15).join('\n');
  const isTab = (sample.split('\t').length > sample.split(',').length);
  const splitLine = isTab ? (l => l.split('\t').map(s => s.trim())) : parseCSVLine;

  let headerIdx = -1;
  let colDate = -1, colDesc = -1, colDebit = -1, colCredit = -1, colAmt = -1, colType = -1;

  for (let i = 0; i < Math.min(25, lines.length); i++) {
    const cols = splitLine(lines[i]).map(c => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    let dIdx = cols.findIndex(c => /date|txn.*date|trans.*date|valuedate/i.test(c));
    let nIdx = cols.findIndex(c => /narration|description|particulars|remark|details|merchant/i.test(c));
    let drIdx = cols.findIndex(c => /debit|dr|withdrawal|withdraw/i.test(c));
    let crIdx = cols.findIndex(c => /credit|cr|deposit/i.test(c));
    let aIdx = cols.findIndex(c => /amount|txnamt/i.test(c));
    let tIdx = cols.findIndex(c => /type|crdr|drcr/i.test(c));

    if (dIdx >= 0 && (nIdx >= 0 || drIdx >= 0 || crIdx >= 0 || aIdx >= 0)) {
      headerIdx = i;
      colDate = dIdx;
      colDesc = nIdx >= 0 ? nIdx : 1;
      colDebit = drIdx;
      colCredit = crIdx;
      colAmt = aIdx;
      colType = tIdx;
      break;
    }
  }

  const rows = [];
  const startLine = headerIdx >= 0 ? headerIdx + 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    if (cols.length < 2) continue;

    let dateVal = null;
    let descVal = '';
    let amtVal = 0;
    let typeVal = 'exp';

    if (headerIdx >= 0) {
      dateVal = parseDateCell(cols[colDate]);
      descVal = (colDesc >= 0 && cols[colDesc]) ? cols[colDesc] : '';

      if (colDebit >= 0 && colCredit >= 0) {
        const dr = parseAmountCell(cols[colDebit]);
        const cr = parseAmountCell(cols[colCredit]);
        if (dr > 0) { amtVal = dr; typeVal = 'exp'; }
        else if (cr > 0) { amtVal = cr; typeVal = 'inc'; }
      } else if (colAmt >= 0) {
        const rawAmt = cols[colAmt];
        amtVal = Math.abs(parseAmountCell(rawAmt));
        if (colType >= 0 && cols[colType]) {
          const tStr = cols[colType].toLowerCase();
          typeVal = /cr|credit|deposit|in/i.test(tStr) ? 'inc' : 'exp';
        } else if (String(rawAmt).includes('-') || String(rawAmt).includes('(')) {
          typeVal = 'exp';
        } else {
          typeVal = /credit|salary|refund|reversal|interest|dividend/i.test(descVal) ? 'inc' : 'exp';
        }
      }
    } else {
      for (let j = 0; j < cols.length; j++) {
        const d = parseDateCell(cols[j]);
        if (d && !dateVal) { dateVal = d; continue; }
        const a = parseAmountCell(cols[j]);
        if (a > 0 && !amtVal) { amtVal = a; continue; }
        if (cols[j].length > descVal.length && !/^\d+$/.test(cols[j])) {
          descVal = cols[j];
        }
      }
    }

    if (dateVal && amtVal > 0) {
      const cleanDesc = descVal.replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').trim() || 'Bank Transaction';
      rows.push({
        d: dateVal,
        a: Math.round(amtVal * 100) / 100,
        n: cleanDesc,
        t: typeVal,
        c: categorizeDescription(cleanDesc)
      });
    }
  }

  return rows;
}

function deduplicateTransactions(candidates, targetAccId) {
  const existing = S.tx.filter(t => t.s === targetAccId || t.cd === targetAccId || t.to === targetAccId);
  const newItems = [];
  const duplicateItems = [];

  candidates.forEach(cand => {
    const isDup = existing.some(ext => {
      if (ext.d !== cand.d) return false;
      if (Math.abs(ext.a - cand.a) > 0.01) return false;
      const extDesc = (ext.n || ext.c || '').toLowerCase();
      const candDesc = (cand.n || cand.c || '').toLowerCase();
      if (extDesc === candDesc) return true;
      if (extDesc.includes(candDesc) || candDesc.includes(extDesc)) return true;
      if (ext.t === cand.t) return true;
      return false;
    });

    if (isDup) {
      duplicateItems.push(cand);
    } else {
      newItems.push(cand);
    }
  });

  return { newItems, duplicateItems };
}

function openStatementImportDialog(preselectedAccId = '') {
  const d = $('#dlg');
  const accOptions = [
    ...S.acc.map(a => `<option value="${a.id}" ${preselectedAccId == a.id ? 'selected' : ''}>🏦 ${e(a.n)} (${f(accBal(a))})</option>`),
    ...S.cards.map(c => `<option value="${c.id}" ${preselectedAccId == c.id ? 'selected' : ''}>💳 ${e(c.n)} (${f(cardOut(c))} used)</option>`)
  ].join('');

  d.innerHTML = `
    <div class=sheet-drag-handle onclick="dlg.close()"></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3 style="margin:0">📥 Import Bank Statement</h3>
        <span class="badge-countdown" style="background:color-mix(in srgb,var(--pri) 15%,transparent);color:var(--pri)">Auto-Deduplicated</span>
      </div>
      <div class=m style="font-size:12.5px;line-height:1.4">
        Upload or paste a CSV/Excel statement from your bank website (HDFC, ICICI, SBI, Axis, etc.).
        Fintrak will automatically parse dates, merchants, and categories, and <b>only add transactions not currently recorded</b> in the app.
      </div>

      <div>
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Target Account / Card:</label>
        <select id="stmtTargetAcc" style="width:100%;min-height:38px;font-size:13px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:0 8px">
          ${accOptions}
        </select>
      </div>

      <div style="border:2px dashed var(--line);border-radius:12px;padding:14px;text-align:center;background:var(--bg)">
        <input type="file" id="stmtFileInput" accept=".csv,.tsv,.txt" style="display:none" onchange="handleStatementFile(this)">
        <button type="button" class="pri" onclick="document.getElementById('stmtFileInput').click()" style="min-height:36px;padding:0 16px;font-size:12.5px;border-radius:8px;margin-bottom:6px">
          📄 Choose CSV / Statement File
        </button>
        <div class="m" style="font-size:11px">Supports CSV, TSV, or exported text statements</div>
      </div>

      <div style="text-align:center;font-size:11.5px;color:var(--mut);margin:-4px 0">- OR PASTE STATEMENT ROWS -</div>

      <div>
        <textarea id="stmtPasteInp" placeholder="Date, Narration, Withdrawal, Deposit\n02/11/2026, SWIGGY BANGALORE, 450.00, \n03/11/2026, SALARY CREDIT, , 150000.00" style="width:100%;height:90px;font-family:monospace;font-size:11.5px;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);box-sizing:border-box"></textarea>
      </div>

      <div id="stmtPreviewArea" style="display:none"></div>

      <div class="row" style="margin-top:4px">
        <button type="button" onclick="dlg.close()">Cancel</button>
        <button type="button" class="pri" onclick="processPastedStatement()">Parse & Preview</button>
      </div>
    </div>
  `;
  d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}

function handleStatementFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    document.getElementById('stmtPasteInp').value = text;
    processPastedStatement();
  };
  reader.readAsText(file);
}

function processPastedStatement() {
  const text = document.getElementById('stmtPasteInp').value.trim();
  const accId = document.getElementById('stmtTargetAcc').value;
  if (!text) return alert('Please upload a file or paste statement text.');
  if (!accId) return alert('Please select a target account.');

  const parsed = parseBankStatementText(text);
  if (!parsed.length) return alert('Could not find valid transaction rows with dates and amounts. Please check format.');

  const { newItems, duplicateItems } = deduplicateTransactions(parsed, accId);
  window._parsedStatementImport = { newItems, accId };

  const previewEl = document.getElementById('stmtPreviewArea');
  previewEl.style.display = 'block';
  previewEl.innerHTML = `
    <div style="padding:10px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line);margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <b>Statement Summary:</b>
        <span class="ok" style="font-weight:700">${newItems.length} new transactions</span>
      </div>
      <div class="m" style="font-size:12px">
        Found <b>${parsed.length} total rows</b> · <b>${duplicateItems.length} duplicates skipped</b> (already recorded) · <b>${newItems.length} ready to add</b>
      </div>
      ${duplicateItems.length > 0 ? `<div class="m" style="font-size:11px;color:var(--mut);margin-top:4px">✓ Exact matches on date, amount, and account were automatically filtered out to prevent double-counting.</div>` : ''}
    </div>

    ${newItems.length ? `
      <div style="max-height:160px;overflow-y:auto;border:1px solid var(--line);border-radius:10px;padding:6px;background:var(--card)">
        ${newItems.slice(0, 50).map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 6px;border-bottom:1px solid var(--line);font-size:12px">
            <div>
              <b>${e(t.n)}</b>
              <div class="m" style="font-size:10.5px">${t.d} · ${e(t.c)}</div>
            </div>
            <b class="${t.t == 'inc' ? 'ok' : ''}">${t.t == 'inc' ? '+' : '-'}${f(t.a)}</b>
          </div>
        `).join('')}
        ${newItems.length > 50 ? `<div class="m" style="text-align:center;padding:6px;font-size:11px">+ ${newItems.length - 50} more items...</div>` : ''}
      </div>
      <button type="button" class="pri" onclick="commitStatementImport()" style="width:100%;min-height:38px;margin-top:10px;font-size:13px;border-radius:10px">
        ✓ Add ${newItems.length} New Transactions to ${e(src(accId))}
      </button>
    ` : `
      <div class="m" style="text-align:center;padding:12px;font-size:13px;color:var(--ok)">
        🎉 All ${parsed.length} transactions in this statement are already recorded in Fintrak! Zero mismatch.
      </div>
    `}
  `;
}

function commitStatementImport() {
  const data = window._parsedStatementImport;
  if (!data || !data.newItems || !data.newItems.length) return alert('No new items to import.');

  const isCard = S.cards.some(c => c.id == data.accId);
  data.newItems.forEach(item => {
    S.tx.push({
      id: id(),
      d: item.d,
      t: item.t,
      a: item.a,
      c: item.c,
      n: item.n,
      s: isCard ? '' : data.accId,
      cd: isCard ? data.accId : '',
      adj: 0,
      reimb: 0
    });
  });

  save();
  const d = $('#dlg');
  if (d) d.close();
  toast(`✓ Successfully imported ${data.newItems.length} transactions into ${src(data.accId)}!`);

  V.t = 'hist';
  V.accFilter = data.accId;
  V.dateFrom = '';
  V.dateTo = '';
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

const bk = (encrypt = false, password = '') => {
  let content = JSON.stringify(S, null, 2);
  let fileName = `fintrak-backup-${iso(T)}.json`;

  if (encrypt && password) {
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

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('✓ Backup exported successfully');
  render();
};

const ld = i => {
  const file = i.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      let j = JSON.parse(r.result);
      if (j._fintrak_protected || j._finplan_protected) {
        const pass = prompt('Enter the backup password/PIN:');
        if (j.hash && (!pass || btoa(pass).slice(0, 10) !== j.hash)) return alert('Incorrect password! Restore aborted.');
        if (j.data) {
          try {
            j = JSON.parse(decodeURIComponent(escape(atob(j.data))));
          } catch(e) {
            return alert('Could not decrypt backup. Incorrect password or invalid format.');
          }
        }
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



// Form Modal & Transaction Engines
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
  fm.onsubmit = ev => {
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(fm));
    ['a', 'limit', 'o', 'b', 'bi', 'un'].forEach(k => { if (k in data) data[k] = evalAmt(data[k]); });
    if (ok(data) !== false) d.close();
  };
  if (del) $('#dl').onclick = () => { if (noc || confirm('Delete this item?')) { del(); d.close(); } };
  d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}

function opts(c = 0) {
  const o = S.acc.map(a => [a.id, a.n]);
  return c ? [...o, ...S.cards.map(x => [x.id, x.n + ' (Card)'])] : o;
}

function swatches(cur, card = false, existingObj = null) {
  const customInput = `<div style="display:flex;align-items:center;gap:10px;margin-top:10px;padding:8px 10px;border-radius:10px;background:var(--bg);border:1px solid var(--line)"><input type="color" name="custom_col" value="${cur || (card ? '#4F46E5' : '#0F766E')}" onchange="selectCustomColor(this.value, ${card})" style="width:36px;height:36px;min-height:0;padding:0;border:0;border-radius:50%;cursor:pointer;background:none"><div style="flex:1"><div style="font-size:12px;font-weight:600">Custom Brand Color</div><div class=m style="font-size:11px">Pick any exact hex code</div></div></div>`;
  const P = card ? CARD_PALETTE : PALX;
  return `
  <div style="font-size:12px;margin:8px 0 4px;display:flex;justify-content:space-between;align-items:center"><span class=m>Colour palette (${P.length} Curated + Custom)</span><span style="font-size:11px;color:var(--pri)">Full Palette</span></div>
  <div class=sws id="colorSwatchesContainer">
    ${P.map(c => `<button type=button class="${c == cur ? 'on' : ''}" style="background:${c}" onclick="selectSwatchColor('${c}', ${card})"></button>`).join('')}
  </div>
  <input type=hidden name=col value="${cur || ''}" id="selectedColorInput">
  ${customInput}`;
}

const CARD_PALETTE = [
  '#0F172A', '#1E293B', '#334155', '#1E3A8A', '#1E40AF', '#2563EB', '#0369A1', '#0284C7', '#0891B2', '#0E7490', '#0F766E', '#047857',
  '#312E81', '#4338CA', '#4F46E5', '#6366F1', '#7C3AED', '#6D28D9', '#581C87', '#701A75', '#831843', '#9D174D', '#BE123C', '#E11D48',
  '#7C2D12', '#9A3412', '#C2410C', '#EA580C', '#B45309', '#D97706', '#854D0E', '#713F12', '#365314', '#166534', '#14532D', '#064E3B',
  '#000000', '#18181B', '#27272A', '#3F3F46', '#52525B', '#475569', '#374151', '#1F2937', '#111827', '#2A2050', '#3B1845', '#451A25'
];

window.selectSwatchColor = (c, card) => {
  const inp = document.getElementById('selectedColorInput');
  if (inp) inp.value = c;
  const container = document.getElementById('colorSwatchesContainer');
  if (container) {
    container.querySelectorAll('button').forEach(b => {
      if (b.style.background === c || b.getAttribute('style').includes(c)) b.classList.add('on');
      else b.classList.remove('on');
    });
  }
};
window.selectCustomColor = (c, card) => {
  window.selectSwatchColor(c, card);
};

const defCol = o => o.col || (o.id ? colr(o.id) : (o.limit ? '#4F46E5' : '#0F766E'));

function cardForm(o = {}) {
  form(o.id ? 'Edit credit card' : 'Add credit card', [
    { k: 'n', l: 'Card name (e.g. Apex Millennia, Sapphire)', v: o.n },
    { k: 'limit', l: 'Credit limit', t: 'number', v: o.limit },
    { k: 'bill', l: 'Billing (statement) day of month', t: 'number', v: o.bill || 15 },
    { k: 'due', l: 'Payment due day of month', t: 'number', v: o.due || 5 },
    { k: 'pa', l: 'Usually paid from (bank account)', o: opts(), v: o.pa },
    { k: 'col', l: '', h: swatches(defCol(o), true, o) }
  ],
  r => {
    r.limit = +r.limit; r.bill = +r.bill; r.due = +r.due;
    if (!r.n || !r.limit || !r.bill || !r.due) return no('Name, limit, bill day and due day are needed');
    if (r.bill < 1 || r.bill > 31 || r.due < 1 || r.due > 31) return no('Bill/due day must be 1-31');
    put(S.cards, o, r);
    save();
  },
  o.id && (() => { S.cards = S.cards.filter(x => x.id != o.id); save(); }));
}

function accForm(o = {}) {
  form(o.id ? 'Edit account' : 'Add bank account', [
    { k: 'n', l: 'Account name', v: o.n },
    { k: 'o', l: 'Opening balance', t: 'number', v: o.o },
    ...(o.id ? [{ k: 'rec_btn', l: '', h: `<div style="margin:8px 0;padding:10px;border-radius:10px;background:var(--bg);border:1px dashed var(--line)"><div class=m style="font-size:12px;margin-bottom:6px">Missed logging some expenses or deposits? Adjust to your real bank balance:</div><button type=button class=pri onclick="dlg.close();reconcileAccForm('${o.id}')" style="width:100%;min-height:34px;font-size:12px">⚖️ Adjust / Reconcile Balance</button></div>` }] : []),
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

function reconcileCardForm(cardId) {
  const c = S.cards.find(x => x.id == cardId);
  if (!c) return;
  const currentOut = cardOut(c);

  const d = $('#dlg');
  d.innerHTML = `
    <div class=sheet-drag-handle onclick="dlg.close()"></div>
    <form id="reconcileCardForm" style="display:flex;flex-direction:column;gap:10px">
      <h3 style="margin:0">⚖️ Reconcile ${e(c.n)} Balance</h3>
      <div style="padding:10px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line);font-size:12.5px;line-height:1.4">
        <div class=r style="padding:0"><span>Current App Outstanding:</span><b style="font-size:14px">${f(currentOut)}</b></div>
        <div class=m style="font-size:11.5px;margin-top:4px">Enter your actual outstanding from your bank app/statement. Fintrak will auto-calculate unlogged card swipes or refunds to align balances 100%.</div>
      </div>
      <label style="font-size:13px;font-weight:600">Actual Live Card Outstanding (₹)<input type="number" step="any" inputmode="decimal" id="realCardBalInp" value="${currentOut}" required style="font-size:16px;font-weight:700"></label>
      <div id="reconcileCardDiffCard" style="display:none;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:600"></div>
      <label style="font-size:12px">Adjustment Date<input type="date" id="reconcileCardDateInp" value="${iso(T)}"></label>
      <label style="font-size:12px">Description / Note<input type="text" id="reconcileCardNoteInp" value="Balance adjustment"></label>
      <div class=row style="margin-top:4px">
        <button type=button onclick="dlg.close()">Cancel</button>
        <button type=submit class=pri>Save & Adjust</button>
      </div>
    </form>
  `;

  const realInp = $('#realCardBalInp'), diffCard = $('#reconcileCardDiffCard');
  const updateDiff = () => {
    const realVal = evalAmt(realInp.value);
    const diff = Math.round((realVal - currentOut) * 100) / 100;
    if (diff === 0) {
      diffCard.style.display = 'block';
      diffCard.style.background = 'color-mix(in srgb,var(--ok) 15%,transparent)';
      diffCard.style.color = 'var(--ok)';
      diffCard.innerHTML = '✓ Card balance matches your app records.';
    } else if (diff > 0) {
      diffCard.style.display = 'block';
      diffCard.style.background = 'color-mix(in srgb,var(--warn) 15%,transparent)';
      diffCard.style.color = 'var(--warn)';
      diffCard.innerHTML = `⚠️ Unlogged Spending: <b>+${f(diff)}</b> will be added to history.`;
    } else {
      diffCard.style.display = 'block';
      diffCard.style.background = 'color-mix(in srgb,var(--ok) 15%,transparent)';
      diffCard.style.color = 'var(--ok)';
      diffCard.innerHTML = `💳 Unlogged Payment / Refund: <b>${f(Math.abs(diff))}</b> will reduce your balance.`;
    }
  };
  realInp.addEventListener('input', updateDiff);
  updateDiff();

  $('#reconcileCardForm').onsubmit = ev => {
    ev.preventDefault();
    const realVal = evalAmt(realInp.value);
    const diff = Math.round((realVal - currentOut) * 100) / 100;
    if (diff === 0) { toast('✓ Card balance is already in sync!'); d.close(); return; }

    const dVal = $('#reconcileCardDateInp').value || iso(T);
    const nVal = $('#reconcileCardNoteInp').value.trim() || 'Balance adjustment';

    if (diff > 0) {
      S.tx.push({
        id: id(),
        d: dVal,
        t: 'exp',
        a: diff,
        c: 'Miscellaneous',
        n: `${c.n}: ${nVal}`,
        s: c.id,
        adj: 1,
        reimb: 0
      });
      toast(`✓ Recorded ${f(diff)} unlogged card spending on ${c.n}`);
    } else {
      const refundAmt = Math.abs(diff);
      S.tx.push({
        id: id(),
        d: dVal,
        t: 'pay',
        a: refundAmt,
        c: 'Card payment',
        n: `${c.n}: ${nVal}`,
        s: '',
        cd: c.id,
        adj: 1
      });
      toast(`✓ Recorded ${f(refundAmt)} card refund / payment adjustment on ${c.n}`);
    }
    save();
    d.close();
  };

  d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}

function reconcileAccForm(accId) {
  const a = S.acc.find(x => x.id == accId);
  if (!a) return;
  const currentBal = accBal(a);

  const d = $('#dlg');
  d.innerHTML = `
    <div class=sheet-drag-handle onclick="dlg.close()"></div>
    <form id="reconcileForm" style="display:flex;flex-direction:column;gap:10px">
      <h3 style="margin:0">⚖️ Reconcile ${e(a.n)} Balance</h3>
      <div style="padding:10px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line);font-size:12.5px;line-height:1.4">
        <div class=r style="padding:0"><span>Current App Balance:</span><b style="font-size:14px">${f(currentBal)}</b></div>
        <div class=m style="font-size:11.5px;margin-top:4px">Enter your actual balance from your bank app/SMS. Fintrak will auto-calculate unlogged spending or deposits to match your real account.</div>
      </div>
      <label style="font-size:13px;font-weight:600">Actual Live Bank Balance (₹)<input type="number" step="any" inputmode="decimal" id="realBalInp" value="${currentBal}" required style="font-size:16px;font-weight:700"></label>
      <div id="reconcileDiffCard" style="display:none;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:600"></div>
      <label style="font-size:12px">Adjustment Date<input type="date" id="reconcileDateInp" value="${iso(T)}"></label>
      <label style="font-size:12px">Description / Note<input type="text" id="reconcileNoteInp" value="Balance adjustment"></label>
      <div class=row style="margin-top:4px">
        <button type=button onclick="dlg.close()">Cancel</button>
        <button type=submit class=pri>Save & Adjust</button>
      </div>
    </form>
  `;

  const realInp = $('#realBalInp'), diffCard = $('#reconcileDiffCard');
  const updateDiff = () => {
    const realVal = evalAmt(realInp.value);
    const diff = Math.round((realVal - currentBal) * 100) / 100;
    if (diff === 0) {
      diffCard.style.display = 'block';
      diffCard.style.background = 'color-mix(in srgb,var(--ok) 15%,transparent)';
      diffCard.style.color = 'var(--ok)';
      diffCard.innerHTML = '✓ Balance matches your app records.';
    } else if (diff < 0) {
      diffCard.style.display = 'block';
      diffCard.style.background = 'color-mix(in srgb,var(--bad) 15%,transparent)';
      diffCard.style.color = 'var(--bad)';
      diffCard.innerHTML = `⚠️ Unlogged Spending: <b>${f(Math.abs(diff))}</b> will be added as expense.`;
    } else {
      diffCard.style.display = 'block';
      diffCard.style.background = 'color-mix(in srgb,var(--ok) 15%,transparent)';
      diffCard.style.color = 'var(--ok)';
      diffCard.innerHTML = `💰 Unlogged Income: <b>+${f(diff)}</b> will be added as deposit.`;
    }
  };
  realInp.addEventListener('input', updateDiff);
  updateDiff();

  $('#reconcileForm').onsubmit = ev => {
    ev.preventDefault();
    const realVal = evalAmt(realInp.value);
    const diff = Math.round((realVal - currentBal) * 100) / 100;
    if (diff === 0) { toast('✓ Balance is already in sync!'); d.close(); return; }

    const dVal = $('#reconcileDateInp').value || iso(T);
    const nVal = $('#reconcileNoteInp').value.trim() || 'Balance adjustment';

    if (diff < 0) {
      const spendAmt = Math.abs(diff);
      S.tx.push({
        id: id(),
        d: dVal,
        t: 'exp',
        a: spendAmt,
        c: 'Miscellaneous',
        n: `${a.n}: ${nVal}`,
        s: a.id,
        adj: 1,
        reimb: 0
      });
      toast(`✓ Recorded ${f(spendAmt)} unlogged spending for ${a.n}`);
    } else {
      S.tx.push({
        id: id(),
        d: dVal,
        t: 'inc',
        a: diff,
        c: 'Other income',
        n: `${a.n}: ${nVal}`,
        s: a.id,
        adj: 1,
        reimb: 0
      });
      toast(`✓ Recorded ${f(diff)} unlogged deposit for ${a.n}`);
    }
    save();
    d.close();
  };

  d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}



// Planned Form and Toggle Engines
function planForm(o = {}) {
  const ruleOpts = [
    ['', 'Specific Day of Month (e.g. 5th, 15th)'],
    ['1-fri', '1st Friday of month'],
    ['2-fri', '2nd Friday of month'],
    ['3-fri', '3rd Friday of month'],
    ['4-fri', '4th Friday of month'],
    ['last-fri', 'Last Friday of month'],
    ['1-mon', '1st Monday of month'],
    ['2-mon', '2nd Monday of month'],
    ['3-mon', '3rd Monday of month'],
    ['4-mon', '4th Monday of month'],
    ['last-mon', 'Last Monday of month'],
    ['1-sat', '1st Saturday of month'],
    ['2-sat', '2nd Saturday of month'],
    ['3-sat', '3rd Saturday of month'],
    ['4-sat', '4th Saturday of month'],
    ['last-sat', 'Last Saturday of month'],
    ['1-sun', '1st Sunday of month'],
    ['2-sun', '2nd Sunday of month'],
    ['3-sun', '3rd Sunday of month'],
    ['4-sun', '4th Sunday of month'],
    ['last-sun', 'Last Sunday of month'],
    ['1-thu', '1st Thursday of month'],
    ['2-thu', '2nd Thursday of month'],
    ['3-thu', '3rd Thursday of month'],
    ['4-thu', '4th Thursday of month'],
    ['last-thu', 'Last Thursday of month'],
    ['1-tue', '1st Tuesday of month'],
    ['2-tue', '2nd Tuesday of month'],
    ['3-tue', '3rd Tuesday of month'],
    ['4-tue', '4th Tuesday of month'],
    ['last-tue', 'Last Tuesday of month'],
    ['1-wed', '1st Wednesday of month'],
    ['2-wed', '2nd Wednesday of month'],
    ['3-wed', '3rd Wednesday of month'],
    ['4-wed', '4th Wednesday of month'],
    ['last-wed', 'Last Wednesday of month']
  ];

  form(o.id ? 'Edit planned item' : 'New planned item', [
    { k: 'n', l: 'Name (e.g. Home loan EMI, SIP, Allowance)', v: o.n },
    { k: 'k', l: 'Type', o: [['exp', 'Payment'], ['inv', 'Investment'], ['inc', 'Expected income']], v: o.k || 'exp' },
    { k: 'a', l: 'Amount per month', t: 'number', v: o.a },
    { k: 'rule', l: 'Schedule Recurrence', o: ruleOpts, v: o.rule || '' },
    { k: 'day', l: 'Day of month (1-31, used if specific day selected)', t: 'number', v: o.day || 1 },
    { k: 's', l: 'Account or card', o: opts(1), v: o.s },
    { k: 'c', l: 'Category', h: catSel(o.k || 'exp', o.c) },
    { k: 'rep', l: 'Repeats', o: [['m', 'Every month'], ['1', 'This month only (stops after it)']], v: o.end ? '1' : 'm' }
  ],
  r => {
    r.a = +r.a;
    if (r.rule) {
      r.day = pDay({ rule: r.rule }, V.y, V.m);
    } else {
      r.day = +r.day;
      r.rule = '';
    }
    if (!r.n || !r.a || !r.s || (!r.rule && (r.day < 1 || r.day > 31))) {
      return no('Name, amount, source and valid schedule are needed');
    }
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

function delPlan(o) {
  const k = ym(V.y, V.m);
  const all = () => {
    S.plan = S.plan.filter(x => x.id != o.id);
    Object.keys(S.paid).forEach(x => { if (x.startsWith(o.id + '|')) delete S.paid[x]; });
    save();
  };
  if (o.from && o.from >= k) {
    if (confirm('Delete "' + o.n + '"?')) all();
    return;
  }
  if (confirm('Stop "' + o.n + '" from ' + mo() + ' onward? Earlier months keep it.')) {
    o.end = S.paid[o.id + '|' + k] ? k : pm(V.y, V.m - 1);
    save();
  } else if (confirm('Delete "' + o.n + '" from ALL months? Past entries stay in History.')) {
    all();
  }
}

function confirmSheet({ icon, color, title, subtitle, details, confirmLabel, cancelLabel, confirmClass, onConfirm }) {
  const d = $('#dlg');
  d.innerHTML = `
    <div class=sheet-drag-handle onclick="dlg.close()"></div>
    <div style="padding:10px 0 6px;text-align:center">
      <div style="width:48px;height:48px;border-radius:24px;background:color-mix(in srgb,${color || 'var(--pri)'} 15%,transparent);color:${color || 'var(--pri)'};display:inline-flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:8px">
        ${icon || '⚠️'}
      </div>
      <h3 style="margin:0 0 4px;font-size:18px">${title}</h3>
      ${subtitle ? `<div class=m style="font-size:13px;margin-bottom:12px">${subtitle}</div>` : ''}
    </div>
    ${details ? `<div style="padding:10px 12px;border-radius:12px;background:var(--bg);border:1px solid var(--line);margin-bottom:14px;font-size:12.5px">${details}</div>` : ''}
    <div class=row style="margin-top:8px">
      <button type=button onclick="dlg.close()" style="flex:1;min-height:42px">${cancelLabel || 'Cancel'}</button>
      <button type=button id="confirmSheetBtn" class="${confirmClass || 'pri'}" style="flex:1;min-height:42px">${confirmLabel || 'Confirm'}</button>
    </div>
  `;
  window._lastConfirmSheet = { onConfirm };
  const btn = $('#confirmSheetBtn');
  if (btn) btn.onclick = () => {
    d.close();
    if (onConfirm) onConfirm();
  };
  d.showModal();
  history.pushState({ t: V.t, dlg: 1 }, '');
}

function markPlannedPaymentForm(p, k) {
  const resolvedDay = pDay(p, V.y, V.m);
  const scheduledDate = dt(V.y, V.m, resolvedDay);
  const todayDate = iso(T);
  const defaultAmt = pamt(p) || p.a || 0;
  const typeLabel = p.k === 'inc' ? 'Received' : p.k === 'inv' ? 'Invested' : 'Paid';

  const datePills = `
    <div style="display:flex;gap:8px;margin:4px 0 8px">
      <button type="button" onclick="document.querySelector('#dlg [name=d]').value='${scheduledDate}'" style="flex:1;min-height:34px;font-size:12px;border-radius:8px;background:var(--bg);border:1px solid var(--line)">
        📅 Scheduled (${pDayLabel(p, V.y, V.m)})
      </button>
      <button type="button" onclick="document.querySelector('#dlg [name=d]').value='${todayDate}'" style="flex:1;min-height:34px;font-size:12px;border-radius:8px;background:var(--bg);border:1px solid var(--line)">
        ⚡ Today (${new Date().toLocaleDateString('en-IN', {day:'numeric', month:'short'})})
      </button>
    </div>
  `;

  form(`Mark ${p.n} as ${typeLabel}`, [
    { k: 'date_pills', l: 'Payment Date', h: datePills },
    { k: 'd', l: 'Date (tap button above or pick custom date)', t: 'date', v: scheduledDate },
    { k: 'a', l: 'Actual Amount (₹)', t: 'number', v: defaultAmt },
    { k: 's', l: p.k === 'inc' ? 'Deposit into Account' : 'Paid from Account or Card', o: opts(p.k === 'exp'), v: p.s },
    { k: 'n', l: 'Note (optional)', v: p.n }
  ],
  r => {
    const amt = +r.a;
    if (!amt || !r.s) return no('Amount and account are needed');
    const payDate = r.d || scheduledDate;

    delete r.date_pills;
    const t = {
      id: id(),
      d: payDate,
      t: p.k,
      a: amt,
      c: p.c || p.n,
      n: r.n || p.n,
      s: r.s
    };
    S.tx.push(t);
    S.paid[k] = t.id;
    save();
    toast(`✓ Recorded ${p.n} (${f(amt)}) on ${payDate}`);
  });
}

const tg = i => {
  const p = S.plan.find(x => x.id == i), k = i + '|' + ym(V.y, V.m);
  if (!p) return;

  if (S.paid[k]) {
    const existingTx = S.tx.find(t => t.id == S.paid[k]);
    confirmSheet({
      icon: '↩️',
      color: 'var(--warn)',
      title: 'Unmark Payment?',
      subtitle: p.n,
      details: `
        <div class="r" style="padding:2px 0"><span>Recorded Date:</span><b>${existingTx ? existingTx.d : 'Scheduled'}</b></div>
        <div class="r" style="padding:2px 0"><span>Recorded Amount:</span><b style="color:var(--pri)">${existingTx ? f(existingTx.a) : f(pamt(p))}</b></div>
        <div class="m" style="font-size:11.5px;margin-top:6px">Unmarking will delete this transaction from your History feed and mark this payment as pending.</div>
      `,
      cancelLabel: 'Keep as Paid',
      confirmLabel: 'Yes, Unmark',
      confirmClass: 'bad',
      onConfirm: () => {
        S.tx = S.tx.filter(t => t.id != S.paid[k]);
        delete S.paid[k];
        save();
        toast(`✓ Unmarked "${p.n}"`);
      }
    });
    return;
  }

  markPlannedPaymentForm(p, k);
};

function payCard(cid) {
  const c = S.cards.find(x => x.id == cid), b = bill(c, V.y, V.m);
  form('Pay ' + c.n, [
    { k: 'a', l: 'Amount', t: 'number', v: b.pay },
    { k: 'd', l: 'Date', t: 'date', v: cur() ? iso(T) : dt(V.y, V.m, c.due) },
    { k: 's', l: 'Paid from bank account', o: opts(), v: c.pa }
  ],
  r => {
    r.a = +r.a;
    if (!r.a || !r.s) return no('Amount and bank account are needed');
    S.tx.push({ id: id(), d: r.d, t: 'pay', a: r.a, c: 'Card repayments', n: c.n + ' bill payment', s: r.s, cd: c.id });
    save();
    toast('✓ Recorded ' + f(r.a) + ' payment for ' + c.n);
  });
}



// Transactions and People Form Engines
function txForm(o = {}) {
  const isExp = (o.t || 'exp') == 'exp';
  const isXfer = o.t == 'xfer';
  const hTitle = o.id ? 'Edit entry' : (isXfer ? 'Transfer money' : 'Add ' + (KS[o.t || 'exp'] ? KS[o.t || 'exp'][0].toLowerCase() : 'transaction'));

  form(hTitle, [
    ...((!o.id && isExp) ? [{ k: 'sms_btn', l: '', h: `<div style="margin-bottom:8px"><button type=button onclick="openSmsParser()" style="width:100%;font-size:12px;min-height:36px;border-radius:8px;background:color-mix(in srgb,var(--pri) 12%,transparent);color:var(--pri);border:1px dashed var(--pri)">📋 Paste Bank SMS / UPI to Auto-Fill</button></div>` }] : []),
    { k: 'd', l: 'Date', t: 'date', v: o.d || iso(T) },
    { k: 'a', l: 'Amount', t: 'number', v: o.a },
    ...(isXfer ? [
      { k: 's', l: 'From (source account)', o: opts(), v: o.s },
      { k: 'to', l: 'To (destination account)', o: opts(), v: o.to },
      { k: 'n', l: 'Note (optional)', v: o.n || 'Transfer' }
    ] : [
      { k: 'n', l: 'Description / Merchant', v: o.n },
      { k: 'c', l: 'Category', h: catSel(o.t || 'exp', o.c) },
      { k: 's', l: 'Account or card (card only for expenses)', o: opts(isExp), v: o.s },
      ...(isExp ? [{ k: 'reimb_box', l: '', h: `
        <div style="margin:10px 0;padding:10px;border-radius:12px;background:var(--bg);border:1px solid var(--line)">
          <label style="display:flex;align-items:center;gap:8px;margin:0;cursor:pointer;font-weight:600;font-size:13px;color:var(--ink)">
            <input type="checkbox" name="reimb" value="1" ${o.reimb ? 'checked' : ''} onchange="const row=document.getElementById('reimbPersonRow');if(row)row.style.display=this.checked?'':'none'" style="width:18px;height:18px;min-height:0;margin:0;flex:none;accent-color:var(--pri)">
            <span>🤝 Paid for a friend (Reimbursable)</span>
          </label>
          <div class="m" style="font-size:11px;margin-top:4px">Excludes this swipe from personal living spend & analytics, while keeping card balance & liability 100% accurate.</div>
          <div id="reimbPersonRow" style="margin-top:8px;${o.reimb ? '' : 'display:none'}">
            <label style="font-size:12px;margin-bottom:4px;display:block">Who owes you? (Links to People Ledger)</label>
            <select name="reimb_pid" style="width:100%;min-height:38px;font-size:13px;border-radius:8px;border:1px solid var(--line);background:var(--card)">
              <option value="">- Select person (optional) -</option>
              ${(S.people||[]).map(p => `<option value="${p.id}" ${o.reimb_pid==p.id?'selected':''}>${e(p.name)} (${p.balance > 0 ? 'owes '+f(p.balance) : p.balance < 0 ? 'you owe '+f(Math.abs(p.balance)) : 'settled'})</option>`).join('')}
            </select>
          </div>
        </div>
      ` }] : [])
    ])
  ],
  r => {
    r.a = +r.a;
    if (!r.d || !r.a || !r.s) return no('Date, amount and account are needed');
    if (isXfer) {
      if (!r.to) return no('Destination account is needed');
      if (r.s == r.to) return no('Source and destination accounts must be different');
      r.t = 'xfer';
      r.c = 'Transfer';
    } else {
      r.t = o.t || 'exp';
      if (!r.c) r.c = r.t == 'inc' ? 'Other income' : r.t == 'inv' ? 'Other investments' : 'Miscellaneous';
      if (r.t != 'exp' && S.cards.some(c => c.id == r.s)) return no('Only expenses can be charged to a credit card');
      const cc = S.cards.find(x => x.id == r.cd);
      if (cc) cc.pa = r.s;
    }

    const wasReimb = !!o.reimb;
    const nowReimb = r.reimb === '1' || r.reimb === 1 || r.reimb === true || r.reimb === 'on';
    r.reimb = nowReimb ? 1 : 0;
    r.reimb_pid = nowReimb ? (r.reimb_pid || '') : '';

    const oldPid = o.reimb_pid || '';
    const newPid = r.reimb_pid || '';

    if (wasReimb && oldPid && (oldPid !== newPid || !nowReimb)) {
      const oldP = (S.people || []).find(p => p.id == oldPid);
      if (oldP) {
        oldP.balance = Math.round((oldP.balance - o.a) * 100) / 100;
        oldP.txs = oldP.txs || [];
        oldP.txs.push({ id: id(), d: iso(T), a: -o.a, type: 'reversal', note: `Reversed: ${o.n || o.c}` });
      }
    }
    if (nowReimb && newPid) {
      const newP = (S.people || []).find(p => p.id == newPid);
      if (newP) {
        const addedAmt = (wasReimb && oldPid === newPid) ? (r.a - o.a) : r.a;
        newP.balance = Math.round((newP.balance + addedAmt) * 100) / 100;
        newP.txs = newP.txs || [];
        newP.txs.push({ id: id(), d: iso(T), a: addedAmt, type: 'lent', note: `Paid for friend: ${r.n || r.c}` });
      }
    }

    delete r.sms;
    delete r.reimb_box;

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
    toast('✓ Entry deleted', 'Undo', lastDeletedAction);
  }));
}

let lastDeletedAction = null;

function peopleForm(o = {}) {
  form(o.id ? 'Edit person' : 'Add person to People Ledger', [
    { k: 'name', l: 'Full Name', v: o.name },
    { k: 'phone', l: 'Phone number (optional)', v: o.phone || '' },
    { k: 'initial_bal', l: 'Current Balance (₹)', t: 'number', v: o.balance || 0, h: o.id ? undefined : '<div class=m style="font-size:11px;margin-top:2px">Positive (+) means they owe you. Negative (-) means you owe them.</div>' },
    { k: 'notes', l: 'Notes / Context', v: o.notes || '' }
  ],
  r => {
    if (!r.name) return no('Name is needed');
    const initBal = evalAmt(r.initial_bal);
    const pObj = {
      name: r.name.trim(),
      phone: (r.phone || '').trim(),
      notes: (r.notes || '').trim(),
      balance: o.id ? o.balance : initBal,
      txs: o.txs || (initBal !== 0 ? [{ id: id(), d: iso(T), a: initBal, type: initBal > 0 ? 'lent' : 'borrowed', note: 'Initial balance' }] : [])
    };
    put(S.people, o, pObj);
    save();
    toast(`✓ Saved ${r.name}`);
  },
  o.id && (() => deletePerson(o.id)));
}

function deletePerson(pid) {
  const p = S.people.find(x => x.id == pid);
  if (!p) return;
  if (confirm(`Remove ${p.name} from People Ledger? Existing linked transactions in History will remain intact.`)) {
    S.people = S.people.filter(x => x.id != pid);
    save();
    toast(`✓ Removed ${p.name}`);
  }
}

function clearAllSettledPeople() {
  const settled = (S.people || []).filter(p => p.balance === 0);
  if (!settled.length) return alert('No settled people found.');
  if (confirm(`Remove all ${settled.length} settled people (₹0 balance) from the list?`)) {
    S.people = S.people.filter(p => p.balance !== 0);
    save();
    toast(`✓ Cleared ${settled.length} settled people`);
  }
}

function personTxForm(pid, txType) {
  const p = S.people.find(x => x.id == pid);
  if (!p) return;
  const isLent = txType === 'lent';
  const label = isLent ? `Lend money to ${p.name}` : `Repayment received from ${p.name}`;

  form(label, [
    { k: 'a', l: 'Amount (₹)', t: 'number', v: '' },
    { k: 'd', l: 'Date', t: 'date', v: iso(T) },
    { k: 's', l: isLent ? 'Paid from account' : 'Deposit into bank account', o: opts(false), v: S.acc[0] ? S.acc[0].id : '' },
    { k: 'note', l: 'Note / Reason', v: isLent ? 'Loan to friend' : 'Repayment received' }
  ],
  r => {
    const amt = evalAmt(r.a);
    if (!amt || amt <= 0 || !r.s) return no('Amount and bank account are needed');
    const payDate = r.d || iso(T);
    const noteText = (r.note || '').trim() || (isLent ? 'Lent to friend' : 'Repayment received');

    if (isLent) {
      p.balance = Math.round((p.balance + amt) * 100) / 100;
      p.txs = p.txs || [];
      p.txs.push({ id: id(), d: payDate, a: amt, type: 'lent', note: noteText });

      S.tx.push({
        id: id(),
        d: payDate,
        t: 'exp',
        a: amt,
        c: 'Miscellaneous',
        n: `${p.name}: ${noteText}`,
        s: r.s,
        reimb: 1,
        reimb_pid: p.id
      });
      toast(`✓ Recorded ₹${amt} lent to ${p.name}`);
    } else {
      p.balance = Math.round((p.balance - amt) * 100) / 100;
      p.txs = p.txs || [];
      p.txs.push({ id: id(), d: payDate, a: -amt, type: 'repaid', note: noteText });

      S.tx.push({
        id: id(),
        d: payDate,
        t: 'inc',
        a: amt,
        c: 'Repayments received',
        n: `${p.name}: ${noteText}`,
        s: r.s
      });
      toast(`✓ Recorded ₹${amt} repaid by ${p.name}`);
    }
    save();
  });
}

function parseBankSMS(txt) {
  if (!txt) return null;
  const res = { a: 0, n: '', c: '', d: iso(T), s: '' };

  const amtMatch = txt.match(/(?:(?:rs\.?|inr|debited by|spent|paid|for)\s*)([0-9,]+(?:\.[0-9]{1,2})?)/i) ||
                   txt.match(/([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs|inr|debited)/i);
  if (amtMatch) {
    res.a = parseFloat(amtMatch[1].replace(/,/g, '')) || 0;
  }

  const merchMatch = txt.match(/(?:to|towards|at|vpa|info|for)\s+([A-Za-z0-9\s&.\-_]+?)(?:\s+(?:on|ref|upi|avl|bal|using|via|dated|\.))/i) ||
                     txt.match(/(?:paid to)\s+([A-Za-z0-9\s&.\-_]+)/i);
  if (merchMatch) {
    res.n = merchMatch[1].trim();
  }

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

  return res;
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



// More (Settings) Screen Renderer & Core Loop
function more() {
  const cfg = getDriveSyncConfig();
  const lastSync = localStorage.getItem('fintrak_last_drive_sync');

  return `
  <!-- Google Drive & Cloud Sync Hub -->
  <div class=c style="background:linear-gradient(135deg, color-mix(in srgb, var(--pri) 12%, var(--card)), var(--card));border:1px solid color-mix(in srgb, var(--pri) 28%, var(--line))">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:22px">☁️</span>
        <div>
          <b style="font-size:15px">Google Drive & Cloud Sync</b>
          <div class=m style="font-size:11.5px">Safe from browser clearing · Auto-syncs every 10 transactions</div>
        </div>
      </div>
      <span class="badge-countdown" style="background:${cfg.enabled ? 'color-mix(in srgb,var(--ok) 20%,transparent);color:var(--ok)' : 'color-mix(in srgb,var(--mut) 20%,transparent);color:var(--mut)'}">
        ${cfg.enabled ? '● Active' : '○ Disabled'}
      </span>
    </div>
    <div class=r style="padding:4px 0 8px;font-size:12px">
      <span class=m>Last Cloud Sync:</span>
      <b>${lastSync ? new Date(lastSync).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never synced'}</b>
    </div>
    <div style="display:flex;gap:8px">
      <button class=pri onclick="openDriveSyncSettings()" style="flex:1;min-height:36px;font-size:12.5px">⚙️ Configure Drive Sync</button>
      <button onclick="triggerGoogleDriveSync(false)" style="flex:1;min-height:36px;font-size:12.5px" ${!cfg.enabled ? 'disabled' : ''}>🔄 Sync Now</button>
    </div>
  </div>

  <div class=c>
    <h3 style="margin-bottom:8px">App Preferences</h3>
    <div class=r><span>Total Monthly Budget</span><b>${f(S.budget)}</b></div>
    <button style="width:100%" onclick="budForm()">Set overall monthly budget</button>
    <button style="width:100%;margin-top:8px" onclick="tidy()">Tidy old categories</button>
    <button style="width:100%;margin-top:8px" onclick="S.est=!S.est;save()">Include everyday spending estimate in forecast: ${S.est ? 'On' : 'Off'}</button>
  </div>

  <div class=c>
    <h3 style="margin-bottom:8px">App Lock & Security</h3>
    <div class=r style="padding:0;margin-bottom:6px">
      <span><b>PIN Security Lock:</b></span>
      <span class="${S.pin ? 'ok' : 'm'}">${S.pin ? '4-Digit PIN Active' : 'Disabled'}</span>
    </div>
    <button style="width:100%;min-height:38px;font-size:13px" onclick="pinSettingsForm()">${S.pin ? 'Change or Remove Security PIN' : 'Set 4-Digit Security PIN'}</button>
  </div>

  <div class=c>
    <h3 style="margin-bottom:8px">Data Management & Backups</h3>
    <div class=row>
      <button onclick="bk(false)">Export / Share Backup</button>
      <button onclick="imp.click()">Import Backup</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button style="flex:1" onclick="triggerLocalAutoArchive()">🛡️ Save Snapshot to Downloads</button>
      <button style="flex:1" onclick="expCsv()">📊 Export CSV</button>
    </div>
    <input type=file id=imp accept=.json hidden onchange="ld(this)">
    <div class=m style="font-size:11px;margin-top:8px">Last manual backup: ${localStorage.getItem('fintrak_last_backup') || 'Never'} · Auto-saved every 10 transactions</div>
  </div>

  ${appear()}

  <div class=c>
    <h3>Install on your phone</h3>
    <div class=m>Android Chrome: tap menu (⋮) → "Install app". iPhone Safari: tap Share (⎋) → "Add to Home Screen". All your data remains private and stored on this device.</div>
  </div>
  `;
}

function budForm() {
  form('Monthly budget', [{ k: 'b', l: 'Total monthly spending budget', t: 'number', v: S.budget || '' }], r => {
    S.budget = +r.b || 0;
    save();
  });
}

function tidy() {
  let n = 0;
  S.tx.forEach(t => {
    if (t.adj) return;
    const m = categorizeDescription(t.n || t.c);
    if (m != t.c) { t.c = m; n++; }
  });
  save();
  alert(n + ' entries moved to modern categories');
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
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
    <h3 style="margin:0">Theme & Visual Studio</h3>
    <span class="badge-countdown" style="background:color-mix(in srgb,var(--pri) 15%,transparent);color:var(--pri)">Realtime Preview</span>
  </div>
  <div class=m style="font-size:12px;margin-bottom:12px">Customize themes, high-contrast modes, typography, and dynamic chart palettes.</div>

  <!-- 1. Theme Modes -->
  <div class=m style="font-weight:600;font-size:12.5px;margin-bottom:6px">Theme Mode (${Object.keys(MODES).length + 1} curated themes)</div>
  <div class="theme-grid">
    <button class="theme-card-btn ${TH.m == 'auto' ? 'on' : ''}" onclick="setTheme('m','auto')">
      <div class="theme-preview-pill" style="background:linear-gradient(135deg,#fff 50%,#111 50%)"></div>
      <div><b style="font-size:13px">Auto</b><div class=m style="font-size:10px">System Match</div></div>
    </button>
    ${Object.entries(MODES).map(([k, v]) => `
      <button class="theme-card-btn ${TH.m == k ? 'on' : ''}" onclick="setTheme('m','${k}')">
        <div class="theme-preview-pill" style="background:${v.bg};border-color:${v.line}"></div>
        <div>
          <b style="font-size:13px;text-transform:capitalize">${k}</b>
          <div class=m style="font-size:10px">${k == 'black' ? 'AMOLED' : k == 'midnight' ? 'Navy Dark' : k == 'matcha' ? 'Organic' : k == 'dracula' ? 'Slate Violet' : k == 'champagne' ? 'Luxury Ivory' : 'Mode'}</div>
        </div>
      </button>`).join('')}
  </div>

  <!-- 2. Accent Colors -->
  <div class=m style="font-weight:600;font-size:12.5px;margin:14px 0 6px">Accent Color: <b>${TH.a}</b></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap">
    ${Object.entries(ACC).map(([n, a]) => `
      <button aria-label="${n}" title="${n}" aria-pressed="${TH.a == n}" onclick="setTheme('a','${n}')" style="width:40px;height:40px;border-radius:50%;padding:0;border:3px solid ${TH.a == n ? 'var(--ink)' : 'transparent'};background:linear-gradient(135deg,${a[1]},${a[2]});box-shadow:${TH.a == n ? '0 0 0 2px var(--pri)' : 'none'};cursor:pointer;transition:transform 0.15s"></button>`).join('')}
  </div>

  <!-- 3. Typography & Fonts -->
  <div class=m style="font-weight:600;font-size:12.5px;margin:16px 0 6px">App Font (${Object.keys(FONTS).length} typography choices)</div>
  <div class="font-grid">
    ${Object.entries(FONTS).map(([k, fObj]) => `
      <button class="font-btn ${(TH.font || 'system') == k ? 'on' : ''}" onclick="setTheme('font','${k}')" style="font-family:${fObj.f}">
        <b style="font-size:13px">${fObj.n}</b>
        <span class=m style="font-size:10.5px">${fObj.desc}</span>
      </button>`).join('')}
  </div>

  <!-- 4. Dynamic Chart Colors -->
  <div class=m style="font-weight:600;font-size:12.5px;margin:16px 0 6px">Chart Colors & Visuals: <b>${TH.c || 'Vivid'}</b></div>
  <div style="display:flex;flex-direction:column;gap:8px">
    ${[...Object.keys(CPAL), 'Accent'].map(n => `
      <button onclick="setTheme('c','${n}')" aria-pressed="${(TH.c || 'Vivid') == n}" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:12px;border:2px solid ${(TH.c || 'Vivid') == n ? 'var(--pri)' : 'var(--line)'};background:var(--card);color:var(--ink)">
        <div>
          <b style="font-size:13px">${n}</b>
          ${n == 'Accent' ? '<span class=m style="font-size:11px"> (Harmonizes with active accent)</span>' : ''}
        </div>
        <span style="display:flex;gap:3px">${cpal(n).slice(0, 8).map(c => `<i style="width:14px;height:14px;border-radius:50%;background:${c}"></i>`).join('')}</span>
      </button>`).join('')}
  </div>

  <!-- 5. Category Chart Style -->
  <div class=m style="font-weight:600;font-size:12.5px;margin:16px 0 6px">Category Visual Presentation</div>
  <div class=seg>
    ${[['donut', '🍩 Donut Chart'], ['bars', '📊 Progress Bars']].map(([k, l]) => `<button class="${(TH.s || 'donut') == k ? 'on' : ''}" onclick="setTheme('s','${k}')">${l}</button>`).join('')}
  </div>
</div>`;

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
  (L.banks || []).forEach(b => R.acc.push({ id: sid(b.id), n: b.name, o: +b.initialBalance || 0 }));
  (L.cards || []).forEach(c => R.cards.push({ id: sid(c.id), n: c.name, limit: +c.limit || 0, bill: +c.billingDay || 15, due: +c.dueDay || 5, pa: sid(c.payAccountId) }));
  R.budget = +L.budget || 0;
  return R;
}

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
      <button onclick="togglePriv()" style="width:34px;height:34px;min-height:34px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:none;border:1px solid var(--line)" title="Privacy Mode (Mask Balances)">
        ${V.priv ? '🕶️' : '👁️'}
      </button>
      <button onclick="V.t='more';render()" style="width:34px;height:34px;min-height:34px;padding:0;border-radius:50%;display:flex;align-items:center;justify-content:center;background:none;border:1px solid var(--line)" title="Settings">
        ⚙️
      </button>
      <div class=mn>
        <button onclick="V.m--;if(V.m<0){V.m=11;V.y--;}render()">‹</button>
        <span>${mo()}</span>
        <button onclick="V.m++;if(V.m>11){V.m=0;V.y++;}render()">›</button>
      </div>
    </div>
  </header>
  <main>${(P[V.t] || home)()}</main>
  ${V.t !== 'more' ? `<button class=fab onclick="txForm()" aria-label="Add transaction">+</button>` : ''}
  <nav>
    ${[
      ['home', 'Home', '<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'],
      ['cards', 'Cards', '<svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>'],
      ['analytics', 'Analytics', '<svg viewBox="0 0 24 24"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>'],
      ['plan', 'Plan', '<svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>'],
      ['hist', 'History', '<svg viewBox="0 0 24 24"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>']
    ].map(([k, l, icon]) => `<button class="${V.t == k ? 'on' : ''}" onclick="V.t='${k}';render()">${icon}<span>${l}</span></button>`).join('')}
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

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', e => {
    const dlg = $('#dlg');
    if (dlg && dlg.open) dlg.close();
  });
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


