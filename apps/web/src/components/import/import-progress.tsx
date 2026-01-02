'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Import job status
 */
interface ImportJobStatus {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  phase: string | null
  result?: {
    snapshot: unknown
  }
  error?: string
  createdAt: string
  updatedAt: string
}

/**
 * Props for ImportProgress component
 */
interface ImportProgressProps {
  projectId: string
  jobId: string
  onComplete?: (result: ImportJobStatus) => void
  onError?: (error: ImportJobStatus) => void
  children?: React.ReactNode
}

/**
 * Real-time import progress component
 *
 * Polls job status and displays:
 * - Progress bar (0-100%)
 * - Current phase
 * - Status message
 * - Error details on failure
 *
 * @example
 * ```tsx
 * <ImportProgress
 *   projectId="proj_123"
 *   jobId="job_456"
 *   onComplete={(result) => router.refresh()}
 * >
 *   <div className="mt-4">Processing...</div>
 * </ImportProgress>
 * ```
 */
export function ImportProgress({
  projectId,
  jobId,
  onComplete,
  onError,
  children,
}: ImportProgressProps) {
  const [hasCompleted, setHasCompleted] = useState(false)

  // Poll job status
  const { data: jobStatus, isLoading, error: queryError } = useQuery({
    queryKey: ['import-job-status', projectId, jobId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/import-status/${jobId}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.statusText}`)
      }

      return (await response.json()) as ImportJobStatus
    },
    refetchInterval: (query) => {
      // Stop polling when job is complete or failed
      if (query.state.data?.status === 'completed' || query.state.data?.status === 'failed') {
        return false
      }
      // Poll every 1 second while processing
      return 1000
    },
    refetchOnWindowFocus: false,
  })

  // Trigger callbacks on status change
  useEffect(() => {
    if (!jobStatus) return
    if (hasCompleted) return

    if (jobStatus.status === 'completed') {
      setHasCompleted(true)
      onComplete?.(jobStatus)
    } else if (jobStatus.status === 'failed') {
      setHasCompleted(true)
      onError?.(jobStatus)
    }
  }, [jobStatus, hasCompleted, onComplete, onError])

  // Render error state
  if (queryError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {queryError instanceof Error ? queryError.message : 'Failed to fetch job status'}
        </AlertDescription>
      </Alert>
    )
  }

  // Loading state while fetching job status
  if (isLoading || !jobStatus) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading job status...</span>
        </div>
      </div>
    )
  }

  // Determine status display
  const isFailed = jobStatus.status === 'failed'
  const isCompleted = jobStatus.status === 'completed'
  const isProcessing = jobStatus.status === 'processing'

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Import Progress</h3>
        <div className="flex items-center gap-2">
          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
          {isFailed && <AlertCircle className="h-4 w-4 text-red-600" />}
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          <span className="text-sm font-medium capitalize">{jobStatus.status}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{jobStatus.progress}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${jobStatus.progress}%` }}
            role="progressbar"
            aria-valuenow={jobStatus.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Phase and message */}
      {jobStatus.phase && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Current phase:</span> {jobStatus.phase}
        </div>
      )}

      {/* Error message */}
      {isFailed && jobStatus.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{jobStatus.error}</AlertDescription>
        </Alert>
      )}

      {/* Completion info */}
      {isCompleted && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Import completed successfully. The snapshot has been saved.
          </AlertDescription>
        </Alert>
      )}

      {/* Custom children */}
      {children && <div className="mt-4">{children}</div>}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Job ID: <code className="bg-muted px-1 rounded">{jobStatus.jobId}</code></div>
        <div>Last updated: {new Date(jobStatus.updatedAt).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}

/**
 * Provider component for import progress polling
 * Wraps multiple import operations
 */
export function ImportProgressProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
