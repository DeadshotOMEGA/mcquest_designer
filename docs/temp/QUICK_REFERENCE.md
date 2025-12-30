# M1 Foundation - Quick Reference Card

**TL;DR:** MCQuest Designer has excellent infrastructure but is missing authentication, database, and API routes. Estimated 6-8 days to complete M1.

---

## What's Done ✅

| Component | Details |
|-----------|---------|
| **Monorepo** | Turbo + pnpm configured |
| **Frontend** | Next.js 15 (App Router) + React 19 |
| **Styling** | Tailwind CSS 4 + shadcn/ui Button |
| **Build** | TypeScript strict mode, ESLint, Prettier |
| **Docs** | 350+ pages (architecture, specs, rules) |
| **Packages** | schema + export workspaces ready |

---

## What's Missing ❌

| Component | Impact | Files Needed | Days |
|-----------|--------|--------------|------|
| **Database** | Blocks everything | schema.prisma, db.ts | 1-2 |
| **Auth** | Can't sign in | middleware.ts, sign-in/up pages | 1-2 |
| **API Routes** | Can't manage projects | /api/projects/* routes | 2-3 |
| **Auth Utils** | Can't enforce access | auth.ts utility functions | 1 |

**Total:** ~6-8 days (sequential path)

---

## Critical Blockers

```
1. Prisma (Must do FIRST)
   └─ Creates database foundation
   └─ Unblocks: Everything else

2. Clerk (Do SECOND)
   └─ Enables authentication
   └─ Unblocks: API route protection

3. API Routes (Do THIRD)
   └─ Project CRUD endpoints
   └─ Unblocks: M2 Frontend work

4. Auth Utils (Do FOURTH)
   └─ Role-based access control
   └─ Unblocks: Multi-user features
```

---

## Quick Install Commands

```bash
# Install Prisma
pnpm add -w @prisma/client
pnpm add -w -D prisma

# Install Clerk
pnpm add -w @clerk/nextjs

# Verify
pnpm typecheck
pnpm lint
```

---

## Environment Setup

**`.env.local` template:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://user:pass@host:5432/mcquest
DIRECT_URL=postgresql://user:pass@host:5432/mcquest
NODE_ENV=development
```

**Providers needed:**
- Neon PostgreSQL (free tier, cloud)
- Clerk (free tier, 10K MAU)

---

## File Creation Checklist

**Phase 1 (Database):**
- [ ] `apps/web/prisma/schema.prisma`
- [ ] `apps/web/src/lib/db.ts`
- [ ] `.env.local` with DATABASE_URL

**Phase 2 (Auth):**
- [ ] `apps/web/src/middleware.ts`
- [ ] `apps/web/src/app/sign-in/[[...sign-in]]/page.tsx`
- [ ] `apps/web/src/app/sign-up/[[...sign-up]]/page.tsx`
- [ ] Update `apps/web/src/app/layout.tsx` (add ClerkProvider)

**Phase 3 (API):**
- [ ] `apps/web/src/lib/auth.ts`
- [ ] `apps/web/src/app/api/projects/route.ts`
- [ ] `apps/web/src/app/api/projects/[id]/route.ts`

**Phase 4 (Schema):**
- [ ] Expand `packages/schema/src/index.ts`

---

## Database Schema (TL;DR)

```prisma
model User {
  id      String @id @default(cuid())
  clerkId String @unique
  email   String @unique
  projects ProjectMember[]
}

model Project {
  id             String @id @default(cuid())
  name           String
  ownerId        String
  latestSnapshot Json  // ProjectSnapshot JSONB
  members        ProjectMember[]
  versions       ProjectVersion[]
}

model ProjectMember {
  projectId String
  userId    String
  role      ProjectRole  // OWNER | EDITOR | VIEWER
  @@id([projectId, userId])
}

model ProjectVersion {
  id        String @id @default(cuid())
  projectId String
  snapshot  Json  // ProjectSnapshot JSONB
  message   String?
  createdAt DateTime @default(now())
}

enum ProjectRole {
  OWNER
  EDITOR
  VIEWER
}
```

---

## API Endpoints (To Implement)

```
POST   /api/projects              # Create project
GET    /api/projects              # List user's projects
GET    /api/projects/:id          # Get project + snapshot
PATCH  /api/projects/:id          # Update snapshot
DELETE /api/projects/:id          # Delete project (owner only)
```

**Auth:** All require Clerk authentication
**Authorization:** Project endpoints check ProjectMember role

---

## Key Auth Utilities (To Implement)

```typescript
// src/lib/auth.ts

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  return await prisma.user.findUnique({ where: { clerkId: userId } })
}

