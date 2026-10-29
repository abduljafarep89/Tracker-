# Fintrak — Personal Finance & Cashflow Suite

Fintrak is an offline-first, mobile-optimized personal finance Progressive Web App (PWA) with zero server dependencies. All data is calculated client-side and saved securely in your browser's local storage.

---

## 1. Quick Start & GitHub Pages Deployment

1. Download or clone this repository.
2. Upload the following core bundle files to your GitHub repository root (`main` branch):
   * `index.html` (Application HTML shell)
   * `style.css` (Design system & responsive mobile styles)
   * `app.js` (Core calculation engine, data models, and views)
   * `sw.js` (Service worker with Stale-While-Revalidate caching)
   * `manifest.webmanifest` (PWA manifest with maskable icons & shortcuts)
   * App Icons (`icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`, `favicon.png`)
3. On GitHub: Go to **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: `main` → **Save**.
4. Open your live URL on your phone in Google Chrome or Safari:
   * **Android / Chrome**: Tap the three-dot menu (⋮) → **Install app** (or **Add to Home screen**).
   * **iPhone / Safari**: Tap the Share button (⎋) → **Add to Home Screen**.

---

## 2. Core Bugfixes & Trust In Data

* **Contextual History Tab Summaries**:
  * In the **All** tab: Displays total count and full breakdown: 
  * In the **Spent** tab: Displays entry count and total spend: 
  * In the **Income** tab: Displays entry count and total income:  (no longer incorrectly shows "Spent: ₹0").
  * In the **Invest** tab: Displays entry count and total invested: 
  * In the **Cards** tab: Displays entry count and total card payments: 
  * In the **Transfer** tab: Displays entry count and total transferred: 
  * In daily grouped headers: Displays the contextual day total matching the active tab (e.g.,  on Income,  on Transfer).

* **Accurate Safe Daily Spend**:
  * If a monthly budget is set: divides the *remaining budget* ($\text{Budget} - \text{Spent}$) by the remaining days in the month.
  * If no budget is set: divides the *uncommitted monthly surplus* ($\text{Planned Income} - \text{Fixed Bills} - \text{Investments} - \text{Spent}$) by the remaining days.
  * Never divides your accumulated lifetime bank balance by remaining days.
* **Realistic Net Surplus & Split Bar**:
  * Measures spending and investment percentages against *total expected monthly income* rather than income received to date.
  * When salary hasn't arrived yet, displays the expected month-end surplus along with a note explaining that salary is pending, preventing negative surplus alerts and split bars exceeding 100%.
* **Empty Month Handling in Analytics**:
  * When comparing against an empty prior month (such as September), displays "No prior month data" instead of a false "+100% surge" alert.
* **Resilient Offline PWA Service Worker**:
  * Removed redundant `manifest.json`.
  * `sw.js` caches each asset individually using `Promise.allSettled`, so a single missing asset will not fail the installation.
  * Implements Stale-While-Revalidate caching for near-instant app startup and background cache updates.
* **Solid Bottom Navigation Bar**:
  * Set `nav { background: var(--card) !important; z-index: 1000 !important; opacity: 1 !important; }` to eliminate transparency in the Cards section and ensure consistent appearance across all screens.
* **Responsive Header (360px–390px Viewports)**:
  * Formats month navigation as compact `"Oct 2026"` to prevent line-wrapping and avoid clipping the right navigation arrow.
* **Data Safety & Persistence**:
  * Single storage key (`fintrak_v1`) with automatic legacy data migration.
  * All `save()` calls wrapped in `try/catch` with automated storage persistence (`navigator.storage.persist()`).
  * 14-day backup reminder banner when a backup hasn't been exported recently.

---

## 3. New Feature Guides

### A. People Ledger ("Who Owes Me What")
* Located in the **Settings / More** view.
* Track informal loans, shared bills, and repayments from friends and family (e.g., Uma, Janish, Jinsha).
* Tap **+ Lend** or **+ Repaid** to record balance adjustments.
* Optionally link transactions directly to a bank account to automatically record debit or credit entries.

### B. Bank SMS & UPI Parser
* Tap **📋 Parse Bank SMS / UPI** in Settings or inside the **Add Transaction** dialog.
* Paste any standard Indian transaction SMS (HDFC, ICICI, SBI, Axis, UPI).
* The regex engine extracts:
  * Amount (e.g., `Rs. 450.00`)
  * Payee / Merchant (e.g., `SWIGGY`, `BPCL`)
  * Date
  * Auto-categorization (`Restaurant & takeaway`, `Fuel`, `Groceries`)
  * Matching bank account

### C. Calendar Export (`.ics`)
* Tap **📅 Export Card Bills to Calendar (.ics)** in Settings.
* Generates a standard `.ics` file containing all credit card statement due dates and recurring bills.
* Imports into Google Calendar, Apple Calendar, or Outlook with 1-day advance reminder notifications.

### D. Category Budgets
* Set monthly spending caps per category (e.g., Fuel: ₹5,000, Dining: ₹8,000).
* Visual progress bars show consumed vs. remaining funds with over-budget alerts.

### E. Quick Add Shortcuts
* Tap shortcut pills on the Home screen to quickly log frequent expenses (e.g., `+ Fuel ₹2,000`, `+ Coffee ₹50`).
* PWA Web App Manifest shortcuts support long-pressing the home screen icon to open the Add Transaction dialog directly.

### F. Undo After Delete
* When deleting any transaction, a 5-second toast notification appears with an **Undo** action button to restore the entry immediately.




