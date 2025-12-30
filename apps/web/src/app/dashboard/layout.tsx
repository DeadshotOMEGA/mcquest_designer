import * as React from 'react'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { requireUser } from '@/lib/auth'

/**
 * Dashboard Layout
 *
 * Provides consistent header/navigation for authenticated dashboard pages
 *
 * Accessibility:
 * - Semantic HTML landmarks (header, main, nav)
 * - Skip to main content link for keyboard users
 * - Logo is a proper link with text
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Verify authentication (defense in depth)
  const user = await requireUser()

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-lg hover:text-primary transition-colors"
            >
              <span aria-hidden="true">📦</span>
              <span>MCQuest Designer</span>
            </Link>

            <nav aria-label="Main navigation">
              <ul className="flex items-center gap-4">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Projects
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.firstName || user.emailAddresses[0].emailAddress}
            </span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
