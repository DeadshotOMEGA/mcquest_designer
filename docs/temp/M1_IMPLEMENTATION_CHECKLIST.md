# M1 Foundation - Implementation Checklist

**Purpose:** Detailed task list for completing M1 Foundation
**Target Completion:** 6-8 working days
**Estimated PR Count:** 5-6 PRs

---

## Phase 1: Database Foundation (Est. 1-2 days)

### Task: Install and Configure Prisma

- [ ] Install packages:

  ```bash
  pnpm add -w @prisma/client
  pnpm add -w -D prisma
  ```

- [ ] Initialize Prisma:

  ```bash
  cd apps/web
  npx prisma init
  ```

- [ ] Create `.env.local`:

  ```env
  DATABASE_URL="postgresql://user:password@host:5432/mcquest_dev"
  DIRECT_URL="postgresql://user:password@host:5432/mcquest_dev"  # For migrations
  NODE_ENV="development"
  ```

- [ ] Choose database provider:
  - [ ] **Option A (Recommended):** Neon PostgreSQL (free tier, cloud)
    - Create account at https://neon.tech
    - Create project and get connection string
  - [ ] **Option B:** Docker PostgreSQL (local development)
    ```yaml
    # docker-compose.yml
    services:
      postgres:
        image: postgres:16
        environment:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mcquest_dev
        ports:
          - '5432:5432'
    ```

### Task: Create Prisma Schema

**File:** `/apps/web/prisma/schema.prisma`

Schema outline (from `docs/reference/02_PRISMA_SCHEMA.md`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Core models
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique  // From Clerk
  email     String   @unique
  name      String?
  projects  ProjectMember[]
  ownedProjects Project[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Project {
  id             String   @id @default(cuid())
  name           String
  ownerId        String
  latestSnapshot Json     // JSONB ProjectSnapshot
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  owner          User     @relation(fields: [ownerId], references: [id])
  members        ProjectMember[]
  versions       ProjectVersion[]
}

model ProjectMember {
  projectId String
  userId    String
  role      ProjectRole
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
  @@index([projectId])
  @@index([userId])
}

model ProjectVersion {
  id        String   @id @default(cuid())
  projectId String
  snapshot  Json     // JSONB ProjectSnapshot
  message   String?
  createdBy String
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([createdAt])
}

model ShareToken {
  id        String   @id @default(cuid())
  projectId String
  token     String   @unique  // Long random string (min 128 bits)
  permission String  @default("read")  // "read" | "read-only"
  expiresAt DateTime?
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([token])
}

enum ProjectRole {
  OWNER
  EDITOR
  VIEWER
}
```

- [ ] Create migration:

  ```bash
  cd apps/web
  npx prisma migrate dev --name init
  ```

- [ ] Verify Prisma client generation:

  ```bash
  npx prisma generate
  ```

- [ ] Create Prisma client wrapper:

**File:** `/apps/web/src/lib/db.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Phase 2: Authentication (Est. 1-2 days)

### Task: Install and Configure Clerk

- [ ] Install Clerk:

  ```bash
  pnpm add -w @clerk/nextjs
  ```

- [ ] Create Clerk account at https://dashboard.clerk.com

- [ ] Set up OAuth providers (at least GitHub):
  - GitHub OAuth application
  - Discord (optional)
  - Google (optional)

- [ ] Copy environment keys:

**File:** `.env.example` (add Clerk section):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/dashboard
CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...  # For migrations

# Environment
NODE_ENV=development
```

- [ ] Add to `.env.local` (git-ignored)

### Task: Create Clerk Middleware

**File:** `/apps/web/src/middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

- [ ] Create sign-in page:

**File:** `/apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <SignIn />
}
```

- [ ] Create sign-up page:

**File:** `/apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`

```typescript
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return <SignUp />
}
```

- [ ] Wrap app with ClerkProvider:

Update **`/apps/web/src/app/layout.tsx`**:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

- [ ] Test locally:
  ```bash
  pnpm --filter web dev
  # Navigate to http://localhost:3000/sign-in
  ```

---

## Phase 3: API Routes & Authorization (Est. 2-3 days)

### Task: Create Auth Utilities

**File:** `/apps/web/src/lib/auth.ts`

```typescript
import { auth } from '@clerk/nextjs/server'
import { prisma } from './db'

/**
 * Get current authenticated user
 * Throws if not authenticated
 */
export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  return await prisma.user.findUnique({
    where: { clerkId: userId },
  })
}

/**
 * Check if user is project member with minimum role
 */
export async function checkProjectAccess(
  projectId: string,
  minRole: 'VIEWER' | 'EDITOR' | 'OWNER'
) {
  const user = await getCurrentUser()
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })

  if (!membership) throw new Error('Not a project member')

  const roleHierarchy = { VIEWER: 1, EDITOR: 2, OWNER: 3 }
  if (roleHierarchy[membership.role] < roleHierarchy[minRole]) {
    throw new Error('Insufficient permissions')
  }

  return membership
}

/**
 * Handle Clerk webhook to sync user
 */
export async function syncClerkUser(clerkId: string, email: string, name?: string) {
  return await prisma.user.upsert({
    where: { clerkId },
    update: { email, name },
    create: { clerkId, email, name },
  })
}
```

### Task: Implement Project CRUD Routes

**File:** `/apps/web/src/app/api/projects/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
})

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const body = await req.json()

    const { name } = CreateProjectSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        name,
        ownerId: user.id,
        latestSnapshot: {
          version: '0.1.0',
          metadata: {
            projectName: name,
            targetMinecraftVersion: '1.21.1',
          },
          chapters: [],
          quests: [],
          dependencies: [],
          uiState: {},
        },
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: { members: true },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.errors, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * GET /api/projects
 * List user's projects
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      include: { members: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

**File:** `/apps/web/src/app/api/projects/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkProjectAccess } from '@/lib/auth'
import { z } from 'zod'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  latestSnapshot: z.record(z.unknown()).optional(),
})

