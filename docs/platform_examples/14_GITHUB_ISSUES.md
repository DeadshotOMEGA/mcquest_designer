# GitHub Issues Pack (Copy/Paste Ready)

This file contains a suggested set of issues for GitHub Projects/Milestones.

## Labels
Create these labels first:
- `type:backend`
- `type:frontend`
- `type:infra`
- `type:docs`
- `type:export`
- `priority:p0`
- `priority:p1`
- `priority:p2`
- `status:blocked`

---

## Milestone: M1 – Foundation (Auth + Project CRUD)

### Issue: Set up Next.js app + repo scaffolding
- [ ] Initialize Next.js (App Router) + TypeScript
- [ ] Configure linting/formatting (ESLint + Prettier)
- [ ] Add env var management
- [ ] Add CI workflow (lint + typecheck)

Labels: `type:infra`, `priority:p0`

---

### Issue: Add Auth.js (NextAuth) with OAuth providers
- [ ] Configure providers (GitHub/Discord/Google)
- [ ] Add session handling (server + client)
- [ ] Add protected routes

Labels: `type:backend`, `priority:p0`

---

### Issue: Add Postgres + Prisma + initial migrations
- [ ] Add Prisma schema (Project, Member, Version, ShareToken)
- [ ] Run migrations and seed script
- [ ] Add DB connection pooling strategy (platform dependent)

Labels: `type:backend`, `type:infra`, `priority:p0`

---

### Issue: Implement Project CRUD API
- [ ] POST /projects
- [ ] GET /projects/:id
- [ ] PATCH /projects/:id
- [ ] Enforce membership authorization

Labels: `type:backend`, `priority:p0`

---

## Milestone: M2 – Editor MVP (Graph + Inspector + Autosave)

### Issue: Implement React Flow canvas for chapter graph
- [ ] Render nodes from snapshot
- [ ] Render edges from dependencies
- [ ] Enable pan/zoom + snap-to-grid
- [ ] Node drag updates snapshot positions

Labels: `type:frontend`, `priority:p0`

---

### Issue: Implement Inspector panel for quest editing
- [ ] Edit title/subtitle/description
- [ ] Edit icon reference (string)
- [ ] Edit flags (optional/hidden/repeatable)

Labels: `type:frontend`, `priority:p0`

---

### Issue: Autosave pipeline
- [ ] Debounced autosave to backend
- [ ] Conflict handling strategy (last-write-wins initially)
- [ ] UX: saving indicator + error state

Labels: `type:frontend`, `type:backend`, `priority:p0`

---

## Milestone: M3 – Versioning

### Issue: Create Version endpoint + UI
- [ ] POST /projects/:id/versions
- [ ] Version list UI
- [ ] Restore version UI

Labels: `type:backend`, `type:frontend`, `priority:p1`

---

## Milestone: M4 – Export (SNBT + Zip)

### Issue: Implement validation engine (blocking + warning)
- [ ] Build rule set
- [ ] Return structured errors
- [ ] UI validation panel

Labels: `type:backend`, `type:frontend`, `priority:p0`

---

### Issue: Implement ExportModel transform
- [ ] Map snapshot → export model
- [ ] Build deterministic ID map

Labels: `type:export`, `type:backend`, `priority:p0`

---

### Issue: Implement SNBT writer + ZIP packaging
- [ ] Write SNBT files to in-memory FS
- [ ] Produce correct folder structure
- [ ] Return zip download

Labels: `type:export`, `type:backend`, `priority:p0`

---

## Milestone: M5 – Sharing (Read-only Links)

### Issue: ShareToken model + API
- [ ] Create share token
- [ ] Revoke share token
- [ ] Access via token route

Labels: `type:backend`, `priority:p1`

---

### Issue: Read-only viewer mode
- [ ] Disable edits when accessed via share token
- [ ] Show banner "Read-only"

Labels: `type:frontend`, `priority:p1`

---

## Stretch: Import v2

### Issue: Add upload + SNBT parse + snapshot import
- [ ] Accept zip upload
- [ ] Parse SNBT
- [ ] Map to snapshot

Labels: `type:export`, `priority:p2`

