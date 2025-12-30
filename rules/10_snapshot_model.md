# 10_snapshot_model.md — Canonical Snapshot Model Rules

## 1) Source of truth
- `ProjectSnapshot` is canonical.
- Stored as JSONB in Postgres.
- Versioned snapshots are immutable.

## 2) IDs
- All internal entity IDs are UUIDs (v4).
- React Flow `node.id` MUST equal `Quest.id`.
- Dependencies refer only to quest UUIDs.

## 3) UI-only data
- `uiState` exists for UX convenience (viewport, selection).
- `uiState` MUST NOT influence export output.

## 4) Extensibility
- Add task/reward types via discriminated unions.
- Never silently reinterpret unknown types; surface validation warnings.

## 5) Backward compatibility (future)
If schema changes:
- Prefer additive changes.
- Use explicit migrations.
- Keep older versions readable if practical.
