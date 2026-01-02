import * as React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/extended/toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'MCQuest Designer',
  description: 'Visual graph editor for FTB Quests questbooks',
}

/**
 * Check if Clerk is properly configured with valid credentials.
 * Returns false during build time when credentials are missing or invalid.
 */
function isClerkConfigured(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  // Clerk keys follow pattern: pk_test_* or pk_live_* (with base64-like suffix)
  // Reject placeholder values and require at least 20 chars for the key portion
  // Base64 can contain: A-Za-z0-9-_.=$ and other special chars
  return (
    !!publishableKey &&
    !publishableKey.includes('placeholder') &&
    /^pk_(test|live)_.{20,}$/.test(publishableKey)
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactElement {
  const clerkEnabled = isClerkConfigured()

  const content = (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )

  // Wrap with ClerkProvider only when properly configured
  // This allows builds to succeed without valid Clerk credentials
  if (clerkEnabled) {
    return <ClerkProvider>{content}</ClerkProvider>
  }

  return content
}
