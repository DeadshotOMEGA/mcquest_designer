# Testing Entry Points - MCQuest Designer

Quick reference for critical user flows and testing entry points in the Next.js web app.

## App Structure Overview

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Home (/)
│   ├── layout.tsx               # Root with Clerk + Toaster
│   ├── dashboard/               # Project list
│   │   ├── page.tsx             # /dashboard
│   │   └── layout.tsx           # Header + nav
│   ├── editor/[id]/             # Quest graph editor
│   │   └── page.tsx             # /editor/:id
│   ├── sign-in/                 # Clerk sign-in page
│   ├── sign-up/                 # Clerk sign-up page
│   ├── settings/                # User settings (future)
│   └── api/                     # API routes
│       ├── projects/            # POST (create), GET (list)
│       ├── projects/[id]/snapshot/  # PATCH (autosave)
│       ├── projects/[id]/       # GET (single project)
│       ├── projects/[projectId]/import/  # POST (SNBT import)
│       └── webhooks/clerk/      # Clerk user sync
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── editor/                  # React Flow editor
│   │   ├── editor-page-client.tsx     # Main layout
│   │   ├── editor-canvas.tsx          # Canvas + nodes/edges
│   │   ├── nodes/                     # Quest nodes
│   │   ├── edges/                     # Dependency edges
│   │   ├── panels/                    # Chapter list, inspector
│   │   ├── autosave-provider.tsx      # Debounce & sync
│   │   └── sync-indicator.tsx         # Status badge
│   ├── import/                  # SNBT import flow
│   │   ├── file-upload.tsx
│   │   └── import-preview.tsx
│   ├── create-project-dialog.tsx
│   └── project-card.tsx
├── lib/
│   ├── auth.ts                  # requireUser, checkProjectAccess
│   ├── db.ts                    # Prisma client
│   ├── api-error.ts             # Error handling
│   ├── store/
│   │   └── editor-store.ts      # Zustand + Immer (quest state)
│   ├── editor/
│   │   ├── default-snapshot.ts
│   │   └── snapshot-mapper.ts
│   └── import/
│       └── parse-snbt-files.ts
└── middleware.ts                # Clerk middleware
```

---

## Critical User Flows

### 1. Authentication Flow

**Entry Point:** `src/app/page.tsx` (home page)

```
Home Page (unauthenticated)
  ↓
Click "Get Started" or "Sign In"
  ↓
Clerk sign-up/sign-in modal (OAuth or email/password)
  ↓
POST /api/webhooks/clerk (Clerk syncs user to DB)
  ↓
Redirect to /dashboard
  ↓
Dashboard loads with project list
```

**Testing:**
- Sign up with new email → verify user record created
- Sign in with existing email → verify redirect to dashboard
- OAuth sign-in (GitHub/Google) → verify Clerk webhook synced user
- Sign out via UserButton → verify redirect to home
- Access /dashboard unauthenticated → verify redirect to /sign-in

**Key Files:**
- `/src/app/page.tsx` - Home with auth check via `getAuthOrNull()`
- `/src/app/sign-in/[[...sign-in]]/page.tsx` - Clerk-managed
- `/src/app/sign-up/[[...sign-up]]/page.tsx` - Clerk-managed
- `/src/middleware.ts` - Route protection (first line of defense)
- `/src/lib/auth.ts` - Server-side auth utilities
- `/src/app/api/webhooks/clerk/route.ts` - User sync webhook

---

### 2. Project CRUD (Dashboard)

**Entry Point:** `src/app/dashboard/page.tsx` (project list)

```
/dashboard loads
  ↓
