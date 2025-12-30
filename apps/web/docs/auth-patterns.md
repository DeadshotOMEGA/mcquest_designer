# Authentication Patterns Quick Reference

## Import Statements

```typescript
// Auth utilities
import { requireAuth, requireUser, getAuthOrNull, getUserOrNull } from '@/lib/auth'

// Clerk components
import { UserButton, SignIn, SignUp } from '@clerk/nextjs'

// Clerk server functions (use sparingly, prefer our utilities)
import { auth, currentUser } from '@clerk/nextjs/server'
```

## Server Component Patterns

### Require Authentication (throw if not authenticated)

```typescript
export default async function ProtectedPage() {
  const userId = await requireAuth()
  // Use userId for data fetching
  return <div>User ID: {userId}</div>
}
```

### Require User Profile

```typescript
export default async function ProfilePage() {
  const user = await requireUser()
  return (
    <div>
      Welcome, {user.firstName} {user.lastName}
      {user.emailAddresses[0].emailAddress}
    </div>
  )
}
```

### Conditional Rendering (no throw)

```typescript
export default async function HomePage() {
  const userId = await getAuthOrNull()

  if (userId) {
    return <DashboardView />
  }

  return <LandingPageView />
}
```

## Route Handler Patterns

### Protected API Route

```typescript
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const userId = await requireAuth()
    const data = await fetchUserData(userId)
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

### POST with Input Validation

```typescript
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
})

export async function POST(request: Request) {
  try {
    const userId = await requireAuth()

    // Parse and validate input
    const body = await request.json()
    const validatedData = CreateProjectSchema.parse(body)

    // Create resource
    const project = await createProject(userId, validatedData)

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

## Server Action Patterns

```typescript
'use server'

import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProjectName(projectId: string, name: string) {
  const userId = await requireAuth()

  // Verify ownership
  const project = await db.project.findUnique({
    where: { id: projectId, userId }
  })

  if (!project) {
    throw new Error('Project not found or access denied')
  }

  // Update
  await db.project.update({
    where: { id: projectId },
    data: { name }
  })

  // Revalidate cached pages
  revalidatePath('/projects')
  revalidatePath(`/projects/${projectId}`)
}
```

## RBAC Pattern

```typescript
import { requireAuth } from '@/lib/auth'
import { ProjectRole } from '@/types/auth'

async function requireProjectAccess(
  projectId: string,
  minimumRole: ProjectRole = ProjectRole.VIEWER
) {
  const userId = await requireAuth()

  const member = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId }
    }
  })

  if (!member) {
    throw new Error('Access denied')
  }

  const roleHierarchy = {
    [ProjectRole.VIEWER]: 1,
    [ProjectRole.EDITOR]: 2,
    [ProjectRole.OWNER]: 3,
  }

  if (roleHierarchy[member.role] < roleHierarchy[minimumRole]) {
    throw new Error('Insufficient permissions')
  }

  return { userId, role: member.role }
}

// Usage
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireProjectAccess(params.id, ProjectRole.VIEWER)
  const project = await fetchProject(params.id)
  return NextResponse.json({ project })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  await requireProjectAccess(params.id, ProjectRole.EDITOR)
  const data = await request.json()
  const project = await updateProject(params.id, data)
  return NextResponse.json({ project })
}
```

## Client Component Patterns

### Show/Hide Based on Auth

```typescript
'use client'

import { useAuth } from '@clerk/nextjs'

export function ConditionalFeature() {
  const { isSignedIn } = useAuth()

  if (!isSignedIn) {
    return <SignInPrompt />
  }

  return <ProtectedFeature />
}
```

### User Profile Display

```typescript
'use client'

import { useUser } from '@clerk/nextjs'

export function UserGreeting() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return <div>Loading...</div>

  if (!user) return null

  return <div>Hello, {user.firstName}!</div>
}
```

### Navigation with Auth State

```typescript
'use client'

import { useAuth } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export function Navigation() {
  const { isSignedIn } = useAuth()

  return (
    <nav>
      <Link href="/">Home</Link>
      {isSignedIn ? (
        <>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <UserButton afterSignOutUrl="/" />
        </>
      ) : (
        <>
          <Link href="/sign-in">Sign In</Link>
          <Link href="/sign-up">Sign Up</Link>
        </>
      )}
    </nav>
  )
}
```

## Middleware Pattern

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
  '/api/projects(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

## Common Mistakes to Avoid

### DON'T: Rely on middleware alone

```typescript
// BAD - No auth verification
export default function ProtectedPage() {
  // Middleware protects this route, but that's not enough!
  return <div>Secret data</div>
}
```

```typescript
// GOOD - Always verify in component
export default async function ProtectedPage() {
  const userId = await requireAuth()
  return <div>Secret data for {userId}</div>
}
```

### DON'T: Use client-side auth for data fetching

```typescript
// BAD - Client-side auth is not secure
'use client'
export function ProjectList() {
  const { userId } = useAuth()
  const { data } = useSWR(`/api/projects?userId=${userId}`)
  return <div>{data}</div>
}
```

```typescript
// GOOD - Server-side auth
export default async function ProjectList() {
  const userId = await requireAuth()
  const projects = await fetchProjects(userId)
  return <ProjectGrid projects={projects} />
}
```

### DON'T: Skip input validation

```typescript
// BAD - Trusting user input
export async function POST(request: Request) {
  const userId = await requireAuth()
  const body = await request.json() // Unknown type!
  await db.project.create({ data: body }) // Dangerous!
}
```

```typescript
// GOOD - Validate with Zod
export async function POST(request: Request) {
  const userId = await requireAuth()
  const body = await request.json()
  const validated = CreateProjectSchema.parse(body)
  await db.project.create({ data: { ...validated, userId } })
}
```
