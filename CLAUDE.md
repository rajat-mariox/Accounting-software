# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — produce production bundle in `dist/`
- `npm run preview` — serve the built bundle locally

There is no test runner, linter, or type checker configured in `package.json`. Do not assume `npm test` / `npm run lint` exist.

## Architecture

This is a **client-only, mock-data React SPA** (React 19 + Vite 6 + react-router-dom 7) for an accounting/ERP dashboard ("Jubba group"). There is no backend, no API client, no auth — `LoginPage` unconditionally `navigate('/dashboard')` on submit.

### Routing shell

`src/App.jsx` declares all routes inside a single `<BrowserRouter>`. `/` and unmatched paths redirect to `/login`. Every authenticated page (`DashboardPage`, `ClientsPage`, `InvoicesPage`, etc.) renders its own copy of the three-part shell:

```
<main className="dashboard-shell">
  <DashboardSidebar brand={{...}} items={sidebarItems} />
  <section className="dashboard-main">
    <DashboardTopbar user={{...}} />
    <div className="dashboard-content"> ... page body ... </div>
  </section>
</main>
```

There is **no layout route / outlet** — the shell is duplicated per page. The sidebar nav items come from `sidebarItems` in `src/data/dashboard.js`; add a new section by appending there and registering the route in `App.jsx`. `src/pages/SectionPlaceholderPage.jsx` is a reusable stub for routes that aren't yet built out.

### State and data flow

All data is **in-memory and seeded from `src/data/*.js`**. Pages typically do:

```js
const [items, setItems] = useState(seedRows);
```

Edits, adds, and deletes mutate local component state and do not persist across reloads. There is no context, no global store (Redux/Zustand), no data-fetching library. Search/filter is done with `useMemo` over the in-memory array. Toast notifications are local `useState` + `setTimeout`.

When adding a feature that needs to persist, assume you'll need to introduce persistence from scratch — nothing exists today.

### Directory conventions

- `src/pages/` — one file per route; each page owns its modals, forms, and filtering logic. Pages tend to be large (the CRUD pages are 500–900 lines) because all interaction state lives inline.
- `src/components/dashboard/` — shared shell + presentational pieces (`DashboardSidebar`, `DashboardTopbar`, `StatCard`, `AlertBanner`, `QuickActions`) plus the main icon set in `icons.jsx`.
- `src/components/` (root) — auth-only primitives (`AuthField`, `BrandLockup`, `icons.jsx` with just `MailIcon`/`LockIcon`). Note there are **two separate `icons.jsx` files** — the big one is `components/dashboard/icons.jsx`.
- `src/data/` — seed data per domain (clients, suppliers, inventory, invoices, payments, reports, auditLogs, settings, dashboard). `dashboard.js` also exports `sidebarItems` used by every shell.
- `src/styles/` — one CSS file per page/feature, imported directly by the page component alongside `dashboard.css`. No CSS modules, no Tailwind, no styled-components. `global.css` loads Inter from Google Fonts and sets baseline resets; it is imported once in `main.jsx`.
- `src/utils/images/` — SVG assets re-exported from `index.js` as named `*Src` constants (e.g. `clientIconSrc`). Import from `../../utils/images`, not the individual `.svg` files.
- `src/utils/formatters.js` — currently just `formatCurrency` (USD, 0–1 fraction digits depending on integer-ness). Use this for any money rendering.

### Icon pattern

Sidebar items carry both an `icon` (React component) and an optional `iconSrc` (SVG path). `DashboardSidebar` prefers the SVG `<img>` when `iconSrc` is set, otherwise renders the component. Page-internal icons (buttons, table rows, modals) are imported as components from `components/dashboard/icons.jsx`.

### Styling conventions

BEM-ish class names (`dashboard-sidebar__logo`, `dashboard-nav__item--active`). Status colors are expressed through pill classes: `pill--paid`, `pill--pending`, `pill--overdue`, `pill--warning`, and `alert-row--{tone}`. Reuse these rather than inventing new tone names — the CSS only styles the existing set.
