/**
 * Fintrak People Ledger Module (people_ledger.js)
 * Extracted from Settings into Plan & Home.
 * Manages informal hand loans, split payments, repayments, and balance settlements.
 */

function renderPeopleLedgerView(S, V, callbacks = {}) {
  const people = S.people || [];
  const totOwed = (people.filter(p => p.balance > 0)).reduce((s, p) => s + (p.balance || 0), 0);
  const totOwe = (people.filter(p => p.balance < 0)).reduce((s, p) => s + (p.balance || 0), 0);
  const filteredPeople = people.filter(p => !V.hideSettled || p.balance !== 0);

  return {
    totOwed,
    totOwe,
    netBalance: totOwed + totOwe,
    countOwed: people.filter(p => p.balance > 0).length,
    filteredPeople,
    totalPeopleCount: people.length
  };
}

function getHomePeopleSummary(S) {
  const people = S.people || [];
  const activeOwed = people.filter(p => p.balance > 0);
  const totOwed = activeOwed.reduce((s, p) => s + (p.balance || 0), 0);
  return {
    count: activeOwed.length,
    totalOwed: totOwed,
    hasPending: activeOwed.length > 0
  };
}

if (typeof module !== 'undefined') {
  module.exports = { renderPeopleLedgerView, getHomePeopleSummary };
}
