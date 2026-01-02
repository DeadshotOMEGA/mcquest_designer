'use client'

import React from 'react'
import { type UseFieldArrayReturn, type UseFormRegister, type UseFormWatch, type FieldValues, type Path, type FieldArray, type ArrayPath } from 'react-hook-form'
import type { Task, TaskType } from '@mcquest/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { v4 as uuidv4 } from 'uuid'

/**
 * Props for TaskEditor
 */
interface TaskEditorProps<T extends FieldValues> {
  fieldArray: UseFieldArrayReturn<T>
  register: UseFormRegister<T>
  watch: UseFormWatch<T>
}

const TASK_TYPES: TaskType[] = [
  'item',
  'checkmark',
  'advancement',
  'kill',
  'location',
  'observation',
  'xp',
  'stat',
]

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  item: 'Collect Item',
  checkmark: 'Manual Completion',
  advancement: 'Advancement',
  kill: 'Kill Entity',
  location: 'Visit Location',
  observation: 'Observe Block',
  xp: 'Gain XP',
  stat: 'Stat Value',
}

const TASK_TYPE_DESCRIPTIONS: Record<TaskType, string> = {
  item: 'Player must collect/craft items',
  checkmark: 'Player manually completes task',
  advancement: 'Player must achieve advancement',
  kill: 'Player must kill entities',
  location: 'Player must visit location',
  observation: 'Player must look at block',
  xp: 'Player must gain XP',
  stat: 'Player must reach stat value',
}

/**
 * Render type-specific fields for a task
 */
function TaskTypeFields<T extends FieldValues>({
  taskType,
  register,
  basePath,
}: {
  taskType: TaskType
  index?: number
  register: UseFormRegister<T>
  basePath: string
}) {
  switch (taskType) {
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
    case 'advancement':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-advancement`} className="text-xs">
            Advancement ID
          </Label>
          <Input
            id={`${basePath}-advancement`}
            placeholder="modname:path/to/advancement"
            {...register(`${basePath}.advancementId` as Path<T>)}
            className="h-8"
          />
        </div>
      )
    case 'kill':
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${basePath}-entity`} className="text-xs">
              Entity Type
            </Label>
            <Input
              id={`${basePath}-entity`}
              placeholder="minecraft:zombie"
              {...register(`${basePath}.entityType` as Path<T>)}
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
    case 'location':
      return (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${basePath}-dimension`} className="text-xs">
              Dimension
            </Label>
            <Input
              id={`${basePath}-dimension`}
              placeholder="minecraft:overworld"
              {...register(`${basePath}.dimension` as Path<T>)}
              className="h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${basePath}-x`} className="text-xs">
                X
              </Label>
              <Input
                id={`${basePath}-x`}
                type="number"
                placeholder="0"
                {...register(`${basePath}.position.x` as Path<T>, { valueAsNumber: true })}
                className="h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${basePath}-y`} className="text-xs">
                Y
              </Label>
              <Input
                id={`${basePath}-y`}
                type="number"
                placeholder="0"
                {...register(`${basePath}.position.y` as Path<T>, { valueAsNumber: true })}
                className="h-8"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${basePath}-range`} className="text-xs">
              Range (blocks)
            </Label>
            <Input
              id={`${basePath}-range`}
              type="number"
              min="1"
              placeholder="50"
              {...register(`${basePath}.range` as Path<T>, { valueAsNumber: true })}
              className="h-8"
            />
          </div>
        </>
      )
    case 'observation':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-item`} className="text-xs">
            Block ID
          </Label>
          <Input
            id={`${basePath}-item`}
            placeholder="minecraft:diamond_ore"
            {...register(`${basePath}.item` as Path<T>)}
            className="h-8"
          />
        </div>
      )
    case 'xp':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-count`} className="text-xs">
            Experience Points
          </Label>
          <Input
            id={`${basePath}-count`}
            type="number"
            min="1"
            placeholder="100"
            {...register(`${basePath}.count` as Path<T>, { valueAsNumber: true })}
            className="h-8"
          />
        </div>
      )
    case 'stat':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={`${basePath}-count`} className="text-xs">
            Stat Value
          </Label>
          <Input
            id={`${basePath}-count`}
            type="number"
            min="1"
            placeholder="1000"
            {...register(`${basePath}.count` as Path<T>, { valueAsNumber: true })}
            className="h-8"
          />
        </div>
      )
    default:
      return <p className="text-xs text-muted-foreground">No additional configuration needed</p>
  }
}

/**
 * Task Editor Component
 *
 * Array editor for quest tasks with:
 * - Add/remove tasks
 * - Type selector for each task
 * - Type-specific fields (item, advancement, location, etc.)
 * - Uncontrolled inputs via react-hook-form
 *
 * Uses uncontrolled inputs for performance with large arrays
 */
export function TaskEditor<T extends FieldValues>({
  fieldArray,
  register,
  watch,
}: TaskEditorProps<T>) {
  const tasks = watch('tasks' as Path<T>) as Task[]

  const handleAddTask = () => {
    fieldArray.append({
      id: uuidv4(),
      type: 'item',
      count: 1,
    } as FieldArray<T, ArrayPath<T>>)
  }

  return (
    <div className="space-y-3">
      {/* Tasks List */}
      {fieldArray.fields.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">No tasks added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fieldArray.fields.map((field, index) => {
            const basePath = `tasks.${index}`
            const taskType = tasks?.[index]?.type || 'item'

            return (
              <Card key={field.id} className="p-3">
                <div className="space-y-3">
                  {/* Task Type Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`${basePath}-type`} className="text-xs">
                      Task Type
                    </Label>
                    <div className="flex gap-2 items-start">
                      <select
                        {...register(`${basePath}.type` as Path<T>)}
                        className="flex-1 h-8 px-2 rounded border border-input bg-background text-sm"
                      >
                        {TASK_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {TASK_TYPE_LABELS[type]}
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
                      {TASK_TYPE_DESCRIPTIONS[taskType as TaskType]}
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
                    <TaskTypeFields
                      taskType={taskType as TaskType}
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

      {/* Add Task Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddTask}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Task
      </Button>
    </div>
  )
}
