# Import Review Interface Components - Usage Guide

## Quick Start

### Using the Complete Import Dialog

The `ImportDialog` component handles the entire import workflow in a single component:

```tsx
'use client'

import { useState } from 'react'
import { ImportDialog } from '@/components/import'

export function MyProjectEditor({ projectId }: { projectId: string }) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  return (
    <>
      <button onClick={() => setImportDialogOpen(true)}>
        Import Questbook
      </button>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          // Called after successful import and save
          // Snapshot is already loaded into editor store
          console.log('Import successful!')
        }}
        projectId={projectId}
      />
    </>
  )
}
```

## Individual Component APIs

### 1. ImportDialog

The main workflow component. Manages all 5 phases of import.

**Props:**
```typescript
interface ImportDialogProps {
  open: boolean                               // Dialog open/closed
  onOpenChange: (open: boolean) => void      // Close handler
  onImportComplete?: () => void               // Success callback (optional)
  projectId: string                           // For API calls
}
```

**Workflow States:**
- `upload` - File selection via UploadZone
- `processing` - Progress bar while orchestrator runs
- `review` - Error/warning display with stats
- `saving` - Database persistence
- `complete` - Success confirmation

**Features:**
- Automatic transitions between states
- Error handling at each step
- Snapshot validation before saving
- Editor store initialization on success
- Toast notifications for user feedback

---

### 2. UploadZone

Tabbed upload interface supporting both folder picker and ZIP upload.

**Props:**
```typescript
interface UploadZoneProps {
  onFilesSelected: (files: ImportFile[]) => void  // File ready callback
  onFolderError?: (error: string) => void         // Error handler (optional)
  error?: string                                   // Error message to display
  isLoading?: boolean                              // Disable during processing
}
```

**Usage:**
```tsx
import { UploadZone } from '@/components/import'

<UploadZone
  onFilesSelected={(files) => {
    console.log(`Selected ${files.length} files`)
    startImport(files)
  }}
  onFolderError={(error) => {
    console.error('Folder selection failed:', error)
  }}
  isLoading={isProcessing}
/>
```

**Tabs:**
- **Folder Picker** - Chrome/Edge only, uses File System Access API
- **ZIP Upload** - All browsers, standard file upload + drag-and-drop

---

### 3. ImportErrorsList

Displays validation errors and warnings with entity navigation.

**Props:**
```typescript
interface ImportErrorsListProps {
  errors: ImportProblem[]                                    // Error problems
  warnings: ImportProblem[]                                  // Warning problems
  onNavigateToEntity?: (entityId: string, type: 'quest' | 'chapter') => void
}
```

**Usage:**
```tsx
import { ImportErrorsList } from '@/components/import'
import { useEditorStore } from '@/lib/store/editor-store'

function ReviewErrors({ result }: { result: ImportResult }) {
  const selectEntity = useEditorStore(state => state.selectEntity)
  const toggleChapter = useEditorStore(state => state.toggleChapter)

  const errors = result.problems.filter(p => p.severity === 'error')
  const warnings = result.problems.filter(p => p.severity === 'warning')

  const handleNavigate = (entityId: string, type: 'quest' | 'chapter') => {
    selectEntity(entityId, type)

    // Expand chapter if navigating to a quest
    if (type === 'quest' && result.snapshot) {
      const quest = result.snapshot.quests.find(q => q.id === entityId)
      if (quest) {
        toggleChapter(quest.chapterId)
      }
    }
  }

  return (
    <ImportErrorsList
      errors={errors}
      warnings={warnings}
      onNavigateToEntity={handleNavigate}
    />
  )
}
```

**Features:**
- Grouped by severity (errors first)
- Collapsible sections (errors expanded by default)
- "Go To" button navigates to entity in editor
- Shows entity ID and problem code
- No-issues message when clean

---

### 4. ImportSummary

High-level statistics about the import.

**Props:**
```typescript
interface ImportSummaryProps {
  stats: ImportStats
}

interface ImportStats {
  chapters: number
  quests: number
  rewardTables: number
  errors: number
  warnings: number
}
```

**Usage:**
```tsx
import { ImportSummary } from '@/components/import'

const stats = {
  chapters: 5,
  quests: 127,
  rewardTables: 3,
  errors: 2,
  warnings: 0
}

<ImportSummary stats={stats} />
```

**Display:**
- Grid layout (responsive)
- Green checkmarks for counts
- Red error badges if present
- Yellow warning badges if present
- Summary status line

---

## Integration with Editor Store

After successful import, the `ImportDialog` automatically:

1. **Initializes the project** via `useEditorStore.initializeProject()`
   - Loads snapshot into editor state
   - Sets activeChapterId from snapshot
   - Prepares for editing

2. **Enables entity selection** via `selectEntity(entityId, type)`
   - Updates tree UI state
   - Selects entity for detail panel
   - Updates selection.selectedQuestId/selectedChapterId