### J. Account Balance Reconciliation & Outside App Adjustments
* **The Problem It Solves**: When you are busy, traveling, or miss recording small cash/UPI transactions for days or weeks, your real bank app balance diverges from Fintrak.
* **How It Works**:
  * In the **Cards & Accounts** view, tap **⚖️ Adjust** next to any bank account (or tap **⚖️ Reconcile** inside the Edit Account dialog).
  * Enter your actual live balance from your bank app or SMS (e.g. ₹42,000 when Fintrak had ₹50,000).
  * Fintrak calculates the difference in real time:
    * If actual < app balance: automatically logs an expense on today's date titled `Outside app spending (Balance adjustment)` for the exact difference.
    * If actual > app balance: automatically logs an income deposit on today's date titled `Outside app income (Balance adjustment)` for the difference.
  * In **History**, adjustment entries are permanently recorded and highlighted with a distinct badge: `[⚖️ Outside App Adjustment]`.
  * Your bank account in Fintrak immediately matches your real-world bank balance down to the rupee without breaking past ledgers.


* **Credit Card Balance Reconciliation**:
  * Tap **⚖️ Adjust Balance** directly on any credit card card.
  * Enter your actual live total outstanding balance from your banking app (e.g. HDFC MyCards, iMobile, SBI Card).
  * Fintrak automatically calculates the difference:
    * **If real balance is higher (+₹5,000)**: Automatically records an unlogged card expense in History on that card (`HDFC: Outside app card spending`), immediately updating your card balance to match reality.
    * **If real balance is lower (-₹2,000)**: Automatically records a card balance reduction/refund in History without touching any bank account.
  * Tagged in History with the distinct badge: `[⚖️ Outside App Adjustment]`.

### K. History UI Polish
* **Top Tab Grid Icons**: Integrated clean, consistent icons matching the Plan tab: `📋 All`, `💸 Spent`, `💰 Income`, `📈 Invest`, `💳 Cards`, `⇄ Transfer`.
* **Summary Line Non-Breaking Format**: Grouped metric labels and figures with non-breaking spans (`In: ₹...`, `Spent: ₹...`, `Invest: ₹...`) so amounts never awkwardly break across lines.

### I. Decluttered Settings & Relocated Functional Hubs
* **People Ledger**: Moved from Settings to the **Plan** tab as an equal sub-tab in a balanced 3×2 grid (`Calendar`, `Bills`, `Invest` on top; `Income`, `Goals`, `People` below), alongside a glanceable **People Ledger card on Home**. Features an automatic **Hide settled (₹0 balance)** toggle so one-off settled acquaintances never clutter active views.
* **Bank Accounts & Transfer**: Moved from Settings directly into the **Cards** view under **Bank Accounts & Cash** (with 1-tap `+ Bank` and `⇄ Transfer` buttons), placing liquid balances alongside card liabilities.
* **Category Budgets**: Moved from Settings directly into the **Plan (Bills)** view, placing category spending caps directly where monthly obligations are managed.
* **Calendar Reminders Export (.ics)**: Placed as a 1-tap button directly inside the **Plan (Calendar)** and **Cards** views.
* **Clean Minimalist Settings**: The Settings screen (`⚙️`) now hosts strictly true system configuration: App Lock PIN, Data Backups & CSV export, Theme Appearance, and Category Tidying.

### H. Paid for a Friend / Reimbursable Transactions
* **How It Works**:
  * In the **Add / Edit Entry** form, check **🤝 Paid for a friend (Reimbursable)**.
  * Optionally select the friend from your **People Ledger** (e.g., Uma, Janish, Jinsha).
* **For Historical Payments**:
  * Tap any existing transaction in the **History** tab to open its edit dialog.
  * Check the reimbursable toggle and select the friend (or uncheck to revert).
* **Financial Impact**:
  * **Analytics & Living Burn**: Automatically excluded from monthly living expenses, budget pace curves, category charts, and daily burn rates.
  * **Credit Card Liabilities**: 100% retained in your credit card balance, unbilled spend, and statement due date calculations so you never miss paying your card bill.
  * **People Ledger Auto-Sync**: The amount is automatically added to that friend's balance in "Who Owes Me What". When they repay you, recording the repayment settles their debt without inflating your salary income.

### G. Backup Sharing & PIN Lock
* Tap **Export / Share Backup** to share your backup directly to WhatsApp, Google Drive, or Gmail using the Web Share API.
* Protect exports with a custom password envelope.
* Enable an optional 4-digit PIN lock under Security to require authentication on app launch.

---

## 4. Running the Smoke Test Suite

To verify all calculations and features locally using Node.js:
```bash
node test_fintrak.js
```
All 7 automated test suites should pass with zero errors.


---

## 5. UI/UX Resolution: 2-Row Segmented Grid & Zero-Overflow Architecture

* **Elimination of Horizontal Tab Overflow**:
  * In the **Plan** view: Replaced the single overflowing horizontal row with a structured 2-row segmented grid:
    * Row 1 (3 equal buttons, 33.3% width each):   
    * Row 2 (2 equal buttons, 50% width each):  
  * In the **History** view: Replaced the 6 overflowing filter pills with a balanced 2-row segmented grid:
    * Row 1 (3 equal buttons, 33.3% width each):   
    * Row 2 (3 equal buttons, 33.3% width each):   
* **Permanent Zoom Stabilization**:
  * Because every row is constrained to  with , horizontal overflow across the entire application is 0px.
  * Mobile viewports on Android (Chrome/Vivo/Samsung) and iOS (Safari) no longer trigger auto-rescaling or zoom-out when navigating between tabs.
