# Fintrak Analytics & Month-on-Month (MoM) Intelligence Guide

This guide details the month-on-month analysis, cumulative spend pacing, and multi-factor cashflow intelligence built into **Fintrak**.

---

## 1. Architecture Overview (Option 3 Implementation)

Fintrak features a dedicated **Analytics** tab directly accessible from the primary bottom navigation:

* **Bottom Navigation Layout**:
  1. `Home`: Operational snapshot, safe daily spend, upcoming calendar events, and quick account summaries.
  2. `Cards`: Physical Apple Wallet style card stack, payment countdown badges, and utilization gauges.
  3. `Analytics`: Deep month-on-month comparative studio, dual-line spend pace curve, and category shift matrix.
  4. `Plan`: Monthly recurring bills, investments, and scheduled payment calendar.
  5. `History`: Chronological transaction ledger with instant keyword search and filter pills.
* **Header Settings Gear (`⚙️`)**:
  Bank accounts, monthly budget configuration, CSV exports, backup restore/export, and theme appearance settings are housed behind the header gear icon, keeping daily logging uncluttered.

---

## 2. Core Analytics Modules

### A. Executive MoM Scorecard
Directly compares the active month ($M_0$) against the previous calendar month ($M_{-1}$):
* **Period Spend to Date**: Evaluates cumulative expenses up to today's date ($D_{\text{eval}}$).
* **Relative Variance**: Calculates net currency difference ($\Delta = C_0 - C_{-1}$) and percentage variance ($\% = \frac{\Delta}{C_{-1}} \times 100$).
* **Daily Burn Velocity**: Evaluates average daily living spend ($\frac{\text{Cumulative Spend}}{D_{\text{eval}}}$) compared to the prior month's daily baseline.
* **Month-End Forecast**: Extrapolates current daily burn over remaining days in the month.

### B. Dual-Line Cumulative Daily Spend Pace Curve
Plots daily cumulative living expenses across Days 1 through 31:
* **Current Month Curve (Solid Accent)**: Renders a primary line with area fill up to today's date, followed by a dashed trajectory line toward month end.
* **Previous Month Curve (Dashed Muted)**: Renders the historical benchmark curve across all 30/31 days of the previous month.
* **Interactive Touch & Mouse Scrubbing**: Moving across the chart displays exact day-by-day spend comparisons and relative differences.

### C. Category Shift & Variance Matrix
Evaluates spending drift across individual categories:
* **Comparative Bars**: Renders dual bars contrasting current vs. prior month spend.
* **Variance Badges**: Highlights savings with green reduction chips and flags surges with alert badges.

### D. 6-Month Cashflow & Savings Rate Velocity
Tracks inflows, living outflows, and capital investments over the trailing 6 months:
* **Grouped Visual Bars**: Inflow (Green), Living Outflow (Red), and Invested Wealth (Indigo).
* **Trailing Metrics**: Calculates 6-month average income, burn rate, and investment contributions.

### E. Payment Method & Top Merchant Pareto Breakdown
* **Card & Account Share**: Displays where funds were disbursed to track credit card utilization and reward optimization.
* **Top 5 Payees**: Ranks highest spending destinations (e.g. Swiggy, Amazon, Fuel) with percentage contributions.

---

## 3. Privacy Mode Compatibility

All metrics, tooltips, chart readouts, and percentage variances dynamically respect Fintrak's Privacy Mode (`V.priv`), masking numbers with `₹••••••` and percentages with `••%`.
