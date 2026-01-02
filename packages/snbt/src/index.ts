/**
 * @mcquest/snbt - SNBT parsing and conversion for FTB Quests
 *
 * This package provides bidirectional conversion between SNBT (FTB Quests format)
 * and ProjectSnapshot (internal format).
 */

// Parser
export { parseSNBT, type ParseOptions, type ParseResult } from './parser.js';

// Emitter
export { emitSNBT, type EmitOptions } from './emitter.js';

// Converter
export {
  convertToSnapshot,
  convertFromSnapshot,
  type ConversionResult,
  type ImportProblem
} from './converter.js';

// Lang handler
export { parseLangFile, type LangData } from './lang-handler.js';

// FTB adapter
export { normalizeFTBQuests } from './ftb-adapter.js';

// ID mapper
export { createIDMapper, type IDMapper } from './id-mapper.js';

// File router
export {
  routeFile,
  isChapterFile,
  isLangFile,
  isRewardTableFile,
  isGlobalConfigFile,
  extractLocale,
  extractChapterName,
  extractRewardTableName,
  type RoutedFile,
} from './file-router.js';

// Reference resolver
export {
  resolveReferences,
  type ReferenceResolution,
  type ReferenceResolutionInput,
} from './reference-resolver.js';

// Import orchestrator
export {
  orchestrateImport,
  type ImportFile,
  type ImportResult,
} from './import-orchestrator.js';
