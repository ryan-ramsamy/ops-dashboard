# Ops dashboard

Mobile-first ops PWA — tasks, calendar and maintenance spend across MRP, LB and Kove.
Companion app to [maintenance-tracker](https://github.com/ryan-ramsamy/maintenance-tracker), but standalone with its own data.

## Features

- **Tasks** — category filter chips (Maintenance / Housekeeping / Ops / Personal), grouped into Due today / Upcoming / Someday. Unfinished dated tasks roll over to today automatically (Tweek-style).
- **Calendar** — month/week toggle, dots on dates with tasks, tap a date for that day's list.
- **Spend** — monthly maintenance-spend rollup by property (Rand), fed by the cost field on maintenance tasks.
- **Backup** — ⋯ menu → Export data / Import data. Imports merge by task ID (imported wins), so you can move data phone ↔ laptop safely. Rolling 3-day localStorage snapshots guard against a bad import.

Data lives in `localStorage` only — `src/store.js` is the single data layer; swap its function bodies for API calls when moving to a hosted DB.

## Develop

```sh
npm install
npm run dev
```

Icons are pre-generated in `public/`; regenerate with `npm run icons` after changing the design in `scripts/gen-icons.mjs`.

## Deploy (Netlify)

Push to a Git repo and connect it in Netlify — `netlify.toml` sets the build (`npm run build`, publish `dist`). Then on your phone open the site and "Add to Home Screen".
