# FinPlan (PWA)

Installable finance tracker: bank accounts, credit cards (billing and due days), planned payments, investments and income, and a month-end forecast. All data stays on your device (localStorage).

## Deploy on GitHub Pages
1. Create a new repository and upload all files in this folder to the repository root.
2. Settings > Pages > Source: Deploy from a branch > main / (root) > Save.
3. Open `https://<username>.github.io/<repo>/` on your phone.

## Install on your phone
- Android (Chrome): menu > Install app.
- iPhone (Safari): Share > Add to Home Screen.

## Updating
Replace the files in the repo. If the phone still shows the old version, change `finplan-v1` in `sw.js` to a new name (for example `finplan-v2`) so the cache refreshes.

## Backup
More > Export backup saves a JSON file. More > Import backup restores it, and also reads backups from the old tracker.
