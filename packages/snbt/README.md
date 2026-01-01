# @mcquest/snbt

SNBT (Stringified NBT) parser and emitter for FTB Quests 1.21.x format.

## Features

- **Parse FTB Quests SNBT** → JavaScript objects
- **Emit JavaScript objects** → FTB-formatted SNBT
- **Convert ProjectSnapshot** ↔ FTB Quests format
- **Deterministic ID mapping** (UUID ↔ 8-char hex)
- **Round-trip metadata** preservation
- **Lang file handling** for localized text

## Installation

```bash
pnpm add @mcquest/snbt
```

## Quick Start

### Parse SNBT

```typescript
import { parseSNBT } from '@mcquest/snbt';

const chapterSnbt = `{
  filename: "getting_started"
  id: "12345678"
  order_index: 0
  icon: { id: "minecraft:book" }
  quests: [...]
}`;

const result = parseSNBT(chapterSnbt, { format: 'ftb' });

if (result.success) {
  console.log('Parsed chapter:', result.data);
} else {
  console.error('Parse error:', result.error);
}
```

### Convert to Snapshot

```typescript
import { convertToSnapshot } from '@mcquest/snbt';

const langEntries = {
  'quest.12345678.title': 'Getting Started',
  'quest.12345678.description': 'Welcome to the modpack!',
};

const result = convertToSnapshot([parsedChapter], langEntries);

if (result.success) {
  const snapshot = result.snapshot;
  console.log('Chapters:', snapshot.chapters.length);
  console.log('Quests:', snapshot.quests.length);
}
```

### Export to SNBT

```typescript
import { convertFromSnapshot, emitSNBT } from '@mcquest/snbt';

const snbtObj = convertFromSnapshot(projectSnapshot);
const snbtText = emitSNBT(snbtObj, { format: 'ftb' });

console.log(snbtText);
// {
//   filename: "getting_started"
//   id: "12345678"
//   ...
// }
```

## API Reference

### `parseSNBT(text, options?)`

Parse SNBT text to JavaScript object.

**Parameters**:
- `text: string` - SNBT text to parse
- `options?: { format?: 'ftb' | 'standard' }` - Parse options
  - `ftb` - Apply FTB Quests normalization (newline → comma)
  - `standard` - Standard SNBT format

**Returns**: `ParseResult`
```typescript
{
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}
```

### `convertToSnapshot(chapters, langEntries)`

Convert parsed SNBT chapters to ProjectSnapshot.

**Parameters**:
- `chapters: unknown[]` - Parsed chapter objects
- `langEntries: Record<string, string>` - Localization entries

**Returns**: `ConversionResult`
```typescript
{
  success: boolean;
  snapshot?: ProjectSnapshot;
  problems: ValidationProblem[];
}
```

### `convertFromSnapshot(snapshot)`

Convert ProjectSnapshot to SNBT-ready object structure.

**Parameters**:
- `snapshot: ProjectSnapshot` - Internal project data

**Returns**: `unknown` - SNBT object structure

### `emitSNBT(data, options?)`

Emit JavaScript object as SNBT text.

**Parameters**:
- `data: unknown` - Object to serialize
- `options?: { format?: 'ftb' | 'standard' }` - Emit options

**Returns**: `string` - SNBT text

### `createIDMapper(entities, options?)`

Create deterministic ID mapper for UUID ↔ hex conversion.

**Parameters**:
- `entities: Array<{ id: string; order?: number; position?: { x, y } }>` - Entities to map
- `options?: { existingMappings?: Map<string, string> }` - Preserve existing IDs

**Returns**: `IDMapper`
```typescript
{
  toHexId(uuid: string): string;     // UUID → "A1B2C3D4"
  toUUID(hexId: string): string;     // "A1B2C3D4" → UUID
  getAllMappings(): Map<string, string>;
}
```

## FTB Quests Format

### Format Differences

FTB Quests uses a **non-standard SNBT dialect**:

**Standard SNBT**:
```snbt
{ key1: value1, key2: value2, key3: value3 }
```

**FTB Quests SNBT**:
```snbt
{
  key1: value1
  key2: value2
  key3: value3
}
```

Notable differences:
- **Newline-delimited** instead of comma-separated
- **Tab indentation** for nested structures
- **Double suffix** for floats: `3.0d` instead of `3.0f`

This package handles the conversion automatically when `format: 'ftb'` is specified.

### Supported Structures

**Chapter**:
```snbt
{
  filename: "chapter_name"
  id: "7598810B"
  order_index: 0
  icon: { id: "minecraft:item_id" }
  default_hide_dependency_lines: false
  default_quest_shape: ""
  quests: [...]
  images: [...]
}
```

**Quest**:
```snbt
{
  id: "4A2123FF"
  x: 0.0d
  y: 0.0d
  shape: "default"
  icon: { id: "minecraft:diamond" }
  size: 1.0d
  optional: false
  hide_until_deps_complete: false
  tasks: [...]
  rewards: [...]
  dependencies: ["QUEST_ID"]
}
```

**Item Task**:
```snbt
{
  id: "43233783"
  type: "item"
  item: { id: "minecraft:diamond" }
  count: 10L
}
```

**Item Reward**:
```snbt
{
  id: "5F8D9A12"
  type: "item"
  item: { id: "minecraft:emerald" }
  count: 5L
}
```

## ID Mapping Algorithm

The system uses deterministic hashing to map between internal UUIDs and FTB's 8-character hex IDs.

### Mapping Process

1. **Sort entities** by deterministic order:
   ```typescript
   entities.sort((a, b) => {
     if (a.order !== b.order) return a.order - b.order;
     if (a.position.y !== b.position.y) return a.position.y - b.position.y;
     if (a.position.x !== b.position.x) return a.position.x - b.position.x;
     return a.id.localeCompare(b.id);
   });
   ```

