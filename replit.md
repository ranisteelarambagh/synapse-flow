# Synapse — AI Research Pipeline Builder

## Overview
Synapse is a visual AI workflow builder that lets users construct, run, and debug pipelines composed of AI nodes (Agents, LLM Calls, Memory, Embedders, Classifiers) and tool nodes (HTTP Request, etc.).

## Architecture
- **Pure frontend SPA** — React 18 + Vite 5, no backend server
- **Routing** — React Router v6 (redirects `/` → `/workspace/demo`)
- **State** — Zustand stores + TanStack Query
- **UI** — Radix UI primitives + shadcn/ui components + Tailwind CSS
- **Canvas** — `@xyflow/react` for the node graph
- **Real-time** — `yjs` + `y-websocket` + `peerjs` + `socket.io-client` (collaborative features)
- **Animation** — Framer Motion

## Key Source Directories
- `src/pages/` — Route-level page components (WorkspacePage, NotFound)
- `src/components/` — UI components (nodes, panels, inspector, etc.)
- `src/stores/` — Zustand state stores
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utility helpers
- `src/config.ts` — App-wide configuration

## Running the App
The dev server runs via the "Start application" workflow:
```
npm run dev
```
Runs on port **5000**, accessible from Replit's webview.

## Build & Deploy
```
npm run build   # production build to dist/
npm run preview # preview the production build
```

## Migration Notes (Lovable → Replit)
- Removed `lovable-tagger` plugin from `vite.config.ts`
- Updated Vite server to bind to `0.0.0.0:5000` with `allowedHosts: true` for Replit proxy compatibility
- Configured "Start application" workflow pointing to `npm run dev`
