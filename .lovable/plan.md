

# Synapse — Real-Time Collaborative AI Workflow Builder

## Phase 1: Foundation & Shell
- Set up all design tokens as CSS custom properties (colors, fonts, easing curves)
- Load Google Fonts: Syne, DM Sans, JetBrains Mono
- Build the 3-panel + topbar + bottom strip app shell using CSS Grid
- Resizable panels with drag handles, collapse/expand animations (250ms expo-out)
- Panel state persistence in localStorage
- Dark mode by default with `--bg-void` canvas background

## Phase 2: Topbar
- Logo SVG (two connected nodes) + "Synapse" gradient wordmark (violet→teal)
- Editable workspace name with unsaved indicator (amber pulsing dot)
- Mock collaborator presence avatars (stacked, colored rings, tooltips)
- "▶ Run Workflow" button with ⌘R hint, transforms to "■ Stop" when running
- ⌘K trigger, Share, Export dropdown, user avatar menu

## Phase 3: Canvas (React Flow)
- Custom dot grid background (PCB-style, scales with zoom)
- Custom node cards (220px wide) with header/config/handles anatomy
- Category-colored nodes: AI (violet), Tool (teal), Logic (amber), I/O (red)
- Node states: idle, running (shimmer + pulse), success (flash), error, selected
- Custom smoothstep edges with flow animation on selection
- Minimap and zoom controls, dark themed
- Node drag physics: scale on pickup, ±2° rotation from velocity, spring on drop
- Mock 4-node workflow pre-loaded (Input → Agent → HTTP Request → Output)
- Canvas context menus (right-click on background and nodes)

## Phase 4: Left Panel
- **Node Library** (top): Searchable, categorized node cards with colored left borders
  - Drag-to-canvas with ghost preview, snap animation on drop
  - Categories: AI Nodes, Tool Nodes, Logic Nodes, I/O Nodes
- **Workspace Tree** (bottom): Flat list of canvas nodes with status dots
  - Click to pan/zoom to node, right-click context menu

## Phase 5: Right Panel (3 Tabs)
- **Inspector**: Node config form (name, system prompt, model dropdown with provider chips, temperature slider, max tokens, tools, memory toggle)
- **AI Debugger**: Execution timeline (horizontal pills), node result cards with collapsible I/O, error diff view with "Suggest Fix" + "Apply Fix", hallucination score gauge
- **Comments**: Threaded comments per node or global, @mentions, emoji reactions, click-to-pan

## Phase 6: Bottom Panel
- Collapsible terminal strip with toggle via backtick key
- Log stream with timestamps, level badges (INFO/WARN/ERROR/DEBUG)
- JetBrains Mono font, auto-scroll with pause/resume
- Node filter and level filter controls

## Phase 7: Command Palette (⌘K)
- Full-screen scrim with backdrop blur
- 640px centered modal with search input
- Grouped results: Add Node, Actions, Collaborators
- Keyboard navigation, scale animation on open/close

## Phase 8: Overlays & Modals
- Welcome/onboarding modal (workspace name → template selection → invite)
- Share modal (URL, permissions, email invite)
- Export modal (JSON / LangGraph Python tabs with syntax highlighting)
- Floating video/voice panel (collapsed pill / expanded tiles, draggable)

## Phase 9: State & Interactions
- Zustand stores: workflow, collaboration, execution, UI
- All keyboard shortcuts (⌘Z, ⌘R, ⌘K, ⌘S, Backspace, D, Tab, etc.)
- Mock collaborator cursors with trailing fade and name labels
- Toast notifications (save, delete with undo, copy, workflow status)
- Mock execution data for debugger tab

## Phase 10: Routing & Polish
- Routes: `/` → redirect, `/workspace/:id`, `/workspace/new`, `/settings`, `/share/:id`, 404
- Lazy loading with React.lazy + Suspense
- All 7 signature animations (drag rotation, shimmer, cursor trails, diff view, dot grid scaling, edge flow, timeline fill)
- React.memo optimization on canvas nodes
- Zero console errors on load