export async function checkProjectAccess(projectId: string, minRole: 'VIEWER' | 'EDITOR' | 'OWNER') {
  const user = await getCurrentUser()
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  })
  if (!membership) throw new Error('Not a member')
  // Check role hierarchy
}
```

---

## Testing Strategy

**Unit Tests:**
```bash
pnpm test
```
- Schema validation (Zod)
- Auth utilities
- API route handlers

**Manual Testing:**
```bash
# Sign up via Clerk
# Create project: POST /api/projects {"name": "Test"}
# List projects: GET /api/projects
# Update project: PATCH /api/projects/:id {"name": "Updated"}
# Delete project: DELETE /api/projects/:id
```

---

## Git Strategy

| PR | Focus | Effort |
|----|-------|--------|
| 1 | Prisma + migrations | 1-2d |
| 2 | Clerk auth | 1-2d |
| 3 | API routes (CRUD) | 2-3d |
| 4 | Schema expansion | 1d |
| 5 | Tests + docs | 1-2d |

**Merge strategy:** PR 1 unblocks PR 2-5 (can be parallel)

---

## Potential Gotchas

1. **Prisma migrations**
   - If using Neon, set `DIRECT_URL` for migrations
   - `prisma generate` may need explicit call

2. **Clerk middleware**
   - Must protect `/api/projects/*` routes
   - Don't forget sign-in/sign-up whitelist

3. **TypeScript paths**
   - Path aliases (@/*, @mcquest/*) already configured
   - Make sure tsconfig.json doesn't conflict

4. **Environment variables**
   - .env.local is git-ignored (good!)
   - .env.example must be checked in (remember this)
   - Clerk keys are public/secret (mark properly in comments)

---

## Validation Checklist

After completing M1, verify:

```bash
# 1. Build succeeds
pnpm build

# 2. Type check passes
pnpm typecheck

# 3. Linting passes
pnpm lint

# 4. Tests pass
pnpm test

# 5. Auth works
curl -X GET http://localhost:3000/sign-in  # Should redirect to Clerk

# 6. API routes work
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <clerk-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project"}'

# 7. Database persists
# Check Neon dashboard for new Project row

# 8. Access control works
# Try same POST with VIEWER role → 403 Forbidden
```

---

## Where to Go Next

| Need | File | Location |
|------|------|----------|
| Full audit | M1_FOUNDATION_AUDIT.md | docs/temp/ |
| Task breakdown | M1_IMPLEMENTATION_CHECKLIST.md | docs/temp/ |
| Architecture | docs/planning/project-plan.md | docs/ |
| Schema spec | docs/reference/01_INTERNAL_PROJECT_SCHEMA.md | docs/ |
| Database spec | docs/reference/02_PRISMA_SCHEMA.md | docs/ |
| Code rules | .claude/rules/ | Root |

---

## Estimated Timeline

```
Day 1:   Setup Neon + Prisma
Day 2:   Migrations + db.ts
Day 3:   Clerk installation + middleware
Day 4:   Sign-in/sign-up pages
Day 5:   API routes (CRUD)
Day 6:   Auth utilities + tests
Day 7:   Schema expansion + docs
Day 8:   Buffer/polish/final testing

Total: 6-8 days
```

---

## Success Metrics

M1 is complete when:

- [ ] User can sign up via GitHub/Discord/Google
- [ ] User can create a project
- [ ] Project snapshot is stored in PostgreSQL
- [ ] User can list their projects
- [ ] User can update project snapshot
- [ ] User can delete their own projects
- [ ] OWNER can add/remove members
- [ ] VIEWER cannot edit or delete
- [ ] All endpoints return correct HTTP codes
- [ ] TypeScript strict mode passes
- [ ] Docs are current

---

## Support Resources

**Inside this project:**
- 8 rule files in `.claude/rules/` - Code standards
- Project plan in `docs/planning/` - Architecture
- API specs in `docs/reference/` - Endpoint details
- Examples in `docs/platform_examples/` - Reference implementations

**External:**
- Prisma docs: https://www.prisma.io/docs/
- Clerk docs: https://clerk.com/docs
- Next.js docs: https://nextjs.org/docs
- TypeScript docs: https://www.typescriptlang.org/docs/

---

## TL;DR Summary

| Question | Answer |
|----------|--------|
| **What's working?** | Build system, frontend, docs |
| **What's missing?** | Auth, database, API |
| **How long to M1?** | 6-8 days |
| **Start with?** | Prisma schema |
| **Hardest part?** | Setting up Neon connection string |
| **Easiest part?** | Creating sign-in/sign-up pages (Clerk handles it) |
| **Need help?** | See M1_IMPLEMENTATION_CHECKLIST.md for code examples |

---

**Created:** December 30, 2025
**For:** MCQuest Designer M1 Foundation completion
