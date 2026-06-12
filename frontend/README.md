# Frontend

React + Vite dashboard for configuring, running, and viewing EcoPyCSIM/MADDPG experiments.

## Run

```bash
npm install
npm run dev
```

The app usually runs at `http://localhost:5173`.

## API URL

The frontend calls `http://localhost:8000` by default. Override it when needed:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Scripts

- `npm run dev` starts the local Vite dev server.
- `npm run build` creates the production build in `dist/`.
- `npm run preview` previews the production build.
- `npm run lint` runs ESLint.

## Structure

```text
frontend/
  src/
    App.jsx                    App shell and tab navigation
    main.jsx                   React entry point
    index.css                  Tailwind/global styles
    services/dashboardApi.js   REST and WebSocket API client
    context/                   Shared dashboard state
    components/                Dashboard pages and reusable UI
    utils/                     Chart/data helpers
    mockData.js                Local fallback/demo data
  public/                      Static public assets
  package.json                 Scripts and dependencies
  vite.config.js               Vite, React, and Tailwind setup
```

## Important

- Commit `src/`, `public/`, `package.json`, `package-lock.json`, and config files.
- Do not commit `node_modules/` or `dist/`; both are generated locally.
- Keep API calls centralized in `src/services/dashboardApi.js` so backend changes are easy to maintain.
