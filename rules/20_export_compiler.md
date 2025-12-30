# 20_export_compiler.md — Export Compiler Rules (1.21.x)

## 1) Compilation stages
1. Parse + validate snapshot (Zod)
2. Run semantic validation (graph rules)
3. Transform snapshot → ExportModel (version-aware)
4. Emit SNBT files (stable formatting)
5. Package ZIP with correct folder structure

## 2) Determinism requirements
- Sorting: chapters by `order`, quests by stable key, dependencies stable.
- Stable quest ordering key (recommended):
  1) chapter.order
  2) quest.position.y
  3) quest.position.x
  4) quest.id (UUID) as final tie-breaker

## 3) ID mapping
- Internal UUIDs remain internal.
- If FTB Quests uses long numeric IDs in exported SNBT, map deterministically.
- The mapping MUST be derived from sorted quests/chapters, not insertion order.

## 4) Version targeting (1.21.x)
- Keep an explicit `exportTarget` config (e.g., `MC_1_21`).
- If SNBT shape changes between minor versions, isolate in mapping functions.

## 5) Lang handling (1.21+)
- If FTB Quests expects `config/ftbquests/quests/lang/<locale>.snbt`, support emitting it.
- Treat locale as an export option (default `en_us`).

## 6) Error handling
- Export should fail fast on blocking validation errors.
- Return structured errors to the UI:
  - entity type (quest/chapter)
  - entity id
  - message
  - severity (error/warn)
