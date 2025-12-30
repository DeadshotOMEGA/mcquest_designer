# Implementation Plan - M1 Foundation Milestone

**Created:** 2025-12-30
**Branch:** feature/m1-foundation
**Estimated Duration:** 6-8 working days
**Target PRs:** 5-6

---

## Overview

```yaml
overview:
  milestone: M1 Foundation
  description: |
    Authentication, database persistence, and project CRUD operations to enable
    users to sign up, create questbook projects, and persist data to PostgreSQL.

  related_items:
    github_issues:
      - '#6 - Clerk Auth pages (DONE)'
      - '#7 - Prisma/Neon setup (PENDING)'
      - '#8 - Enhanced ProjectSnapshot schema (PENDING)'
      - '#9 - Project CRUD APIs (PENDING - mock exists)'
      - '#10 - Dashboard UI (PARTIAL)'
      - '#11 - CI Pipeline (PENDING)'

    feature_specs:
      - 'docs/reference/01_INTERNAL_PROJECT_SCHEMA.md'
      - 'docs/reference/02_PRISMA_SCHEMA.md'
      - 'docs/reference/03_API_ENDPOINTS.md'

    user_stories: []
    user_flows: []

  related_docs:
    - 'docs/temp/M1_FOUNDATION_AUDIT.md'
    - 'docs/temp/M1_IMPLEMENTATION_CHECKLIST.md'
    - 'docs/temp/AUDIT_SUMMARY.md'
    - 'rules/00_invariants.md'
    - 'rules/60_backend_rules.md'
    - 'rules/80_security_and_abuse_prevention.md'
```

---

## Current State Analysis

### Already Implemented (by nextjs-architect)

The following files were created and are functional:

| File                                               | Status  | Notes                                                 |
| -------------------------------------------------- | ------- | ----------------------------------------------------- |
| `apps/web/src/middleware.ts`                       | DONE    | Clerk route protection with CVE-2025-29927 mitigation |
| `apps/web/src/lib/auth.ts`                         | DONE    | requireAuth, requireUser, getAuthOrNull utilities     |
| `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx` | DONE    | Clerk SignIn component                                |
| `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx` | DONE    | Clerk SignUp component                                |
| `apps/web/src/app/dashboard/page.tsx`              | PARTIAL | Basic UI with auth, needs project list                |
| `apps/web/src/app/api/projects/route.ts`           | PARTIAL | Mock GET/POST, needs real Prisma                      |
| `apps/web/src/app/layout.tsx`                      | DONE    | ClerkProvider wrapped                                 |
| `apps/web/src/app/page.tsx`                        | DONE    | Auth-aware landing page                               |
| `apps/web/src/types/auth.ts`                       | DONE    | Auth type definitions                                 |
| `apps/web/.env.example`                            | PARTIAL | Has Clerk vars, needs DIRECT_URL                      |
| `@clerk/nextjs`                                    | DONE    | Package installed                                     |

### Still Missing

| Component                          | Status      | Blocker Level |
| ---------------------------------- | ----------- | ------------- |
| Prisma schema                      | NOT STARTED | CRITICAL      |
| Prisma client wrapper (db.ts)      | NOT STARTED | CRITICAL      |
| Database migrations                | NOT STARTED | CRITICAL      |
| Neon PostgreSQL connection         | NOT STARTED | CRITICAL      |
| Real Project CRUD (with Prisma)    | NOT STARTED | CRITICAL      |
| Project [id] route handlers        | NOT STARTED | CRITICAL      |
| Clerk webhook for user sync        | NOT STARTED | HIGH          |
| Enhanced ProjectSnapshot schema    | NOT STARTED | HIGH          |
| Authorization (checkProjectAccess) | NOT STARTED | HIGH          |
| Dashboard with real data           | NOT STARTED | MEDIUM        |
| CI/CD Pipeline                     | NOT STARTED | MEDIUM        |

---

## Solution

