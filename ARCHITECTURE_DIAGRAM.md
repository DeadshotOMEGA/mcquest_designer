# Architecture Diagram - MCQuest Designer Web App

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js App Router (SSR + ISR)               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐      ┌──────────────────┐                     │
│  │  / (Home Page)   │      │ /sign-in, /sign-up                    │
│  │  (Public)        │      │ (Clerk-Managed)  │                    │
│  └──────────────────┘      └──────────────────┘                     │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   /dashboard (Protected)                       │  │
│  │         Server Component: Fetch projects via Prisma            │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │  │
│  │  │  Project Card   │  │ Create Dialog    │  │ Add Member   │  │  │
│  │  │  (Grid Display) │  │ (Modal)          │  │ (Future)     │  │  │
│  │  └─────────────────┘  └──────────────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              /editor/:id (Protected, Force Dynamic)            │  │
│  │       Server Component: Validate Access + Load Snapshot        │  │
│  │  ┌───────────────────────────────────────────────────────────┐ │  │
│  │  │              EditorPageClient (Client)                    │ │  │
│  │  │  ┌─────────────────┬──────────────────────────────────┐  │ │  │
│  │  │  │  Header         │  Toolbar (Import, Sync Status)  │  │ │  │
│  │  │  ├─────────────────┼──────────────────────────────────┤  │ │  │
│  │  │  │ Chapter Panel   │    React Flow Canvas             │  │ │  │
│  │  │  │  (Sidebar)      │  ┌────────────────────────────┐  │  │ │  │
│  │  │  │                 │  │  Quest Nodes               │  │  │ │  │
│  │  │  │ • Chapter 1     │  │  • Draggable              │  │  │ │  │
│  │  │  │   • Quest A     │  │  • Selectable             │  │  │ │  │
│  │  │  │   • Quest B     │  │  • Connectable            │  │  │ │  │
│  │  │  │ • Chapter 2     │  │                            │  │  │ │  │
│  │  │  │   • Quest C     │  │  Dependency Edges          │  │  │ │  │
│  │  │  │                 │  │  • A → B, B → C            │  │  │ │  │
│  │  │  │                 │  │  • Auto-layout (dagre)    │  │  │ │  │
│  │  │  │                 │  └────────────────────────────┘  │  │ │  │
│  │  │  ├─────────────────┼──────────────────────────────────┤  │ │  │
│  │  │  │ Quest Inspector │  (Edit form, Right Panel)       │  │ │  │
│  │  │  │ • Name          │  • Title, Description           │  │ │  │
│  │  │  │ • Position      │  • Tasks, Rewards               │  │ │  │
│  │  │  │ • Tasks         │  • Position, Chapter            │  │ │  │
│  │  │  │ • Rewards       │                                 │  │ │  │
│  │  │  └─────────────────┴──────────────────────────────────┘  │ │  │
│  │  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  │  AutosaveProvider (Debounce 500ms)                 │ │  │
│  │  │  │  - Watches isDirty flag                             │ │  │
│  │  │  │  - PATCH /api/projects/:id/snapshot                │ │  │
│  │  │  │  - Sync indicator: Idle → Saving → Synced/Error    │ │  │
│  │  │  └──────────────────────────────────────────────────────┘ │  │
│  │  └───────────────────────────────────────────────────────────┘ │  │
│  │                                                                  │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │  Zustand Store (useEditorStore)                          │  │  │
│  │  │  • snapshot (ProjectSnapshot)                            │  │  │
│  │  │  • isDirty (boolean)                                     │  │  │
│  │  │  • syncState (idle | saving | error)                    │  │  │
│  │  │  • selection (questId, chapterId)                       │  │  │
│  │  │  • history (undo/redo stack, max 100)                  │  │  │
│  │  │  • isArranging (layout in progress)                     │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          API Routes (Protected)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST   /api/projects                Create project (default snapshot)
│  GET    /api/projects                List user's projects (with cursor)
│                                                                       │
│  PATCH  /api/projects/:id/snapshot   Autosave (optimistic lock)     │
│                                                                       │
│  POST   /api/projects/:projectId/import    SNBT import              │
│                                                                       │
│  POST   /api/webhooks/clerk          User sync from Clerk           │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ All routes:                                                  │   │
│  │ - Verify auth: requireUser() or getCurrentDbUser()          │   │
│  │ - Validate input: Zod schemas (boundary validation)         │   │
│  │ - Check RBAC: checkProjectAccess(projectId, role)           │   │
│  │ - Return: JSON + status codes (200, 201, 400, 409, 403, 404) │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      External Services                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐          ┌──────────────────┐                      │
│  │  Clerk      │          │  PostgreSQL      │                      │
│  │  (Auth)     │◄────────►│  (Database)      │                      │
│  │  • OAuth    │  Webhooks│                  │                      │
│  │  • Email/Pw │          │  Tables:         │                      │
│  │  • Sessions │          │  • User          │                      │
│  └─────────────┘          │  • Project       │                      │
│       ▲                    │  • ProjectMember │                      │
│       │                    │  • ProjectVersion│                      │
│       │                    └──────────────────┘                      │
│       │                                                              │
│    Browser                                                           │
│  (NextAuth                                                           │
│  via Clerk)                                                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Libraries (Shared Packages)                                │   │
│  │  • @mcquest/schema     - ProjectSnapshot, Zod schemas      │   │
│  │  • @mcquest/export     - SNBT compiler (future)            │   │
│  │  • @mcquest/snbt       - SNBT parser (import)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Creating & Editing Quests

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER CREATES NEW PROJECT                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /dashboard (Server)                                                 │
│    ├─ requireUser() → Clerk User                                    │
│    ├─ Fetch projects from DB                                        │
│    └─ Render ProjectCard + CreateDialog                             │
│                                                                       │
│  CreateProjectDialog (Client)                                        │
│    ├─ User fills form (name, description)                           │
│    ├─ Form submission                                               │
│    └─ POST /api/projects { name, description }                     │
│         └─ Server validates with CreateProjectRequestSchema         │
│         └─ Creates default snapshot via createDefaultSnapshot()    │
│         └─ Creates project row + user as OWNER member               │
│         └─ Returns project ID                                       │
│    └─ Client navigates to /editor/[projectId]                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 2. USER EDITS QUEST IN GRAPH                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  /editor/:id (Server)                                               │
│    ├─ requireUser() → Clerk User                                    │
│    ├─ Fetch project + check membership                              │
│    ├─ Pass projectData to EditorPageClient                          │
│    └─ Return JSX with latestSnapshot                                │
│                                                                       │
│  EditorPageClient (Client - 'use client')                           │
│    ├─ useEffect: Validate snapshot with ProjectSnapshotSchema      │
│    ├─ initializeProject(projectId, snapshot)                        │
│    └─ Render layout: header + chapter panel + canvas + inspector    │
│         └─ Canvas renders React Flow with quest nodes               │
│         └─ Inspector renders form (empty until quest selected)      │
│                                                                       │
│  User Action: Click quest node                                      │
│    ├─ React Flow detects onNodesSelect event                        │
│    ├─ QuestInspector form populates with quest data                │
│    └─ User edits quest name/description/tasks/rewards               │
│         └─ Input change handlers call store actions                 │
│         └─ Zustand action: setSnapshot(newSnapshot)                │
│         └─ isDirty = true                                           │
│                                                                       │
│  Zustand + Immer (Immutable Updates)                                │
│    ├─ state.snapshot.quests[idx].name = newValue                   │
│    ├─ state.isDirty = true                                          │
│    └─ Immer deep clones, so original immutable                      │
│                                                                       │
│  AutosaveProvider (Debounce)                                        │
│    ├─ Watches isDirty flag                                          │
│    ├─ User stops editing for 500ms                                 │
│    ├─ syncState.status = 'saving'                                  │
│    ├─ PATCH /api/projects/:id/snapshot                             │
│    │   ├─ Body: { snapshot, expectedVersion: project.updatedAt }  │
│    │   ├─ Server: checkProjectAccess(projectId, 'EDITOR')          │
│    │   ├─ Server: ProjectSnapshotSchema.parse(snapshot)            │
│    │   ├─ Server: Check optimistic lock (expectedVersion match?)    │
│    │   ├─ Server: Update project.latestSnapshot + metadata.updatedAt│
│    │   ├─ Server: Return 200 OK + updated project                  │
│    │   └─ Client: isDirty = false, syncState.status = 'idle'       │
│    └─ SyncIndicator shows green checkmark                           │
│                                                                       │
│  React Flow Re-render                                               │
│    ├─ Subscription to Zustand triggers re-render                    │
│    └─ Quest node label updates                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 3. USER CREATES DEPENDENCY (DRAG EDGE)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  React Flow Canvas (Client)                                         │
│    ├─ User drags from quest A output to quest B input               │
│    ├─ React Flow fires onConnect event                              │
│    ├─ Handler calls: updateDependency('add', fromId, toId)          │
│    └─ Zustand action:                                               │
│         ├─ snapshot.dependencies.push({ from, to })                │
│         ├─ isDirty = true                                           │
│         └─ Re-render with new edge                                  │
│                                                                       │
│  AutosaveProvider (same as above)                                   │
│    ├─ 500ms debounce                                               │
│    ├─ PATCH /api/projects/:id/snapshot                             │
│    └─ Server persists new dependency                               │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ 4. UNDO/REDO                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Before user edits:                                                 │
│    └─ pushUndoPoint() saved in history.undoStack                    │
│                                                                       │
│  User presses Ctrl+Z:                                               │
│    ├─ undo() action:                                                │
│    │  ├─ Current snapshot → history.redoStack                       │
│    │  ├─ history.undoStack.pop() → setSnapshot                     │
│    │  └─ isDirty = true (undo counts as a change)                   │
│    └─ Canvas re-renders                                             │
│                                                                       │
│  Server-side:                                                       │
│    └─ AutosaveProvider will persist undo state like any other edit │
│    └─ No version history yet (all snapshots overwrite latestSnapshot)│
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: SNBT Import

