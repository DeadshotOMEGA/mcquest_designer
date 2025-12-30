# 06_SNBT_EXPORT_PIPELINE.md

> Split from `developer_specifications.md`.

## Export Steps

1. Load snapshot
2. Validate
3. Transform → ExportModel
4. Generate SNBT
5. Package ZIP

---

## Folder Structure

```
config/
  ftbquests/
    quests/
      chapters/
      quests/
```

---

## ID Strategy
- Internal UUIDs → deterministic numeric/string IDs
- Maintain mapping table during export

---
