'use client'

import React, { useCallback, useMemo, useState } from 'react'
import type { Chapter, Dependency, Quest } from '@mcquest/schema'
import type { DependencyType } from '@mcquest/schema'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Trash2 } from 'lucide-react'
import { QuestAutocomplete } from './quest-autocomplete'
import { DependencyVisualizer } from './dependency-visualizer'
import { validateDependency } from '@/lib/validation/dependency-graph'

/**
 * Props for DependencyEditor
 */
interface DependencyEditorProps {
  quest: Quest
  allQuests: Quest[]
  allChapters: Chapter[]
  allDependencies: Dependency[]
  onAddDependency?: (dependency: Dependency) => void
  onRemoveDependency?: (fromQuestId: string, toQuestId: string) => void
  onUpdateDependency?: (
    fromQuestId: string,
    toQuestId: string,
    updates: Partial<Dependency>
  ) => void
}

/**
 * Dependency Editor with Cycle Detection
 *
 * Features:
 * - Autocomplete search to add dependencies (filters 600+ quests quickly)
 * - AND/OR toggle for each dependency
 * - Visual cycle detection with clear error messages
 * - Bidirectional reference display (incoming + outgoing)
 * - Delete button for each dependency
 * - Prevents circular dependencies before save
 *
 * Data Model:
 * - Dependencies stored at project level in ProjectSnapshot.dependencies[]
 * - Each dependency: { fromQuestId, toQuestId, type: 'AND' | 'OR' }
 * - Editor state only: dirty flag tracked by parent form
 */
export function DependencyEditor({
  quest,
  allQuests,
  allChapters,
  allDependencies,
  onAddDependency,
  onRemoveDependency,
  onUpdateDependency,
}: DependencyEditorProps) {
  const [cycleError, setCycleError] = useState<string | null>(null)

  // Find outgoing dependencies from this quest
  const outgoingDependencies = useMemo(
    () => allDependencies.filter((d) => d.fromQuestId === quest.id),
    [quest.id, allDependencies]
  )

  // Find incoming dependencies to this quest
  const incomingDependencies = useMemo(
    () => allDependencies.filter((d) => d.toQuestId === quest.id),
    [quest.id, allDependencies]
  )

  // Create quest and chapter maps for quick lookup
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

  // Handle adding a new dependency
  const handleAddDependency = useCallback(
    (toQuestId: string) => {
      // Validate dependency before adding
      const newDependency: Dependency = {
        fromQuestId: quest.id,
        toQuestId,
        type: 'AND',
      }

      const validation = validateDependency(newDependency, allDependencies)

      if (validation?.hasCycle) {
        setCycleError(validation.message ?? 'Cannot add dependency: would create a cycle')
        return
      }

      // Check if dependency already exists
      if (outgoingDependencies.some((d) => d.toQuestId === toQuestId)) {
        setCycleError('This dependency already exists')
        return
      }

      setCycleError(null)
      onAddDependency?.(newDependency)
    },
    [quest.id, allDependencies, outgoingDependencies, onAddDependency]
  )

  // Handle removing a dependency
  const handleRemoveDependency = useCallback(
    (toQuestId: string) => {
      setCycleError(null)
      onRemoveDependency?.(quest.id, toQuestId)
    },
    [quest.id, onRemoveDependency]
  )

  // Handle toggling AND/OR
  const handleToggleDependencyType = useCallback(
    (toQuestId: string) => {
      const dep = outgoingDependencies.find((d) => d.toQuestId === toQuestId)
      if (!dep) return

      const newType: DependencyType = dep.type === 'AND' ? 'OR' : 'AND'
      setCycleError(null)
      onUpdateDependency?.(quest.id, toQuestId, { type: newType })
    },
    [quest.id, outgoingDependencies, onUpdateDependency]
  )


  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {cycleError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{cycleError}</AlertDescription>
        </Alert>
      )}

      {/* Add New Dependency Section */}
      <Card className="p-4 bg-muted/30">
        <h4 className="font-semibold text-sm mb-3">Add Dependency</h4>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            This quest will require completion of the selected quest before it can be completed.
          </p>
          <QuestAutocomplete
            quests={allQuests}
            chapters={allChapters}
            onSelect={handleAddDependency}
            placeholder="Search for a quest to depend on..."
            excludeQuestId={quest.id}
          />
        </div>
      </Card>

      {/* Outgoing Dependencies Section */}
      {outgoingDependencies.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            This Quest Depends On
            <Badge variant="outline">{outgoingDependencies.length}</Badge>
          </h4>

          <div className="space-y-2">
            {outgoingDependencies.map((dep) => {
              const targetQuest = questMap.get(dep.toQuestId)
              const targetChapter = targetQuest
                ? chapterMap.get(targetQuest.chapterId)
                : null

              if (!targetQuest || !targetChapter) {
                return null
              }

              return (
                <Card
                  key={`${dep.fromQuestId}-${dep.toQuestId}`}
                  className="p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{targetQuest.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{targetChapter.title}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* AND/OR Toggle */}
                    <Button
                      variant={dep.type === 'OR' ? 'secondary' : 'default'}
                      size="sm"
                      onClick={() => handleToggleDependencyType(dep.toQuestId)}
                      className="w-12"
                      title={`Toggle AND/OR (currently ${dep.type})`}
                    >
                      {dep.type}
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDependency(dep.toQuestId)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Remove dependency"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Incoming Dependencies (Read-Only) */}
      {incomingDependencies.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            Depended On By
            <Badge variant="outline">{incomingDependencies.length}</Badge>
          </h4>

          <div className="space-y-2">
            {incomingDependencies.map((dep) => {
              const sourcQuest = questMap.get(dep.fromQuestId)
              const sourceChapter = sourcQuest
                ? chapterMap.get(sourcQuest.chapterId)
                : null

              if (!sourcQuest || !sourceChapter) {
                return null
              }

              return (
                <Card
                  key={`${dep.fromQuestId}-${dep.toQuestId}`}
                  className="p-3 flex items-center justify-between gap-3 bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={dep.type === 'OR' ? 'secondary' : 'default'}>
                        {dep.type}
                      </Badge>
                      <span className="font-medium text-sm truncate">{sourcQuest.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{sourceChapter.title}</div>
                  </div>
                </Card>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-3 px-1">
            These quests require this one to be completed first. Modify them in their own
            dependency sections.
          </p>
        </div>
      )}

      {/* Bidirectional Reference Visualizer */}
      {(outgoingDependencies.length > 0 || incomingDependencies.length > 0) && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-sm mb-3">Dependency Overview</h4>
          <DependencyVisualizer
            quest={quest}
            allQuests={allQuests}
            allChapters={allChapters}
            dependencies={allDependencies}
          />
        </div>
      )}

      {/* Empty State */}
      {outgoingDependencies.length === 0 && incomingDependencies.length === 0 && (
        <div className="text-center p-6 text-muted-foreground">
          <p className="text-sm">No dependencies yet. This quest has no prerequisites.</p>
        </div>
      )}
    </div>
  )
}
