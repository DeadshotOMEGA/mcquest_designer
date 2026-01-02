'use client'

import React from 'react'
import { type UseFieldArrayReturn, type UseFormRegister, type UseFormWatch, type FieldValues, type Path, type FieldArray, type ArrayPath } from 'react-hook-form'
import type { Reward, RewardType } from '@mcquest/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { v4 as uuidv4 } from 'uuid'

/**
 * Props for RewardEditor
 */
interface RewardEditorProps<T extends FieldValues> {
  fieldArray: UseFieldArrayReturn<T>
  register: UseFormRegister<T>
  watch: UseFormWatch<T>
}

const REWARD_TYPES: RewardType[] = ['item', 'command', 'xp', 'xp_levels', 'choice', 'random', 'loot']

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  item: 'Item',
  command: 'Command',
  xp: 'Experience',
  xp_levels: 'Experience Levels',
  choice: 'Choice',
  random: 'Random',
  loot: 'Loot Table',
}

const REWARD_TYPE_DESCRIPTIONS: Record<RewardType, string> = {
  item: 'Give player an item',
  command: 'Run a command',
  xp: 'Give experience points',
  xp_levels: 'Give experience levels',
  choice: 'Player chooses from multiple options',
  random: 'Random selection from pool',
  loot: 'Drop from loot table',
}

/**
 * Render type-specific fields for a reward
 */
function RewardTypeFields<T extends FieldValues>({
  rewardType,
  register,
  basePath,
}: {
  rewardType: RewardType
  index?: number
  register: UseFormRegister<T>
  basePath: string
}) {
  switch (rewardType) {
    case 'item':
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${basePath}-item`} className="text-xs">
              Item ID
            </Label>
            <Input
              id={`${basePath}-item`}
              placeholder="minecraft:diamond"
              {...register(`${basePath}.item` as Path<T>)}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${basePath}-count`} className="text-xs">
              Count
            </Label>
            <Input
              id={`${basePath}-count`}
              type="number"
              min="1"
              placeholder="1"
              {...register(`${basePath}.count` as Path<T>, { valueAsNumber: true })}
              className="h-8"
            />
          </div>
        </>
      )
    case 'xp':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-xp`} className="text-xs">
            Experience Points
          </Label>
          <Input
            id={`${basePath}-xp`}
            type="number"
            min="1"
            placeholder="100"
            {...register(`${basePath}.xp` as Path<T>, { valueAsNumber: true })}
            className="h-8"
          />
        </div>
      )
    case 'xp_levels':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-levels`} className="text-xs">
            Experience Levels
          </Label>
          <Input
            id={`${basePath}-levels`}
            type="number"
            min="1"
            placeholder="1"
            {...register(`${basePath}.levels` as Path<T>, { valueAsNumber: true })}
            className="h-8"
          />
        </div>
      )
    case 'command':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-command`} className="text-xs">
            Command
          </Label>
          <Textarea
            id={`${basePath}-command`}
            placeholder="say Thank you for completing this quest!"
            {...register(`${basePath}.command` as Path<T>)}
            className="min-h-20 text-xs"
          />
        </div>
      )
    case 'loot':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-table`} className="text-xs">
            Loot Table ID
          </Label>
          <Input
            id={`${basePath}-table`}
            placeholder="modname:path/to/table"
            {...register(`${basePath}.table` as Path<T>)}
            className="h-8"
          />
        </div>
      )
    default:
      return <p className="text-xs text-muted-foreground">No additional configuration needed</p>
  }
}

/**
 * Reward Editor Component
 *
 * Array editor for quest rewards with:
 * - Add/remove rewards
 * - Type selector for each reward
 * - Type-specific fields (item, command, xp, loot, etc.)
 * - Uncontrolled inputs via react-hook-form
 *
 * Uses uncontrolled inputs for performance with large arrays
 */
export function RewardEditor<T extends FieldValues>({
  fieldArray,
  register,
  watch,
}: RewardEditorProps<T>) {
  const rewards = watch('rewards' as Path<T>) as Reward[]

  const handleAddReward = () => {
    fieldArray.append({
      id: uuidv4(),
      type: 'item',
      count: 1,
    } as FieldArray<T, ArrayPath<T>>)
  }

  return (
    <div className="space-y-3">
      {/* Rewards List */}
      {fieldArray.fields.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No rewards added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fieldArray.fields.map((field, index) => {
            const basePath = `rewards.${index}`
            const rewardType = rewards?.[index]?.type || 'item'

            return (
              <Card key={field.id} className="p-3">
                <div className="space-y-3">
                  {/* Reward Type Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`${basePath}-type`} className="text-xs">
                      Reward Type
                    </Label>
                    <div className="flex gap-2 items-start">
                      <select
                        {...register(`${basePath}.type` as Path<T>)}
                        className="flex-1 h-8 px-2 rounded border border-input bg-background text-sm"
                      >
                        {REWARD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {REWARD_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => fieldArray.remove(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {REWARD_TYPE_DESCRIPTIONS[rewardType as RewardType]}
                    </p>
                  </div>

                  {/* Optional Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`${basePath}-title`} className="text-xs">
                      Title (optional)
                    </Label>
                    <Input
                      id={`${basePath}-title`}
                      placeholder="Custom display title"
                      {...register(`${basePath}.title` as Path<T>)}
                      className="h-8"
                    />
                  </div>

                  {/* Type-specific fields */}
                  <div className="space-y-2 bg-secondary/30 p-2 rounded">
                    <RewardTypeFields
                      rewardType={rewardType as RewardType}
                      index={index}
                      register={register}
                      basePath={basePath}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Reward Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddReward}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Reward
      </Button>
    </div>
  )
}
