/**
 * SNBT ↔ ProjectSnapshot converter
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ProjectSnapshot,
  Chapter,
  Quest,
  Task,
  Reward,
  Dependency,
} from '@mcquest/schema';
import type { LangData } from './lang-handler.js';
import { createIDMapper } from './id-mapper.js';

export interface ImportProblem {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  entity?: {
    kind: 'quest' | 'chapter';
    id?: string;
    line?: number;
  };
  snbtLocation?: {
    file: string;
    line: number;
  };
}

export interface ConversionResult {
  success: boolean;
  snapshot: ProjectSnapshot | null;
  problems: ImportProblem[];
}

/**
 * Convert parsed SNBT data to ProjectSnapshot
 * @param snbtData Parsed SNBT object
 * @param langData Optional lang file data
 */
export function convertToSnapshot(snbtData: unknown, langData?: LangData): ConversionResult {
  const problems: ImportProblem[] = [];

  // Validate input is an object
  if (!snbtData || typeof snbtData !== 'object') {
    problems.push({
      severity: 'error',
      code: 'INVALID_INPUT',
      message: 'SNBT data must be an object',
    });
    return { success: false, snapshot: null, problems };
  }

  const data = snbtData as Record<string, unknown>;

  // Create maps for ID tracking
  const idMap = new Map<string, string>(); // hex ID -> UUID

  // Convert chapters
  const chapters: Chapter[] = [];
  const chapterHexToId = new Map<string, string>();

  const rawChapters = data.chapters;
  if (Array.isArray(rawChapters)) {
    for (let i = 0; i < rawChapters.length; i++) {
      const rawChapter = rawChapters[i];
      if (!rawChapter || typeof rawChapter !== 'object') {
        problems.push({
          severity: 'warning',
          code: 'INVALID_CHAPTER',
          message: `Chapter at index ${i} is not a valid object`,
        });
        continue;
      }

      const chapterObj = rawChapter as Record<string, unknown>;
      const chapterId = uuidv4();
      const hexId = String(chapterObj.id || '');

      if (hexId) {
        chapterHexToId.set(hexId, chapterId);
        idMap.set(hexId, chapterId);
      }

      const title =
        langData?.titles.get(hexId) || (typeof chapterObj.filename === 'string' ? chapterObj.filename : `Chapter ${i}`);

      const defaultQuestShapeValue = typeof chapterObj.default_quest_shape === 'string'
        ? (chapterObj.default_quest_shape as Chapter['defaultQuestShape'])
        : undefined;

      const chapter: Chapter = {
        id: chapterId,
        title,
        description: langData?.descriptions.get(hexId),
        order: i,
        icon: extractIcon(chapterObj.icon),
        background: typeof chapterObj.background === 'string' ? chapterObj.background : undefined,
        defaultQuestShape: defaultQuestShapeValue,
        metadata: {
          ftbQuestsId: hexId,
          images: extractImages(chapterObj.images),
          snbtMetadata: extractUnknownFields(chapterObj, [
            'id',
            'filename',
            'title',
            'description',
            'order_index',
            'icon',
            'quests',
            'quest_links',
            'images',
          ]),
        },
      };

      chapters.push(chapter);
    }
  }

  // Convert quests
  const quests: Quest[] = [];
  const questHexToId = new Map<string, string>();
  const rawQuests = data.quests;
  if (Array.isArray(rawQuests)) {
    for (let i = 0; i < rawQuests.length; i++) {
      const rawQuest = rawQuests[i];
      if (!rawQuest || typeof rawQuest !== 'object') {
        problems.push({
          severity: 'warning',
          code: 'INVALID_QUEST',
          message: `Quest at index ${i} is not a valid object`,
        });
        continue;
      }

      const questObj = rawQuest as Record<string, unknown>;
      const questId = uuidv4();
      const hexId = String(questObj.id || '');

      if (hexId) {
        questHexToId.set(hexId, questId);
        idMap.set(hexId, questId);
      }

      const title = langData?.titles.get(hexId) || `Quest ${i}`;
      const description = langData?.descriptions.get(hexId);

      // Extract position
      const x = typeof questObj.x === 'number' ? questObj.x : 0;
      const y = typeof questObj.y === 'number' ? questObj.y : 0;

      // Extract size
      const size = typeof questObj.size === 'number' ? questObj.size : 1;

      // Extract tasks
      const tasks = extractTasks(questObj.tasks);

      // Extract rewards
      const rewards = extractRewards(questObj.rewards);

      // Extract settings
      const optional = questObj.optional === true;
      const hideUntilDeps = questObj.hide_until_deps === true;

      const shapeValue = typeof questObj.shape === 'string'
        ? (questObj.shape as Quest['shape'])
        : 'square';

      const quest: Quest = {
        id: questId,
        chapterId: questId, // Will be updated after chapter parsing
        title,
        subtitle: typeof questObj.subtitle === 'string' ? questObj.subtitle : undefined,
        description,
        position: { x, y },
        size,
        shape: shapeValue,
        icon: extractIcon(questObj.icon),
        tasks,
        rewards,
        settings: {
          optional,
          hidden: 'false',
          repeatable: false,
          canRepeat: false,
          hideUntilDeps,
        },
        metadata: {
          ftbQuestsId: hexId,
          snbtMetadata: extractUnknownFields(questObj, [
            'id',
            'title',
            'subtitle',
            'description',
            'x',
            'y',
            'size',
            'shape',
            'icon',
            'tasks',
            'rewards',
            'optional',
            'hide_until_deps',
            'dependencies',
          ]),
        },
      };

      quests.push(quest);
    }
  }

  // Extract dependencies
  const dependencies: Dependency[] = [];
  for (let i = 0; i < quests.length; i++) {
    const rawQuest = Array.isArray(rawQuests) ? (rawQuests[i] as Record<string, unknown>) : null;
    if (!rawQuest) continue;

    const questId = quests[i].id;
    const rawDeps = rawQuest.dependencies;

    if (Array.isArray(rawDeps)) {
      for (const depHexId of rawDeps) {
        const depStringId = String(depHexId || '');
        const toQuestId = questHexToId.get(depStringId);

        if (toQuestId) {
          dependencies.push({
            fromQuestId: questId,
            toQuestId,
            type: 'AND',
          });
        }
      }
    }
  }

  // Assign chapter IDs to quests
  // In FTB Quests, the first chapter is typically used
  // We'll use a more sophisticated approach: group quests by proximity or use order
  if (chapters.length > 0) {
    const firstChapterId = chapters[0].id;
    for (const quest of quests) {
      quest.chapterId = firstChapterId;
    }
  }

  // Create project snapshot
  const now = new Date().toISOString();
  const projectSnapshot: ProjectSnapshot = {
    version: '0.2.0',
    metadata: {
      projectName: 'Imported FTB Quests',
      targetMinecraftVersion: '1.21.1',
      createdAt: now,
      updatedAt: now,
      importedFrom: 'snbt',
      originalFormat: {
        source: 'FTB Quests SNBT',
      },
    },
    chapters,
    quests,
    dependencies,
    uiState: {
      activeChapterId: chapters.length > 0 ? chapters[0].id : undefined,
      viewportByChapter: {},
    },
  };

  return {
    success: problems.filter((p) => p.severity === 'error').length === 0,
    snapshot: projectSnapshot,
    problems,
  };
}

