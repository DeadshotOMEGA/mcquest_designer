'use client'

import React, { useCallback, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Quest } from '@mcquest/schema'
import { QuestFormSchema, type QuestFormData } from '@/lib/validation/quest-validation'
import { useEditorStore } from '@/lib/store/editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { QuestSettingsForm } from './quest-settings'
import { TaskEditor } from './task-editor'
import { RewardEditor } from './reward-editor'

/**
 * Props for QuestForm
 */
interface QuestFormProps {
  quest: Quest
  onSave?: (data: QuestFormData) => Promise<void>
}

/**
 * Quest Detail Form Component
 *
 * A comprehensive form-based quest editor using react-hook-form with Zod validation.
 *
 * Features:
 * - Uncontrolled inputs for performance
 * - Client-side Zod validation
 * - Task array editor (add/remove/reorder different task types)
 * - Reward array editor (add/remove/reorder different reward types)
 * - Quest settings (optional, hidden, repeatable, etc.)
 * - Icon selection
 * - Dirty state tracking
 * - Save button integration
 *
 * Fields:
 * - Basic: title, description, subtitle
 * - Settings: optional, hidden, repeatable, invisibleUntilTasks, disableJEI
 * - Tasks: array editor (add/remove/reorder different task types)
 * - Rewards: array editor (add/remove/reorder different reward types)
 * - Icon: item ID input
 *
 * Dependencies are handled separately in T7
 */
export function QuestForm({ quest, onSave }: QuestFormProps) {
  const updateQuest = useEditorStore((state) => state.updateQuest)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Use untyped form to avoid type mismatch issues with nested optional fields
  // The Zod resolver will validate the data correctly at runtime
  const form = useForm({
    resolver: zodResolver(QuestFormSchema),
    mode: 'onBlur',
    defaultValues: {
      title: quest.title,
      subtitle: quest.subtitle,
      description: quest.description,
      icon: quest.icon,
      settings: quest.settings || {
        optional: false,
        hidden: 'false',
        repeatable: false,
        canRepeat: false,
        hideUntilDeps: false,
      },
      tasks: quest.tasks || [],
      rewards: quest.rewards || [],
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid },
    control,
    reset,
    getValues,
  } = form

  const taskFieldArray = useFieldArray({
    control,
    name: 'tasks',
  })

  const rewardFieldArray = useFieldArray({
    control,
    name: 'rewards',
  })

  // Reset form when quest changes
  useEffect(() => {
    reset({
      title: quest.title,
      subtitle: quest.subtitle,
      description: quest.description,
      icon: quest.icon,
      settings: quest.settings,
      tasks: quest.tasks,
      rewards: quest.rewards,
    })
  }, [quest.id, reset])

  /**
   * Handle form submission
   * Validates data, calls onSave if provided, and updates store
   */
  const onSubmit = useCallback(
    async (formData: QuestFormData) => {
      try {
        setIsSubmitting(true)
        setSubmitError(null)

        // Call external save handler if provided
        if (onSave) {
          await onSave(formData)
        }

        // Update the editor store with type conversion
        const updates = {
          title: formData.title,
          subtitle: formData.subtitle,
          description: formData.description,
          icon: formData.icon,
          settings: formData.settings,
          tasks: (formData.tasks || []) as Quest['tasks'],
          rewards: (formData.rewards || []) as Quest['rewards'],
        }

        updateQuest(quest.id, updates)

        // Reset dirty state after successful save
        reset(getValues())
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save quest'
        setSubmitError(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [quest.id, onSave, updateQuest, reset, getValues]
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 h-full overflow-auto pb-6">
      {/* Header with Title */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-4 z-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Quest</h2>
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || !isValid}
            className="gap-2"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 space-y-6">
        {/* Basic Information Section */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Quest title"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <Label htmlFor="subtitle" className="text-sm">
                Subtitle
              </Label>
              <Input
                id="subtitle"
                placeholder="Optional subtitle"
                {...register('subtitle')}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Quest description (supports Minecraft color codes)"
                {...register('description')}
                className="min-h-24"
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <Label htmlFor="icon-value" className="text-sm">
                Icon (Item ID)
              </Label>
              <Input
                id="icon-value"
                placeholder="minecraft:book"
                {...register('icon.value')}
              />
              <p className="text-xs text-muted-foreground">
                Minecraft item ID for quest icon (e.g., minecraft:diamond)
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs for Settings, Tasks, Rewards */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">
              Tasks
              {taskFieldArray.fields.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5">
                  {taskFieldArray.fields.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rewards">
              Rewards
              {rewardFieldArray.fields.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5">
                  {rewardFieldArray.fields.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Quest Tasks</h3>
              <TaskEditor
                fieldArray={taskFieldArray}
                register={register}
                watch={watch}
              />
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Quest Rewards</h3>
              <RewardEditor
                fieldArray={rewardFieldArray}
                register={register}
                watch={watch}
              />
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Quest Settings</h3>
              <QuestSettingsForm register={register} />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dependencies Note */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <p className="text-sm">
            <span className="font-semibold">Dependencies:</span> Quest dependencies are managed separately. See the quest navigator for dependency editing.
          </p>
        </Card>
      </div>
    </form>
  )
}
