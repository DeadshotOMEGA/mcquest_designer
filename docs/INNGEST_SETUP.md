# Inngest Background Job Setup

This document describes the Inngest integration for asynchronous import processing of large questbooks (>100 quests).

## Overview

The system uses Inngest to handle long-running import jobs in the background, preventing request timeouts and improving user experience for large questbooks.

### Architecture

```
ZIP Upload
    ↓
[zip-import endpoint]
    ↓
Extract & validate
    ↓
Count quests
    ├─ < 100 quests → Synchronous import (inline) → Return snapshot immediately
    ├─ ≥ 100 quests → Queue Inngest job → Return jobId
    ↓
[Inngest background worker]
    ├─ Phase 1: Validation
    ├─ Phase 2: Index building
    ├─ Phase 3: Entity parsing
    ├─ Phase 4: Dependency resolution
    ├─ Phase 5: Layout generation
    ├─ Phase 6: Finalization
    ↓
Store snapshot in DB
    ↓
Emit completion event
```

## Environment Setup

### 1. Inngest Account

1. Sign up at https://app.inngest.com
2. Create a new app (or use existing)
3. Go to **Settings** → **API Keys**
4. Copy the **Event Key** and add to `.env`:

```bash
INNGEST_EVENT_KEY=<your-event-key-here>
```

### 2. Webhook URL (Production)

For production deployments, configure the webhook URL in Inngest dashboard:

```bash
https://your-domain.com/api/inngest
```

Set this via environment:

```bash
INNGEST_BASE_URL=https://your-domain.com/api/inngest
```

### 3. Import Threshold

Configure when imports become asynchronous (default: 100 quests):

```bash
# .env
ASYNC_IMPORT_QUEST_THRESHOLD=100
```

## Local Development

### Start Inngest Dev Server

Run this in a separate terminal:

```bash
npx inngest-cli@latest dev
```

This starts a local Inngest worker that:
- Listens for events on port 8288
- Processes queued jobs immediately
- Provides a debug UI at http://localhost:8288

### Run Application

```bash
pnpm --filter web dev
```

The dev server will automatically connect to the local Inngest dev server.

### Test Async Imports

1. Upload a ZIP with >100 quests
2. You'll receive a response with `jobId` and status `202 Accepted`
3. Poll `/api/projects/[id]/import-status/[jobId]` to check progress
4. Watch progress updates in the Inngest dev UI

## Database Schema

### import_jobs Table

```sql
CREATE TABLE "import_jobs" (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',    -- pending | processing | completed | failed
  progress    INT DEFAULT 0,             -- 0-100
  phase       TEXT,                      -- Current phase name
  result      JSONB,                     -- ProjectSnapshot on success
  error       TEXT,                      -- Error message on failure
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP
);
```

### Relationships

- `import_jobs.project_id` → `projects.id` (CASCADE on delete)
- `import_jobs.user_id` → `users.id` (CASCADE on delete)

## API Endpoints

### POST /api/projects/[id]/zip-import

Upload a ZIP file for import.

**Request:**
```
POST /api/projects/123/zip-import
Content-Type: multipart/form-data

file: <zip-file>
```

**Response (Small Import, <100 quests):**
```json
{
  "success": true,
  "snapshot": { /* ProjectSnapshot */ },
  "problems": [],
  "stats": {
    "chapters": 5,
    "quests": 45,
    "rewardTables": 3
  },
  "metadata": {
    "filesProcessed": 8,
    "filesExtracted": 8,
    "importDuration": 234,
    "mode": "synchronous"
  },
  "versionId": "uuid-123"
}
```

Status: **200 OK**

**Response (Large Import, ≥100 quests):**
```json
{
  "success": true,
  "jobId": "job-123",
  "stats": {
    "chapters": 15,
    "quests": 250,
    "rewardTables": 12
  },
  "metadata": {
    "filesProcessed": 25,
    "filesExtracted": 25,
    "mode": "asynchronous"
  },
  "message": "Import queued as background job. Use /api/projects/[id]/import-status/[jobId] to poll status."
}
```

Status: **202 Accepted**

### GET /api/projects/[id]/import-status/[jobId]

Poll the status of an import job.

**Request:**
```
GET /api/projects/123/import-status/job-456
```

**Response:**
```json
{
  "jobId": "job-456",
  "status": "processing",           -- pending | processing | completed | failed
  "progress": 45,                   -- 0-100
  "phase": "entity-parsing",        -- Current phase
  "error": null,
  "result": null,                   -- Set when status === completed
  "createdAt": "2025-01-02T...",
  "updatedAt": "2025-01-02T..."
}
```

**On Completion:**
```json
{
  "jobId": "job-456",
  "status": "completed",
  "progress": 100,
  "phase": "finalization",
  "result": {
    "snapshot": { /* ProjectSnapshot */ }
  },
  "createdAt": "2025-01-02T...",
  "updatedAt": "2025-01-02T..."
}
```

**On Failure:**
```json
{
  "jobId": "job-456",
  "status": "failed",
  "progress": 30,
  "phase": "dependency-resolution",
  "error": "Circular dependency detected in quest chain",
  "createdAt": "2025-01-02T...",
  "updatedAt": "2025-01-02T..."
}
```

## Events

### questbook/import.requested

Triggered when an async import job is queued.