/**
 * GET /api/projects/:id
 * Get project and latest snapshot
 */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await checkProjectAccess(params.id, 'VIEWER')

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { members: true, versions: { take: 5 } },
    })

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}

/**
 * PATCH /api/projects/:id
 * Update project or snapshot
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await checkProjectAccess(params.id, 'EDITOR')

    const body = await req.json()
    const { name, latestSnapshot } = UpdateProjectSchema.parse(body)

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(latestSnapshot && { latestSnapshot }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.errors, { status: 400 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}

/**
 * DELETE /api/projects/:id
 * Delete project (owner only)
 */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await checkProjectAccess(params.id, 'OWNER')

    await prisma.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}
```

- [ ] Test API routes locally with curl or Postman

---

## Phase 4: Schema Expansion (Est. 1 day)

### Task: Expand ProjectSnapshot Schema

**File:** `/packages/schema/src/index.ts`

Update with full schema (currently only Quest stub exists):

```typescript
import { z } from 'zod'

export const SCHEMA_VERSION = '0.1.0'

// Task types (simplified for M1, expand in M2+)
export const TaskTypeSchema = z.enum(['text', 'item', 'damage', 'die', 'advance'])
export type TaskType = z.infer<typeof TaskTypeSchema>

export const TaskSchema = z.object({
  id: z.string().uuid(),
  type: TaskTypeSchema,
  title: z.string(),
  count: z.number().int().positive().default(1),
})
export type Task = z.infer<typeof TaskSchema>

// Reward types (simplified for M1)
export const RewardTypeSchema = z.enum(['item', 'command', 'advancement', 'trophy'])
export type RewardType = z.infer<typeof RewardTypeSchema>