```yaml
solution: |
  Complete M1 Foundation by implementing the remaining infrastructure in 5 batches:

  1. **Batch 1 - Database Foundation**: Install Prisma, create schema with User/Project/
     ProjectMember/ProjectVersion/ShareToken models, configure Neon PostgreSQL, run
     initial migration, and create the Prisma client wrapper.

  2. **Batch 2 - Schema Enhancement**: Expand @mcquest/schema package with full
     ProjectSnapshot schema including Chapter, Quest, Dependency, Task, Reward,
     and UISnapshot types. Add request/response validation schemas.

  3. **Batch 3 - API Routes**: Replace mock implementations with real Prisma queries,
     add [id] route handlers for GET/PATCH/DELETE, implement authorization checks,
     add Clerk webhook for user sync.

  4. **Batch 4 - Frontend Integration**: Connect dashboard to real API, add project
     creation flow, implement project list with loading states.

  5. **Batch 5 - CI/CD**: Add GitHub Actions for lint/typecheck/test on PRs.
```

---

## Current System

```yaml
current_system:
  description: |
    Monorepo with apps/web (Next.js 15), packages/schema (Zod stubs), packages/export
    (empty stubs). Clerk auth is installed and configured but no database. API routes
    exist but return mock data. Dashboard shows static cards.

  existing_files:
    auth_layer:
      - path: 'apps/web/src/middleware.ts'
        role: 'Route protection via Clerk'
      - path: 'apps/web/src/lib/auth.ts'
        role: 'Auth utilities (requireAuth, requireUser)'

    api_routes:
      - path: 'apps/web/src/app/api/projects/route.ts'
        role: 'Mock GET/POST for projects (needs Prisma)'

    frontend:
      - path: 'apps/web/src/app/dashboard/page.tsx'
        role: 'Dashboard with static cards'
      - path: 'apps/web/src/app/page.tsx'
        role: 'Landing page with auth buttons'

    schemas:
      - path: 'packages/schema/src/index.ts'
        role: 'Placeholder Quest and ProjectSnapshot schemas'
```

---

## Changes Required

