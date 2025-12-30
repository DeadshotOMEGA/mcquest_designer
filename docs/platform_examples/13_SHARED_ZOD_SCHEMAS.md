# Shared Zod Schema Package (FE/BE)

This is a reference implementation of a shared schema package, intended to live in a monorepo.

## Suggested Layout

```text
packages/
  schema/
    src/
      snapshot.ts
    package.json
    tsconfig.json
apps/
  web/
    ...nextjs
```

## Why a shared package?

- Single source of truth for validation and types
- Eliminates drift between frontend forms and backend persistence
- Enables import/export tooling and CLI utilities later

## Files included

- `packages/schema/src/snapshot.ts` – Zod schemas + inferred types

## Usage Examples

### In the backend

```ts
import { ProjectSnapshot } from '@yourorg/schema/snapshot'

const parsed = ProjectSnapshot.parse(req.body.snapshot)
```

### In the frontend

```ts
import { ProjectSnapshot } from '@yourorg/schema/snapshot'

// validate before autosave
ProjectSnapshot.parse(nextSnapshot)
```

## Extension Strategy

- Add new task/reward types as new discriminated union variants.
- Keep deprecated variants behind feature flags if you support old exports.
