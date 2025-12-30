# 50_frontend_rules.md — Frontend (Editor) Guardrails

## 1) React Flow identity
- React Flow `node.id` equals `Quest.id` (UUID).
- React Flow `edge.id` is deterministic (e.g., `from-->to`).

## 2) State ownership
- Server state via TanStack Query.
- Editor working state via Zustand.
- Debounced autosave writes snapshots.

## 3) Undo/redo
- Snapshot-based undo/redo for v1.
- Record undo points on:
  - drag stop
  - connect/disconnect
  - inspector save

## 4) No texture loading
- Icons render as strings or small built-in set.
- Never attempt to download mod textures.