/**
 * Convert ProjectSnapshot to SNBT object
 * @param snapshot ProjectSnapshot to convert
 * @returns SNBT-compatible object ready for emitter
 */
export function convertFromSnapshot(snapshot: ProjectSnapshot): unknown {

  // Build existing mappings from metadata for round-trip support
  const existingMappings = new Map<string, string>();

  for (const chapter of snapshot.chapters) {
    if (chapter.metadata?.ftbQuestsId) {
      existingMappings.set(chapter.id, chapter.metadata.ftbQuestsId);
    }
  }

  for (const quest of snapshot.quests) {
    if (quest.metadata?.ftbQuestsId) {
      existingMappings.set(quest.id, quest.metadata.ftbQuestsId);
    }
  }

  // Create ID mapper with chapters and quests
  const allEntities = [
    ...snapshot.chapters.map((c) => ({
      id: c.id,
      order: c.order,
      position: undefined,
    })),
    ...snapshot.quests.map((q) => ({
      id: q.id,
      order: undefined,
      position: q.position,
    })),
  ];

  const idMapper = createIDMapper(allEntities, { existingMappings });

  // Convert chapters
  const chapters: unknown[] = snapshot.chapters.map((chapter) => {
    const hexId = idMapper.getHexId(chapter.id);
    const chapterObj: Record<string, unknown> = {
      id: hexId,
      filename: chapter.title,
    };

    if (chapter.icon?.type === 'item') {
      chapterObj.icon = { id: chapter.icon.value };
    }

    if (chapter.background) {
      chapterObj.background = chapter.background;
    }

    if (chapter.defaultQuestShape) {
      chapterObj.default_quest_shape = chapter.defaultQuestShape;
    }

    if (chapter.description) {
      chapterObj.description = chapter.description;
    }

    // Restore unknown SNBT fields
    if (chapter.metadata?.snbtMetadata) {
      Object.assign(chapterObj, chapter.metadata.snbtMetadata);
    }

    // Restore images if present
    if (chapter.metadata?.images) {
      chapterObj.images = chapter.metadata.images;
    }

    return chapterObj;
  });

  // Convert quests
  const quests: unknown[] = snapshot.quests.map((quest) => {
    const hexId = idMapper.getHexId(quest.id);
    const questObj: Record<string, unknown> = {
      id: hexId,
      title: quest.title,
      x: quest.position.x,
      y: quest.position.y,
    };

    if (quest.subtitle) {
      questObj.subtitle = quest.subtitle;
    }

    if (quest.description) {
      questObj.description = quest.description;
    }

    if (quest.size !== 1) {
      questObj.size = quest.size;
    }

    if (quest.shape !== 'square') {
      questObj.shape = quest.shape;
    }

    if (quest.icon?.type === 'item') {
      questObj.icon = { id: quest.icon.value };
    }

    // Convert tasks
    if (quest.tasks && quest.tasks.length > 0) {
      questObj.tasks = quest.tasks.map((task) => {
        const taskObj: Record<string, unknown> = {
          type: task.type,
        };

        if (task.title) {
          taskObj.title = task.title;
        }

        if (task.count && task.count !== 1) {
          taskObj.count = task.count;
        }

        // Type-specific fields
        if (task.item) {
          taskObj.item = task.item;
        }

        if (task.advancementId) {
          taskObj.advancement = task.advancementId;
        }

        if (task.entityType) {
          taskObj.entity = task.entityType;
        }

        if (task.dimension) {
          taskObj.dimension = task.dimension;
        }

        if (task.position) {
          taskObj.x = task.position.x;
          taskObj.y = task.position.y;
        }

        if (task.range !== undefined) {
          taskObj.range = task.range;
        }

        return taskObj;
      });
    }

    // Convert rewards
    if (quest.rewards && quest.rewards.length > 0) {
      questObj.rewards = quest.rewards.map((reward) => {
        const rewardObj: Record<string, unknown> = {
          type: reward.type,
        };

        if (reward.title) {
          rewardObj.title = reward.title;
        }

        if (reward.count && reward.count !== 1) {
          rewardObj.count = reward.count;
        }

        // Type-specific fields
        if (reward.item) {
          rewardObj.item = reward.item;
        }

        if (reward.command) {
          rewardObj.command = reward.command;
        }

        if (reward.xp !== undefined) {
          rewardObj.xp = reward.xp;
        }

        if (reward.levels !== undefined) {
          rewardObj.levels = reward.levels;
        }

        if (reward.table) {
          rewardObj.table_id = reward.table;
        }

        return rewardObj;
      });
    }

    // Convert settings
    if (quest.settings.optional) {
      questObj.optional = true;
    }

    if (quest.settings.hideUntilDeps) {
      questObj.hide_until_deps = true;
    }

    // Build dependencies array
    const deps = snapshot.dependencies.filter((d) => d.fromQuestId === quest.id);
    if (deps.length > 0) {
      questObj.dependencies = deps.map((dep) => idMapper.getHexId(dep.toQuestId));
    }

    // Restore unknown SNBT fields
    if (quest.metadata?.snbtMetadata) {
      Object.assign(questObj, quest.metadata.snbtMetadata);
    }

    return questObj;
  });

  return {
    chapters,
    quests,
  };
}

