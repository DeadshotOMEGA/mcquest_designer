import { SignIn } from '@clerk/nextjs'

/**
 * Sign-in page with OAuth providers (GitHub, Discord, Google)
 *
 * The [[...sign-in]] catch-all route handles:
 * - /sign-in
 * - /sign-in/factor-one
 * - /sign-in/factor-two
 * - /sign-in/sso-callback
 *
 * Configure OAuth providers in Clerk Dashboard:
 * https://dashboard.clerk.com/
 */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
