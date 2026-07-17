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
- Testing swipe-to-delete (TasksView/SwipeableTaskRow): create the context
  with `hasTouch: true, isMobile: true` so `new Touch()`/`new TouchEvent()`
  work at all. Dispatch synthetic touch events on `.swipe-content` — the
  element the handlers are actually bound to — **not** the outer
  `.swipe-row` wrapper; dispatching on a parent never reaches a child's
  listeners since events only propagate through ancestors, not descendants.
  Also: `getByText('Water the plants')` without `{ exact: true }` will
  false-positive-match the undo toast's "Deleted “Water the plants”" text —
  use exact matching whenever a delete/undo flow is in play.
- Done section: tasks completed on a prior day, or any task inside a
  collapsed "Done" group, aren't just hidden — the row isn't rendered until
  expanded. `getByText(...).waitFor()` on a done task will time out unless
  you click the "Done (N)" toggle first.
- The Done toggle's expanded/collapsed state is real component state that
  persists across renders even when the section briefly has zero tasks
  (DoneGroup returns `null` for its *output* but the same instance stays
  mounted, so its `useState` survives) — don't blindly click "Done (N)" to
  "open" it a second time, or you'll collapse it instead. Check
  `getAttribute('aria-expanded')` first.
- Swipe is bidirectional (SwipeableTaskRow): swipe left reveals
  `.swipe-delete-action` (right edge), swipe right reveals
  `.swipe-complete-action` (left edge, calls the same `onToggle` as the
  checkbox). Same touch-dispatch-on-`.swipe-content` approach works for
  positive `dx` too.
- Tab-switching unmounts the view: `App.jsx` renders `{tab === 'tasks' &&
  <TasksView/>}` etc., so navigating away and back resets all of
  TasksView's local state (filter, Done-expanded, undo toast). An imported
  *undated* task won't appear while parked on the Calendar tab — switch to
  Tasks first before asserting on it.
- Tap-target checks: `.icon-btn`/`.check` expand their hit area via an
  invisible `::before` (CSS `inset`), not by resizing the visible box.
  Verify by clicking a few px *outside* the element's `boundingBox()` with
  `page.mouse.click()` and confirming the handler still fires — pseudo-
  elements have no ElementHandle of their own to measure directly.

- Recurring tasks: completing one spawns the next occurrence (same
  title/details, dueDate advanced by the rule) — assert on the Upcoming
  group, and use the same-title/same-date guard when testing the
  un-complete → re-complete path (it must not duplicate).
- Overdue: rollover sets `originalDueDate`; import a backup with a past
  `dueDate` to trigger it deterministically. The "Nd overdue" badge only
  renders when `originalDueDate < dueDate` and the task is open.
- Search: opening it hides the chips row entirely — assert chips after
  Close, not during. Search ignores category/assignee filters by design.

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
