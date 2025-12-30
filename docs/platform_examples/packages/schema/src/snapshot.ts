// packages/schema/src/snapshot.ts
// Shared Zod schemas for FE/BE. Keep these pure and free of Next.js/DB concerns.

import { z } from 'zod';

export const UUID = z.string().uuid();

export const QuestShape = z.enum(['SQUARE', 'CIRCLE', 'HEX', 'ROUNDED']);

export const IconReference = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ITEM'),
    itemId: z.string().min(1),      // e.g. "minecraft:book"
    nbt: z.string().nullable().optional(),
  }),
  z.object({
    type: z.literal('PLACEHOLDER'),
    key: z.string().min(1),         // e.g. "missing-icon"
  }),
]);

export const TaskBase = z.object({
  id: UUID,
  type: z.string().min(1),
});

export const TaskItem = TaskBase.extend({
  type: z.literal('ITEM'),
  itemId: z.string().min(1),
  count: z.number().int().positive(),
  consume: z.boolean().default(false),
});

export const TaskCheckbox = TaskBase.extend({
  type: z.literal('CHECKBOX'),
  title: z.string().min(1),
  description: z.string().default(''),
});

export const Task = z.discriminatedUnion('type', [TaskItem, TaskCheckbox]);

export const RewardBase = z.object({
  id: UUID,
  type: z.string().min(1),
});

export const RewardItem = RewardBase.extend({
  type: z.literal('ITEM'),
  itemId: z.string().min(1),
  count: z.number().int().positive(),
  nbt: z.string().nullable().optional(),
});

export const RewardXP = RewardBase.extend({
  type: z.literal('XP'),
  amount: z.number().int().nonnegative(),
});

export const RewardCommand = RewardBase.extend({
  type: z.literal('COMMAND'),
  command: z.string().min(1),
});

export const Reward = z.discriminatedUnion('type', [RewardItem, RewardXP, RewardCommand]);

export const QuestSettings = z.object({
  repeatable: z.boolean().default(false),
  hidden: z.boolean().default(false),
  optional: z.boolean().default(false),
  ignoreDependencies: z.boolean().default(false),
});

export const Quest = z.object({
  id: UUID,
  chapterId: UUID,
  title: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  shape: QuestShape,
  icon: IconReference,
  tasks: z.array(Task).default([]),
  rewards: z.array(Reward).default([]),
  settings: QuestSettings,
});

export const Chapter = z.object({
  id: UUID,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  order: z.number().int().nonnegative(),
  background: z.string().nullable().optional(),
  defaultQuestShape: QuestShape.optional(),
});

export const Dependency = z.object({
  fromQuestId: UUID,
  toQuestId: UUID,
  type: z.enum(['AND', 'OR']).default('AND'),
});

export const UISnapshot = z.object({
  activeChapterId: UUID,
  viewportByChapter: z.record(UUID, z.object({ x: z.number(), y: z.number(), zoom: z.number().positive() })),
  selectedQuestId: UUID.optional(),
});

export const ProjectMetadata = z.object({
  projectName: z.string().min(1),
  targetMinecraftVersion: z.string().min(1),
  targetFTBQuestsVersion: z.string().min(1).default('unknown'),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const ProjectSnapshot = z.object({
  metadata: ProjectMetadata,
  chapters: z.array(Chapter),
  quests: z.array(Quest),
  dependencies: z.array(Dependency).default([]),
  uiState: UISnapshot,
});

export type ProjectSnapshot = z.infer<typeof ProjectSnapshot>;
