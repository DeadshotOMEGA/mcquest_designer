import { inngest } from '@/inngest/client'
import { questbookImportJob } from '@/inngest/functions'
import { serve } from 'inngest/next'

/**
 * Inngest webhook endpoint for Next.js
 *
 * Serves:
 * - POST /api/inngest: Webhook for Inngest to trigger functions
 * - GET /api/inngest: Introspection endpoint for Inngest dashboard
 *
 * Configuration (via environment):
 * - INNGEST_EVENT_KEY: Event authentication key
 * - INNGEST_BASE_URL: Base URL for webhook (production)
 *
 * Development:
 * Run `inngest dev` in parallel to test locally
 *
 * @example
 * ```bash
 * # Production deployment
 * inngest env set INNGEST_EVENT_KEY your_key_here
 *
 * # Development
 * inngest dev
 * ```
 */
export const { POST, GET } = serve({
  client: inngest,
  functions: [questbookImportJob],
})
