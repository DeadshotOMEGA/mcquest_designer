import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleApiError, ApiErrors } from '@/lib/api-error'

/**
 * Clerk webhook types
 */
type WebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses?: Array<{
      id: string
      email_address: string
    }>
    primary_email_address_id?: string
    first_name?: string
    last_name?: string
    image_url?: string
    deleted?: boolean
  }
}

/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events to sync user data
 *
 * Required environment variables:
 * - CLERK_WEBHOOK_SECRET: Webhook signing secret from Clerk Dashboard
 *
 * Supported events:
 * - user.created: Create user in database
 * - user.updated: Update user data
 * - user.deleted: Soft delete or mark user
 */
export async function POST(request: Request) {
  try {
    // Get the headers
    const headerPayload = await headers()
    const svixId = headerPayload.get('svix-id')
    const svixTimestamp = headerPayload.get('svix-timestamp')
    const svixSignature = headerPayload.get('svix-signature')

    // If there are no headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw ApiErrors.badRequest('Missing svix headers')
    }

    // Get the webhook secret
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not set')
      throw ApiErrors.internal('Webhook configuration error')
    }

    // Get the body
    const body = await request.text()

    // Create a new Svix instance with your secret
    const wh = new Webhook(webhookSecret)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent
    } catch (err) {
      console.error('Error verifying webhook:', err)
      throw ApiErrors.badRequest('Invalid webhook signature')
    }

    // Handle the webhook event
    const eventType = evt.type
    const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url } =
      evt.data

    console.log(`Webhook event received: ${eventType} for user ${id}`)

    switch (eventType) {
      case 'user.created': {
        // Get primary email
        const primaryEmail = email_addresses?.find((e) => e.id === primary_email_address_id)

        if (!primaryEmail) {
          console.error('No primary email found for user', id)
          throw ApiErrors.badRequest('User has no primary email')
        }

        // Create user in database
        await prisma.users.create({
          data: {
            id: `clerk_${id}`,
            clerkId: id,
            email: primaryEmail.email_address,
            name: first_name ? `${first_name}${last_name ? ' ' + last_name : ''}` : null,
            avatar_url: image_url,
            updated_at: new Date(),
          },
        })

        console.log(`Created user ${id} in database`)
        break
      }

      case 'user.updated': {
        // Get primary email
        const primaryEmail = email_addresses?.find((e) => e.id === primary_email_address_id)

        if (!primaryEmail) {
          console.error('No primary email found for user', id)
          // Don't throw - user might exist already with old email
          break
        }

        // Update user in database
        await prisma.users.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail.email_address,
            name: first_name ? `${first_name}${last_name ? ' ' + last_name : ''}` : null,
            avatar_url: image_url,
            updated_at: new Date(),
          },
        })

        console.log(`Updated user ${id} in database`)
        break
      }

      case 'user.deleted': {
        // Delete user from database
        // This will cascade delete memberships due to Prisma schema
        await prisma.users.delete({
          where: { clerkId: id },
        })

        console.log(`Deleted user ${id} from database`)
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