```
┌─────────────────────────────────────────────────────────────────────┐
│ SNBT IMPORT FLOW                                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ 1. Editor → Click "Import" button                                   │
│    └─ Link to /dashboard/projects/:id/import (NOT YET IMPLEMENTED) │
│                                                                       │
│ 2. File Upload (Client)                                             │
│    ├─ FileUpload component: drag-and-drop or file input             │
│    ├─ Select .snbt files (e.g., quests.snbt, lang/en_us.snbt)      │
│    └─ Trigger parseSnbtFiles() from @mcquest/snbt                   │
│                                                                       │
│ 3. SNBT Parsing (Client)                                            │
│    ├─ @mcquest/snbt converter:                                      │
│    │  ├─ Parse SNBT syntax                                          │
│    │  ├─ Extract chapters, quests, dependencies                     │
│    │  ├─ Map SNBT structure to ProjectSnapshot                      │
│    │  └─ Collect validation problems (errors/warnings)              │
│    └─ Return: { snapshot, problems: ImportProblem[] }               │
│                                                                       │
│ 4. Import Preview (Client)                                          │
│    ├─ ImportPreview component displays:                             │
│    │  ├─ Project summary (chapters, quests, dependencies)           │
│    │  ├─ Error badges (blocking errors)                             │
│    │  ├─ Warning badges (non-blocking)                              │
│    │  ├─ Chapter/quest sample list                                  │
│    │  └─ Buttons: "Cancel" or "Confirm Import"                     │
│    └─ If errors exist: "Confirm" button disabled                    │
│                                                                       │
│ 5. User Confirms Import (Client)                                    │
│    └─ POST /api/projects/:projectId/import                         │
│         ├─ Body: { snapshot: ProjectSnapshot }                      │
│         ├─ Server: checkProjectAccess(projectId, 'EDITOR')          │
│         ├─ Server: ProjectSnapshotSchema.parse(snapshot)            │
│         ├─ Server: Create ProjectVersion record                     │
│         │   └─ Audit trail with versionNumber, createdById, comment │
│         ├─ Server: Update project.latestSnapshot                    │
│         └─ Server: Return 201 + versionId, versionNumber            │
│                                                                       │
│ 6. Editor Updates (Client)                                          │
│    ├─ EditorPageClient receives new snapshot from response          │
│    ├─ initializeProject(projectId, newSnapshot)                     │
│    ├─ useEditorStore replaces snapshot                              │
│    ├─ isDirty = false (freshly imported)                            │
│    ├─ Canvas re-renders with imported quests                        │
│    └─ Success toast shown                                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## State Management Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EDITOR STATE (Zustand + Immer)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ EditorStore = {                                                     │
│                                                                       │
│   projectId: string | null                                          │
│     └─ Set on mount via initializeProject()                         │
│     └─ Used to construct API routes                                 │
│                                                                       │
│   snapshot: ProjectSnapshot | null                                  │
│     └─ The working copy of the entire questbook                     │
│     └─ Shape:                                                        │
│       ├─ metadata: { projectName, schemaVersion, exportVersion }   │
│       ├─ chapters: Chapter[]                                        │
│       │   └─ id (UUID), name, order, description                   │
│       ├─ quests: Quest[]                                            │
│       │   └─ id, name, description, chapter, position, tasks, ... │
│       ├─ dependencies: Dependency[]                                │
│       │   └─ fromQuest, toQuest                                    │
│       ├─ uiState: { activeChapterId, selectedQuestId, viewport }  │
│       └─ rewards, tasks (type definitions)                         │
│                                                                       │
│   isDirty: boolean                                                  │
│     └─ false = saved to server                                      │
│     └─ true = local changes not yet persisted                       │
│     └─ AutosaveProvider watches this flag                           │
│                                                                       │
│   syncState: { status: 'idle' | 'saving' | 'error' }               │
│     └─ Displayed in SyncIndicator badge                             │
│     └─ idle: ready for edits                                        │
│     └─ saving: PATCH in flight                                      │
│     └─ error: PATCH failed (show user warning)                      │
│                                                                       │
│   selection: { selectedQuestId, selectedChapterId }                │
│     └─ Which quest/chapter user is viewing in inspector             │
│     └─ Drives inspector form content                                │
│                                                                       │
│   history: { undoStack, redoStack }                                │
│     └─ Each entry is full ProjectSnapshot snapshot                 │
│     └─ Max 100 items in each stack                                  │
│     └─ pushUndoPoint() before major changes                         │
│                                                                       │
│   isArranging: boolean                                              │
│     └─ true during auto-layout (dagre)                              │
│     └─ false when done                                              │
│     └─ Prevents interaction during layout animation                 │
│                                                                       │
│ }                                                                    │
│                                                                       │
│ Actions:                                                            │
│   • initializeProject(projectId, snapshot)                          │
│   • setSnapshot(snapshot)                                           │
│   • updateQuest(questId, update)                                    │
│   • updateChapter(chapterId, update)                                │
│   • updateDependencies(ops: DependencyOperation[])                  │
│   • pushUndoPoint()                                                 │
│   • undo() / redo()                                                 │
│   • setSyncState(status)                                            │
│   • arrangeLayout()                                                 │
│   • clearSelection()                                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
RootLayout (Server)
├─ ClerkProvider (if configured)
├─ Toaster (notifications)
└─ {children}
   │
   ├─ page.tsx (Home, public)
   │
   ├─ sign-in/page.tsx (Clerk-managed)
   │
   ├─ sign-up/page.tsx (Clerk-managed)
   │
   ├─ DashboardLayout (Server, requireUser)
   │  ├─ Header with logo, nav, UserButton
   │  └─ {children}
   │     │
   │     └─ dashboard/page.tsx (Server)
   │        ├─ Heading: "Projects"
   │        ├─ CreateProjectDialog
   │        ├─ Suspense
   │        └─ ProjectList (async component)
   │           └─ ProjectCard (multiple)
   │
   └─ editor/[id]/page.tsx (Server, requireUser + checkMembership)
      └─ EditorPageClient (Client - 'use client')
         ├─ Header (Dashboard button, Project name, Import, SyncIndicator)
         ├─ Main: Flex container (264px left sidebar + flex-1 canvas)
         │  ├─ Aside: ChapterPanel (Client)
         │  │  └─ Chapter list (expandable)
         │  │     └─ Quest list per chapter
         │  │
         │  └─ Main: EditorCanvas (Client, 'use client')
         │     └─ ReactFlowProvider
         │        ├─ Background (grid, dots)
         │        ├─ Controls
         │        ├─ MiniMap
         │        ├─ Panel (top-right, auto-layout button)
         │        ├─ Nodes
         │        │  ├─ QuestNode (detailed)
         │        │  └─ CompactQuestNode (minimal)
         │        │
         │        └─ Edges
         │           └─ DependencyEdge (custom)
         │
         └─ Aside: QuestInspector (Client, optional bottom or right)
            └─ Form
               ├─ Quest name input
               ├─ Description textarea
               ├─ Chapter select
               ├─ Position inputs
               ├─ Tasks section (expandable)
               ├─ Rewards section (expandable)
               └─ Save button

AutosaveProvider (Client wrapper)
├─ Debounce logic
├─ PATCH /api/projects/:id/snapshot on isDirty
└─ Update syncState

Zustand (useEditorStore)
└─ Global state accessible from any component
   └─ Components call actions to mutate snapshot
   └─ Immer middleware handles immutability
```