```json
{
  "name": "questbook/import.requested",
  "data": {
    "jobId": "job-123",
    "projectId": "proj-456",
    "userId": "user-789",
    "files": [
      { "path": "chapters.snbt", "content": "..." },
      { "path": "quests.snbt", "content": "..." }
    ]
  }
}
```

### questbook/import.progress

Emitted during each import phase.

```json
{
  "name": "questbook/import.progress",
  "data": {
    "jobId": "job-123",
    "phase": "entity-parsing",
    "progress": 40,
    "message": "Parsing chapter 2 of 5"
  }
}
```

### questbook/import.completed

Emitted when import finishes successfully.

```json
{
  "name": "questbook/import.completed",
  "data": {
    "jobId": "job-123",
    "projectId": "proj-456",
    "versionId": "v-789",
    "snapshot": { /* ProjectSnapshot */ }
  }
}
```

### questbook/import.failed

Emitted when import fails.

```json
{
  "name": "questbook/import.failed",
  "data": {
    "jobId": "job-123",
    "projectId": "proj-456",
    "error": "Dependency validation failed"
  }
}
```

## Import Phases

The import process is broken into distinct phases for progress tracking:

1. **validation** (0-10%)
   - ZIP structure validation
   - File extension validation
   - Basic sanity checks

2. **index-build** (10-25%)
   - Parse all SNBT files
   - Build entity index
   - Extract metadata

3. **entity-parsing** (25-40%)
   - Parse chapters and quests
   - Extract rewards and tasks
   - Map dependencies

4. **dependency-resolution** (40-60%)
   - Validate dependency graph
   - Detect cycles
   - Resolve references

5. **layout-generation** (60-75%)
   - Generate spatial coordinates
   - Position quests in graph
   - Optimize layout

6. **finalization** (75-100%)
   - Save snapshot to database
   - Update project version
   - Emit completion event

## Error Handling

### Retry Logic

Inngest automatically retries failed jobs with exponential backoff:

- **Transient errors**: Automatic retry (up to 3 attempts)
- **Validation errors**: No retry (permanent failure)

### Error Responses

The system distinguishes between:

1. **Validation Errors** (400 Bad Request)
   - Invalid ZIP structure
   - Missing required files
   - Malformed SNBT syntax
   - Not retried

2. **Processing Errors** (500 Internal Server Error)
   - Database failures
   - Memory issues
   - Dependency resolution failures
   - Automatically retried

3. **User Errors** (422 Unprocessable Entity)
   - Circular dependencies
   - Invalid quest references
   - Unsupported feature usage
   - Not retried

## Frontend Integration

### Using ImportProgress Component

```tsx
import { ImportProgress } from '@/components/import/import-progress'

export function ImportForm() {
  const [jobId, setJobId] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/projects/123/zip-import`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()

    // Async job queued
    if (res.status === 202) {
      setJobId(data.jobId)
      return
    }

    // Sync import completed
    if (res.status === 200) {
      router.refresh()
      return
    }
  }

  if (jobId) {
    return (
      <ImportProgress
        projectId="123"
        jobId={jobId}
        onComplete={() => router.refresh()}
      />
    )
  }

  return <form onSubmit={handleUpload}>...</form>
}
```

### Polling Strategy

The `ImportProgress` component implements smart polling:

- **While processing**: Poll every 1 second
- **On completion/failure**: Stop polling
- **Pause on window blur**: Resume on focus
- **Exponential backoff**: Available as option

## Monitoring

### Inngest Dashboard

Visit https://app.inngest.com to:

- View all queued and completed jobs
- Check execution logs and errors
- Replay failed jobs
- Monitor retry counts

### Logs

Import job execution is logged to:

- Application logs: `apps/web/src/lib/jobs/import-job-handler.ts`
- Inngest logs: Available in dashboard

### Metrics

Track in your observability system:

- `import.jobs.queued` — Jobs queued
- `import.jobs.completed` — Jobs completed
- `import.jobs.failed` — Jobs failed
- `import.jobs.duration` — Time from queue to completion
- `import.quests.count` — Quest count per import

## Deployment

### Production Checklist

- [ ] Set `INNGEST_EVENT_KEY` in production environment
- [ ] Configure `INNGEST_BASE_URL` with production domain
- [ ] Run `prisma migrate deploy` to create `import_jobs` table
- [ ] Test with sample large questbook
- [ ] Monitor error logs for issues
- [ ] Set up Inngest alerts for failed jobs

### Scaling Considerations

- **Timeout**: Currently set to 30 minutes per job
- **Concurrency**: Controlled by Inngest plan
- **Database**: Ensure PostgreSQL can handle concurrent imports
- **Memory**: Monitor during large (>500 quest) imports

## Troubleshooting

### Job stuck in "pending"

1. Check that Inngest worker is running: `inngest dev`
2. Verify `INNGEST_EVENT_KEY` is set correctly
3. Check Inngest dashboard for errors

### High import failure rate

1. Review error messages in Inngest dashboard
2. Check database connectivity
3. Validate ZIP file structure
4. Review import logs for specific phase failures

### Progress not updating

1. Verify polling endpoint is responding: `GET /api/projects/[id]/import-status/[jobId]`
2. Check browser console for network errors
3. Verify `jobId` matches created job

## References

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest Next.js Integration](https://www.inngest.com/docs/sdk/next)
- [Inngest Event Schema](https://www.inngest.com/docs/sdk/event-schemas)
- [FTB Quests Import Schema](../rules/10_snapshot_model.md)
