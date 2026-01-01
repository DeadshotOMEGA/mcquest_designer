'use client'

import * as React from 'react'
import Link from 'next/link'
import { Upload } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
 * - Primary link wraps card for keyboard navigation
 * - Action buttons positioned outside main link to prevent nesting
 * - Role badge provides context
 * - Time information uses relative formatting
 */
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="h-full transition-colors hover:bg-accent/50 group relative">
      <Link
        href={`/editor/${project.id}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg absolute inset-0 z-0"
        aria-label={`Open project: ${project.name}`}
      >
        <span className="sr-only">Open {project.name}</span>
      </Link>

      <CardHeader className="relative z-10">
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

      <CardContent className="relative z-10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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

        <div className="flex gap-2">
          <Link
            href={`/dashboard/projects/${project.id}/import`}
            onClick={(e) => e.stopPropagation()}
            className="relative z-20"
          >
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              aria-label={`Import questbook into ${project.name}`}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="ml-1.5">Import</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
