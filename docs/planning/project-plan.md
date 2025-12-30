# FTB Quests Web Platform – Detailed Project Plan

## 1. Project Overview

### 1.1 Purpose
Build a full-featured web platform that allows Minecraft modpack creators to design **FTB Quests** questbooks outside the game using a visual, graph-based editor, manage projects collaboratively, version their work, and export quest structures into files compatible with FTB Quests for direct import into a Minecraft instance.

The platform focuses on **structure, logic, and layout**, intentionally excluding custom image/texture uploading. Users will handle textures and resource packs manually inside Minecraft after import.

### 1.2 Core Value Proposition
- Eliminate the need to design quests entirely in-game
- Provide a clear visual overview of quest progression and dependencies
- Enable versioning, collaboration, and reuse of quest designs
- Reduce iteration time for large or complex questbooks

---

## 2. Scope Definition

### 2.1 In Scope (v1–v1.5)
- Account-based platform with authentication
- Project creation and management
- Visual quest graph editor (nodes + dependencies)
- Chapter-based quest organization
- Quest detail editor (tasks, rewards, metadata – limited set)
- Autosave and manual versioning
- Export to FTB Quests-compatible SNBT + folder structure
- Shareable read-only project links

### 2.2 Explicitly Out of Scope (v1)
- Custom image/icon uploads
- Resource pack generation
- Full parity with all FTB Quests task/reward types
- Real-time collaborative editing (Google Docs-style)
- In-game integration or live syncing

---

## 3. Technical Architecture

### 3.1 High-Level Architecture

```
Browser (Next.js + React)
        |
        | HTTPS / JSON
        v
Next.js App (API Routes)
        |
        | Prisma
        v
PostgreSQL (JSONB snapshots)
        |
        | Export Job
        v
SNBT Generator → ZIP Export
```

Single-repository, full-stack TypeScript application.

---

## 4. Frontend Architecture

### 4.1 Framework & Core Libraries
- Next.js (App Router)
- React + TypeScript
- React Flow (graph editor)
- Zustand (editor state + undo/redo)
- TanStack Query (server state)
- Zod (schema validation, shared with backend)
- shadcn/ui or similar component system

### 4.2 Core UI Layout

| Area | Function |
|----|----|
| Top Bar | Project name, version selector, export, validation |
| Left Panel | Chapter list, quest tree |
| Center Canvas | Graph editor (grid, nodes, edges) |
| Right Panel | Inspector (quest details, tasks, rewards) |

### 4.3 Graph Editor Features
- Grid snapping
- Pan & zoom
- Node dragging
- Dependency edges
- Chapter-specific canvases
- Visual indication of validation errors

### 4.4 Quest Node UI
Each node visually represents:
- Icon reference (item ID / placeholder)
- Quest title
- Completion state (design-time only)
- Shape/size approximation

---

## 5. Backend Architecture

### 5.1 Framework
- Next.js API Route Handlers
- TypeScript end-to-end

### 5.2 Authentication
- Clerk (managed auth service)
- OAuth providers handled by Clerk (GitHub, Discord, Google)
- Built-in user management dashboard
- Free tier: 10,000 MAU

### 5.3 Authorization Model
- ProjectMember roles:
  - OWNER
  - EDITOR
  - VIEWER
- Share tokens:
  - Read-only access
  - Optional expiration

---

## 6. Data Model & Persistence

### 6.1 Storage Strategy
Use **PostgreSQL JSONB snapshots** as the source of truth.

Rationale:
- Fast load times
- Simple versioning
- Flexible schema evolution

### 6.2 Core Tables

#### projects
- id
- name
- ownerId
- createdAt
- updatedAt
- latestSnapshot (JSONB)

#### project_members
- projectId
- userId
- role

#### project_versions
- id
- projectId
- versionNumber
- createdBy
- createdAt
- message
- snapshot (JSONB)

#### share_tokens
- id
- projectId
- permission
- expiresAt

---

## 7. Internal Project Snapshot Schema

### 7.1 Top-Level
- metadata
  - projectName
  - targetMcVersion
  - targetFtbqVersion
- chapters[]
- quests[]
- dependencies[]
- uiState

### 7.2 Chapter
- id
- title
- description
- order
- background (reference only)
- viewport (pan/zoom)