```yaml
changes_required:
  # Batch 1: Database Foundation
  - path: 'apps/web/prisma/schema.prisma'
    changes: |
      - CREATE file with PostgreSQL datasource
      - ADD User model (id, clerkId, email, name, timestamps)
      - ADD Project model (id, name, ownerId, latestSnapshot:Json, timestamps)
      - ADD ProjectMember model (composite key, role enum)
      - ADD ProjectVersion model (id, projectId, snapshot:Json, message, createdBy)
      - ADD ShareToken model (id, projectId, token, permission, expiresAt)
      - ADD ProjectRole enum (OWNER, EDITOR, VIEWER)
      - ADD indexes for foreign keys and common queries

  - path: 'apps/web/src/lib/db.ts'
    changes: |
      - CREATE Prisma client singleton with dev logging
      - ADD globalForPrisma pattern to prevent multiple instances
      - EXPORT prisma instance

  - path: 'apps/web/.env.example'
    changes: |
      - ADD DIRECT_URL for Prisma migrations
      - UPDATE DATABASE_URL comment with Neon format

  # Batch 2: Schema Enhancement
  - path: 'packages/schema/src/index.ts'
    changes: |
      - REPLACE placeholder schemas with full implementation
      - ADD TaskTypeSchema enum (text, item, damage, die, advance)
      - ADD TaskSchema (id, type, title, count, item?, advancementId?)
      - ADD RewardTypeSchema enum (item, command, advancement, trophy)
      - ADD RewardSchema (id, type, title, count, item?, command?)
      - ADD QuestShapeSchema enum (square, rounded, circle)
      - ADD IconReferenceSchema (type, value)
      - ADD QuestSettingsSchema (optional, hidden, repeatable)
      - ADD full QuestSchema with all fields
      - ADD ChapterSchema (id, title, description, order, background, defaultQuestShape)
      - ADD DependencySchema (fromQuestId, toQuestId, type: AND|OR)
      - ADD UISnapshotSchema (activeChapterId, viewportByChapter, selectedQuestId)
      - ADD ProjectMetadataSchema (projectName, targetMinecraftVersion, timestamps)
      - ADD full ProjectSnapshotSchema
      - ADD CreateProjectRequestSchema
      - ADD UpdateProjectRequestSchema
      - ADD UpdateSnapshotRequestSchema

  - path: 'packages/schema/src/defaults.ts'
    changes: |
      - CREATE file with factory functions
      - ADD createDefaultSnapshot(name: string): ProjectSnapshot
      - ADD createDefaultChapter(title: string): Chapter
      - ADD createDefaultQuest(chapterId: string, title: string): Quest

  # Batch 3: API Routes
  - path: 'apps/web/src/lib/auth.ts'
    changes: |
      - ADD getCurrentDbUser() to get/create User from Clerk
      - ADD checkProjectAccess(projectId, minRole) for RBAC
      - ADD syncClerkUser() for webhook handling

  - path: 'apps/web/src/app/api/projects/route.ts'
    changes: |
      - REPLACE mock GET with Prisma query (findMany with member filter)
      - REPLACE mock POST with Prisma create (includes default snapshot)
      - ADD Zod validation using CreateProjectRequestSchema
      - ADD proper error responses (400, 401, 500)

  - path: 'apps/web/src/app/api/projects/[id]/route.ts'
    changes: |
      - CREATE file with GET, PATCH, DELETE handlers
      - ADD GET: fetch project with checkProjectAccess(VIEWER)
      - ADD PATCH: update name/snapshot with checkProjectAccess(EDITOR)
      - ADD DELETE: delete project with checkProjectAccess(OWNER)
      - ADD Zod validation for PATCH body
      - ADD optimistic locking check for snapshot updates

  - path: 'apps/web/src/app/api/projects/[id]/snapshot/route.ts'
    changes: |
      - CREATE file for dedicated snapshot updates
      - ADD PATCH: validate and update latestSnapshot only
      - ADD version field check for optimistic locking

  - path: 'apps/web/src/app/api/webhooks/clerk/route.ts'
    changes: |
      - CREATE file for Clerk webhook handling
      - ADD POST: handle user.created and user.updated events
      - ADD Svix webhook signature verification
      - ADD syncClerkUser() call to upsert User record

  # Batch 4: Frontend Integration
  - path: 'apps/web/src/app/dashboard/page.tsx'
    changes: |
      - ADD fetch call to GET /api/projects
      - ADD project list rendering with cards
      - ADD empty state for no projects
      - ADD loading skeleton during fetch
      - ADD "New Project" button with modal/form

  - path: 'apps/web/src/app/dashboard/components/project-card.tsx'
    changes: |
      - CREATE reusable ProjectCard component
      - ADD project name, updated date, chapter/quest counts
      - ADD link to /projects/[id] (future M2)

  - path: 'apps/web/src/app/dashboard/components/create-project-dialog.tsx'
    changes: |
      - CREATE dialog for new project creation
      - ADD form with project name input
      - ADD submit handler calling POST /api/projects
      - ADD success redirect to project page

  # Batch 5: CI/CD Pipeline
  - path: '.github/workflows/ci.yml'
    changes: |
      - CREATE GitHub Actions workflow
      - ADD trigger on push/PR to main, develop, feature/*
      - ADD jobs: lint, typecheck, test
      - ADD pnpm caching
      - ADD turbo caching
      - ADD Neon branch preview (optional)
```

---

## Task Breakdown

