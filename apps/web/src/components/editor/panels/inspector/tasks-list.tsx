'use client'

import React, { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Task, TaskType } from '@mcquest/schema'
import { useEditorStore, useSelectedQuestId, useQuest } from '@/lib/store/editor-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { TaskItemForm } from './task-item-form'
import { TaskCheckboxForm } from './task-checkbox-form'
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Package,
  CheckSquare,
  Trophy,
  Skull,
  MapPin,
  Eye,
  Sparkles,
  BarChart3,
  Pencil,
} from 'lucide-react'

/**
 * Human-readable labels for task types
 */
const TASK_TYPE_LABELS: Record<TaskType, string> = {
  item: 'Item',
  checkmark: 'Checkmark',
  advancement: 'Advancement',
  kill: 'Kill',
  location: 'Location',
  observation: 'Observation',
  xp: 'XP',
  stat: 'Stat',
}

/**
 * Icons for task types
 */
const TASK_TYPE_ICONS: Record<TaskType, React.ReactNode> = {
  item: <Package className="h-3 w-3" />,
  checkmark: <CheckSquare className="h-3 w-3" />,
  advancement: <Trophy className="h-3 w-3" />,
  kill: <Skull className="h-3 w-3" />,
  location: <MapPin className="h-3 w-3" />,
  observation: <Eye className="h-3 w-3" />,
  xp: <Sparkles className="h-3 w-3" />,
  stat: <BarChart3 className="h-3 w-3" />,
}

/**
 * Create a new task with default values based on type
 */
function createTask(type: TaskType): Task {
  const baseTask: Task = {
    id: uuidv4(),
    type,
    count: 1,
  }

  switch (type) {
    case 'item':
      return { ...baseTask, item: '' }
    case 'checkmark':
      return { ...baseTask, title: 'Click to complete' }
    case 'advancement':
      return { ...baseTask, advancementId: '' }
    case 'kill':
      return { ...baseTask, entityType: '' }
    case 'location':
      return { ...baseTask, dimension: 'minecraft:overworld' }
    default:
      return baseTask
  }
}

/**
 * Get a display name for a task
 */
function getTaskDisplayName(task: Task): string {
  if (task.title) return task.title
  if (task.item) return task.item
  if (task.advancementId) return task.advancementId
  if (task.entityType) return task.entityType
  return TASK_TYPE_LABELS[task.type]
}

/**
 * TasksList - Component for managing quest tasks
 *
 * Features:
 * - Lists all tasks with type indicators
 * - Add task button with type selector
 * - Edit inline or in modal
 * - Delete task button
 * - Reorder tasks (up/down buttons)
 *
 * Currently supports editing forms for:
 * - ITEM tasks
 * - CHECKMARK tasks
 *
 * Other task types show a placeholder form.
 */
