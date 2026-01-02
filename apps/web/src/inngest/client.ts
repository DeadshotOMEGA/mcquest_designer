import { Inngest } from 'inngest'

/**
 * Event types for the import system
 */
export type QuestbookImportRequestedEvent = {
  name: 'questbook/import.requested'
  data: {
    jobId: string
    projectId: string
    userId: string
    files: Array<{ path: string; content: string }>
  }
}

export type QuestbookImportProgressEvent = {
  name: 'questbook/import.progress'
  data: {
    jobId: string
    phase: string
    progress: number // 0-100
    message: string
  }
}

export type QuestbookImportCompletedEvent = {
  name: 'questbook/import.completed'
  data: {
    jobId: string
    projectId: string
    versionId: string
    snapshot: unknown
  }
}

export type QuestbookImportFailedEvent = {
  name: 'questbook/import.failed'
  data: {
    jobId: string
    projectId: string
    error: string
  }
}

export type ImportEvents =
  | QuestbookImportRequestedEvent
  | QuestbookImportProgressEvent
  | QuestbookImportCompletedEvent
  | QuestbookImportFailedEvent

/**
 * Inngest client for mcquest-designer
 * Handles background job orchestration for import processing
 */
export const inngest = new Inngest({
  id: 'mcquest-designer',
  eventKey: process.env.INNGEST_EVENT_KEY,
  baseUrl: process.env.INNGEST_BASE_URL,
})
