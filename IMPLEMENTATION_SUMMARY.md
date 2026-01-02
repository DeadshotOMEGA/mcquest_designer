# Inngest Background Job Implementation Summary

## Task T13 Complete: Async Import Processing for Large Questbooks

### Overview

Implemented a complete asynchronous import processing system using Inngest for questbooks exceeding 100 quests, with real-time progress tracking, database persistence, and automatic retry logic.

### Files Created

#### 1. **Inngest Configuration** (`apps/web/src/inngest/`)

- **`client.ts`** - Inngest client initialization and event type definitions
  - Defines strongly-typed events: `questbook/import.requested`, `questbook/import.progress`, `questbook/import.completed`, `questbook/import.failed`
  - Configures Inngest client with environment-based event key and base URL

- **`functions.ts`** - Inngest function orchestration
  - `questbookImportJob` function that processes import jobs with automatic 3x retry logic
  - Integrates with import job handler for phase-based processing
  - Returns completion status and version ID

#### 2. **Job Execution Logic** (`apps/web/src/lib/jobs/`)

- **`import-job-handler.ts`** - Core job processing logic
  - Handles 6 import phases with progress tracking:
    1. Validation (0-10%)
    2. Index building (10-25%)
    3. Entity parsing (25-40%)
    4. Dependency resolution (40-60%)
    5. Layout generation (60-75%)
    6. Finalization (75-100%)
  - Updates job status and emits progress events to Inngest
  - Stores snapshot in database on completion
  - Proper error handling with database persistence

#### 3. **API Endpoints** (`apps/web/src/app/api/`)

- **`inngest/route.ts`** - Inngest webhook endpoint
  - Serves both POST (for event handling) and GET (for dashboard introspection)
  - Registers `questbookImportJob` function

- **`projects/[id]/zip-import/route.ts`** - Enhanced ZIP import with async routing
  - Detects quest count and routes to sync/async processing
  - **Sync path** (<100 quests): Returns snapshot immediately (200 OK)
  - **Async path** (≥100 quests): Queues job and returns jobId (202 Accepted)
  - Configurable threshold via `ASYNC_IMPORT_QUEST_THRESHOLD` environment variable
  - Functions:
    - `handleSyncImport()` - Direct import for small questbooks
    - `handleAsyncImport()` - Queues Inngest job for large imports

- **`projects/[id]/import-status/[jobId]/route.ts`** - Job status polling
  - GET endpoint to check import job progress
  - Returns status, progress percentage (0-100), current phase, and results/errors
  - Implements authorization (VIEWER+ access required)

#### 4. **Frontend Component** (`apps/web/src/components/import/`)

- **`import-progress.tsx`** - Real-time progress UI component
  - Polls job status every 1 second while processing
  - Displays progress bar, current phase, and status indicators
  - Shows completion/error states with appropriate messaging
  - Supports callbacks for `onComplete` and `onError`
  - Uses TanStack Query for automatic polling and caching

### Database Schema

#### New Table: `import_jobs`

```sql
CREATE TABLE "import_jobs" (
  id          TEXT PRIMARY KEY,           -- Job ID (CUID)
  project_id  TEXT NOT NULL,              -- FK to projects
  user_id     TEXT NOT NULL,              -- FK to users
  status      TEXT DEFAULT 'pending',     -- pending | processing | completed | failed
  progress    INT DEFAULT 0,              -- 0-100 percentage
  phase       TEXT,                       -- Current import phase
  result      JSONB,                      -- ProjectSnapshot on success
  error       TEXT,                       -- Error message on failure
  created_at  TIMESTAMP DEFAULT NOW(),    -- Job creation time
  updated_at  TIMESTAMP,                  -- Last status update
);

-- Indexes for efficient querying
CREATE INDEX import_jobs_project_id_idx ON import_jobs(project_id);
CREATE INDEX import_jobs_user_id_idx ON import_jobs(user_id);
CREATE INDEX import_jobs_status_idx ON import_jobs(status);
CREATE INDEX import_jobs_created_at_idx ON import_jobs(created_at DESC);

-- Foreign key relationships
ALTER TABLE import_jobs ADD CONSTRAINT import_jobs_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE import_jobs ADD CONSTRAINT import_jobs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

**Related Schema Updates:**
- Updated `projects` model with `import_jobs[]` relationship
- Updated `users` model with `import_jobs[]` relationship

#### Migration
- **File**: `apps/web/prisma/migrations/20260102015514_add_import_jobs/migration.sql`
- Auto-generated from Prisma schema updates
- Run with: `prisma migrate deploy`

### Environment Configuration

Added to `.env.example`:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=<your-event-key-here>
INNGEST_BASE_URL=https://your-domain.com/api/inngest  # Production only

# Import Job Configuration
ASYNC_IMPORT_QUEST_THRESHOLD=100  # Quest count threshold for async processing
```