3. **Allows chapter expansion** via `toggleChapter(chapterId)`
   - Expands chapter in tree UI
   - Provides context for navigation

## API Integration

The `ImportDialog` makes these API calls:

### POST `/api/projects/{projectId}/import`
**Request:**
```json
{
  "files": [
    { "path": "chapters/chapter1.snbt", "content": "..." },
    { "path": "lang/en_us.snbt", "content": "..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "snapshot": { /* ProjectSnapshot */ },
  "problems": [
    { "severity": "warning", "code": "...", "message": "..." }
  ],
  "metadata": {
    "filesProcessed": 10,
    "chaptersImported": 2,
    "questsImported": 45,
    "dependenciesResolved": 120,
    "duration": 1234
  }
}
```

### POST `/api/projects/{projectId}/save`
**Request:**
```json
{
  "snapshot": { /* ProjectSnapshot */ }
}
```

**Response:**
```json
{ "success": true, "id": "version_123" }
```

## Error Handling

### Upload Phase Errors
- Network failures
- File system access denied
- Invalid file format

### Processing Phase Errors
- Invalid SNBT syntax
- Missing required fields
- Parsing failures

### Review Phase Errors
- Validation failures (blocking)
- Warnings (non-blocking, can import anyway)

### Saving Phase Errors
- Snapshot validation failures
- Database save failures
- Transaction conflicts

## Type Safety

All components use TypeScript with proper imports from:
- `@mcquest/snbt` - ImportResult, ImportProblem, ImportFile
- `@mcquest/schema` - ProjectSnapshot, Problem
- Local store - useEditorStore hooks

```typescript
// Properly typed imports
import type { ImportResult, ImportProblem, ImportFile } from '@mcquest/snbt'
import { useEditorStore } from '@/lib/store/editor-store'
```

## Styling & Accessibility

All components:
- ✅ Use shadcn/ui components (Card, Badge, Button, Dialog, Tabs)
- ✅ Follow existing codebase styling patterns
- ✅ Support light/dark modes
- ✅ Full ARIA labels and roles
- ✅ Keyboard navigation (Enter, Tab, Escape)
- ✅ Screen reader friendly

## Testing

### Unit Tests Example
```typescript
import { render, screen } from '@testing-library/react'
import { ImportSummary } from '@/components/import'

test('displays stats correctly', () => {
  render(
    <ImportSummary
      stats={{
        chapters: 5,
        quests: 127,
        rewardTables: 3,
        errors: 0,
        warnings: 0,
      }}
    />
  )

  expect(screen.getByText('5')).toBeInTheDocument()
  expect(screen.getByText('127')).toBeInTheDocument()
})
```

### Integration Test Example
```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { ImportDialog } from '@/components/import'

test('completes import workflow', async () => {
  const onComplete = vi.fn()

  render(
    <ImportDialog
      open={true}
      onOpenChange={() => {}}
      onImportComplete={onComplete}
      projectId="proj_123"
    />
  )

  // Upload files
  const uploadInput = screen.getByRole('button', { name: /choose files/i })
  await userEvent.click(uploadInput)

  // Wait for processing
  await screen.findByText(/review/i)

  // Accept import
  const acceptBtn = screen.getByRole('button', { name: /accept/i })
  await userEvent.click(acceptBtn)

  // Verify completion
  await waitFor(() => expect(onComplete).toHaveBeenCalled())
})
```

## Performance Considerations

1. **Large Imports (>100 quests)**
   - Use async API endpoint for orchestration
   - Show progress bar during processing
   - Consider background job via Inngest (T13)

2. **Memory Usage**
   - File reading via FileReader API (streaming)
   - No full file buffering in memory
   - Snapshot loaded into store after save

3. **Network**
   - POST requests to dedicated endpoints
   - JSON serialization of large snapshots
   - Timeout handling for slow networks

## Troubleshooting

### "Cannot find module '@/components/ui/progress'"
- Progress component doesn't exist in shadcn/ui library
- Use the built-in div-based progress bar (already implemented)
- Alternative: Install @radix-ui/react-progress

### ImportDialog shows blank
- Check if `open` prop is true
- Verify `projectId` is valid
- Check browser console for API errors

### Entity navigation not working
- Ensure `snapshot.quests` has the entity ID
- Verify `selectEntity()` hook is available
- Check that editor store is initialized

### File upload fails in non-Chrome browsers
- Folder Picker is Chrome/Edge only
- Use ZIP Upload tab for other browsers
- Ensure file has .snbt extension

## Future Integration Points

1. **T13 - Background Jobs**: Replace API polling with Inngest job status
2. **Server Validation**: Add additional validation on backend before save
3. **Undo/Redo**: Implement import rollback via editor store history
4. **Bulk Operations**: Handle multiple imports in sequence
5. **Template System**: Save/load import configurations
