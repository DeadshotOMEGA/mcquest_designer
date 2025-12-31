'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from '@/lib/date-utils'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string | null
    updatedAt: string
    memberCount?: number
    role?: 'OWNER' | 'EDITOR' | 'VIEWER'
  }
}

/**
 * ProjectCard - Displays project summary with metadata
 *
 * Accessibility:
 * - Uses semantic card structure
 * - Link wraps entire card for keyboard navigation
 * - Role badge provides context
 * - Time information uses relative formatting
 */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/editor/${project.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <Card className="h-full transition-colors hover:bg-accent/50 group-focus-visible:bg-accent/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl line-clamp-2">{project.name}</CardTitle>
            {project.role && (
              <Badge
                variant={project.role === 'OWNER' ? 'default' : 'secondary'}
                className="shrink-0"
              >
                {project.role}
              </Badge>
            )}
          </div>
          {project.description && (
            <CardDescription className="line-clamp-3">{project.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <time
              dateTime={project.updatedAt}
              title={new Date(project.updatedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            >
              Updated {formatDistanceToNow(new Date(project.updatedAt))}
            </time>
            {project.memberCount !== undefined && project.memberCount > 1 && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true">👥</span>
                <span className="sr-only">Members:</span>
                {project.memberCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