```yaml
task_breakdown:
  # ============================================
  # BATCH 1: Database Foundation
  # ============================================

  - id: "T1"
    description: |
      Install Prisma dependencies and initialize the schema file. This creates the
      foundation for all database operations and must be completed first.
    agent: "programmer"
    depends_on: []
    files:
      - "apps/web/package.json" - modify - "add @prisma/client dependency"
      - "package.json" - modify - "add prisma as workspace dev dependency"
      - "apps/web/prisma/schema.prisma" - create - |
          datasource db { provider = "postgresql", url = env("DATABASE_URL"), directUrl = env("DIRECT_URL") }
          generator client { provider = "prisma-client-js" }

  - id: "T2"
    description: |
      Create complete Prisma schema with all M1 models. Includes User, Project,
      ProjectMember, ProjectVersion, ShareToken, and ProjectRole enum with proper
      relations and indexes for query performance.
    agent: "programmer"
    depends_on: ["T1"]
    files:
      - "apps/web/prisma/schema.prisma" - modify - |
          model User { id, clerkId @unique, email @unique, name?, projects[], ownedProjects[], timestamps }
          model Project { id, name, ownerId, latestSnapshot Json, owner User, members[], versions[], timestamps }
          model ProjectMember { projectId+userId @@id, role ProjectRole, project, user, createdAt }
          model ProjectVersion { id, projectId, snapshot Json, message?, createdBy, createdAt, project }
          model ShareToken { id, projectId, token @unique, permission, expiresAt?, project, createdAt }
          enum ProjectRole { OWNER, EDITOR, VIEWER }

  - id: "T3"
    description: |
      Create Prisma client wrapper with singleton pattern to prevent multiple
      instances in development. Uses globalThis caching pattern recommended by
      Prisma documentation.
    agent: "junior-engineer"
    depends_on: ["T1"]
    files:
      - "apps/web/src/lib/db.ts" - create - |
          const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
          export const prisma = globalForPrisma.prisma || new PrismaClient({ log: dev ? ['query'] : [] })
          if (NODE_ENV !== 'production') globalForPrisma.prisma = prisma

  - id: "T4"
    description: |
      Update environment example file with complete database configuration including
      DIRECT_URL for migrations and proper Neon connection string format.
    agent: "junior-engineer"
    depends_on: ["T1"]
    files:
      - "apps/web/.env.example" - modify - |
          # Database (Neon PostgreSQL)
          DATABASE_URL=postgresql://user:password@host.neon.tech/mcquest?sslmode=require
          DIRECT_URL=postgresql://user:password@host.neon.tech/mcquest?sslmode=require

  # ============================================
  # BATCH 2: Schema Enhancement
  # ============================================

  - id: "T5"
    description: |
      Expand @mcquest/schema with complete ProjectSnapshot schema including all
      nested types. This is the canonical data model that drives both API validation
      and export compilation.
    agent: "programmer"
    depends_on: []
    files:
      - "packages/schema/src/index.ts" - modify - |
          export const TaskTypeSchema = z.enum(['text', 'item', 'damage', 'die', 'advance'])
          export const TaskSchema = z.object({ id: uuid, type, title, count, item?, advancementId? })
          export const RewardTypeSchema = z.enum(['item', 'command', 'advancement', 'trophy'])
          export const RewardSchema = z.object({ id: uuid, type, title, count, item?, command? })
          export const QuestShapeSchema = z.enum(['square', 'rounded', 'circle'])
          export const IconReferenceSchema = z.object({ type: enum, value: string })
          export const QuestSettingsSchema = z.object({ optional, hidden, repeatable })
          export const QuestSchema = z.object({ id, chapterId, title, subtitle?, description?, position, size, shape, icon, tasks[], rewards[], settings })
          export const ChapterSchema = z.object({ id, title, description?, order, background?, defaultQuestShape? })
          export const DependencySchema = z.object({ fromQuestId, toQuestId, type: AND|OR })
          export const UISnapshotSchema = z.object({ activeChapterId?, viewportByChapter, selectedQuestId? })
          export const ProjectMetadataSchema = z.object({ projectName, targetMinecraftVersion, targetFTBQuestsVersion?, createdAt, updatedAt })
          export const ProjectSnapshotSchema = z.object({ version, metadata, chapters[], quests[], dependencies[], uiState })

  - id: "T6"
    description: |
      Add request/response validation schemas for API endpoints. These ensure
      type safety at API boundaries and generate proper error messages.
    agent: "junior-engineer"
    depends_on: ["T5"]
    files:
      - "packages/schema/src/api.ts" - create - |
          export const CreateProjectRequestSchema = z.object({ name: z.string().min(1).max(255) })
          export const UpdateProjectRequestSchema = z.object({ name: z.string().min(1).max(255).optional() })
          export const UpdateSnapshotRequestSchema = z.object({ snapshot: ProjectSnapshotSchema, expectedVersion?: z.string() })
          export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>
          export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>
          export type UpdateSnapshotRequest = z.infer<typeof UpdateSnapshotRequestSchema>

  - id: "T7"
    description: |
      Create factory functions for generating default snapshot structures. These
      ensure consistency when creating new projects, chapters, and quests.
    agent: "junior-engineer"
    depends_on: ["T5"]
    files:
      - "packages/schema/src/defaults.ts" - create - |
          export function createDefaultSnapshot(name: string): ProjectSnapshot { ... }
          export function createDefaultChapter(title: string): Chapter { ... }
          export function createDefaultQuest(chapterId: string, title: string, position: Position): Quest { ... }

  - id: "T8"
    description: |
      Update package exports to include all new schemas and types. Rebuild
      package to generate declaration files.
    agent: "junior-engineer"
    depends_on: ["T5", "T6", "T7"]
    files:
      - "packages/schema/src/index.ts" - modify - "add re-exports from api.ts and defaults.ts"
      - "packages/schema/package.json" - modify - "verify exports field includes all entry points"

  # ============================================
  # BATCH 3: API Routes (Real Implementation)
  # ============================================

  - id: "T9"
    description: |
      Enhance auth utilities with database user sync and project access checks.
      getCurrentDbUser() creates or retrieves the database User record from Clerk.
      checkProjectAccess() enforces RBAC by verifying membership and role level.
    agent: "programmer"
    depends_on: ["T2", "T3"]
    files:
      - "apps/web/src/lib/auth.ts" - modify - |
          export async function getCurrentDbUser(): Promise<User> {
            const clerkUser = await requireUser()
            return prisma.user.upsert({ where: { clerkId: clerkUser.id }, ... })
          }
          export async function checkProjectAccess(projectId: string, minRole: ProjectRole): Promise<ProjectMember> {
            const user = await getCurrentDbUser()
            const member = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: user.id } } })
            if (!member) throw new ApiError(403, 'Not a project member')
            if (roleHierarchy[member.role] < roleHierarchy[minRole]) throw new ApiError(403, 'Insufficient permissions')
            return member
          }

  - id: "T10"
    description: |
      Replace mock project list/create endpoints with real Prisma implementation.
      GET returns projects where user is a member, POST creates project with
      default snapshot and OWNER membership.
    agent: "programmer"
    depends_on: ["T5", "T9"]
    files:
      - "apps/web/src/app/api/projects/route.ts" - modify - |
          GET: const user = await getCurrentDbUser()
               const projects = await prisma.project.findMany({ where: { members: { some: { userId: user.id } } }, ... })
          POST: const { name } = CreateProjectRequestSchema.parse(body)
                const project = await prisma.project.create({ data: { name, ownerId: user.id, latestSnapshot: createDefaultSnapshot(name), members: { create: { userId: user.id, role: 'OWNER' } } } })

  - id: "T11"
    description: |
      Create project detail routes for GET/PATCH/DELETE operations. All routes
      verify project access before performing operations. PATCH supports both
      name updates and full snapshot replacement.
    agent: "programmer"
    depends_on: ["T9", "T10"]
    files:
      - "apps/web/src/app/api/projects/[id]/route.ts" - create - |
          GET: await checkProjectAccess(id, 'VIEWER')
               return prisma.project.findUnique({ where: { id }, include: { members: true, versions: { take: 5 } } })
          PATCH: await checkProjectAccess(id, 'EDITOR')
                 const { name, latestSnapshot } = UpdateProjectRequestSchema.parse(body)
                 return prisma.project.update({ where: { id }, data: { name, latestSnapshot, updatedAt: new Date() } })
          DELETE: await checkProjectAccess(id, 'OWNER')
                  return prisma.project.delete({ where: { id } })

  - id: "T12"
    description: |
      Create dedicated snapshot update route for efficient autosave. Includes
      optional optimistic locking via expectedVersion parameter to prevent
      overwriting concurrent edits.
    agent: "programmer"
    depends_on: ["T11"]
    files:
      - "apps/web/src/app/api/projects/[id]/snapshot/route.ts" - create - |
          PATCH: await checkProjectAccess(id, 'EDITOR')
                 const { snapshot, expectedVersion } = UpdateSnapshotRequestSchema.parse(body)
                 if (expectedVersion) {
                   const current = await prisma.project.findUnique({ where: { id }, select: { latestSnapshot: true } })
                   if (current.latestSnapshot.version !== expectedVersion) throw new ApiError(409, 'Version conflict')
                 }
                 return prisma.project.update({ where: { id }, data: { latestSnapshot: snapshot } })

  - id: "T13"
    description: |
      Create Clerk webhook handler to sync users to database on signup/update.
      Uses Svix library for webhook signature verification to ensure requests
      are authentic.
    agent: "programmer"
    depends_on: ["T9"]
    files:
      - "apps/web/src/app/api/webhooks/clerk/route.ts" - create - |
          POST: const payload = await verifyWebhook(req)
                if (payload.type === 'user.created' || payload.type === 'user.updated') {
                  await prisma.user.upsert({ where: { clerkId: payload.data.id }, update: { email, name }, create: { clerkId, email, name } })
                }
                return NextResponse.json({ received: true })
      - "apps/web/package.json" - modify - "add svix dependency for webhook verification"

  - id: "T14"
    description: |
      Create structured API error handling utilities. ApiError class enables
      consistent error responses with proper HTTP status codes and messages.
    agent: "junior-engineer"
    depends_on: []
    files:
      - "apps/web/src/lib/api-error.ts" - create - |
          export class ApiError extends Error {
            constructor(public statusCode: number, message: string, public code?: string) { super(message) }
          }
          export function handleApiError(error: unknown): NextResponse {
            if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode })
            if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
            console.error('Unhandled error:', error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
          }

  # ============================================
  # BATCH 4: Frontend Integration
  # ============================================

  - id: "T15"
    description: |
      Upgrade dashboard page to fetch and display real projects from API.
      Includes loading states, empty state, and project cards with metadata.
    agent: "programmer"
    depends_on: ["T10", "T11"]
    files:
      - "apps/web/src/app/dashboard/page.tsx" - modify - |
          async function getProjects() { const res = await fetch('/api/projects'); return res.json() }
          export default async function DashboardPage() {
            const user = await requireUser()
            const projects = await getProjects()
            return <DashboardLayout user={user} projects={projects} />
          }

  - id: "T16"
    description: |
      Create ProjectCard component for displaying project summary in dashboard.
      Shows project name, last updated time, and chapter/quest counts from
      snapshot metadata.
    agent: "junior-engineer"
    depends_on: ["T15"]
    files:
      - "apps/web/src/app/dashboard/components/project-card.tsx" - create - |
          interface ProjectCardProps { project: Project & { latestSnapshot: ProjectSnapshot } }
          export function ProjectCard({ project }: ProjectCardProps) {
            return <Card><CardHeader>{project.name}</CardHeader><CardContent>...</CardContent></Card>
          }

  - id: "T17"
    description: |
      Create project creation dialog with form validation. Uses shadcn/ui Dialog
      component with controlled form state. Submits to POST /api/projects and
      redirects to new project on success.
    agent: "programmer"
    depends_on: ["T10"]
    files:
      - "apps/web/src/app/dashboard/components/create-project-dialog.tsx" - create - |
          export function CreateProjectDialog() {
            const [name, setName] = useState('')
            const handleSubmit = async () => {
              const res = await fetch('/api/projects', { method: 'POST', body: JSON.stringify({ name }) })
              const project = await res.json()
              router.push(`/projects/${project.id}`)
            }
            return <Dialog><DialogTrigger>New Project</DialogTrigger><DialogContent>...</DialogContent></Dialog>
          }
      - "apps/web/src/components/ui/dialog.tsx" - create - "shadcn/ui dialog component"
      - "apps/web/src/components/ui/input.tsx" - create - "shadcn/ui input component"
      - "apps/web/src/components/ui/label.tsx" - create - "shadcn/ui label component"

  - id: "T18"
    description: |
      Add Card and Skeleton components from shadcn/ui for dashboard layout.
      Skeleton provides loading placeholders during data fetch.
    agent: "junior-engineer"
    depends_on: []
    files:
      - "apps/web/src/components/ui/card.tsx" - create - "shadcn/ui card component"
      - "apps/web/src/components/ui/skeleton.tsx" - create - "shadcn/ui skeleton component"

  # ============================================
  # BATCH 5: CI/CD Pipeline
  # ============================================

  - id: "T19"
    description: |
      Create GitHub Actions CI workflow for automated quality checks on PRs.
      Runs lint, typecheck, and tests in parallel. Uses pnpm and turbo caching
      for fast execution.
    agent: "programmer"
    depends_on: []
    files:
      - ".github/workflows/ci.yml" - create - |
          name: CI
          on: [push, pull_request]
          jobs:
            lint: pnpm lint
            typecheck: pnpm typecheck
            test: pnpm test
          env: TURBO_TOKEN, TURBO_TEAM

  - id: "T20"
    description: |
      Add basic test coverage for API routes and schema validation. Uses Vitest
      with mock Prisma client and Clerk auth context.
    agent: "programmer"
    depends_on: ["T10", "T11", "T5"]
    files:
      - "apps/web/src/app/api/projects/__tests__/route.test.ts" - create - |
          describe('POST /api/projects', () => {
            it('creates project with default snapshot', async () => { ... })
            it('returns 401 when unauthenticated', async () => { ... })
            it('returns 400 for invalid name', async () => { ... })
          })
      - "packages/schema/src/__tests__/snapshot.test.ts" - create - |
          describe('ProjectSnapshotSchema', () => {
            it('validates complete snapshot', () => { ... })
            it('rejects invalid quest references', () => { ... })
          })
      - "apps/web/vitest.config.ts" - create - "vitest configuration for web app"
```

