'use client'

import React, { useMemo } from 'react'
import type { Chapter, Dependency, Quest } from '@mcquest/schema'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

/**
 * Props for dependency visualizer
 */
interface DependencyVisualizerProps {
  quest: Quest
  allQuests: Quest[]
  allChapters: Chapter[]
  dependencies: Dependency[]
  onNavigate?: (questId: string) => void
  highlightCycleQuestId?: string
}

/**
 * Visualize incoming and outgoing dependencies for a quest
 *
 * Shows:
 * - Outgoing: What this quest depends on
 * - Incoming: What quests depend on this one
 * - Clear quest context (title, chapter)
 * - AND/OR indicators
 * - Cycle detection highlighting
 */
export function DependencyVisualizer({
  quest,
  allQuests,
  allChapters,
  dependencies,
  onNavigate,
  highlightCycleQuestId,
}: DependencyVisualizerProps) {
  // Create maps for quick lookup
  const questMap = useMemo(() => {
    const map = new Map<string, Quest>()
    for (const q of allQuests) {
      map.set(q.id, q)
    }
    return map
  }, [allQuests])

  const chapterMap = useMemo(() => {
    const map = new Map<string, Chapter>()
    for (const c of allChapters) {
      map.set(c.id, c)
    }
    return map
  }, [allChapters])

  // Find outgoing dependencies (what this quest depends on)
  const outgoingDeps = useMemo(() => {
    return dependencies.filter((d) => d.fromQuestId === quest.id)
  }, [quest.id, dependencies])

  // Find incoming dependencies (what depends on this quest)
  const incomingDeps = useMemo(() => {
    return dependencies.filter((d) => d.toQuestId === quest.id)
  }, [quest.id, dependencies])

  // Group dependencies by type (AND/OR)
  const groupedOutgoing = useMemo(() => {
    const and: Dependency[] = []
    const or: Dependency[] = []
    for (const dep of outgoingDeps) {
      if (dep.type === 'OR') {
        or.push(dep)
      } else {
        and.push(dep)
      }
    }
    return { and, or }
  }, [outgoingDeps])

  const groupedIncoming = useMemo(() => {
    const and: Dependency[] = []
    const or: Dependency[] = []
    for (const dep of incomingDeps) {
      if (dep.type === 'OR') {
        or.push(dep)
      } else {
        and.push(dep)
      }
    }
    return { and, or }
  }, [incomingDeps])

  const renderDependencyList = (deps: Dependency[]) => {
    if (deps.length === 0) return null

    return (
      <div className="space-y-2">
        {deps.map((dep) => {
          const targetId = dep.fromQuestId === quest.id ? dep.toQuestId : dep.fromQuestId
          const targetQuest = questMap.get(targetId)
          const chapter = targetQuest ? chapterMap.get(targetQuest.chapterId) : null

          if (!targetQuest || !chapter) return null

          const isHighlighted = highlightCycleQuestId === targetId
          const badge = dep.type === 'OR' ? 'OR' : 'AND'

          return (
            <div
              key={`${dep.fromQuestId}-${dep.toQuestId}`}
              className={`flex items-start justify-between gap-2 p-2 rounded-sm transition-colors ${
                isHighlighted
                  ? 'bg-destructive/10 border border-destructive/30'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={badge === 'OR' ? 'secondary' : 'default'} className="shrink-0">
                    {badge}
                  </Badge>
                  <span className="font-medium text-sm truncate">{targetQuest.title}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{chapter.title}</div>
              </div>

              {onNavigate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(targetId)}
                  className="shrink-0"
                  title="Navigate to quest"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // No dependencies
  if (outgoingDeps.length === 0 && incomingDeps.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-muted-foreground">
        No dependencies for this quest
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Outgoing Dependencies */}
      {outgoingDeps.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            This Quest Depends On
            <Badge variant="outline">{outgoingDeps.length}</Badge>
          </h4>

          {groupedOutgoing.and.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2 px-2">
                All required (AND)
              </div>
              {renderDependencyList(groupedOutgoing.and)}
            </div>
          )}

          {groupedOutgoing.or.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 px-2">
                One or more required (OR)
              </div>
              {renderDependencyList(groupedOutgoing.or)}
            </div>
          )}
        </div>
      )}

      {/* Incoming Dependencies */}
      {incomingDeps.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            Depended On By
            <Badge variant="outline">{incomingDeps.length}</Badge>
          </h4>

          {groupedIncoming.and.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2 px-2">
                Requires this (AND)
              </div>
              {renderDependencyList(groupedIncoming.and)}
            </div>
          )}

          {groupedIncoming.or.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 px-2">
                One option (OR)
              </div>
              {renderDependencyList(groupedIncoming.or)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
