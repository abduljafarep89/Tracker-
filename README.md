# Fintrak — Personal Finance Tracker (PWA)

A privacy-first, lightning-fast personal finance Progressive Web Application designed for mobile and desktop. Track bank accounts, optimize credit card cycles, forecast month-end solvency, manage sinking fund goals, and simulate financial scenarios — with 100% of your data stored locally on your device (`localStorage`).

---

## 🌟 What's New in Fintrak (Phase 1 & Phase 2 Features)

1. **Brand Identity & Revamped Modern Icon**
   - Sleek modern vector crest combining the stylized **F**, Indian Rupee symbol (**₹**), and upward financial growth curve on deep royal indigo/electric violet gradient.
   - PWA assets: `icon-512.png`, `icon-192.png`, `apple-touch-icon.png`, and `favicon.png`.

2. **Budget Pace Line with Dynamic Overshoot Alert (Phase 1)**
   - Interactive SVG chart plotting cumulative daily spend against ideal linear budget pace.
   - Intelligent predictive alert: *"⚠️ At current pace (₹X/day), you will overshoot your budget by ₹Y on Day Z"* or *"✓ On Track: finishing ₹Y under budget"*.
   - Visual overshoot marker dot placed right on the day of projected budget breach.

3. **Goals & Sinking Funds Module (Phase 1 & 2)**
   - Dedicated sinking funds tracker under the **Plan** tab (`Goals`) and summary card on Home.
   - Circular SVG progress rings showing percentage achieved toward vehicle insurance, school fees, annual maintenance, or emergency buffers.
   - One-tap `+ Add ₹` contribution button to quickly add savings and optionally log from bank accounts.

4. **Comprehensive Financial Health Scorecard (0–100) (Phase 1)**
   - Interactive composite health score (Optimal, Healthy, Moderate, Needs Attention).
   - Diagnostic metric bars for **Savings Rate** (target >30%), **Emergency Runway** (target 6 mo), and **Credit Utilization** (target <30%).
   - Tailored priority recommendations highlighting the single most impactful financial move.

5. **What-If Scenario Simulation Sandbox (Phase 2)**
   - Collapsible slider on Home allowing instant simulation of SIP investment adjustments (`+₹1k` to `+₹25k/mo`) or living spend cuts (`-₹1k` to `-₹15k/mo`).
   - Live reactive forecast calculating impact on month-end cash, safe daily spend velocity, and 1-year wealth accumulation without modifying actual ledger records.

6. **Quick-Add Category Touch Pills (Phase 1)**
   - Instant 1-tap category pills (`Fuel`, `Groceries`, `Restaurant & takeaway`, `Food & Drinks`, `Personal`, `Utilities`, `Adhoc`) in the Add Entry sheet.

7. **Credit Card Optimizer & Full Liability Overview (Phase 1)**
   - Total credit card liabilities displayed in Home and Cards views.
   - Real-time billing cycle countdown badges (`✓ Paid in full`, `⚠️ Due Today`, `⏳ Due in X days`, `🚨 Overdue`).
   - Best card to swipe today based on interest-free days.
   - Minimum due versus full payment optimizer advice.

8. **Seamless Backward Compatibility & Universal Restore**
   - Automatically migrates existing `finplan_v1` and legacy `tracker_multi_row_mobile_suite` datasets without data loss.
   - Universal JSON import supporting Fintrak, FinPlan, and multi-month tracker backups.

---

## 🚀 Deployment to GitHub Pages

1. Commit and push the updated files to your GitHub repository (e.g. `abduljafarep89/Tracker-`):
   - `index.html`
   - `manifest.webmanifest`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
   - `favicon.png`
2. Go to **Settings > Pages** in your GitHub repository.
3. Set Source to **Deploy from a branch** -> `main` / `(root)`.
4. Open `https://<your-username>.github.io/<repo>/` in your phone browser.

---

## 📱 Install on Mobile (PWA)

- **Android (Chrome)**: Tap the three-dot menu `⋮` > **Install app** (or **Add to Home screen**).
- **iPhone (Safari)**: Tap the Share button `⎋` > **Add to Home Screen**.
- **Service Worker Cache**: The service worker is set to `fintrak-v18`, ensuring immediate cache busting and automatic cleanup of previous FinPlan cache storage.
