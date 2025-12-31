'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

function NavLink({ href, children, isActive }: NavLinkProps): React.ReactElement {
  return (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium transition-colors hover:text-primary',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {children}
    </Link>
  )
}

export function Navbar(): React.ReactElement | null {
  const pathname = usePathname()
  const { isSignedIn } = useUser()

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center space-x-2">
          <span className="font-bold text-xl">MCQuest</span>
        </Link>

        {/* Navigation Links */}
        {isSignedIn && (
          <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
            <NavLink href="/dashboard" isActive={pathname === '/dashboard'}>
              Dashboard
            </NavLink>
            <NavLink href="/dashboard" isActive={pathname?.startsWith('/editor')}>
              Projects
            </NavLink>
          </nav>
        )}

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isSignedIn ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings">Settings</Link>
              </Button>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