### 7.3 Quest
- id (stable UUID)
- chapterId
- title
- subtitle
- description
- x, y
- width, height
- shape
- iconReference
- tasks[]
- rewards[]
- settings

### 7.4 Dependency
- fromQuestId
- toQuestId
- type (AND / OR)

---

## 8. Versioning Strategy

### 8.1 Autosave
- Debounced autosave updates `latestSnapshot`
- No version created automatically

### 8.2 Manual Versions
- User creates named versions ("Initial Layout", "Beta 1", etc.)
- Immutable snapshots
- Can be restored or exported

### 8.3 Future Enhancements
- Diff summaries
- Branching / forked projects

---

## 9. Validation & Linting

### 9.1 Validation Rules
- Missing titles/descriptions
- Orphaned quests
- Circular dependencies
- Unsupported task/reward combinations
- Invalid positioning

### 9.2 Validation Output
- Inline UI warnings
- Validation panel summary
- Export blocking on critical errors (optional)

---

## 10. Export Pipeline

### 10.1 Export Flow
1. User requests export (latest or selected version)
2. Backend validates snapshot
3. Snapshot compiled into FTB Quests SNBT format
4. Folder structure generated
5. ZIP file returned to user

### 10.2 Export Contents
- `config/ftbquests/quests/chapters/*.snbt`
- `config/ftbquests/quests/quests/*.snbt`
- Optional:
  - lang files
  - theme file placeholders

### 10.3 SNBT Generation
- Deterministic formatting
- Stable quest IDs
- Version-aware field handling

---

## 11. Collaboration Model

### 11.1 Phase 1
- Multiple editors
- Last-write-wins
- Activity log

### 11.2 Phase 2
- Soft locking (chapter or quest level)
- Presence indicators

### 11.3 Phase 3 (Future)
- Realtime collaboration (WebSockets + CRDT)

---

## 12. Deployment & Infrastructure

### 12.1 Hosting (Free Tier Stack)
- **App + API**: Vercel (free tier)
- **Database**: Neon PostgreSQL (free tier: 0.5GB storage)
- **Auth**: Clerk (free tier: 10,000 MAU)
- **Error Tracking**: Sentry (free tier: 5K errors/month)

### 12.2 Environments
- Local (SQLite or local Postgres via Docker)
- Production (Vercel + Neon)

### 12.3 Monorepo Structure
```
/apps/web/           # Next.js App Router
/packages/schema/    # Shared Zod schemas
/packages/export/    # SNBT compiler
/testdata/ftbq/1.21/ # Golden exports
```

Managed with **pnpm workspaces**.

---

## 13. Security Considerations

- Role-based access enforcement
- Share token scoping
- Export rate limiting
- Input validation (Zod)

---

## 14. Testing Strategy

### 14.1 Unit & Integration Tests (Vitest)
- Zod schema validation
- Export compiler transforms
- ID mapping determinism
- API route handlers

### 14.2 E2E Tests (Playwright)
- Auth flow (Clerk)
- Project creation and editing
- Graph editor interactions
- Export verification

### 14.3 Golden Export Testing
- Compare compiler output against golden files from real FTB Quests
- Manual verification in Minecraft 1.21.x periodically

---

## 15. Observability

### 15.1 Error Tracking
- Sentry for unhandled exceptions and export failures
- Context: projectId, action type

### 15.2 Logging
- Structured logging (pino)
- Key events: export started/completed/failed, auth events

---

## 16. MVP Delivery Milestones

### Milestone 1 – Foundation
- Clerk auth integration
- Project CRUD
- Snapshot persistence (Prisma + Neon)

### Milestone 2 – Editor
- React Flow graph editor
- Quest inspector panel
- Autosave (optimistic + debounce)
- Undo/redo

### Milestone 3 – Versioning
- Version creation
- Version restore

### Milestone 4 – Export
- SNBT compiler
- Golden export validation
- ZIP download

### Milestone 5 – Sharing
- Read-only share links
- Share token management

---

## 17. Post-MVP Expansion Ideas

- Template gallery
- Import existing questbooks
- Advanced task/reward coverage
- KubeJS helpers
- Modpack metadata integration

---

## 18. Definition of Success

- Users can design full questbooks without launching Minecraft
- Exported files load cleanly in FTB Quests
- Projects remain stable across versions
- Large questbooks remain manageable and understandable

---

*End of Project Plan*
