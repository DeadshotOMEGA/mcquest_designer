# Authentication Flow Diagram

## Sign-Up Flow (OAuth)

```
┌──────────┐
│  User    │
│  visits  │
│    /     │
└────┬─────┘
     │
     ▼
┌─────────────────────────┐
│   Home Page             │
│   - Shows "Sign Up"     │
│   - getAuthOrNull()     │
└────┬────────────────────┘
     │ Click "Sign Up"
     ▼
┌─────────────────────────┐
│   /sign-up              │
│   - Clerk SignUp UI     │
│   - OAuth buttons       │
└────┬────────────────────┘
     │ Click "GitHub"
     ▼
┌─────────────────────────┐
│   GitHub OAuth          │
│   - User authorizes     │
│   - Redirects back      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Clerk creates user    │
│   - Sets session cookie │
│   - HTTP-only, Secure   │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Redirect to           │
│   /dashboard            │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Dashboard Page        │
│   - requireUser()       │
│   - Shows profile       │
└─────────────────────────┘
```

## Sign-In Flow (Returning User)

```
┌──────────┐
│  User    │
│  visits  │
│    /     │
└────┬─────┘
     │
     ▼
┌─────────────────────────┐
│   Home Page             │
│   - Shows "Sign In"     │
└────┬────────────────────┘
     │ Click "Sign In"
     ▼
┌─────────────────────────┐
│   /sign-in              │
│   - Clerk SignIn UI     │
│   - OAuth buttons       │
└────┬────────────────────┘
     │ Click "GitHub"
     ▼
┌─────────────────────────┐
│   GitHub OAuth          │
│   - Already authorized  │
│   - Quick redirect      │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Clerk verifies user   │
│   - Sets session cookie │
└────┬────────────────────┘
     │
     ▼
┌─────────────────────────┐
│   Redirect to           │
│   /dashboard            │
└─────────────────────────┘
```

## Protected Route Access

### Case 1: Authenticated User

```
┌────────────────────────┐
│  User navigates to     │
│  /dashboard            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Middleware            │
│  - Checks session      │
│  - Session valid ✅    │
│  - Sets auth context   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Server Component      │
│  - requireUser()       │
│  - Gets user from      │
│    auth context        │
│  - User exists ✅      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Fetch data            │
│  - Use userId          │
│  - Query database      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Render page           │
│  - Show user content   │
└────────────────────────┘
```

### Case 2: Unauthenticated User

```
┌────────────────────────┐
│  User navigates to     │
│  /dashboard            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Middleware            │
│  - Checks session      │
│  - No session ❌       │
│  - isProtectedRoute ✅ │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Redirect to /sign-in  │
│  - Set return URL      │
│  - User sees auth page │
└────────────────────────┘
```

### Case 3: Session Expired

```
┌────────────────────────┐
│  User navigates to     │
│  /dashboard            │
│  - Session expired     │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Middleware            │
│  - Validates session   │
│  - Expired ❌          │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Redirect to /sign-in  │
│  - Clear old session   │
│  - Prompt re-auth      │
└────────────────────────┘
```

## API Route Protection

### Authenticated Request

```
┌────────────────────────┐
│  POST /api/projects    │
│  - Session cookie      │
│  - Request body        │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Middleware            │
│  - Validates session   │
│  - Sets auth context   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Route Handler         │
│  - requireAuth()       │
│  - Gets userId ✅      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Validate input        │
│  - Zod schema parse    │
│  - Valid ✅            │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Database operation    │
│  - Create project      │
│  - Link to userId      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Response              │
│  - 201 Created         │
│  - JSON body           │
└────────────────────────┘
```

### Unauthenticated Request

```
┌────────────────────────┐
│  POST /api/projects    │
│  - No session cookie   │
│  - Request body        │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Middleware            │
│  - No session ❌       │
│  - isProtectedRoute ✅ │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Response              │
│  - 401 Unauthorized    │
│  - Redirect to /sign-in│
└────────────────────────┘
```

### Invalid Input Request

```
┌────────────────────────┐
│  POST /api/projects    │
│  - Valid session       │
│  - Invalid body        │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Middleware            │
│  - Session valid ✅    │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Route Handler         │
│  - requireAuth()       │
│  - Gets userId ✅      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Validate input        │
│  - Zod schema parse    │
│  - Validation fails ❌ │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Response              │
│  - 400 Bad Request     │
│  - Validation errors   │
└────────────────────────┘
```

## Defense-in-Depth Layers

