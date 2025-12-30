# 70_code_style_and_repo_structure.md — Code Style & Repo Structure

These rules exist to keep the codebase consistent, reviewable, and friendly to long-lived maintenance.

---

## 1) TypeScript strictness

- Keep TypeScript `strict: true`.
- Avoid `any` except in narrowly scoped boundary adapters.
- Prefer explicit `unknown` + Zod parsing at boundaries.

### Boundary rule
- **Inbound:** request payloads, DB JSON, and file uploads must be treated as `unknown` until parsed.
- **Outbound:** API responses should have explicit types and stable shapes.

---

## 2) Folder conventions (suggested)

This repository is designed as a TypeScript monorepo.

```text
/apps
  web/                 # Next.js frontend + route handlers
/packages
  schema/              # Shared Zod schemas and types
  export/              # Export compiler and SNBT emitter
  ui/                  # Shared UI components (optional)
/docs
  overview.md
  reference/
  how-to/
  compiler/
/rules
  *.md
/testdata
  ftbq/
    1.21/
      golden_export_micro/
```

---

## 3) Naming conventions

- Files: `kebab-case.md`, `kebab-case.ts` (docs), `camelCase` for vars.
- Types: `PascalCase`.
- Zod schemas: `PascalCase` (e.g., `ProjectSnapshot`).
- Export targets: `SCREAMING_SNAKE_CASE` (e.g., `MC_1_21`).

---

## 4) Domain layer boundaries

Keep these domains separate:

1. **Snapshot domain** (`packages/schema`, internal JSON)
2. **Editor domain** (React Flow, forms)
3. **Export domain** (ExportModel, SNBT writing)
4. **Persistence domain** (Prisma/DB)

Rules:
- Editor code may *read* snapshot data but must not invent SNBT keys.
- Export code must not depend on React Flow.
- Persistence code must not embed UI state logic.

---

## 5) Formatting and linting

- Use a single formatter (Prettier).
- Enforce via CI.
- Prefer small functions and pure transforms in export code.

---

## 6) Error handling style

- Use typed error objects for validation and export failures.
- Do not throw raw strings.
- Prefer:

```ts
type Problem = {
  severity: 'error' | 'warning'
  code: string
  message: string
  entity?: { kind: 'quest' | 'chapter'; id: string }
}
```

Return lists of problems from validators/exporters.

---

## 7) Testing conventions

- Unit tests for:
  - snapshot semantic validation
  - ID mapping determinism
  - ExportModel transforms
  - SNBT writer normalization

- Integration tests for:
  - golden export comparisons

- Test files: `*.test.ts` adjacent to the module or in a `__tests__` folder.

---

## 8) Commit message guidance

Prefer conventional-ish commits:
- `feat(export): add lang emitter for 1.21`
- `fix(compiler): stabilize quest ordering for id mapping`
- `docs: add golden export onboarding`

When updating golden exports, include **why**.

