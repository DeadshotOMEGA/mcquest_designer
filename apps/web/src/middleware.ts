import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

/**
 * Routes that require authentication
 * These are protected by Clerk middleware
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/projects(.*)',
  '/editor(.*)',
  '/api/projects(.*)',
])

/**
 * CVE-2025-29927 Mitigation:
 * While middleware provides route-level protection, ALWAYS verify auth
 * in Server Components and Route Handlers using auth() or currentUser()
 *
 * Middleware is the first line of defense, not the only one.
 */
export default clerkMiddleware(async (auth, request) => {
  // Protect routes that require authentication
  if (isProtectedRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
