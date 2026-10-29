/**
 * Fintrak History Component
 * Implements dynamic contextual summaries for All, Spent, Income, Invest, Cards, and Transfer tabs,
 * as well as daily grouped date headers.
 */

function renderHistoryComponent(S, V, L, G, sq, fl, fsp) {
  // Dynamic contextual summary header based on selected tab and filters
  let summaryText = '';
  const searchPrefix = sq ? ` matching "${e(V.sq)}"` : '';

  if (fl === 'all') {
    const totIn = sum(L.filter(t => t.t == 'inc'));
    const totExp = sum(L.filter(t => t.t == 'exp'));
    const totInv = sum(L.filter(t => t.t == 'inv'));
    summaryText = `${L.length} entries${searchPrefix} · In: <b>${f(totIn)}</b> · Spent: <b>${f(totExp)}</b> · Invest: <b>${f(totInv)}</b>`;
  } else if (fl === 'exp') {
    summaryText = `${L.length} entries${searchPrefix} · Total Spent: <b>${f(sum(L))}</b>`;
  } else if (fl === 'inc') {
    summaryText = `${L.length} entries${searchPrefix} · Total Income: <b>${f(sum(L))}</b>`;
  } else if (fl === 'inv') {
    summaryText = `${L.length} entries${searchPrefix} · Total Invested: <b>${f(sum(L))}</b>`;
  } else if (fl === 'pay') {
    summaryText = `${L.length} entries${searchPrefix} · Total Card Payments: <b>${f(sum(L))}</b>`;
  } else if (fl === 'xfer') {
    summaryText = `${L.length} entries${searchPrefix} · Total Transferred: <b>${f(sum(L))}</b>`;
  }

  return { summaryText };
}

function getDayHeaderSummary(x, fl) {
  if (fl === 'all') {
    const sp = sum(x.filter(t => t.t == 'exp'));
    const incDay = sum(x.filter(t => t.t == 'inc'));
    if (sp && incDay) return `Spent ${f(sp)} · In +${f(incDay)}`;
    if (sp) return `Spent ${f(sp)}`;
    if (incDay) return `+${f(incDay)}`;
    return '';
  }
  if (fl === 'exp') return `Spent ${f(sum(x))}`;
  if (fl === 'inc') return `+${f(sum(x))}`;
  if (fl === 'inv') return `Invested ${f(sum(x))}`;
  if (fl === 'pay') return `Paid ${f(sum(x))}`;
  if (fl === 'xfer') return `Transferred ${f(sum(x))}`;
  return '';
}

if (typeof module !== 'undefined') {
  module.exports = { renderHistoryComponent, getDayHeaderSummary };
}