---

## Data/Schema Changes

```yaml
data_schema_changes:
  migrations:
    - file: 'apps/web/prisma/migrations/YYYYMMDD_init/migration.sql'
      summary: |
        Initial migration creating User, Project, ProjectMember, ProjectVersion,
        ShareToken tables with PostgreSQL JSONB for snapshots.

  api_changes:
    - endpoint: 'GET /api/projects'
      changes: 'Returns real projects from database instead of mock data'

    - endpoint: 'POST /api/projects'
      changes: 'Creates project with Prisma, includes default snapshot and OWNER membership'

    - endpoint: 'GET /api/projects/:id'
      changes: 'New endpoint - returns project with members and recent versions'

    - endpoint: 'PATCH /api/projects/:id'
      changes: 'New endpoint - updates project name or snapshot'

    - endpoint: 'DELETE /api/projects/:id'
      changes: 'New endpoint - deletes project (OWNER only)'

    - endpoint: 'PATCH /api/projects/:id/snapshot'
      changes: 'New endpoint - dedicated snapshot update with optimistic locking'

    - endpoint: 'POST /api/webhooks/clerk'
      changes: 'New endpoint - Clerk webhook for user sync'
```

---

## Expected Result

```yaml
expected_result:
  outcome: |
    Users can sign up via Clerk OAuth, create questbook projects persisted to
    PostgreSQL, list their projects on the dashboard, and update project
    metadata. Role-based access control enforces OWNER/EDITOR/VIEWER permissions.

  example: |
    1. User visits /sign-up and authenticates with GitHub
    2. User is redirected to /dashboard showing empty project list
    3. User clicks "New Project" and enters "My First Questbook"
    4. POST /api/projects creates project with default snapshot
    5. User sees new project card on dashboard
    6. Clicking project card shows project details (M2 will add editor)
    7. All data persisted to Neon PostgreSQL
```

