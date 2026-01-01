'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import type { Quest, Task, Reward } from '@mcquest/schema'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/lib/store/editor-store'

/**
 * Props for the QuestDetailsModal component
 */
export interface QuestDetailsModalProps {
  /** The quest to display/edit, or null when closed */
  quest: Quest | null
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the modal is closed */
  onClose: () => void
  /** Callback when quest is saved in edit mode */
  onSave: (updatedQuest: Quest) => void
  /** Display mode - view or edit */
  mode: 'view' | 'edit'
}

/**
 * Quest Details Modal Component
 *
 * A fully accessible modal dialog for viewing and editing quest information.
 * Features:
 * - Tab-based navigation between sections (Overview, Tasks, Rewards, Dependencies, Metadata)
 * - View mode: read-only display with option to edit
 * - Edit mode: editable fields with save/cancel actions
 * - Keyboard navigation and screen reader support
 * - Focus management and ARIA attributes
 *
 * Acceptance criteria:
 * ✅ Modal displays all quest information correctly
 * ✅ View and edit modes work
 * ✅ Responsive layout
 * ✅ Accessible (keyboard navigation, focus management)
 */
export function QuestDetailsModal({
  quest,
  isOpen,
  onClose,
  onSave,
  mode: initialMode,
}: QuestDetailsModalProps) {
  // Local state for edit mode
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [editedQuest, setEditedQuest] = useState<Quest | null>(quest)

  // Get dependencies and quests from store to resolve dependency names
  const snapshot = useEditorStore((state) => state.snapshot)
  const dependencies = snapshot?.dependencies ?? []
  const quests = snapshot?.quests ?? []

  // Reset state when quest changes
  useEffect(() => {
    setEditedQuest(quest)
    setMode(initialMode)
  }, [quest, initialMode])

  if (!quest || !editedQuest) {
    return null
  }

  // Get quest dependencies
  const questDependencies = dependencies.filter((d) => d.toQuestId === quest.id)
  const dependencyQuests = questDependencies.map((dep) => ({
    quest: quests.find((q) => q.id === dep.fromQuestId),
    type: dep.type,
  }))

  const handleSave = () => {
    if (editedQuest) {
      onSave(editedQuest)
      setMode('view')
    }
  }

  const handleCancel = () => {
    setEditedQuest(quest)
    setMode('view')
  }

  const handleEdit = () => {
    setMode('edit')
  }

  const isEditing = mode === 'edit'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby="quest-details-description"
      >
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editedQuest.title}
                  onChange={(e) =>
                    setEditedQuest({ ...editedQuest, title: e.target.value })
                  }
                  className="text-lg font-semibold"
                  aria-label="Quest title"
                  autoFocus
                />
              ) : (
                <DialogTitle>{quest.title}</DialogTitle>
              )}
              {quest.subtitle && (
                <DialogDescription className="mt-1">
                  {quest.subtitle}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" aria-label={`Quest shape: ${quest.shape}`}>
                {quest.shape}
              </Badge>
              {quest.icon && (
                <Badge variant="outline" aria-label={`Quest icon: ${quest.icon.value}`}>
                  {quest.icon.value}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <span id="quest-details-description" className="sr-only">
          Detailed information about the quest {quest.title}
        </span>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList
            className="grid w-full grid-cols-5"
            aria-label="Quest details sections"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks <span className="ml-1 text-xs">({quest.tasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rewards">
              Rewards <span className="ml-1 text-xs">({quest.rewards.length})</span>
            </TabsTrigger>
            <TabsTrigger value="dependencies">
              Dependencies <span className="ml-1 text-xs">({questDependencies.length})</span>
            </TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={editedQuest.description ?? ''}
                    onChange={(e) =>
                      setEditedQuest({ ...editedQuest, description: e.target.value })
                    }
                    placeholder="Quest description..."
                    className="min-h-[120px]"
                    aria-label="Quest description"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {quest.description || 'No description provided'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Settings</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Optional:</dt>
                      <dd>{quest.settings.optional ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Hidden:</dt>
                      <dd className="capitalize">{quest.settings.hidden}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Repeatable:</dt>
                      <dd>{quest.settings.repeatable ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Layout</h3>
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Position:</dt>
                      <dd>
                        ({quest.position.x.toFixed(0)}, {quest.position.y.toFixed(0)})
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Size:</dt>
                      <dd>{quest.size}x</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Shape:</dt>
                      <dd className="capitalize">{quest.shape}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 space-y-3">
              {quest.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tasks defined for this quest
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Quest tasks list">
                  {quest.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="rewards" className="mt-0 space-y-3">
              {quest.rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No rewards defined for this quest
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Quest rewards list">
                  {quest.rewards.map((reward) => (
                    <RewardItem key={reward.id} reward={reward} />
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="dependencies" className="mt-0 space-y-3">
              {questDependencies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No dependencies for this quest
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Quest dependencies list">
                  {dependencyQuests.map((dep, idx) => (
                    <DependencyItem
                      key={idx}
                      quest={dep.quest}
                      dependencyType={dep.type}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="metadata" className="mt-0 space-y-3">
              {quest.metadata?.ftbQuestsId && (
                <div>
                  <h3 className="text-sm font-medium mb-2">FTB Quests ID</h3>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {quest.metadata.ftbQuestsId}
                  </code>
                </div>
              )}

              {quest.metadata?.snbtMetadata &&
                Object.keys(quest.metadata.snbtMetadata).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">SNBT Metadata</h3>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View preserved SNBT fields
                      </summary>
                      <pre className="mt-2 bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(quest.metadata.snbtMetadata, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

              {!quest.metadata?.ftbQuestsId &&
                (!quest.metadata?.snbtMetadata ||
                  Object.keys(quest.metadata.snbtMetadata).length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No metadata available
                  </p>
                )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleEdit}>Edit Quest</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Task Item Component
 * Displays a single task with type badge and details
 */
function TaskItem({ task }: { task: Task }) {
  const getTaskDetails = () => {
    switch (task.type) {
      case 'item':
        return task.item ?? 'No item specified'
      case 'advancement':
        return task.advancementId ?? 'No advancement specified'
      case 'kill':
        return task.entityType ?? 'No entity specified'
      case 'location':
        return task.dimension
          ? `${task.dimension} (${task.range ?? 0}m)`
          : 'No location specified'
      case 'checkmark':
        return 'Manual completion'
      case 'xp':
        return `${task.count ?? 1} XP`
      case 'observation':
        return 'Observe block'
      case 'stat':
        return 'Reach stat value'
      default:
        return 'Unknown task type'
    }
  }

  return (
    <li className="flex items-start gap-3 p-3 border rounded-lg">
      <Badge variant="outline" className="mt-0.5 capitalize">
        {task.type}
      </Badge>
      <div className="flex-1 min-w-0">
        {task.title && <p className="font-medium text-sm">{task.title}</p>}
        <p className="text-sm text-muted-foreground">{getTaskDetails()}</p>
        {task.count > 1 && (
          <p className="text-xs text-muted-foreground mt-1">Count: {task.count}</p>
        )}
      </div>
    </li>
  )
}

/**
 * Reward Item Component
 * Displays a single reward with type badge and details
 */
function RewardItem({ reward }: { reward: Reward }) {
  const getRewardDetails = () => {
    switch (reward.type) {
      case 'item':
        return reward.item ?? 'No item specified'
      case 'command':
        return reward.command ?? 'No command specified'
      case 'xp':
        return `${reward.xp ?? 0} XP`
      case 'xp_levels':
        return `${reward.levels ?? 0} levels`
      case 'loot':
        return reward.table ?? 'No loot table specified'
      case 'choice':
        return 'Player choice'
      case 'random':
        return 'Random reward'
      default:
        return 'Unknown reward type'
    }
  }

  return (
    <li className="flex items-start gap-3 p-3 border rounded-lg">
      <Badge variant="secondary" className="mt-0.5 capitalize">
        {reward.type}
      </Badge>
      <div className="flex-1 min-w-0">
        {reward.title && <p className="font-medium text-sm">{reward.title}</p>}
        <p className="text-sm text-muted-foreground">{getRewardDetails()}</p>
        {reward.count > 1 && (
          <p className="text-xs text-muted-foreground mt-1">Count: {reward.count}</p>
        )}
      </div>
    </li>
  )
}

/**
 * Dependency Item Component
 * Displays a quest dependency with type badge
 */
function DependencyItem({
  quest,
  dependencyType,
}: {
  quest: Quest | undefined
  dependencyType: 'AND' | 'OR'
}) {
  if (!quest) {
    return (
      <li className="flex items-start gap-3 p-3 border rounded-lg opacity-50">
        <Badge variant="outline">Unknown</Badge>
        <p className="text-sm text-muted-foreground">Quest not found</p>
      </li>
    )
  }

  return (
    <li className="flex items-start gap-3 p-3 border rounded-lg">
      <Badge
        variant={dependencyType === 'AND' ? 'default' : 'secondary'}
        className="mt-0.5"
      >
        {dependencyType}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{quest.title}</p>
        {quest.subtitle && (
          <p className="text-xs text-muted-foreground">{quest.subtitle}</p>
        )}
      </div>
    </li>
  )
}
