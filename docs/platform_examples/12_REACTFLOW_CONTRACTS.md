# React Flow Contracts (Node + Edge Rendering)

This document defines the **contracts** between:

- the platform's internal snapshot model, and
- the graph-rendering layer (React Flow)

The goal: developers can build the canvas without caring about SNBT, and without coupling UI state to backend persistence.

---

## 1) Mapping Overview

### Source of truth

- `ProjectSnapshot.quests[]` and `ProjectSnapshot.dependencies[]`

### Rendered entities

- React Flow `nodes[]` and `edges[]`

### Key rule

> React Flow `node.id` MUST equal the internal `Quest.id` (UUID), so selection and updates are stable.

---

## 2) Node Types

### 2.1 Quest Node

```ts
export type NodeType = 'quest'

export interface QuestNodeData {
  questId: string // UUID (matches node.id)
  chapterId: string // UUID
  title: string
  subtitle?: string
  icon: IconReference
  shape: QuestShape
  size: { width: number; height: number }
  flags: {
    optional: boolean
    hidden: boolean
    repeatable: boolean
  }
  validation?: {
    level: 'error' | 'warning'
    messages: string[]
  }
}
```

React Flow node example:

```ts
import type { Node } from '@xyflow/react'

export type QuestFlowNode = Node<QuestNodeData, 'quest'>

const node: QuestFlowNode = {
  id: quest.id,
  type: 'quest',
  position: { x: quest.position.x, y: quest.position.y },
  data: {
    questId: quest.id,
    chapterId: quest.chapterId,
    title: quest.title,
    subtitle: quest.subtitle ?? undefined,
    icon: quest.icon,
    shape: quest.shape,
    size: quest.size,
    flags: {
      optional: quest.settings.optional,
      hidden: quest.settings.hidden,
      repeatable: quest.settings.repeatable,
    },
  },
}
```

---

## 3) Edge Types

### 3.1 Dependency Edge

```ts
export type EdgeType = 'dependency'

export interface DependencyEdgeData {
  fromQuestId: string
  toQuestId: string
  depType: 'AND' | 'OR'
  validation?: {
    level: 'error' | 'warning'
    messages: string[]
  }
}
```

React Flow edge example:

```ts
import type { Edge } from '@xyflow/react'

export type DependencyFlowEdge = Edge<DependencyEdgeData, 'dependency'>

const edge: DependencyFlowEdge = {
  id: `${dep.fromQuestId}-->${dep.toQuestId}`,
  type: 'dependency',
  source: dep.fromQuestId,
  target: dep.toQuestId,
  data: {
    fromQuestId: dep.fromQuestId,
    toQuestId: dep.toQuestId,
    depType: dep.type,
  },
}
```

---

## 4) Grid & Snapping

### Recommended settings

- `snapToGrid: true`
- `snapGrid: [16, 16]` (or 8/24 based on your visual scale)

### Internal units

Store quest positions in the **same units** as React Flow to prevent rounding drift.

---

## 5) Selection & Inspector

### Selection flow

1. React Flow selection changes → set `uiState.selectedQuestId`
2. Inspector panel reads selected quest from snapshot via ID

### Editing flow (single quest)

1. User edits form → update snapshot quest
2. Update React Flow node `data` and `position`
3. Debounced autosave writes snapshot to backend

---

## 6) Undo/Redo Strategy

### Recommended

Snapshot-based undo/redo. Push a snapshot on:

- node drag stop
- edge connect/disconnect
- inspector save action

---

## 7) Multi-Chapter Canvas

Recommended v1 approach:

- Render only nodes/edges for the **active chapter**
- Cross-chapter dependencies are allowed but not rendered on-canvas (show in inspector)

---

## 8) Rendering Notes

- Icon rendering: show the item ID string or map common vanilla IDs to a small built-in icon set.
- Do not attempt to load mod textures; this is out of scope by design.
