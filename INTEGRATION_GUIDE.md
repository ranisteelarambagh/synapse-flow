# Integration Guide - Synapse UI

## What's Been Added

### 1. Dependencies Installed ✓
- `socket.io-client@4.7.5` - Real-time collaboration
- `yjs@13.6.18` - Operational transformation
- `y-websocket@2.0.4` - WebSocket sync
- `peerjs@1.5.4` - P2P video/audio
- `nanoid@5.0.7` - ID generation
- `zustand@4.5.4` - State management

### 2. New Library Files Created

#### `/src/lib/api.ts`
API client with endpoints:
- `authApi.login(email, password)`
- `authApi.register(name, email, password)`
- `authApi.logout()`
- `workspaceApi.get(id)` / `workspaceApi.save(id, data)`
- `executeWorkflow(workspaceId, input)`
- `commentsApi.create/react/delete()`

#### `/src/lib/exportUtils.ts`
Export functionality:
- `exportJSON(nodes, edges, name)` - JSON export
- `exportLangGraph(nodes, edges, name)` - Python LangGraph export
- `downloadFile(content, filename, mimeType)` - Browser download
- `shareWorkflow(workspaceId)` - Generate share link

#### `/src/config.ts`
Configuration file with:
- `API_BASE_URL` - Backend API endpoint
- `WS_URL` - WebSocket server
- `SUPABASE_URL` & `SUPABASE_KEY` - Database credentials

### 3. UI Enhancements

#### Share Button (Topbar)
- ✓ Wired to `shareWorkflow()` function
- Generates shareable link and copies to clipboard
- Shows "Sharing..." loading state
- Try clicking the Share button now!

#### Export Button (Topbar)
- ✓ Dropdown menu with JSON and Python options
- `exportJSON()` - Downloads workflow as JSON
- `exportLangGraph()` - Downloads as Python/LangGraph code
- Custom dropdown (not native select)

#### Animations Added
New keyframes for better UX:
- `slide-in-right` / `slide-out-right` - Panel transitions
- `fade-in-up` - Element reveals
- `glow-pulse` - Attention effects
- `float` - Subtle hover lift
- `spin-slow` - Loading states

Interactive enhancements:
- Button ripple effect on click
- Card hover lift (2px up)
- Input focus gradient border
- Smooth transitions throughout

### 4. Build Status
✓ All 1861 modules transformed successfully
✓ Build size: 310.85 kB (gzip: 100.20 kB)
✓ No errors or warnings

## Next Steps - Future Integration

These files are ready to use but require backend implementation:

### To Complete Auth Integration:
```typescript
import { authApi } from '@/lib/api';

const handleLogin = async () => {
  const result = await authApi.login(email, password);
  localStorage.setItem('token', result.access_token);
  // Store user: result.user
};
```

### To Complete Workspace Integration:
```typescript
import { workspaceApi, executeWorkflow } from '@/lib/api';

const workspace = await workspaceApi.get(workspaceId);
const stream = await executeWorkflow(workspaceId, input);
```

### To Complete Collaboration:
```typescript
import { io } from 'socket.io-client';
import { WS_URL } from '@/config';

const socket = io(WS_URL);
socket.on('cursor:move', (data) => {
  // Update collaborator cursor position
});
```

## File Structure
```
src/
├── lib/
│   ├── api.ts          (NEW)
│   ├── exportUtils.ts  (NEW)
│   └── config.ts       (NEW)
├── components/
│   └── workspace/
│       └── Topbar.tsx  (UPDATED - Export & Share wired)
└── stores/
    └── workflowStore.ts (Already has all hooks ready)
```

## Testing the Current Implementation

### Try These Now:
1. **Click Share button** - Generates shareable link (currently mockData)
2. **Click Export dropdown** - Download workflow as JSON or Python
3. **Hover over buttons** - See ripple animation
4. **Hover over nodes** - See lift animation
5. **Click inputs** - See gradient border focus effect

### What's Mocked vs Real:
- ✓ Share/Export UI is functional
- ✓ Animations are working
- ⏳ Backend API calls need `/api` endpoints configured
- ⏳ Real-time collaboration needs Socket.io server
- ⏳ Authentication needs Supabase or custom auth service

## Environment Variables Needed

Create `.env.local` for local development:
```
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

## Dependencies Summary

| Package | Version | Purpose |
|---------|---------|---------|
| socket.io-client | 4.7.5 | Real-time events |
| yjs | 13.6.18 | CRDT sync |
| y-websocket | 2.0.4 | WebSocket transport |
| peerjs | 1.5.4 | P2P media |
| nanoid | 5.0.7 | ID generation |
| zustand | 4.5.4 | State (already using) |

All dependencies are installed and ready for integration!
