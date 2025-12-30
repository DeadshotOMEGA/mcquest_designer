# Reference SNBT Output (Illustrative)

This folder provides a **reference export** for the example project in `10_EXAMPLES_JSON.md`.

⚠️ **Important:** FTB Quests’ real SNBT keys and exact structures can vary by Minecraft/FTB Quests version and pack conventions. Treat this as:

- a **compiler contract example**, and
- a baseline to validate your generator by comparing against exports from real modpacks.

## Folder Structure

```text
ftbq_platform_examples/reference_export/
  config/ftbquests/quests/
    chapters/
      chapter_10.snbt
chapter_11.snbt
    quests/
      quest_1.snbt
quest_2.snbt
quest_3.snbt
quest_4.snbt
quest_5.snbt
quest_6.snbt
```

## ID Mapping Used

- Chapters:
  - `Getting Started` → 10L
  - `Mining & Smelting` → 11L
- Quests:
  - `Welcome!` → 1L
  - `Punch a Tree` → 2L
  - `Crafting Table` → 3L
  - `Stone Age` → 4L
  - `Find Iron` → 5L
  - `First Smelt` → 6L

## Compiler Notes

### Dependencies

Dependencies are represented as prerequisite quest IDs (`dependencies:[...]`) on each quest file.

### Tasks/Rewards

This reference supports:

- **Item task** (`type:"item"`)
- **Checkbox task** (`type:"checkbox"`)
- **Item reward** (`type:"item"`)
- **XP reward** (`type:"xp"`)
- **Command reward** (`type:"command"`)

## Developer Instructions (How to use this)

1. Export a tiny questbook from a real instance of FTB Quests.
2. Compare which keys differ from these reference files.
3. Update your **ExportModel → SNBT** transform accordingly.
4. Add automated tests that assert your generator outputs stable ordering and stable IDs.