// ============================================
// Helper Functions
// ============================================

function extractIcon(iconData: unknown): { type: 'item' | 'texture'; value: string } | undefined {
  if (!iconData || typeof iconData !== 'object') {
    return undefined;
  }

  const icon = iconData as Record<string, unknown>;
  const id = icon.id;

  if (!id || typeof id !== 'string') {
    return undefined;
  }

  return {
    type: 'item',
    value: id,
  };
}

interface ImageData {
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  alpha: number;
}

function extractImages(imagesData: unknown): ImageData[] | undefined {
  if (!Array.isArray(imagesData)) {
    return undefined;
  }

  const images: ImageData[] = [];
  for (const img of imagesData) {
    if (typeof img === 'object' && img !== null) {
      const imgObj = img as Record<string, unknown>;
      const image = typeof imgObj.image === 'string' ? imgObj.image : '';
      const x = typeof imgObj.x === 'number' ? imgObj.x : 0;
      const y = typeof imgObj.y === 'number' ? imgObj.y : 0;
      const width = typeof imgObj.width === 'number' ? imgObj.width : 0;
      const height = typeof imgObj.height === 'number' ? imgObj.height : 0;

      images.push({
        image,
        x,
        y,
        width,
        height,
        rotation: (typeof imgObj.rotation === 'number' ? imgObj.rotation : 0),
        alpha: (typeof imgObj.alpha === 'number' ? imgObj.alpha : 1),
      });
    }
  }

  return images.length > 0 ? images : undefined;
}

