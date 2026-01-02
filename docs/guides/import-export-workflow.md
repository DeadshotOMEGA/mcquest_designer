# Import/Export Workflow Guide

Complete guide to importing and exporting FTB Quests questbooks using SNBT format.

## Overview

The MCQuest Designer supports bidirectional conversion between the internal ProjectSnapshot format and FTB Quests SNBT files. This enables:

1. **Import**: Load existing questbooks from Minecraft saves
2. **Edit**: Use the visual editor to modify quests, dependencies, and layout
3. **Export**: Generate SNBT files ready for modpack deployment
4. **Round-trip**: Preserve original IDs and metadata for seamless updates

## Quick Start

### Importing a Questbook

1. **Navigate to Import Page**:
   - From Editor: Click "Import" button in header
   - From Dashboard: Click "Import" on project card

2. **Upload SNBT Files**:
   - Drag and drop files into upload area
   - Or click to open file picker
   - Supports: `*.snbt` chapter files, lang files

3. **Preview Import**:
   - Review chapter and quest counts
   - Check validation warnings
   - Inspect imported structure

4. **Confirm Import**:
   - Click "Confirm Import"
   - Editor opens with imported quests

### Exporting a Questbook

1. **Trigger Export**:
   - Click "Export" button in toolbar
   - Choose export options (if available)

2. **Download Files**:
   - Receives ZIP file with:
     - `quests/chapters/*.snbt` - Quest chapters
     - `quests/lang/en_us.snbt` - Localized text (optional)
     - `quests/quests.snbt` - Main quest file

3. **Deploy to Modpack**:
   - Extract ZIP to `config/ftbquests/` in your modpack
   - Launch Minecraft and verify in-game

## File Format

### Chapter SNBT Structure

```snbt
{
  filename: "chapter_name"
  id: "12345678"
  order_index: 0
  icon: { id: "minecraft:book" }
  quests: [
    {
      id: "ABCDEF01"
      x: 0.0d
      y: 0.0d
      icon: { id: "minecraft:diamond" }
      tasks: [...]
      rewards: [...]
      dependencies: ["QUEST_ID"]
    }
  ]
}
```

### Supported Features

**Quest Properties**:
- ✅ Position (x, y coordinates)
- ✅ Icon (item IDs)
- ✅ Dependencies (quest chains)
- ✅ Tasks (item, checkmark, XP)
- ✅ Rewards (item, XP, command)
- ✅ Settings (optional, hidden, repeatable)

**Chapter Properties**:
- ✅ Title and description (via lang files)
- ✅ Order
- ✅ Icon
- ✅ Images/decorations

**Not Yet Supported**:
- ❌ Reward tables
- ❌ Quest groups
- ❌ Chapter groups
- ❌ Complex task types (dimension, advancement, etc.)

## Import Modes

### Replace Mode (Default)

Replaces all project data with imported quests:

```typescript
// Clears existing chapters and quests
// Loads all data from SNBT files
```

**Use when**:
- Starting a new project
- Completely overwriting existing work

### Merge Mode (Planned)

Adds imported quests to existing project:

```typescript
// Preserves existing chapters and quests
// Adds imported data as new chapter(s)
```

**Use when**:
- Adding questlines from another modpack
- Merging work from multiple sources

## Round-Trip Workflow

The system preserves metadata to enable seamless round-trips:

1. **Import Original SNBT**:
   ```
   FTB Quests SNBT → ProjectSnapshot
   Metadata: ftbQuestsId: "12345678"
   ```

2. **Edit in Designer**:
   ```
   - Rearrange quests
   - Modify descriptions
   - Add/remove dependencies
   ```

3. **Export Updated SNBT**:
   ```
   ProjectSnapshot → FTB Quests SNBT
   Uses stored ftbQuestsId for stability
   ```

4. **Re-import to Verify**:
   ```
   Updated SNBT → ProjectSnapshot
   IDs match, positions preserved
   ```

### Metadata Preservation

**Chapter Metadata**:
```typescript
{
  ftbQuestsId: "7598810B"  // Original FTB ID
  originalPosition: { x: 0, y: 0 }
}
```

**Quest Metadata**:
```typescript
{
  ftbQuestsId: "4A2123FF"  // Original FTB ID
  originalPosition: { x: 3.0, y: -1.5 }
}
```

## ID Mapping

Internal UUIDs are mapped to 8-character hex IDs for export:

### Deterministic Mapping

```typescript
// Sort order determines ID assignment
1. Chapter order (ascending)
2. Quest position.y (ascending)
3. Quest position.x (ascending)
4. Quest UUID (tie-breaker)

// SHA-256 hash → 8-char hex
UUID: "550e8400-e29b-41d4-a716-446655440000"
→ Hash: "A1B2C3D4..."
→ FTB ID: "A1B2C3D4"
```

### Stability Guarantees

- ✅ Same snapshot → same IDs (deterministic)
- ✅ Round-trip preserves original IDs (via metadata)
- ✅ Quest reordering updates IDs predictably

## Validation

The importer validates imported data and reports issues:

### Validation Levels

**Errors** (block import):
- Missing required fields (`id`, `filename`)
- Invalid SNBT syntax
- Circular dependencies

**Warnings** (allow import):
- Missing lang entries (uses IDs as fallback)
- Unknown task/reward types (preserved in metadata)
- Unusual position values

### Example Validation Report

