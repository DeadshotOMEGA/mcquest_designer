# Real-Pack Diff Checklist (Minecraft 1.21.x / FTB Quests 1.21+)

This checklist is the **bridge** between your platform’s internal snapshot model and _actual_ FTB Quests files produced by Minecraft **1.21.x** versions of the mod.

The goal is simple:

- Export a tiny questbook from a real 1.21.x instance,
- Diff it against your platform’s **reference_export/**,
- Update your compiler mapping until exports match the real-world structure.

> Treat this as an onboarding playbook for the dev implementing the compiler.

---

## 0) Prereqs

- A local Minecraft **1.21.x** instance with FTB Quests installed.
- Create a new world (Creative is easiest).
- Open the quest editor in-game and make a micro questbook.

### Build a micro questbook for testing

Create _exactly_ this content so diffs are consistent:

**Chapter: Getting Started**

- Quest A: “Welcome” (Checkbox task) → Reward: Item (torches)
- Quest B: “Punch a Tree” (Item task: oak_log x16)
- Dependency: A → B

**(Optional but recommended)** add translations:

- Put a non-default title/description (so lang output is non-empty)

---

## 1) Locate the generated quest files

Look in your instance (or pack) folder:

```text
<pack>/config/ftbquests/quests/
```

In 1.21+, translations may be stored as SNBT under:

```text
<pack>/config/ftbquests/quests/lang/<locale>.snbt
```

> If the pack uses KubeJS assets for other things, that’s separate. For 1.21+ specifically, expect the quest lang SNBT in the config path above.

---

## 2) Create a “golden export” bundle

Copy the entire directory:

```text
config/ftbquests/quests/
```

Save it as:

```text
golden_export_1_21/
```

Commit this to your repo under something like:

```text
testdata/ftbq/1.21/golden_export_1_21/
```

This becomes your canonical reference for automated tests.

---

## 3) Identify all files and their roles

In your golden export folder, list:

- **Top-level files** (e.g., `data.snbt`, `chapter_group.snbt`, etc.)
- Subfolders (commonly `chapters/`, `quests/`, `reward_tables/`, `lang/`)

Create a short inventory table in your dev notes:

| Path                    | What it seems to represent | Required?   |
| ----------------------- | -------------------------- | ----------- |
| quests/chapters/\*.snbt | chapter definitions        | yes         |
| quests/quests/\*.snbt   | quest definitions          | yes         |
| quests/lang/\*.snbt     | translations (1.21+)       | depends     |
| ???                     | global settings / indices  | investigate |

**Action:** for each mysterious file, open it and write down:

- the top-level keys
- what IDs it references
- whether it looks like an index pointing at other files

---

## 4) Compare against your platform export

Your platform’s current reference export lives here:

```text
ftbq_platform_examples/reference_export/config/ftbquests/quests/
```

Do a file-level diff:

- What files exist in golden export that your platform does _not_ generate?
- What files does your platform generate that Minecraft does not?

### Expected differences (common)

- 1.21+ may include additional indices or grouping files.
- 1.21+ uses SNBT for language data under `quests/lang/*.snbt`.

---

## 5) Key-by-key schema diff (the important part)

For each real file type (chapter file, quest file, global file):

### 5.1 Chapters

Record:

- required keys
- how the chapter references quests (IDs? file names? internal lists?)
- how chapter ordering is represented

### 5.2 Quests

Record:

- how IDs are represented (numeric long? UUID? string?)
- how dependencies are represented
- how x/y and sizing is represented
- where icon is stored and how it’s encoded

### 5.3 Tasks & Rewards

For each task/reward type you support (Item, Checkbox, XP, Command):

- the key names used by real SNBT
- any nested structure (`tasks:{...}` vs `tasks:[...]`)
- whether each entry has an ID and what that ID format is

---

## 6) ID Strategy Validation

Your platform needs stable internal UUIDs.

But FTB Quests may use:

- long numeric IDs (`1L`, `2L`, ...),
- UUID strings, or
- compound identifiers.

**Action:** determine what the golden export uses.

### If the golden export uses numeric long IDs

Implement a deterministic mapping:

- Sort quests in a stable way (e.g., by chapter order, then by position, then by UUID)
- Assign incremental IDs (`1L`, `2L`, ...)
- Store mapping in memory during compilation

Add a unit test that asserts:

- same snapshot produces same IDs across runs
- reordering quests does not cause chaotic ID churn unless necessary

---

## 7) Translation / Lang Handling (1.21+)

In FTB Quests 1.21+, language text may be stored in:

```text
config/ftbquests/quests/lang/<locale>.snbt
```

**Action:** open the lang SNBT and answer:

- Does it store literal strings or translation keys?
- Does it reference quest IDs, chapter IDs, or both?
- Is it required or optional?

### Platform recommendation (v1)

- Export _literal text_ in quest files if possible.
- If 1.21 requires the lang SNBT file, export that too.

> Your platform can still keep internal snapshots in plain English text; compilation can emit either inline text or lang file content as required.

---

## 8) Automated Test Plan

Add a test suite for your compiler.

### 8.1 Snapshot → Export folder structure

- Given `examples/snapshot_v1.json`
- Generate an in-memory filesystem
- Assert paths match expected output for 1.21

### 8.2 Golden export diff tests

- Load `testdata/ftbq/1.21/golden_export_1_21/`
- Generate export from a matching snapshot
- Diff:
  - file set matches
  - key set matches for each file type
  - critical values match (IDs, dependencies, layout)

### 8.3 Determinism tests

- Run export twice
- Ensure byte-identical outputs (or normalized equivalence)

### 8.4 Backward compatibility tests (later)

- Keep additional golden exports for minor versions

---

## 9) “Done” Definition for the Compiler

The compiler is considered correct for 1.21.x when:

- A questbook exported from your platform loads in-game without regeneration or corruption
- Dependencies are preserved
- Node layout is preserved
- At least these task/reward types work:
  - Checkbox task
  - Item task
  - XP reward
  - Item reward
  - Command reward
- Optional: lang output renders correct quest titles/descriptions in UI

---

## 10) Optional: Developer Diff Commands

If you’re on macOS/Linux (or WSL):

```bash
# Tree view
find golden_export_1_21 -type f | sort

# Diff directories
diff -ru golden_export_1_21 platform_export_1_21
```

For JSON-like diffs, consider normalizing SNBT formatting before diffing (but keep a raw diff too).

---

## Appendix: Where this fits in the repo

Recommended structure:

```text
/docs
  compiler/
    15_REAL_PACK_DIFF_CHECKLIST_1_21.md
/testdata
  ftbq/
    1.21/
      golden_export_1_21/
/apps
  web/
/packages
  schema/
```
