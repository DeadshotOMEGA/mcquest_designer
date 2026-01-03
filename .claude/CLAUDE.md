# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

FTB Quests Web Platform for Minecraft 1.21.x — a visual graph editor to design FTB Quests questbooks outside Minecraft, version them, and export to SNBT files for direct modpack import.

## Commands

```bash
# Development
pnpm install                           # Install all workspace dependencies
pnpm --filter web prisma migrate dev   # Run database migrations
pnpm --filter web dev                  # Start dev server

# Testing
pnpm test                              # Run all tests across workspaces
pnpm --filter schema test              # Test specific package
pnpm --filter export test -- <path>    # Run specific test file

# Build & Lint
pnpm build                             # Build all packages
pnpm --filter web build                # Build specific package
pnpm lint                              # Lint all packages
pnpm typecheck                         # TypeScript check all packages
```

## Architecture

### Monorepo Structure
```
/apps/web/           # Next.js App Router (frontend + API routes)
/packages/schema/    # Shared Zod schemas (ProjectSnapshot, validation)
/packages/export/    # SNBT compiler and exporter
/testdata/ftbq/1.21/ # Golden export test fixtures
```

### Data Flow
```
ProjectSnapshot (JSONB) → Compiler → ExportModel → SNBT files → ZIP
```

### Key Domains (keep separated)
1. **Snapshot** (`packages/schema`) — canonical internal JSON model
2. **Editor** (`apps/web`) — React Flow graph, forms, UI state
3. **Export** (`packages/export`) — version-aware SNBT generation
4. **Persistence** — Prisma/PostgreSQL, immutable version snapshots

### Frontend Stack
- Next.js App Router + React + TypeScript
- React Flow (graph editor)
- Zustand (editor state, undo/redo)
- TanStack Query (server state)
- shadcn/ui components

### Backend
- Next.js Route Handlers
- Clerk (managed auth with OAuth)
- Prisma + Neon PostgreSQL (JSONB snapshots)

### Testing
- Vitest (unit/integration)
- Playwright (E2E)
- Golden exports (compiler validation)

## Context7 MCP Usage

Use Context7 proactively when working with these project libraries:

**Core Stack:**
- **Next.js**: `/vercel/next.js` — App Router, Server Components, Route Handlers
- **React Flow**: `/xyflow/xyflow` — Graph editor, node/edge APIs, custom components
- **Prisma**: `/prisma/prisma` — Schema design, migrations, JSONB queries
- **Zod**: `/colinhacks/zod` — Schema validation, type inference, discriminated unions

**State & Data:**
- **TanStack Query**: `/tanstack/query` — Server state, caching, mutations
- **Zustand**: `/pmndrs/zustand` — Editor state, undo/redo patterns

**Example queries:**
```
How do I implement custom edge types in React Flow? use library /xyflow/xyflow
Best practices for Prisma JSONB queries with type safety? use library /prisma/prisma
Zod discriminated unions with type inference? use library /colinhacks/zod
Next.js 14 Route Handler streaming responses? use library /vercel/next.js
```

## Invariants (Must Not Break)

1. **Snapshot-first**: `ProjectSnapshot` is the only source of truth. SNBT is output only.
2. **Deterministic exports**: Same snapshot → identical output. Sorting by order/position/UUID.
3. **No texture pipeline**: Icons are item ID references only (e.g., `minecraft:book`).
4. **Shared schemas**: Zod schemas in `packages/schema` are the FE/BE contract.
5. **uiState isolation**: UI-only data must not influence export output.

## Working With This Repo

### Before Making Changes
Read these files first:
- `rules/00_invariants.md` — hard constraints
- `rules/10_snapshot_model.md` — data model rules
- `rules/20_export_compiler.md` — export determinism
- `rules/30_testing_golden_exports.md` — test strategy

### SNBT Mapping
- Never guess FTB Quests SNBT keys — reference golden exports in `testdata/`
- Add new SNBT fields behind version-targeted mapping functions
- If no golden export exists for a case, create one first

### ID Handling
- Internal IDs: UUID v4
- React Flow `node.id` === `Quest.id`
- Export ID mapping: derived from sorted order, not insertion order

### Response Format
When implementing changes:
1. Brief plan (bullets)
2. Files to change (paths)
3. Code changes
4. Tests to add
5. Risks and validation

## Non-Goals (v1)

- SNBT as internal model
- Mod texture loading/rendering
- Full FTB Quests feature parity
- Real-time collaborative editing
