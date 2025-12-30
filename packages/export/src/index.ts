import type { ProjectSnapshot } from '@mcquest/schema'

/**
 * Export package version - used for compatibility checks
 */
export const EXPORT_VERSION = '0.1.0'

/**
 * Supported Minecraft versions for export
 */
export const SUPPORTED_VERSIONS = ['1.21', '1.21.1'] as const
export type SupportedVersion = (typeof SUPPORTED_VERSIONS)[number]

/**
 * Export result containing SNBT files
 */
export interface ExportResult {
  files: Map<string, string>
  warnings: string[]
}

/**
 * Placeholder compiler function - will be expanded in future issues
 */
export function compileSnapshot(
  _snapshot: ProjectSnapshot,
  _version: SupportedVersion = '1.21.1'
): ExportResult {
  // Stub implementation
  return {
    files: new Map(),
    warnings: [],
  }
}