export const RewardSchema = z.object({
  id: z.string().uuid(),
  type: RewardTypeSchema,
  title: z.string(),
  count: z.number().int().positive().default(1),
})
export type Reward = z.infer<typeof RewardSchema>

// Quest shape
export const QuestShapeSchema = z.enum(['square', 'rounded', 'circle'])
export type QuestShape = z.infer<typeof QuestShapeSchema>

// Icon reference
export const IconReferenceSchema = z.object({
  type: z.enum(['item_id', 'placeholder']),
  value: z.string(),
})
export type IconReference = z.infer<typeof IconReferenceSchema>

// Quest settings
export const QuestSettingsSchema = z.object({
  optional: z.boolean().default(false),
  hidden: z.boolean().default(false),
  repeatable: z.boolean().default(false),
})
export type QuestSettings = z.infer<typeof QuestSettingsSchema>

// Full Quest schema
export const QuestSchema = z.object({
  id: z.string().uuid(),
  chapterId: z.string().uuid(),
  title: z.string().min(1).max(255),
  subtitle: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  shape: QuestShapeSchema.default('square'),
  icon: IconReferenceSchema,
  tasks: z.array(TaskSchema).default([]),
  rewards: z.array(RewardSchema).default([]),
  settings: QuestSettingsSchema,
})
export type Quest = z.infer<typeof QuestSchema>

// Chapter schema
export const ChapterSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  order: z.number().int().nonnegative(),
  background: z.string().optional(),
  defaultQuestShape: QuestShapeSchema.optional(),
})
export type Chapter = z.infer<typeof ChapterSchema>

// Dependency schema
export const DependencySchema = z.object({
  fromQuestId: z.string().uuid(),
  toQuestId: z.string().uuid(),
  type: z.enum(['AND', 'OR']),
})
export type Dependency = z.infer<typeof DependencySchema>

// UI State (non-exported)
export const UISnapshotSchema = z.object({
  activeChapterId: z.string().uuid().optional(),
  viewportByChapter: z
    .record(
      z.string().uuid(),
      z.object({
        x: z.number(),
        y: z.number(),
        zoom: z.number(),
      })
    )
    .default({}),
  selectedQuestId: z.string().uuid().optional(),
})
export type UISnapshot = z.infer<typeof UISnapshotSchema>

// Metadata schema
export const ProjectMetadataSchema = z.object({
  projectName: z.string().min(1),
  targetMinecraftVersion: z.string(),
  targetFTBQuestsVersion: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>

// Full ProjectSnapshot schema
export const ProjectSnapshotSchema = z.object({
  version: z.string(),
  metadata: ProjectMetadataSchema,
  chapters: z.array(ChapterSchema),
  quests: z.array(QuestSchema),
  dependencies: z.array(DependencySchema),
  uiState: UISnapshotSchema,
})
export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>

// Request/Response schemas
export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255),
})
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>

export const UpdateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  latestSnapshot: ProjectSnapshotSchema.optional(),
})
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>
```

- [ ] Build schema package:

  ```bash
  pnpm --filter schema build
  ```

- [ ] Test schema validation:

  ```typescript
  import { ProjectSnapshotSchema } from '@mcquest/schema'

  const snapshot = {
    /* ... */
  }
  const validated = ProjectSnapshotSchema.parse(snapshot)
  ```

---

## Phase 5: Testing (Est. 1-2 days)

### Task: Add API Route Tests

**File:** `/apps/web/src/app/api/projects/__tests__/projects.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db'