GET /api/projects (fetch user's projects)
  ↓
Display project cards in grid
  ↓
User actions:
  - Click "New Project" → dialog
  - Fill form (name, description)
  - POST /api/projects → create project with default snapshot
  - Redirect to /editor/[projectId]
  ↓
  OR
  ↓
Click project card → /editor/[projectId]
```

**Testing:**
- Load dashboard → projects list appears
- Create new project → dialog opens, submit creates project, redirected to editor
- Project appears in dashboard list → verify name, description, member count
- Edit project (future) → update name/description
- Delete project (future)
- Filter/search projects (future)

**Key Files:**
- `/src/app/dashboard/page.tsx` - Server Component, fetches projects
- `/src/app/dashboard/layout.tsx` - Header with UserButton
- `/src/components/project-card.tsx` - Card component
- `/src/components/create-project-dialog.tsx` - Create modal
- `/src/app/api/projects/route.ts` - GET, POST endpoints

---

### 3. Quest Graph Editor

**Entry Point:** `src/app/editor/[id]/page.tsx` (quest graph)

```
/editor/:id loads
  ↓
Server: Verify user is project member
  ↓
Server: Fetch project + latest snapshot
  ↓
Client: EditorPageClient initializes
  ↓
Zustand store: Load snapshot via useEditorStore
  ↓
React Flow: Render quest nodes + dependency edges
  ↓
User edits:
  - Move quest node → isDirty = true
  - Change quest name in inspector → isDirty = true
  - Add dependency edge → isDirty = true
  ↓
AutosaveProvider: Debounce 500ms
  ↓
PATCH /api/projects/:id/snapshot
  - Send snapshot + expectedVersion (optimistic lock)
  - Server validates ProjectSnapshot
  - Server persists snapshot
  ↓
SyncIndicator: "Saving..." → "Synced" (or error)
```

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Header: [Dashboard] | Project Name (Role) | [Import] │
├─────────────────┬──────────────────────────────────────┤
│  Chapter List   │          React Flow Canvas            │
│  (left 264px)   │    - Quest nodes (draggable)          │
│                 │    - Dependency edges                 │
│  [Chapter 1]    │    - Auto-layout (dagre)              │
│  [Chapter 2]    │                                       │
│  (scroll)       │                                       │
├─────────────────┼──────────────────────────────────────┤
│ Quest Inspector │ (Right panel, collapsible)            │
│ (edit form)     │                                       │
└──────────────────────────────────────────────────────────┘
```

**Testing:**
- Load editor → canvas renders with quest nodes
- Quest node selection → inspector panel opens on right
- Edit quest name in inspector → save → node updates, autosave triggers
- Drag quest node → isDirty = true, sync status shows "Saving..."
- Create dependency edge (drag between nodes) → edge renders, snapshot updates
- Move node to different chapter → updates chapter assignment
- Undo (Ctrl+Z) → reverts last change
- Redo (Ctrl+Y) → reapplies change
- Sync conflict → expectedVersion mismatch → 409 error shown
- Close editor without saving → warning prompt (future)

**Key Files:**
- `/src/app/editor/[id]/page.tsx` - Server Component, validates access
- `/src/components/editor/editor-page-client.tsx` - Main layout
- `/src/components/editor/editor-canvas.tsx` - React Flow canvas
- `/src/components/editor/panels/chapter-panel.tsx` - Left sidebar
- `/src/components/editor/panels/inspector/quest-inspector.tsx` - Right sidebar
- `/src/components/editor/autosave-provider.tsx` - Debounce + sync
- `/src/components/editor/sync-indicator.tsx` - Status badge
- `/src/lib/store/editor-store.ts` - Zustand state management
- `/src/app/api/projects/[id]/snapshot/route.ts` - PATCH endpoint

---

### 4. SNBT Import Flow

**Entry Point:** Editor header "Import" button

```
Editor page loads
  ↓
User clicks "Import" button
  ↓
Link to /dashboard/projects/:id/import (NOT YET IMPLEMENTED)
  ↓
File upload component (drag-and-drop or select)
  ↓
Parse SNBT files → snapshot + validation problems
  ↓
ImportPreview component:
  - Show project summary (chapters, quests, dependencies)
  - Show validation errors/warnings with badges
  - Show chapter/quest samples
  ↓
User confirms → POST /api/projects/:projectId/import
  - Body: { snapshot: ProjectSnapshot }
  - Server validates with Zod
  - Server creates ProjectVersion (audit)
  - Server sets as latestSnapshot
  ↓
Editor snapshot replaced
  ↓
Success toast shown
```

**Testing:**
- Upload valid SNBT files → preview shows parsed data
- Upload invalid files → errors shown in ImportPreview, import blocked
- Confirm import → POST called, snapshot updated, editor refreshed
- Cancel import → back to file upload
- Multiple chapters/quests → all preview correctly
- Import with validation warnings → shows warning badges but allows import
- Sync status updates during import

**Key Files:**
- `/src/components/import/file-upload.tsx` - Drag-and-drop upload
- `/src/components/import/import-preview.tsx` - Preview + confirm
- `/src/app/api/projects/[projectId]/import/route.ts` - POST endpoint
- `/src/lib/import/parse-snbt-files.ts` - SNBT parsing

---

## API Route Summary

### POST /api/projects - Create Project
- **Auth:** Requires authenticated user
- **Input:** `{ name: string, description?: string }`
- **Output:** `{ project: { id, name, description, latestSnapshot, ... } }`
- **Status:** 201
- **Creates:** Default snapshot via `createDefaultSnapshot(name)`

### GET /api/projects - List Projects
- **Auth:** Requires authenticated user
- **Query:** `?limit=10&cursor=...&role=OWNER`
- **Output:** `{ projects: [...], pagination: { nextCursor, hasMore } }`
- **Status:** 200

### PATCH /api/projects/:id/snapshot - Autosave
- **Auth:** Requires EDITOR+ role
- **Input:** `{ snapshot: ProjectSnapshot, expectedVersion?: ISO8601 }`
- **Output:** `{ project: { id, name, ..., latestSnapshot } }`
- **Status:** 200 (or 409 Conflict if expectedVersion mismatch)
- **Optimistic Locking:** Prevents lost updates in concurrent edits

### POST /api/projects/:projectId/import - Import SNBT
- **Auth:** Requires EDITOR+ role
- **Input:** `{ snapshot: ProjectSnapshot }`
- **Output:** `{ success, versionId, versionNumber, project }`
- **Status:** 201
- **Creates:** ProjectVersion record for audit trail

### POST /api/webhooks/clerk - Clerk Webhook
- **Purpose:** Syncs Clerk user events to database
- **Events:** user.created, user.updated, user.deleted
- **Auth:** Webhook signature verification (CLERK_WEBHOOK_SECRET)

---

## Authentication & Authorization

### Auth Functions (src/lib/auth.ts)

| Function | Behavior | Use Case |
|----------|----------|----------|
| `requireUser()` | Returns Clerk User or throws | Server Components that MUST be authenticated |
| `requireAuth()` | Returns userId or throws | Route Handlers that MUST be authenticated |
| `getAuthOrNull()` | Returns userId or null | Landing page (no throw) |
| `getCurrentDbUser()` | Returns/creates DB user from Clerk | Route Handlers (upserts to Postgres) |
| `checkProjectAccess(projectId, role?)` | Verifies membership + role | Protected project routes |

### Role Hierarchy
```
VIEWER (0)      <- Read-only access
  < EDITOR (1)  <- Can edit snapshot
  < OWNER (2)   <- Can edit + delete + share
```

---

## State Management

### Zustand Store (src/lib/store/editor-store.ts)

**State:**
```typescript
{
  projectId: string | null
  snapshot: ProjectSnapshot | null
  isDirty: boolean                    // Unsaved changes
  syncState: { status: 'idle' | 'saving' | 'error' }
  selection: {
    selectedQuestId: string | null
    selectedChapterId: string | null
  }
  history: {
    undoStack: ProjectSnapshot[]      // Max 100 snapshots
    redoStack: ProjectSnapshot[]
  }
  isArranging: boolean                // Auto-layout in progress
}
```

**Actions:**
- `initializeProject(projectId, snapshot)` - On editor load
- `setSnapshot(snapshot)` - Set working snapshot
- `updateQuest(questId, update)` - Edit quest
- `updateDependency(from, to)` - Add/remove dependency
- `pushUndoPoint()` - Save for undo
- `undo()` / `redo()` - History navigation
- `setSyncState(status)` - Update sync status badge

---

## Component Patterns

### Server Components
- `/dashboard/page.tsx` - Fetch projects
- `/editor/[id]/page.tsx` - Validate access, fetch project

### Client Components (use 'use client')
- `EditorPageClient` - Main editor layout
- `EditorCanvas` - React Flow graph
- `ChapterPanel` - Left sidebar
- `QuestInspector` - Right sidebar forms
- `ImportPreview` - SNBT preview

### Providers
- `ClerkProvider` (root layout) - Auth
- `AutosaveProvider` (editor) - Debounce + sync
- React Flow Provider (canvas)
- Zustand stores (global state)

### UI Library
- `shadcn/ui` for primitives (button, dialog, input, card, etc.)
- `Sonner` for toast notifications
- `React Flow` for graph visualization

---

## Security Mitigations

1. **CVE-2025-29927:** Auth verified in every Server Component + Route Handler (not just middleware)
2. **SNBT Injection:** All snapshot input validated with Zod before persisting
3. **RBAC:** Role hierarchy enforced for all project mutations
4. **Optimistic Locking:** expectedVersion prevents lost updates
5. **Boundary Validation:** All API inputs treated as `unknown` until parsed with Zod

---

## Future Routes (Not Yet Implemented)

- `GET /dashboard/projects/:id/import` - Import UI page
- `POST /api/projects/:id/export` - Export to SNBT ZIP
- `PATCH /api/projects/:id` - Update project metadata
- `DELETE /api/projects/:id` - Delete project
- `GET /settings` - User settings page
- Role management endpoints (share, invite, remove member)

---

## Quick Test Checklist

- [ ] Sign up → user created in DB
- [ ] Sign in → redirected to dashboard
- [ ] Create project → appears in list
- [ ] Open editor → quest graph renders
- [ ] Edit quest → autosave triggers
- [ ] Create dependency → edge renders
- [ ] Undo/redo → history works
- [ ] Import SNBT → preview shows data
- [ ] Access control → VIEWER can't edit
- [ ] Sync conflict → 409 error shown

---

See `docs/temp/app-structure-investigation.yaml` for comprehensive investigation with data flows, patterns, and detailed testing scenarios.