export function TasksList() {
  const selectedQuestId = useSelectedQuestId()
  const quest = useQuest(selectedQuestId ?? '')
  const updateQuest = useEditorStore((state) => state.updateQuest)
  const pushUndoPoint = useEditorStore((state) => state.pushUndoPoint)

  // State for add task dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTaskType, setNewTaskType] = useState<TaskType>('item')

  // State for edit task dialog
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const editingTask = quest?.tasks.find((t) => t.id === editingTaskId)

  /**
   * Update the tasks array on the quest
   */
  const updateTasks = useCallback(
    (newTasks: Task[]) => {
      if (!selectedQuestId) return
      updateQuest(selectedQuestId, { tasks: newTasks })
    },
    [selectedQuestId, updateQuest]
  )

  /**
   * Add a new task
   */
  const handleAddTask = useCallback(() => {
    if (!quest) return
    pushUndoPoint()
    const newTask = createTask(newTaskType)
    updateTasks([...quest.tasks, newTask])
    setIsAddDialogOpen(false)
    // Open the edit dialog for the new task
    setEditingTaskId(newTask.id)
  }, [quest, newTaskType, pushUndoPoint, updateTasks])

  /**
   * Delete a task
   */
  const handleDeleteTask = useCallback(
    (taskId: string) => {
      if (!quest) return
      pushUndoPoint()
      updateTasks(quest.tasks.filter((t) => t.id !== taskId))
    },
    [quest, pushUndoPoint, updateTasks]
  )

  /**
   * Move a task up in the list
   */
  const handleMoveUp = useCallback(
    (taskId: string) => {
      if (!quest) return
      const index = quest.tasks.findIndex((t) => t.id === taskId)
      if (index <= 0) return

      pushUndoPoint()
      const newTasks = [...quest.tasks]
      ;[newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]]
      updateTasks(newTasks)
    },
    [quest, pushUndoPoint, updateTasks]
  )

  /**
   * Move a task down in the list
   */
  const handleMoveDown = useCallback(
    (taskId: string) => {
      if (!quest) return
      const index = quest.tasks.findIndex((t) => t.id === taskId)
      if (index < 0 || index >= quest.tasks.length - 1) return

      pushUndoPoint()
      const newTasks = [...quest.tasks]
      ;[newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]]
      updateTasks(newTasks)
    },
    [quest, pushUndoPoint, updateTasks]
  )

  /**
   * Update a specific task
   */
  const handleUpdateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      if (!quest) return
      const newTasks = quest.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      updateTasks(newTasks)
    },
    [quest, updateTasks]
  )

  /**
   * Render the form for editing a task based on its type
   */
  const renderTaskForm = (task: Task) => {
    switch (task.type) {
      case 'item':
        return (
          <TaskItemForm task={task} onUpdate={(updates) => handleUpdateTask(task.id, updates)} />
        )
      case 'checkmark':
        return (
          <TaskCheckboxForm
            task={task}
            onUpdate={(updates) => handleUpdateTask(task.id, updates)}
          />
        )
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Editing for {TASK_TYPE_LABELS[task.type]} tasks is not yet implemented.
          </div>
        )
    }
  }

  // Don't render if no quest is selected
  if (!quest) {
    return null
  }

  const tasks = quest.tasks

  return (
    <div className="space-y-3">
      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Tasks ({tasks.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {/* Tasks list */}
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No tasks. Add a task to get started.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm"
            >
              {/* Task type badge */}
              <Badge variant="secondary" className="shrink-0 gap-1">
                {TASK_TYPE_ICONS[task.type]}
                {TASK_TYPE_LABELS[task.type]}
              </Badge>

              {/* Task name */}
              <span className="flex-1 truncate text-muted-foreground">
                {getTaskDisplayName(task)}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                {/* Edit button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditingTaskId(task.id)}
                  title="Edit task"
                >
                  <Pencil className="h-3 w-3" />
                </Button>

                {/* Move up */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveUp(task.id)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>

                {/* Move down */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMoveDown(task.id)}
                  disabled={index === tasks.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>Select the type of task to add to this quest.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Type</label>
              <Select value={newTaskType} onValueChange={(value) => setNewTaskType(value as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.item}
                      Item - Collect or craft items
                    </span>
                  </SelectItem>
                  <SelectItem value="checkmark">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.checkmark}
                      Checkmark - Manual completion
                    </span>
                  </SelectItem>
                  <SelectItem value="advancement">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.advancement}
                      Advancement - Achieve advancement
                    </span>
                  </SelectItem>
                  <SelectItem value="kill">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.kill}
                      Kill - Kill entities
                    </span>
                  </SelectItem>
                  <SelectItem value="location">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.location}
                      Location - Visit location
                    </span>
                  </SelectItem>
                  <SelectItem value="observation">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.observation}
                      Observation - Look at block
                    </span>
                  </SelectItem>
                  <SelectItem value="xp">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.xp}
                      XP - Gain experience
                    </span>
                  </SelectItem>
                  <SelectItem value="stat">
                    <span className="flex items-center gap-2">
                      {TASK_TYPE_ICONS.stat}
                      Stat - Reach stat value
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>Add Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTaskId} onOpenChange={(open) => !open && setEditingTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {editingTask ? TASK_TYPE_LABELS[editingTask.type] : ''} Task
            </DialogTitle>
            <DialogDescription>
              Configure the task settings below.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">{editingTask && renderTaskForm(editingTask)}</div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setEditingTaskId(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
