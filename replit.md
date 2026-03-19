# Synapse — AI Research Pipeline Builder

## Overview
Synapse is a visual AI workflow builder that lets users construct, run, and debug pipelines composed of AI nodes (Agents, LLM Calls, Memory, Embedders, Classifiers) and tool nodes (HTTP Request, Code Runner, etc.). It features real-time collaboration, voice-to-node creation, an AI debugger, a comments system, and dark/light theme support.

## Architecture
- **Pure frontend SPA** — React 18 + Vite 5, no backend server
- **Routing** — React Router v6 (redirects `/` → `/workspace/demo`)
- **State** — Zustand stores (workflowStore, executionStore, uiStore, collaborationStore)
- **UI** — Radix UI primitives + shadcn/ui components + Tailwind CSS
- **Canvas** — `@xyflow/react` for the node graph with collaboration cursors
- **Real-time stubs** — `yjs` + `y-websocket` + `peerjs` + `socket.io-client` (client-side wired, backend-ready)
- **Voice** — Web Speech API via `collaboration.ts`
- **Theming** — Custom ThemeProvider with dark (default) + light mode

## Key Source Directories
- `src/pages/` — Route-level pages (WorkspacePage)
- `src/components/workspace/` — All workspace UI (Topbar, Canvas, LeftPanel, RightPanel, BottomPanel, SynapseNode, CommandPalette, ToastStack)
- `src/components/ThemeProvider.tsx` — Dark/light theme context
- `src/stores/` — Zustand stores (workflow, execution, ui, collaboration)
- `src/hooks/` — Custom hooks (useAuth, useWorkspace, useExecution, useVoice, useDebugger)
- `src/lib/` — Utilities (api, collaboration, nodeConfigs, nodeTemplates, exportUtils, mockData)

## Key Features Implemented
1. **Dark/Light Theme** — toggle in topbar, persisted to localStorage, `.light` CSS class
2. **Run Workflow** — modal for input, simulated SSE execution with per-node status animations, live chunk streaming, auto-toast
3. **Voice Recording** — hold mic button → Web Speech API → transcript pill → auto-creates node on keyword match
4. **AI Debugger** — timeline pills, Suggest Fix (AI streaming), Apply Fix, Hallucination Score
5. **Comments** — per-node thread, emoji reactions, add/delete comments
6. **Export** — JSON + Python/LangGraph file download
7. **Share** — copies workspace URL to clipboard
8. **Collaboration Cursors** — colored arrows on canvas with collaborator names
9. **Toast Stack** — max 3 visible, auto-dismiss, type-colored
10. **Inspector** — dynamic field rendering driven by NODE_CONFIGS (15 node types)

## Running the App
```
npm run dev    # dev server on port 5000
```

## Dependencies Added / Verified
- `socket.io-client@4.7.5`
- `yjs@13.6.18`
- `y-websocket@2.0.4`
- `peerjs@1.5.4`
- `nanoid@5.0.7`
- `zustand@4.5.4`
- `next-themes` — NOT used (custom ThemeProvider instead)
- `framer-motion` — available for enhanced animations

## Migration Notes (Lovable → Replit)
- Removed `lovable-tagger` plugin from `vite.config.ts`
- Updated Vite server to bind to `0.0.0.0:5000` with `allowedHosts: true`
- Configured "Start application" workflow pointing to `npm run dev`
