/**
 * Deterministic UUID → hex ID mapping for FTB Quests export
 *
 * FTB Quests uses 8-character hex IDs (e.g., "2B3C4D5E") for quest and chapter
 * identification in the export format. This module provides deterministic mapping
 * from internal UUIDs to these hex IDs, ensuring:
 *
 * 1. Same snapshot → same hex IDs (byte-identical exports)
 * 2. No collisions across 10,000+ entities
 * 3. Preservation of existing IDs for round-trip compatibility
 *
 * The algorithm sorts entities by a stable key and assigns hex IDs based on
 * position in the sorted list, combined with a CRC-32 hash for uniqueness.
 */

import { createHash } from 'crypto';

export interface IDMapper {
  /** Get hex ID for a UUID, creating if needed */
  getHexId(uuid: string): string;

  /** Get UUID for a hex ID (reverse lookup) */
  getUuid(hexId: string): string | undefined;

  /** Get all mappings */
  getMappings(): Map<string, string>;
}

export interface IDMapperOptions {
  /** Seed for deterministic ID generation */
  seed?: string;

  /** Existing mappings to preserve (for round-trip) */
  existingMappings?: Map<string, string>;
}

interface Entity {
  id: string;
  order?: number;
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Create a deterministic ID mapper for a set of entities.
 *
 * Algorithm:
 * 1. Sort entities by stable key: (order, position.y, position.x, id)
 * 2. Preserve any existing mappings (for round-trip imports)
 * 3. Generate new hex IDs using index + CRC-32 hash for uniqueness
 * 4. Ensure no collisions
 *
 * @param entities Quest/chapter objects to map
 * @param options Configuration for ID generation
 * @returns IDMapper instance with all mappings
 */
export function createIDMapper(entities: Entity[], options?: IDMapperOptions): IDMapper {
  const uuidToHex = new Map<string, string>();
  const hexToUuid = new Map<string, string>();

  // Restore existing mappings if provided
  if (options?.existingMappings) {
    for (const [uuid, hexId] of options.existingMappings) {
      uuidToHex.set(uuid, hexId);
      hexToUuid.set(hexId, uuid);
    }
  }

  // Sort entities by stable key
  const sortedEntities = sortEntitiesDeterministically(entities);

  // Generate hex IDs for unmapped entities
  const usedHexIds = new Set(uuidToHex.values());

  for (let index = 0; index < sortedEntities.length; index++) {
    const entity = sortedEntities[index];

    // Skip if already mapped
    if (uuidToHex.has(entity.id)) {
      continue;
    }

    // Generate a deterministic hex ID based on index and hash
    const hexId = generateDeterministicHexId(entity.id, index, options?.seed);

    // Ensure no collision
    let finalHexId = hexId;
    let collisionCounter = 0;

    while (usedHexIds.has(finalHexId) && collisionCounter < 1000) {
      // If collision, increment the counter and regenerate
      collisionCounter++;
      finalHexId = generateDeterministicHexIdWithCounter(
        entity.id,
        index,
        collisionCounter,
        options?.seed
      );
    }

    if (collisionCounter >= 1000) {
      throw new Error(
        `Failed to generate unique hex ID for entity ${entity.id} after 1000 attempts`
      );
    }

    uuidToHex.set(entity.id, finalHexId);
    hexToUuid.set(finalHexId, entity.id);
    usedHexIds.add(finalHexId);
  }

  return {
    getHexId: (uuid: string): string => {
      const hexId = uuidToHex.get(uuid);
      if (!hexId) {
        throw new Error(`No hex ID mapping found for UUID: ${uuid}`);
      }
      return hexId;
    },

    getUuid: (hexId: string): string | undefined => {
      return hexToUuid.get(hexId);
    },

    getMappings: (): Map<string, string> => {
      return new Map(uuidToHex);
    },
  };
}

/**
 * Sort entities by stable key for deterministic ordering.
 *
 * Sort order:
 * 1. order (ascending, for chapters)
 * 2. position.y (ascending)
 * 3. position.x (ascending)
 * 4. id (UUID, ascending, as final tie-breaker)
 *
 * @param entities Unsorted entities
 * @returns Sorted entities array
 */
function sortEntitiesDeterministically(entities: Entity[]): Entity[] {
  return [...entities].sort((a, b) => {
    // Compare by order (chapters)
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Compare by position.y
    const posYA = a.position?.y ?? 0;
    const posYB = b.position?.y ?? 0;
    if (posYA !== posYB) {
      return posYA - posYB;
    }

    // Compare by position.x
    const posXA = a.position?.x ?? 0;
    const posXB = b.position?.x ?? 0;
    if (posXA !== posXB) {
      return posXA - posXB;
    }

    // Final tie-breaker: UUID
    return a.id.localeCompare(b.id);
  });
}

/**
 * Generate a deterministic 8-character hex ID from a UUID.
 *
 * The ID is based on:
 * - The entity's UUID
 * - The sorted index position
 * - A seed value (optional)
 *
 * Uses SHA-256 hash to produce a 4-byte value, converted to 8 hex characters.
 *
 * @param uuid The entity's UUID
 * @param index The sorted position in the entity list
 * @param seed Optional seed for additional uniqueness
 * @returns 8-character uppercase hex string (e.g., "2B3C4D5E")
 */
function generateDeterministicHexId(uuid: string, index: number, seed?: string): string {
  // Combine UUID, index, and optional seed for hashing
  const data = `${uuid}|${index}|${seed ?? 'default'}`;

  // Create a hash using the first 4 bytes of SHA-256
  const hash = createHash('sha256').update(data).digest();
  const hashValue = hash.readUInt32BE(0);

  // Convert to 8-character uppercase hex
  const hexId = hashValue.toString(16).toUpperCase().padStart(8, '0').substring(0, 8);

  return hexId;
}

/**
 * Generate a deterministic hex ID with collision counter.
 *
 * When a collision is detected, this variant includes the collision counter
 * to produce a different hash.
 *
 * @param uuid The entity's UUID
 * @param index The sorted position in the entity list
 * @param counter The collision counter
 * @param seed Optional seed
 * @returns 8-character uppercase hex string
 */
function generateDeterministicHexIdWithCounter(
  uuid: string,
  index: number,
  counter: number,
  seed?: string
): string {
  const data = `${uuid}|${index}|${counter}|${seed ?? 'default'}`;
  const hash = createHash('sha256').update(data).digest();
  const hashValue = hash.readUInt32BE(0);
  const hexId = hashValue.toString(16).toUpperCase().padStart(8, '0').substring(0, 8);
  return hexId;
}
