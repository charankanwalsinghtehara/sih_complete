# SecureTrace Frontend — Enhanced UI

React + Vite frontend for the SecureTrace digital evidence platform.

## What was improved

- Replaced dashboard number-only KPI cards with visual SVG charts and telemetry graphics.
- Added donut/ring visuals for verification, modification risk, recovery, and network health.
- Added stacked integrity composition charts for verified / modified / pending evidence.
- Added segmented ledger-progress visuals instead of presenting blockchain height as a plain number.
- Added validator availability bars using the existing node data.
- Applied a Flexbox-first layout to the dashboard KPI, workflow, analytics, and node sections.
- Improved responsive behavior so cards wrap naturally across desktop, tablet, and mobile widths.
- Extended the same visual treatment to the Blockchain and Network summary areas.
- Kept the existing API service, navigation, demo fallback data, and application architecture intact.
- Added no chart-library dependency; the visuals are lightweight React/SVG components.

## Run locally

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

The project expects the same optional backend endpoint as before. Set `VITE_API_BASE` if the FastAPI service is not running at `http://127.0.0.1:8000`.

## Main UI additions

- `src/components/MetricChart.jsx` — reusable donut, stacked-bar, segmented, and node-health visuals.
- `src/components/StatCard.jsx` — visual KPI card shell.
- `src/pages/Dashboard.jsx` — enhanced dashboard telemetry and analytics sections.
- `src/pages/Network.jsx` — visual network-health summary.
- `src/pages/Blockchain.jsx` — visual ledger/validation/hash summaries.
- `src/styles/main.css` — Flexbox-first responsive dashboard styling.

`node_modules` is intentionally not included in the ZIP so the project installs the correct native dependencies for the target operating system.
