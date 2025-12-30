# ADR-001: Clerk Authentication with Defense-in-Depth

**Status:** Accepted
**Date:** 2025-12-30
**Context:** MCQuest Designer authentication architecture

## Context

MCQuest Designer requires secure user authentication with OAuth providers (GitHub, Discord, Google) for a Next.js 15 App Router application. The authentication system must:

- Support multiple OAuth providers without managing OAuth apps ourselves
- Integrate seamlessly with Next.js App Router Server Components
- Prevent authentication bypass vulnerabilities (CVE-2025-29927)
- Support role-based access control (RBAC) for projects
- Provide a foundation for share tokens and collaboration features

## Decision

We chose **Clerk** with a **defense-in-depth** authentication pattern:

### 1. Clerk as Authentication Provider

**Rationale:**

- Managed OAuth - no need to create/manage GitHub/Discord/Google OAuth apps
- First-class Next.js App Router support with React Server Components
- Built-in session management with secure HTTP-only cookies
- User management UI and APIs
- Generous free tier suitable for MVP

**Alternatives Considered:**

- **NextAuth.js (Auth.js)** - Requires managing OAuth apps, more configuration
- **Supabase Auth** - Couples authentication to database choice
- **Firebase Auth** - Google ecosystem lock-in, less Next.js-native

### 2. Defense-in-Depth Pattern (CVE-2025-29927 Mitigation)

**Pattern:**

```typescript
// Layer 1: Middleware (route protection)
export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

// Layer 2: Server Component verification
export default async function Page() {
  const userId = await requireAuth() // CRITICAL
  // ...
}

// Layer 3: Route Handler verification
export async function GET() {
  const userId = await requireAuth() // CRITICAL
  // ...
}
```

**Rationale:**

- **CVE-2025-29927** demonstrated middleware-only protection is insufficient
- Middleware provides UX (redirects) but not security guarantees
- Server-side verification in components/handlers is the actual security boundary
- Two-layer approach prevents bypass vulnerabilities

**Alternative Rejected:**

- Middleware-only protection - vulnerable to bypass exploits

### 3. Custom Auth Utilities

Created wrapper functions (`requireAuth`, `requireUser`, `getAuthOrNull`, `getUserOrNull`) instead of using Clerk functions directly.

**Rationale:**

- Consistent error handling across the application
- Clearer intent (`requireAuth` vs `auth().protect()`)
- Easier to add telemetry/logging later
- Abstraction allows replacing auth provider if needed

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Request                        │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            Clerk Middleware                     │
│  - First line of defense                        │
│  - Redirects to /sign-in                        │
│  - Sets auth context                            │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│     Server Component / Route Handler            │
│  - requireAuth() / requireUser()                │
│  - Second line of defense (SECURITY BOUNDARY)   │
│  - Throws if not authenticated                  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            Business Logic                       │
│  - Data fetching                                │
│  - Authorization checks (RBAC)                  │
│  - Database operations                          │
└─────────────────────────────────────────────────┘
```

## Implementation Details

### Files Created

- `src/middleware.ts` - Route protection with `clerkMiddleware`
- `src/lib/auth.ts` - Auth utility functions
- `src/types/auth.ts` - RBAC types (ProjectRole, ProjectMember, ShareToken)
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Sign-in page
- `src/app/sign-up/[[...sign-up]]/page.tsx` - Sign-up page
- `src/app/dashboard/page.tsx` - Protected page example
- `src/app/api/projects/route.ts` - Protected API route example
- `src/app/layout.tsx` - Updated with ClerkProvider
- `src/app/page.tsx` - Updated with auth-aware CTAs

### Protected Routes

```typescript
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
  '/api/projects(.*)',
])
```

### OAuth Providers

Configured in Clerk Dashboard:

- GitHub
- Discord
- Google

No OAuth app management required - Clerk provides managed OAuth.

## Security Considerations

### CVE-2025-29927 Compliance

- NEVER rely on middleware alone for authentication
- ALWAYS verify auth in Server Components with `requireAuth()`
- ALWAYS verify auth in Route Handlers with `requireAuth()`
- ALWAYS verify auth in Server Actions with `requireAuth()`

### RBAC Design

Per `rules/80_security_and_abuse_prevention.md`:

```typescript
enum ProjectRole {
  OWNER, // Full control
  EDITOR, // Read/write
  VIEWER, // Read-only
}
```

Authorization must be checked for every project-level operation.

### Share Tokens

Per `rules/80_security_and_abuse_prevention.md`:

- Minimum 128-bit entropy (16 bytes)
- Read-only by default
- Revocable
- Optional expiration
- No authentication required (public links)

### Rate Limiting

Export operations must be rate-limited:

- Per-user: 10 exports/minute
- Per-project: 30 exports/minute
- Implemented in API routes, not middleware

## Consequences

### Positive

- Managed OAuth - no OAuth app configuration needed
- First-class Next.js App Router support
- CVE-2025-29927 compliant from day one
- Clear security boundaries with defense-in-depth
- Free tier suitable for MVP and early growth
- User management handled by Clerk

### Negative

- Third-party dependency for critical authentication
- Vendor lock-in to Clerk (mitigated by auth utility abstraction)
- Requires environment variables for local development
- Limited customization of auth flows vs self-hosted solutions

### Neutral

- Learning curve for developers new to Clerk
- Additional service to monitor in production
- Need to configure webhooks for user sync (future)

## Testing Strategy

### Manual Testing

1. Sign up with GitHub/Discord/Google
2. Sign out and sign back in
3. Access protected routes while unauthenticated (should redirect)
4. Access protected routes while authenticated (should work)
5. API routes require authentication

### Automated Testing (Future)

- E2E tests with Playwright
- Mock Clerk in integration tests
- Test auth utility functions in isolation

## Migration Path

If we need to replace Clerk:

1. All auth calls go through `src/lib/auth.ts` utilities
2. Replace implementation while keeping function signatures
3. Update ClerkProvider in `layout.tsx`
4. Update middleware implementation
5. Update sign-in/sign-up page components

The abstraction layer makes this feasible, though non-trivial.

## Documentation

- [apps/web/GETTING_STARTED.md](../GETTING_STARTED.md) - Setup checklist
- [apps/web/docs/auth-setup.md](./auth-setup.md) - Comprehensive guide
- [apps/web/docs/auth-patterns.md](./auth-patterns.md) - Code patterns
- [.claude/rules/80_security_and_abuse_prevention.md](../../../.claude/rules/80_security_and_abuse_prevention.md) - Security rules

## References

- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [CVE-2025-29927](https://clerk.com/changelog/2025-01-29) - Auth verification requirements
- [Next.js App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## Revision History

- **2025-12-30** - Initial decision (Clerk with defense-in-depth)