2. **Generate hex ID** from UUID:
   ```typescript
   const hash = sha256(uuid);
   const hexId = hash.substring(0, 8).toUpperCase();
   ```

3. **Store in metadata** for round-trip:
   ```typescript
   quest.metadata = {
     ftbQuestsId: hexId,
   };
   ```

### Round-Trip Preservation

On re-import, existing IDs are preserved:

```typescript
const mapper = createIDMapper(entities, {
  existingMappings: new Map([
    ['quest-uuid-1', 'ABCDEF01'],
    ['quest-uuid-2', 'ABCDEF02'],
  ]),
});

// Returns existing mapping
mapper.toHexId('quest-uuid-1'); // → "ABCDEF01"
```

## Lang File Handling

FTB Quests stores localized text in separate `lang/*.snbt` files.

### Lang File Structure

```snbt
{
  "quest.7598810B": "The Beginning"
  "quest.7598810B.description": "Start your adventure..."
  "quest.4A2123FF": "Gather Resources"
  "task.43233783": "Collect Diamonds"
}
```

### Extracting Lang Entries

```typescript
import { parseLangFile } from '@mcquest/snbt';

const langSnbt = readFileSync('lang/en_us.snbt', 'utf-8');
const langEntries = parseLangFile(langSnbt);

console.log(langEntries['quest.7598810B']);
// → "The Beginning"
```

### Merging with Chapter Data

```typescript
const result = convertToSnapshot(chapters, langEntries);

// Quest titles populated from lang entries
result.snapshot.quests[0].title; // → "The Beginning"
```

## Performance

Based on benchmark tests:

| Operation | Small (10) | Medium (100) | Large (500) |
|-----------|------------|--------------|-------------|
| Parse     | < 10ms     | < 100ms      | < 1000ms    |
| Convert   | < 20ms     | < 200ms      | < 2000ms    |
| Emit      | < 20ms     | < 200ms      | < 2000ms    |

**Round-trip**: < 100ms for 50-quest project

## Validation

The converter validates imported data:

### Validation Rules

**Structural**:
- Required fields present (`id`, `filename`)
- Valid SNBT syntax
- Correct data types

**Semantic**:
- No circular dependencies
- All referenced quests exist
- Coordinates are numbers

### Validation Output

```typescript
{
  success: true,
  snapshot: { ... },
  problems: [
    {
      severity: 'warning',
      code: 'MISSING_LANG_ENTRY',
      message: 'Quest ABCDEF01 missing title',
      entity: { kind: 'quest', id: 'quest-uuid' }
    }
  ]
}
```

## Examples

### Complete Import Pipeline

```typescript
import {
  parseSNBT,
  parseLangFile,
  convertToSnapshot
} from '@mcquest/snbt';

// Read files
const chapterSnbt = readFileSync('chapter.snbt', 'utf-8');
const langSnbt = readFileSync('lang/en_us.snbt', 'utf-8');

// Parse SNBT
const chapterResult = parseSNBT(chapterSnbt, { format: 'ftb' });
const langEntries = parseLangFile(langSnbt);

if (chapterResult.success) {
  // Convert to snapshot
  const result = convertToSnapshot([chapterResult.data], langEntries);

  if (result.success) {
    console.log('Imported:', {
      chapters: result.snapshot.chapters.length,
      quests: result.snapshot.quests.length,
      warnings: result.problems.filter(p => p.severity === 'warning').length,
    });
  }
}
```

### Complete Export Pipeline

```typescript
import { convertFromSnapshot, emitSNBT } from '@mcquest/snbt';

// Convert snapshot to SNBT structure
const snbtObj = convertFromSnapshot(projectSnapshot);

// Emit as FTB-formatted text
const snbtText = emitSNBT(snbtObj, { format: 'ftb' });

// Write to file
writeFileSync('output/chapter.snbt', snbtText, 'utf-8');

console.log('Exported chapter with',
  projectSnapshot.quests.length,
  'quests'
);
```

### Round-Trip Verification

```typescript
// Original import
const result1 = convertToSnapshot([parsedChapter], langEntries);
const snapshot1 = result1.snapshot;

// Export
const snbtObj1 = convertFromSnapshot(snapshot1);
const exported1 = emitSNBT(snbtObj1, { format: 'ftb' });

// Re-import
const parseResult2 = parseSNBT(exported1, { format: 'ftb' });
const result2 = convertToSnapshot([parseResult2.data], langEntries);
const snapshot2 = result2.snapshot;

// Verify equivalence
console.log('Quest count matches:',
  snapshot1.quests.length === snapshot2.quests.length
);

console.log('IDs preserved:',
  snapshot1.quests.every((q1, i) =>
    q1.metadata?.ftbQuestsId === snapshot2.quests[i].metadata?.ftbQuestsId
  )
);
```

## Testing

Run tests:

```bash
pnpm test
```

Test suites:
- `parser.test.ts` - SNBT parsing
- `emitter.test.ts` - SNBT emission
- `id-mapper.test.ts` - ID mapping determinism
- `golden-import.test.ts` - Real-world import scenarios
- `performance.test.ts` - Performance benchmarks
- `round-trip.test.ts` - Import/export equivalence

## Development

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm typecheck
```

### Format

```bash
pnpm format
```

## License

See project root LICENSE file.

## See Also

- [Import/Export Workflow Guide](../../docs/guides/import-export-workflow.md)
- [Export Package](../export/README.md)
- [Schema Package](../schema/README.md)
- [FTB Quests Wiki](https://ftb.fandom.com/wiki/FTB_Quests)
