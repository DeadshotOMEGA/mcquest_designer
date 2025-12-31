'use client'

import React, { useCallback, useState } from 'react'
import type { Quest, Reward, RewardType } from '@mcquest/schema'
import { Plus, Trash2, Gift, Sparkles, Terminal, Layers, Dice5, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RewardItemForm } from './reward-item-form'
import { RewardXpForm } from './reward-xp-form'
import { RewardCommandForm } from './reward-command-form'
import { cn } from '@/lib/utils'

/**
 * Props for the RewardsList component
 */
interface RewardsListProps {
  /**
   * The quest containing the rewards
   */
  quest: Quest

  /**
   * Callback when a reward is added
   */
  onAddReward: (reward: Reward) => void

  /**
   * Callback when a reward is updated
   */
  onUpdateReward: (rewardId: string, updates: Partial<Reward>) => void

  /**
   * Callback when a reward is deleted
   */
  onDeleteReward: (rewardId: string) => void
}

/**
 * Reward type metadata for display and creation
 */
const REWARD_TYPE_INFO: Record<
  RewardType,
  { label: string; icon: React.ElementType; description: string }
> = {
  item: { label: 'Item', icon: Package, description: 'Give an item to the player' },
  xp: { label: 'XP', icon: Sparkles, description: 'Give experience points' },
  xp_levels: { label: 'XP Levels', icon: Sparkles, description: 'Give experience levels' },
  command: { label: 'Command', icon: Terminal, description: 'Run a command' },
  choice: { label: 'Choice', icon: Gift, description: 'Player chooses from options' },
  random: { label: 'Random', icon: Dice5, description: 'Random reward from pool' },
  loot: { label: 'Loot Table', icon: Layers, description: 'Reward from loot table' },
}

/**
 * Generate a UUID v4
 */
function generateUuid(): string {
  return crypto.randomUUID()
}

/**
 * Create a default reward of a given type
 */
function createDefaultReward(type: RewardType): Reward {
  const base = {
    id: generateUuid(),
    type,
    count: 1,
  }

  switch (type) {
    case 'item':
      return { ...base, type: 'item', item: '' }
    case 'xp':
      return { ...base, type: 'xp', xp: 100 }
    case 'xp_levels':
      return { ...base, type: 'xp_levels', levels: 1 }
    case 'command':
      return { ...base, type: 'command', command: '' }
    case 'choice':
      return { ...base, type: 'choice' }
    case 'random':
      return { ...base, type: 'random' }
    case 'loot':
      return { ...base, type: 'loot', table: '' }
    default:
      return base as Reward
  }
}

/**
 * Get the icon component for a reward type
 */
function getRewardIcon(type: RewardType): React.ElementType {
  return REWARD_TYPE_INFO[type]?.icon ?? Gift
}

/**
 * RewardsList - Component for managing quest rewards
 *
 * Features:
 * - Lists all rewards with type indicators
 * - Add reward button with type selector
 * - Inline editing for each reward type
 * - Delete reward button
 *
 * Currently supports editing: ITEM, XP, COMMAND
 * Other types (xp_levels, choice, random, loot) show placeholder
 */
export function RewardsList({
  quest,
  onAddReward,
  onUpdateReward,
  onDeleteReward,
}: RewardsListProps) {
  const [selectedType, setSelectedType] = useState<RewardType>('item')
  const [expandedRewardId, setExpandedRewardId] = useState<string | null>(null)

  /**
   * Handle adding a new reward
   */
  const handleAddReward = useCallback(() => {
    const newReward = createDefaultReward(selectedType)
    onAddReward(newReward)
    // Expand the newly added reward for editing
    setExpandedRewardId(newReward.id)
  }, [selectedType, onAddReward])

  /**
   * Toggle reward expansion for editing
   */
  const toggleRewardExpanded = useCallback((rewardId: string) => {
    setExpandedRewardId((prev) => (prev === rewardId ? null : rewardId))
  }, [])

  /**
   * Handle reward deletion with confirmation
   */
  const handleDeleteReward = useCallback(
    (rewardId: string, e: React.MouseEvent) => {
      e.stopPropagation() // Prevent expansion toggle
      onDeleteReward(rewardId)
      if (expandedRewardId === rewardId) {
        setExpandedRewardId(null)
      }
    },
    [onDeleteReward, expandedRewardId]
  )

  /**
   * Render the appropriate form for a reward type
   */
  const renderRewardForm = (reward: Reward) => {
    switch (reward.type) {
      case 'item':
        return <RewardItemForm reward={reward} onUpdate={onUpdateReward} />
      case 'xp':
        return <RewardXpForm reward={reward} onUpdate={onUpdateReward} />
      case 'command':
        return <RewardCommandForm reward={reward} onUpdate={onUpdateReward} />
      case 'xp_levels':
      case 'choice':
      case 'random':
      case 'loot':
        return (
          <div className="py-2 text-sm text-muted-foreground">
            Editing for {REWARD_TYPE_INFO[reward.type].label} rewards is not yet implemented.
          </div>
        )
      default:
        return null
    }
  }

  const rewards = quest.rewards ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Rewards ({rewards.length})</Label>
      </div>

      {/* Add reward controls */}
      <div className="flex gap-2">
        <Select value={selectedType} onValueChange={(v) => setSelectedType(v as RewardType)}>
          <SelectTrigger className="h-9 flex-1">
            <SelectValue placeholder="Select reward type" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(REWARD_TYPE_INFO) as RewardType[]).map((type) => {
              const info = REWARD_TYPE_INFO[type]
              const Icon = info.icon
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{info.label}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleAddReward} className="h-9">
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Rewards list */}
      {rewards.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">No rewards yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map((reward) => {
            const Icon = getRewardIcon(reward.type)
            const isExpanded = expandedRewardId === reward.id
            const info = REWARD_TYPE_INFO[reward.type]

            return (
              <div
                key={reward.id}
                className={cn(
                  'rounded-md border transition-colors',
                  isExpanded ? 'border-primary bg-muted/30' : 'hover:border-primary/50'
                )}
              >
                {/* Reward header - clickable to expand */}
                <div
                  className="flex cursor-pointer items-center justify-between p-3"
                  onClick={() => toggleRewardExpanded(reward.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {reward.title || info?.label || reward.type}
                      </span>
                      <span className="text-xs text-muted-foreground">{getRewardSummary(reward)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteReward(reward.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete reward</span>
                  </Button>
                </div>

                {/* Expanded form */}
                {isExpanded && (
                  <div className="border-t px-3 pb-3 pt-3">{renderRewardForm(reward)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Get a short summary of a reward for display in the list
 */
function getRewardSummary(reward: Reward): string {
  switch (reward.type) {
    case 'item':
      return reward.item
        ? `${reward.count ?? 1}x ${reward.item}`
        : 'No item specified'
    case 'xp':
      return `${reward.xp ?? 0} XP`
    case 'xp_levels':
      return `${reward.levels ?? 1} level${(reward.levels ?? 1) !== 1 ? 's' : ''}`
    case 'command':
      return reward.command
        ? reward.command.length > 30
          ? `${reward.command.slice(0, 30)}...`
          : reward.command
        : 'No command specified'
    case 'choice':
      return 'Player choice reward'
    case 'random':
      return 'Random reward from pool'
    case 'loot':
      return reward.table ?? 'No loot table specified'
    default:
      return ''
  }
}