---

## Database Schema Overview

```
┌──────────────────────────────────────────────────────────────┐
│ User                                                         │
├──────────────────────────────────────────────────────────────┤
│ id           UUID primary key                                │
│ clerkId      String (from Clerk)                             │
│ email        String                                          │
│ name         String (optional)                               │
│ avatarUrl    String (optional)                               │
│ createdAt    DateTime                                        │
│ updatedAt    DateTime                                        │
│ projectMembers  ProjectMember[]  (one-to-many)              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Project                                                      │
├──────────────────────────────────────────────────────────────┤
│ id           UUID primary key                                │
│ name         String                                          │
│ description  String (optional)                               │
│ latestSnapshot  JSON (ProjectSnapshot as JSONB)              │
│ createdAt    DateTime                                        │
│ updatedAt    DateTime                                        │
│ members      ProjectMember[]  (one-to-many)                 │
│ versions     ProjectVersion[]  (one-to-many)                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ProjectMember                                                │
├──────────────────────────────────────────────────────────────┤
│ projectId    UUID FK                                         │
│ userId       UUID FK                                         │
│ role         Enum: OWNER | EDITOR | VIEWER                  │
│ createdAt    DateTime                                        │
│ PRIMARY KEY: (projectId, userId)                            │
│ FOREIGN KEY: projectId → Project.id                         │
│ FOREIGN KEY: userId → User.id                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ ProjectVersion (Audit Trail)                                │
├──────────────────────────────────────────────────────────────┤
│ id           UUID primary key                                │
│ projectId    UUID FK                                         │
│ snapshot     JSON (ProjectSnapshot as JSONB)                │
│ versionNumber  Int (auto-increment per project)             │
│ createdById  UUID FK (User who created this version)        │
│ comment      String (e.g., "Imported from SNBT files")      │
│ createdAt    DateTime                                        │
│ FOREIGN KEY: projectId → Project.id                         │
│ FOREIGN KEY: createdById → User.id                          │
└──────────────────────────────────────────────────────────────┘
```
