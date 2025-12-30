# Getting Started with MCQuest Designer

## Prerequisites

- Node.js 18+ or Bun
- pnpm 8+
- Clerk account ([sign up free](https://dashboard.clerk.com/sign-up))

## Setup Checklist

### 1. Install Dependencies

```bash
# From repository root
pnpm install
```

### 2. Create Clerk Application

1. Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Click "Add application"
3. Name it "MCQuest Designer" (or your preferred name)
4. Enable these authentication methods:
   - GitHub
   - Discord
   - Google
5. Click "Create application"

### 3. Configure Environment Variables

```bash
# Copy example file
cp apps/web/.env.example apps/web/.env.local

# Edit .env.local and add your Clerk keys
# Get them from: https://dashboard.clerk.com/
```

In `.env.local`, replace the placeholder values:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_HERE
```

### 4. Verify Setup

```bash
node apps/web/scripts/check-auth-setup.mjs
```

If all checks pass, you're ready!

### 5. Start Development Server

```bash
pnpm --filter web dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Test Authentication Flow

1. Click "Get Started" on home page
2. Sign up with GitHub/Discord/Google
3. You should be redirected to `/dashboard`
4. Try signing out and signing back in

## OAuth Provider Configuration

### GitHub

1. In Clerk Dashboard, go to **User & Authentication** > **Social Connections**
2. Click **GitHub**
3. Toggle "Enable for sign-up and sign-in"
4. Save changes

No additional configuration needed - Clerk handles the OAuth app creation.

### Discord

1. Go to **Social Connections** > **Discord**
2. Toggle "Enable for sign-up and sign-in"
3. Save changes

### Google

1. Go to **Social Connections** > **Google**
2. Toggle "Enable for sign-up and sign-in"
3. Save changes

## Production Deployment (Future)

When deploying to production:

1. Update environment variables in your hosting platform
2. Add production domain to Clerk Dashboard:
   - Go to **Settings** > **Domains**
   - Add your production URL
3. Update redirect URLs if needed
4. Use production API keys (starts with `pk_live_` and `sk_live_`)

## Troubleshooting

### "Clerk: Missing publishableKey" error

**Solution:** Make sure `.env.local` exists with correct keys.

```bash
# Check file exists
ls -la apps/web/.env.local

# Verify keys are set (should show your keys, not "...")
cat apps/web/.env.local | grep CLERK
```

### OAuth callback fails

**Solution:** Verify your OAuth providers are enabled in Clerk Dashboard.

1. Go to **Social Connections**
2. Ensure toggle is ON for GitHub/Discord/Google
3. Check redirect URLs match your domain

### "Unauthorized" on dashboard

**Solution:** Clear cookies and sign in again.

```bash
# In browser DevTools Console:
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload();
```

### TypeScript errors after setup

**Solution:** Restart TypeScript server.

In VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  Browser                        │
│  ┌──────────────────────────────────────────┐   │
│  │  React Components                        │   │
│  │  - Home page (/)                         │   │
│  │  - Sign In/Up (/sign-in, /sign-up)       │   │
│  │  - Dashboard (/dashboard)                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              Next.js Middleware                 │
│  - Route protection (first line of defense)     │
│  - Redirects unauthenticated users              │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         Server Components / Route Handlers      │
│  - requireAuth() - second line of defense       │
│  - Data fetching with user context              │
│  - Database operations                          │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│                Clerk API                        │
│  - User management                              │
│  - Session handling                             │
│  - OAuth integration                            │
└─────────────────────────────────────────────────┘
```

## Security Model

We implement **defense-in-depth** authentication (CVE-2025-29927 mitigation):

1. **Middleware** - Route-level protection
2. **Server Components** - Auth verification with `requireAuth()`
3. **Route Handlers** - Auth verification with `requireAuth()`

**Never rely on middleware alone.** Always verify authentication in your Server Components and API routes.

## Next Steps

- [ ] Read [docs/auth-patterns.md](docs/auth-patterns.md) for code examples
- [ ] Set up Prisma + PostgreSQL for data persistence
- [ ] Implement project CRUD operations
- [ ] Build the React Flow graph editor
- [ ] Add SNBT export functionality

## Resources

- [Clerk Next.js Docs](https://clerk.com/docs/quickstarts/nextjs)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Project Authentication Guide](docs/auth-setup.md)
- [Authentication Patterns](docs/auth-patterns.md)

## Need Help?

Check the documentation:

- `apps/web/README.md` - Package overview
- `apps/web/docs/auth-setup.md` - Comprehensive auth guide
- `apps/web/docs/auth-patterns.md` - Code pattern reference
- `.claude/CLAUDE.md` - Project-level guidance
- `.claude/rules/` - Project invariants and rules