---

## Dependency Graph

```
Batch 1 (Database):      T1 ──► T2 ──┐
                          │          │
                          ├──► T3 ───┼──► T9 ──► T10 ──► T11 ──► T12
                          │          │                    │
                          └──► T4    │                    └──► T15 ──► T16
                                     │                         │
Batch 2 (Schema):        T5 ──► T6 ──┼──► T8                   └──► T17
                          │          │
                          └──► T7 ───┘

Batch 3 (API):           T14 (parallel)
                         T13 (depends on T9)

Batch 4 (Frontend):      T18 (parallel)

Batch 5 (CI):            T19 (parallel)
                         T20 (depends on T10, T11, T5)
```

### Parallelization Opportunities

| Parallel Group | Tasks                 | Notes                      |
| -------------- | --------------------- | -------------------------- |
| First wave     | T1, T5, T14, T18, T19 | Independent foundations    |
| After T1       | T2, T3, T4            | Database schema + client   |
| After T5       | T6, T7                | Schema extensions          |
| After T2+T3    | T9                    | Auth utilities need db     |
| After T9       | T10, T13              | API routes need auth       |
| After T10      | T11                   | Detail routes              |
| After T11      | T12, T15              | Snapshot route + dashboard |

---

## Notes

```yaml
notes:
  blockers:
    - 'Neon PostgreSQL account required - free tier sufficient for development'
    - 'Clerk webhook secret must be configured in Clerk dashboard'

  decisions:
    - 'Using JSONB for snapshots enables efficient partial queries if needed later'
    - 'ProjectVersion stores immutable snapshots for version history (M3 scope)'
    - 'ShareToken prepared but not exposed in API until M5'

  risks:
    - 'Clerk rate limits on webhook events (mitigated by idempotent upsert)'
    - 'Large snapshots may hit Vercel/Neon limits (defer optimization to M4)'

  references:
    - 'Prisma schema pattern: docs/reference/02_PRISMA_SCHEMA.md'
    - 'API endpoint design: docs/reference/03_API_ENDPOINTS.md'
    - 'ProjectSnapshot spec: docs/reference/01_INTERNAL_PROJECT_SCHEMA.md'
    - 'Security rules: rules/80_security_and_abuse_prevention.md'
```

---

## PR Strategy

| PR   | Tasks                       | Description               |
| ---- | --------------------------- | ------------------------- |
| PR 1 | T1, T2, T3, T4              | Prisma + Database Setup   |
| PR 2 | T5, T6, T7, T8              | Schema Enhancement        |
| PR 3 | T9, T10, T11, T12, T13, T14 | API Routes Implementation |
| PR 4 | T15, T16, T17, T18          | Dashboard Integration     |
| PR 5 | T19, T20                    | CI Pipeline + Tests       |

---

## Success Criteria

- [ ] `pnpm --filter web prisma migrate dev` runs without errors
- [ ] `pnpm build` succeeds across all packages
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] Users can sign up and see dashboard
- [ ] Users can create projects via API
- [ ] Projects are persisted to PostgreSQL
- [ ] Projects appear in dashboard list
- [ ] RBAC prevents unauthorized access
- [ ] CI workflow runs on PRs
