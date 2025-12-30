# MCQuest Designer Web Application

Next.js 15 App Router application with Clerk authentication.

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Clerk API keys

# Run development server
pnpm --filter web dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
apps/web/
├── src/
│   ├── app/                      # App Router pages
│   │   ├── (auth)/              # Route group for auth pages
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── dashboard/           # Protected dashboard
│   │   │   └── page.tsx
│   │   ├── api/                 # API routes
│   │   │   └── projects/
│   │   │       └── route.ts
│   │   ├── layout.tsx           # Root layout with ClerkProvider
│   │   └── page.tsx             # Home page
│   ├── components/
│   │   └── ui/                  # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts              # Auth utilities (requireAuth, etc.)
│   │   └── utils.ts
│   ├── types/
│   │   └── auth.ts              # Auth-related TypeScript types
│   └── middleware.ts            # Route protection middleware
├── docs/
│   ├── auth-setup.md            # Comprehensive auth setup guide
│   └── auth-patterns.md         # Quick reference for auth patterns
├── .env.example                 # Environment variable template
├── package.json
└── README.md
```

## Authentication

### Setup Clerk

1. Create account at [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Create new application
3. Copy API keys to `.env.local`
4. Enable OAuth providers (GitHub, Discord, Google)

See [docs/auth-setup.md](docs/auth-setup.md) for detailed instructions.

### Security Model (CVE-2025-29927)

We implement **defense-in-depth** authentication:

1. **Middleware** - First line of defense (route protection)
2. **Server verification** - Second line of defense (auth() in components/routes)

**CRITICAL:** Always verify authentication in Server Components and Route Handlers using `requireAuth()` or `requireUser()`, even when middleware protects the route.

### Quick Reference

```typescript
// Server Component - require auth
import { requireAuth, requireUser } from '@/lib/auth'

export default async function Page() {
  const userId = await requireAuth()        // Get user ID, throw if not authenticated
  const user = await requireUser()          // Get full user profile, throw if not authenticated
  const userId = await getAuthOrNull()      // Get user ID or null
  const user = await getUserOrNull()        // Get user or null
}

// Route Handler - require auth
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const userId = await requireAuth()
  // Handle request
}
```

See [docs/auth-patterns.md](docs/auth-patterns.md) for comprehensive examples.

## Routes

### Public Routes
- `/` - Landing page
- `/sign-in` - Sign in with OAuth
- `/sign-up` - Sign up with OAuth

### Protected Routes (require authentication)
- `/dashboard` - User dashboard
- `/projects` - Project list (TODO)
- `/projects/:id` - Project editor (TODO)

### API Routes
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project

## Development

```bash
# Development server
pnpm --filter web dev

# Type checking
pnpm --filter web typecheck

# Linting
pnpm --filter web lint

# Build for production
pnpm --filter web build
```

## Technology Stack

- **Framework:** Next.js 15.1.3 (App Router)
- **Auth:** Clerk (with OAuth: GitHub, Discord, Google)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **Language:** TypeScript 5.7
- **Validation:** Zod (via @mcquest/schema)

## Related Packages

- `@mcquest/schema` - Shared Zod schemas and ProjectSnapshot types
- `@mcquest/export` - SNBT compiler and exporter

## Security

### Authentication
- OAuth-only (GitHub, Discord, Google)
- Session-based via Clerk
- Secure HTTP-only cookies

### Authorization (RBAC)
- **OWNER** - Full project control
- **EDITOR** - Read/write access
- **VIEWER** - Read-only access

### Input Validation
- All API inputs validated with Zod
- Structured error responses
- Rate limiting (TODO)

See [rules/80_security_and_abuse_prevention.md](../../.claude/rules/80_security_and_abuse_prevention.md)

## Next Steps

- [ ] Set up Prisma + PostgreSQL
- [ ] Implement project CRUD operations
- [ ] Add React Flow graph editor
- [ ] Implement SNBT export functionality
- [ ] Add rate limiting to API routes
- [ ] Set up E2E tests with Playwright

## Documentation

- [Authentication Setup Guide](docs/auth-setup.md)
- [Authentication Patterns](docs/auth-patterns.md)
- [Project CLAUDE.md](../../.claude/CLAUDE.md)
- [Project Rules](../../.claude/rules/)

## License

See root [LICENSE](../../LICENSE) file.