describe('POST /api/projects', () => {
  let userId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        clerkId: 'test-clerk-id',
        email: 'test@example.com',
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
  })

  it('should create a project', async () => {
    // Mock auth context
    // Post request
    // Verify project created in database
  })

  it('should require authentication', async () => {
    // Post without auth
    // Expect 401 Unauthorized
  })
})
```

- [ ] Add snapshot validation tests
- [ ] Add authorization tests
- [ ] Run tests:
  ```bash
  pnpm test
  ```

---

## Phase 6: Documentation (Est. 0.5 day)

### Task: Update Developer Onboarding

**File:** `/docs/how-to/09_DEVELOPER_ONBOARDING.md` (sections to add/update)

- [ ] Database setup instructions
  - Neon vs Docker options
  - Setting DATABASE_URL
  - Running migrations

- [ ] Authentication setup
  - Clerk account creation
  - Environment keys configuration
  - Testing auth locally

- [ ] API testing
  - cURL examples for Project CRUD
  - Postman collection (optional)

- [ ] Troubleshooting section

### Task: Update .env.example

- [ ] Final `.env.example` with all M1 variables

---

## Quality Checklist

- [ ] All TypeScript compiles without errors

  ```bash
  pnpm typecheck
  ```

- [ ] All files pass linting

  ```bash
  pnpm lint
  ```

- [ ] Prettier formatting applied

  ```bash
  pnpm format
  ```

- [ ] All tests pass

  ```bash
  pnpm test
  ```

- [ ] API routes manually tested (create, list, get, update, delete)

- [ ] Authentication flow tested (sign-up, sign-in, sign-out)

- [ ] Environment setup documented

---

## Git & PR Strategy

### PR 1: Prisma + Database

- Schema definition
- Migrations
- db.ts wrapper
- .env.example

### PR 2: Clerk Authentication

- Middleware
- Sign-in/sign-up pages
- ClerkProvider wrapper
- Clerk env vars

### PR 3: API Routes (Part 1)

- Project list and create endpoints
- Auth utilities
- Basic tests

### PR 4: API Routes (Part 2)

- Get, update, delete endpoints
- Authorization checks
- Full test coverage

### PR 5: Schema Expansion

- Complete ProjectSnapshot schema
- Task/Reward types
- Request validation schemas

### PR 6: Documentation

- Developer onboarding updates
- API endpoint reference
- Troubleshooting guide

---

## Success Criteria for M1

- [x] Users can sign up via Clerk
- [x] Users can create projects
- [x] Projects are persisted to Neon PostgreSQL
- [x] Users can list their projects
- [x] Users can view/update project details
- [x] Snapshots are stored and can be updated
- [x] Role-based access is enforced (OWNER/EDITOR/VIEWER)
- [x] All API routes return correct HTTP status codes
- [x] TypeScript strict mode passes
- [x] Documentation is current

---

## Estimated Timeline

| Phase               | Duration      | Cum.   |
| ------------------- | ------------- | ------ |
| 1. Prisma + DB      | 1-2 days      | 1-2    |
| 2. Clerk Auth       | 1-2 days      | 2-4    |
| 3. API Routes       | 2-3 days      | 4-7    |
| 4. Schema Expansion | 1 day         | 5-8    |
| 5. Testing          | 1-2 days      | 6-10   |
| 6. Documentation    | 0.5 day       | 6-10.5 |
| **Buffer (15%)**    | 1-2 days      | 7-12   |
| **Total**           | **~6-8 days** |        |

**Parallel opportunities:**

- Schema expansion can start during Phase 2 (after Clerk installed)
- Testing can start after each phase completes
- Documentation can be updated incrementally

---

## Unblocking Strategy

If you get stuck:

1. **Prisma issues?**
   - Check connection string format
   - Verify DATABASE_URL set in .env.local
   - Run `prisma db push --skip-generate` to debug

2. **Clerk issues?**
   - Verify publishable key is correct
   - Check Clerk dashboard for OAuth provider setup
   - Test in Clerk debugger first

3. **API route issues?**
   - Test with curl before implementing frontend
   - Check that auth middleware is protecting routes
   - Verify Prisma client is initialized

4. **Need help?**
   - Refer to `docs/platform_examples/` for reference implementations
   - Check rules in `.claude/rules/` for code style
   - Review test patterns in `packages/export/` for Vitest examples
