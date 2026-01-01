import type { ProjectSnapshot } from '@mcquest/schema'
import { convertFromSnapshot, emitSNBT } from '@mcquest/snbt'

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
 * Compile a ProjectSnapshot to SNBT export format
 *
 * Converts the internal snapshot model to FTB Quests SNBT format,
 * producing the quests.snbt file that can be placed in a modpack.
 *
 * @param snapshot The project snapshot to export
 * @param _version Minecraft version (1.21, 1.21.1) - future use for version-specific handling
 * @returns Export result with files map and warnings
 */
export function compileSnapshot(
  snapshot: ProjectSnapshot,
  _version: SupportedVersion = '1.21.1'
): ExportResult {
  const warnings: string[] = []
  const files = new Map<string, string>()

  try {
    // Convert snapshot to SNBT object structure
    const snbtObj = convertFromSnapshot(snapshot)

    // Emit as FTB-formatted SNBT text
    const snbtText = emitSNBT(snbtObj, { format: 'ftb' })

    // Store as quests.snbt (FTB Quests expects this filename)
    files.set('quests.snbt', snbtText)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    warnings.push(`Export failed: ${message}`)
  }

  return {
    files,
    warnings,
  }
}
