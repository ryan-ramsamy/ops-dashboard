---
name: verify
description: Build, launch and drive ops-dashboard to verify changes end-to-end.
---

# Verifying ops-dashboard

## Build & launch

```sh
npm install
npm run build          # vite build -> dist/
npm run preview        # serves dist/ at http://localhost:4173 (run in background)
```

Dev server alternative: `npm run dev` (port 5173). The service worker only
registers in production builds, so use `preview` when testing offline/PWA paths.

## Drive it

Playwright against installed Edge works on this machine — no browser download:

```js
const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
```

Install `playwright` in a scratch dir, not this repo.

Gotchas learned the hard way:

- localStorage is per Playwright context — a second `newContext()` starts with
  empty data. Resize the same page for desktop checks instead.
- Import/confirm and invalid-file alerts use native dialogs: register
  `page.on('dialog', d => d.accept())` before triggering.
- The header + button and the editor submit button are both named "Add task";
  scope to `.sheet .btn-primary` for the submit.
- Import goes through a hidden `input[type=file]` — `setInputFiles` works.
- Export: `page.waitForEvent('download')` around clicking "Export data".

## Flows worth driving

- Add tasks across all three groups (today / future date / someday) and check
  grouping, subtitle (`MRP · Manuel · R 1,250.00`), priority badges.
- Category filter chips; checkbox strikethrough.
- Rollover: import a backup containing an open task with a past `dueDate` and
  confirm it lands in "Due today" (import runs rolloverTasks).
- Calendar: dots (blue = open, gray = all done), tap a date, month/week toggle.
- Spend: monthly total, per-property breakdown, month nav to an empty month.
- Backup round-trip: export -> inspect JSON (`app: 'ops-dashboard'`), import
  merges by task id.
- Reload for localStorage persistence.