### API Response Examples

#### Small Import (Synchronous, <100 quests)

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
**Status**: 200 OK

#### Large Import (Asynchronous, ≥100 quests)

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
**Status**: 202 Accepted

#### Job Status (GET `/api/projects/[id]/import-status/[jobId]`)

```json
{
  "jobId": "job-456",
  "status": "processing",
  "progress": 45,
  "phase": "entity-parsing",
  "result": null,
  "error": null,
  "createdAt": "2025-01-02T...",
  "updatedAt": "2025-01-02T..."
}
```

### Events Emitted

1. **questbook/import.requested** - When async job is queued
2. **questbook/import.progress** - During each phase of processing
3. **questbook/import.completed** - On successful completion
4. **questbook/import.failed** - On failure (triggers retry)

### Key Features

✅ **Async Job Queuing**: Imports >100 quests processed in background
✅ **Phase-Level Progress**: 6 distinct phases with 0-100% progress tracking
✅ **Real-Time Updates**: Events emitted for live UI polling
✅ **Automatic Retries**: Up to 3 automatic retries on transient failures
✅ **Database Persistence**: Job status stored in PostgreSQL
✅ **Authorization**: Enforces project access control on all endpoints
✅ **Error Handling**: Structured error responses with validation details
✅ **Configurable Threshold**: `ASYNC_IMPORT_QUEST_THRESHOLD` environment variable
✅ **Frontend Integration**: `ImportProgress` component for progress visualization
✅ **Deterministic Processing**: Same snapshot produces identical exports

### Workflow

```
User uploads ZIP
    ↓
[zip-import endpoint]
    ├─ Extract & validate files
    ├─ Count quests
    ├─ < 100 quests? → Sync import → Return snapshot (200)
    └─ ≥ 100 quests? → Queue async job → Return jobId (202)
         ↓
    [Inngest worker]
         ├─ Phase 1-6 processing
         ├─ Update progress in DB
         ├─ Emit events
         ↓
    [Frontend polls /api/projects/[id]/import-status/[jobId]]
         ├─ Display progress bar
         ├─ Show phase updates
         ↓
    [Completion]
         ├─ Snapshot saved to database
         ├─ Version created
         ├─ Emit completion event
```

### Testing

**Local Development:**

```bash
# Terminal 1: Start Inngest dev server
inngest dev

# Terminal 2: Start Next.js dev server
pnpm --filter web dev

# Upload a large ZIP with >100 quests
# Monitor progress in Inngest dashboard at http://localhost:8288
```

**Production Deployment:**

1. Set `INNGEST_EVENT_KEY` in environment
2. Configure `INNGEST_BASE_URL` with production domain
3. Run database migration: `prisma migrate deploy`
4. Deploy to production

### Documentation

See `/home/sauk/projects/mcquest_designer/docs/INNGEST_SETUP.md` for:
- Complete setup instructions
- Environment configuration
- API endpoint reference
- Event schemas
- Troubleshooting guide
- Monitoring and observability

### Code Quality

- ✅ Full TypeScript with strict types
- ✅ No use of `any` type
- ✅ Proper error handling with structured responses
- ✅ Authorization checks on all endpoints
- ✅ Database transactions for consistency
- ✅ Environment-based configuration
- ✅ Comprehensive JSDoc documentation

### Next Steps

1. **Apply database migration**: `pnpm --filter web prisma migrate dev`
2. **Set Inngest event key**: Add to `.env.local`
3. **Test locally**: Run with `inngest dev` in parallel
4. **Monitor in production**: Use Inngest dashboard to track jobs

### Files Changed/Created

**Created:**
- `apps/web/src/inngest/client.ts`
- `apps/web/src/inngest/functions.ts`
- `apps/web/src/lib/jobs/import-job-handler.ts`
- `apps/web/src/app/api/inngest/route.ts`
- `apps/web/src/app/api/projects/[id]/import-status/[jobId]/route.ts`
- `apps/web/src/components/import/import-progress.tsx`
- `apps/web/prisma/migrations/20260102015514_add_import_jobs/migration.sql`
- `docs/INNGEST_SETUP.md`

**Modified:**
- `apps/web/prisma/schema.prisma` - Added `import_jobs` model and relationships
- `apps/web/.env.example` - Added Inngest configuration
- `apps/web/src/app/api/projects/[id]/zip-import/route.ts` - Enhanced with async routing

**Total Lines Added**: ~1,500 LOC (implementation + documentation)
