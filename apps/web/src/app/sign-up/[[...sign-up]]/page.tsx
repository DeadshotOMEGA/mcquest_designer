import { SignUp } from '@clerk/nextjs'

/**
 * Sign-up page with OAuth providers (GitHub, Discord, Google)
 *
 * The [[...sign-up]] catch-all route handles:
 * - /sign-up
 * - /sign-up/verify-email-address
 * - /sign-up/verify-phone-number
 * - /sign-up/sso-callback
 *
 * Configure OAuth providers in Clerk Dashboard:
 * https://dashboard.clerk.com/
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
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
