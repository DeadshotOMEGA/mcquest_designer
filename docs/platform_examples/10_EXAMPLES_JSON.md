# Example Project Snapshots (Internal JSON)

These examples are **platform internal snapshots** (your canonical source of truth). They intentionally avoid SNBT specifics.

## Files
- `examples/snapshot_v1.json` – initial questbook layout
- `examples/snapshot_v2.json` – edited version (demonstrates versioning)

## Snapshot v1 (excerpt)
```json
{
  "metadata": {
    "projectName": "Example Pack: Beginner's Path",
    "targetMinecraftVersion": "1.20.1",
    "targetFTBQuestsVersion": "unknown",
    "createdAt": "2025-12-29T00:00:00Z",
    "updatedAt": "2025-12-29T00:00:00Z"
  },
  "chapters": [
    {
      "id": "c3083b28-e859-4315-a6a0-b2c91e1eaa56",
      "title": "Getting Started",
      "description": "A short onboarding chain: wood \u2192 crafting \u2192 stone.",
      "order": 0,
      "background": null,
      "defaultQuestShape": "SQUARE"
    },
    {
      "id": "1942a809-070b-45be-a37e-49b21b833858",
      "title": "Mining & Smelting",
      "description": "Basic mining progression and first furnace smelt.",
      "order": 1,
      "background": null,
      "defaultQuestShape": "SQUARE"
    }
  ]
}
```

## Snapshot v2 (what changed)
- `Stone Age` moved from `x=12` → `x=14`
- `Stone Age` marked `optional: true`
- `Welcome!` gained an additional XP reward

Open the JSON files for the full payloads.