```
┌───────────────────────────────────────────────────┐
│                   REQUEST                         │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  Layer 1: MIDDLEWARE (Route Protection)           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Purpose: UX and first line of defense           │
│  Action:                                          │
│    - Check session cookie                         │
│    - If protected route && no session:            │
│      → Redirect to /sign-in                       │
│    - If session exists:                           │
│      → Set auth context, allow through            │
│                                                   │
│  Provides: Redirect behavior, auth context       │
│  Does NOT provide: Security guarantee            │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  Layer 2: SERVER VERIFICATION (Security Boundary) │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Purpose: ACTUAL SECURITY ENFORCEMENT             │
│  Action:                                          │
│    - Call requireAuth() or requireUser()          │
│    - Verify user in current request context       │
│    - If not authenticated:                        │
│      → Throw error (caught by error boundary)     │
│    - If authenticated:                            │
│      → Return userId/user, continue               │
│                                                   │
│  Provides: SECURITY GUARANTEE                     │
│  Critical: NEVER skip this layer                  │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  Layer 3: AUTHORIZATION (Business Logic)          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Purpose: Check user has permission for action    │
│  Action:                                          │
│    - Fetch project membership                     │
│    - Check role (OWNER, EDITOR, VIEWER)           │
│    - If insufficient permission:                  │
│      → 403 Forbidden                              │
│    - If authorized:                               │
│      → Proceed with operation                     │
│                                                   │
│  Provides: Fine-grained access control            │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│  Layer 4: INPUT VALIDATION (Data Safety)          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Purpose: Validate user-provided data             │
│  Action:                                          │
│    - Parse request body with Zod schema           │
│    - If invalid:                                  │
│      → 400 Bad Request with errors                │
│    - If valid:                                    │
│      → Type-safe data, proceed                    │
│                                                   │
│  Provides: Type safety, injection prevention      │
└───────────────┬───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│             BUSINESS LOGIC                        │
│  - Database operations                            │
│  - External API calls                             │
│  - Computations                                   │
└───────────────────────────────────────────────────┘
```

## RBAC Flow (Future)

```
┌────────────────────────┐
│  PUT /api/projects/123 │
│  - Session valid       │
│  - Update data         │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  requireAuth()         │
│  - userId = "user-abc" │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Check Project Access  │
│  - Query:              │
│    ProjectMember where │
│    projectId=123 AND   │
│    userId="user-abc"   │
└────┬───────────────────┘
     │
     ├─── Not found ────────────────┐
     │                              │
     ├─── role = VIEWER ────────────┤
     │                              │
     └─── role = EDITOR/OWNER ──┐   │
                                │   │
                                ▼   ▼
                            ┌──────────────┐
                            │  403         │
                            │  Forbidden   │
                            └──────────────┘
                                │
                                ▼
                          ┌────────────────┐
                          │  Perform       │
                          │  Update        │
                          └────┬───────────┘
                               │
                               ▼
                          ┌────────────────┐
                          │  200 OK        │
                          │  Updated data  │
                          └────────────────┘
```

## Session Lifecycle

```
┌──────────────┐
│  Sign Up/In  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────┐
│  Clerk creates session   │
│  - Secure HTTP-only      │
│    cookie                │
│  - SameSite=Lax          │
│  - Expiration: 7 days    │
│    (configurable)        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Session active          │
│  - Auto-refresh before   │
│    expiration            │
│  - Silent refresh in     │
│    background            │
└──────┬───────────────────┘
       │
       ├─── User signs out ──────┐
       │                         │
       └─── Session expires ─────┤
                                 │
                                 ▼
                          ┌──────────────┐
                          │  Clerk       │
                          │  revokes     │
                          │  session     │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  Cookie      │
                          │  cleared     │
                          └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │  Redirect to │
                          │  /sign-in    │
                          └──────────────┘
```

## Error Handling Flow

```
┌────────────────────────┐
│  Protected Route/API   │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  try {                 │
│    requireAuth()       │
│  }                     │
└────┬───────────────────┘
     │
     ├─── Success ─────────────────┐
     │                             │
     └─── Error thrown ──┐         │
                         │         │
                         ▼         ▼
                  ┌──────────┐  ┌──────────┐
                  │  catch { │  │ Continue │
                  │  }       │  │          │
                  └────┬─────┘  └──────────┘
                       │
                       ▼
                  ┌──────────────────┐
                  │  Check error     │
                  │  message         │
                  └────┬─────────────┘
                       │
                       ├── "Unauthorized" ──┐
                       │                    │
                       └── Other error ─────┤
                                            │
                                            ▼
                                      ┌────────────┐
                                      │  Response  │
                                      │  401/500   │
                                      └────────────┘
```

## Key Takeaways

1. **Middleware = UX, not security** - Redirects users, doesn't enforce auth
2. **requireAuth() = Security** - Always verify in Server Components/Route Handlers
3. **Two layers minimum** - Defense-in-depth prevents bypass attacks
4. **RBAC on top** - After authentication, check authorization
5. **Validate input** - Never trust user data, parse with Zod

## CVE-2025-29927 Compliance

```
❌ VULNERABLE:
┌──────────────────────────┐
│  Middleware only         │
│  ↓                       │
│  Server Component        │
│  (no auth verification)  │
└──────────────────────────┘

✅ SECURE:
┌──────────────────────────┐
│  Middleware              │
│  ↓                       │
│  Server Component        │
│  - requireAuth() ✓       │
└──────────────────────────┘
```
