/**
 * Cross-file reference resolution
 *
 * Resolves hexId → UUID mappings across chapters and builds
 * the final dependency graph with resolved references.
 *
 * FTB Quests stores dependencies as hex IDs in SNBT files.
 * During import, we map these to internal UUIDs.
 * This module handles the resolution of those mappings
 * across multiple parsed chapter files.
 */

import type { Chapter, Quest, Dependency } from '@mcquest/schema';
import type { ImportProblem } from './converter.js';

export interface ReferenceResolutionInput {
  chapters: Chapter[];
  quests: Quest[];
  hexIdMap: Map<string, string>;
  problems: ImportProblem[];
}

export interface ReferenceResolution {
  chapters: Chapter[];
  quests: Quest[];
  dependencies: Dependency[];
  problems: ImportProblem[];
}

/**
 * Resolve cross-file references (hexId -> UUID)
 *
 * This function:
 * 1. Validates all hex ID mappings are available
 * 2. Resolves quest dependencies from hex IDs to UUIDs
 * 3. Detects circular dependencies
 * 4. Detects orphaned dependencies (missing target)
 * 5. Validates quest-to-chapter assignment
 *
 * @param input Parsed chapters, quests, and hex ID map
 * @returns Resolved chapters, quests, dependencies, and problems
 */
export function resolveReferences(input: ReferenceResolutionInput): ReferenceResolution {
  const problems = [...input.problems];
  const chapters = [...input.chapters];
  const quests = [...input.quests];
  const hexIdMap = new Map(input.hexIdMap);

  // Build reverse map: UUID -> hex ID for cycle detection
  const uuidToHexId = new Map<string, string>();
  for (const [hexId, uuid] of hexIdMap.entries()) {
    uuidToHexId.set(uuid, hexId);
  }

  // Extract dependencies from quest metadata and convert hex IDs to UUIDs
  const dependencies: Dependency[] = [];
  const unresolvedDependencies = new Map<string, string[]>(); // questId -> list of unresolved hexIds

  for (const quest of quests) {
    // Check if quest has unresolved dependencies in metadata
    if (quest.metadata?.snbtMetadata?.dependencies) {
      const depList = quest.metadata.snbtMetadata.dependencies;

      if (Array.isArray(depList)) {
        const unresolved: string[] = [];

        for (const depHexId of depList) {
          const depHexIdStr = String(depHexId || '');
          const toQuestId = hexIdMap.get(depHexIdStr);

          if (toQuestId) {
            dependencies.push({
              fromQuestId: quest.id,
              toQuestId,
              type: 'AND',
            });
          } else {
            unresolved.push(depHexIdStr);
          }
        }

        if (unresolved.length > 0) {
          unresolvedDependencies.set(quest.id, unresolved);
        }
      }
    }
  }

  // Report unresolved dependencies
  for (const [questId, hexIds] of unresolvedDependencies.entries()) {
    const quest = quests.find((q) => q.id === questId);
    const questTitle = quest?.title || 'Unknown';

    for (const hexId of hexIds) {
      problems.push({
        severity: 'warning',
        code: 'UNRESOLVED_DEPENDENCY',
        message: `Quest "${questTitle}" has dependency on non-existent quest ${hexId}`,
        entity: {
          kind: 'quest',
          id: questId,
        },
      });
    }
  }

  // Detect circular dependencies
  const circularProblems = detectCircularDependencies(dependencies, quests);
  problems.push(...circularProblems);

  // Detect orphaned quests (quests not in any chapter)
  const orphanedProblems = detectOrphanedQuests(quests, chapters);
  problems.push(...orphanedProblems);

  // Validate references are consistent
  const refProblems = validateReferences(dependencies, quests, chapters);
  problems.push(...refProblems);

  return {
    chapters,
    quests,
    dependencies,
    problems,
  };
}

/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(dependencies: Dependency[], quests: Quest[]): ImportProblem[] {
  const problems: ImportProblem[] = [];

  // Build adjacency list
  const graph = new Map<string, string[]>();
  for (const quest of quests) {
    graph.set(quest.id, []);
  }

  for (const dep of dependencies) {
    const neighbors = graph.get(dep.fromQuestId) || [];
    neighbors.push(dep.toQuestId);
    graph.set(dep.fromQuestId, neighbors);
  }

  // DFS for cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  for (const questId of graph.keys()) {
    if (!visited.has(questId)) {
      const path: string[] = [];
      if (hasCycle(questId, graph, visited, recStack, path)) {
        cycles.push(path);
      }
    }
  }

  // Report cycles
  for (const cycle of cycles) {
    const questNames = cycle.map((id) => quests.find((q) => q.id === id)?.title || id).join(' -> ');

    problems.push({
      severity: 'error',
      code: 'CIRCULAR_DEPENDENCY',
      message: `Circular dependency detected: ${questNames}`,
      entity: {
        kind: 'quest',
        id: cycle[0],
      },
    });
  }

  return problems;
}

/**
 * DFS helper for cycle detection
 */
function hasCycle(
  node: string,
  graph: Map<string, string[]>,
  visited: Set<string>,
  recStack: Set<string>,
  path: string[]
): boolean {
  visited.add(node);
  recStack.add(node);
  path.push(node);

  const neighbors = graph.get(node) || [];

  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      if (hasCycle(neighbor, graph, visited, recStack, path)) {
        return true;
      }
    } else if (recStack.has(neighbor)) {
      // Found cycle
      return true;
    }
  }

  path.pop();
  recStack.delete(node);
  return false;
}

/**
 * Detect orphaned quests (not assigned to any chapter)
 */
function detectOrphanedQuests(quests: Quest[], chapters: Chapter[]): ImportProblem[] {
  const problems: ImportProblem[] = [];
  const validChapterIds = new Set(chapters.map((c) => c.id));

  for (const quest of quests) {
    if (!validChapterIds.has(quest.chapterId)) {
      problems.push({
        severity: 'warning',
        code: 'ORPHANED_QUEST',
        message: `Quest "${quest.title}" is not assigned to any chapter`,
        entity: {
          kind: 'quest',
          id: quest.id,
        },
      });
    }
  }

  return problems;
}

/**
 * Validate reference consistency
 */
function validateReferences(dependencies: Dependency[], quests: Quest[], chapters: Chapter[]): ImportProblem[] {
  const problems: ImportProblem[] = [];
  const validQuestIds = new Set(quests.map((q) => q.id));
  const validChapterIds = new Set(chapters.map((c) => c.id));

  // Validate dependency references
  for (const dep of dependencies) {
    if (!validQuestIds.has(dep.fromQuestId)) {
      problems.push({
        severity: 'error',
        code: 'INVALID_DEPENDENCY_SOURCE',
        message: `Dependency references non-existent source quest ${dep.fromQuestId}`,
      });
    }

    if (!validQuestIds.has(dep.toQuestId)) {
      problems.push({
        severity: 'error',
        code: 'INVALID_DEPENDENCY_TARGET',
        message: `Dependency references non-existent target quest ${dep.toQuestId}`,
      });
    }
  }

  // Validate quest-chapter assignments
  for (const quest of quests) {
    if (!validChapterIds.has(quest.chapterId)) {
      problems.push({
        severity: 'error',
        code: 'INVALID_QUEST_CHAPTER',
        message: `Quest "${quest.title}" references non-existent chapter ${quest.chapterId}`,
        entity: {
          kind: 'quest',
          id: quest.id,
        },
      });
    }
  }

  return problems;
}