```typescript
{
  success: true,
  warnings: [
    {
      severity: 'warning',
      code: 'MISSING_LANG_ENTRY',
      message: 'Quest ABCDEF01 missing title in lang file',
      entity: { kind: 'quest', id: 'quest-uuid' }
    }
  ]
}
```

## Performance Characteristics

Based on performance tests:

| Dataset Size | Parse Time | Convert Time | Export Time |
|--------------|------------|--------------|-------------|
| Small (10)   | < 10ms     | < 20ms       | < 20ms      |
| Medium (100) | < 100ms    | < 200ms      | < 200ms     |
| Large (500)  | < 1000ms   | < 2000ms     | < 2000ms    |

**Round-trip**: < 100ms for 50-quest projects

## Troubleshooting

### Import Issues

**"Parse error: Invalid SNBT syntax"**
- Check for missing braces `{}` or brackets `[]`
- Verify string quotes are properly escaped
- Ensure newlines within strings are escaped (`\n`)

**"Missing required field: id"**
- FTB chapter/quest files must have `id` field
- Check if file is corrupted or incomplete

**"Circular dependency detected"**
- Quest A depends on B, B depends on A
- Review dependency chains in-game first
- May need to manually break cycle

### Export Issues

**"Export contains no quests"**
- Verify active chapter has quests
- Check if quests are hidden/filtered

**"IDs changed after round-trip"**
- Ensure metadata preservation is enabled
- Check if quests were manually reordered
- Verify consistent sort order

### Validation Warnings

**"Unknown task type: custom_task"**
- Unsupported task types are preserved in metadata
- Will be included in export but not editable
- Consider using supported task types

## Advanced Topics

### Custom Task Types

To preserve unsupported task types:

```typescript
// Original SNBT
{
  type: "ftbquests:custom"
  data: { ... }
}

// Stored in metadata
metadata: {
  snbtMetadata: {
    taskType: "ftbquests:custom",
    taskData: { ... }
  }
}

// Restored on export
```

### Batch Import

Import multiple chapter files:

```typescript
// Upload all chapter files at once
const files = [
  'chapter-early-game.snbt',
  'chapter-mid-game.snbt',
  'chapter-end-game.snbt',
];

// System merges all chapters into single snapshot
```

### Export Filtering

Filter export by chapter or quest criteria (planned):

```typescript
{
  exportOptions: {
    chapters: ['chapter-1', 'chapter-3'],  // Only these chapters
    excludeOptional: true,                  // Skip optional quests
  }
}
```

## API Reference

### Import Functions

```typescript
/**
 * Parse SNBT files to JavaScript objects
 */
function parseSNBT(text: string, options?: {
  format?: 'ftb' | 'standard'
}): ParseResult

/**
 * Convert parsed SNBT to ProjectSnapshot
 */
function convertToSnapshot(
  chapters: unknown[],
  langEntries: Record<string, string>
): ConversionResult
```

### Export Functions

```typescript
/**
 * Convert ProjectSnapshot to SNBT structure
 */
function convertFromSnapshot(
  snapshot: ProjectSnapshot
): unknown

/**
 * Emit SNBT structure as formatted text
 */
function emitSNBT(data: unknown, options?: {
  format?: 'ftb' | 'standard'
}): string
```

## Best Practices

### Before Import

1. **Backup your work** - Import replaces existing data
2. **Verify SNBT files** - Open in text editor to check structure
3. **Check Minecraft version** - Ensure compatibility (1.21.x)

### During Edit

1. **Use auto-layout** - For consistent positioning
2. **Add descriptions** - Will be exported to lang files
3. **Test dependencies** - Verify quest chains are correct

### Before Export

1. **Validate project** - Check for errors in inspector
2. **Review layout** - Positions transfer to in-game coordinates
3. **Test in creative mode** - Verify quests work in-game

### After Export

1. **Backup modpack** - Before replacing quest files
2. **Test in dev environment** - Before production deployment
3. **Verify in-game** - Open quest book and check all quests

## Examples

### Complete Workflow Example

```bash
# 1. Export from existing modpack
cp -r ~/minecraft/config/ftbquests/quests ./backup-quests

# 2. Import to designer
# - Upload chapter files from backup-quests/chapters/
# - Upload lang file from backup-quests/lang/en_us.snbt

# 3. Edit in designer
# - Rearrange quests with auto-layout
# - Add new questline
# - Update descriptions

# 4. Export updated questbook
# - Click Export button
# - Download mcquest-export.zip

# 5. Deploy to modpack
unzip mcquest-export.zip -d ~/minecraft/config/ftbquests/
# Launch Minecraft and verify
```

### Programmatic Import

```typescript
import { parseSNBT, convertToSnapshot } from '@mcquest/snbt';

// Read chapter file
const chapterSnbt = readFileSync('chapter.snbt', 'utf-8');

// Parse SNBT
const parseResult = parseSNBT(chapterSnbt, { format: 'ftb' });

if (parseResult.success) {
  // Convert to snapshot
  const result = convertToSnapshot([parseResult.data], {});

  if (result.success) {
    console.log('Imported chapters:', result.snapshot.chapters.length);
    console.log('Imported quests:', result.snapshot.quests.length);
  }
}
```

## See Also

- [SNBT Package README](../../packages/snbt/README.md)
- [Export Package README](../../packages/export/README.md)
- [Schema Documentation](../../packages/schema/README.md)
- [FTB Quests Wiki](https://ftb.fandom.com/wiki/FTB_Quests)
