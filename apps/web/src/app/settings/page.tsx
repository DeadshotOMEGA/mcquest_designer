import * as React from 'react'
import { requireUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/**
 * Settings Page - User account settings and preferences
 *
 * Features:
 * - User profile information from Clerk
 * - Account details
 * - Email addresses
 * - Security settings link
 *
 * Security:
 * - Requires authentication via requireUser()
 */

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic'

export default async function SettingsPage(): Promise<React.ReactElement> {
  const user = await requireUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Separator />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your personal information from your Clerk account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">First Name</label>
              <p className="text-sm font-medium">{user.firstName || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Name</label>
              <p className="text-sm font-medium">{user.lastName || 'Not set'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <p className="text-sm font-medium">{user.username || 'Not set'}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">User ID</label>
            <p className="text-xs font-mono text-muted-foreground">{user.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Email Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Email Addresses</CardTitle>
          <CardDescription>Manage your email addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.emailAddresses.map((email) => (
              <div key={email.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{email.emailAddress}</span>
                  {email.id === user.primaryEmailAddressId && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                  {email.verification?.status === 'verified' && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account security and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Password & Security</p>
              <p className="text-sm text-muted-foreground">
                Update your password and security settings
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`https://accounts.clerk.dev/user`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Manage in Clerk
              </a>
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`https://accounts.clerk.dev/user`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Configure
              </a>
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Connected Accounts</p>
              <p className="text-sm text-muted-foreground">
                Manage social login connections (Google, GitHub, etc.)
              </p>
            </div>
            <Button variant="outline" asChild>
              <a
                href={`https://accounts.clerk.dev/user`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Manage
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              <Badge variant="secondary">System</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Configure email and in-app notifications
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