function extractTasks(tasksData: unknown): Task[] {
  const tasks: Task[] = [];

  if (!Array.isArray(tasksData)) {
    return tasks;
  }

  for (const taskData of tasksData) {
    if (!taskData || typeof taskData !== 'object') {
      continue;
    }

    const taskObj = taskData as Record<string, unknown>;
    const type = String(taskObj.type || 'item');
    const taskId = uuidv4();

    const taskType = (type as Task['type']) || 'item';

    const task: Task = {
      id: taskId,
      type: taskType,
      title: typeof taskObj.title === 'string' ? taskObj.title : undefined,
      count: typeof taskObj.count === 'number' ? Math.max(1, taskObj.count) : 1,
      item: typeof taskObj.item === 'string' ? taskObj.item : undefined,
      advancementId:
        typeof taskObj.advancement === 'string' ? taskObj.advancement : undefined,
      entityType: typeof taskObj.entity === 'string' ? taskObj.entity : undefined,
      dimension: typeof taskObj.dimension === 'string' ? taskObj.dimension : undefined,
      position: extractPosition(taskObj.x, taskObj.y),
      range: typeof taskObj.range === 'number' ? taskObj.range : undefined,
    };

    tasks.push(task);
  }

  return tasks;
}

function extractRewards(rewardsData: unknown): Reward[] {
  const rewards: Reward[] = [];

  if (!Array.isArray(rewardsData)) {
    return rewards;
  }

  for (const rewardData of rewardsData) {
    if (!rewardData || typeof rewardData !== 'object') {
      continue;
    }

    const rewardObj = rewardData as Record<string, unknown>;
    const type = String(rewardObj.type || 'item');
    const rewardId = uuidv4();

    const rewardType = (type as Reward['type']) || 'item';

    const reward: Reward = {
      id: rewardId,
      type: rewardType,
      title: typeof rewardObj.title === 'string' ? rewardObj.title : undefined,
      count: typeof rewardObj.count === 'number' ? Math.max(1, rewardObj.count) : 1,
      item: typeof rewardObj.item === 'string' ? rewardObj.item : undefined,
      command: typeof rewardObj.command === 'string' ? rewardObj.command : undefined,
      xp: typeof rewardObj.xp === 'number' ? rewardObj.xp : undefined,
      levels: typeof rewardObj.levels === 'number' ? rewardObj.levels : undefined,
      table: typeof rewardObj.table_id === 'string' ? rewardObj.table_id : undefined,
    };

    rewards.push(reward);
  }

  return rewards;
}

function extractPosition(
  x: unknown,
  y: unknown
): { x: number; y: number } | undefined {
  if (typeof x === 'number' && typeof y === 'number') {
    return { x, y };
  }
  return undefined;
}

function extractUnknownFields(
  obj: Record<string, unknown>,
  knownFields: string[]
): Record<string, unknown> {
  const unknown: Record<string, unknown> = {};
  const knownSet = new Set(knownFields);

  for (const key in obj) {
    if (!knownSet.has(key)) {
      unknown[key] = obj[key];
    }
  }

  return Object.keys(unknown).length > 0 ? unknown : {};
}
