'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, InfoIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for ValidationBadge component
 */
interface ValidationBadgeProps {
  count: number
  severity: 'error' | 'warning' | 'info'
  className?: string
  title?: string
}

/**
 * ValidationBadge Component
 *
 * Displays a colored badge with icon and count for validation issues.
 * Used in tree nodes to show validation error/warning counts.
 *
 * Severity mapping:
 * - 'error': Red with AlertCircle icon (blocking issues)
 * - 'warning': Yellow/Amber with AlertTriangle icon (non-blocking)
 * - 'info': Blue with InfoIcon (informational)
 *
 * Example: [3] in red badge for 3 errors
 */
export const ValidationBadge = React.forwardRef<HTMLDivElement, ValidationBadgeProps>(
  ({ count, severity, className, title }, ref) => {
    if (count <= 0) return null

    const severityConfig = {
      error: {
        bgColor: 'bg-destructive/20',
        textColor: 'text-destructive',
        icon: AlertCircle,
        label: 'error',
      },
      warning: {
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        textColor: 'text-yellow-700 dark:text-yellow-500',
        icon: AlertTriangle,
        label: 'warning',
      },
      info: {
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        textColor: 'text-blue-700 dark:text-blue-500',
        icon: InfoIcon,
        label: 'info',
      },
    }

    const config = severityConfig[severity]
    const Icon = config.icon

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-xs font-semibold',
          config.bgColor,
          config.textColor,
          className
        )}
        title={title || `${count} ${config.label}${count === 1 ? '' : 's'}`}
        role="status"
        aria-label={`${count} ${config.label}${count === 1 ? '' : 's'}`}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        <span>{count}</span>
      </div>
    )
  }
)

ValidationBadge.displayName = 'ValidationBadge'
