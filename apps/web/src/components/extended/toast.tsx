'use client'

import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

/**
 * Toast provider component using Sonner.
 * Place this in your root layout to enable toast notifications throughout the app.
 *
 * @example
 * ```tsx
 * import { Toaster } from '@/components/extended/toast'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

/**
 * Type-safe toast helper functions.
 * Re-exports Sonner's toast function.
 *
 * Usage examples:
 * - toast.success('Project created successfully')
 * - toast.error('Failed to save changes')
 * - toast.info('New version available', { description: 'Click here to update' })
 * - toast.promise(saveProject(), { loading: 'Saving...', success: 'Saved', error: 'Failed' })
 */
export { toast } from 'sonner'
