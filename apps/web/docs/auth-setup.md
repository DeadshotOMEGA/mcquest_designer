# Authentication Setup Guide

## Overview

MCQuest Designer uses Clerk for authentication with Next.js App Router, implementing defense-in-depth security patterns.

## CVE-2025-29927 Mitigation

**Critical Security Pattern:**

While middleware provides route-level protection, it is **not sufficient** for security. We implement a two-layer defense:

1. **Middleware** (`src/middleware.ts`) - First line of defense, redirects unauthenticated users
2. **Server Components/Route Handlers** (`requireAuth()`, `requireUser()`) - Second line of defense, verifies auth

### Why Both Layers?

Middleware can be bypassed in certain edge cases. Always verify authentication in:

- Server Components using `requireAuth()` or `requireUser()`
- Route Handlers using `requireAuth()`
- Server Actions using `requireAuth()`

## Setup Instructions

### 1. Get Clerk API Keys

1. Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Create a new application or select existing one
3. Navigate to **API Keys** section
4. Copy the Publishable Key and Secret Key

### 2. Configure Environment Variables

Create `.env.local` in `apps/web/`:

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional (use defaults from .env.example)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 3. Configure OAuth Providers

In Clerk Dashboard:

1. Go to **User & Authentication** > **Social Connections**
2. Enable providers:
   - GitHub
   - Discord
   - Google
3. Configure OAuth redirect URLs:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### 4. Test Authentication Flow

```bash
pnpm --filter web dev
```

Navigate to:

- `/sign-up` - Create account with OAuth
- `/sign-in` - Sign in with OAuth
- `/dashboard` - Protected page (requires auth)

## Security Patterns

### Server Components

```typescript
import { requireUser } from '@/lib/auth'

export default async function ProtectedPage() {
  // ALWAYS verify auth, even if middleware protects the route
  const user = await requireUser()

  return <div>Welcome {user.firstName}</div>
}
```

### Route Handlers

```typescript
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  // ALWAYS verify auth in API routes
  const userId = await requireAuth()

  // Fetch user-specific data
  const data = await fetchData(userId)

  return NextResponse.json({ data })
}
```

### Server Actions

```typescript
'use server'

import { requireAuth } from '@/lib/auth'

export async function updateProject(projectId: string, data: unknown) {
  // ALWAYS verify auth in server actions
  const userId = await requireAuth()

  // Verify user has access to project
  await verifyProjectAccess(userId, projectId)

  // Proceed with update
}
```

## Route Protection

### Protected Routes

These routes require authentication (configured in `middleware.ts`):

- `/dashboard/*`
- `/projects/*`
- `/api/projects/*`

### Public Routes

These routes are accessible without authentication:

- `/` (home)
- `/sign-in`
- `/sign-up`
- `/docs/*` (future)

## Authorization (RBAC)

Projects use role-based access control:

- **OWNER** - Full control (read, write, delete, manage members)
- **EDITOR** - Read and write access
- **VIEWER** - Read-only access

### Checking Permissions

```typescript
import { requireAuth } from '@/lib/auth'
import { ProjectRole } from '@/types/auth'

export async function updateProject(projectId: string) {
  const userId = await requireAuth()

  // Fetch user's role for this project
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })

  if (!member || member.role === ProjectRole.VIEWER) {
    throw new Error('Insufficient permissions')
  }

  // Proceed with update
}
```

## Share Tokens

Share tokens provide read-only access without authentication.

### Requirements (per `80_security_and_abuse_prevention.md`):

- Minimum 128-bit entropy
- Read-only by default
- Revocable
- Optional expiration

### Implementation Example

```typescript
import { randomBytes } from 'crypto'

export async function createShareToken(projectId: string, userId: string) {
  // Generate secure token (128-bit = 16 bytes = 32 hex chars)
  const token = randomBytes(16).toString('hex')

  return await db.shareToken.create({
    data: {
      token,
      projectId,
      createdBy: userId,
      expiresAt: null, // Optional
      revoked: false,
    },
  })
}
```

## Rate Limiting

API routes should implement rate limiting to prevent abuse:

```typescript
// Example using upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
})

export async function GET() {
  const userId = await requireAuth()

  const { success } = await ratelimit.limit(userId)
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // Handle request
}
```

## Troubleshooting

### "Unauthorized" errors on protected routes

1. Verify environment variables are set correctly
2. Check Clerk Dashboard for API key validity
3. Ensure ClerkProvider wraps the app in `layout.tsx`
4. Clear cookies and sign in again

### OAuth callback errors

1. Verify redirect URLs in Clerk Dashboard match your domain
2. Check OAuth provider configuration
3. Ensure HTTPS in production (OAuth requires secure callbacks)

### Middleware not protecting routes

1. Check `middleware.ts` matcher configuration
2. Verify route patterns in `isProtectedRoute`
3. Test with incognito window to bypass cached auth state

## Best Practices

1. **Always verify auth** in Server Components and Route Handlers
2. **Never trust** middleware alone for security
3. **Use `requireAuth()`** for userId-only needs
4. **Use `requireUser()`** when full user profile is needed
5. **Implement RBAC** for all project-level operations
6. **Rate limit** export and expensive operations
7. **Validate all inputs** with Zod at API boundaries
8. **Log security events** (failed auth, permission denials)
9. **Never log** OAuth tokens or secrets

## References

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [CVE-2025-29927](https://clerk.com/changelog/2025-01-29) - Auth verification requirements
- Project rules: `rules/80_security_and_abuse_prevention.md`
