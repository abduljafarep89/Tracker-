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

## 2. Core Architecture & Enhancements

* **Trustworthy Numbers**:
  * **Safe Daily Spend**: Based on your remaining monthly budget ($(\text{Budget} - \text{Spent}) / \text{Days Left}$), or on uncommitted monthly surplus if no budget is set. Never divides lifetime bank cash.
  * **Net Cashflow & Salary Pending**: Measures spending and investment percentages against total expected monthly income so figures remain accurate before salary arrives.
  * **Empty Month Analytics**: Displays "No prior month data" instead of a false +100% surge alert when comparing against an empty previous month.
* **Navigation & Mobile Layout**:
  * 5 primary bottom tabs: `Home`, `Cards`, `Analytics`, `Plan`, `History`.
  * Fully opaque bottom navigation (`z-index: 1000`) across all screens.
  * Compact header with `"Oct 2026"` date formatting designed for 360px–390px viewports.
  * Settings and tools accessible via the header gear icon (`⚙️`).
* **Data Safety & PWA**:
  * Single storage key (`fintrak_v1`) with automatic legacy migration.
  * Safe writes wrapped in `try/catch` with automated storage persistence (`navigator.storage.persist()`).
  * 14-day backup reminder banner.
  * Stale-While-Revalidate service worker (`sw.js`) caching assets individually via `Promise.allSettled`.
* **Minimalist Brand Icons**:
  * Ultra-compressed icons (all under 10 KB).
  * Full-bleed square maskable icon (`icon-512-maskable.png`) with logo placed within the central 80% safe zone.
  * High-contrast simplified 32×32 favicon.

---

## 3. Advanced Feature Suite

* **People Ledger ("Who Owes Me What")**: Track hand loans, split bills, and repayments from friends and family with optional auto-reconciliation to bank accounts.
* **Category Budgets**: Set spending limits per category with visual progress bars and over-budget warnings.
* **Bank SMS & UPI Parser**: Paste bank transaction SMS messages to automatically extract amounts, merchants, dates, and categories.
* **Calendar Reminders Export (`.ics`)**: Export upcoming credit card statement due dates and planned payment alerts to Google Calendar or Apple Calendar with 1-day advance notifications.
* **Quick Add Shortcuts**: 1-tap shortcut pills on Home for frequent expenses (`Fuel`, `Coffee`, `Groceries`, `Food`).
* **Undo Engine**: 5-second interactive Undo action toast when deleting any transaction or planned item.
* **Backup Sharing & App Lock**: Share backups directly via WhatsApp/Drive using the Web Share API, with optional password protection and a 4-digit security PIN lock.

---

## 4. Running the Smoke Test Suite

To verify all calculations and features locally using Node.js:
```bash
node test_fintrak.js
```
All 7 automated test suites should pass with zero errors.
