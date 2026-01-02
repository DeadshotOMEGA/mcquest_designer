import { auth, currentUser } from '@clerk/nextjs/server'
import type { User } from '@clerk/nextjs/server'

/**
 * Server-side auth utilities for Next.js App Router
 *
 * CVE-2025-29927 Mitigation:
 * These functions MUST be called in Server Components and Route Handlers
 * to verify authentication, even when middleware is in place.
 *
 * Development Mode:
 * Set DISABLE_AUTH=true to bypass authentication during development.
 */

/**
 * Check if authentication is disabled for development
 */
function isAuthDisabled(): boolean {
  return process.env.DISABLE_AUTH === 'true'
}

/**
 * Check if Clerk is properly configured.
 * Returns false during build or when credentials are missing/invalid.
 */
function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  // Reject placeholder values and require at least 20 chars for the key portion
  return (
    !!publishableKey &&
    !publishableKey.includes('placeholder') &&
    /^pk_(test|live)_[A-Za-z0-9]{20,}$/.test(publishableKey)
  )
}

/**
 * Get the current authenticated user's ID
 * Throws if not authenticated
 *
 * @example
 * ```ts
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const userId = await requireAuth()
 *   // userId is guaranteed to exist here
 * }
 * ```
 */
export async function requireAuth(): Promise<string> {
  if (isAuthDisabled()) {
    return 'dev-user-id'
  }

  if (!isClerkConfigured()) {
    throw new Error('Unauthorized: Authentication service not configured')
  }

  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized: User must be authenticated')
  }

  return userId
}

/**
 * Get the current authenticated user's full profile
 * Throws if not authenticated
 *
 * @example
 * ```ts
 * export default async function ProfilePage() {
 *   const user = await requireUser()
 *   return <div>Welcome, {user.firstName}!</div>
 * }
 * ```
 */
export async function requireUser(): Promise<User> {
  if (isAuthDisabled()) {
    // Return a mock user for development
    return {
      id: 'dev-user-id',
      firstName: 'Dev',
      lastName: 'User',
      emailAddresses: [{ id: 'email-1', emailAddress: 'dev@example.com' }],
      primaryEmailAddressId: 'email-1',
      imageUrl: '',
    } as User
  }

  if (!isClerkConfigured()) {
    throw new Error('Unauthorized: Authentication service not configured')
  }

  const user = await currentUser()

  if (!user) {
    throw new Error('Unauthorized: User must be authenticated')
  }

  return user
}

/**
 * Get the current auth state without throwing
 * Returns null if not authenticated or if Clerk is not configured
 *
 * @example
 * ```ts
 * export default async function HomePage() {
 *   const userId = await getAuthOrNull()
 *   if (userId) {
 *     return <DashboardCTA />
 *   }
 *   return <SignUpCTA />
 * }
 * ```
 */
export async function getAuthOrNull(): Promise<string | null> {
  if (isAuthDisabled()) {
    return 'dev-user-id'
  }

  if (!isClerkConfigured()) {
    return null
  }
  const { userId } = await auth()
  return userId
}

/**
 * Get the current user without throwing
 * Returns null if not authenticated or if Clerk is not configured
 */
export async function getUserOrNull(): Promise<User | null> {
  if (!isClerkConfigured()) {
    return null
  }
  return await currentUser()
}

/**
 * Check if the current request is authenticated
 * Returns false if Clerk is not configured
 *
 * @example
 * ```ts
 * const isAuthed = await isAuthenticated()
 * if (!isAuthed) {
 *   redirect('/sign-in')
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  if (!isClerkConfigured()) {
    return false
  }
  const { userId } = await auth()
  return !!userId
}

/**
 * Get or create database user from Clerk session
 * Returns the database user record, creating it if it doesn't exist
 *
 * @example
 * ```ts
 * const dbUser = await getCurrentDbUser()
 * console.log(dbUser.id, dbUser.email)
 * ```
 */
export async function getCurrentDbUser() {
  const { prisma } = await import('./db')

  if (isAuthDisabled()) {
    // Return or create a dev user
    const devUser = await prisma.users.upsert({
      where: { clerkId: 'dev-user-id' },
      update: {
        updated_at: new Date(),
      },
      create: {
        id: 'dev-user-db-id',
        clerkId: 'dev-user-id',
        email: 'dev@example.com',
        name: 'Dev User',
        avatar_url: '',
        updated_at: new Date(),
      },
    })
    return devUser
  }

  const clerkUser = await requireUser()

  // Get primary email address
  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress

  if (!email) {
    throw new Error('User has no email address')
  }

  // Upsert user in database
  const dbUser = await prisma.users.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
        : undefined,
      avatar_url: clerkUser.imageUrl,
      updated_at: new Date(),
    },
    create: {
      id: `clerk_${clerkUser.id}`,
      clerkId: clerkUser.id,
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
        : undefined,
      avatar_url: clerkUser.imageUrl,
      updated_at: new Date(),
    },
  })

  return dbUser
}

/**
 * Check project access and return user's role
 * Throws ApiError if user doesn't have required access
 *
 * @param projectId - Project to check access for
 * @param requiredRole - Minimum role required (OWNER > EDITOR > VIEWER)
 * @returns The user's membership record
 *
 * @example
 * ```ts
 * // Check if user has at least EDITOR access
 * const membership = await checkProjectAccess(projectId, 'EDITOR')
 * ```
 */
export async function checkProjectAccess(
  projectId: string,
  requiredRole?: 'OWNER' | 'EDITOR' | 'VIEWER'
) {
  const { prisma } = await import('./db')
  const { ApiErrors } = await import('./api-error')
  const dbUser = await getCurrentDbUser()

  // Find user's membership in the project
  const membership = await prisma.project_members.findUnique({
    where: {
      project_id_user_id: {
        project_id: projectId,
        user_id: dbUser.id,
      },
    },
    include: {
      projects: true,
    },
  })

  if (!membership) {
    throw ApiErrors.notFound('Project')
  }

  // If a specific role is required, check if user has sufficient permissions
  if (requiredRole) {
    const roleHierarchy: Record<'VIEWER' | 'EDITOR' | 'OWNER', number> = {
      VIEWER: 0,
      EDITOR: 1,
      OWNER: 2,
    }
    const userLevel = roleHierarchy[membership.role as 'VIEWER' | 'EDITOR' | 'OWNER']
    const requiredLevel = roleHierarchy[requiredRole]

    if (userLevel < requiredLevel) {
      throw ApiErrors.forbidden(
        `This action requires ${requiredRole} role, but you have ${membership.role}`
      )
    }
  }

  return membership
}
