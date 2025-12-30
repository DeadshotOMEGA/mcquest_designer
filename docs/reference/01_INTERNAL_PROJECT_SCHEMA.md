# 01_INTERNAL_PROJECT_SCHEMA.md

> Split from `developer_specifications.md`.

## Purpose

Defines the **canonical internal data model** used by the platform. This schema is the _single source of truth_ and must never directly mirror SNBT.

---

## Design Principles

- Stable IDs (UUID v4) for all entities
- Version-agnostic
- UI metadata allowed but isolated
- No SNBT leakage

---

## Top-Level Snapshot Schema

```ts
ProjectSnapshot {
  metadata: ProjectMetadata
  chapters: Chapter[]
  quests: Quest[]
  dependencies: Dependency[]
  uiState: UISnapshot
}
```

---

## Metadata

```ts
ProjectMetadata {
  projectName: string
  targetMinecraftVersion: string // e.g. "1.20.1"
  targetFTBQuestsVersion: string // informational
  createdAt: ISODate
  updatedAt: ISODate
}
```

---

## Chapter

```ts
Chapter {
  id: UUID
  title: string
  description?: string
  order: number
  background?: string // reference only
  defaultQuestShape?: QuestShape
}
```

---

## Quest

```ts
Quest {
  id: UUID
  chapterId: UUID
  title: string
  subtitle?: string
  description?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  shape: QuestShape
  icon: IconReference
  tasks: Task[]
  rewards: Reward[]
  settings: QuestSettings
}
```

---

## Dependencies

```ts
Dependency {
  fromQuestId: UUID
  toQuestId: UUID
  type: 'AND' | 'OR'
}
```

---

## UI State (Non-exported)

```ts
UISnapshot {
  activeChapterId: UUID
  viewportByChapter: Record<UUID, Viewport>
  selectedQuestId?: UUID
}
```

---
