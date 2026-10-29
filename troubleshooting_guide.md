# Fintrak UI Diagnostic & Credit Card Adjustment Guide

This guide explains why the `⚖️ Adjust Balance` option was not visible on your screen and outlines the exact locations where it is now permanently placed.

---

## 1. Why You Did Not See It in Your Screenshots

In your uploaded screenshots (`1000094376.jpg` and `1000094378.jpg`):
* **Cached Version on Device**: Your phone was running the previous deployment (`fintrak-v30`), which showed:
  `[ Other amount ] [ Statement amounts ]`
* **Missing in Edit Dialog**: When you tapped **Edit** on your Apex Bank card (`1000094378.jpg`), the Edit dialog only had inputs for credit limit, billing day, and color palette.
* **Pending Deployment**: The latest code update containing the card reconciliation engine had not yet been pushed to your GitHub repository and cleared in your browser's service worker cache.

---

## 2. Exactly Where It Is Now Placed (3 Convenient Spots)

To ensure you never have to search for it, the `⚖️ Adjust` feature is now placed in 3 high-visibility locations:

### Location 1: Directly on the Face of the Physical Card (Header)
Look at the top-right corner of your physical purple Apex Bank card:
* Right next to the `Edit` button, there is now a dedicated button: **`⚖️ Adjust`**.
* Tapping it opens the live reconciliation sheet immediately.

### Location 2: Inside the "Edit Card" Dialog (Where you were looking in Screenshot 2)
When you tap **Edit** on any card:
* Directly above the color swatches, there is a prominent card:
  `Missed logging some card expenses or got a refund? Reconcile with your live card balance:`
  `[ ⚖️ Reconcile / Adjust Card Balance ]`

### Location 3: Bottom Action Row
At the bottom of each credit card block:
* Replaced the old layout with:
  `[ ⚖️ Adjust Balance ]  [ Statement amounts ]`
* Added extra bottom padding so the floating green `+` FAB never obscures the buttons.

---

## 3. How to Update Your Phone Instantly

1. Download the updated `pwa_github_bundle.zip`.
2. Extract and push the files (`index.html`, `style.css`, `app.js`, `sw.js`) to your GitHub Pages repository.
3. On your phone:
   * Close Fintrak completely from your recent apps switcher.
   * Open Chrome and refresh your GitHub Pages URL once (or tap the app icon).
   * The new Service Worker (`fintrak-v32`) will activate immediately, bringing up the `⚖️ Adjust` buttons on all cards.
