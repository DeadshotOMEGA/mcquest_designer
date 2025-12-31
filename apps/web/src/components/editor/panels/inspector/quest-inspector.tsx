'use client'

import React, { useCallback, useState } from 'react'
import type { Quest, IconReference, Reward } from '@mcquest/schema'
import { useEditorStore, useSelectedQuestId, useQuest } from '@/lib/store/editor-store'
import { MetadataForm } from './metadata-form'
import { IconSelector } from './icon-selector'
import { SettingsForm } from './settings-form'
import { TasksList } from './tasks-list'
import { RewardsList } from './rewards-list'
import { ChevronDown } from 'lucide-react'

/**
 * QuestInspector - Panel for viewing and editing selected quest details
 *
 * This component:
 * - Shows "No quest selected" when nothing is selected
 * - Displays the MetadataForm for the selected quest
 * - Displays the SettingsForm with collapsible section for quest settings
 * - Handles updates to the store on form blur/change
 * - Will push undo points when undo/redo is implemented (#25)
 *
 * Acceptance criteria from #28 & #30:
 * - Shows selected quest details and settings
 * - Editable fields: title, subtitle, description, settings (repeatable, hidden, optional, etc.)
 * - Updates store on blur/change
 * - Settings in collapsible section
 * - Pushes undo point on save (placeholder for #25)
 */
export function QuestInspector() {
  const selectedQuestId = useSelectedQuestId()
  const quest = useQuest(selectedQuestId ?? '')
  const updateQuest = useEditorStore((state) => state.updateQuest)
  const [settingsOpen, setSettingsOpen] = useState(false)

  /**
   * Handle quest metadata updates from the form
   * Pushes changes to the store and marks dirty
   */
  const handleMetadataUpdate = useCallback(
    (updates: Partial<Pick<Quest, 'title' | 'subtitle' | 'description'>>) => {
      if (!selectedQuestId) return

      // TODO: Push undo point when #25 is implemented
      // pushUndoPoint()

      updateQuest(selectedQuestId, updates)
    },
    [selectedQuestId, updateQuest]
  )

  /**
   * Handle quest settings updates from the form
   * Pushes changes to the store and marks dirty
   */
  const handleSettingsUpdate = useCallback(
    (updates: Partial<Pick<Quest, 'settings'>>) => {
      if (!selectedQuestId) return

      // TODO: Push undo point when #25 is implemented
      // pushUndoPoint()

      updateQuest(selectedQuestId, updates)
    },
    [selectedQuestId, updateQuest]
  )

  /**
   * Handle quest icon updates from the icon selector
   * Pushes changes to the store and marks dirty
   */
  const handleIconUpdate = useCallback(
    (icon: IconReference | undefined) => {
      if (!selectedQuestId) return

      // TODO: Push undo point when #25 is implemented
      // pushUndoPoint()

      updateQuest(selectedQuestId, { icon })
    },
    [selectedQuestId, updateQuest]
  )

  /**
   * Handle adding a new reward to the quest
   */
  const handleAddReward = useCallback(
    (reward: Reward) => {
      if (!selectedQuestId || !quest) return

      // TODO: Push undo point when #25 is implemented
      // pushUndoPoint()

      const currentRewards = quest.rewards ?? []
      updateQuest(selectedQuestId, { rewards: [...currentRewards, reward] })
    },
    [selectedQuestId, quest, updateQuest]
  )

  /**
   * Handle updating a reward in the quest
   */
  const handleUpdateReward = useCallback(
    (rewardId: string, updates: Partial<Reward>) => {
      if (!selectedQuestId || !quest) return

      // TODO: Push undo point when #25 is implemented
      // pushUndoPoint()

      const currentRewards = quest.rewards ?? []
      const updatedRewards = currentRewards.map((reward) =>
        reward.id === rewardId ? { ...reward, ...updates } : reward
      )
      updateQuest(selectedQuestId, { rewards: updatedRewards })
    },
    [selectedQuestId, quest, updateQuest]
  )

  /**
   * Handle deleting a reward from the quest
   */
  const handleDeleteReward = useCallback(
    (rewardId: string) => {
      if (!selectedQuestId || !quest) return

      // TODO: Push undo point when #25 is implemented
      // pushUndoPoint()

      const currentRewards = quest.rewards ?? []
      const updatedRewards = currentRewards.filter((reward) => reward.id !== rewardId)
      updateQuest(selectedQuestId, { rewards: updatedRewards })
    },
    [selectedQuestId, quest, updateQuest]
  )

  // Show placeholder when no quest is selected
  if (!selectedQuestId || !quest) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">No quest selected</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4">
      {/* Quest ID for reference (readonly) */}
      <div className="mb-4 rounded-md bg-muted/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Quest ID: <span className="font-mono">{quest.id.slice(0, 8)}...</span>
        </p>
      </div>

      {/* Metadata editing form */}
      <MetadataForm quest={quest} onUpdate={handleMetadataUpdate} />

      {/* Icon selector */}
      <div className="mt-6 border-t pt-4">
        <IconSelector icon={quest.icon} onUpdate={handleIconUpdate} />
      </div>

      {/* Tasks section */}
      <div className="mt-6 border-t pt-4">
        <TasksList />
      </div>

      {/* Rewards section */}
      <div className="mt-6 border-t pt-4">
        <RewardsList
          quest={quest}
          onAddReward={handleAddReward}
          onUpdateReward={handleUpdateReward}
          onDeleteReward={handleDeleteReward}
        />
      </div>

      {/* Settings collapsible section */}
      <div className="mt-6 border-t pt-4">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="flex w-full items-center justify-between rounded-lg py-2 px-0 font-medium hover:bg-muted/50 transition-colors"
        >
          <span>Settings</span>
          <ChevronDown
            className="h-4 w-4 transition-transform"
            style={{ transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>

        {/* Settings form content */}
        {settingsOpen && (
          <div className="mt-3 space-y-3">
            <SettingsForm quest={quest} onUpdate={handleSettingsUpdate} />
          </div>
        )}
      </div>
    </div>
  )
}
