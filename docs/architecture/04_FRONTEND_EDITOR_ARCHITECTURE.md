# 04_FRONTEND_EDITOR_ARCHITECTURE.md

> Split from `developer_specifications.md`.

## Editor State Management

- Zustand store per open project
- Autosave debounce (1–2s)
- Undo/redo stack (snapshot-based)

---

## Graph Rendering

- React Flow
- Custom node types:
  - QuestNode
  - ChapterAnchorNode (optional)

---

## Inspector Panel

Dynamic form based on selected entity:

- Quest metadata
- Tasks
- Rewards
- Settings

---
